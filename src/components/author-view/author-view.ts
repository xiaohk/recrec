import { LitElement, css, unsafeCSS, html, PropertyValues } from 'lit';
import { customElement, property, state, query } from 'lit/decorators.js';
import { unsafeHTML } from 'lit/directives/unsafe-html.js';

import '@shoelace-style/shoelace/dist/components/input/input.js';
import '../header-bar/header-bar';

import '@shoelace-style/shoelace/dist/themes/light.css';
import componentCSS from './author-view.css?inline';

/**
 * Author view element.
 */
@customElement('recrec-author-view')
export class RecRecAuthorView extends LitElement {
  //==========================================================================||
  //                              Class Properties                            ||
  //==========================================================================||
  profileName: string | null = null;

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
  searchInput(e: InputEvent) {
    console.log(e);
  }

  //==========================================================================||
  //                             Private Helpers                              ||
  //==========================================================================||

  //==========================================================================||
  //                           Templates and Styles                           ||
  //==========================================================================||
  render() {
    return html`
      <div class="author-view">
        <div class="content-container">
          <div class="profile-container">
            <span>My Profile:</span>
            <span class="profile-name" ?is-unset=${this.profileName === null}
              >${this.profileName || 'Unset'}</span
            >
          </div>

          <div class="search-bar">
            <sl-input
              type="search"
              size="medium"
              placeholder="Search Semantic Scholar profiles"
              clearable
              @sl-input=${(e: InputEvent) => this.searchInput(e)}
            ></sl-input>
          </div>

          <div class="search-result"></div>
        </div>
        <div class="footer">
          <button class="button">Confirm</button>
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
    'recrec-author-view': RecRecAuthorView;
  }
}
