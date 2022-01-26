import {css, html, LitElement} from "lit";
import {query, state} from "lit/decorators.js";

import {sharedStyles} from "../sharedStyles";
import {contextProvided} from "@holochain-open-dev/context";
import {ScopedElementsMixin} from "@open-wc/scoped-elements";
import {WhereStore} from "../where.store";
import { EmojiGroupEntry, whereContext} from "../types";
import {
  Button,
  Dialog,
  IconButton,
  ListItem,
  Select,
  TextField
} from "@scoped-elements/material-web";
import {StoreSubscriber} from "lit-svelte-stores";
import {Picker} from "emoji-picker-element";
import {EMOJI_WIDTH} from "../sharedRender";

/**
 * @element where-emoji-group
 */
export class WhereEmojiGroupDialog extends ScopedElementsMixin(LitElement) {

  @state() _currentUnicodes: string[] = [];

  /** Dependencies */
  @contextProvided({ context: whereContext })
  _store!: WhereStore;

  _groups = new StoreSubscriber(this, () => this._store.emojiGroups);

  /** Private properties */

  _groupToPreload?: EmojiGroupEntry;

  _currentGroup: EmojiGroupEntry | null = null;


  @query('#name-field')
  _nameField!: TextField;


  get emojiPickerElem() : Picker {
    return this.shadowRoot!.getElementById("emoji-picker") as Picker;
  }


  open(emojiGroup?: EmojiGroupEntry) {
    this._groupToPreload = emojiGroup;
    const dialog = this.shadowRoot!.getElementById("emoji-group-dialog") as Dialog
    dialog.open = true
  }

  protected firstUpdated(_changedProperties: any) {
    // super.firstUpdated(_changedProperties);
    this.emojiPickerElem.addEventListener('emoji-click', (event: any ) => {
      const unicode = event?.detail?.unicode
      //console.log("emoji-click: " + unicode)
      const index = this._currentUnicodes.indexOf(unicode);
      if (index <= -1) {
        this._currentUnicodes.push(unicode)
        this.requestUpdate()
      }
    });
  }

  /** preload fields with current emojiGroup values */
  async loadPreset(emojiGroup: EmojiGroupEntry) {
    this._nameField.value = 'Fork of ' + emojiGroup.name;
    this._currentUnicodes = emojiGroup.unicodes
    this._currentGroup = emojiGroup
  }

  private isValid() {
    let isValid: boolean = true;
    // Check name
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


  private createEmojiGroup() {
    /** Create EmojiGroupEntry */
    return {
      name: this._nameField.value,
      description: "",
      unicodes: this._currentUnicodes,
    }
  }

  clearAllFields(e?: any) {
    this._nameField.value = "";
    this._currentUnicodes = [];
  }

  private async handleResetGroup(e: any) {
    this._currentUnicodes = [];
    this.requestUpdate()
  }

  private async handleOk(e: any) {
    if (!this.isValid()) return
    const emojiGroup = this.createEmojiGroup()
    const newGroupEh = await this._store.addEmojiGroup(emojiGroup);
    console.log("newGroupEh: " + newGroupEh)
    this.dispatchEvent(new CustomEvent('emoji-group-added', { detail: newGroupEh, bubbles: true, composed: true }));
    // - Clear all fields
    this.clearAllFields();
    // - Close Dialog
    const dialog = this.shadowRoot!.getElementById("emoji-group-dialog") as Dialog;
    dialog.close()
  }

  private handleDialogOpened(e: any) {
    if (this._groupToPreload) {
      this.loadPreset(this._groupToPreload);
      this._groupToPreload = undefined;
    }
    this.requestUpdate();
  }

  private handleGroupSelect(groupName: string): void {
    console.log("handleGroupSelect: " /*+ emojiGroup.name*/)
    console.log(groupName)
    //this._currentGroup = emojiGroup;
    //this._currentUnicodes = this._currentGroup?.unicodes!
    this.requestUpdate()
  }


  async handleEmojiButtonClick(unicode: string) {
    console.log("handleEmojiButtonClick: " + unicode)
    // Remove first item with that unicode
    const index = this._currentUnicodes.indexOf(unicode);
    if (index > -1) {
      this._currentUnicodes.splice(index, 1);
      this.requestUpdate()
    }
  }

  render() {
    /** Build group list */
    const groups = Object.entries(this._groups.value).map(
      ([key, emojiGroup]) => {
        // if (!emojiGroup.visible) {
        //   return html ``;
        // }
        const currentName = this._currentGroup? this._currentGroup.name : "<none>"
        return html`
          <mwc-list-item class="space-li" .selected=${emojiGroup.name == currentName} value="${emojiGroup.name}"
                          >
            ${emojiGroup.name}
          </mwc-list-item>
          `
      }
    )
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
<mwc-dialog id="emoji-group-dialog" heading="New Emoji Group" @opened=${this.handleDialogOpened}>
  <!-- Name -->
  <mwc-textfield id="name-field" dialogInitialFocus type="text"
                 style="display: block;"
                 @input=${() => (this.shadowRoot!.getElementById("name-field") as TextField).reportValidity()}
                 minlength="3" maxlength="64" label="Name" autoValidate=true required></mwc-textfield>
  <!-- Group Combo box
  <mwc-select outlined id="group-field" label="Existing groups" @closing=${(e:any)=>e.stopPropagation()} @select=${this.handleGroupSelect}>
    ${groups}
  </mwc-select>-->
  <!-- Display Unicode List / Grid -->
  <div style="margin:10px 0px 10px 0px;">
    <div class="unicodes-container">
      ${emojis}
    </div>
  </div>
  <!-- Emoji Picker -->
  <emoji-picker id="emoji-picker" class="light"></emoji-picker>
  <!-- Dialog buttons -->
  <mwc-button id="primary-action-button" raised slot="primaryAction" @click=${this.handleOk}>ok</mwc-button>
  <mwc-button slot="secondaryAction" dialogAction="cancel">cancel</mwc-button>
  <mwc-button slot="secondaryAction" @click=${this.handleResetGroup}>reset</mwc-button>
</mwc-dialog>
`
  }


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
