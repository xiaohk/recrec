import { LitElement, css, unsafeCSS, html, PropertyValues } from 'lit';
import { customElement, property, state, query } from 'lit/decorators.js';
import { unsafeHTML } from 'lit/directives/unsafe-html.js';
import { SlInput } from '@shoelace-style/shoelace';
import { searchAuthorByName } from '../../api/semantic-scholar';
import type {
  SemanticAuthorSearchResponse,
  SemanticAuthorSearch,
  SemanticAuthorDetail
} from '../../types/common-types';
import type { RecRecAuthorList } from '../author-list/author-list';

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

  @state()
  isSearching = false;

  @query('sl-input')
  searchInputComponent: SlInput | undefined;

  @query('recrec-author-list')
  authorListComponent: RecRecAuthorList | undefined;

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
      this.updateAuthorList(query).then(
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

  //==========================================================================||
  //                             Private Helpers                              ||
  //==========================================================================||
  async updateAuthorList(query: string) {
    // Skip the query if it is the same as the last query
    if (query === this.lastCompletedQuery) {
      return;
    }

    const data = await searchAuthorByName(query);

    // Pass the author info to the author list component
    this.searchAuthors = data.data;
    this.lastCompletedQuery = query;

    if (this.searchAuthors.length > 0) {
      this.showAuthorList = true;
    } else {
      this.showAuthorList = false;
    }
  }

  authorRowClickedHandler(e: CustomEvent<SemanticAuthorDetail>) {
    this.selectedProfile = e.detail;

    // Also fill the input with the selected author
    if (this.searchInputComponent) {
      this.searchInputComponent.value = this.selectedProfile!.name!;
    }
  }

  confirmButtonClicked() {
    if (this.selectedProfile === null) {
      return;
    }

    const event = new Event('confirm-button-clicked', {
      bubbles: true,
      composed: true
    });
    this.dispatchEvent(event);
  }

  //==========================================================================||
  //                           Templates and Styles                           ||
  //==========================================================================||
  render() {
    return html`
      <div class="author-view">
        <div class="content-container">
          <div class="search-bar">
            <sl-input
              type="search"
              size="medium"
              placeholder="Type your name to search your Semantic Scholar profile"
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
              <div class="svg-icon search-icon" slot="suffix">
                <div class="loader" ?is-hidden=${!this.isSearching}></div>
              </div>
            </sl-input>
          </div>

          <div class="search-result" ?is-hidden=${!this.showAuthorList}>
            <recrec-author-list
              .authors=${this.searchAuthors}
              @author-row-clicked=${(e: CustomEvent<SemanticAuthorDetail>) => {
                this.authorRowClickedHandler(e);
              }}
              @is-searching-changed=${(e: CustomEvent<boolean>) => {
                this.isSearching = e.detail;
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
