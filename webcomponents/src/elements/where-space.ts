import {css, html} from "lit";
import {customElement, property, query, state} from "lit/decorators.js";
import {sharedStyles} from "../sharedStyles";
import {MARKER_WIDTH, renderMarker, renderUiItems} from "../sharedRender";
import {unsafeSVG} from 'lit/directives/unsafe-svg.js';
import {unsafeHTML} from 'lit/directives/unsafe-html.js';
import 'emoji-picker-element';
import {prefix_canvas} from "../templates";
import {localized, msg} from '@lit/localize';
import {Coord, LocationInfo, LocOptions, Play, WhereLocation, WherePerspective} from "../viewModels/where.perspective";
import {MarkerPieceVariantSvg} from "../bindings/playset.types";
import {WhereDnaPerspective, WhereDvm} from "../viewModels/where.dvm";
import {MarkerType} from "../viewModels/playset.perspective";
import {DnaElement} from "@ddd-qc/lit-happ";
import {AgentPubKeyB64, EntryHashB64} from "@holochain/client";

import "@shoelace-style/shoelace/dist/components/avatar/avatar.js"
import "@shoelace-style/shoelace/dist/components/badge/badge.js"
import "@shoelace-style/shoelace/dist/components/color-picker/color-picker.js"
import "@shoelace-style/shoelace/dist/components/tooltip/tooltip.js";
import "@shoelace-style/shoelace/dist/components/card/card.js";
import "@shoelace-style/shoelace/dist/components/input/input.js";

import "@material/mwc-drawer";
import "@material/mwc-top-app-bar";
import "@material/mwc-menu";
import "@material/mwc-list/mwc-list-item";
import "@material/mwc-list";
import "@material/mwc-dialog";
import "@material/mwc-slider";
import "@material/mwc-switch";
import "@material/mwc-select";
import "@material/mwc-list/mwc-check-list-item";
import "@material/mwc-icon";
import "@material/mwc-formfield";
import "@material/mwc-circular-progress";
import "@material/mwc-icon-button";
import "@material/mwc-top-app-bar-fixed";
import "@material/mwc-button";
import "@material/mwc-fab";
import "@material/mwc-icon-button-toggle";
import "@material/mwc-textfield";
import "@material/mwc-tab-bar";

import {TabBar} from "@material/mwc-tab-bar";
import {Fab} from "@material/mwc-fab";
import {Profile as ProfileMat} from "@ddd-qc/profiles-dvm";
import {consume} from "@lit/context";
import {weClientContext} from "../contexts";
import {WeServices} from "@lightningrodlabs/we-applet";
import {WhereLocationDialog} from "../dialogs/where-location-dialog";


// // Canvas Animation experiment
// function draw() {
//   let where_space = getWhereSpace();
//   const play: Play = where_space._plays.value[where_space.currentSpaceEh];
//   if (play.surface.canvas) {
//     const canvas_code = prefix_canvas('space-canvas') + play.surface.canvas;
//     var renderCanvas = new Function (canvas_code);
//     renderCanvas.apply(where_space);
//     window.requestAnimationFrame(draw);
//   }
// }
//
// function getWhereSpace(): WhereSpace {
//   let where_app = document.getElementsByTagName('where-page');
//   let where_controller = where_app[0].shadowRoot!.getElementById('controller');
//   let drawer = where_controller!.shadowRoot!.getElementById('my-drawer');
//   let where_space = drawer!.getElementsByTagName('where-space')[0] as WhereSpace;
//   //console.log({where_space})
//   return where_space;
// }


/** @element where-space */
@localized()
@customElement("where-space")
export class WhereSpace extends DnaElement<WhereDnaPerspective, WhereDvm>  {
  constructor() {
    super(WhereDvm.DEFAULT_BASE_ROLE_NAME);
    this.addEventListener("wheel", this._handleWheel);
  }


  @consume({ context: weClientContext, subscribe: true })
  weServices: WeServices;

  /** Properties */

  @property({type: Object, attribute: false, hasChanged: (_v, _old) => true})
  wherePerspective!: WherePerspective;
  // @property({type: Object, attribute: false, hasChanged: (_v, _old) => true})
  // playsetPerspective!: PlaysetPerspective;
  // @property({type: Object, attribute: false, hasChanged: (_v, _old) => true})
  // profilesPerspective!: ProfilesPerspective;

  @property({type: String}) currentSpaceEh: null | EntryHashB64 = null;
  @property() neighborWidth: number = 0;
  @property() soloAgent: AgentPubKeyB64 | null  = null; // filter for a specific agent

  /** State */

  private _myProfile!: ProfileMat;

  private _sessions?: any;
  private _activeIndex: number = -1;

  @state() private _loaded = false;

  private _canPostInit = false

  /** Getters */

  @query('#plus-fab') plusFab!: Fab;
  @query('#minus-fab') minusFab!: Fab;
  @query('#hide-here-fab') hideFab!: Fab;
  @query('#sessions-tab-bar') sessionTabBar!: TabBar;


  getCurrentPlay(): Play | undefined {
    return this.currentSpaceEh? this._dvm.getPlay(this.currentSpaceEh) : undefined
  }

  getCurrentSession(): EntryHashB64 | undefined {
    return this.currentSpaceEh? this._dvm.getCurrentSession(this.currentSpaceEh) : undefined
  }

  getCurrentZoom(): number | undefined {
    return this.currentSpaceEh? this._dvm.getZoom(this.currentSpaceEh) : undefined
  }


  /** -- Methods -- */

  /** */
  async initFab(fab: Fab) {
    await fab.updateComplete;
    const button = fab.shadowRoot!.querySelector('button')! as HTMLElement;
    button.style.height = '30px';
    button.style.width = '30px';
    button.style.borderRadius = "25%";
  }


  /** */
  async firstUpdated() {
    this._dvm.whereZvm.subscribe(this, 'wherePerspective');
    // this._dvm.playsetZvm.subscribe(this, 'playsetPerspective');
    await this._dvm.profilesZvm.probeProfile(this._dvm.cell.agentPubKey)
    this._myProfile = this._dvm.profilesZvm.getProfile(this._dvm.cell.agentPubKey)!;
    //await this.postInit();
    this._loaded = true;
    this._canPostInit = true;
  }


  /** */
  async updated(changedProperties: any) {
    //console.log("*** updated() called!");
    if (!this._loaded) {
      return;
    }
    if (this._canPostInit) {
      await this.postInit();
    }
    if (!this.currentSpaceEh /*|| !this._plays.value*/) {
      return;
    }
    const play = this.getCurrentPlay();
    if (!play) {
      return;
    }

    // - Tab bar bug workaround ; don't use scrollIndexIntoView() since its broken
    if (this.sessionTabBar && this.sessionTabBar.activeIndex != this._activeIndex) {
      //this.sessionTabBar.scrollIndexIntoView(this._activeIndex);
      this.sessionTabBar.activeIndex = this._activeIndex
      this.requestUpdate();
    }
    // - Canvas

    if (play.space.surface.canvas) {
      //console.log(" - has canvas");
      const canvas_code = prefix_canvas('space-canvas') + play.space.surface.canvas;
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


  /** */
  connectedCallback() {
    super.connectedCallback();
    window.addEventListener('resize', this._handleResize);
  }
  disconnectedCallback() {
    window.removeEventListener('resize', this._handleResize);
    super.disconnectedCallback();
  }


  /** */
  private _handleResize = (e: UIEvent) => {
    this.requestUpdate();
  }


  /** */
  private _handleWheel = (e: WheelEvent) => {
    if (e.target && this.currentSpaceEh) {
      e.preventDefault();
      this._dvm.updateZoom(this.currentSpaceEh, e.deltaY > 0 ? -0.05 : 0.05);
   }
  };


  /** */
  updateZoom(delta: number): void {
    this._dvm.updateZoom(this.currentSpaceEh!, delta);
  }


  /** */
  get myNickName(): string {
    return this._myProfile!.nickname;
  }


  /** */
  private getCoordsFromEvent(event: any): Coord {
    const rect = event.currentTarget.getBoundingClientRect();
    const z = this._dvm.getZoom(this.currentSpaceEh!);
    const x = (event.clientX - rect.left) / z!; //x position within the element.
    const y = (event.clientY - rect.top) / z!; //y position within the element.
    return { x, y };
  }


  /**
   * Can create a Location if:
   *  - session is allowed
   *  - multi location per agent are allowed or if this agent does not already have a Location
   */
  private canCreateLocation(): boolean {
    const currentPlay = this.getCurrentPlay();
    if (!currentPlay) return false;
    /* Session allowed */
    if (!this._dvm.isCurrentSessionToday(this.currentSpaceEh!)) {
      return false;
    }
    /* Marker allowed if multi-allowed or if single and no other loc found*/
    if (currentPlay.space.meta!.multi) {
      return true;
    }
    const maybeLocation = this._dvm.getPeerFirstLocation(this.currentSpaceEh!, this.myNickName);
    return maybeLocation === null;
  }


  /** */
  private canUpdateLocation(idx: number): boolean {
    const currentPlay = this.getCurrentPlay();
    console.log("canUpdateLocation()", idx, currentPlay);
    if (!currentPlay) return false;
    if (!this._dvm.isCurrentSessionToday(this.currentSpaceEh!)) {
      return false;
    }
    const sessionEh = this.getCurrentSession();
    const session = this._dvm.whereZvm.getSession(sessionEh!)!;
    const locInfo = session.locations[idx]!;
    //const locInfo = currentPlay.sessions[sessionEh!].locations[idx]!;
    // TODO: should check agent key instead
    return locInfo.location.meta.authorName == this.myNickName;
  }


  /** on surface click, try to create Location */
  private handleSurfaceClick(event: any): void {
    //console.log("handleSurfaceClick: ", this.currentSpaceEh, event, this.canCreateLocation())
    if (!this.currentSpaceEh || event == null || !this.canCreateLocation()) {
      return;
    }
    const currentPlay = this.getCurrentPlay();
    if (!currentPlay) return;
    //console.log("handleSurfaceClick: ", currentPlay.space.name, currentPlay.space.meta?.singleEmoji)
    const coord = this.getCoordsFromEvent(event);
    if (this.canEditLocation(currentPlay)) {
      // this._dialogCoord = coord;
      // //TODO fixme with a better way to know dialog type
      // this._dialogCanEdit = false;
      const options: LocOptions = {
        attachables: [],
        tag: currentPlay.space.meta?.canTag ? "" : null,
        emoji: "",
        name: this.myNickName,
        img: this._myProfile!.fields.avatar,
        canUpdateLoc: false,
      }
      const locationDialog = this.shadowRoot!.getElementById("loc-dialog") as WhereLocationDialog;
      locationDialog.open(options, coord);
    } else {
      /** Publish pre-defined marker */
      let svgMarker = ""
      if (currentPlay.space.maybeMarkerPiece && "svg" in currentPlay.space.maybeMarkerPiece) {
        let eh = (currentPlay.space.maybeMarkerPiece as MarkerPieceVariantSvg).svg;
        svgMarker = this._dvm.playsetZvm.getSvgMarker(eh)!.value;
      }
      if (!this.getCurrentSession()) console.error("Current session not found for space", this.currentSpaceEh)
      const location: WhereLocation = {
        coord,
        sessionEh: this.getCurrentSession()!,
        meta: {
          markerType: currentPlay.space.meta.markerType,
          attachables: [],
          tag: "",
          img: this._myProfile!.fields.avatar,
          color: this._myProfile!.fields.color? this._myProfile!.fields.color : "#000000",
          authorName: this.myNickName,
          emoji: currentPlay.space.meta?.singleEmoji,
          svgMarker,
        },
      };
      this._dvm.publishLocation(location, this.currentSpaceEh);
    }
  }


  /** */
  private allowDrop(ev: Event) {
    ev.preventDefault();
  }


  /** */
  private drag(dragEvent: DragEvent) {
    //console.log("dragstart", dragEvent)
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


  /** */
  private drop(ev: any) {
    //console.log("dragEnd", ev)
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
    this._dvm.updateLocation(this.currentSpaceEh!, idx, coord)
  }


  /** */
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


  /** Open LocationDialog on clicked element if possible */
  private onEditLocation(idx: number) {
    //const idx = this.getIdx(ev.target)!;
    if (!this.canUpdateLocation(idx)) {
      return;
    }
    const currentSessionEh = this.getCurrentSession();
    const currentPlay = this.getCurrentPlay();
    if (!currentPlay || !currentSessionEh) return;
    const session = this._dvm.whereZvm.getSession(currentSessionEh)!;
    const locInfo = session.locations[idx];
    console.log(`onEditLocation(${idx})`, locInfo.location.meta);
    const locationDialog = this.shadowRoot!.getElementById("loc-dialog") as WhereLocationDialog;
    locationDialog.open(
      {
        name: locInfo.location.meta.authorName,
        img: locInfo.location.meta.img,
        emoji: locInfo.location.meta.emoji,
        tag: locInfo.location.meta.tag,
        canUpdateLoc: true,
        attachables: locInfo.location.meta.attachables,
      },
      locInfo.location.coord,
      idx
    );
  }


  /** */
  renderActiveSurface(surface: any, w: number, h: number) {
    if (surface.html) {
      return html`<div
          @drop="${(e: DragEvent) => this.drop(e)}"
          @dragover="${(e: DragEvent) => this.allowDrop(e)}"
          style="width: ${w}px; height: ${h}px;"
          id="space-div"
          @click=${this.handleSurfaceClick}
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
          @click=${this.handleSurfaceClick}
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
                        @click=${this.handleSurfaceClick}
    >`
  }


  /** */
  async handleImportAttachableClick(idx: number) {
    //const idx = this.getIdx(ev.target);
    console.log("handleImportAttachableClick()", idx);
    const hrlc = await this.weServices.userSelectHrl();
    const locInfo = this._dvm.whereZvm.getLocations(this.getCurrentSession())[idx];
    const attachables = locInfo.location.meta.attachables.concat([hrlc.hrl]);
    await this._dvm.updateLocation(this.currentSpaceEh, idx, null, null, null, attachables);
    this.requestUpdate();
  }


  /** */
  handleDeleteClick(ev: any): void {
    const idx = this.getIdx(ev.target)!;
    this._dvm.deleteLocation(this.currentSpaceEh!, idx).then(() => {});
  }


  /** */
  canEditLocation(play?: Play): boolean {
    if (!play) play = this.getCurrentPlay();
    if (!play) return false;
    const canPickEmoji = play.space.meta.markerType == MarkerType.AnyEmoji
                      || play.space.meta.markerType == MarkerType.EmojiGroup;
    return play.space.meta.canTag || canPickEmoji;
  }


  /** */
  renderLocation(locInfo: LocationInfo | null, z: number, play: Play, i: number) {
    console.log("<where-space>.renderLocation()", locInfo);
    if (locInfo === null) {
      return;
    }
    const x = locInfo.location.coord.x * z;
    const y = locInfo.location.coord.y * z;
    /** Render Marker */
    // TODO: should check agent key and not nickname
    const isMe = locInfo.location.meta.authorName == this.myNickName;
    let marker = renderMarker(locInfo.location.meta, isMe);
    /** Extra elements for when it's my Location */
    let maybeMeClass  = "not-me";
    let maybeDeleteBtn = html ``;
    let maybeEditBtn = html ``;
    let borderColor = locInfo.location.meta.color;

    if (isMe) {
      maybeMeClass = "me";
      //borderColor = this._myProfile.value.fields.color? this._myProfile.value.fields.color : "black";
      if (this._dvm.isCurrentSessionToday(this.currentSpaceEh!)) {
        maybeDeleteBtn = html`<button idx=${i} @click=${this.handleDeleteClick}>Remove</button>`
        if (this.canEditLocation(play)) {
          maybeEditBtn = html`<button idx=${i} @click=${(_e) => this.onEditLocation(i)}>Edit</button>`
        }
      }
    };
    /** adjust details position if too low */
    const details_height = 40
      + (locInfo.location.meta.tag? 20 : 0)
      + (isMe? 40 : 0)
    const details_y = play.space.surface.size.y * z - y < details_height? y - details_height : y;
    /** Render attachables */
    let maybeAttachableDetails = html``;
    if (this.weServices && play!.space.meta?.canAttach) {
      let attachables = [];
      if (locInfo.location.meta.attachables) {
        attachables = locInfo.location.meta.attachables.map((hrl) => {
          return html`
            <we-hrl .hrl=${hrl}></we-hrl>`;
        })
      }
      maybeAttachableDetails = html`
        <div style="display:flex; flex-direction:column; gap:5px; margin-top:5px;">
          ${attachables}
          <button style="margin-bottom: 3px;" idx=${i} @click="${(_ev) => this.handleImportAttachableClick(i)}">Add attachable</button>
        </div>
    `;
    }
    /** Render Location */
    return html`
      <div
        .draggable=${true}
        @dblclick=${(_e) => this.onEditLocation(i)}
        @dragstart=${(e: DragEvent) => this.drag(e)}
        idx=${i} class="location-marker" style="left: ${x - (MARKER_WIDTH / 2)}px; top: ${y - (MARKER_WIDTH / 2)}px;">
      ${marker}
      ${play.space.meta?.tagVisible && locInfo.location.meta.tag?
        html`<div class="location-tag" style="border:1px solid ${borderColor};">${locInfo.location.meta.tag}</div>`
        : html`` }
      </div>
      <div class="location-details ${maybeMeClass}" style="left: ${x}px; top: ${details_y}px;">
        <h3>${locInfo.location.meta.authorName}</h3>
        ${locInfo.location.meta.markerType != MarkerType.Tag? html`<p>${locInfo.location.meta.tag}</p>`:html``}
        ${maybeEditBtn}
        ${maybeDeleteBtn}
        ${maybeAttachableDetails}
      </div>
    `;
  }


  /** */
  toggleHideHere() {
    if (this.hideFab.icon === 'visibility') {
      this.hideFab.icon = 'visibility_off'
    }  else {
      this.hideFab.icon ='visibility';
    }
    this.requestUpdate();
  }


  /** */
  private handleZoomSlider(input: number): void {
    /** update zoom from absolute value */
    const zoom = Math.min(input, 999);
    const cur: number = (this.getCurrentZoom()! * 100);
    const delta = (zoom - cur) / 100;
    this.updateZoom(delta);
  }



  // @input=${() => (this.shadowRoot!.getElementById("edit-location-tag") as TextField).reportValidity()} autoValidate=true
  // @closing=${this.handleLocationDialogClosing}


  /** */
  private async handleTabSelected(e: any) {
    //console.log("handleTabSelected:", e.detail.index);
    const sessionName = e.detail.index;
    const selectedSessionEh = this.perspective.plays[this.currentSpaceEh!].sessions[sessionName];
    //console.log("handleTabSelected.selectedSessionEh", selectedSessionEh)
    this._dvm.setCurrentSession(this.currentSpaceEh!, selectedSessionEh);
    this.requestUpdate();
  }

  /** */
  private async postInit() {
    await this.initFab(this.plusFab);
    await this.initFab(this.minusFab);
    await this.initFab(this.hideFab);
    this._canPostInit = false;
  }


  /** */
  render() {
    console.log("<where-space> render()", this.currentSpaceEh)
    if (!this._loaded) {
      return html`<div class="fill center-content">
        <mwc-circular-progress indeterminate></mwc-circular-progress>
      </div>`;
    }

    // console.log({WherePerspective: this.wherePerspective})

    /** Determine max size */
    const maxW = window.innerWidth - this.neighborWidth - 24; // minus scroll bar
    const maxH = window.innerHeight - 50 - 20; // minus top app bar, scroll bar
    //console.log("max-width: ", maxW);
    //console.log("max-height: ", maxH);

    /** Render fabs */
    const zoomValue = this.getCurrentZoom()? this.getCurrentZoom()! * 100 : 100;
    const fabs = html`
      <mwc-fab mini id="minus-fab" icon="remove" style="left:0px;top:0px;" @click=${() => this.updateZoom(-0.05)}></mwc-fab>
      <mwc-slider min="10" max="300" style="position:absolute;left:20px;top:-5px;width:120px;"
                  @input=${(e:any) => this.handleZoomSlider(e.target.value)} value="${zoomValue}">
      </mwc-slider>
      <mwc-fab mini id="plus-fab" icon="add" style="left:120px;top:0px;" @click=${() => this.updateZoom(0.05)}></mwc-fab>
      <mwc-fab mini id="hide-here-fab" icon="visibility" style="left:160px;top:0px;" @click=${() => this.toggleHideHere()}></mwc-fab>
    `;

    /** Default render if no plays found */
    if (!this.getCurrentPlay()) {
      return html`
      <div class="surface" style="min-width:200px; min-height:200px;max-width:${maxW}px; max-height:${maxH}px;">
        ${msg('No space found')}
        ${fabs}
      </div>
    `;
    }

    /** Get current play and zoom level */
    const currentPlay = this.getCurrentPlay()!;
    const z = this.getCurrentZoom()!;
    let currentSessionEh = this.getCurrentSession();
    //console.log("<where-space> render() currentSessionEh", currentSessionEh)

    if (!currentSessionEh) {
      console.warn("CurrentSession not found for play. Setting to last session", currentPlay.space.name, currentPlay)
      const sessionEhs = Object.values(currentPlay.sessions);
      currentSessionEh = sessionEhs[sessionEhs.length - 1];
      this._dvm.setCurrentSession(this.currentSpaceEh!, currentSessionEh)
    }

    /** Render locations if we have a current session */
    let locationItems = undefined;
    const session = this._dvm.whereZvm.getSession(currentSessionEh);
    //let session = currentPlay.sessions[currentSessionEh];
    if (!session) {
      console.error(" ** Session not found in Play '" + currentPlay.space.name + "' | " + currentSessionEh)
      console.error({play: currentPlay})
    } else {
      /** Render Play's session's locations */
      if (!this.hideFab || this.hideFab && this.hideFab.icon === 'visibility') {
        locationItems = session.locations.map((locationInfo, i) => {
          if (this.soloAgent != null && locationInfo) {
            if (this.soloAgent != locationInfo.authorPubKey) {
              return;
            }
          }
          return this.renderLocation(locationInfo, z, currentPlay, i)
        });
      }
    }


    /** Session Tab bar */
    this._sessions = {};
    this._activeIndex = -1
    const sessionTabs = Object.entries(currentPlay.sessions).map(([key, curSessionEh])=> {
      const curSession = this._dvm.whereZvm.getSession(curSessionEh)!;
      //return html `<span>${session.name} </span>`
      this._sessions[curSession.index] = key;
      if (session && currentSessionEh == key) {
        this._activeIndex = curSession.index
      }
      return html `<mwc-tab label="${curSession.name}"></mwc-tab>`
    });

    let sessionTab = html`<mwc-tab-bar id="sessions-tab-bar" activeIndex="${this._activeIndex}" @MDCTabBar:activated=${this.handleTabSelected}></mwc-tab-bar>`
    if (sessionTabs.length > 1) {
      sessionTab = html`
        <mwc-tab-bar id="sessions-tab-bar" activeIndex="${this._activeIndex}" @MDCTabBar:activated=${this.handleTabSelected}>${sessionTabs}</mwc-tab-bar>
      `
    }

    /** Parse UI elements in surface meta */
    let uiItems = html ``
    if (currentPlay.space.meta && currentPlay.space.meta.ui) {
      uiItems = renderUiItems(currentPlay.space.meta.ui, z, z)
    }
    /** Set viewed width and height and render Surface accordingly */
    const w = currentPlay.space.surface.size.x * z;
    const h = currentPlay.space.surface.size.y * z;

    /** render Surface */
    const surfaceItem = this.renderActiveSurface(currentPlay.space.surface, w, h)

    /** Render layout - 1.01 because of scroll bars */
    return html`
      <!-- <h2>${session? session.name : "not found"}</h2> -->
      ${sessionTab}

      <div class="surface" style="width: ${w * 1.01}px; height: ${h * 1.01}px;max-width: ${maxW}px; max-height: ${maxH}px;">
        ${surfaceItem}
        ${uiItems}
        ${locationItems}
        ${fabs}
      </div>
      <where-location-dialog id="loc-dialog" .play=${currentPlay} .spaceEh=${this.currentSpaceEh} .myProfile=${this._myProfile}></where-location-dialog>
    `;
  }


  /** */
  static get styles() {
    return [
      sharedStyles,
      css`
        .surface {
          position: relative;
          /*overflow: auto;*/
          min-width:160px;
        }

        #space-div {
          width: 100%;
          height: 100%;
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

        .location-tag {
          background-color: white;
          border-radius: 5px;
          /**border: black 1px solid;*/
          box-shadow: 1px 1px 4px #aaa;
          font-size: 75%;
          width: 80px;
          overflow-x: auto;
          margin-left: -20px;
          text-align: center;
          padding-top: 2px;
          padding-bottom: 2px;
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
