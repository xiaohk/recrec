import { LitElement, css, unsafeCSS, html, PropertyValues } from 'lit';
import { customElement, property, state, query } from 'lit/decorators.js';
import { styleMap } from 'lit/directives/style-map.js';
import { unsafeHTML } from 'lit/directives/unsafe-html.js';

import componentCSS from './slider.css?inline';

export interface SliderStyleConfig {
  foregroundColor: string;
  backgroundColor: string;
  thumbColor: string;
  alignInner: boolean;
}

/**
 * Slider element.
 *
 */
@customElement('nightjar-slider')
export class NightjarSlider extends LitElement {
  // ===== Class properties ======
  @property({ type: Number })
  min = 0;

  @property({ type: Number })
  max = 1;

  @property({ type: Number })
  curValue: number | null = null;

  @property({ attribute: false })
  styleConfig: SliderStyleConfig | null = null;

  @query('.background-track')
  backgroundTrackElement: HTMLElement | undefined;

  @query('.range-track')
  rangeTrackElement: HTMLElement | undefined;

  @query('#slider-middle-thumb')
  middleThumbElement: HTMLElement | undefined;

  // ===== Lifecycle Methods ======
  constructor() {
    super();
  }

  firstUpdated() {
    if (this.curValue === null) {
      this.curValue = this.min;
    }
    this.syncThumb();
  }

  /**
   * This method is called before new DOM is updated and rendered
   * @param changedProperties Property that has been changed
   */
  willUpdate(changedProperties: PropertyValues<this>) {
    if (changedProperties.has('curValue') && this.curValue !== null) {
      this.syncThumb();
    } else if (changedProperties.has('min')) {
      this.syncThumb();
    } else if (changedProperties.has('max')) {
      this.syncThumb();
    }
  }

  // ===== Custom Methods ======
  initData = async () => {};

  /**
   * Sync thumb position to this.curValue
   */
  syncThumb() {
    if (this.curValue !== null) {
      // Update the thumb to reflect the cur value
      const track = this.backgroundTrackElement;
      const thumb = this.middleThumbElement;
      const rangeTrack = this.rangeTrackElement;

      if (track && thumb && rangeTrack) {
        const thumbBBox = thumb.getBoundingClientRect();
        const trackBBox = track.getBoundingClientRect();

        // Update the thumb and the range track
        const progress = (this.curValue - this.min) / (this.max - this.min);
        const xPos = progress * trackBBox.width - thumbBBox.width / 2;
        thumb.style.left = `${xPos}px`;
        rangeTrack.style.width = `${Math.max(0, xPos)}px`;
      }
    }
  }

  // ===== Event Methods ======
  /**
   * Event handler for the thumb mousedown
   */
  thumbMouseDownHandler(e: MouseEvent | TouchEvent) {
    e.preventDefault();
    e.stopPropagation();

    const thumb = e.target! as HTMLElement;
    if (!thumb.id.includes('thumb')) {
      console.error('Thumb event target is not thumb itself.');
    }

    // const eventBlocker = this.component.querySelector('.grab-blocker')!;
    const track = thumb.parentElement!;
    const rangeTrack = track.querySelector('.range-track') as HTMLElement;

    const thumbBBox = thumb.getBoundingClientRect();
    const trackBBox = track.getBoundingClientRect();

    const trackWidth = trackBBox.width;
    // Need to use focus instead of active because FireFox doesn't treat dragging
    // as active
    thumb.focus();

    const mouseMoveHandler = (e: MouseEvent | TouchEvent) => {
      e.preventDefault();
      e.stopPropagation();

      // Block the mouse event outside the slider
      // eventBlocker.classList.add('activated');

      let pageX = 0;
      if ((e as MouseEvent).pageX) {
        pageX = (e as MouseEvent).pageX;
      } else {
        pageX = (e as TouchEvent).touches[0].pageX;
      }

      const deltaX = pageX - trackBBox.x;
      const progress = Math.min(1, Math.max(0, deltaX / trackWidth));

      // Move the thumb
      thumb.setAttribute('data-curValue', String(progress));

      // Compute the position to move the thumb to
      const xPos = progress * trackBBox.width - thumbBBox.width / 2;
      thumb.style.left = `${xPos}px`;
      rangeTrack.style.width = `${Math.max(0, xPos)}px`;

      // Notify the parent about the change
      const curValue = this.min + (this.max - this.min) * progress;
      const event = new CustomEvent<number>('valueChanged', {
        detail: curValue
      });
      this.dispatchEvent(event);

      // Update the tooltip thumb
      // this.moveTimeSliderThumb(progress);
    };

    const mouseUpHandler = () => {
      document.removeEventListener('mousemove', mouseMoveHandler);
      document.removeEventListener('mouseup', mouseUpHandler);

      // Also handle touch screen
      document.removeEventListener('touchmove', mouseMoveHandler);
      document.removeEventListener('touchend', mouseUpHandler);

      // eventBlocker.classList.remove('activated');
      thumb.blur();
    };

    // Listen to mouse move on the whole page (users can drag outside of the
    // thumb, track, or even the tool!)
    document.addEventListener('mousemove', mouseMoveHandler);
    document.addEventListener('mouseup', mouseUpHandler);

    // Also handle touch screen
    document.addEventListener('touchmove', mouseMoveHandler);
    document.addEventListener('touchend', mouseUpHandler);
  }

  // ===== Templates and Styles ======
  render() {
    const cssVariables = {
      '--foreground-color':
        this.styleConfig?.foregroundColor || 'hsl(174, 100%, 29.41%)',
      '--background-color':
        this.styleConfig?.backgroundColor || 'hsl(174, 41.28%, 78.63%)',
      '--thumb-color': this.styleConfig?.thumbColor || 'hsl(174, 100%, 29.41%)'
    };

    return html`
      <div
        class="slider"
        ?align-inner=${this.styleConfig?.alignInner || false}
        style=${styleMap(cssVariables)}
      >
        <div class="slider-track background-track"></div>
        <div class="slider-track range-track"></div>
        <div
          class="middle-thumb"
          id="slider-middle-thumb"
          tabindex="-1"
          @mousedown=${(e: MouseEvent) => this.thumbMouseDownHandler(e)}
          @touchstart=${(e: TouchEvent) => this.thumbMouseDownHandler(e)}
        >
          <div class="thumb-label thumb-label-middle">
            <span class="thumb-label-span"></span>
          </div>
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
    'nightjar-slider': NightjarSlider;
  }
}
