import { LitElement, css, unsafeCSS, html, PropertyValues } from 'lit';
import { customElement, property, state, query } from 'lit/decorators.js';
import { unsafeHTML } from 'lit/directives/unsafe-html.js';
import { Step } from '../../types/common-types';
import type { SemanticAuthorDetail } from '../../types/common-types';

import iconCaret from '../../images/icon-caret-down.svg?raw';
import componentCSS from './header-bar.css?inline';

const steps = [Step.Author, Step.Paper, Step.Recommender];

const titleString: Record<Step, string> = {
  [Step.Author]: 'Find Your Semantic Scholar Profile',
  [Step.Paper]: 'Select Representative Papers',
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
  @property({ attribute: false })
  curStep = Step.Author;

  @property({ attribute: false })
  selectedProfile: SemanticAuthorDetail | null = null;

  get curStepIndex() {
    return steps.indexOf(this.curStep);
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

  notifyParentMoveStep(direction: 'pre' | 'next') {
    const event = new CustomEvent<'pre' | 'next'>('step-clicked', {
      bubbles: true,
      composed: true,
      detail: direction
    });
    this.dispatchEvent(event);
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
    return html`
      <div class="header-bar">
        <button
          class="svg-icon move-pre"
          ?disabled=${this.curStep === Step.Author}
          @click=${() => {
            this.notifyParentMoveStep('pre');
          }}
        >
          ${unsafeHTML(iconCaret)}
        </button>

        <div class="title-middle">
          <span class="step-info"
            >Step ${this.curStepIndex + 1}/${steps.length}</span
          >
          <span class="title">${titleString[this.curStep]}</span>
        </div>

        <button
          class="svg-icon move-next"
          ?disabled=${this.curStep === Step.Recommender ||
          (this.curStep === Step.Author && this.selectedProfile === null)}
          @click=${() => {
            this.notifyParentMoveStep('next');
          }}
        >
          ${unsafeHTML(iconCaret)}
        </button>
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
