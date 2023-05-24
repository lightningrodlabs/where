import { html, css } from "lit";
import { state, query } from "lit/decorators.js";
import { sharedStyles } from "../sharedStyles";
import { localized, msg } from '@lit/localize';
import {DnaElement} from "@ddd-qc/lit-happ";
import {WhereDnaPerspective, WhereDvm} from "../viewModels/where.dvm";

import "@material/mwc-list";
import {List} from "@material/mwc-list";
import "@material/mwc-dialog";
import {Dialog} from "@material/mwc-dialog";

/** @element where-archive-dialog */
@localized()
export class WhereArchiveDialog extends DnaElement<WhereDnaPerspective, WhereDvm> {
  constructor() {
    super(WhereDvm.DEFAULT_BASE_ROLE_NAME);
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
      const maybeManifest = this._dvm.whereZvm.getManifest(spaceEh)
      if (maybeManifest && maybeManifest.visible != visible) {
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
    console.log("<where-archive-dialog> render()");

    const plays = this.perspective.plays;

    return html`
      <mwc-dialog id="archive-dialog" heading="${msg('Archived Spaces')}" @opened=${this.handleDialogOpened}>
      <mwc-list id="space-list" multi>
        ${Object.entries(plays).map(
          ([key, play]) => html`
            <mwc-check-list-item
              left
              value="${key}"
              .selected=${!this._dvm.whereZvm.getManifest(key)!.visible}>
                  ${play.space.name}
            </mwc-check-list-item>
          `
        )}
      </mwc-list>
      <mwc-button id="primary-action-button" raised slot="primaryAction" @click=${this.handleOk}>${msg('ok')}</mwc-button>
      <mwc-button slot="secondaryAction" dialogAction="cancel">${msg('cancel')}</mwc-button>
      </mwc-dialog>
    `;
  }


  // /** */
  // static get scopedElements() {
  //   return {
  //     "mwc-dialog": Dialog,
  //     "mwc-check-list-item": CheckListItem,
  //     "mwc-list": List,
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
