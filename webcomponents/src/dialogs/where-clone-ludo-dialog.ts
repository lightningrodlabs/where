import {html, css, LitElement} from "lit";
import { state } from "lit/decorators.js";
import { sharedStyles } from "../sharedStyles";
import {Dialog, Button, TextField} from "@scoped-elements/material-web";
import { localized, msg } from '@lit/localize';
import {ScopedElementsMixin} from "@open-wc/scoped-elements";


/** @element where-archive-dialog */
@localized()
export class WhereCloneLudoDialog extends ScopedElementsMixin(LitElement) {

  /** */
  open() {
    const dialog = this.shadowRoot!.getElementById("clone-ludo-dialog") as Dialog
    dialog.open = true
  }


  /** Methods */

  /** */
  private async handleOk(e: any) {
    /** Get name value */
    const field = this.shadowRoot!.getElementById("new-clone-name-field") as TextField;
    console.log("<where-clone-ludo-dialog> OK", field.value, field);
    this.dispatchEvent(new CustomEvent('add-ludotheque', { detail: field.value, bubbles: true, composed: true }));
    field.value = "";
    /** Close Dialog */
    const dialog = this.shadowRoot!.getElementById("clone-ludo-dialog") as Dialog;
    dialog.close();
  }


  /** */
  private handleDialogOpened(e: any) {
    this.requestUpdate();
  }


  /** */
  render() {
    console.log("<where-clone-ludo-dialog> render()");

    return html`
      <mwc-dialog id="clone-ludo-dialog" heading="${msg('Connect to Ludotheque')}" @opened=${this.handleDialogOpened}>
        <mwc-textfield outlined style="margin-left:25px" type="text" id="new-clone-name-field" label="${msg('Name')}"></mwc-textfield>
        <mwc-button id="primary-action-button" raised slot="primaryAction" @click=${this.handleOk}>${msg('ok')}</mwc-button>
        <mwc-button slot="secondaryAction" dialogAction="cancel">${msg('cancel')}</mwc-button>
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
