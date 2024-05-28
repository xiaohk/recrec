import { LitElement, css, unsafeCSS, html, PropertyValues } from 'lit';
import { customElement, property, state, query } from 'lit/decorators.js';
import { unsafeHTML } from 'lit/directives/unsafe-html.js';
import type {
  SemanticAuthorSearchResponse,
  SemanticAuthorSearch
} from '../../types/common-types';

import '@shoelace-style/shoelace/dist/components/input/input.js';
import '../header-bar/header-bar';
import '../author-list/author-list';

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
  searchAuthorTimer: number | null = null;
  lastCompletedQuery: string = '';

  @state()
  searchAuthors: SemanticAuthorSearch[] = [];

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
  searchInput(e: InputEvent, delay = 600) {
    const target = e.currentTarget as HTMLInputElement;
    const query = target.value;

    if (query === '') {
      return;
    }

    // Debounce the search
    if (this.searchAuthorTimer !== null) {
      clearTimeout(this.searchAuthorTimer);
    }

    this.searchAuthorTimer = setTimeout(() => {
      this.searchAuthorByName(query).then(
        () => {},
        () => {}
      );
    }, delay);
  }

  //==========================================================================||
  //                             Private Helpers                              ||
  //==========================================================================||
  async searchAuthorByName(query: string) {
    // Skip the query if it is the same as the last query
    if (query === this.lastCompletedQuery) {
      return;
    }

    const baseURL = 'https://api.semanticscholar.org/graph/v1/author/search';
    const url = `${baseURL}?query=${encodeURIComponent(query)}`;
    const result = await fetch(url);
    if (!result.ok) {
      throw Error(`Search request failed with status: ${result.statusText}`);
    }

    const data = (await result.json()) as SemanticAuthorSearchResponse;

    // Pass the author info to the author list component
    this.searchAuthors = data.data;
    this.lastCompletedQuery = query;

    console.log(data);
  }

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
              spellcheck="false"
              clearable
              @sl-input=${(e: InputEvent) => this.searchInput(e)}
              @sl-change=${(e: InputEvent) => {
                this.searchInput(e, 0);
              }}
            ></sl-input>
          </div>

          <div class="search-result">
            <recrec-author-list
              .authors=${this.searchAuthors}
            ></recrec-author-list>
          </div>
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
