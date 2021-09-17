import { html, css, LitElement } from "lit";
import { state, query } from "lit/decorators.js";

import { sharedStyles } from "../sharedStyles";
import { contextProvided } from "@lit-labs/context";
import { ScopedElementsMixin } from "@open-wc/scoped-elements";
import { WhereStore } from "../where.store";
import { whereContext, Space, Coord, TemplateEntry } from "../types";
import { Dialog, TextField, Button, Checkbox, Formfield, TextArea } from "@scoped-elements/material-web";

/**
 * @element where-template
 */
export class WhereTemplateDialog extends ScopedElementsMixin(LitElement) {

  @state() size : Coord = {x:0,y:0};

  /** Dependencies */
  @contextProvided({ context: whereContext })
  _store!: WhereStore;

  open() {
    const dialog = this.shadowRoot!.getElementById("template-dialog") as Dialog
    dialog.open = true
  }

  /** Private properties */
  @query('#name-field')
  _nameField!: TextField;
  @query('#surface-field')
  _surfaceField!: TextArea;

  private async handleOk(e: any) {
    let valid = this._nameField.validity.valid
    if (!this._nameField.validity.valid) {
      this._nameField.reportValidity()
    }
    // check surface description validity
    try {
      JSON.parse(this._surfaceField.value)
      this._surfaceField.setCustomValidity("OK")
      this._surfaceField.reportValidity()
    } catch (e) {
      this._surfaceField.setCustomValidity("Invalid JSON: " + e)
      this._surfaceField.reportValidity()
      valid = false;
    }
    if (!valid) return

    const template: TemplateEntry = {
      name: this._nameField.value,
      surface: this._surfaceField.value,
    };
    const newTemplate = await this._store.addTemplate(template);
    console.log("newTemplate: " + newTemplate)
    this.dispatchEvent(new CustomEvent('template-added', { detail: newTemplate, bubbles: true, composed: true }));
    const dialog = this.shadowRoot!.getElementById(
      "template-dialog"
    ) as Dialog;
    dialog.close()
  }

  private async handleTemplateDialog(e: any) {
    this._nameField.value = "";
    this._surfaceField.value = "";
  }

  // handleSurfaceUpdated(e:Event) {
  //   this._urlField.setCustomValidity("can't load url")
  //   this._surfaceImg.onload = async () => {
  //     this._urlField.setCustomValidity("")
  //     this.size ={y:this._surfaceImg.naturalHeight, x: this._surfaceImg.naturalWidth}
  //   }
  //   this._surfaceImg.src = this._urlField.value;
  // }

  render() {
    return html`
<mwc-dialog  id="template-dialog" heading="Template" @closing=${
this.handleTemplateDialog
}>
<mwc-textfield @input=${() => (this.shadowRoot!.getElementById("name-field") as TextField).reportValidity()}
               id="name-field" minlength="3" maxlength="64" label="Name" autoValidate=true required></mwc-textfield>
  <mwc-textarea @input=${() => (this.shadowRoot!.getElementById("surface-field") as TextField).reportValidity()}
                id="surface-field" placeholder="JSON description here..." value="{\n\n}" rows="10" cols="60" required></mwc-textarea>
  </mwc-formfield>
<mwc-button id="primary-action-button" slot="primaryAction" @click=${this.handleOk}>ok</mwc-button>
<mwc-button slot="secondaryAction"  dialogAction="cancel">cancel</mwc-button>
</mwc-dialog>
`
  }


  static get scopedElements() {
    return {
      "mwc-button": Button,
      "mwc-dialog": Dialog,
      "mwc-textfield": TextField,
      "mwc-textarea": TextArea,
      "mwc-formfield": Formfield,
    };
  }
  static get styles() {
    return [
      sharedStyles,
      css`
        #surface-field {
          width: 100%;
        }
`,
    ];
  }
}
