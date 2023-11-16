import {css, html, LitElement} from "lit";
import {state, customElement} from "lit/decorators.js";
import {sharedStyles} from "../sharedStyles";
import { localized, msg } from '@lit/localize';
import {Play} from "../viewModels/where.perspective";
import {MarkerPiece, MarkerPieceVariantEmojiGroup, MarkerPieceVariantSvg, Template} from "../bindings/playset.types";
import {MarkerType, markerTypeNames, SpaceMeta} from "../viewModels/playset.perspective";
import {renderSvgMarker} from "../sharedRender";
import {DnaElement} from "@ddd-qc/lit-happ";
import {WhereDnaPerspective, WhereDvm} from "../viewModels/where.dvm";


import "@material/mwc-button";
import "@material/mwc-dialog";
import {Dialog} from "@material/mwc-dialog";
import {getInitials, Profile as ProfileMat} from "@ddd-qc/profiles-dvm";


/**
 * @element where-emoji-dialog
 */
@localized()
@customElement("where-play-info-dialog")
export class WherePlayInfoDialog extends DnaElement<WhereDnaPerspective, WhereDvm> {
  constructor() {
    super(WhereDvm.DEFAULT_BASE_ROLE_NAME);
  }

  @state() private _play?: Play;
  private _template?: Template;

  private _myProfile?: ProfileMat;

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
  renderMarkerType(meta: SpaceMeta, maybeMarkerPiece?: MarkerPiece) {
    let marker = html``;
    //console.log("renderMarkerType()", meta)
    switch (meta.markerType) {
      case MarkerType.Avatar:
        marker = html`
          <sl-avatar id="avatar" .image=${this._myProfile.fields.avatar}
                     style="background-color:${this._myProfile.fields.color};border: ${this._myProfile.fields.color} 1px solid;">
          </sl-avatar>
        `
        break;
      case MarkerType.SvgMarker:
        //const pin = render_pin(locMeta.color)
        const svg = this._dvm.playsetZvm.getSvgMarker((maybeMarkerPiece as MarkerPieceVariantSvg).svg);
        const svgMarker = renderSvgMarker(svg.value, this._myProfile.fields.color)
        marker = html`<span><abbr title="${svg.name}">${svgMarker}</abbr></span>`
        break;
      case MarkerType.SingleEmoji:
        marker = html `<span class="">${meta.singleEmoji}</span>`
        break;
      case MarkerType.EmojiGroup:
        const emojiGroup = this._dvm.playsetZvm.getEmojiGroup((maybeMarkerPiece as MarkerPieceVariantEmojiGroup).emojiGroup);
        //<div>${emojiGroup.description}</div>
        marker = html`<br/><span style="margin-left:15px;"><abbr title="${emojiGroup.name}">${emojiGroup.unicodes}</abbr></span>`
        break;
      case MarkerType.AnyEmoji:
        //marker = html`<span>${msg('Any Emoji')}</span>`
        break;
      case MarkerType.Initials:
        marker = html`<sl-avatar class="initials-marker" initials=${getInitials(this._myProfile.nickname)}></sl-avatar>`
        break;
      case MarkerType.Tag:
        //const tags = Object.values(meta.predefinedTags).reduce((a, b) => a + ", " + b)
        const tags = Object.values(meta.predefinedTags).map((a) => html`
          <span style="border:1px grey solid; background: #efeeee; margin:1px;padding:2px;">${a}</span>
        `)
        marker = html`<div>${tags}</div>`
      default:
        break;
    }
    //console.log({marker})
    return marker;
  }

  /** */
  render() {
    console.log("<where-play-info-dialog> render()", this._play);
    this._myProfile = this._dvm.profilesZvm.getMyProfile();

    // <details> ${JSON.stringify(meta)}</details>

    let content = html``;
    if (this._play) {
      const meta = this._play.space.meta;
      let sessions = html``;
      if (meta.sessionCount == -1) {
        sessions = html`<br/>${msg('Iterations')}: ${msg('One per day')}`;
      }
      if (meta.sessionCount > 1) {
        console.log("meta.sessionLabels", meta.sessionLabels)
        const labels = Object.values(meta.sessionLabels).reduce((a, b) => a + ", " + b)
        sessions = html`
          <br/>
          ${msg('Iterations')}: ${meta.sessionCount}
          ${meta.sessionLabels.length <= 0 || meta.sessionLabels.length == 1 && meta.sessionLabels[0] == "" ? html`` : html`
          <br/>
          <span style="margin:15px;color: #9054a2">${labels}</span>
          `}
        `
      }
      content = html`
        ${msg('Name')}: ${this._play.space.name}
        <br/>
        ${msg('Template')}: ${this._template.name}
        ${sessions}
        <br/>
        ${msg('Marker')}: ${markerTypeNames[meta.markerType]}
        ${this.renderMarkerType(meta, this._play.space.maybeMarkerPiece)}
        <br/>
        ${msg('Multiple markers')}: ${meta.multi}
        <br/>
        ${msg('Tagging')}: ${meta.canTag}
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


  // static get scopedElements() {
  //   return {
  //     "mwc-dialog": Dialog,
  //     "mwc-button": Button,
  //   };
  // }


  static get styles() {
    return [
      sharedStyles,
      css`
      `
    ];
  }
}
