import {css, html, LitElement} from "lit";
import {state} from "lit/decorators.js";
import {sharedStyles} from "../sharedStyles";
import {ScopedElementsMixin} from "@open-wc/scoped-elements";
import {Button, Dialog} from "@scoped-elements/material-web";
import { localized, msg } from '@lit/localize';
import {Play} from "../viewModels/where.perspective";
import {Template} from "../bindings/playset.types";
import {markerTypeNames} from "../viewModels/playset.perspective";


/**
 * @element where-emoji-dialog
 */
@localized()
export class WherePlayInfoDialog extends ScopedElementsMixin(LitElement) {

  @state() private _play?: Play;
  private _template?: Template;


  /** */
  open(play: Play, template: Template) {
    this._play = play;
    this._template = template;
    const dialog = this.shadowRoot!.getElementById("info-dialog") as Dialog
    dialog.open = true
  }


  /** */
  private async handleOk(e: any) {
    const dialog = this.shadowRoot!.getElementById("info-dialog") as Dialog;
    dialog.close()
  }


  /** */
  private handleDialogOpened(e: any) {
    this.requestUpdate();
  }


  /** */
  render() {
    console.log("<where-play-info-dialog> render()", this._play);
    let content = html``;
    if (this._play) {
      const meta = this._play.space.meta;
      content = html`
        Name: ${this._play.space.name}
        <br/>
        Template: ${this._template.name}
        ${meta.sessionLabels.length > 1? html`<br/>Sessions: ${meta.sessionLabels}` : html``}
        <br/>
        Marker: ${markerTypeNames[meta.markerType]}
        <br/>
        Multiple markers: ${meta.multi}
        <br/>
        <details>
          ${JSON.stringify(meta)}
        </details>
    `;
    }

    return html`
<mwc-dialog id="info-dialog" heading="${msg('Space Info')}" @opened=${this.handleDialogOpened}>
  ${content}
  <!-- Dialog buttons -->
  <mwc-button id="primary-action-button" raised slot="primaryAction" @click=${this.handleOk}>${msg('ok')}</mwc-button>
</mwc-dialog>
`
  }


  static get scopedElements() {
    return {
      "mwc-dialog": Dialog,
      "mwc-button": Button,
    };
  }


  static get styles() {
    return [
      sharedStyles,
      css`
      `
    ];
  }
}
