import { html, css, LitElement } from "lit";

import { sharedStyles } from "../sharedStyles";
import { contextProvided } from "@lit-labs/context";
import { ScopedElementsMixin } from "@open-wc/scoped-elements";
import { WhereStore } from "../where.store";
import { whereContext, Space } from "../types";
import { Dialog, TextField, Button, Checkbox, Formfield } from "@scoped-elements/material-web";

/**
 * @element where-space
 */
export class WhereSpaceDialog extends ScopedElementsMixin(LitElement) {

  /** Dependencies */
  @contextProvided({ context: whereContext })
  _store!: WhereStore;

  open() {
    const dialog = this.shadowRoot!.getElementById("space-dialog") as Dialog
    dialog.open = true
  }

  private async handleSpaceDialog(e: any) {
    const name = this.shadowRoot!.getElementById(
      "space-dialog-name"
    ) as TextField;
    const url = this.shadowRoot!.getElementById(
      "space-dialog-url"
    ) as TextField;
    const multi = this.shadowRoot!.getElementById(
      "space-dialog-multi"
    ) as Checkbox;
    if (e.detail.action == "ok") {
      const img = this.shadowRoot!.getElementById("sfc") as HTMLImageElement;
      img.onload = async () => {
        const space: Space = {
          name: name.value,
          surface: {
            url: url.value,
            size: { x: img.naturalHeight, y: img.naturalWidth },
            data: "[]",
          },
          meta: {
            multi: multi.checked ? "true" : "",
          },
          wheres: [],
        };
        const newSpace = await this._store.addSpace(space);
        this.dispatchEvent(new CustomEvent('space-added', { detail: newSpace, bubbles: true, composed: true }));
        name.value = "";
        url.value = "";
      };
      img.src = url.value;
    } else {
      name.value = "";
      url.value = "";
    }
  }

  handleUrlUpdated(e:Event) {
    console.log(e)
  }

  render() {
    return html`
<mwc-dialog  id="space-dialog" heading="Space" @closing=${
this.handleSpaceDialog
}>
<mwc-textfield id="space-dialog-name" minlength="3" maxlength="64" placeholder="Name" required></mwc-textfield>
<mwc-textfield @input=${this.handleUrlUpdated} id="space-dialog-url" placeholder="Image URL" required></mwc-textfield>
<mwc-formfield label="Multi-wheres per user">
<mwc-checkbox id="space-dialog-multi"></mwc-checkbox>
</mwc-formfield>
<mwc-button slot="primaryAction" dialogAction="ok">ok</mwc-button>
<mwc-button slot="secondaryAction"  dialogAction="cancel">cancel</mwc-button>
<img id="sfc" src="" />
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
#sfc {
width: 200px;
}
`,
    ];
  }
}
