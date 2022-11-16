import {css, html, LitElement} from "lit";
import {query, state} from "lit/decorators.js";

import {sharedStyles} from "../sharedStyles";
import {contextProvided} from "@lit-labs/context";
import {ScopedElementsMixin} from "@open-wc/scoped-elements";
import {Button, Dialog, Formfield, ListItem, TextArea, TextField} from "@scoped-elements/material-web";
import {EntryHashB64} from "@holochain-open-dev/core-types";
import { localized, msg } from '@lit/localize';
import {LudothequeViewModel} from "../viewModels/ludotheque.zvm";
import {Coord} from "../viewModels/where.perspective";
import {PlaysetEntry} from "../viewModels/ludotheque.bindings";


/** @element where-playset-dialog */
@localized()
export class WherePlaysetDialog extends ScopedElementsMixin(LitElement) {

  @state() size : Coord = {x:0,y:0};


  /** Dependencies */
  @contextProvided({ context: LudothequeViewModel.context, subscribe:true })
  _ludothequeZvm!: LudothequeViewModel;

  open(playsetEh?: EntryHashB64) {
    this._playsetToPreload = playsetEh;
    const dialog = this.shadowRoot!.getElementById("playset-inner-dialog") as Dialog
    dialog.open = true
  }

  /** Private properties */

  _playsetToPreload?: EntryHashB64;

  @query('#name-field')
  _nameField!: TextField;
  @query('#description-field')
  _descriptionField!: TextArea;

  /** -- Methods -- */

  /** preload fields with current template values */
  loadPreset(playsetEh: EntryHashB64) {
    const playsetToPreload = this._ludothequeZvm.getPlayset(playsetEh);
    this._nameField.value = msg('Fork of') + ' ' + playsetToPreload!.name;
    this._descriptionField.value = playsetToPreload!.description;
  }

  /** */
  clearAllFields() {
    this._nameField.value = "";
    this._descriptionField.value = "";
  }

  /** */
  private isValid() {
    let isValid: boolean = true;
    // Check name
    if (this._nameField) {
      if (!this._nameField.validity.valid) {
        isValid = false;
        this._nameField.reportValidity()
      }
    }
    // Done
    return isValid
  }


  /** Create PlaysetEntry from fields */
  private createEmptyPlayset(): PlaysetEntry {
    return {
      name: this._nameField.value,
      description: this._descriptionField.value,
      templates: [],
      svgMarkers: [],
      emojiGroups: [],
      spaces: [],
    }
  }


  /** */
  private async handleOk(e: any) {
    if (!this.isValid()) return
    const playset = this.createEmptyPlayset()
    //const newPlaysetEh = await this._store.addPlayset(playset);
    console.log("playset: " + playset)
    this.dispatchEvent(new CustomEvent('playset-added', { detail: playset, bubbles: true, composed: true }));
    // - Clear all fields
    this.clearAllFields();
    // - Close Dialog
    const dialog = this.shadowRoot!.getElementById("playset-inner-dialog") as Dialog;
    dialog.close()
  }


  /** */
  private handleDialogOpened(e: any) {
    if (this._playsetToPreload) {
      this.loadPreset(this._playsetToPreload);
      this._playsetToPreload = undefined;
    }
    this.requestUpdate();
  }


  /** */
  render() {
    return html`
<mwc-dialog id="playset-inner-dialog" heading="${msg('New Playset')}" @opened=${this.handleDialogOpened}>
  <mwc-textfield dialogInitialFocus type="text"
                 @input=${() => (this.shadowRoot!.getElementById("name-field") as TextField).reportValidity()}
                 id="name-field" minlength="3" maxlength="64" label="${msg('Name')}" autoValidate=true required></mwc-textfield>
  <mwc-textarea type="text" @input=${() => (this.shadowRoot!.getElementById("description-field") as TextArea).reportValidity()}
                id="description-field" placeholder="<${msg('description')}>" rows="10" cols="60" required></mwc-textarea>
  </mwc-formfield>
  <mwc-button id="primary-action-button" raised slot="primaryAction" @click=${this.handleOk}>${msg('next')}</mwc-button>
  <mwc-button slot="secondaryAction" dialogAction="cancel">${msg('cancel')}</mwc-button>
</mwc-dialog>
`
  }


  /** */
  static get scopedElements() {
    return {
      "mwc-list-item": ListItem,
      "mwc-button": Button,
      "mwc-dialog": Dialog,
      "mwc-textfield": TextField,
      "mwc-textarea": TextArea,
      "mwc-formfield": Formfield,
    };
  }

  /** */
  static get styles() {
    return [
      sharedStyles,
      css`
        mwc-textfield.rounded {
          --mdc-shape-small: 28px;
          width: 110px;
          margin-top:10px;
        }
        #description-field {
          width: 100%;
          margin-top:10px;
          display:block;
        }
`,
    ];
  }
}
