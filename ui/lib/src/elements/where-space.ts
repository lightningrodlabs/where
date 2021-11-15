import {css, html, LitElement} from "lit";
import {property, query} from "lit/decorators.js";

import {contextProvided} from "@lit-labs/context";
import {StoreSubscriber} from "lit-svelte-stores";

import {sharedStyles} from "../sharedStyles";
import {Coord, Location, LocationInfo, Space, whereContext, LocOptions, MarkerType} from "../types";
import {EMOJI_WIDTH, MARKER_WIDTH, renderMarker, renderUiItems} from "../sharedRender";
import {WhereStore} from "../where.store";
import {ScopedElementsMixin} from "@open-wc/scoped-elements";
import {ProfilesStore, profilesStoreContext,} from "@holochain-open-dev/profiles";
import {Button, Dialog, TextField, Fab, Slider} from "@scoped-elements/material-web";
import {unsafeSVG} from 'lit/directives/unsafe-svg.js';
import {unsafeHTML} from 'lit/directives/unsafe-html.js';
import 'emoji-picker-element';
import {SlAvatar} from "@scoped-elements/shoelace";

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

  //@property() avatar = "";
  @property() currentSpaceEh = "";

  @contextProvided({ context: whereContext })
  _store!: WhereStore;

  @contextProvided({ context: profilesStoreContext })
  _profiles!: ProfilesStore;

  _myProfile = new StoreSubscriber(this, () => this._profiles.myProfile);
  _spaces = new StoreSubscriber(this, () => this._store.spaces);
  _zooms = new StoreSubscriber(this, () => this._store.zooms);
  _knownProfiles = new StoreSubscriber(this, () => this._profiles.knownProfiles);

  private dialogCoord = { x: 0, y: 0 };
  private dialogCanEdit = false;
  private dialogIdx = 0;

  isDrawerOpen = false;

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
    if (e.target) {
      e.preventDefault();
      this._store.updateZoom(this.currentSpaceEh, e.deltaY > 0 ? -0.05 : 0.05);
   }
  };

  updateZoom(delta: number): void {
    this._store.updateZoom(this.currentSpaceEh, delta);
  }

  get myNickName(): string {
    return this._myProfile.value.nickname;
  }

  private getCoordsFromEvent(event: any): Coord {
    const rect = event.currentTarget.getBoundingClientRect();
    const z = this._zooms.value[this.currentSpaceEh];
    const x = (event.clientX - rect.left) / z; //x position within the element.
    const y = (event.clientY - rect.top) / z; //y position within the element.
    return { x, y };
  }

  private canCreate(): boolean {
    if (this._store.space(this.currentSpaceEh).meta!.multi) {
      return true;
    }
    const myIdx = this._store.getAgentIdx(this.currentSpaceEh, this.myNickName);
    return myIdx == -1;
  }

  private canUpdateLocation(idx: number): boolean {
    const locInfo = this._store.space(this.currentSpaceEh).locations[idx]!;
    // TODO: should check agent key instead
    return locInfo.location.meta.name == this.myNickName;
  }

  private handleClick(event: any): void {
    if (event == null || !this.canCreate()) {
      return;
    }
    if (!this.currentSpaceEh) {
      return;
    }
    const space: Space = this._spaces.value[this.currentSpaceEh];
    const coord = this.getCoordsFromEvent(event);
    const useEmoji = space.meta?.markerType == MarkerType[MarkerType.Emoji];
    if (this.canEditLocation(space)) {
      this.dialogCoord = coord;
      //TODO fixme with a better way to know dialog type
      this.dialogCanEdit = false;
      const options: LocOptions = {
        tag: space.meta?.canTag ? "" : null,
        emoji: useEmoji? "" : null,
        name: this.myNickName,
        img: this._myProfile.value.fields.avatar,
        canEdit: false,
      }
      this.openLocationDialog(options);
    } else {
      const location: Location = {
        coord,
        meta: {
          markerType: space.meta!.markerType,
          tag: "",
          img: this._myProfile.value.fields.avatar,
          color: this._myProfile.value.fields.color? this._myProfile.value.fields.color : "#a9d71f",
          name: this.myNickName,
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
    const emojiPickerElem = this.shadowRoot!.getElementById("edit-location-emoji");

    if (!tagElem && !emojiPickerElem) {
      return;
    }

    const emojiPreviewElem = this.shadowRoot!.getElementById("edit-location-emoji-preview");

    if (emojiPreviewElem) {
      const emoji = this.shadowRoot!.getElementById("edit-location-emoji-marker");
      if (emoji) {
        emojiPickerElem?.addEventListener('emoji-click', (event: any ) => emoji.innerHTML = event?.detail?.unicode);
        emoji.innerHTML = `${options.emoji}`
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
    return this.shadowRoot!.getElementById("edit-location") as Dialog;
  }


  private async handleLocationDialogClosing(e: any) {
    //console.log("handleLocationDialogClosing: " + e.detail.action)
    const tag = this.shadowRoot!.getElementById("edit-location-tag") as TextField;
    if (e.detail.action == "cancel") {
      if (tag) tag.value = "";
      return;
    }
    /** handle "ok" */
    const tagValue = tag ? tag.value : ""
    const emoji = this.shadowRoot!.getElementById("edit-location-emoji-marker");
    const emojiValue = emoji ? emoji.innerHTML : ""
    const markerType = this._spaces.value[this.currentSpaceEh].meta!.markerType;

    const location: Location = {
      coord: this.dialogCoord,
      meta: {
        name: this._myProfile.value.nickname,
        markerType,
        tag: tagValue,
        emoji: emojiValue,
        img: markerType == MarkerType[MarkerType.Avatar]? this._myProfile.value.fields['avatar']: "",
        color: this._myProfile.value.fields.color? this._myProfile.value.fields.color : "#858585",
      },
    };
    if (this.dialogCanEdit) {
      this._store.updateLocation(
        this.currentSpaceEh,
        this.dialogIdx,
        this.dialogCoord,
        tagValue,
        emojiValue
      );
    } else {
      this._store.addLocation(this.currentSpaceEh, location);
    }
    if (tag) tag.value = "";
  }

  private allowDrop(ev: Event) {
    ev.preventDefault();
  }

  private drag(ev: DragEvent) {
    if (!ev.currentTarget) {
      return false;
    }
    const w = ev.currentTarget as HTMLElement;
    const idx = w.getAttribute("idx");
    //console.log(w)
    if (idx && ev.dataTransfer) {
      if (this.canUpdateLocation(parseInt(idx))) {
        ev.dataTransfer.setData("idx", `${idx}`);
        return true;
      }
    }
    return false;
  }

  private drop(ev: any) {
    ev.preventDefault();
    if (ev.dataTransfer) {
      const data = ev.dataTransfer.getData("idx");
      if (data != "") {
        const idx = parseInt(data);
        if (ev.target) {
          const coord = this.getCoordsFromEvent(ev);
          this._store.updateLocation(this.currentSpaceEh, idx, coord);
        }
      }
    }
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
    const space = this._store.space(this.currentSpaceEh);
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
    return surface.html?
      html`<div
          @drop="${(e: DragEvent) => this.drop(e)}"
          @dragover="${(e: DragEvent) => this.allowDrop(e)}"
          style="width: ${w}px; height: ${h}px;"
          .id="${this.currentSpaceEh}-img"
          @click=${this.handleClick}
      >
        ${unsafeHTML(surface.html)}
      </div>`
      : html`<svg xmlns="http://www.w3.org/2000/svg"
          @drop="${(e: DragEvent) => this.drop(e)}"
          @dragover="${(e: DragEvent) => this.allowDrop(e)}"
                  width="${w}px"
                  height="${h}px"
                  viewBox="0 0 ${surface.size.x} ${surface.size.y}"
                  preserveAspectRatio="none"
          .id="${this.currentSpaceEh}-svg"
          @click=${this.handleClick}
        >
          ${unsafeSVG(surface.svg)}
        </svg>`
    ;
  }


  handleDeleteClick(ev: any) {
    const idx = this.getIdx(ev.target)!;
    this._store.deleteLocation(this.currentSpaceEh, idx).then(() => {});
  }

  canEditLocation(space: Space | undefined) {
    if (!space) {
      space = this._spaces.value[this.currentSpaceEh];
    }
    const useEmoji = space.meta?.markerType == MarkerType[MarkerType.Emoji];
    return space.meta?.canTag || useEmoji;
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

    /** Render Location Marker and Dialog */
    // Handle my Locations differently
    let maybeMeClass  = "";
    let maybeDeleteBtn = html ``;
    let maybeEditBtn = html ``;

    if (isMe) {
      maybeMeClass = "me";
      maybeDeleteBtn = html `<button idx="${i}" @click="${this.handleDeleteClick}">Delete</button>`
      if (this.canEditLocation(space)) {
        maybeEditBtn = html `<button idx="${i}" @click="${this.handleLocationDblClick}">Edit</button>`
      }
    };

    return html`
      <div
        .draggable=${true}
        @dblclick="${(e: Event) => this.handleLocationDblClick(e)}"
        @dragstart="${(e: DragEvent) => this.drag(e)}"
        idx="${i}" class="location-marker" style="left: ${x}px; top: ${y}px;">
      ${marker}
      ${space.meta?.tagVisible && locInfo.location.meta.tag ? html`<div class="location-tag">${locInfo.location.meta.tag}</div>` : html`` }
      </div>
      <div class="location-details ${maybeMeClass}" style="left: ${x}px; top: ${y}px;">
        <h3>${locInfo.location.meta.name}</h3>
        <p>${locInfo.location.meta.tag}</p>
        ${maybeEditBtn}
        ${maybeDeleteBtn}
      </div>
    `;
  }

  async resetMyLocations() {
    await this._store.deleteAllMyLocations(this.currentSpaceEh);
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
    const cur: number = (this._zooms.value[this.currentSpaceEh] * 100);
    const delta = (zoom - cur) / 100;
    this.updateZoom(delta);
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
    const maxW = window.innerWidth - 60 - (this.isDrawerOpen? 256 : 0) - 24; // minus drawer, avatar list, scroll bar
    const maxH = window.innerHeight - 50 - 20; // minus top app bar, scroll bar
    //console.log("max-width: ", maxW);
    //console.log("max-height: ", maxH);
    /** render Surface */
    const surfaceItem = this.renderActiveSurface(space.surface, w, h)
    /** Render fabs */
    const fabs = html`
      <mwc-fab mini id="minus-fab" icon="remove" style="left:0px;top:0px;" @click=${() => this.updateZoom(-0.05)}></mwc-fab>
      <mwc-slider discrete step="2" min="10" max="300" style="position:absolute;left:20px;top:-5px;width:120px;"
                  @input=${(e:any) => this.handleZoomSlider(e.target.value)} value="${this._zooms.value[this.currentSpaceEh] * 100}">
      </mwc-slider>
      <mwc-fab mini id="plus-fab" icon="add" style="left:120px;top:0px;" @click=${() => this.updateZoom(0.05)}></mwc-fab>
      <mwc-fab mini id="reset-fab" icon="delete" style="left:160px;top:0px;" @click=${() => this.resetMyLocations()}></mwc-fab>
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
        ${maybeLocationDialog}
      </div>
    `;
  }

  renderLocationDialog(space: Space | undefined) {
    if (!this.canEditLocation(space)) {
      return html``;
    }
    let maybeEmojiForm = html``;
    if (space!.meta?.markerType == MarkerType[MarkerType.Emoji]) {
      maybeEmojiForm = html`
        <div id="edit-location-emoji-preview" class="location-marker emoji-marker">
          Emoji*
          <div id="edit-location-emoji-marker"></div>
        </div>
        <emoji-picker id="edit-location-emoji" class="light"></emoji-picker>
      `;
    }
    const tagForm = space!.meta?.canTag
      ? html`<mwc-textfield id="edit-location-tag" placeholder="Tag"></mwc-textfield>`
      : html``;

    return html`
        <mwc-dialog id="edit-location" heading="Location" @closing=${this.handleLocationDialogClosing}>
          ${tagForm}
          ${maybeEmojiForm}
          <mwc-button slot="primaryAction" dialogAction="ok">ok</mwc-button>
          <mwc-button slot="secondaryAction" dialogAction="cancel">cancel</mwc-button>
        </mwc-dialog>
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

        #edit-location-tag {
          display:block;
        }
        #edit-location-emoji-marker {
          font-size: ${EMOJI_WIDTH}px;
          display:inline-block;
          margin-top:10px;
        }

        .location-marker {
          position: absolute;
          margin-top: -${MARKER_WIDTH / 2 + 5}px;
          margin-left: -${MARKER_WIDTH / 2 + 5}px;
          z-index: 1;
        }

        .me {
          border: orange 2px solid;
        }

        .location-marker > img {
          width: ${MARKER_WIDTH}px;
          pointer-events: none;
        }

        .pin-marker {
          margin-top: -15px;
          margin-left: 5px;
        }

        #edit-location > .location-marker {
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
          border: black 1px solid;
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
