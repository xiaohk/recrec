import { LitElement, css, unsafeCSS, html, PropertyValues } from 'lit';
import { customElement, property, state, query } from 'lit/decorators.js';
import { unsafeHTML } from 'lit/directives/unsafe-html.js';
import {
  Step,
  SemanticAuthorDetail,
  SemanticPaper
} from '../../types/common-types';
import { RecRecPaperView } from '../paper-view/paper-view';

import '../author-view/author-view';
import '../paper-view/paper-view';
import '../recommender-view/recommender-view';

import componentCSS from './recrec.css?inline';

const MOBILE_MODE = window.screen.width < 768;
const steps = [Step.Author, Step.Paper, Step.Recommender];

/**
 * App element.
 *
 */
@customElement('recrec-app')
export class RecRecApp extends LitElement {
  //==========================================================================||
  //                              Class Properties                            ||
  //==========================================================================||
  @state()
  curStep: Step = Step.Author;

  @state()
  selectedProfile: SemanticAuthorDetail | null = null;

  @query('recrec-paper-view')
  paperViewComponent!: RecRecPaperView;

  @state()
  papers: SemanticPaper[] = [];

  @state()
  selectedPaperIDs = new Set<string>();

  @state()
  confirmedSelectedPaperIDs = new Set<string>();

  //==========================================================================||
  //                             Lifecycle Methods                            ||
  //==========================================================================||
  constructor() {
    super();
    // this.selectedProfile = {
    //   authorId: '1390877819',
    //   name: 'Zijie J. Wang',
    //   affiliations: ['Georgia Tech'],
    //   homepage: 'https://zijie.wang',
    //   paperCount: 42,
    //   citationCount: 1716
    // };
  }

  /**
   * This method is called before new DOM is updated and rendered
   * @param changedProperties Property that has been changed
   */
  willUpdate(changedProperties: PropertyValues<this>) {}

  //==========================================================================||
  //                              Custom Methods                              ||
  //==========================================================================||
  async initData() {}

  //==========================================================================||
  //                              Event Handlers                              ||
  //==========================================================================||
  authorRowClickedHandler(e: CustomEvent<SemanticAuthorDetail>) {
    this.selectedProfile = e.detail;
  }

  selectedPaperCountUpdatedHandler(e: CustomEvent<Set<string>>) {
    this.selectedPaperIDs = e.detail;
  }

  papersUpdatedHandler(e: CustomEvent<SemanticPaper[]>) {
    this.papers = e.detail;
  }

  headerStepClickedHandler(e: CustomEvent<'pre' | 'next'>) {
    const curStepIndex = steps.indexOf(this.curStep);
    if (e.detail === 'pre') {
      const newCurStepIndex = Math.max(0, curStepIndex - 1);
      this.curStep = steps[newCurStepIndex];
    } else {
      const newCurStepIndex = Math.min(steps.length - 1, curStepIndex + 1);
      this.curStep = steps[newCurStepIndex];
    }

    if (this.curStep === Step.Recommender) {
      this.confirmedSelectedPaperIDs = this.selectedPaperIDs;
    }
  }

  //==========================================================================||
  //                             Private Helpers                              ||
  //==========================================================================||
  moveToNextStep() {
    const curIndex = steps.indexOf(this.curStep);
    if (curIndex + 1 >= steps.length) {
      throw Error(`There is no more step after this step: ${this.curStep}`);
    }
    this.curStep = steps[curIndex + 1];

    if (this.curStep === Step.Recommender) {
      this.confirmedSelectedPaperIDs = this.selectedPaperIDs;
    }
  }

  jumpToStep(step: Step) {
    this.curStep = step;
  }

  //==========================================================================||
  //                           Templates and Styles                           ||
  //==========================================================================||
  render() {
    // Render the content view based on the current step
    const contentView = html`
      <recrec-author-view
        class="content-view"
        ?no-show=${this.curStep !== Step.Author}
        @author-row-clicked=${(e: CustomEvent<SemanticAuthorDetail>) => {
          this.authorRowClickedHandler(e);
        }}
        @confirm-button-clicked=${() => {
          this.moveToNextStep();
        }}
      ></recrec-author-view>

      <recrec-paper-view
        class="content-view"
        ?no-show=${this.curStep !== Step.Paper}
        .selectedProfile=${this.selectedProfile}
        @confirm-button-clicked=${() => {
          this.moveToNextStep();
        }}
        @selected-paper-count-updated=${(e: CustomEvent<Set<string>>) => {
          this.selectedPaperCountUpdatedHandler(e);
        }}
        @papers-updated=${(e: CustomEvent<SemanticPaper[]>) => {
          this.papersUpdatedHandler(e);
        }}
      ></recrec-paper-view>

      <recrec-recommender-view
        class="content-view"
        ?no-show=${this.curStep !== Step.Recommender}
        .curStep=${this.curStep}
        .papers=${this.papers}
        .selectedPaperIDs=${this.confirmedSelectedPaperIDs}
        .selectedProfile=${this.selectedProfile}
      ></recrec-recommender-view>
    `;

    return html`
      <div class="app">
        <div class="view-container">
          <recrec-header-bar
            .curStep=${this.curStep}
            .selectedProfile=${this.selectedProfile}
            @step-clicked=${(e: CustomEvent<'pre' | 'next'>) => {
              this.headerStepClickedHandler(e);
            }}
          ></recrec-header-bar>

          <div class="info-bar">
            <div class="info-block">
              <span>${MOBILE_MODE ? "I'm" : 'My Profile:'}</span>
              <button
                class="profile-name"
                @click=${() => {
                  this.jumpToStep(Step.Author);
                }}
                ?is-unset=${this.selectedProfile === null}
              >
                ${this.selectedProfile === null
                  ? 'Unset'
                  : this.selectedProfile.name}
              </button>
            </div>

            <div class="info-block" ?no-show=${this.curStep === Step.Author}>
              <span>${MOBILE_MODE ? 'Papers:' : 'Representative Papers:'}</span>
              <button
                class="profile-name"
                @click=${() => {
                  this.jumpToStep(Step.Paper);
                }}
              >
                ${this.selectedPaperIDs.size} selected
              </button>
            </div>
          </div>

          <div class="step-content-container">${contentView}</div>
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
    'recrec-app': RecRecApp;
  }
}
