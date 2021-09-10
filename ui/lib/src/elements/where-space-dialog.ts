import { html, css, LitElement } from "lit";
import { state } from "lit/decorators.js";

import { sharedStyles } from "../sharedStyles";
import { contextProvided } from "@lit-labs/context";
import { ScopedElementsMixin } from "@open-wc/scoped-elements";
import { WhereStore } from "../where.store";
import { whereContext, Space, Coord } from "../types";
import { Dialog, TextField, Button, Checkbox, Formfield } from "@scoped-elements/material-web";

/**
 * @element where-space
 */
export class WhereSpaceDialog extends ScopedElementsMixin(LitElement) {

  @state() size : Coord = {x:0,y:0};

  /** Dependencies */
  @contextProvided({ context: whereContext })
  _store!: WhereStore;

  open() {
    const dialog = this.shadowRoot!.getElementById("space-dialog") as Dialog
    dialog.open = true
  }


  private async handleOk(e: any) {
    const name = this.shadowRoot!.getElementById(
      "name-field"
    ) as TextField;
    const url = this.shadowRoot!.getElementById(
      "url-field"
    ) as TextField;
    const valid = url.validity.valid && name.validity.valid
    if (!name.validity.valid) {
      name.reportValidity()
    }
    if (!url.validity.valid) {
      url.reportValidity()
    }
    if (!valid) return

    const multi = this.shadowRoot!.getElementById(
      "multi-chk"
    ) as Checkbox;
    const img = this.shadowRoot!.getElementById("sfc") as HTMLImageElement;

    const space: Space = {
      name: name.value,
      surface: {
        url: url.value,
        size: { y: img.naturalHeight, x: img.naturalWidth },
        data: "[]",
      },
      meta: {
        multi: multi.checked ? "true" : "",
      },
      wheres: [],
    };
    const newSpace = await this._store.addSpace(space);
    this.dispatchEvent(new CustomEvent('space-added', { detail: newSpace, bubbles: true, composed: true }));
    const dialog = this.shadowRoot!.getElementById(
      "space-dialog"
    ) as Dialog;
    dialog.close()
  }

  private async handleSpaceDialog(e: any) {
    const name = this.shadowRoot!.getElementById(
      "name-field"
    ) as TextField;
    const url = this.shadowRoot!.getElementById(
      "url-field"
    ) as TextField;
    const multi = this.shadowRoot!.getElementById(
      "multi-chk"
    ) as Checkbox;
    name.value = "";
    url.value = "";
  }

  handleUrlUpdated(e:Event) {
    const img = this.shadowRoot!.getElementById("sfc") as HTMLImageElement;
    const url = this.shadowRoot!.getElementById(
      "url-field"
    ) as TextField;
    url.setCustomValidity("can't load url")
    img.onload = async () => {
      url.setCustomValidity("")
      this.size ={y:img.naturalHeight, x: img.naturalWidth}
    }
    img.src = url.value;
  }

  render() {
    return html`
<mwc-dialog  id="space-dialog" heading="Space" @closing=${
this.handleSpaceDialog
}>
<div id="thumbnail"><img id="sfc" src="" />${this.size.x} x ${this.size.y}</div>
<mwc-textfield @input=${() => (this.shadowRoot!.getElementById("name-field") as TextField).reportValidity()} id="name-field" minlength="3" maxlength="64" label="Name" autoValidate=true required></mwc-textfield>
<mwc-textfield @input=${this.handleUrlUpdated} id="url-field" label="Image URL" autoValidate=true required></mwc-textfield>
<mwc-formfield label="Multi-wheres per user">
<mwc-checkbox id="multi-chk"></mwc-checkbox>
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
      "mwc-formfield": Formfield,
      "mwc-checkbox": Checkbox,
    };
  }
  static get styles() {
    return [
      sharedStyles,
      css`
#thumbnail {
width: 200px;
float: right;
}
#sfc {
width: 100%;
}
`,
    ];
  }
}
