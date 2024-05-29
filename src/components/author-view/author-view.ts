import { LitElement, css, unsafeCSS, html, PropertyValues } from 'lit';
import { customElement, property, state, query } from 'lit/decorators.js';
import { unsafeHTML } from 'lit/directives/unsafe-html.js';
import { SlInput } from '@shoelace-style/shoelace';
import type {
  SemanticAuthorSearchResponse,
  SemanticAuthorSearch,
  SemanticAuthorDetail
} from '../../types/common-types';

import '@shoelace-style/shoelace/dist/components/input/input.js';
import '../header-bar/header-bar';
import '../author-list/author-list';

import '@shoelace-style/shoelace/dist/themes/light.css';
import componentCSS from './author-view.css?inline';
import iconSearch from '../../images/icon-search.svg?raw';

/**
 * Author view element.
 */
@customElement('recrec-author-view')
export class RecRecAuthorView extends LitElement {
  //==========================================================================||
  //                              Class Properties                            ||
  //==========================================================================||
  selectedProfile: SemanticAuthorDetail | null = null;
  searchAuthorTimer: number | null = null;
  lastCompletedQuery: string = '';

  @state()
  searchAuthors: SemanticAuthorSearch[] = [];

  @state()
  showAuthorList = false;

  @query('sl-input')
  searchInputComponent: SlInput | undefined;

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
  searchInput(e: InputEvent, delay = 400) {
    const target = e.currentTarget as HTMLInputElement;
    const query = target.value;

    if (query === '') {
      this.searchAuthors = [];
      this.lastCompletedQuery = '';
      this.showAuthorList = false;
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

  searchFocused() {
    // Show the author list if the query is not empty
    if (!this.searchInputComponent) {
      return;
    }

    const query = this.searchInputComponent.value;
    if (this.lastCompletedQuery === query && query !== '') {
      this.showAuthorList = true;
    }
  }

  searchBlurred() {
    setTimeout(() => {
      this.showAuthorList = false;
    }, 200);
  }

  confirmButtonClicked() {
    if (this.selectedProfile === null) {
      return;
    }

    // Notify the parent to move to the next step
    const event = new Event('confirm-button-clicked', {
      bubbles: true,
      composed: true
    });
    this.dispatchEvent(event);
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

    if (this.searchAuthors.length > 0) {
      this.showAuthorList = true;
    } else {
      this.showAuthorList = false;
    }

    console.log(data);
  }

  authorRowClickedHandler(e: CustomEvent<SemanticAuthorDetail>) {
    this.selectedProfile = e.detail;
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
            <span
              class="profile-name"
              ?is-unset=${this.selectedProfile === null}
              >${this.selectedProfile === null
                ? 'Unset'
                : this.selectedProfile.name}</span
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
              @sl-focus=${() => {
                this.searchFocused();
              }}
              @sl-blur=${() => {
                this.searchBlurred();
              }}
            >
              <div class="svg-icon search-icon" slot="prefix">
                ${unsafeHTML(iconSearch)}
              </div>
            </sl-input>
          </div>

          <div class="search-result" ?is-hidden=${!this.showAuthorList}>
            <recrec-author-list
              .authors=${this.searchAuthors}
              @author-row-clicked=${(e: CustomEvent<SemanticAuthorDetail>) => {
                this.authorRowClickedHandler(e);
              }}
            ></recrec-author-list>
          </div>
        </div>

        <div class="footer">
          <button
            class="confirm-button"
            ?disabled=${this.selectedProfile === null}
            @click=${() => this.confirmButtonClicked()}
          >
            Confirm
          </button>
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
