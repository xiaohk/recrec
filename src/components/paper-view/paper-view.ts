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

  @state()
  selectedPaperIDs: Set<string> = new Set();

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
  async updatePaperInfo() {
    if (this.selectedProfile === null) {
      console.error('Trying to update paper info when selectedProfile is null');
      return;
    }

    const papers = await getAllPapersFromAuthor(this.selectedProfile.authorId);

    // Sort the papers by publication date first
    papers.sort((a, b) => b.publicationDate.localeCompare(a.publicationDate));
    this.papers = papers;

    // Select all papers by default
    const newSelectedPaperIDs = new Set<string>([
      ...papers.map(d => d.paperId)
    ]);
    this.selectedPaperIDs = newSelectedPaperIDs;

    this.notifyParentPaperCount(this.selectedPaperIDs.size);

    console.log(this.papers);
  }

  formatPaperAuthor(paper: SemanticPaper) {
    const authors = paper.authors.map(d => d.name).join(', ');
    return authors;
  }

  notifyParentPaperCount(paperCount: number) {
    const event = new CustomEvent<number>('selected-paper-count-updated', {
      bubbles: true,
      composed: true,
      detail: paperCount
    });
    this.dispatchEvent(event);
  }

  //==========================================================================||
  //                              Event Handlers                              ||
  //==========================================================================||
  paperCheckboxChanged(e: InputEvent, paperID: string) {
    const checkboxElement = e.currentTarget as HTMLInputElement;
    const newSelectedPaperIDs = structuredClone(this.selectedPaperIDs);
    if (checkboxElement.checked) {
      newSelectedPaperIDs.add(paperID);
    } else {
      newSelectedPaperIDs.delete(paperID);
    }

    this.selectedPaperIDs = newSelectedPaperIDs;
    this.notifyParentPaperCount(this.selectedPaperIDs.size);
  }

  selectAllCheckboxChanged(e: InputEvent) {
    const checkboxElement = e.currentTarget as HTMLInputElement;
    if (checkboxElement.checked) {
      const newSelectedPaperIDs = new Set<string>([
        ...this.papers.map(d => d.paperId)
      ]);
      this.selectedPaperIDs = newSelectedPaperIDs;
    } else {
      const newSelectedPaperIDs = new Set<string>();
      this.selectedPaperIDs = newSelectedPaperIDs;
    }

    this.notifyParentPaperCount(this.selectedPaperIDs.size);
  }

  confirmButtonClicked() {
    const event = new Event('confirm-button-clicked', {
      bubbles: true,
      composed: true
    });
    this.dispatchEvent(event);
  }

  //==========================================================================||
  //                             Private Helpers                              ||
  //==========================================================================||

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
            <input
              type="checkbox"
              id="checkbox-${i}"
              .checked=${this.selectedPaperIDs.has(paper.paperId)}
              @change=${(e: InputEvent) => {
                this.paperCheckboxChanged(e, paper.paperId);
              }}
            />
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
        <div class="table-container">
          <table class="paper-table">
            <thead>
              <tr class="header-row">
                <th class="selected-cell header-cell">
                  <input
                    class="paper-checkbox"
                    type="checkbox"
                    .checked=${this.papers.length ===
                    this.selectedPaperIDs.size}
                    @change=${(e: InputEvent) =>
                      this.selectAllCheckboxChanged(e)}
                  />
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

        <div class="footer">
          <button
            class="confirm-button"
            ?disabled=${this.selectedPaperIDs.size === 0}
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
    'recrec-paper-view': RecRecPaperView;
  }
}
