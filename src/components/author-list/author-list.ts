import { LitElement, css, unsafeCSS, html, PropertyValues } from 'lit';
import { customElement, property, state, query } from 'lit/decorators.js';
import { unsafeHTML } from 'lit/directives/unsafe-html.js';

import type {
  SemanticAuthorSearch,
  SemanticAuthorDetail
} from '../../types/common-types';

import iconPerson from '../../images/icon-person.svg?raw';
import componentCSS from './author-list.css?inline';

const AUTHORS_PER_PAGE = 20;

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
      this.updateAuthorDetails();
    }
  }

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
  async updateAuthorDetails() {
    if (this.authors.length === 0) {
      return;
    }

    // Prepare for the fetch
    const authorIDs = this.authors.map(d => d.authorId);
    const body = {
      ids: authorIDs
    };

    const baseURL = 'https://api.semanticscholar.org/graph/v1/author/batch';
    const parameters: Record<string, string> = {
      fields: 'authorId,name,affiliations,homepage,paperCount,citationCount'
    };
    const encodedParameters = new URLSearchParams(parameters);

    const options: RequestInit = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(body)
    };

    const url = `${baseURL}?${encodedParameters.toString()}`;

    // Fetch the author details
    const response = await fetch(url, options);
    if (!response.ok) {
      throw Error(
        `Fetch error when getting author details, status: ${response.status}`
      );
    }

    const data = (await response.json()) as SemanticAuthorDetail[];
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
      authors = html`${authors}
        <tr class="author-row">
          <td class="svg-icon">${unsafeHTML(iconPerson)}</td>
          <td class="name">
            ${author.name}${author.affiliations.length > 0
              ? ` (${author.affiliations[0]})`
              : ''}
          </td>
          <td class="paper-count">${author.paperCount} publications</td>
          <td class="citation-count">${author.citationCount} citations</td>
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
