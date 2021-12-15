import {css, html, LitElement} from "lit";
import {property, query, state} from "lit/decorators.js";

import {contextProvided} from "@lit-labs/context";
import {StoreSubscriber} from "lit-svelte-stores";

import {sharedStyles} from "../sharedStyles";
import {
  Coord,
  Location,
  LocationInfo,
  Space,
  whereContext,
  LocOptions,
  MarkerType,
  EmojiGroupEntry,
  UiItem
} from "../types";
import {EMOJI_WIDTH, MARKER_WIDTH, renderMarker, renderUiItems} from "../sharedRender";
import {WhereStore} from "../where.store";
import {ScopedElementsMixin} from "@open-wc/scoped-elements";
import {ProfilesStore, profilesStoreContext,} from "@holochain-open-dev/profiles";
import {Button, Dialog, TextField, Fab, Slider, Radio} from "@scoped-elements/material-web";
import {unsafeSVG} from 'lit/directives/unsafe-svg.js';
import {unsafeHTML} from 'lit/directives/unsafe-html.js';
import 'emoji-picker-element';
import {SlAvatar} from "@scoped-elements/shoelace";
import {AgentPubKeyB64, EntryHashB64} from "@holochain-open-dev/core-types";
import {prefix_canvas} from "../templates";


// // Canvas Animation experiment
// function draw() {
//   let where_space = getWhereSpace();
//   const space: Space = where_space._spaces.value[where_space.currentSpaceEh];
//   if (space.surface.canvas) {
//     const canvas_code = prefix_canvas('space-canvas') + space.surface.canvas;
//     var renderCanvas = new Function (canvas_code);
//     renderCanvas.apply(where_space);
//     window.requestAnimationFrame(draw);
//   }
// }
//
// function getWhereSpace(): WhereSpace {
//   let where_app = document.getElementsByTagName('where-app');
//   let where_controller = where_app[0].shadowRoot!.getElementById('controller');
//   let drawer = where_controller!.shadowRoot!.getElementById('my-drawer');
//   let where_space = drawer!.getElementsByTagName('where-space')[0] as WhereSpace;
//   //console.log({where_space})
//   return where_space;
// }


/**
 * @element where-space
 */
export class WhereSpace extends ScopedElementsMixin(LitElement) {
  constructor() {
    super();
    this.addEventListener("wheel", this._handleWheel);
  }

  @query('#reset-fab') resetFab!: Fab;
  @query('#plus-fab') plusFab!: Fab;
  @query('#minus-fab') minusFab!: Fab;
  @query('#hide-here-fab') hideFab!: Fab;

  @property() currentSpaceEh: null | EntryHashB64 = null;
  // @state() _currentSessionEh: null | EntryHashB64 = null;

  @contextProvided({ context: whereContext })
  _store!: WhereStore;

  @contextProvided({ context: profilesStoreContext })
  _profiles!: ProfilesStore;

  _myProfile = new StoreSubscriber(this, () => this._profiles.myProfile);
  _spaces = new StoreSubscriber(this, () => this._store.spaces);
  _zooms = new StoreSubscriber(this, () => this._store.zooms);
  _emojiGroups = new StoreSubscriber(this, () => this._store.emojiGroups);
  _svgMarkers = new StoreSubscriber(this, () => this._store.svgMarkers);
  _currentSessions = new StoreSubscriber(this, () => this._store.currentSessions);

  private dialogCoord = { x: 0, y: 0 };
  private dialogCanEdit = false;
  private dialogIdx = 0;

  @property() neighborWidth = 0;
  @property() soloAgent: AgentPubKeyB64 | null  = null; // filter for a specific agent

  async initFab(fab: Fab) {
    await fab.updateComplete;
    const button = fab.shadowRoot!.querySelector('button')! as HTMLElement;
    button.style.height = '30px';
    button.style.width = '30px';
    button.style.borderRadius = "25%";
  }

  async firstUpdated() {
    await this.initFab(this.resetFab);
    await this.initFab(this.plusFab);
    await this.initFab(this.minusFab);
    await this.initFab(this.hideFab);
  }


  updated(changedProperties: any) {
    //console.log("*** updated() called!");
    if (!this.currentSpaceEh) {
      return;
    }
    const space: Space = this._spaces.value[this.currentSpaceEh];
    if (space.surface.canvas) {
      //console.log(" - has canvas");
      const canvas_code = prefix_canvas('space-canvas') + space.surface.canvas;
      var renderCanvas = new Function (canvas_code);
      renderCanvas.apply(this);

      // // Canvas Animation experiment
      //var c = this.shadowRoot!.getElementById("myCanvas") as HTMLCanvasElement;
      //var ctx = c.getContext("2d");
      //if (ctx == null) {
      //  return;
      //}
      //window.requestAnimationFrame(draw);
    }
  }

  connectedCallback() {
    super.connectedCallback();
    window.addEventListener('resize', this._handleResize);
  }
  disconnectedCallback() {
    window.removeEventListener('resize', this._handleResize);
    super.disconnectedCallback();
  }


  private _handleResize = (e: UIEvent) => {
    this.requestUpdate();
  }

  private _handleWheel = (e: WheelEvent) => {
    if (e.target && this.currentSpaceEh) {
      e.preventDefault();
      this._store.updateZoom(this.currentSpaceEh, e.deltaY > 0 ? -0.05 : 0.05);
   }
  };

  updateZoom(delta: number): void {
    this._store.updateZoom(this.currentSpaceEh!, delta);
  }

  get myNickName(): string {
    return this._myProfile.value.nickname;
  }

  private getCoordsFromEvent(event: any): Coord {
    const rect = event.currentTarget.getBoundingClientRect();
    const z = this._zooms.value[this.currentSpaceEh!];
    const x = (event.clientX - rect.left) / z; //x position within the element.
    const y = (event.clientY - rect.top) / z; //y position within the element.
    return { x, y };
  }

  private canCreate(): boolean {
    if (this._store.space(this.currentSpaceEh!).meta!.multi) {
      return true;
    }
    const myIdx = this._store.getAgentIdx(this.currentSpaceEh!, this.myNickName);
    return myIdx == -1;
  }

  private canUpdateLocation(idx: number): boolean {
    const locInfo = this._store.space(this.currentSpaceEh!).locations[idx]!;
    // TODO: should check agent key instead
    return locInfo.location.meta.name == this.myNickName;
  }

  private handleClick(event: any): void {
    if (!this.currentSpaceEh || event == null || !this.canCreate()) {
      return;
    }
    const space: Space = this._spaces.value[this.currentSpaceEh];
    //console.log("handleClick: " + space.name)
    //console.log(space.meta?.singleEmoji)
    const coord = this.getCoordsFromEvent(event);
    if (this.canEditLocation(space)) {
      this.dialogCoord = coord;
      //TODO fixme with a better way to know dialog type
      this.dialogCanEdit = false;
      const options: LocOptions = {
        tag: space.meta?.canTag ? "" : null,
        emoji: "",
        name: this.myNickName,
        img: this._myProfile.value.fields.avatar,
        canEdit: false,
      }
      this.openLocationDialog(options);
    } else {
      const svgMarker = !space.meta?.svgMarker? "" : this._svgMarkers.value[space.meta.svgMarker].value;
      const location: Location = {
        coord,
        sessionEh: this._currentSessions.value[this.currentSpaceEh!],
        meta: {
          markerType: MarkerType[space.meta.markerType],
          tag: "",
          img: this._myProfile.value.fields.avatar,
          color: this._myProfile.value.fields.color? this._myProfile.value.fields.color : "#000000",
          name: this.myNickName,
          emoji: space.meta?.singleEmoji,
          svgMarker,
        },
      };
      this._store.addLocation(this.currentSpaceEh, location);
    }
  }


  openLocationDialog(
    options : LocOptions = { name: "", img: "", tag: "", canEdit: false, emoji: ""},
    coord?: Coord,
    idx?: number
  ) {
    const tagElem = this.shadowRoot!.getElementById("edit-location-tag") as TextField;
    const emojiPickerElem = this.shadowRoot!.getElementById("edit-location-emoji-picker");
    const emojiPreviewElem = this.shadowRoot!.getElementById("edit-location-emoji-preview");

    if (emojiPreviewElem) {
      const emojiMarkerElem = this.shadowRoot!.getElementById("edit-location-emoji-marker");
      if (emojiMarkerElem) {
        emojiPickerElem?.addEventListener('emoji-click', (event: any ) => emojiMarkerElem.innerHTML = event?.detail?.unicode);
        emojiMarkerElem.innerHTML = `${options.emoji}`
      }
    }

    if (options.canEdit) {
      this.dialogCanEdit = options.canEdit;
      if (options.tag) {
        tagElem!.value = options.tag
      }
      if (coord) this.dialogCoord = coord;
      if (idx) this.dialogIdx = idx;
    } else {
      this.dialogCanEdit = false;
    }
    this.locationDialogElem.open = true;
  }


  get locationDialogElem(): Dialog {
    return this.shadowRoot!.getElementById("edit-location-dialog") as Dialog;
  }


  private async handleLocationDialogClosing(e: any) {
    //console.log("handleLocationDialogClosing: " + e.detail.action)
    const tag = this.shadowRoot!.getElementById("edit-location-tag") as TextField;
    // if (e.detail.action == "cancel") {
    //   if (tag) tag.value = "";
    //   return;
    // }
    /** handle "ok" */
    const tagValue = tag ? tag.value : ""
    const emojiMarkerElem = this.shadowRoot!.getElementById("edit-location-emoji-marker");
    let svgMarker = ""
    let emojiValue = ""
    let markerType = MarkerType.Initials
    if(this.currentSpaceEh) {
      const currentSpace = this._spaces.value[this.currentSpaceEh]
      markerType = currentSpace.meta!.markerType;
      emojiValue = currentSpace.meta!.singleEmoji;
      if (currentSpace.meta!.svgMarker) {
        svgMarker = this._svgMarkers.value[currentSpace.meta!.svgMarker].value
      }
       currentSpace.meta!.svgMarker? currentSpace.meta!.svgMarker : "";
    }
    if (emojiMarkerElem) {
      emojiValue = emojiMarkerElem.innerHTML
    }

    const location: Location = {
      coord: this.dialogCoord,
      sessionEh: this._currentSessions.value[this.currentSpaceEh!],
      meta: {
        name: this._myProfile.value.nickname,
        markerType: MarkerType[markerType],
        tag: tagValue,
        emoji: emojiValue,
        img: markerType == MarkerType.Avatar? this._myProfile.value.fields['avatar']: "",
        color: this._myProfile.value.fields.color? this._myProfile.value.fields.color : "#858585",
        svgMarker,
      },
    };
    if (this.dialogCanEdit) {
      this._store.updateLocation(
        this.currentSpaceEh!,
        this.dialogIdx,
        this.dialogCoord,
        tagValue,
        emojiValue
      );
    } else {
      this._store.addLocation(this.currentSpaceEh!, location);
    }
    if (tag) tag.value = "";
  }

  private allowDrop(ev: Event) {
    ev.preventDefault();
  }

  private drag(dragEvent: DragEvent) {
    const ev = dragEvent as any;
    const target = dragEvent.currentTarget? dragEvent.currentTarget : ev.originalTarget;
    if (!target) {
      return false;
    }
    const w = target as HTMLElement;
    const idx = w.getAttribute("idx");
    //console.log(w)
    //console.log({ev})
    const offsetX = (target.clientWidth / 2) - ev.layerX;
    const offsetY = (target.clientHeight/ 2) - ev.layerY;
    if (idx && dragEvent.dataTransfer) {
      if (this.canUpdateLocation(parseInt(idx))) {
        dragEvent.dataTransfer.setData("idx", `${idx}`);
        dragEvent.dataTransfer.setData("offsetX", `${offsetX}`);
        dragEvent.dataTransfer.setData("offsetY", `${offsetY}`);
        return true;
      }
    }
    return false;
  }

  private drop(ev: any) {
    ev.preventDefault();
    if (!ev.dataTransfer || !ev.target) {
      return;
    }
    const dataIdx = ev.dataTransfer.getData("idx");
    if (dataIdx == "") {
      return;
    }
    const idx = parseInt(dataIdx);
    //
    const dataX = ev.dataTransfer.getData("offsetX");
    if (dataX == "") {
      return;
    }
    const offsetX = parseInt(dataX);
    //
    const dataY = ev.dataTransfer.getData("offsetY");
    if (dataY == "") {
      return;
    }
    const offsetY = parseInt(dataY);
    //console.log({ev})
    let coord = this.getCoordsFromEvent(ev);
    coord.x = coord.x + offsetX;
    coord.y = coord.y + offsetY;
    this._store.updateLocation(this.currentSpaceEh!, idx, coord);
  }

  getIdx(target: any): number | null {
    if (!target) {
      return null;
    }
    const wElem = target as HTMLElement;
    const idxStr = wElem.getAttribute("idx");
    if (!idxStr) {
      return null;
    }
    const idx = parseInt(idxStr);
    return idx;
  }

  /**
   * Open LocationDialog on clicked element if possible
   */
  private handleLocationDblClick(ev: any) {
    const idx = this.getIdx(ev.target)!;
    if (!this.canUpdateLocation(idx)) {
      return;
    }
    const space = this._store.space(this.currentSpaceEh!);
    const locInfo = space.locations[idx]!;
    this.openLocationDialog(
      {
        name: locInfo.location.meta.name,
        img: locInfo.location.meta.img,
        emoji: locInfo.location.meta.emoji,
        tag: locInfo.location.meta.tag,
        canEdit: true,
      },
      locInfo.location.coord,
      idx
    );
  }

  renderActiveSurface(surface: any, w: number, h: number) {
    if (surface.html) {
      return html`<div
          @drop="${(e: DragEvent) => this.drop(e)}"
          @dragover="${(e: DragEvent) => this.allowDrop(e)}"
          style="width: ${w}px; height: ${h}px;"
          id="space-div"
          @click=${this.handleClick}
      >
        ${unsafeHTML(surface.html)}
      </div>`
    }
    if (surface.svg) {
      return html`<svg xmlns="http://www.w3.org/2000/svg"
          @drop="${(e: DragEvent) => this.drop(e)}"
          @dragover="${(e: DragEvent) => this.allowDrop(e)}"
                  width="${w}px"
                  height="${h}px"
                  viewBox="0 0 ${surface.size.x} ${surface.size.y}"
                  preserveAspectRatio="none"
          id="space-svg"
          @click=${this.handleClick}
        >
          ${unsafeSVG(surface.svg)}
        </svg>`
      ;
    }
    // canvas
    return html`<canvas id="space-canvas"
                        @drop="${(e: DragEvent) => this.drop(e)}"
                        @dragover="${(e: DragEvent) => this.allowDrop(e)}"
                        width="${w}"
                        height="${h}"
                        style="border:1px solid #2278da;"
                        @click=${this.handleClick}
    >`
  }


  handleDeleteClick(ev: any) {
    const idx = this.getIdx(ev.target)!;
    this._store.deleteLocation(this.currentSpaceEh!, idx).then(() => {});
  }


  canEditLocation(space: Space | undefined) {
    if (!space && this.currentSpaceEh) {
      space = this._spaces.value[this.currentSpaceEh!];
    }
    const canPickEmoji = space!.meta.markerType == MarkerType.AnyEmoji
                      || space!.meta.markerType == MarkerType.EmojiGroup;
    return space!.meta.canTag || canPickEmoji;
  }


  renderLocation(locInfo: LocationInfo | null, z: number, space: Space, i: number) {
    if (locInfo === null) {
      return;
    }
    const x = locInfo.location.coord.x * z;
    const y = locInfo.location.coord.y * z;
    /** Render Marker */
    // TODO: should check agent key and not nickname
    const isMe = locInfo.location.meta.name == this.myNickName;
    let marker = renderMarker(locInfo.location.meta, isMe);
    /** Extra elements for when its my Location */
    let maybeMeClass  = "not-me";
    let maybeDeleteBtn = html ``;
    let maybeEditBtn = html ``;
    let borderColor = locInfo.location.meta.color;

    if (isMe) {
      maybeMeClass = "me";
      //borderColor = this._myProfile.value.fields.color? this._myProfile.value.fields.color : "black";
      maybeDeleteBtn = html `<button idx="${i}" @click="${this.handleDeleteClick}">Delete</button>`
      if (this.canEditLocation(space)) {
        maybeEditBtn = html `<button idx="${i}" @click="${this.handleLocationDblClick}">Edit</button>`
      }
    };
    /** adjust details position if too low */
    const details_height = 40
      + (locInfo.location.meta.tag? 20 : 0)
      + (isMe? 40 : 0)
    const details_y = space.surface.size.y * z - y < details_height? y - details_height : y;
    /** Render Location */
    return html`
      <div
        .draggable=${true}
        @dblclick="${(e: Event) => this.handleLocationDblClick(e)}"
        @dragstart="${(e: DragEvent) => this.drag(e)}"
        idx="${i}" class="location-marker" style="left: ${x - (MARKER_WIDTH / 2)}px; top: ${y - (MARKER_WIDTH / 2)}px;">
      ${marker}
      ${space.meta?.tagVisible && locInfo.location.meta.tag?
        html`<div class="location-tag" style="border:1px solid ${borderColor};">${locInfo.location.meta.tag}</div>`
        : html`` }
      </div>
      <div class="location-details ${maybeMeClass}" style="left: ${x}px; top: ${details_y}px;">
        <h3>${locInfo.location.meta.name}</h3>
        <p>${locInfo.location.meta.tag}</p>
        ${maybeEditBtn}
        ${maybeDeleteBtn}
      </div>
    `;
  }

  async resetMyLocations() {
    await this._store.deleteAllMyLocations(this.currentSpaceEh!);
  }

  toggleHideHere() {
    if (this.hideFab.icon === 'visibility') {
      this.hideFab.icon = 'visibility_off'
    }  else {
      this.hideFab.icon ='visibility';
    }
    this.requestUpdate();
  }

  private handleZoomSlider(input: number): void {
    /** update zoom from absolute value */
    const zoom = Math.min(input, 999);
    const cur: number = (this._zooms.value[this.currentSpaceEh!] * 100);
    const delta = (zoom - cur) / 100;
    this.updateZoom(delta);
  }


  async handleEmojiButtonClick(unicode: string) {
    // console.log("handleEmojiButtonClick: " + unicode)
    let emojiMarkerElem = this.shadowRoot!.getElementById("edit-location-emoji-marker");
    emojiMarkerElem!.innerHTML = `${unicode}`
    this.requestUpdate()
  }


  renderLocationDialog(space: Space | undefined) {
    if (!this.canEditLocation(space)) {
      return html``;
    }
    /** Render EmojiPreview */
    let maybeEmojiPreview = html``;
    if (space!.meta.markerType == MarkerType.AnyEmoji || space!.meta.markerType == MarkerType.EmojiGroup) {
      maybeEmojiPreview = html`
        <div id="edit-location-emoji-preview">
          <span style="margin:10px;">Emoji</span>
          <div id="edit-location-emoji-marker"></div>
        </div>`
    }
    /** Render Emoji Picker / Selector */
    let maybeEmojiPicker = html``;
    if (space!.meta.markerType == MarkerType.AnyEmoji) {
      maybeEmojiPicker = html`
        <emoji-picker id="edit-location-emoji-picker" class="light"></emoji-picker>
      `;
    }
    if (space!.meta.markerType == MarkerType.EmojiGroup) {
      const emojiGroup: EmojiGroupEntry = this._emojiGroups.value[space!.meta.emojiGroup!];
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
    /** Render Tag field */
    const tagForm = space!.meta?.canTag
      ? html`<mwc-textfield id="edit-location-tag" label="Tag" dialogInitialFocus
                            minlength="1" type="text"></mwc-textfield>`
      : html``;
    /** Render */
    return html`
        <mwc-dialog id="edit-location-dialog" heading="Location"
                    scrimClickAction="" @wheel=${(e: any) => e.stopPropagation()}>
          ${tagForm}
          ${maybeEmojiPreview}
          ${maybeEmojiPicker}
          <mwc-button slot="primaryAction" @click="${this.handleLocationClick}">ok</mwc-button>
          <mwc-button slot="secondaryAction" dialogAction="cancel">cancel</mwc-button>
        </mwc-dialog>
    `;
  }

  // @input=${() => (this.shadowRoot!.getElementById("edit-location-tag") as TextField).reportValidity()} autoValidate=true
  // @closing=${this.handleLocationDialogClosing}

  private async handleLocationClick(e: any) {
    /** Check validity */
    const space = this._store.space(this.currentSpaceEh!)
    // tag-field
    const tagField = this.shadowRoot!.getElementById("edit-location-tag") as TextField;
    if (tagField && space.meta.tagAsMarker) {
      let isValid = tagField.value !== "";
      if (!isValid) {
        tagField.setCustomValidity("Must not be empty")
        tagField.reportValidity();
        return;
      }
      tagField.setCustomValidity("")
    }

    this.handleLocationDialogClosing(null)

    // - Close dialog
    this.locationDialogElem.close();
  }


  render() {
    if (!this.currentSpaceEh) {
      return;
    }
    /** Get current space and zoom level */
    const space: Space = this._spaces.value[this.currentSpaceEh];
    const z = this._zooms.value[this.currentSpaceEh];
    /** Render all space's locations */
    let locationItems = undefined;
    if (this.hideFab && this.hideFab.icon === 'visibility') {
      locationItems = space.locations.map((locationInfo, i) => {
        if (this.soloAgent != null && locationInfo) {
          if (this.soloAgent != locationInfo.authorPubKey) {
            return;
          }
        }
        return this.renderLocation(locationInfo, z, space, i)
      });
    }
    /** Parse UI elements in surface meta */
    let uiItems = html ``
    if (space.meta && space.meta.ui) {
      uiItems = renderUiItems(space.meta.ui, z, z)
    }
    /** Set viewed width and height and render Surface accordingly */
    const w = space.surface.size.x * z;
    const h = space.surface.size.y * z;
    /** Set max size */
    const maxW = window.innerWidth - this.neighborWidth - 24; // minus scroll bar
    const maxH = window.innerHeight - 50 - 20; // minus top app bar, scroll bar
    //console.log("max-width: ", maxW);
    //console.log("max-height: ", maxH);
    /** render Surface */
    const surfaceItem = this.renderActiveSurface(space.surface, w, h)
    /** Render fabs */
    const fabs = html`
      <mwc-fab mini id="minus-fab" icon="remove" style="left:0px;top:0px;" @click=${() => this.updateZoom(-0.05)}></mwc-fab>
      <mwc-slider min="10" max="300" style="position:absolute;left:20px;top:-5px;width:120px;"
                  @input=${(e:any) => this.handleZoomSlider(e.target.value)} value="${this._zooms.value[this.currentSpaceEh] * 100}">
      </mwc-slider>
      <mwc-fab mini id="plus-fab" icon="add" style="left:120px;top:0px;" @click=${() => this.updateZoom(0.05)}></mwc-fab>
      <mwc-fab mini id="reset-fab" icon="wrong_location" style="left:160px;top:0px;" @click=${() => this.resetMyLocations()}></mwc-fab>
      <mwc-fab mini id="hide-here-fab" icon="visibility" style="left:200px;top:0px;" @click=${() => this.toggleHideHere()}></mwc-fab>
    `;
    /** Build LocationDialog if required */
    const maybeLocationDialog =  this.renderLocationDialog(space);
    /** Render layout - 1.01 because of scroll bars */
    return html`
      <div class="surface" style="width: ${w * 1.01}px; height: ${h * 1.01}px;max-width: ${maxW}px; max-height: ${maxH}px;">
        ${surfaceItem}
        ${uiItems}
        ${locationItems}
        ${fabs}
      </div>
      ${maybeLocationDialog}
    `;
  }


  static get scopedElements() {
    return {
      "sl-avatar": SlAvatar,
      "mwc-slider": Slider,
      "mwc-fab": Fab,
      "mwc-dialog": Dialog,
      "mwc-textfield": TextField,
      "mwc-button": Button,
      "wmc-radio": Radio,
      "emoji-picker": customElements.get('emoji-picker'),
    };
  }
  static get styles() {
    return [
      sharedStyles,
      css`
        .surface {
          position: relative;
          overflow: auto;
          min-width:160px;
        }

        #space-div {
          width: 100%;
          height: 100%;
        }

        #edit-location-tag {
          display:block;
        }
        #edit-location-emoji-marker {
          font-size: ${EMOJI_WIDTH}px;
          display:inline-block;
          margin-top:10px;
          color:black;
        }

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

        .me {
          border: orange 1px solid;
        }

        .not-me {
          border: black 1px solid;
        }

        .location-marker > img {
          width: ${MARKER_WIDTH}px;
          pointer-events: none;
        }

        .svg-marker {
          width:${MARKER_WIDTH}px;
          height:${MARKER_WIDTH}px;
          /*margin-top: -15px;*/
          /*margin-left: 5px;*/
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
        .location-tag {
          background-color: white;
          border-radius: 5px;
          /**border: black 1px solid;*/
          box-shadow: 1px 1px 4px #aaa;
          font-size: 75%;
          padding: 3px;
          width: 80px;
          overflow-x: auto;
          margin-left: -20px;
          text-align: center;
        }
        .location-details {
          display: none;
          position: absolute;
          z-index: 10;

          background: white;
          border-radius: 10px;
          border: black 1px solid;
          padding: 5px;
          text-align: left;
        }

        .location-details.me {
          border: orange 2px solid;
        }

        .location-details h3 {
          margin: 0;
        }

        .location-details p:last-of-type {
          margin-top: 5px;
          margin-bottom: 5px;
        }

        .location-marker:hover + .location-details,
        .location-details:hover {
          display: block;
        }

        .ui-item {
          position: absolute;
          pointer-events: none;
          text-align: center;
        }

        mwc-fab {
          position: absolute;
          z-index: 2;
          --mdc-theme-secondary: #f9f9f9;
          --mdc-theme-on-secondary: black;
        }
      `,
    ];
  }
}
