import { LitElement, css, unsafeCSS, html, PropertyValues } from 'lit';
import { customElement, property, state, query } from 'lit/decorators.js';
import { unsafeHTML } from 'lit/directives/unsafe-html.js';
import {
  Step,
  SemanticAuthorDetail,
  SemanticPaper
} from '../../types/common-types';
import { getAllPapersFromAuthor } from '../../api/semantic-scholar';

import componentCSS from './paper-view.css?inline';

/**
 * Paper view element.
 */
@customElement('recrec-paper-view')
export class RecRecPaperView extends LitElement {
  //==========================================================================||
  //                              Class Properties                            ||
  //==========================================================================||
  @property({ attribute: false })
  selectedProfile: SemanticAuthorDetail | null = null;

  @state()
  papers: SemanticPaper[] = [];

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
    if (
      changedProperties.has('selectedProfile') &&
      this.selectedProfile !== null
    ) {
      // Update the paper information
      this.updatePaperInfo().then(
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

  //==========================================================================||
  //                             Private Helpers                              ||
  //==========================================================================||
  async updatePaperInfo() {
    if (this.selectedProfile === null) {
      console.error('Trying to update paper info when selectedProfile is null');
      return;
    }

    const papers = await getAllPapersFromAuthor(this.selectedProfile.authorId);

    // Sort the papers by publication date first
    papers.sort((a, b) => b.publicationDate.localeCompare(a.publicationDate));
    this.papers = papers;
    console.log(this.papers);
  }

  formatPaperAuthor(paper: SemanticPaper) {
    const authors = paper.authors.map(d => d.name).join(', ');
    return authors;
  }

  //==========================================================================||
  //                           Templates and Styles                           ||
  //==========================================================================||
  render() {
    // Compile the table content
    let tableBody = html``;

    for (const [i, paper] of this.papers.entries()) {
      tableBody = html`${tableBody}
        <tr>
          <td class="selected-cell">
            <input type="checkbox" id="checkbox-${i}" />
            <label for="checkbox-${i}"></label>
          </td>
          <td class="title-cell">
            <span class="title">${paper.title}</span>
            <span class="author" title=${this.formatPaperAuthor(paper)}
              >${this.formatPaperAuthor(paper)}</span
            >
            <span class="venue">${paper.venue}</span>
          </td>
          <td class="citation-cell">${paper.citationCount}</td>
          <td class="date-cell">${paper.year}</td>
        </tr> `;
    }

    return html`
      <div class="paper-view">
        <table class="paper-table">
          <thead>
            <tr>
              <th class="selected-cell header-cell">
                <input class="paper-checkbox" type="checkbox" />
              </th>
              <th class="title-cell header-cell">
                <button class="header-button">Title</button>
              </th>
              <th class="citation-cell header-cell">
                <button class="header-button">Cited By</button>
              </th>
              <th class="date-cell header-cell">
                <button class="header-button">Year</button>
              </th>
            </tr>
          </thead>

          <tbody>
            ${tableBody}
          </tbody>
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
    'recrec-paper-view': RecRecPaperView;
  }
}
