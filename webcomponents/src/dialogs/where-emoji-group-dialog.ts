import {css, html} from "lit";
import {query, state, property} from "lit/decorators.js";
import {sharedStyles} from "../sharedStyles";
import {Button, Dialog, IconButton, ListItem, Select, TextField} from "@scoped-elements/material-web";
import {Picker} from "emoji-picker-element";
import {localized, msg} from '@lit/localize';
import {EmojiGroupEntry} from "../viewModels/playset.bindings";
import {PlaysetZvm} from "../viewModels/playset.zvm";
import {PlaysetPerspective} from "../viewModels/playset.perspective";
import {ZomeElement} from "@ddd-qc/dna-client";


/** @element where-emoji-group */
@localized()
export class WhereEmojiGroupDialog extends ZomeElement<PlaysetPerspective, PlaysetZvm> {
  constructor() {
    super(PlaysetZvm);
  }

  @state() private _currentUnicodes: string[] = [];

  /** Private properties */

  private _groupToPreload?: EmojiGroupEntry;

  private _currentGroup: EmojiGroupEntry | null = null;


  @query('#name-field')
  _nameField!: TextField;


  get emojiPickerElem() : Picker {
    return this.shadowRoot!.getElementById("emoji-picker") as Picker;
  }


  /** */
  open(emojiGroup?: EmojiGroupEntry) {
    this._groupToPreload = emojiGroup;
    const dialog = this.shadowRoot!.getElementById("emoji-group-dialog") as Dialog
    dialog.open = true
  }


  /** */
  private async onEmojiClick(e: any) {
    //console.log("onEmojiClick()", e)
    const unicode = e?.detail?.unicode
    //console.log("emoji-click: " + unicode)
    const index = this._currentUnicodes.indexOf(unicode);
    if (index <= -1) {
      this._currentUnicodes.push(unicode)
      this.requestUpdate()
    }
  }



  /** preload fields with current emojiGroup values */
  async loadPreset(emojiGroup: EmojiGroupEntry) {
    this._nameField.value = msg('Fork of') + ' ' + emojiGroup.name;
    this._currentUnicodes = emojiGroup.unicodes
    this._currentGroup = emojiGroup
  }


  /** */
  private isValid() {
    let isValid: boolean = true;
    /* Check name */
    if (this._nameField) {
      if (!this._nameField.validity.valid) {
        isValid = false;
        this._nameField.reportValidity()
      }
    }
    // FIXME
    // ...
    // Done
    return isValid
  }


  /** */
  private createEmojiGroup(): EmojiGroupEntry {
    return {
      name: this._nameField.value,
      description: "",
      unicodes: this._currentUnicodes,
    }
  }


  /** */
  clearAllFields(e?: any) {
    this._nameField.value = "";
    this._currentUnicodes = [];
  }


  /** */
  private async handleResetGroup(e: any) {
    this._currentUnicodes = [];
    //this.requestUpdate()
  }


  /** */
  private async handleOk(e: any) {
    if (!this.isValid()) return
    // if (!this._playsetZvm) {
    //   console.warn("No ViewModel available in svg-marker-dialog")
    //   return;
    // }
    const emojiGroup = this.createEmojiGroup()
    const newGroupEh = await this._zvm.publishEmojiGroupEntry(emojiGroup);
    console.log("newGroupEh: " + newGroupEh)
    this.dispatchEvent(new CustomEvent('emoji-group-added', { detail: newGroupEh, bubbles: true, composed: true }));
    /* - Clear all fields */
    this.clearAllFields();
    /* - Close Dialog */
    const dialog = this.shadowRoot!.getElementById("emoji-group-dialog") as Dialog;
    dialog.close()
  }


  /** */
  private handleDialogOpened(e: any) {
    if (this._groupToPreload) {
      this.loadPreset(this._groupToPreload);
      this._groupToPreload = undefined;
    }
    this.requestUpdate();
  }


  /** */
  private handleGroupSelect(groupName: string): void {
    console.log("handleGroupSelect: " /*+ emojiGroup.name*/)
    console.log(groupName)
    //this._currentGroup = emojiGroup;
    //this._currentUnicodes = this._currentGroup?.unicodes!
    this.requestUpdate()
  }


  /** */
  async handleEmojiButtonClick(unicode: string) {
    console.log("handleEmojiButtonClick: " + unicode)
    // Remove first item with that unicode
    const index = this._currentUnicodes.indexOf(unicode);
    if (index > -1) {
      this._currentUnicodes.splice(index, 1);
      this.requestUpdate()
    }
  }


  /** */
  render() {
    // @request-selected=${this.handleGroupSelect(emojiGroup)}
    /** Build emoji list */
    const emojis = Object.entries(this._currentUnicodes).map(
      ([key, unicode]) => {
        return html`
          <mwc-icon-button class="unicode-button" @click=${(e:any) => this.handleEmojiButtonClick(unicode)} >${unicode}</mwc-icon-button>
          `
      }
    )
    /** Render */
    return html`
<mwc-dialog id="emoji-group-dialog" heading="${msg('New Emoji Group')}" @opened=${this.handleDialogOpened}>
  <!-- Name -->
  <mwc-textfield id="name-field" dialogInitialFocus type="text"
                 style="display: block;"
                 @input=${() => (this.shadowRoot!.getElementById("name-field") as TextField).reportValidity()}
                 minlength="3" maxlength="64" label="${msg('Name')}" autoValidate=true required></mwc-textfield>
  <!-- Display Unicode List / Grid -->
  <div style="margin:10px 0px 10px 0px;">
    <div class="unicodes-container">
      ${emojis}
    </div>
  </div>
  <!-- Emoji Picker -->
  <emoji-picker id="emoji-picker" class="light" @emoji-click=${this.onEmojiClick}></emoji-picker>
  <!-- Dialog buttons -->
  <mwc-button id="primary-action-button" raised slot="primaryAction" @click=${this.handleOk}>${msg('ok')}</mwc-button>
  <mwc-button slot="secondaryAction" dialogAction="cancel">${msg('cancel')}</mwc-button>
  <mwc-button slot="secondaryAction" @click=${this.handleResetGroup}>${msg('reset')}</mwc-button>
</mwc-dialog>
`
  }


  /** */
  static get scopedElements() {
    return {
      "mwc-select": Select,
      "mwc-list-item": ListItem,
      "mwc-button": Button,
      "mwc-dialog": Dialog,
      "mwc-textfield": TextField,
      "emoji-picker": customElements.get('emoji-picker'),
      "mwc-icon-button": IconButton,
    };
  }

//--font-family: "Apple SvgMarker AnyEmoji","Segoe UI AnyEmoji","Segoe UI Symbol","Twemoji Mozilla","Noto SvgMarker AnyEmoji","EmojiOne SvgMarker","Android AnyEmoji",sans-serif

  /** */
  static get styles() {
    return [
      sharedStyles,
      css`
        emoji-picker {
          width: auto;
          height: 360px;
        }
        mwc-textfield {
          margin-top: 5px;
        }
        mwc-textfield.rounded {
          --mdc-shape-small: 28px;
          width: 110px;
          margin-top:10px;
        }
      `
    ];
  }
}
