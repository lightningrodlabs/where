import {css, html} from "lit";
import {query, state, customElement, property} from "lit/decorators.js";
import {sharedStyles} from "../sharedStyles";
import {EMOJI_WIDTH, MARKER_WIDTH} from "../sharedRender";
import {localized, msg} from '@lit/localize';
import {
  MarkerPieceVariantEmojiGroup,
  MarkerPieceVariantSvg, EmojiGroup
} from "../bindings/playset.types";
import {MarkerType,} from "../viewModels/playset.perspective";
import {DnaElement} from "@ddd-qc/lit-happ";
import {
    Coord,
    LocOptions,
    Play,
    WhereLocation
} from "../viewModels/where.perspective";
import {encodeHashToBase64, EntryHashB64} from "@holochain/client";


import "@shoelace-style/shoelace/dist/components/avatar/avatar.js"
import "@shoelace-style/shoelace/dist/components/tab/tab.js";
import "@shoelace-style/shoelace/dist/components/tab-panel/tab-panel.js";
import "@shoelace-style/shoelace/dist/components/tab-group/tab-group.js";

import "@material/mwc-textfield";
import "@material/mwc-select";
import "@material/mwc-textarea";
import "@material/mwc-checkbox";
import "@material/mwc-formfield";
import "@material/mwc-dialog";
import "@material/mwc-radio";
import "@material/mwc-button";
import "@material/mwc-icon-button";
import "@material/mwc-tab";
import "@material/mwc-tab-bar";
import {TextField} from "@material/mwc-textfield";
import {Dialog} from "@material/mwc-dialog";
import {consume} from "@lit/context";
import {weClientContext} from "../contexts";
import {Hrl, WeServices} from "@lightningrodlabs/we-applet";
import {Profile as ProfileMat} from "@ddd-qc/profiles-dvm/dist/bindings/profiles.types";
import {WhereDnaPerspective, WhereDvm} from "../viewModels/where.dvm";
import {stringifyHrl} from "@ddd-qc/we-utils";


/**
 * @element where-space-dialog
 */
@localized()
@customElement("where-location-dialog")
export class WhereLocationDialog extends DnaElement<WhereDnaPerspective, WhereDvm>  {
  constructor() {
    super(WhereDvm.DEFAULT_BASE_ROLE_NAME);
  }


  /** -- Properties -- */

  @consume({ context: weClientContext, subscribe: true })
  weServices: WeServices;

  @property({ type: Object})
  play: Play;

  @property({type: String})
  spaceEh: null | EntryHashB64 = null;

  @property()
  myProfile: ProfileMat;

  private _optionAttachables: Hrl[] = [];

  private _dialogCoord = { x: 0, y: 0 };
  private _dialogCanUpdate = false;
  private _dialogIdx = 0;

  /** -- Getters -- */

  get tagFieldElem(): TextField {
      return this.shadowRoot!.getElementById("tag-field") as TextField;
  }

  get predefinedTagElem(): HTMLElement {
    return this.shadowRoot!.getElementById("predefined-tag") as HTMLElement;
  }

  get emojiMarkerElem(): HTMLElement {
    return this.shadowRoot!.getElementById("emoji-marker");
  }

  get dialogElem(): Dialog {
      return this.shadowRoot!.getElementById("edit-location-dialog") as Dialog;
  }

  getCurrentSession(): EntryHashB64 | undefined {
      return this.spaceEh? this._dvm.getCurrentSession(this.spaceEh) : undefined
  }


  /** -- Methods -- */

  /** */
  canEditLocation(): boolean {
      if (!this.play) return false;
      const canPickEmoji = this.play.space.meta.markerType == MarkerType.AnyEmoji
          || this.play.space.meta.markerType == MarkerType.EmojiGroup;
      return this.play.space.meta.canTag || canPickEmoji;
  }


  /** */
  async handleEmojiButtonClick(unicode: string) {
      // console.log("handleEmojiButtonClick: " + unicode)
      this.emojiMarkerElem.innerHTML = `${unicode}`
      this.requestUpdate();
  }


  /** */
  async handleTagButtonClick(tag: string) {
      // console.log("handleTagButtonClick: " + unicode)
      this.predefinedTagElem.innerHTML = `${tag}`
      this.requestUpdate();
  }


  /** */
  open(
      options : LocOptions = { name: "", img: "", tag: "", canUpdateLoc: false, emoji: "", attachables: []},
      coord?: Coord,
      idx?: number
  ) {
      console.log("<where-location-dialog>.open()", options, coord, idx, this._optionAttachables);
      /** General */
      this._dialogCanUpdate = options.canUpdateLoc;
      /* Emoji */
      const emojiPickerElem = this.shadowRoot!.getElementById("edit-location-emoji-picker");
      const emojiPreviewElem = this.shadowRoot!.getElementById("edit-location-emoji-preview");
      if (emojiPreviewElem) {
          if (this.emojiMarkerElem) {
              emojiPickerElem?.addEventListener('emoji-click', (event: any ) => this.emojiMarkerElem.innerHTML = event?.detail?.unicode);
              this.emojiMarkerElem.innerHTML = `${options.emoji}`
          }
      }
      /* Attachable */
      this._optionAttachables = [];
      if (options.attachables.length > 0) {
          this._optionAttachables = options.attachables;
      }
      /* Tag */
      //if (options.canUpdateLoc) {
          if (options.tag) {
              if (this.tagFieldElem) {
                  this.tagFieldElem.value = options.tag
              } else {
                  if (this.predefinedTagElem) {
                      this.predefinedTagElem.innerText = options.tag
                  }
              }
          }
      //}
      if (coord) this._dialogCoord = coord;
      if (idx) this._dialogIdx = idx;
      /* Open Dialog */
      this.dialogElem.open = true;
      this.requestUpdate(); // !important
  }


  /** */
  private async handleOk(_e: any) {
      /** -- Check validity -- */

      /* tag-field must exist if marker is tag */
      if (this.tagFieldElem && this.play.space.meta.tagAsMarker) {
          let isValid = this.tagFieldElem.value !== "";
          if (!isValid) {
              this.tagFieldElem.setCustomValidity("Must not be empty")
              this.tagFieldElem.reportValidity();
              return;
          }
          this.tagFieldElem.setCustomValidity("")
      }

      /* Check predefined-tag ?? */
      if (this.predefinedTagElem && (!this.predefinedTagElem.innerText || this.predefinedTagElem.innerText == "")) {
          return;
      }

      /* Check Emoji */
      if (this.emojiMarkerElem) {
          if (!this.emojiMarkerElem.innerHTML || this.emojiMarkerElem.innerHTML == "") {
              // FIXME: Report invalid emoji field
              return;
          }
      }

      /** */
      await this.commitLocation();

      /** Close & cleanup */
      await this.close();
  }


  /** */
  close() {
      if (this.tagFieldElem) {
          this.tagFieldElem.value = "";
      }
      if (this.predefinedTagElem) {
          this.predefinedTagElem.innerText = ""
      }
      if (this.emojiMarkerElem) {
          this.emojiMarkerElem.innerHTML = "";
      }
      this._optionAttachables = [];
      this.dialogElem.close();
  }


  /** */
  private async commitLocation() {
      console.log("<where-location-dialog>.commitLocation()", this._optionAttachables);

      /** Grab Tag value */
      let tagValue = ""
      if (!this.tagFieldElem) {
          if (this.predefinedTagElem) {
              tagValue = this.predefinedTagElem.innerText
          }
      } else {
          tagValue = this.tagFieldElem.value
      }

      /** Grab Emoji value */
      let emojiValue = ""
      if (this.emojiMarkerElem) {
          emojiValue = this.emojiMarkerElem.innerHTML;
      }
      if (this.play.space.meta!.singleEmoji) {
          emojiValue = this.play.space.meta!.singleEmoji;
      }

      let svgMarker = ""
      let markerType= this.play.space.meta!.markerType;
      if (this.play.space.maybeMarkerPiece && "svg" in this.play.space.maybeMarkerPiece) {
          let eh = (this.play.space.maybeMarkerPiece as MarkerPieceVariantSvg).svg;
          svgMarker = this._dvm.playsetZvm.getSvgMarker(eh)!.value;
      }

      /** Publish new or update Location */
      if (this._dialogCanUpdate) {
          await this._dvm.updateLocation(
              this.spaceEh,
              this._dialogIdx,
              this._dialogCoord,
              tagValue,
              emojiValue,
              this._optionAttachables,
          );
      } else {
          const location: WhereLocation = {
              coord: this._dialogCoord,
              sessionEh: this.getCurrentSession()!,
              meta: {
                  authorName: this.myProfile!.nickname,
                  markerType,
                  attachables: this._optionAttachables,
                  tag: tagValue,
                  emoji: emojiValue,
                  img: markerType == MarkerType.Avatar ? this.myProfile!.fields['avatar'] : "",
                  color: this.myProfile!.fields.color ? this.myProfile!.fields.color : "#858585",
                  svgMarker,
              },
          };
          await this._dvm.publishLocation(location, this.spaceEh);
      }
  }


  /** */
  render() {
    console.log("<where-location-dialog>.render()", this._optionAttachables);
    if (!this.canEditLocation()) {
      return html``;
    }
    /** Render EmojiPreview */
    let maybeEmojiPreview = html``;
    if (this.play.space.meta.markerType == MarkerType.AnyEmoji || this.play.space.meta.markerType == MarkerType.EmojiGroup) {
      maybeEmojiPreview = html`
        <div id="edit-location-emoji-preview">
          <span style="margin:10px;">${msg('Emoji')}</span>
          <div id="emoji-marker"></div>
        </div>`
    }
    /** Render Emoji Picker / Selector */
    let maybeEmojiPicker = html``;
    if (this.play.space.meta.markerType == MarkerType.AnyEmoji) {
      maybeEmojiPicker = html`
        <emoji-picker id="edit-location-emoji-picker" style="width:100%;" class="light"></emoji-picker>
      `;
    }
    if (this.play.space.meta.markerType == MarkerType.EmojiGroup) {
      const emojiGroup: EmojiGroup = this._dvm.playsetZvm.getEmojiGroup((this.play.space.maybeMarkerPiece! as MarkerPieceVariantEmojiGroup).emojiGroup)!;
      const emojis = Object.entries(emojiGroup.unicodes).map(
        ([key, unicode]) => {
          return html`
          <mwc-icon-button style="cursor: pointer;" class="unicode-button" @click=${(e:any) => this.handleEmojiButtonClick(unicode)} >${unicode}</mwc-icon-button>
          `
        }
      )
      maybeEmojiPicker = html`
          <h4 style="margin-bottom: 0px">${emojiGroup.name}</h4>
          <div class="unicodes-container" style="min-height:40px;font-size: 30px;line-height: 40px">
            ${emojis}
          </div>
      `;
    }

    /** Render maybeTagPreview */
    const usePredefinedTags = this.play.space.meta?.canTag && this.play.space.meta?.predefinedTags.length > 0 && this.play.space.meta?.predefinedTags[0] != ""
    let maybeTagPreview = html``;
    if (usePredefinedTags) {
      maybeTagPreview = html`
        <div id="predefined-tag-div">
          <span style="margin:10px;">${msg('Tag')} </span>
          <div id="predefined-tag" style="margin-top:9px;font-size:24px"></div>
        </div>`
    }
    /** Render Tag field */
    let tagForm = html ``
    if (this.play.space.meta?.canTag) {
      if (usePredefinedTags) {
        const tags = Object.values(this.play.space.meta?.predefinedTags).map((tag) => {return html`
          <mwc-button outlined class="tag-button" label="${tag}"  @click=${(e:any) => this.handleTagButtonClick(tag)} ></mwc-button>
          `})
        tagForm = html`
          <div class="tags-container">
          ${tags}
        </div>`
      } else {
        tagForm = html`
          <mwc-textfield id="tag-field" label="${msg('Tag')}" dialogInitialFocus
                         minlength="1" type="text"></mwc-textfield>`
      }
    }

    /** render attachables */
    let maybeAttachables = html``;
    if (this.weServices && this.play.space.meta?.canAttach) {
      let attachables = [];
      console.log("<where-location-dialog>.render().attachables", this._optionAttachables.map((hrl) => encodeHashToBase64(hrl[1])));
      attachables = this._optionAttachables.map((hrl) => {
        const sHrl = stringifyHrl(hrl);
        return html`
            <div style="display: flex; flex-direction: row">
                <mwc-icon-button class="delete-attachment-icon" icon="delete" @click=${(_e) => {
                    console.log("delete an attachment before", this._optionAttachables.length, sHrl);
                    this._optionAttachables = this._optionAttachables.filter((cur) => stringifyHrl(cur) != sHrl);
                    console.log("delete an attachment after", this._optionAttachables.length);
                    this.requestUpdate();
        }}></mwc-icon-button>
                <we-hrl .hrl=${hrl}></we-hrl>
            </div>`;
      });
      maybeAttachables = html`
        <div style="display: flex; flex-direction: column">
            ${attachables}
            <mwc-button icon="add" @click=${async (_ev) => {
            console.log("<where-location-dialog> Adding Attachable. Current:", this._optionAttachables);
            const hrlc = await this.weServices.userSelectHrl();
            this._optionAttachables.push(hrlc.hrl);
            this.requestUpdate();
          }}>Attachable</mwc-button>
        </div>
      `;
    }

    // dialogAction="cancel"

    /** Render all */
    return html`
        <mwc-dialog id="edit-location-dialog" heading="${msg('Location')}"
                    scrimClickAction="" @wheel=${(e: any) => e.stopPropagation()}>
          ${maybeAttachables}
          ${maybeTagPreview}
          ${tagForm}
          ${maybeEmojiPreview}
          ${maybeEmojiPicker}
          <mwc-button slot="primaryAction" @click=${this.handleOk}>${msg('ok')}</mwc-button>
          <mwc-button slot="secondaryAction" @click=${(_e) => this.close()}>${msg('cancel')}</mwc-button>
        </mwc-dialog>
    `;
  }


  /** */
  static get styles() {
      return [
          sharedStyles,
          css`

            .delete-attachment-icon {
              --mdc-icon-size:0.75em;
              --mdc-icon-button-size:0.75em;
              margin-top:5px;
              margin-left:-15px;
              margin-right:5px;
            }
      #tag-field {
        display: block;
      }

      #emoji-marker {
        font-size: ${EMOJI_WIDTH}px;
        display:inline-block;
        margin-top:10px;
        color:black;
      }

      #predefined-tag-div,
      #edit-location-emoji-preview {
        display: inline-flex;
        line-height: 40px;
        background-color: whitesmoke;
        width: 100%;
        margin-top: 5px;
        color: rgba(0, 0, 0, 0.6);
      }

      .location-marker {
        position: absolute;
        width: ${MARKER_WIDTH}px;
        height: ${MARKER_WIDTH}px;
        z-index: 1;
      }

      #edit-location-dialog > .location-marker {
        margin-top: 9px;
        margin-left: 0px;
        margin-bottom: 10px;
        clear: both;
        display: block;
        position: relative;
        color: black;
        min-height: ${EMOJI_WIDTH}px;
      }
    `,
      ];
  }

}
