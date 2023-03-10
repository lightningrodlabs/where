import {html, css, LitElement} from "lit";
import { state } from "lit/decorators.js";
import { sharedStyles } from "../sharedStyles";
import {Dialog, Button, TextField} from "@scoped-elements/material-web";
import { localized, msg } from '@lit/localize';
import {ScopedElementsMixin} from "@open-wc/scoped-elements";


/** @element where-clone-ludo-dialog */
@localized()
export class WhereCloneLudoDialog extends ScopedElementsMixin(LitElement) {

  private _uuid?: string;

  /** */
  open() {
    const dialog = this.shadowRoot!.getElementById("antichambre-dialog") as Dialog
    dialog.open = true
  }


  /** -- Getters -- */

  get antichambreDialog() : Dialog {
    return this.shadowRoot!.getElementById("antichambre-dialog") as Dialog;
  }
  get enterCodeDialog() : Dialog {
    return this.shadowRoot!.getElementById("enter-code-dialog") as Dialog;
  }
  get setNameDialog() : Dialog {
    return this.shadowRoot!.getElementById("set-name-dialog") as Dialog;
  }
  get createNewDialog() : Dialog {
    return this.shadowRoot!.getElementById("create-new-dialog") as Dialog;
  }
  get showCodeDialog() : Dialog {
    return this.shadowRoot!.getElementById("show-code-dialog") as Dialog;
  }


  /** Methods */

  /** */
  private async handleCreateSelected(e: any) {
    this.antichambreDialog.close();
    this.createNewDialog.open = true;
  }


  /** */
  private async handleCodeSelected(e: any) {
    this.antichambreDialog.close();
    this.enterCodeDialog.open = true;
  }


  /** */
  private async handleJoinLibrary(e: any) {
    const field = this.shadowRoot!.getElementById("uuid-field") as TextField;
    console.log("<where-clone-ludo-dialog> handleJoinLibrary", field.value, field);
    const v4Regex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-5][0-9a-f]{3}-[089ab][0-9a-f]{3}-[0-9a-f]{12}$/i
    const isValid = v4Regex.test(field.value)
    if (!isValid) {
      field.helper = msg("Invalid UUID string");
      return;
    }
    this._uuid = field.value;
    field.value = '';
    this.enterCodeDialog.close();
    this.setNameDialog.open = true;
  }


  /** */
  private async handleSetNameOk(e: any) {
    const field = this.shadowRoot!.getElementById("set-name-field") as TextField;
    const isValid = field.value.length >= 2;
    if (!isValid) {
      //field.helper = msg("min. 2 chars");
      return;
    }
    this.dispatchEvent(new CustomEvent('add-ludotheque', { detail: {uuid: this._uuid, cloneName: field.value}, bubbles: true, composed: true }));
    this.setNameDialog.close();
  }


  /** */
  private async handleCreate(e: any) {
    /** Get name value */
    const field = this.shadowRoot!.getElementById("new-clone-name-field") as TextField;
    console.log("<where-clone-ludo-dialog> handleCreate", field.value, field);
    const isValid = field.value.length >= 2;
    if (!isValid) {
      //field.helper = msg("min. 2 chars");
      return;
    }
    this._uuid = self.crypto.randomUUID();
    this.dispatchEvent(new CustomEvent('add-ludotheque', { detail: {uuid: this._uuid, cloneName: field.value}, bubbles: true, composed: true }));
    field.value = "";
    /** Close Dialog */
    this.createNewDialog.close();
    this.showCodeDialog.open = true;
  }


  /** */
  private async handleOk(e: any) {
    this._uuid = undefined;
    this.showCodeDialog.close();
  }


  /** */
  private handleDialogOpened(e: any) {
    this.requestUpdate();
  }


  /** */
  render() {
    console.log("<where-clone-ludo-dialog> render()");

    return html`
      <mwc-dialog id="antichambre-dialog" heading="${msg('Add Library')}" @opened=${this.handleDialogOpened}>
        <mwc-button id="primary-action-button" slot="primaryAction" @click=${this.handleCreateSelected}>${msg('Create new')}</mwc-button>
        <mwc-button slot="primaryAction" @click=${this.handleCodeSelected}>${msg('Enter code')}</mwc-button>
      </mwc-dialog>
      <mwc-dialog id="enter-code-dialog" heading="${msg('Add Library: Enter code')}" @opened=${() => {
        this.requestUpdate();
        const field = this.shadowRoot!.getElementById("uuid-field") as TextField;
        field.focus();
      }}>
        <mwc-textfield required helperPersistent outlined style="min-width: 500px;" type="text" id="uuid-field" label="UUID"></mwc-textfield>
        <mwc-button id="primary-action-button" slot="primaryAction" @click=${this.handleJoinLibrary}>${msg('join')}</mwc-button>
        <mwc-button slot="secondaryAction" dialogAction="cancel">${msg('cancel')}</mwc-button>
      </mwc-dialog>
      <mwc-dialog id="set-name-dialog" heading="${msg('Add Library: Choose name')}" @opened=${() => {
        this.requestUpdate();
        const field = this.shadowRoot!.getElementById("set-name-field") as TextField;
        field.focus();
      }}>
        <mwc-textfield autoValidate required min="2" helperPersistent helper="${msg("min. 2 characters")}"outlined type="text" id="set-name-field" label="${msg('Name')}"></mwc-textfield>
        <mwc-button id="primary-action-button" raised slot="primaryAction" @click=${this.handleSetNameOk}>${msg('create')}</mwc-button>
      </mwc-dialog>

      <mwc-dialog id="create-new-dialog" heading="${msg('Add Library: Create new')}" @opened=${() => {
          this.requestUpdate();
          const field = this.shadowRoot!.getElementById("new-clone-name-field") as TextField;
          field.focus();
        }}>
        <mwc-textfield autoValidate required min="2" helperPersistent helper="${msg("min. 2 characters")}"outlined type="text" id="new-clone-name-field" label="${msg('Name')}"></mwc-textfield>
        <mwc-button id="primary-action-button" raised slot="primaryAction" @click=${this.handleCreate}>${msg('create')}</mwc-button>
        <mwc-button slot="secondaryAction" dialogAction="cancel">${msg('cancel')}</mwc-button>
      </mwc-dialog>

      <mwc-dialog id="show-code-dialog" heading="${msg('Add Library: Create New confirmed')}" @opened=${this.handleDialogOpened}>
        <mwc-textfield outlined .value="${this._uuid}" style="min-width: 500px;" type="text" id="show-uuid-field" label="UUID"></mwc-textfield>
        <mwc-button id="primary-action-button" raised slot="primaryAction" @click=${this.handleOk}>${msg('ok')}</mwc-button>
      </mwc-dialog>
    `;
  }


  /** */
  static get scopedElements() {
    return {
      "mwc-dialog": Dialog,
      "mwc-textfield": TextField,
      "mwc-button": Button,
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
`,
    ];
  }
}
