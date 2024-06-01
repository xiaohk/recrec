import { LitElement, css, unsafeCSS, html, PropertyValues } from 'lit';
import { customElement, property, state, query } from 'lit/decorators.js';
import { unsafeHTML } from 'lit/directives/unsafe-html.js';
import { getPaperCitations } from '../../api/semantic-scholar';
import { setsAreEqual } from '@xiaohk/utils';

import {
  Step,
  SemanticAuthorDetail,
  SemanticPaper,
  SemanticPaperCitationDetail,
  SemanticCitationAuthor
} from '../../types/common-types';

import componentCSS from './recommender-view.css?inline';

interface Recommender {
  authorID: string;
  name: string;
  affiliation?: string;
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
  authorIDMap = new Map<string, string>();

  @state()
  recommenders: Recommender[] = [];

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
          if (!this.authorIDMap.has(author.authorId)) {
            this.authorIDMap.set(author.authorId, author.name);
          }
        }
      }
    }

    this.citationAuthorCount = citationAuthorCount;

    // Update the view
    this.updateCitationView();
  }

  updateCitationView() {
    // Filter authors citing at least 2 times and sort them based on count
    const citationCounts = [...this.citationAuthorCount.entries()]
      .filter(d => d[1] > 1 && d[0] != null)
      .sort((a, b) => b[1] - a[1]);

    // Get the top authors
    const recommenders: Recommender[] = [];

    for (const [author, _] of citationCounts.slice(0, 100)) {
      const recommender: Recommender = {
        authorID: author,
        name: this.authorIDMap.get(author)!
      };
      recommenders.push(recommender);
    }
    this.recommenders = recommenders;
    console.log(citationCounts);
  }

  //==========================================================================||
  //                              Event Handlers                              ||
  //==========================================================================||

  //==========================================================================||
  //                             Private Helpers                              ||
  //==========================================================================||

  //==========================================================================||
  //                           Templates and Styles                           ||
  //==========================================================================||
  render() {
    // Compile the recommenders
    let recommenderView = html``;

    for (const recommender of this.recommenders) {
      recommenderView = html`${recommenderView}
        <div class="recommender-card">${recommender.name}</div> `;
    }

    return html` <div class="recommender-view">${recommenderView}</div> `;
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
