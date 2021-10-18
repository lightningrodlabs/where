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
import {Button, Dialog, TextField, Fab} from "@scoped-elements/material-web";
import {unsafeSVG} from 'lit/directives/unsafe-svg.js';
import {unsafeHTML} from 'lit/directives/unsafe-html.js';
import 'emoji-picker-element';

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
    if (this._store.space(this.currentSpaceEh).meta!.multi) return true;
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
    const nameElem = this.shadowRoot!.getElementById("edit-location-name") as TextField;
    if (!nameElem) return // dialog disabled if Tag not allowed for current Space
    const imgElem = this.shadowRoot!.getElementById("edit-location-img") as TextField;
    const tagElem = this.shadowRoot!.getElementById("edit-location-tag") as TextField;
    const emojiPickerElem = this.shadowRoot!.getElementById("edit-location-emoji");
    const emojiPreviewElem = this.shadowRoot!.getElementById("edit-location-emoji-preview");

    if (emojiPreviewElem) {
      const emoji = this.shadowRoot!.getElementById("edit-location-emoji-marker");
      if (emoji) {
        emojiPickerElem?.addEventListener('emoji-click', (event: any ) => emoji.innerHTML = event?.detail?.unicode);
        emoji.innerHTML = `${options.emoji}`
      }
    }
    // TODO: later these may be made visible for some kinds of spaces
    (nameElem as HTMLElement).style.display = "none";
    (imgElem as HTMLElement).style.display = "none";
    if (options.tag == null) {
      (tagElem as HTMLElement).style.display = "none";
    } else {
      (tagElem as HTMLElement).style.display = "block";
      tagElem.value = options.tag;
    }
    (emojiPickerElem as HTMLElement).style.display = options.emoji != null ? "block" : "none";
    (emojiPreviewElem as HTMLElement).style.display = options.emoji != null ? "flex-inline" : "none";
    nameElem.value = options.name;
    imgElem.value = options.img;
    if (options.canEdit) {
      this.dialogCanEdit = options.canEdit;
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
    if (e.detail.action == "cancel") {
      return;
    }
    /** handle "ok" */
    const tag = this.shadowRoot!.getElementById("edit-location-tag") as TextField;
    const img = this.shadowRoot!.getElementById("edit-location-img") as TextField;
    const name = this.shadowRoot!.getElementById("edit-location-name") as TextField;
    const emoji = this.shadowRoot!.getElementById("edit-location-emoji-marker");
    const emojiValue = emoji ? emoji.innerHTML : ""
    const markerType = this._spaces.value[this.currentSpaceEh].meta!.markerType;
    const location: Location = {
      coord: this.dialogCoord,
      meta: {
        markerType,
        tag: tag.value,
        emoji: emojiValue,
        img: img.value,
        name: name.value,
        color: this._myProfile.value.fields.color? this._myProfile.value.fields.color : "#a9d71f",
      },
    };
    if (this.dialogCanEdit) {
      this._store.updateLocation(
        this.currentSpaceEh,
        this.dialogIdx,
        this.dialogCoord,
        tag.value,
        emojiValue
      );
    } else {
      this._store.addLocation(this.currentSpaceEh, location);
    }
  }

  private allowDrop(ev: Event) {
    ev.preventDefault();
  }

  private drag(ev: DragEvent) {
    if (!ev.target) {
      return false;
    }
    const w = ev.target as HTMLImageElement;
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

  renderSurface(surface: any, w: number, h: number) {
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
    let marker = renderMarker(locInfo.location.meta);

    /** Render Location Marker and Dialog */
    // Handle my Locations differently
    let maybeMeClass  = "";
    let maybeDeleteBtn = html ``;
    let maybeEditBtn = html ``;
    // TODO: should check agent key and not nickname
    if (locInfo.location.meta.name == this.myNickName) {
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
        idx="${i}" class="location-marker ${maybeMeClass}" style="left: ${x}px; top: ${y}px;">
      ${marker}
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


  render() {
    if (!this.currentSpaceEh) {
      return;
    }
    /** Get current space and zoom level */
    const space: Space = this._spaces.value[this.currentSpaceEh];
    const z = this._zooms.value[this.currentSpaceEh];
    /** Render all space's locations */
    const locationItems = space.locations.map((locationInfo, i) => {
      return this.renderLocation(locationInfo, z, space, i)
    });
    /** Parse UI elements in surface meta */
    let uiItems = html ``
    if (space.meta && space.meta.ui) {
      uiItems = renderUiItems(space.meta.ui, z, z)
    }
    /** Set viewed width and height and render Surface accordingly */
    const w = space.surface.size.x * z;
    const h = space.surface.size.y * z;
    //console.log({space});
    const surfaceItem = this.renderSurface(space.surface, w, h)
    /** Render fabs */
    const fabs = html`
      <mwc-fab mini id="minus-fab" icon="remove" style="left:0px;top:0px" @click=${() => this.updateZoom(-0.05)}></mwc-fab>
      <mwc-fab mini id="plus-fab" icon="add" style="left:32px;top:0px" @click=${() => this.updateZoom(0.05)}></mwc-fab>
      <mwc-fab mini id="reset-fab" icon="refresh" style="left:75px;top:0px" @click=${() => this.resetMyLocations()}></mwc-fab>
    `;
    /** Build LocationDialog if required */
    let maybeLocationDialog = html ``
    if (this.canEditLocation(space)) {
      maybeLocationDialog = html`
        <mwc-dialog id="edit-location" heading="Location" @closing=${this.handleLocationDialogClosing}>
          <mwc-textfield id="edit-location-name" placeholder="Name"></mwc-textfield>
          <mwc-textfield id="edit-location-img" placeholder="Image Url"></mwc-textfield>
          <mwc-textfield id="edit-location-tag" dialogInitialFocus placeholder="Tag"></mwc-textfield>
<div id="edit-location-emoji-preview" class="location-marker me"><div id="edit-location-emoji-marker" class="emoji-marker"></div></div>
          <emoji-picker id="edit-location-emoji" class="light"></emoji-picker>
          <mwc-button slot="primaryAction" dialogAction="ok">ok</mwc-button>
          <mwc-button slot="secondaryAction" dialogAction="cancel">cancel</mwc-button>
        </mwc-dialog>`
    }
    /** Render layout */
    return html`
      <div class="surface" style="width: ${w * 1.01}px; height: ${h * 1.01}px;">
        ${surfaceItem}
        ${uiItems}
        ${locationItems}
        ${fabs}
        ${maybeLocationDialog}
      </div>
    `;
  }


  static get scopedElements() {
    return {
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
          /*overflow: auto;*/
          /*max-width: 1500px;*/
          /*max-height: 900px;*/
        }

        .location-marker {
          max-width: 100%;
          max-height: 100%;
          border-radius: 10000px;
          border: black 1px solid;
          position: absolute;
          height: ${MARKER_WIDTH}px;
          width: ${MARKER_WIDTH}px;
          margin-top: -${MARKER_WIDTH / 2}px;
          margin-left: -${MARKER_WIDTH / 2}px;
          z-index: 1;
          background-color: white;
          overflow: hidden;
          display: inline-flex;
          align-items: center;
        }
        .location-marker > img {
          width: ${MARKER_WIDTH}px;
          pointer-events: none;
        }
        .location-marker > .emoji-marker {
          font-size: ${EMOJI_WIDTH}px;
          margin: auto;
          pointer-events: none;
        }

        #edit-location > .location-marker {
          margin-top: 9px;
          margin-left: 0px;
          margin-bottom: 3px;
          clear: both;
          display: inline-flex;
          position: relative;
          color: black;
        }
        .location-marker.me {
          border: orange 2px solid;
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
