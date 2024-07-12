import { LitElement, css, unsafeCSS, html, PropertyValues } from 'lit';
import { customElement, property, state, query } from 'lit/decorators.js';
import { unsafeHTML } from 'lit/directives/unsafe-html.js';
import {
  getPaperCitations,
  searchAuthorDetails
} from '../../api/semantic-scholar';
import { setsAreEqual, chunk } from '@xiaohk/utils';
import {
  computePosition,
  autoUpdate,
  offset,
  flip,
  shift,
  arrow,
  hide,
  size
} from '@floating-ui/dom';
import { format } from 'd3-format';
import { config } from '../../config/config';
import {
  AcademicAward,
  Step,
  SemanticAuthorDetail,
  SemanticPaper,
  SemanticPaperCitationDetail,
  SemanticCitationAuthor
} from '../../types/common-types';
import type { NightjarSlider } from '../slider/slider';

import '@shoelace-style/shoelace/dist/components/progress-ring/progress-ring';
import '@shoelace-style/shoelace/dist/components/select/select';
import '@shoelace-style/shoelace/dist/components/option/option';
import '../slider/slider';

import '@shoelace-style/shoelace/dist/themes/light.css';
import componentCSS from './recommender-view.css?inline';
import iconHIndex from '../../images/icon-hindex-c.svg?raw';
import iconFile from '../../images/icon-file-c.svg?raw';
import iconCiteTimes from '../../images/icon-cite-times-c.svg?raw';
import iconExternal from '../../images/icon-external-link.svg?raw';
import iconClick from '../../images/icon-click.svg?raw';

const DEV_MODE = true;
const MAX_RECOMMENDER_NUM = 500;
const DEFAULT_REMAIN_TIME = 30000;
const MOBILE_MODE = window.screen.width < 768;
const SLIDER_STYLE = {
  foregroundColor: config.colors['blue-700'],
  backgroundColor: config.colors['blue-100'],
  thumbColor: config.colors['blue-700'],
  alignInner: false
};

const AWARD_NAME_MAP: Record<AcademicAward, string> = {
  [AcademicAward.AAAI_FELLOW]: 'AAAI Fellow',
  [AcademicAward.AAAS_FELLOW]: 'AAAS Fellow',
  [AcademicAward.ACM_DISSERTATION]: 'ACM Dissertation Award',
  [AcademicAward.ACM_DISTINGUISHED]: 'ACM Distinguished Member',
  [AcademicAward.ACM_FELLOW]: 'ACM Fellow',
  [AcademicAward.ACM_GORDON]: 'ACM Gordon Bell Prize',
  [AcademicAward.ACM_GRACE]: 'ACM Grace Hopper Award',
  [AcademicAward.ACM_SENIOR_MEMBER]: 'ACM Senior Member',
  [AcademicAward.ACM_TURING]: 'ACM Turing Award',
  [AcademicAward.AMACAD_MEMBER]: 'AAA&S Member',
  [AcademicAward.IEEE_FELLOW]: 'IEEE Fellow',
  [AcademicAward.NAS_MEMBER]: 'NAS Member'
};

interface Recommender {
  authorID: string;
  name: string;
  isCollaborator?: boolean;
  affiliation?: string;
  hIndex?: number;
  citeTimes?: number;
  paperCount?: number;
  url?: string;
  awards: string[];
}

interface SliderRange {
  min: number;
  max: number;
  curValue: number;
  initialValue: number;
}

let descriptionTooltipTimer: number | null = null;

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
  showPopMenu = false;

  @property({ attribute: false })
  selectedProfile: SemanticAuthorDetail | null = null;

  @property({ attribute: false })
  papers: SemanticPaper[] = [];

  @property({ attribute: false })
  selectedPaperIDs = new Set<string>();
  checkedSelectedPaperIDs = new Set<string>();

  allAuthors: Map<string, Recommender>;

  paperCitingAuthorCountMap: Map<string, Map<string, number>>;
  paperCitingAuthorCountSumMap: Map<string, number>;

  authorPaperCiteTimesMap: Map<string, Map<string, number>>;
  authorPaperCiteTimesSumMap: Map<string, number>;

  myCollaborators: Set<string>;

  allRecommenders: Recommender[];

  @state()
  shownRecommenders: Recommender[];

  @state()
  curRecommendersSize = 0;

  // Progress bar
  @state()
  totalStep = 1;

  @state()
  completedStep = 0;

  @state()
  remainTimeMS = DEFAULT_REMAIN_TIME;

  // Slider ranges
  @state()
  paperCountRange: SliderRange = {
    min: 1,
    max: 2,
    curValue: 1,
    initialValue: 1
  };

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
  sortBy: 'citeTimes' | 'hIndex' | 'paperCount' = 'paperCount';

  curShownCardSizeMultiplier = 1;

  @state()
  filterToggles = {
    excludeCollaborator: false,
    haveAward: false,
    haveAffiliation: false
  };

  // Floating UIs
  @query('#popper-tooltip')
  popperTooltip: HTMLElement | undefined;

  @query('#paper-overlay')
  paperOverlayElement: HTMLElement | undefined;

  @query('#description-overlay')
  descriptionOverlayElement: HTMLElement | undefined;

  @state()
  overlayPaperCounts: [string, number][];

  @state()
  overlayPaperCountsType: 'citeTimes' | 'paperCount' = 'citeTimes';

  @state()
  overlayDescriptionType: 'citeTimes' | 'paperCount' | 'hIndex' = 'citeTimes';

  curClickedCiteTimeAuthorID: string | null = null;
  overlayCleanup = () => {};

  numberFormatter = format(',');

  // Awards
  awardMap: Promise<Map<string, AcademicAward[]>>;

  //==========================================================================||
  //                             Lifecycle Methods                            ||
  //==========================================================================||
  constructor() {
    super();

    this.allAuthors = new Map<string, Recommender>();

    this.paperCitingAuthorCountMap = new Map<string, Map<string, number>>();
    this.paperCitingAuthorCountSumMap = new Map<string, number>();

    this.authorPaperCiteTimesMap = new Map<string, Map<string, number>>();
    this.authorPaperCiteTimesSumMap = new Map<string, number>();

    this.myCollaborators = new Set<string>();

    this.allRecommenders = [];
    this.shownRecommenders = [];

    this.overlayPaperCounts = [];

    this.awardMap = this.initData();
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
    if (
      changedProperties.has('curStep') &&
      this.curStep === Step.Recommender &&
      !setsAreEqual(this.selectedPaperIDs, this.checkedSelectedPaperIDs)
    ) {
      // Reset mappings
      this.allAuthors = new Map<string, Recommender>();
      this.paperCitingAuthorCountSumMap = new Map<string, number>();
      this.paperCitingAuthorCountMap = new Map<string, Map<string, number>>();
      this.authorPaperCiteTimesMap = new Map<string, Map<string, number>>();
      this.authorPaperCiteTimesSumMap = new Map<string, number>();
      this.myCollaborators = new Set<string>();

      this.updateCitations().then(
        () => {},
        () => {}
      );
    }

    if (
      changedProperties.has('selectedProfile') ||
      changedProperties.has('selectedPaperIDs')
    ) {
      this.completedStep = 0;
      this.totalStep = 1;
      this.remainTimeMS = DEFAULT_REMAIN_TIME;

      // Reset the sliders and checkboxes
      this.paperCountRange = {
        min: 1,
        max: 2,
        curValue: 1,
        initialValue: 1
      };

      this.citationTimeRange = {
        min: 1,
        max: 2,
        curValue: 1,
        initialValue: 1
      };

      this.hIndexRange = {
        min: 1,
        max: 2,
        curValue: 1,
        initialValue: 1
      };

      this.filterToggles = {
        excludeCollaborator: false,
        haveAward: false,
        haveAffiliation: false
      };

      if (this.shadowRoot) {
        const collaboratorCheckbox = this.shadowRoot.querySelector(
          '#checkbox-collaboration'
        ) as HTMLInputElement | null;

        const awardCheckbox = this.shadowRoot.querySelector(
          '#checkbox-award'
        ) as HTMLInputElement | null;

        const affiliationCheckbox = this.shadowRoot.querySelector(
          '#checkbox-affiliation'
        ) as HTMLInputElement | null;

        if (collaboratorCheckbox) {
          collaboratorCheckbox.checked = this.filterToggles.excludeCollaborator;
        }

        if (awardCheckbox) {
          awardCheckbox.checked = this.filterToggles.haveAward;
        }

        if (affiliationCheckbox) {
          affiliationCheckbox.checked = this.filterToggles.haveAffiliation;
        }
      }
    }
  }

  //==========================================================================||
  //                              Custom Methods                              ||
  //==========================================================================||
  async initData() {
    const response = await fetch(
      `${import.meta.env.BASE_URL}data/award-recipients.json`
    );
    const awardData = (await response.json()) as Record<
      string,
      AcademicAward[]
    >;

    // Convert the award data into a map
    const awardMap = new Map<string, AcademicAward[]>();

    for (const name of Object.keys(awardData)) {
      const awards = awardData[name];
      awardMap.set(name, awards);
    }

    return awardMap;
  }

  async updateCitations(retry = 3) {
    let paperCitations: SemanticPaperCitationDetail[] = [];

    try {
      console.time('Query citations');
      paperCitations = await getPaperCitations([...this.selectedPaperIDs]);
      console.timeEnd('Query citations');
    } catch (e) {
      await new Promise<void>(resolve =>
        setTimeout(() => {
          resolve();
        }, 1000)
      );
      await this.updateCitations(retry - 1);
      return;
    }

    // Find and store collaborators
    for (const paper of this.papers) {
      for (const author of paper.authors) {
        this.myCollaborators.add(author.authorId);
      }
    }

    // Count the number of times an author has cited my work
    const paperCitingAuthorCountSumMap = new Map<string, number>();

    // Map author id => Map <paper (author's paper), number of times that paper cites my work>
    const authorPaperCiteTimesMap = new Map<string, Map<string, number>>();
    const paperCiteTimesMap = new Map<string, number>();
    const authorPaperMap = new Map<string, Set<string>>();
    const paperIDMap = new Map<string, string>();

    // Map paper id (my paper) => Map <citing author, cite count to that paper>
    const paperCitationAuthorMap = new Map<string, Map<string, number>>();
    const authorPaperCiteTimesSumMap = new Map<string, number>();

    const awardMap = await this.awardMap;

    for (const paper of paperCitations) {
      const curCitingAuthorCiteTimes = new Map<string, number>();

      for (const citation of paper.citations) {
        //  Update the times a paper has cited me
        if (paperCiteTimesMap.has(citation.paperId)) {
          paperCiteTimesMap.set(
            citation.paperId,
            paperCiteTimesMap.get(citation.paperId)! + 1
          );
        } else {
          paperCiteTimesMap.set(citation.paperId, 1);
        }

        // Update the paper ID => title map
        if (!paperIDMap.has(citation.paperId)) {
          paperIDMap.set(citation.paperId, citation.title);
        }

        for (const author of citation.authors) {
          if (author.authorId === null) {
            continue;
          }

          // Update the times an author has cited me
          if (curCitingAuthorCiteTimes.has(author.authorId)) {
            const oldTimes = curCitingAuthorCiteTimes.get(author.authorId)!;
            curCitingAuthorCiteTimes.set(author.authorId, oldTimes + 1);
          } else {
            curCitingAuthorCiteTimes.set(author.authorId, 1);
          }

          // Track the author's paper
          if (authorPaperMap.has(author.authorId)) {
            authorPaperMap.get(author.authorId)!.add(citation.paperId);
          } else {
            authorPaperMap.set(author.authorId, new Set([citation.paperId]));
          }

          // Update count
          if (paperCitingAuthorCountSumMap.has(author.authorId)) {
            const oldCount = paperCitingAuthorCountSumMap.get(author.authorId)!;
            paperCitingAuthorCountSumMap.set(author.authorId, oldCount + 1);
          } else {
            paperCitingAuthorCountSumMap.set(author.authorId, 1);
          }

          // Check if the author has any awards
          const awards = [];
          if (awardMap.has(author.name)) {
            const awardNames = awardMap.get(author.name)!;
            for (const name of awardNames) {
              awards.push(AWARD_NAME_MAP[name]);
            }
          }
          awards.sort((a, b) => a.localeCompare(b));

          // Update ID map
          if (!this.allAuthors.has(author.authorId)) {
            this.allAuthors.set(author.authorId, {
              authorID: author.authorId,
              name: author.name,
              awards: awards
            });
          }
        }
      }

      paperCitationAuthorMap.set(paper.paperId, curCitingAuthorCiteTimes);
    }

    // Resolve the author => <author's paper title, citing times> map
    for (const author of authorPaperMap.keys()) {
      const papers = authorPaperMap.get(author)!;
      const curPaperCiteTimesMap = new Map<string, number>();
      for (const paper of papers) {
        const paperTitle = paperIDMap.get(paper)!;
        curPaperCiteTimesMap.set(paperTitle, paperCiteTimesMap.get(paper)!);
      }
      authorPaperCiteTimesMap.set(author, curPaperCiteTimesMap);

      // Also count the papers that the author has that cite my work
      authorPaperCiteTimesSumMap.set(author, papers.size);
    }

    this.paperCitingAuthorCountMap = paperCitationAuthorMap;
    this.paperCitingAuthorCountSumMap = paperCitingAuthorCountSumMap;

    this.authorPaperCiteTimesMap = authorPaperCiteTimesMap;
    this.authorPaperCiteTimesSumMap = authorPaperCiteTimesSumMap;

    // Find the min/max of the times an author cited my work
    let minCitationTimes = Infinity;
    let maxCitationTimes = -Infinity;

    for (const [
      authorID,
      citeTimes
    ] of paperCitingAuthorCountSumMap.entries()) {
      minCitationTimes = Math.min(minCitationTimes, citeTimes);
      maxCitationTimes = Math.max(maxCitationTimes, citeTimes);

      // Copy the citation times info to `allAuthors`
      const authorInfo = this.allAuthors.get(authorID);
      if (authorInfo === undefined) {
        console.error(`Can't find author info for ${authorID}`);
        throw Error(`Can't find author info for ${authorID}`);
      }

      authorInfo.citeTimes = citeTimes;
      this.allAuthors.set(authorID, authorInfo);
    }

    // Find the min/max of the papers an author has that cite my work
    let minPaperCount = Infinity;
    let maxPaperCount = -Infinity;

    for (const [authorID, paperCount] of authorPaperCiteTimesSumMap.entries()) {
      minPaperCount = Math.min(minPaperCount, paperCount);
      maxPaperCount = Math.max(maxPaperCount, paperCount);

      // Copy the paper count info to `allAuthors`
      const authorInfo = this.allAuthors.get(authorID);
      if (authorInfo === undefined) {
        console.error(`Can't find author info for ${authorID}`);
        throw Error(`Can't find author info for ${authorID}`);
      }

      authorInfo.paperCount = paperCount;
      this.allAuthors.set(authorID, authorInfo);
    }

    // Determine the min and max of citations for the sliders
    const allAuthorIDs = [...this.allAuthors.keys()];
    const authorIDChunks = chunk(allAuthorIDs, 1000);

    // Update the progress ring info
    this.totalStep = authorIDChunks.length + 1;
    this.completedStep = 1;
    // 3000ms is the approximated time to finish one request
    this.remainTimeMS = 3000 * this.totalStep;

    // Semantic scholar only supports up to 1000 authors in one batch, we use
    // chunks to query information of all authors
    const field = 'hIndex,affiliations';
    console.time('Fetching authors');

    // Track the min/max of total citation count of authors and paper count
    let minHIndex = Infinity;
    let maxHIndex = -Infinity;

    for (const [i, chunk] of authorIDChunks.entries()) {
      // console.log(`Chunk: ${i}`);
      const startTime = performance.now();

      let retry = 3;
      let done = false;
      let curResult: SemanticAuthorDetail[] = [];

      while (!done && retry > 0) {
        try {
          curResult = await searchAuthorDetails(chunk, field);
          done = true;
        } catch (e) {
          console.error('searchAuthorDetails', e);
          retry -= 1;
        }
      }

      // Update the paper count and citation count for the authors in this batch
      for (const author of curResult) {
        if (author === null) {
          continue;
        }

        if (!this.allAuthors.has(author.authorId)) {
          console.error(`Can't find author ${author.authorId}, ${author.name}`);
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
        setTimeout(resolve, DEV_MODE ? 0 : 500);
      });

      const endTime = performance.now();

      // Update progress ring
      this.completedStep += 1;
      this.remainTimeMS =
        (endTime - startTime) * (this.totalStep - this.completedStep);
    }

    console.timeEnd('Fetching authors');

    // Trigger a state update for the slider's ranges
    this.hIndexRange.min = minHIndex;
    this.hIndexRange.max = maxHIndex;

    this.citationTimeRange.min = minCitationTimes;
    this.citationTimeRange.max = maxCitationTimes;

    this.paperCountRange.min = minPaperCount;
    this.paperCountRange.max = maxPaperCount;

    this.checkedSelectedPaperIDs = structuredClone(this.selectedPaperIDs);

    // Update the view
    this.initCitationView();
    this.updateCitationView();
  }

  initCitationView() {
    // Initialize all recommenders
    this.allRecommenders = [];
    this.curShownCardSizeMultiplier = 1;

    for (const [author, _] of this.paperCitingAuthorCountSumMap.entries()) {
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
        paperCount: authorInfo.paperCount,
        url: authorInfo.url,
        affiliation: authorInfo.affiliation,
        awards: authorInfo.awards
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

      // Slider filters
      const paperCountOK =
        recommender.paperCount! >= this.paperCountRange.curValue;
      const hIndexOK = recommender.hIndex! >= this.hIndexRange.curValue;
      const citeTimesOK =
        recommender.citeTimes! >= this.citationTimeRange.curValue;

      // Checkbox filters
      const excludeCollaboratorOK =
        !this.filterToggles.excludeCollaborator ||
        !this.myCollaborators.has(recommender.authorID);

      const haveAwardOK =
        !this.filterToggles.haveAward || recommender.awards.length > 0;

      const haveAffiliationOK =
        !this.filterToggles.haveAffiliation ||
        (recommender.affiliation !== '' &&
          recommender.affiliation !== undefined);

      if (
        paperCountOK &&
        hIndexOK &&
        citeTimesOK &&
        excludeCollaboratorOK &&
        haveAwardOK &&
        haveAffiliationOK
      ) {
        recommenders.push(recommender);
      }
    }

    // Apply sorting
    if (this.sortBy === 'citeTimes') {
      recommenders.sort((a, b) => b.citeTimes! - a.citeTimes!);
    } else if (this.sortBy === 'hIndex') {
      recommenders.sort((a, b) => b.hIndex! - a.hIndex!);
    } else if (this.sortBy === 'paperCount') {
      recommenders.sort((a, b) => b.paperCount! - a.paperCount!);
    }

    this.curRecommendersSize = recommenders.length;
    this.shownRecommenders = recommenders.slice(
      0,
      MAX_RECOMMENDER_NUM * this.curShownCardSizeMultiplier
    );
  }

  //==========================================================================||
  //                              Event Handlers                              ||
  //==========================================================================||
  hIndexSliderChanged(e: CustomEvent<number>) {
    const count = Math.round(e.detail);
    const newHIndexRange = { ...this.hIndexRange };
    newHIndexRange.curValue = count;
    this.hIndexRange = newHIndexRange;

    // Trigger a new recommender view update
    this.updateCitationView();
  }

  citeMeSliderChanged(e: CustomEvent<number>) {
    const count = Math.round(e.detail);
    const newCitationTimeRange = { ...this.citationTimeRange };
    newCitationTimeRange.curValue = count;
    this.citationTimeRange = newCitationTimeRange;

    // Trigger a new recommender view update
    this.updateCitationView();
  }

  paperCountSliderChanged(e: CustomEvent<number>) {
    const count = Math.round(e.detail);
    const newPaperCountRange = { ...this.paperCountRange };
    newPaperCountRange.curValue = count;
    this.paperCountRange = newPaperCountRange;

    // Trigger a new recommender view update
    this.updateCitationView();
  }

  selectChanged(e: InputEvent) {
    const curValue = (e.currentTarget as HTMLSelectElement).value;
    if (curValue === 'hIndex') {
      this.sortBy = 'hIndex';
    } else if (curValue === 'paperCount') {
      this.sortBy = 'paperCount';
    } else {
      this.sortBy = 'citeTimes';
    }
    this.updateCitationView();
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

  async citeTimeButtonClicked(
    e: MouseEvent,
    recommender: Recommender,
    type: 'paperCount' | 'citeTimes'
  ) {
    e.stopPropagation();
    e.preventDefault();

    if (!this.paperOverlayElement) {
      console.error('paperOverlayElement are not initialized yet.');
      return;
    }

    // Hide the description tooltip
    this.citeTimeButtonMouseLeft(e);

    if (this.curClickedCiteTimeAuthorID === recommender.authorID) {
      // This overlay is already shown. We hide it if the user clicks the button (again)
      this.paperOverlayElement.classList.add('hidden');
      this.curClickedCiteTimeAuthorID = null;
      this.overlayCleanup();
      this.overlayCleanup = () => {};
      return;
    }

    const anchor = e.currentTarget as HTMLElement;

    // Compute the number of times that this author has cite each paper
    if (type === 'citeTimes') {
      this.overlayPaperCounts = this.getPaperCiteCounts(recommender.authorID);
    } else {
      this.overlayPaperCounts = this.getPaperCounts(recommender.authorID);
    }
    this.overlayPaperCountsType = type;

    await this.updateComplete;

    const updateOverlay = () => {
      updatePopperOverlay(
        this.paperOverlayElement!,
        anchor,
        'left',
        true,
        10,
        300
      );
    };

    this.overlayCleanup = autoUpdate(
      anchor,
      this.paperOverlayElement,
      updateOverlay
    );

    this.curClickedCiteTimeAuthorID = recommender.authorID;
    this.paperOverlayElement.classList.remove('hidden');
  }

  citeTimeButtonMouseEntered(
    e: MouseEvent,
    type: 'paperCount' | 'citeTimes' | 'hIndex'
  ) {
    e.stopPropagation();
    e.preventDefault();

    if (!this.descriptionOverlayElement) {
      console.error('descriptionOverlayElement are not initialized yet.');
      return;
    }

    const anchor = e.currentTarget as HTMLElement;

    if (descriptionTooltipTimer) {
      clearTimeout(descriptionTooltipTimer);
    }

    descriptionTooltipTimer = setTimeout(async () => {
      this.overlayDescriptionType = type;
      await this.updateComplete;

      updatePopperOverlay(
        this.descriptionOverlayElement!,
        anchor,
        'top',
        true,
        10,
        300
      );

      this.descriptionOverlayElement!.classList.remove('hidden');
    }, 500);
  }

  citeTimeButtonMouseLeft(e: MouseEvent) {
    e.stopPropagation();
    e.preventDefault();

    if (!this.descriptionOverlayElement) {
      console.error('descriptionOverlayElement are not initialized yet.');
      return;
    }

    if (descriptionTooltipTimer) {
      clearTimeout(descriptionTooltipTimer);
    }

    this.descriptionOverlayElement.classList.add('hidden');
  }

  citeTimeBlurred() {
    if (!this.paperOverlayElement) {
      console.error('paperOverlayElement are not initialized yet.');
      return;
    }

    this.paperOverlayElement.classList.add('hidden');
    this.curClickedCiteTimeAuthorID = null;
    this.overlayCleanup();
    this.overlayCleanup = () => {};
  }

  checkboxInput(e: InputEvent) {
    const curElement = e.currentTarget as HTMLElement;

    const collaboratorCheckbox = curElement.querySelector(
      '#checkbox-collaboration'
    ) as HTMLInputElement;

    const awardCheckbox = curElement.querySelector(
      '#checkbox-award'
    ) as HTMLInputElement;

    const affiliationCheckbox = curElement.querySelector(
      '#checkbox-affiliation'
    ) as HTMLInputElement;

    if (!collaboratorCheckbox || !awardCheckbox || !affiliationCheckbox) {
      throw Error('Checkboxes are not initialized');
    }

    this.filterToggles.excludeCollaborator = collaboratorCheckbox.checked;
    this.filterToggles.haveAward = awardCheckbox.checked;
    this.filterToggles.haveAffiliation = affiliationCheckbox.checked;

    this.updateCitationView();
  }

  //==========================================================================||
  //                             Private Helpers                              ||
  //==========================================================================||
  getPaperCiteCounts(authorID: string) {
    const paperCounts: [string, number][] = [];

    for (const paper of this.papers) {
      const countMap = this.paperCitingAuthorCountMap.get(paper.paperId);
      if (countMap !== undefined && countMap.has(authorID)) {
        paperCounts.push([paper.title, countMap.get(authorID)!]);
      }
    }

    // Sort the papers by the cite times
    paperCounts.sort((a, b) => b[1] - a[1]);

    return paperCounts;
  }

  getPaperCounts(authorID: string) {
    const paperCounts: [string, number][] = [];

    const paperMap = this.authorPaperCiteTimesMap.get(authorID);
    if (paperMap === undefined) {
      console.error(`Can't find author ${authorID}`);
      throw Error(`Can't find author ${authorID}`);
    }

    for (const [paper, count] of paperMap.entries()) {
      paperCounts.push([paper, count]);
    }

    // Sort the papers by the cite times
    paperCounts.sort((a, b) => b[1] - a[1]);

    return paperCounts;
  }

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

          <div
            class="info-bar info-label info-award"
            title=${recommender.awards.join(', ') || ''}
            ?no-show=${recommender.awards.length === 0}
          >
            ${recommender.awards.join(', ')}
          </div>

          <div class="info-bar icons">
            <div
              class="info-block paper-count info-icon"
              tabindex="0"
              @click=${(e: MouseEvent) =>
                this.citeTimeButtonClicked(e, recommender, 'paperCount')}
              @mouseenter=${(e: MouseEvent) =>
                this.citeTimeButtonMouseEntered(e, 'paperCount')}
              @mouseleave=${(e: MouseEvent) => {
                this.citeTimeButtonMouseLeft(e);
              }}
              @touchstart=${(e: TouchEvent) => {
                e.stopPropagation();
              }}
              @blur=${() => this.citeTimeBlurred()}
            >
              <span class="svg-icon">${unsafeHTML(iconFile)}</span>
              ${recommender.paperCount}
            </div>

            <div
              class="info-block cite-time info-icon"
              tabindex="0"
              @click=${(e: MouseEvent) =>
                this.citeTimeButtonClicked(e, recommender, 'citeTimes')}
              @mouseenter=${(e: MouseEvent) =>
                this.citeTimeButtonMouseEntered(e, 'citeTimes')}
              @mouseleave=${(e: MouseEvent) => {
                this.citeTimeButtonMouseLeft(e);
              }}
              @touchstart=${(e: TouchEvent) => {
                e.stopPropagation();
              }}
              @blur=${() => this.citeTimeBlurred()}
            >
              <span class="svg-icon">${unsafeHTML(iconCiteTimes)}</span>
              ${recommender.citeTimes}
            </div>

            <a
              class="info-block info-icon"
              href="${recommender.url!}"
              @mouseenter=${(e: MouseEvent) =>
                this.citeTimeButtonMouseEntered(e, 'hIndex')}
              @mouseleave=${(e: MouseEvent) => {
                this.citeTimeButtonMouseLeft(e);
              }}
              target="_blank"
            >
              <span class="svg-icon">${unsafeHTML(iconHIndex)}</span>
              ${recommender.hIndex}
            </a>
          </div>
        </div> `;
    }

    // Recommender empty placeholder
    const recommenderEmptyView = html`
      <div
        class="recommender-empty-placeholder"
        ?no-show=${this.curRecommendersSize > 0}
      >
        <div class="text-icon">(｡•́︿•̀｡)</div>
        <div class="title">No Recommender Found</div>
        <div class="description">
          It looks like your filters are too restrictive, and no recommenders
          match all the selected criteria. Please try adjusting or removing some
          filters to see more options.
        </div>
      </div>
    `;

    // Compile the progress overlay
    const progressRing = html`
      <div
        class="progress-overlay"
        ?is-completed=${this.completedStep === this.totalStep}
      >
        <sl-progress-ring
          value=${(this.completedStep / this.totalStep) * 100}
        ></sl-progress-ring>
        <span class="progress-message">Fetching recommender details</span>
        <span class="progress-remain-time"
          >About ${formatRemainTime(this.remainTimeMS)} left</span
        >
      </div>
    `;

    // Compile the paper overlay
    let paperOverlayContent = html``;
    for (const [paper, count] of this.overlayPaperCounts) {
      paperOverlayContent = html`${paperOverlayContent}
        <div class="cell-paper">${paper}</div>
        <div class="cell-count">${count}x</div> `;
    }

    // Compile the control sidebar
    const controlBarContent = html`
      <div class="control-section">
        <div class="control-block title-block">
          <span class="title"
            >${this.numberFormatter(this.curRecommendersSize)}
            Recommenders</span
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
              <option value="paperCount">Papers citing me</option>
              <option value="citeTimes">Times citing me</option>
              <option value="hIndex">H-Index</option>
            </select>
          </div>
        </div>
      </div>

      <div class="separator"></div>

      <div class="control-section control-section-slider">
        <div class="control-block slider-block">
          <div class="citation-slider-label">
            Papers citing my work ≥ ${this.paperCountRange.curValue}
          </div>
          <nightjar-slider
            id="slider-paper-count"
            @valueChanged=${(e: CustomEvent<number>) =>
              this.paperCountSliderChanged(e)}
            min=${this.paperCountRange.min}
            max=${this.paperCountRange.max}
            curValue=${this.paperCountRange.initialValue}
            .styleConfig=${SLIDER_STYLE}
          ></nightjar-slider>
        </div>

        <div class="control-block slider-block">
          <div class="citation-slider-label">
            Cited my work ≥ ${this.citationTimeRange.curValue} times
          </div>
          <nightjar-slider
            id="slider-citation-time"
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

      <div
        class="control-section "
        @input=${(e: InputEvent) => this.checkboxInput(e)}
      >
        <div class="control-block checkbox-block">
          <div class="checkbox-wrapper">
            <input type="checkbox" id="checkbox-collaboration" />
            <label for="checkbox-collaboration">Exclude collaborators</label>
          </div>
        </div>

        <div class="control-block checkbox-block">
          <div class="checkbox-wrapper">
            <input type="checkbox" id="checkbox-award" />
            <label for="checkbox-award">Have awards</label>
          </div>
        </div>

        <div class="control-block checkbox-block">
          <div class="checkbox-wrapper">
            <input type="checkbox" id="checkbox-affiliation" />
            <label for="checkbox-affiliation">Have affiliation</label>
          </div>
        </div>
      </div>
    `;

    const controlSideBar = html`
      <div class="control-bar">${controlBarContent}</div>
    `;

    const controlPopBar = html`
      <div class="control-pop-bar" ?no-show=${!this.showPopMenu}>
        ${controlBarContent}
      </div>
    `;

    // Compile the description overlay
    let description = 'Papers by this recommender citing my work';
    let descriptionIcon = html`<span class="svg-icon"
      >${unsafeHTML(iconClick)}</span
    >`;

    if (this.overlayDescriptionType === 'citeTimes') {
      description = 'Total citations by this recommender';
    } else if (this.overlayDescriptionType === 'hIndex') {
      description = 'H-Index';
      descriptionIcon = html`<span class="svg-icon external-icon"
        >${unsafeHTML(iconExternal)}</span
      >`;
    }

    const descriptionOverlay = html`
      <div class="description">
        <span>${description}</span>
        ${descriptionIcon}
      </div>
    `;

    return html`
      <div class="recommender-view">
        ${progressRing} ${MOBILE_MODE ? controlPopBar : controlSideBar}

        <div
          class="right-content"
          @touchstart=${() => {
            this.citeTimeBlurred();
          }}
        >
          ${recommenderEmptyView}
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

        <div id="paper-overlay" class="popper-tooltip hidden" role="tooltip">
          <div class="popper-content">
            <div class="table-title">
              <span
                >${this.overlayPaperCountsType === 'citeTimes'
                  ? 'My papers & citations by the recommender'
                  : "Recommender's papers & citations of my work"}</span
              >
            </div>

            <div class="separator"></div>

            <div class="paper-table">${paperOverlayContent}</div>
          </div>
          <div class="popper-arrow"></div>
        </div>

        <div
          id="description-overlay"
          class="popper-tooltip hidden"
          role="tooltip"
        >
          <div class="popper-content">${descriptionOverlay}</div>
          <div class="popper-arrow"></div>
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

/**
 * Updates the position and appearance of a popper overlay tooltip.
 * @param tooltip - The tooltip element.
 * @param anchor - The anchor element to which the tooltip is attached.
 * @param placement - The placement of the tooltip relative to the anchor
 *  ('bottom', 'left', 'top', 'right').
 * @param withArrow - Indicates whether the tooltip should have an arrow.
 * @param offsetAmount - The offset amount in pixels.
 * @param maxWidth - The maximum width of the tooltip in pixels (optional).
 */
export const updatePopperOverlay = (
  tooltip: HTMLElement,
  anchor: HTMLElement,
  placement: 'bottom' | 'left' | 'top' | 'right',
  withArrow: boolean,
  offsetAmount = 8,
  maxWidth?: number
) => {
  const arrowElement = tooltip.querySelector('.popper-arrow')! as HTMLElement;

  if (withArrow) {
    arrowElement.classList.remove('hidden');
    computePosition(anchor, tooltip, {
      placement: placement,
      middleware: [
        offset(offsetAmount),
        flip(),
        size({
          apply({ availableWidth, elements }) {
            if (maxWidth) {
              Object.assign(elements.floating.style, {
                maxWidth: `${Math.min(maxWidth, availableWidth)}px`
              });
            }
          }
        }),
        shift(),
        arrow({ element: arrowElement }),
        hide()
      ]
    })
      .then(({ x, y, placement, middlewareData }) => {
        tooltip.style.left = `${x}px`;
        tooltip.style.top = `${y}px`;

        const { x: arrowX, y: arrowY } = middlewareData.arrow!;
        let staticSide: 'bottom' | 'left' | 'top' | 'right' = 'bottom';
        if (placement.includes('top')) staticSide = 'bottom';
        if (placement.includes('right')) staticSide = 'left';
        if (placement.includes('bottom')) staticSide = 'top';
        if (placement.includes('left')) staticSide = 'right';

        tooltip.setAttribute('placement', placement);

        arrowElement.style.left = arrowX ? `${arrowX}px` : '';
        arrowElement.style.top = arrowY ? `${arrowY}px` : '';
        arrowElement.style.right = '';
        arrowElement.style.bottom = '';
        arrowElement.style[staticSide] = '-4px';

        if (middlewareData.hide?.referenceHidden) {
          tooltip.classList.add('no-show');
        } else {
          tooltip.classList.remove('no-show');
        }
      })
      .catch(() => {});
  } else {
    arrowElement.classList.add('hidden');
    computePosition(anchor, tooltip, {
      placement: placement,
      middleware: [offset(6), flip(), shift(), hide()]
    })
      .then(({ x, y, middlewareData }) => {
        tooltip.style.left = `${x}px`;
        tooltip.style.top = `${y}px`;

        if (middlewareData.hide?.referenceHidden) {
          tooltip.classList.add('hidden');
        } else {
          tooltip.classList.remove('hidden');
        }
      })
      .catch(() => {});
  }
};

const formatRemainTime = (milliseconds: number): string => {
  let remainingTime = milliseconds;
  const hours = Math.floor(remainingTime / (1000 * 60 * 60));
  remainingTime %= 1000 * 60 * 60;
  const minutes = Math.floor(remainingTime / (1000 * 60));
  remainingTime %= 1000 * 60;
  const seconds = Math.floor(remainingTime / 1000);

  let result = '';
  if (hours > 0) {
    result += `${hours} hour${hours !== 1 ? 's' : ''} `;
  }
  if (minutes > 0) {
    result += `${minutes} minute${minutes !== 1 ? 's' : ''} `;
  }
  if (seconds > 0) {
    result += `${seconds} second${seconds !== 1 ? 's' : ''} `;
  }

  return result;
};
