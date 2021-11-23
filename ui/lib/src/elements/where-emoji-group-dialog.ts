import {css, html, LitElement} from "lit";
import {query} from "lit/decorators.js";

import {sharedStyles} from "../sharedStyles";
import {contextProvided} from "@lit-labs/context";
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

/**
 * @element where-emoji-group
 */
export class WhereEmojiGroupDialog extends ScopedElementsMixin(LitElement) {
//
//   /** Dependencies */
//   @contextProvided({ context: whereContext })
//   _store!: WhereStore;
//
//   _groups = new StoreSubscriber(this, () => this._store.emojiGroups);
//
//   /** Private properties */
//
//   _groupToPreload?: EmojiGroupEntry;
//
//   _currentGroup: EmojiGroupEntry | null = null;
//
//   _currentUnicodes: string[] = [];
//
//
//   @query('#name-field')
//   _nameField!: TextField;
//   @query('#group-field')
//   _typeField!: Select;
//
//
  open(emojiGroup?: EmojiGroupEntry) {
    //this._groupToPreload = emojiGroup;
    const dialog = this.shadowRoot!.getElementById("emoji-group-dialog") as Dialog
    dialog.open = true
  }
//
//   /** preload fields with current emojiGroup values */
//   async loadPreset(emojiGroup: EmojiGroupEntry) {
//     this._nameField.value = 'Fork of ' + emojiGroup.name;
//     this._typeField.value = emojiGroup.name;
//     this._currentUnicodes = emojiGroup.unicodes
//     this._currentGroup = emojiGroup
//   }
//
//   private isValid() {
//     let isValid: boolean = true;
//     // Check name
//     if (this._nameField) {
//       if (!this._nameField.validity.valid) {
//         isValid = false;
//         this._nameField.reportValidity()
//       }
//     }
//     // FIXME
//     // ...
//     // Done
//     return isValid
//   }
//
//
//   private createEmojiGroup() {
//     /** Create EmojiGroupEntry */
//     return {
//       name: this._nameField.value,
//       description: "",
//       unicodes: this._currentUnicodes,
//     }
//   }
//
//   clearAllFields(e?: any) {
//     this._nameField.value = "";
//   }
//
//   private async handleResetGroup(e: any) {
//     if (!this.isValid()) return
//     this.requestUpdate()
//   }
//
//   private async handleOk(e: any) {
//     if (!this.isValid()) return
//     const emojiGroup = this.createEmojiGroup()
//     const newGroupEh = await this._store.addEmojiGroup(emojiGroup);
//     console.log("newGroupEh: " + newGroupEh)
//     this.dispatchEvent(new CustomEvent('emoji-group-added', { detail: newGroupEh, bubbles: true, composed: true }));
//     // - Clear all fields
//     this.clearAllFields();
//     // - Close Dialog
//     const dialog = this.shadowRoot!.getElementById("emoji-group-dialog") as Dialog;
//     dialog.close()
//   }
//
//   private handleDialogOpened(e: any) {
//     if (this._groupToPreload) {
//       this.loadPreset(this._groupToPreload);
//       this._groupToPreload = undefined;
//     }
//     this.requestUpdate();
//   }
//
//   private handleGroupSelect(event: any): void {
//     console.log("handleGroupSelect:")
//     console.log(event)
//     this._currentGroup = event.details.value;
//   }
//
//   render() {
//
//     console.log("render EmojiGroup-dialog")
//
//     /** Build group list */
//     const groups = Object.entries(this._groups.value).map(
//       ([key, emojiGroup]) => {
//         // if (!emojiGroup.visible) {
//         //   return html ``;
//         // }
//         const currentName = this._currentGroup? this._currentGroup.name : "<none>"
//         return html`
//           <mwc-list-item class="space-li" .selected=${emojiGroup.name == currentName} value="${emojiGroup.name}"
//                          @request-selected=${this.handleGroupSelect} >
//             ${emojiGroup.name}
//           </mwc-list-item>
//           `
//       }
//     )
//     console.log("render EmojiGroup-dialog 2")
//
//     return html`
// <mwc-dialog id="emoji-group-dialog" heading="Emoji Groups" @opened=${this.handleDialogOpened}>
//   <!-- Name -->
//   <mwc-textfield dialogInitialFocus type="text"
//                  @input=${() => (this.shadowRoot!.getElementById("name-field") as TextField).reportValidity()}
//                  id="name-field" minlength="3" maxlength="64" label="Name" autoValidate=true required></mwc-textfield>
//   <!-- Group Combo box -->
//   <mwc-select required id="group-field" label="Type" @select=${this.handleGroupSelect}>
//     ${groups}
//   </mwc-select>
//   <!-- Display Unicode List / Grid -->
//   <div style="font-size: 32px;">
//     <mwc-icon-button>😀</mwc-icon-button>
//   </div>
//   <!-- Emoji Picker -->
//   <emoji-picker id="edit-location-emoji" class="light"></emoji-picker>
//   <!-- Dialog buttons -->
//   <mwc-button id="primary-action-button" slot="primaryAction" @click=${this.handleOk}>ok</mwc-button>
//   <mwc-button slot="secondaryAction" dialogAction="cancel">cancel</mwc-button>
//   <mwc-button slot="secondaryAction" @click=${this.handleResetGroup}>reset</mwc-button>
// </mwc-dialog>
// `
//   }

  render() {
    return html`<mwc-dialog id="emoji-group-dialog" heading="Emoji Groups">
    <mwc-button id="primary-action-button" slot="primaryAction">ok</mwc-button>
    </mwc-dialog>`
  }

  static get scopedElements() {
    return {
      //"mwc-select": Select,
      //"mwc-list-item": ListItem,
      "mwc-button": Button,
      "mwc-dialog": Dialog,
      //"mwc-textfield": TextField,
      //"emoji-picker": customElements.get('emoji-picker'),
      //"mwc-icon-button": IconButton,
    };
  }

  static get styles() {
    return [
      sharedStyles,
      css`
        mwc-textfield.rounded {
          --mdc-shape-small: 28px;
          width: 110px;
          margin-top:10px;
        }
      `
    ];
  }
}
