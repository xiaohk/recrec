import { LitElement, css, unsafeCSS, html, PropertyValues } from 'lit';
import { customElement, property, state, query } from 'lit/decorators.js';
import { unsafeHTML } from 'lit/directives/unsafe-html.js';
import { Step } from '../../types/common-types';
import '../author-view/author-view';
import '../paper-view/paper-view';

import componentCSS from './app.css?inline';

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

  //==========================================================================||
  //                             Lifecycle Methods                            ||
  //==========================================================================||
  constructor() {
    super();
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

  //==========================================================================||
  //                             Private Helpers                              ||
  //==========================================================================||
  moveToNextStep(curStep: Step) {
    const curIndex = steps.indexOf(curStep);
    if (curIndex + 1 >= steps.length) {
      throw Error(`There is no more step after this step: ${curStep}`);
    }
    this.curStep = steps[curIndex + 1];
  }

  //==========================================================================||
  //                           Templates and Styles                           ||
  //==========================================================================||
  render() {
    // Render the view based on the current step
    let contentView = html``;
    switch (this.curStep) {
      case Step.Author: {
        contentView = html`<recrec-author-view
          @confirm-button-clicked=${() => {
            this.moveToNextStep(Step.Author);
          }}
        ></recrec-author-view>`;
        break;
      }

      case Step.Paper: {
        contentView = html`<recrec-paper-view
          @confirm-button-clicked=${() => {
            this.moveToNextStep(Step.Paper);
          }}
        ></recrec-paper-view>`;
        break;
      }

      case Step.Recommender: {
        contentView = html`<recrec-author-view></recrec-author-view>`;
        break;
      }

      default: {
        break;
      }
    }

    return html`
      <div class="app">
        <div class="view-container">
          <recrec-header-bar></recrec-header-bar>
          ${contentView}
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
