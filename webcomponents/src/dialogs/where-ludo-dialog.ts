import {html, css, LitElement} from "lit";
import { state } from "lit/decorators.js";
import { sharedStyles } from "../sharedStyles";
import { localized, msg } from '@lit/localize';

import "@material/mwc-dialog";
import {Dialog} from "@material/mwc-dialog";
import "@material/mwc-textfield";
import {TextField} from "@material/mwc-textfield";
import "@material/mwc-button";


/** @element where-ludo-dialog */
@localized()
export class WhereLudoDialog extends LitElement {

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
    this.dispatchEvent(new CustomEvent('add-ludotheque', { detail: {uuid: field.value, cloneName: field.value}, bubbles: true, composed: true }));
    field.value = "";
    /** Close Dialog */
    const dialog = this.shadowRoot!.getElementById("clone-ludo-dialog") as Dialog;
    dialog.close();
  }


  /** */
  render() {
    console.log("<where-clone-ludo-dialog> render()");

    return html`
      <mwc-dialog id="clone-ludo-dialog" heading="${msg('Connect to Ludotheque')}" @opened=${() => {
        this.requestUpdate();
        const field = this.shadowRoot!.getElementById("new-clone-name-field") as TextField;
        field.focus();
      }}>
        <mwc-textfield outlined style="margin-left:25px" type="text" id="new-clone-name-field" label="${msg('Name')}"></mwc-textfield>
        <mwc-button id="primary-action-button" raised slot="primaryAction" @click=${this.handleOk}>${msg('ok')}</mwc-button>
        <mwc-button slot="secondaryAction" dialogAction="cancel">${msg('cancel')}</mwc-button>
      </mwc-dialog>
    `;
  }


  // /** */
  // static get scopedElements() {
  //   return {
  //     "mwc-dialog": Dialog,
  //     "mwc-textfield": TextField,
  //     "mwc-button": Button,
  //   };
  // }


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
