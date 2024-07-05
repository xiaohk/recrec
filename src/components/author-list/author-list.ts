import { LitElement, css, unsafeCSS, html, PropertyValues } from 'lit';
import { customElement, property, state, query } from 'lit/decorators.js';
import { unsafeHTML } from 'lit/directives/unsafe-html.js';
import { searchAuthorDetails } from '../../api/semantic-scholar';

import type {
  SemanticAuthorSearch,
  SemanticAuthorDetail
} from '../../types/common-types';

import iconPerson from '../../images/icon-person.svg?raw';
import componentCSS from './author-list.css?inline';

const AUTHORS_PER_PAGE = 100;

/**
 * Author list element.
 */
@customElement('recrec-author-list')
export class RecRecAuthorList extends LitElement {
  //==========================================================================||
  //                              Class Properties                            ||
  //==========================================================================||
  @property({ attribute: false })
  authors: SemanticAuthorSearch[] = [];

  @state()
  authorDetails: SemanticAuthorDetail[] = [];

  authorStartIndex = 0;

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
  willUpdate(changedProperties: PropertyValues<this>) {
    if (changedProperties.has('authors')) {
      // If the search authors have changed, we need to fetch the new details
      this.authorStartIndex = 0;
      this.updateAuthorDetails().then(
        () => {},
        () => {}
      );
    }
  }

  //==========================================================================||
  //                              Custom Methods                              ||
  //==========================================================================||
  async initData() {}

  //==========================================================================||
  //                              Event Handlers                              ||
  //==========================================================================||
  authorRowClicked(author: SemanticAuthorDetail) {
    // Notify the parent about the selection
    const event: CustomEvent<SemanticAuthorDetail> = new CustomEvent(
      'author-row-clicked',
      {
        bubbles: true,
        composed: true,
        detail: author
      }
    );
    this.dispatchEvent(event);
  }

  //==========================================================================||
  //                             Private Helpers                              ||
  //==========================================================================||
  async updateAuthorDetails() {
    if (this.authors.length === 0) {
      this.authorDetails = [];
      return;
    }

    const data = await searchAuthorDetails(this.authors.map(d => d.authorId));

    this.authorDetails = data;
  }

  //==========================================================================||
  //                           Templates and Styles                           ||
  //==========================================================================||
  render() {
    // Collect the authors
    let authors = html``;

    for (const author of this.authorDetails.slice(
      this.authorStartIndex,
      this.authorStartIndex + AUTHORS_PER_PAGE
    )) {
      if (author === null) continue;

      authors = html`${authors}
        <tr
          class="author-row"
          @click=${() => {
            this.authorRowClicked(author);
          }}
        >
          <td class="icon">
            <div class="svg-icon person-icon">${unsafeHTML(iconPerson)}</div>
          </td>
          <td class="name">
            ${author.name}${author.affiliations!.length > 0
              ? ` (${author.affiliations![0]})`
              : ''}
          </td>
          <td class="paper-count">${author.paperCount} papers</td>
          <td class="citation-count">${author.citationCount} citations</td>
          <td></td>
        </tr> `;
    }

    return html`
      <div class="author-list">
        <table class="author-table">
          <colgroup>
            <col class="col-icon" />
            <col class="col-name" />
            <col class="col-paper-count" />
            <col class="col-citation-count" />
            <col class="col-filler" />
          </colgroup>
          ${authors}
        </table>
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
    'recrec-author-list': RecRecAuthorList;
  }
}
