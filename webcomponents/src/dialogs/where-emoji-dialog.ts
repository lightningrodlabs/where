import {css, html, LitElement} from "lit";
import {state} from "lit/decorators.js";
import {sharedStyles} from "../sharedStyles";
import {ScopedElementsMixin} from "@open-wc/scoped-elements";
import {Button, Dialog, IconButton, TextField} from "@scoped-elements/material-web";
import {Picker} from "emoji-picker-element";
import {EMOJI_WIDTH} from "../sharedRender";
import { localized, msg } from '@lit/localize';

/**
 * @element where-emoji-dialog
 */
@localized()
export class WhereEmojiDialog extends ScopedElementsMixin(LitElement) {

  @state() private _currentEmoji: string = '';
  private _emojiToPreload?: string;

  get emojiPickerElem() : Picker {
    return this.shadowRoot!.getElementById("emoji-picker") as Picker;
  }

  get emojiPreviewElem() : HTMLElement {
    return this.shadowRoot!.getElementById("emoji-preview") as HTMLElement;
  }

  /** */
  open(emoji?: string) {
    this._emojiToPreload = emoji;
    const dialog = this.shadowRoot!.getElementById("emoji-dialog") as Dialog
    dialog.open = true
  }

  /** */
  protected firstUpdated(_changedProperties: any) {
    // super.firstUpdated(_changedProperties);
    this.emojiPickerElem.addEventListener('emoji-click', (event: any) => {
      const unicode = event?.detail?.unicode
      //console.log("emoji-click: " + unicode)
      if (unicode) {
        this._currentEmoji = unicode
        this.emojiPreviewElem.innerHTML = unicode
        this.requestUpdate()
      }
    });
  }

  /** */
  async loadPreset(emoji: string) {
    this._currentEmoji = emoji
  }

  /** */
  private isValid() {
    let isValid: boolean = true;
    /* Check emoji */
    if (this.emojiPreviewElem) {
      if (this.emojiPreviewElem.innerHTML == '') {
        isValid = false;
      }
    }
    /** Done */
    return isValid
  }


  /** */
  clearAllFields(e?: any) {
    this._currentEmoji = "";
  }


  /** */
  private async handleOk(e: any) {
    if (!this.isValid()) return
    this.dispatchEvent(new CustomEvent('emoji-selected', { detail: this._currentEmoji, bubbles: true, composed: true }));
    this.clearAllFields();
    // - Close Dialog
    const dialog = this.shadowRoot!.getElementById("emoji-dialog") as Dialog;
    dialog.close()
  }


  /** */
  private handleDialogOpened(e: any) {
    if (this._emojiToPreload) {
      this.loadPreset(this._emojiToPreload);
      this._emojiToPreload = undefined;
    }
    this.requestUpdate();
  }


  /** */
  render() {
    return html`
<mwc-dialog id="emoji-dialog" heading="${msg('Pick Emoji')}" @opened=${this.handleDialogOpened}>
  <!-- Emoji -->
  <div id="emoji-preview-field">
    <span style="margin:10px;">${msg('Emoji')}</span>
    <div id="emoji-preview"></div>
  </div>
  <!-- Emoji Picker -->
  <emoji-picker id="emoji-picker" class="light"></emoji-picker>
  <!-- Dialog buttons -->
  <mwc-button id="primary-action-button" raised slot="primaryAction" @click=${this.handleOk}>${msg('ok')}</mwc-button>
  <mwc-button slot="secondaryAction" dialogAction="cancel">${msg('cancel')}</mwc-button>
</mwc-dialog>
`
  }


  static get scopedElements() {
    return {
      "mwc-button": Button,
      "mwc-dialog": Dialog,
      "mwc-textfield": TextField,
      "emoji-picker": customElements.get('emoji-picker'),
      "mwc-icon-button": IconButton,
    };
  }


  static get styles() {
    return [
      sharedStyles,
      css`
        emoji-picker {
          width: auto;
          height: 360px;
        }
        #emoji-preview-field {
          display: inline-flex;
          line-height: 40px;
          background-color: whitesmoke;
          width: 100%;
          margin-top: 5px;
          color: rgba(0, 0, 0, 0.6);
        }
        #emoji-preview {
          font-size: ${EMOJI_WIDTH}px;
          display:inline-block;
          margin-top:10px;
          color:black;
        }
      `
    ];
  }
}
