import { html, css, LitElement } from "lit";
import { state, query } from "lit/decorators.js";
import { sharedStyles } from "../sharedStyles";
import { contextProvided } from "@lit-labs/context";
import { ScopedElementsMixin } from "@open-wc/scoped-elements";
import { WhereStore } from "../where.store";
import {whereContext, Space, } from "../types";
import {
  Dialog,
  Button,
  CheckListItem,
  List,
} from "@scoped-elements/material-web";
import {StoreSubscriber} from "lit-svelte-stores";


/**
 *
 */
export class WhereArchiveDialog extends ScopedElementsMixin(LitElement) {

  /** Dependencies */
  @contextProvided({ context: whereContext })
  _store!: WhereStore;

  open() {
    const dialog = this.shadowRoot!.getElementById("archive-dialog") as Dialog
    dialog.open = true
  }


  /** Private properties */
  _spaces = new StoreSubscriber(this, () => this._store.spaces);

  @query('#space-list')
  _spaceList!: List;


  /** Methods */

  private async handleOk(e: any) {
    // - Check for changes in visible status for each space
    let changed = [];
    for (const item of this._spaceList.items) {
      const spaceEh = item.value;
      const visible = !item.selected;
      if (this._spaces.value[spaceEh].visible != visible) {
        changed.push(spaceEh)
        if (visible) {
          await this._store.unhideSpace(spaceEh)
        } else {
          await this._store.hideSpace(spaceEh)
        }
      }
    }
    // - Close Dialog
    this.dispatchEvent(new CustomEvent('archive-update', { detail: changed, bubbles: true, composed: true }));
    const dialog = this.shadowRoot!.getElementById("archive-dialog") as Dialog;
    dialog.close()
  }


  private handleDialogOpened(e: any) {
    this.requestUpdate();
  }


  render() {
    return html`
<mwc-dialog id="archive-dialog" heading="Archived Spaces" @opened=${this.handleDialogOpened}>
<mwc-list id="space-list" multi>
  ${Object.entries(this._spaces.value).map(
    ([key, space]) => html`
      <mwc-check-list-item
        left
        value="${key}"
        .selected=${!space.visible}>
            ${space.name}
      </mwc-check-list-item>
    `
  )}
</mwc-list>
<mwc-button id="primary-action-button" slot="primaryAction" @click=${this.handleOk}>ok</mwc-button>
<mwc-button slot="secondaryAction" dialogAction="cancel">cancel</mwc-button>
</mwc-dialog>
`
  }


  static get scopedElements() {
    return {
      "mwc-dialog": Dialog,
      "mwc-check-list-item": CheckListItem,
      "mwc-list": List,
      "mwc-button": Button,
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
`,
    ];
  }
}
