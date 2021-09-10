import { html, css, LitElement } from "lit";
import { property } from "lit/decorators.js";

import { contextProvided } from "@lit-labs/context";
import { contextStore } from "lit-svelte-stores";

import { sharedStyles } from "../sharedStyles";
import { whereContext, Location, Space, Dictionary, Coord } from "../types";
import { WhereStore } from "../where.store";
import { ScopedElementsMixin } from "@open-wc/scoped-elements";
import {
  profilesStoreContext,
  ProfilesStore,
  Profile,
} from "@holochain-open-dev/profiles";
import { Dialog, TextField, Button } from "@scoped-elements/material-web";

const MARKER_WIDTH = 40;

/**
 * @element where-space
 */
export class WhereSpace extends ScopedElementsMixin(LitElement) {
  constructor() {
    super();
    this.addEventListener("wheel", this._handleWheel);
  }

  @property({ type: String }) avatar = "";
  @property({ type: String }) current = "";

  @contextProvided({ context: whereContext })
  _store!: WhereStore;

  @contextProvided({ context: profilesStoreContext })
  _profiles!: ProfilesStore;

  @contextStore({
    context: profilesStoreContext,
    selectStore: (s) => s.myProfile,
  })
  _myProfile!: Profile;

  @contextStore({
    context: whereContext,
    selectStore: (s) => s.spaces,
  })
  _spaces!: Dictionary<Space>;

  @contextStore({
    context: whereContext,
    selectStore: (s) => s.zooms,
  })
  _zooms!: Dictionary<number>;

  private dialogCoord = { x: 0, y: 0 };
  private dialogIsEdit = false;
  private dialogIdx = 0;

  private _handleWheel = (e: WheelEvent) => {
    if (e.target) {
      e.preventDefault();
      this._store.zoom(this.current, e.deltaY > 0 ? -0.05 : 0.05);
    }
  };

  zoom(delta: number): void {
    this._store.zoom(this.current, delta);
  }

  get myNickName(): string {
    return this._myProfile.nickname;
  }

  private getCoordsFromEvent(event: any): Coord {
    const rect = event.target.getBoundingClientRect();
    const z = this._zooms[this.current];
    const x = (event.clientX - rect.left) / z; //x position within the element.
    const y = (event.clientY - rect.top) / z; //y position within the element.
    return { x, y };
  }

  private canCreate(): boolean {
    if (this._store.space(this.current).meta!.multi) return true;
    const myIdx = this._store.getAgentIdx(this.current, this.myNickName);
    return myIdx == -1;
  }

  private canUpdate(idx: number): boolean {
    const w = this._store.space(this.current).wheres[idx];
    return w.entry.meta.name == this.myNickName;
  }

  private handleClick(event: any): void {
    if (event != null && this.canCreate()) {
      const coord = this.getCoordsFromEvent(event);
      this.dialogCoord = coord;
      //TODO fixme with a better way to know dialog type
      this.dialogIsEdit = false;
      this.openWhereDialog({
        tag: "",
        name: this.myNickName,
        img: this.avatar,
        isEdit: false,
      });
    }
  }

  openWhereDialog(
    options = { name: "", img: "", tag: "", isEdit: false },
    coord?: Coord,
    idx?: number
  ) {
    const nameE = this.shadowRoot!.getElementById(
      "edit-where-name"
    ) as TextField;
    const imgE = this.shadowRoot!.getElementById("edit-where-img") as TextField;
    const tagE = this.shadowRoot!.getElementById("edit-where-tag") as TextField;
    // TODO: later these may be made visible for some kinds of spaces
    (nameE as HTMLElement).style.display = "none";
    (imgE as HTMLElement).style.display = "none";
    nameE.value = options.name;
    imgE.value = options.img;
    tagE.value = options.tag;
    if (options.isEdit) {
      this.dialogIsEdit = options.isEdit;
      if (coord) this.dialogCoord = coord;
      if (idx) this.dialogIdx = idx;
    } else {
      this.dialogIsEdit = false;
    }
    this.whereDialogElem.open = true;
  }

  get whereDialogElem(): Dialog {
    return this.shadowRoot!.getElementById("edit-where") as Dialog;
  }

  private async handleWhereDialog(e: any) {
    if (e.detail.action == "ok") {
      const tag = this.shadowRoot!.getElementById(
        "edit-where-tag"
      ) as TextField;
      const img = this.shadowRoot!.getElementById(
        "edit-where-img"
      ) as TextField;
      const name = this.shadowRoot!.getElementById(
        "edit-where-name"
      ) as TextField;
      const where: Location = {
        location: this.dialogCoord,
        meta: {
          tag: tag.value,
          img: img.value,
          name: name.value,
        },
      };
      if (this.dialogIsEdit) {
        this._store.updateWhere(
          this.current,
          this.dialogIdx,
          this.dialogCoord,
          tag.value
        );
      } else {
        this._store.addWhere(this.current, where);
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
          this._store.updateWhere(this.current, idx, coord);
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
          const w = this._store.space(this.current).wheres[idx];
          this.openWhereDialog(
            {
              name: w.entry.meta.name,
              img: w.entry.meta.img,
              tag: w.entry.meta.tag,
              isEdit: true,
            },
            w.entry.location,
            idx
          );
        }
      }
    }
  }

  render() {
    if (!this.current) return;
    const space = this._spaces[this.current];
    const z = this._zooms[this.current];
    const whereItems = space.wheres.map((where, i) => {
      const x = where.entry.location.x * z;
      const y = where.entry.location.y * z;

      return html`
        <img
          .draggable=${true}
          @dblclick="${(e: Event) => this.dblclick(e)}"
          @dragstart="${(e: DragEvent) => this.drag(e)}"
          idx="${i}"
          class="where-marker ${where.entry.meta.name == this.myNickName
            ? "me"
            : ""}"
          style="left: ${x}px; top: ${y}px;"
          src="${where.entry.meta.img}"
        />
        <div
          class="where-details ${where.entry.meta.name == this.myNickName
            ? "me"
            : ""}"
          style="left: ${x}px; top: ${y}px;"
          src="${where.entry.meta.img}"
        >
          <h3>${where.entry.meta.name}</h3>
          <p>${where.entry.meta.tag}</p>
        </div>
      `;
    });

    const dataItems = JSON.parse(space.surface.data).map((item: any) => {
      return html`
        <div
          class="data-item"
          style="width: ${item.box.width * z}px;
            height: ${item.box.height * z}px;
            left: ${item.box.left * z}px;
            top: ${item.box.top * z}px;
          ${item.style}"
        >
          ${item.content}
        </div>
      `;
    });

    const w = space.surface.size.x * z;
    const h = space.surface.size.y * z;
    return html`
      <div class="surface" style="width: ${w * 1.01}px; height: ${h * 1.01}px;">
        <img
          @drop="${(e: DragEvent) => this.drop(e)}"
          @dragover="${(e: DragEvent) => this.allowDrop(e)}"
          style="width: ${w}px; height: ${h}px;"
          .id="${this.current}-img"
          src="${space.surface.url}"
          @click=${this.handleClick}
        />
        ${whereItems} ${dataItems}
        <mwc-dialog
          id="edit-where"
          heading="Where"
          @closing=${this.handleWhereDialog}
        >
          <mwc-textfield
            id="edit-where-name"
            placeholder="Name"
          ></mwc-textfield>
          <mwc-textfield
            id="edit-where-img"
            placeholder="Image Url"
          ></mwc-textfield>
          <mwc-textfield id="edit-where-tag" placeholder="Tag"></mwc-textfield>
          <mwc-button slot="primaryAction" dialogAction="ok">ok</mwc-button>
          <mwc-button slot="secondaryAction" dialogAction="cancel"
            >cancel</mwc-button
          >
        </mwc-dialog>
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

        .surface > img {
        }

        img.where-marker {
          max-width: 100%;
          max-height: 100%;
          border-radius: 10000px;
          border: black 1px solid;
          position: absolute;
          height: ${MARKER_WIDTH}px;
          width: ${MARKER_WIDTH}px;
          margin-top: -${MARKER_WIDTH / 2}px;
          margin-left: -${MARKER_WIDTH / 2}px;
          z-index: 1000;
        }

        img.where-marker.me {
          border: orange 2px solid;
        }

        .where-details {
          display: none;
          position: absolute;
          z-index: 1;

          background: white;
          border-radius: 10px;
          border: black 1px solid;
          padding: 15px;
          text-align: left;
        }

        .where-details.me {
          border: orange 2px solid;
        }

        .where-details h3 {
          margin: 0;
        }

        .where-details p:last-of-type {
          margin-bottom: 0;
        }

        .where-marker:hover + .where-details,
        .where-details:hover {
          display: block;
        }

        .data-item {
          position: absolute;
          pointer-events: none;
          text-align: center;
        }
      `,
    ];
  }
}
