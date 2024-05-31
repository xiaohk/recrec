import { LitElement, css, unsafeCSS, html, PropertyValues } from 'lit';
import { customElement, property, state, query } from 'lit/decorators.js';
import { unsafeHTML } from 'lit/directives/unsafe-html.js';
import { Step, SemanticAuthorDetail } from '../../types/common-types';

import '../author-view/author-view';
import '../paper-view/paper-view';

import componentCSS from './recrec.css?inline';

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
  curStep: Step = Step.Paper;

  @state()
  selectedProfile: SemanticAuthorDetail | null = null;

  //==========================================================================||
  //                             Lifecycle Methods                            ||
  //==========================================================================||
  constructor() {
    super();
    this.selectedProfile = {
      authorId: '1390877819',
      name: 'Zijie J. Wang',
      affiliations: ['Georgia Tech'],
      homepage: 'https://zijie.wang',
      paperCount: 42,
      citationCount: 1716
    };
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

  //==========================================================================||
  //                             Private Helpers                              ||
  //==========================================================================||
  moveToNextStep() {
    const curIndex = steps.indexOf(this.curStep);
    if (curIndex + 1 >= steps.length) {
      throw Error(`There is no more step after this step: ${this.curStep}`);
    }
    this.curStep = steps[curIndex + 1];
  }

  //==========================================================================||
  //                           Templates and Styles                           ||
  //==========================================================================||
  render() {
    // Render the content view based on the current step
    let contentView = html``;
    switch (this.curStep) {
      case Step.Author: {
        contentView = html`<recrec-author-view
          class="content-view"
          @author-row-clicked=${(e: CustomEvent<SemanticAuthorDetail>) => {
            this.authorRowClickedHandler(e);
          }}
        ></recrec-author-view>`;
        break;
      }

      case Step.Paper: {
        contentView = html`<recrec-paper-view
          class="content-view"
          .selectedProfile=${this.selectedProfile}
        ></recrec-paper-view>`;
        break;
      }

      case Step.Recommender: {
        contentView = html`<recrec-author-view
          class="content-view"
        ></recrec-author-view>`;
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

          <div class="profile-container">
            <span>My Profile:</span>
            <span
              class="profile-name"
              ?is-unset=${this.selectedProfile === null}
              >${this.selectedProfile === null
                ? 'Unset'
                : this.selectedProfile.name}</span
            >
          </div>

          <div class="step-content-container">${contentView}</div>

          <div class="footer">
            <button
              class="confirm-button"
              ?disabled=${this.selectedProfile === null}
              @click=${() => this.moveToNextStep()}
            >
              Confirm
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
    'recrec-app': RecRecApp;
  }
}
