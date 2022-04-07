import { html, css, LitElement } from "lit";
import { state, query } from "lit/decorators.js";
import { sharedStyles } from "../sharedStyles";
import { contextProvided } from "@holochain-open-dev/context";
import { ScopedElementsMixin } from "@open-wc/scoped-elements";
import { WhereStore } from "../where.store";
import {whereContext} from "../types";
import {
  Dialog,
  Button,
  CheckListItem,
  List,
} from "@scoped-elements/material-web";
import {StoreSubscriber} from "lit-svelte-stores";


/**
 * @element where-archive-dialog
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
  _plays = new StoreSubscriber(this, () => this._store?.plays);

  @query('#space-list')
  _spaceList!: List;


  /** Methods */

  private async handleOk(e: any) {
    // - Check for changes in visible status for each play
    let changed = [];
    for (const item of this._spaceList.items) {
      const spaceEh = item.value;
      const visible = !item.selected;
      if (this._plays.value[spaceEh].visible != visible) {
        changed.push(spaceEh)
        if (visible) {
          await this._store.unhidePlay(spaceEh)
        } else {
          await this._store.hidePlay(spaceEh)
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
  ${Object.entries(this._plays.value).map(
    ([key, play]) => html`
      <mwc-check-list-item
        left
        value="${key}"
        .selected=${!play.visible}>
            ${play.space.name}
      </mwc-check-list-item>
    `
  )}
</mwc-list>
<mwc-button id="primary-action-button" raised slot="primaryAction" @click=${this.handleOk}>ok</mwc-button>
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
