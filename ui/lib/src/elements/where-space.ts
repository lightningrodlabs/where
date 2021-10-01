import { html, css, LitElement, svg } from "lit";
import { property } from "lit/decorators.js";

import { contextProvided } from "@lit-labs/context";
import { StoreSubscriber } from "lit-svelte-stores";

import { sharedStyles } from "../sharedStyles";
import { whereContext, Location, Coord, Space } from "../types";
import { WhereStore } from "../where.store";
import { ScopedElementsMixin } from "@open-wc/scoped-elements";
import {
  profilesStoreContext,
  ProfilesStore,
} from "@holochain-open-dev/profiles";
import { Dialog, TextField, Button } from "@scoped-elements/material-web";
import {unsafeSVG} from 'lit/directives/unsafe-svg.js';
import {unsafeHTML} from 'lit/directives/unsafe-html.js';

const MARKER_WIDTH = 40;


export function renderUiItems(ui: string, zx: number, zy: number) {
  let uiItems = html``
  try {
    uiItems = JSON.parse(ui).map((item: any) => {
      return html`
            <div
              class="ui-item"
              style="width: ${item.box.width * zx}px;
          height: ${item.box.height * zy}px;
          left: ${item.box.left * zx}px;
          top: ${item.box.top * zy}px;
        ${item.style}"
            >
              ${item.content}
            </div>
          `;
    });
  } catch (e) {
    console.error("Invalid meta.ui: " + e)
  }
  return uiItems
}

/**
 * @element where-space
 */
export class WhereSpace extends ScopedElementsMixin(LitElement) {
  constructor() {
    super();
    this.addEventListener("wheel", this._handleWheel);
  }

  @property() avatar = "";
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

  private canUpdate(idx: number): boolean {
    const locInfo = this._store.space(this.currentSpaceEh).locations[idx];
    return locInfo.location.meta.name == this.myNickName;
  }

  private handleClick(event: any): void {
    if (event != null && this.canCreate()) {
      if (!this.currentSpaceEh) return;
      const space: Space = this._spaces.value[this.currentSpaceEh];
      const coord = this.getCoordsFromEvent(event);
      if (space.meta?.canTag) {
        this.dialogCoord = coord;
        //TODO fixme with a better way to know dialog type
        this.dialogCanEdit = false;
        this.openLocationDialog({
          tag: "",
          name: this.myNickName,
          img: "", //this.avatar,
          canEdit: false,
        });
      } else {
        const location: Location = {
          coord,
          meta: {
            tag: "",
            img: "",
            name: this.myNickName,
          },
        };
        this._store.addLocation(this.currentSpaceEh, location);
      }
    }
  }

  openLocationDialog(
    options = { name: "", img: "", tag: "", canEdit: false },
    coord?: Coord,
    idx?: number
  ) {
    const nameElem = this.shadowRoot!.getElementById("edit-location-name") as TextField;
    if (!nameElem) return // dialog disabled if Tag not allowed for current Space
    const imgElem = this.shadowRoot!.getElementById("edit-location-img") as TextField;
    const tagElem = this.shadowRoot!.getElementById("edit-location-tag") as TextField;
    // TODO: later these may be made visible for some kinds of spaces
    (nameElem as HTMLElement).style.display = "none";
    (imgElem as HTMLElement).style.display = "none";
    nameElem.value = options.name;
    imgElem.value = options.img;
    tagElem.value = options.tag;
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

  private async handleLocationDialog(e: any) {
    if (e.detail.action == "ok") {
      const tag = this.shadowRoot!.getElementById(
        "edit-location-tag"
      ) as TextField;
      const img = this.shadowRoot!.getElementById(
        "edit-location-img"
      ) as TextField;
      const name = this.shadowRoot!.getElementById(
        "edit-location-name"
      ) as TextField;
      const location: Location = {
        coord: this.dialogCoord,
        meta: {
          tag: tag.value,
          img: img.value,
          name: name.value,
        },
      };
      if (this.dialogCanEdit) {
        this._store.updateLocation(
          this.currentSpaceEh,
          this.dialogIdx,
          this.dialogCoord,
          tag.value
        );
      } else {
        this._store.addLocation(this.currentSpaceEh, location);
      }
    }
  }

  private allowDrop(ev: Event) {
    ev.preventDefault();
  }

  private drag(ev: DragEvent) {
    if (ev.target) {
      const w = ev.target as HTMLImageElement;
      const idx = w.getAttribute("idx");
      console.log(w)
      if (idx && ev.dataTransfer) {
        if (this.canUpdate(parseInt(idx))) {
          ev.dataTransfer.setData("idx", `${idx}`);
          return true;
        }
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

  private dblclick(ev: any) {
    if (ev.target) {
      const wElem = ev.target as HTMLImageElement;
      const idxStr = wElem.getAttribute("idx");
      if (idxStr) {
        const idx = parseInt(idxStr);
        if (this.canUpdate(idx)) {
          const locInfo = this._store.space(this.currentSpaceEh).locations[idx];
          this.openLocationDialog(
            {
              name: locInfo.location.meta.name,
              img: locInfo.location.meta.img,
              tag: locInfo.location.meta.tag,
              canEdit: true,
            },
            locInfo.location.coord,
            idx
          );
        }
      }
    }
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


  render() {
    if (!this.currentSpaceEh) return;
    const space: Space = this._spaces.value[this.currentSpaceEh];
    const z = this._zooms.value[this.currentSpaceEh];
    const locationItems = space.locations.map((locationInfo, i) => {
      const x = locationInfo.location.coord.x * z;
      const y = locationInfo.location.coord.y * z;

      // Use an image url if stored in the Location, otherwise use the agent's avatar
      let img = locationInfo.location.meta.img

      if (img === "") {
        const profile = this._knownProfiles.value[locationInfo.authorPubKey]
        if (profile) {
          img = profile.fields.avatar
        }
      }

      return html`
        <div
          .draggable=${true}
          @dblclick="${(e: Event) => this.dblclick(e)}"
          @dragstart="${(e: DragEvent) => this.drag(e)}"
          idx="${i}"
          class="location-marker ${locationInfo.location.meta.name == this.myNickName
            ? "me"
            : ""}"
          style="left: ${x}px; top: ${y}px;"
        >
        <img src="${img}">
        </div>
        <div
          class="location-details ${locationInfo.location.meta.name == this.myNickName
            ? "me"
            : ""}"
          style="left: ${x}px; top: ${y}px;"
        >
          <h3>${locationInfo.location.meta.name}</h3>
          <p>${locationInfo.location.meta.tag}</p>
        </div>
      `;
    });

    /** Parse UI items in surface meta */
    let uiItems = html ``
    if (space.meta && space.meta.ui) {
      uiItems = renderUiItems(space.meta.ui, z, z)
    }

    const w = space.surface.size.x * z;
    const h = space.surface.size.y * z;

    //console.log({space});
    const mainItem = this.renderSurface(space.surface, w, h)

    let maybeLocationDialog = html ``
    if (space.meta?.canTag) {
      maybeLocationDialog = html`
        <mwc-dialog id="edit-location" heading="Location" @closing=${this.handleLocationDialog}>
          <mwc-textfield id="edit-location-name" placeholder="Name"></mwc-textfield>
          <mwc-textfield id="edit-location-img" placeholder="Image Url"></mwc-textfield>
          <mwc-textfield id="edit-location-tag" dialogInitialFocus placeholder="Tag"></mwc-textfield>
          <mwc-button slot="primaryAction" dialogAction="ok">ok</mwc-button>
          <mwc-button slot="secondaryAction" dialogAction="cancel">cancel</mwc-button>
        </mwc-dialog>`
    }

    return html`
      <div class="surface" style="width: ${w * 1.01}px; height: ${h * 1.01}px;">
        ${mainItem}
        ${uiItems}
        ${locationItems}
        ${maybeLocationDialog}
      </div>
    `;
  }

  static get scopedElements() {
    return {
      "mwc-dialog": Dialog,
      "mwc-textfield": TextField,
      "mwc-button": Button,
    };
  }
  static get styles() {
    return [
      sharedStyles,
      css`
        .surface {
          position: relative;
          overflow: auto;
          max-width: 1500px;
          max-height: 900px;
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
        }
        .location-marker > img {
          width: ${MARKER_WIDTH}px;
          pointer-events: none;
        }

        .location-marker.me {
          border: orange 2px solid;
        }

        .location-details {
          display: none;
          position: absolute;
          z-index: 1;

          background: white;
          border-radius: 10px;
          border: black 1px solid;
          padding: 15px;
          text-align: left;
        }

        .location-details.me {
          border: orange 2px solid;
        }

        .location-details h3 {
          margin: 0;
        }

        .location-details p:last-of-type {
          margin-bottom: 0;
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
      `,
    ];
  }
}
