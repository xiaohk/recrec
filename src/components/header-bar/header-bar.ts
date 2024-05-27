import { LitElement, css, unsafeCSS, html, PropertyValues } from 'lit';
import { customElement, property, state, query } from 'lit/decorators.js';
import { unsafeHTML } from 'lit/directives/unsafe-html.js';
import { Step } from '../../types/common-types';

import iconCaret from '../../images/icon-caret-down.svg?raw';
import componentCSS from './header-bar.css?inline';

const steps = [Step.Author, Step.Paper, Step.Recommender];

const titleString: Record<Step, string> = {
  [Step.Author]: 'Find Your Semantic Scholar Author Information',
  [Step.Paper]: 'Select Your Papers to Find Recommenders',
  [Step.Recommender]: 'Refine the Potential Recommenders'
};

/**
 * Header bar element.
 */
@customElement('recrec-header-bar')
export class RecRecHeaderBar extends LitElement {
  //==========================================================================||
  //                              Class Properties                            ||
  //==========================================================================||
  @property({ type: Number })
  curStepIndex = 0;

  get curStep() {
    return steps[this.curStepIndex];
  }

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
  willUpdate(changedProperties: PropertyValues<this>) {}

  //==========================================================================||
  //                              Custom Methods                              ||
  //==========================================================================||
  async initData() {}

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
    return html`
      <div class="header-bar">
        <div class="svg-icon move-pre">${unsafeHTML(iconCaret)}</div>
        <div class="title-middle">
          <span class="step-info"
            >Step ${this.curStepIndex + 1}/${steps.length}:</span
          >
          <span class="title">${titleString[this.curStep]}</span>
        </div>

        <div class="svg-icon move-next">${unsafeHTML(iconCaret)}</div>
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
    'recrec-header-bar': RecRecHeaderBar;
  }
}
