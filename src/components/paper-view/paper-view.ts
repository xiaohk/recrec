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

    this.papers = await getAllPapersFromAuthor(this.selectedProfile.authorId);
    console.log(this.papers);
  }

  //==========================================================================||
  //                           Templates and Styles                           ||
  //==========================================================================||
  render() {
    return html`
      <div class="paper-view">
        <table class="paper-table">
          <thead>
            <tr>
              <td>Title</td>
              <td>Cited By</td>
              <td>Date</td>
            </tr>
          </thead>
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
