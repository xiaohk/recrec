import { LitElement, css, unsafeCSS, html, PropertyValues } from 'lit';
import { customElement, property, state, query } from 'lit/decorators.js';
import { unsafeHTML } from 'lit/directives/unsafe-html.js';
import '../recrec/recrec';

import componentCSS from './page.css?inline';
import recrecIcon from '../../images/recrec-logo.svg?raw';

/**
 * Page element.
 */
@customElement('recrec-page')
export class RecRecPage extends LitElement {
  //==========================================================================||
  //                              Class Properties                            ||
  //==========================================================================||

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
      <div class="page">
        <div class="headline">
          <div class="head-group">
            <div class="svg-icon">${unsafeHTML(recrecIcon)}</div>
            <div class="tag-line">
              Recommender for Recommendation Letter Writers
            </div>
          </div>

          <div class="head-group">
            <a href="https://zijie.wang" target="_blank" class="button"
              >By Jay Wang</a
            >
            <a href="https://zijie.wang" target="_blank" class="button">Code</a>
          </div>
        </div>
        <div class="app-container"><recrec-app></recrec-app></div>
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
    'recrec-page': RecRecPage;
  }
}
