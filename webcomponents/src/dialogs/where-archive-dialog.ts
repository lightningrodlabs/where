import { html, css } from "lit";
import { state, query } from "lit/decorators.js";
import { sharedStyles } from "../sharedStyles";
import {Dialog, Button, CheckListItem, List} from "@scoped-elements/material-web";
import { localized, msg } from '@lit/localize';
import {DnaElement} from "@ddd-qc/dna-client";
import {WhereDnaPerspective, WhereDvm} from "../viewModels/where.dvm";


/** @element where-archive-dialog */
@localized()
export class WhereArchiveDialog extends DnaElement<WhereDnaPerspective, WhereDvm> {
  constructor() {
    super("where");
  }

  @query('#space-list')
  _spaceList!: List;


  /** */
  open() {
    const dialog = this.shadowRoot!.getElementById("archive-dialog") as Dialog
    dialog.open = true
  }


  /** Methods */

  /** */
  private async handleOk(e: any) {
    /** Check for changes in visible status for each play */
    let changed = [];
    for (const item of this._spaceList.items) {
      const spaceEh = item.value;
      const visible = !item.selected;
      const maybePlay = this._dvm.getPlay(spaceEh)
      if (maybePlay && maybePlay.visible != visible) {
        changed.push(spaceEh)
        if (visible) {
          await this._dvm.whereZvm.unhidePlay(spaceEh)
        } else {
          await this._dvm.whereZvm.hidePlay(spaceEh)
        }
      }
    }
    /** Close Dialog */
    this.dispatchEvent(new CustomEvent('archive-updated', { detail: changed, bubbles: true, composed: true }));
    const dialog = this.shadowRoot!.getElementById("archive-dialog") as Dialog;
    dialog.close()
  }


  /** */
  private handleDialogOpened(e: any) {
    this.requestUpdate();
  }


  /** */
  render() {
    if (!this._loaded) {
      return html`<span>${msg('Loading')}...</span>`;
    }

    const manifests = this.perspective.plays;

    return html`
<mwc-dialog id="archive-dialog" heading="${msg('Archived Spaces')}" @opened=${this.handleDialogOpened}>
<mwc-list id="space-list" multi>
  ${Object.entries(manifests).map(
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
<mwc-button id="primary-action-button" raised slot="primaryAction" @click=${this.handleOk}>${msg('ok')}</mwc-button>
<mwc-button slot="secondaryAction" dialogAction="cancel">${msg('cancel')}</mwc-button>
</mwc-dialog>
`
  }


  /** */
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
