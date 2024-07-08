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

const MOBILE_MODE = window.screen.width < 768;

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

  @state()
  isCompleted = false;

  lastClickedHeader: '' | 'title' | 'citedBy' | 'year' = '';

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

    this.isCompleted = false;

    let done = false;
    let retry = 3;

    let papers: SemanticPaper[] = [];

    while (!done && retry > 0) {
      try {
        papers = await getAllPapersFromAuthor(this.selectedProfile.authorId);
        done = true;
      } catch (e) {
        await new Promise<void>(resolve => {
          setTimeout(() => {
            resolve();
          }, 1500);
        });
        retry -= 1;
      }
    }

    // Sort the papers by publication date first
    // papers.sort((a, b) => comparePaperDate(b, a));
    // this.lastClickedHeader = 'year';

    // Sort the papers by citation count first
    papers.sort((a, b) => b.citationCount - a.citationCount);
    this.lastClickedHeader = 'citedBy';

    this.papers = papers;

    // Select all papers by default
    const newSelectedPaperIDs = new Set<string>([
      ...papers.map(d => d.paperId)
    ]);
    this.selectedPaperIDs = newSelectedPaperIDs;

    this.notifyParentSelectedPapers(this.selectedPaperIDs);
    this.notifyParentPapers(this.papers);

    this.isCompleted = true;
    // console.log(this.papers);
  }

  formatPaperAuthor(paper: SemanticPaper) {
    const authors = paper.authors.map(d => d.name).join(', ');
    return authors;
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
    this.notifyParentSelectedPapers(this.selectedPaperIDs);
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

    this.notifyParentSelectedPapers(this.selectedPaperIDs);
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
  notifyParentSelectedPapers(selectedPaperIDs: Set<string>) {
    const event = new CustomEvent<Set<string>>('selected-paper-count-updated', {
      bubbles: true,
      composed: true,
      detail: selectedPaperIDs
    });
    this.dispatchEvent(event);
  }

  notifyParentPapers(papers: SemanticPaper[]) {
    const event = new CustomEvent<SemanticPaper[]>('papers-updated', {
      bubbles: true,
      composed: true,
      detail: papers
    });
    this.dispatchEvent(event);
  }

  headerButtonClicked(button: 'title' | 'citedBy' | 'year') {
    // Sort the papers based on the clicked button
    const papers = this.papers.slice();
    switch (button) {
      case 'title': {
        if (this.lastClickedHeader == 'title') {
          papers.sort((a, b) => b.title.localeCompare(a.title));
          this.lastClickedHeader = '';
        } else {
          papers.sort((a, b) => a.title.localeCompare(b.title));
          this.lastClickedHeader = 'title';
        }

        this.papers = papers;
        break;
      }

      case 'citedBy': {
        if (this.lastClickedHeader == 'citedBy') {
          papers.sort((a, b) => a.citationCount - b.citationCount);
          this.lastClickedHeader = '';
        } else {
          papers.sort((a, b) => b.citationCount - a.citationCount);
          this.lastClickedHeader = 'citedBy';
        }

        break;
      }

      case 'year': {
        if (this.lastClickedHeader == 'year') {
          papers.sort((a, b) => comparePaperDate(a, b));
          this.lastClickedHeader = '';
        } else {
          papers.sort((a, b) => comparePaperDate(b, a));
          this.lastClickedHeader = 'year';
        }
        break;
      }

      default: {
        console.error('Unknown sorting order clicked.');
        break;
      }
    }

    this.papers = papers;
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

    // Compile the progress overlay
    const progressRing = html`
      <div class="progress-overlay" ?is-completed=${this.isCompleted}>
        <div class="loader"></div>
        <span class="progress-message">Fetching paper details...</span>
      </div>
    `;

    return html`
      <div class="paper-view">
        ${progressRing}

        <div class="table-container">
          <table class="paper-table">
            <colgroup>
              <col class="col-checkbox" />
              <col class="col-title" />
              <col class="col-citation" />
              <col class="col-date" />
            </colgroup>

            <thead>
              <tr class="header-row">
                <th class="selected-cell header-cell">
                  <input
                    class="paper-checkbox"
                    id="checkbox-all"
                    type="checkbox"
                    .checked=${this.papers.length ===
                    this.selectedPaperIDs.size}
                    @change=${(e: InputEvent) =>
                      this.selectAllCheckboxChanged(e)}
                  />
                  <label for="checkbox-all"></label>
                </th>
                <th class="title-cell header-cell">
                  <button
                    class="header-button"
                    @click=${() => this.headerButtonClicked('title')}
                  >
                    Title
                  </button>
                </th>
                <th
                  class="citation-cell header-cell"
                  @click=${() => this.headerButtonClicked('citedBy')}
                >
                  <button class="header-button">
                    ${MOBILE_MODE ? 'Cited' : 'Cited By'}
                  </button>
                </th>
                <th
                  class="date-cell header-cell"
                  @click=${() => this.headerButtonClicked('year')}
                >
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

const comparePaperDate = (a: SemanticPaper, b: SemanticPaper) => {
  const aDate = a.publicationDate || `${a.year || '0000'}-01-01`;
  const bDate = b.publicationDate || `${b.year || '0000'}-01-01`;
  return aDate.localeCompare(bDate);
};
