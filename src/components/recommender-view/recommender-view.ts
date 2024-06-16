import { LitElement, css, unsafeCSS, html, PropertyValues } from 'lit';
import { customElement, property, state, query } from 'lit/decorators.js';
import { unsafeHTML } from 'lit/directives/unsafe-html.js';
import {
  getPaperCitations,
  searchAuthorDetails
} from '../../api/semantic-scholar';
import { setsAreEqual, chunk } from '@xiaohk/utils';
import { config } from '../../config/config';
import {
  Step,
  SemanticAuthorDetail,
  SemanticPaper,
  SemanticPaperCitationDetail,
  SemanticCitationAuthor
} from '../../types/common-types';

import '@shoelace-style/shoelace/dist/components/progress-ring/progress-ring';
import '@shoelace-style/shoelace/dist/components/select/select';
import '@shoelace-style/shoelace/dist/components/option/option';
import '../slider/slider';

import '@shoelace-style/shoelace/dist/themes/light.css';
import componentCSS from './recommender-view.css?inline';
import iconHIndex from '../../images/icon-hindex-c.svg?raw';
import iconCiteTimes from '../../images/icon-cite-times-c.svg?raw';

const DEV_MODE = true;
const MAX_RECOMMENDER_NUM = 500;
const SLIDER_STYLE = {
  foregroundColor: config.colors['blue-700'],
  backgroundColor: config.colors['blue-100'],
  alignInner: false
};

interface Recommender {
  authorID: string;
  name: string;
  isCollaborator?: boolean;
  affiliation?: string;
  hIndex?: number;
  citeTimes?: number;
  url?: string;
}

interface SliderRange {
  min: number;
  max: number;
  curValue: number;
  initialValue: number;
}

/**
 * Recommender view element.
 */
@customElement('recrec-recommender-view')
export class RecRecRecommenderView extends LitElement {
  //==========================================================================||
  //                              Class Properties                            ||
  //==========================================================================||
  @property({ attribute: false })
  curStep: Step = Step.Author;

  @property({ attribute: false })
  selectedProfile: SemanticAuthorDetail | null = null;

  @property({ attribute: false })
  papers: SemanticPaper[] = [];

  @property({ attribute: false })
  selectedPaperIDs = new Set<string>();

  lastSelectedPaperIDs = new Set<string>();

  citationAuthorCount = new Map<string, number>();
  allAuthors = new Map<string, Recommender>();

  allRecommenders: Recommender[] = [];

  @state()
  shownRecommenders: Recommender[] = [];

  @state()
  curRecommendersSize = 0;

  // Progress bar
  @state()
  totalStep = 1;

  @state()
  completedStep = 0;

  // Slider ranges
  @state()
  citationTimeRange: SliderRange = {
    min: 1,
    max: 2,
    curValue: 1,
    initialValue: 1
  };

  @state()
  hIndexRange: SliderRange = {
    min: 1,
    max: 2,
    curValue: 1,
    initialValue: 1
  };

  // Sorting and filter
  @state()
  sortBy: 'citeTimes' | 'hIndex' = 'citeTimes';

  curShownCardSizeMultiplier = 1;

  //==========================================================================||
  //                             Lifecycle Methods                            ||
  //==========================================================================||
  constructor() {
    super();
  }

  /**
   * This method is called when the DOM is added for the first time
   */
  firstUpdated() {}

  /**
   * This method is called before new DOM is updated and rendered
   * @param changedProperties Property that has been changed
   */
  willUpdate(changedProperties: PropertyValues<this>) {
    if (changedProperties.has('curStep') && this.curStep === Step.Recommender) {
      this.updateCitations().then(
        () => {},
        () => {}
      );
    }

    // TODO: Remove this after developing this component
    if (changedProperties.has('selectedPaperIDs')) {
      this.updateCitations().then(
        () => {},
        () => {}
      );
    }
  }

  //==========================================================================||
  //                              Custom Methods                              ||
  //==========================================================================||
  async initData() {}

  async updateCitations() {
    console.log('called');

    // Skip updating if the selected papers have not changed
    if (setsAreEqual(this.selectedPaperIDs, this.lastSelectedPaperIDs)) {
      return;
    }

    console.time('Query citations');
    const paperCitations = await getPaperCitations([...this.selectedPaperIDs]);
    console.timeEnd('Query citations');

    // Count the authors in the citations
    const citationAuthorCount = new Map<string, number>();

    for (const paper of paperCitations) {
      for (const citation of paper.citations) {
        for (const author of citation.authors) {
          // Update count
          if (citationAuthorCount.has(author.authorId)) {
            const oldCount = citationAuthorCount.get(author.authorId)!;
            citationAuthorCount.set(author.authorId, oldCount + 1);
          } else {
            citationAuthorCount.set(author.authorId, 1);
          }

          // Update ID map
          if (!this.allAuthors.has(author.authorId)) {
            this.allAuthors.set(author.authorId, {
              authorID: author.authorId,
              name: author.name
            });
          }
        }
      }
    }

    this.citationAuthorCount = citationAuthorCount;

    // Find the min/max of the times an author cited my work
    let minCitationTimes = Infinity;
    let maxCitationTimes = -Infinity;

    for (const [authorID, citeTimes] of citationAuthorCount.entries()) {
      minCitationTimes = Math.min(minCitationTimes, citeTimes);
      maxCitationTimes = Math.max(maxCitationTimes, citeTimes);

      // Copy the citation times info to `allAuthors`
      const authorInfo = this.allAuthors.get(authorID);
      if (authorInfo === undefined) {
        throw Error(`Can't find author info for ${authorID}`);
      }

      authorInfo.citeTimes = citeTimes;
      this.allAuthors.set(authorID, authorInfo);
    }

    // Determine the min and max of citations for the sliders
    const allAuthorIDs = [...this.allAuthors.keys()];
    const authorIDChunks = chunk(allAuthorIDs, 1000);

    // Update the progress ring info
    this.totalStep = authorIDChunks.length + 1;
    this.completedStep = 1;

    // Semantic scholar only supports up to 1000 authors in one batch, we use
    // chunks to query information of all authors
    const field = 'hIndex,affiliations';
    console.time('Fetching authors');

    // Track the min/max of total citation count of authors and paper count
    let minHIndex = Infinity;
    let maxHIndex = -Infinity;

    for (const [i, chunk] of authorIDChunks.entries()) {
      console.log(`Chunk: ${i}`);

      const curResult = await searchAuthorDetails(chunk, field);

      // Update the paper count and citation count for the authors in this batch
      for (const author of curResult) {
        if (author === null) {
          continue;
        }

        if (!this.allAuthors.has(author.authorId)) {
          throw new Error(
            `Can't find author ${author.authorId}, ${author.name}`
          );
        }

        const curAuthor = this.allAuthors.get(author.authorId)!;

        curAuthor.hIndex = author.hIndex || 0;
        curAuthor.url = `https://www.semanticscholar.org/author/${author.authorId}`;
        curAuthor.affiliation = author.affiliations?.join(', ');

        this.allAuthors.set(curAuthor.authorID, curAuthor);

        // Update the min/max of total citation count of authors and paper count
        minHIndex = Math.min(minHIndex, curAuthor.hIndex!);
        maxHIndex = Math.max(maxHIndex, curAuthor.hIndex!);
      }

      // Short delay between consecutive API calls
      await new Promise<void>(resolve => {
        setTimeout(resolve, DEV_MODE ? 0 : 1000);
      });

      // Update progress ring
      this.completedStep += 1;

      // this.completedStep = this.totalStep;
      // break;
    }
    console.log(minHIndex, maxHIndex, minCitationTimes, maxCitationTimes);

    console.timeEnd('Fetching authors');

    // Trigger a state update for the slider's ranges
    this.hIndexRange.min = minHIndex;
    this.hIndexRange.max = maxHIndex;

    this.citationTimeRange.min = minCitationTimes;
    this.citationTimeRange.max = maxCitationTimes;

    // Update the view
    this.initCitationView();
    this.updateCitationView();
  }

  initCitationView() {
    // Initialize all recommenders
    this.allRecommenders = [];
    this.curShownCardSizeMultiplier = 1;

    for (const [author, _] of this.citationAuthorCount.entries()) {
      const authorInfo = this.allAuthors.get(author);
      if (authorInfo === undefined) {
        console.error(`Fail to get info for author: ${author}`);
        continue;
      }

      if (authorInfo.citeTimes === undefined) {
        console.warn(
          `Author ${authorInfo.name} ${authorInfo.authorID} is incomplete.`
        );
        continue;
      }

      const recommender: Recommender = {
        authorID: author,
        name: authorInfo.name,
        hIndex: authorInfo.hIndex || 0,
        citeTimes: authorInfo.citeTimes,
        url: authorInfo.url,
        affiliation: authorInfo.affiliation
      };
      this.allRecommenders.push(recommender);
    }
  }

  /**
   * Apply the latest filter and sorting to the recommenders
   */
  updateCitationView() {
    const recommenders: Recommender[] = [];

    // Apply filters
    for (const recommender of this.allRecommenders) {
      if (recommender.citeTimes === undefined) {
        console.error(`Author ${recommender.authorID}'s info is incomplete.`);
      }

      if (
        recommender.hIndex! >= this.hIndexRange.curValue &&
        recommender.citeTimes! >= this.citationTimeRange.curValue
      ) {
        recommenders.push(recommender);
      }
    }

    // Apply sorting
    if (this.sortBy === 'citeTimes') {
      recommenders.sort((a, b) => b.citeTimes! - a.citeTimes!);
    } else if (this.sortBy === 'hIndex') {
      recommenders.sort((a, b) => b.hIndex! - a.hIndex!);
    }

    this.curRecommendersSize = recommenders.length;
    this.shownRecommenders = recommenders.slice(
      0,
      MAX_RECOMMENDER_NUM * this.curShownCardSizeMultiplier
    );

    console.log('Cur-recommenders updated');
  }

  //==========================================================================||
  //                              Event Handlers                              ||
  //==========================================================================||
  hIndexSliderChanged(e: CustomEvent<number>) {
    const count = Math.round(e.detail);
    const newHIndexRange = { ...this.hIndexRange };
    newHIndexRange.curValue = count;
    this.hIndexRange = newHIndexRange;
  }

  citeMeSliderChanged(e: CustomEvent<number>) {
    const count = Math.round(e.detail);
    const newCitationTimeRange = { ...this.citationTimeRange };
    newCitationTimeRange.curValue = count;
    this.citationTimeRange = newCitationTimeRange;
  }

  selectChanged(e: InputEvent) {
    const curValue = (e.currentTarget as HTMLSelectElement).value;
    if (curValue === 'hIndex') {
      this.sortBy = curValue;
    } else {
      this.sortBy = 'citeTimes';
    }
  }

  async showMoreButtonClicked() {
    if (this.shadowRoot === null) {
      throw Error('shadowRoot is null');
    }

    // Need to manually track the scroll position and set it after updating the list
    const contentList = this.shadowRoot.querySelector(
      '.right-content'
    ) as HTMLElement;
    const scrollTop = contentList.scrollTop;

    // Update the list
    this.curShownCardSizeMultiplier += 1;
    this.updateCitationView();

    await this.updateComplete;
    contentList.scrollTop = scrollTop;
  }

  //==========================================================================||
  //                             Private Helpers                              ||
  //==========================================================================||

  //==========================================================================||
  //                           Templates and Styles                           ||
  //==========================================================================||
  render() {
    // Compile the recommenders
    let recommenderCards = html``;

    for (const recommender of this.shownRecommenders) {
      recommenderCards = html`${recommenderCards}
        <div class="recommender-card">
          <a class="header" href="${recommender.url!}" target="_blank"
            >${recommender.name}</a
          >

          <div
            class="info-bar info-label"
            title=${recommender.affiliation || ''}
            ?no-show=${recommender.affiliation === undefined ||
            recommender.affiliation === ''}
          >
            ${recommender.affiliation}
          </div>

          <div class="info-bar icons">
            <div class="info-block cite-time info-icon">
              <span class="svg-icon">${unsafeHTML(iconCiteTimes)}</span>
              ${recommender.citeTimes}
            </div>

            <a
              class="info-block info-icon"
              href="${recommender.url!}"
              target="_blank"
            >
              <span class="svg-icon">${unsafeHTML(iconHIndex)}</span>
              ${recommender.hIndex}
            </a>
          </div>
        </div> `;
    }

    // Compile the progress overlay
    const progressRing = html`
      <div
        class="progress-overlay"
        ?is-completed=${this.completedStep === this.totalStep}
      >
        <sl-progress-ring
          value=${(this.completedStep / this.totalStep) * 100}
        ></sl-progress-ring>
        <span class="progress-message">Fetching author details...</span>
      </div>
    `;

    return html`
      <div class="recommender-view">
        ${progressRing}

        <div class="control-bar">
          <div class="control-section">
            <div class="control-block title-block">
              <span class="title"
                >${this.curRecommendersSize} Recommenders</span
              >
            </div>

            <div class="control-block select-block">
              <span>Sorted by</span>

              <div class="select-wrapper">
                <select
                  class="select-sort"
                  @change=${(e: InputEvent) => {
                    this.selectChanged(e);
                  }}
                >
                  <option value="citeTimes">Citing my works</option>
                  <option value="hIndex">H-Index</option>
                </select>
              </div>
            </div>
          </div>

          <div class="separator"></div>

          <div class="control-section control-section-slider">
            <div class="control-block slider-block">
              <div class="citation-slider-label">
                Cited my works ≥ ${this.citationTimeRange.curValue} times
              </div>
              <nightjar-slider
                @valueChanged=${(e: CustomEvent<number>) =>
                  this.citeMeSliderChanged(e)}
                min=${this.citationTimeRange.min}
                max=${this.citationTimeRange.max}
                curValue=${this.citationTimeRange.initialValue}
                .styleConfig=${SLIDER_STYLE}
              ></nightjar-slider>
            </div>

            <div class="control-block slider-block">
              <div class="citation-slider-label">
                H-Index ≥ ${this.hIndexRange.curValue}
              </div>
              <nightjar-slider
                @valueChanged=${(e: CustomEvent<number>) =>
                  this.hIndexSliderChanged(e)}
                min=${this.hIndexRange.min}
                max=${this.hIndexRange.max}
                curValue=${this.hIndexRange.initialValue}
                .styleConfig=${SLIDER_STYLE}
              ></nightjar-slider>
            </div>
          </div>

          <div class="separator"></div>

          <div class="control-section ">
            <div class="control-block checkbox-block">
              <div class="checkbox-wrapper">
                <input type="checkbox" id="checkbox-collaboration" />
                <label for="checkbox-collaboration"
                  >Exclude collaborators</label
                >
              </div>
            </div>

            <div class="control-block checkbox-block">
              <div class="checkbox-wrapper">
                <input type="checkbox" id="checkbox-affiliation" />
                <label for="checkbox-affiliation">Have affiliation</label>
              </div>
            </div>

            <div class="control-block checkbox-block">
              <div class="checkbox-wrapper">
                <input type="checkbox" id="checkbox-award" />
                <label for="checkbox-award">Have awards</label>
              </div>
            </div>
          </div>
        </div>

        <div class="right-content">
          <div class="recommender-content">${recommenderCards}</div>

          <div class="footer">
            <button
              ?no-show=${this.curRecommendersSize <=
              this.shownRecommenders.length}
              @click=${() => {
                this.showMoreButtonClicked().then(
                  () => {},
                  () => {}
                );
              }}
            >
              Show More
            </button>
          </div>
        </div>
      </div>
    `;
  }

  static styles = [
    css`
      ${unsafeCSS(componentCSS)}
    `
  ];
}

declare global {
  interface HTMLElementTagNameMap {
    'recrec-recommender-view': RecRecRecommenderView;
  }
}
