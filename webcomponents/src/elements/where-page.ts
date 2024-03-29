import {css, html} from "lit";
import {property, state, customElement} from "lit/decorators.js";

import randomColor from "randomcolor";
import {sharedStyles} from "../sharedStyles";

import {AgentPubKeyB64, EntryHashB64} from "@holochain/client";

import {renderSurface} from "../sharedRender";
import {prefix_canvas} from "../templates";

import { localized, msg } from '@lit/localize';
import {WhereDnaPerspective, WhereDvm} from "../viewModels/where.dvm";
import {Play, WherePerspective} from "../viewModels/where.perspective";
import {PlaysetEntryType, Template} from "../bindings/playset.types";
import {CloneId, delay, DnaElement, HAPP_ENV, HappEnvType} from "@ddd-qc/lit-happ";
//import {WhereCloneLudoDialog} from "../dialogs/where-clone-ludo-dialog";

import {SignalPayload} from "../bindings/where.types";
import {Dictionary} from "@ddd-qc/cell-proxy";
import {CellsForRole} from "@ddd-qc/cell-proxy/dist/types";

import {WherePeerList} from "./where-peer-list";
import {WhereSpace} from "./where-space";
import {WherePlayDialog} from "../dialogs/where-play-dialog";
import {WhereTemplateDialog} from "../dialogs/where-template-dialog";
import {WhereArchiveDialog} from "../dialogs/where-archive-dialog";
import {WherePlayInfoDialog} from "../dialogs/where-play-info-dialog";
import {WhereLudoDialog} from "../dialogs/where-ludo-dialog";

import "@shoelace-style/shoelace/dist/components/avatar/avatar.js"
import "@shoelace-style/shoelace/dist/components/badge/badge.js"
import "@shoelace-style/shoelace/dist/components/color-picker/color-picker.js"
import "@shoelace-style/shoelace/dist/components/tooltip/tooltip.js";
import "@shoelace-style/shoelace/dist/components/card/card.js";

import "@material/mwc-drawer";
import {Drawer} from "@material/mwc-drawer";
import "@material/mwc-top-app-bar";
import {TopAppBar} from "@material/mwc-top-app-bar";
import "@material/mwc-menu";
import {Menu} from "@material/mwc-menu";
import "@material/mwc-list/mwc-list-item";
import {ListItem} from "@material/mwc-list/mwc-list-item";
import "@material/mwc-list";
import {List} from "@material/mwc-list";
import "@material/mwc-dialog";
import {Dialog} from "@material/mwc-dialog";
import "@material/mwc-slider";
import "@material/mwc-switch";
import "@material/mwc-select";
import "@material/mwc-list/mwc-check-list-item";
import "@material/mwc-icon";
import "@material/mwc-formfield";
import "@material/mwc-circular-progress";
import {IconButton} from "@material/mwc-icon-button";
import "@material/mwc-top-app-bar-fixed";
import "@material/mwc-button";
import "@material/mwc-fab";
import "@material/mwc-icon-button-toggle";
import "@material/mwc-textfield";
import {Profile as ProfileMat} from "@ddd-qc/profiles-dvm";


/** Styles for top-app-bar */
const tmpl = document.createElement('template');
tmpl.innerHTML = `
<style>
  :host header {
      position: relative;
  }
  :host div.mdc-top-app-bar--dense-fixed-adjust {
  padding-top: 0px;
  }
</style>
`;

/** ----- */


/** @element where-page */
@localized()
@customElement("where-page")
export class WherePage extends DnaElement<WhereDnaPerspective, WhereDvm> {
  constructor() {
    super(WhereDvm.DEFAULT_BASE_ROLE_NAME);
  }

  /** Properties */
  @property({ type: Boolean, attribute: 'dummy' })
  canLoadDummy: boolean = false;

  @property()
  ludoRoleCells: CellsForRole | null = null;

  @property()
  currentSpaceEh: null | EntryHashB64 = null;

  @property({ type: Boolean, attribute: 'canShowBuildView' })
  canShowBuildView!: boolean;


  /** ViewModels */

  @property({type: Object, attribute: false, hasChanged: (_v, _old) => true})
  wherePerspective!: WherePerspective;

  private _myProfile?: ProfileMat;


  /** State */


  @state() private _canShowPeers: boolean = true;
  @state() private _neighborWidth: number = 150;

  @state() private _currentTemplateEh?: EntryHashB64;

  @state() private _initialized = false;
  private _canPostInit = false;


  /** Getters */

  get playInfoDialogElem(): WherePlayInfoDialog {
    return this.shadowRoot!.getElementById("play-info-dialog") as WherePlayInfoDialog;
  }

  get helpDialogElem(): Dialog {
    return this.shadowRoot!.getElementById("help-dialog") as Dialog;
  }

  get profileDialogElem(): Dialog {
    return this.shadowRoot!.getElementById("where-profile-dialog") as Dialog;
  }

  get drawerElem() : Drawer {
    return this.shadowRoot!.getElementById("my-drawer") as Drawer;
  }

  get archiveDialogElem() : WhereArchiveDialog {
    return this.shadowRoot!.getElementById("archive-dialog") as WhereArchiveDialog;
  }

  get templateDialogElem() : WhereTemplateDialog {
    return this.shadowRoot!.getElementById("template-dialog") as WhereTemplateDialog;
  }

  get playListElem(): List {
    return this.shadowRoot!.getElementById("play-list") as List;
  }

  get spaceElem(): WhereSpace {
    return this.shadowRoot!.getElementById("where-space") as WhereSpace;
  }

  get peerListElem(): WherePeerList {
    return this.shadowRoot!.getElementById("where-peer-list") as WherePeerList;
  }

  get playDialogElem() : WherePlayDialog {
    return this.shadowRoot!.getElementById("play-dialog") as WherePlayDialog;
  }

  get myNickName(): string {
    return this._myProfile!.nickname;
  }
  get myAvatar(): string {
    return this._myProfile!.fields.avatar;
  }
  get myColor(): string {
    return this._myProfile!.fields.color;
  }

  /** -- Methods -- */

  /** */
  private randomRobotName(): string {
    const charCodeA = "A".charCodeAt(0);
    const charCode0 = "0".charCodeAt(0);

    const randomA = String.fromCharCode(charCodeA + Math.floor(Math.random() * 26));
    const randomB = String.fromCharCode(charCodeA + Math.floor(Math.random() * 26));

    const random1 = String.fromCharCode(charCode0 + Math.floor(Math.random() * 10));
    const random2 = String.fromCharCode(charCode0 + Math.floor(Math.random() * 10));
    const random3 = String.fromCharCode(charCode0 + Math.floor(Math.random() * 10));

    return randomA + randomB + '-' + random1 + random2 + random3;
  }


  /** */
  private async createDummyProfile() {
    const nickname: string = this.randomRobotName();
    //console.log(nickname);
    const color: string = randomColor({luminosity: 'light'});
    //console.log(color);
    await this.setMyProfile(nickname, `https://robohash.org/${nickname}`, color)
    //await this.updateProfile("Cam", "https://cdn3.iconfinder.com/data/icons/avatars-9/145/Avatar_Cat-512.png", "#69de85")
  }


  /** */
  async setMyProfile(nickname: string, avatar: string, color: string) {
    console.log("updateProfile() called:", nickname)
    const fields: Dictionary<string> = {};
    fields['color'] = color;
    fields['avatar'] = avatar;
    try {
    if (this._dvm.profilesZvm.getProfile(this._dvm.profilesZvm.cell.agentPubKey)) {
      await this._dvm.profilesZvm.updateMyProfile({nickname, fields});
    } else {
      await this._dvm.profilesZvm.createMyProfile({nickname, fields});
    }
    } catch (e) {
      console.log("createMyProfile() failed");
      console.log(e);
    }
  }


  /** After first render only */
  async firstUpdated() {
    console.log("<where-page> firstUpdated()");
    if (this.canLoadDummy) {
      await this.createDummyProfile();
    }

    this._dvm.whereZvm.subscribe(this, 'wherePerspective');
    //this._dvm.playsetZvm.subscribe(this, 'playsetPerspective');

    /** Get latest public entries from DHT */
    /*await*/
    //this._dvm.probeAll()
    //.then(() => {
      this.pingAllOthers();

      /** Select first play if none is set */
      if (!this.currentSpaceEh) {
        const firstSpaceEh = this.getFirstVisiblePlay(this.perspective.plays);
        if (firstSpaceEh) {
          /*await*/ this.selectPlay(firstSpaceEh);
          //return;
        }
      }
    //})
    /** Done */
    this._initialized = true
    this._canPostInit = true;
  }


  /** After each render */
  async updated(changedProperties: any) {
    console.log("<where-page> updated()")
    if (this._canPostInit && this.shadowRoot!.getElementById("app-bar")) {
      this.postInit();
    }

    /* look for canvas in Plays and render them */
    for (let spaceEh in this.perspective.plays) {
      let play: Play = this.perspective.plays[spaceEh];
      if (play.space.surface.canvas && this._dvm.getVisibility(spaceEh)!) {
        const id = play.space.name + '-canvas'
        const canvas = this.shadowRoot!.getElementById(id) as HTMLCanvasElement;
        if (!canvas) {
          console.debug("CANVAS not found for " + id);
          continue;
        }
        //console.log({canvas})
        var ctx = canvas.getContext("2d");
        if (!ctx) {
          console.log("CONTEXT not found for " + id);
          continue;
        }
        //console.log({ctx})
        //console.log("Rendering CANVAS for " + id)
        try {
          let canvas_code = prefix_canvas(id) + play.space.surface.canvas;
          var renderCanvas = new Function(canvas_code);
          renderCanvas.apply(this);
        } catch (e) {}
      }
    }
  }


  /** */
  private getFirstVisiblePlay(plays: Dictionary<Play>): null| EntryHashB64 {
    if (Object.keys(plays).length == 0) {
      return null;
    }
    for (let spaceEh in plays) {
      if (this._dvm.getVisibility(spaceEh)!) {
        return spaceEh
      }
    }
    return null;
  }


  /** */
  private anchorCreateMenu() {
    const menu = this.shadowRoot!.getElementById("create-menu") as Menu;
    const div = this.shadowRoot!.getElementById("create-fab") as any;
    console.log("<where-page> create - Anchoring Menu to top button", menu, div)
    if (menu && div) {
      menu.anchor = div
    }
  }

  /** */
  private anchorSpaceMenu() {
    const menu = this.shadowRoot!.getElementById("space-menu") as Menu;
    const div = this.shadowRoot!.getElementById("space-menu-button") as any;
    console.log("<where-page> space - Anchoring Menu to top button", menu, div)
    if (menu && div) {
      menu.anchor = div
    }
  }

  /** */
  private anchorLudothequeMenu() {
    const menu = this.shadowRoot!.getElementById("page-ludotheque-menu") as Menu;
    const button = this.shadowRoot!.getElementById("page-ludo-button") as IconButton;
    console.log("<where-page> ludo - Anchoring Menu to top button", menu, button)
    if (menu && button) {
      menu.anchor = button
    }
  }

  /** */
  private anchorExportMenu() {
    const menu = this.shadowRoot!.getElementById("export-menu") as Menu;
    const div = this.shadowRoot!.getElementById("export-button") as any;
    console.log("<where-page> export - Anchoring Menu to top button", menu, div)
    if (menu && div) {
      menu.anchor = div
    }
  }


  /** */
  private postInit() {
    this._canPostInit = false;
    /** add custom styles to TopAppBar */
    const topBar = this.shadowRoot!.getElementById("app-bar") as TopAppBar;
    console.log("<where-page> postInit()", topBar);
    topBar.shadowRoot!.appendChild(tmpl.content.cloneNode(true));
    /** Menu */
    this.anchorSpaceMenu();
    this.anchorLudothequeMenu();
    this.anchorExportMenu();
    this.anchorCreateMenu();
    /** Drawer */
    const container = this.drawerElem.parentNode!;
    container.addEventListener('MDCTopAppBar:nav', () => {
      this.drawerElem.open = !this.drawerElem.open;
      // const margin = this.drawerElem.open? '256px' : '0px';
      // const menuButton = this.shadowRoot!.getElementById("where-menu-button") as IconButton;
      // menuButton.style.marginRight = margin;
      this._neighborWidth = (this.drawerElem.open? 256 : 0) + (this._canShowPeers? 150 : 0);
    });
    this.requestUpdate()
  }


  /** */
  private async selectPlay(spaceEh: EntryHashB64): Promise<void> {
    console.log("selectPlay()", spaceEh);
    let play = null;
    /** Wait for store to be updated with newly created Play */
    // TODO: Remove this hack
    let time = 0;
    while(!play && time < 2 * 1000) {
      play = this._dvm.getPlay(spaceEh);
      await delay(100);
      time += 100;
    }
    if (!play) {
      console.error("selectPlay() failed: Play not found")
      return Promise.reject("Play not found")
    }

    /** Check if play should generate a new session for today */
    if (play.space.meta.sessionCount < 0) {
      const today = new Intl.DateTimeFormat('en-GB', {timeZone: "America/New_York"}).format(new Date())
      let hasToday = false;
      Object.entries(play.sessions).map(
        ([name, sessionEh]) => {
          if (name == today /*"dummy-test-name"*/) {
            hasToday = true;
          }
        })
      //console.log("hasToday: " + hasToday + " | " + play.space.name + " | " + today)
      if (!hasToday) {
        await this._dvm.createNextSession(spaceEh, today /*"dummy-test-name"*/)
      }
    }

    /** (This will trigger a render()) */
    this.currentSpaceEh = spaceEh;
    this._currentTemplateEh = play.space.origin;

    // FIXME check if space has a current session?

    //this.requestUpdate();

    //console.log(" - selected template: " + this._currentTemplateEh);

    // const templates = await this._store.updateTemplates()
    // let div = this.shadowRoot!.getElementById("template-label") as HTMLElement;
    // if (div) {
    //   div.innerText = templates[this._currentTemplateEh].name;
    // }
  }


  /** Hide Current play and select first available one */
  async archiveSpace() {
    await this._dvm.whereZvm.hidePlay(this.currentSpaceEh!)
    /** Select first play */
    const firstSpaceEh = this.getFirstVisiblePlay(this.perspective.plays)
    console.log({firstSpaceEh})
    this.currentSpaceEh = firstSpaceEh
    this.requestUpdate()
  }


  /** */
  async pingActiveOthers() {
    //if (this._currentSpaceEh) {
      console.log("Pinging All Active");
      await this._dvm.pingPeers(this.currentSpaceEh, this._dvm.allCurrentOthers());
    //}
  }

  /** */
  async pingAllOthers() {
    //if (this._currentSpaceEh) {
    console.log("Pinging All Others");
    const agents = this._dvm.profilesZvm.getAgents();
    await this._dvm.pingPeers(this.currentSpaceEh, agents);
    //}
  }


  /** */
  async onDumpLogs() {
    this._dvm.dumpLogs();
  }

  /** */
  async onRefresh() {
    console.log("refresh: Pulling data from DHT")
    this._dvm.probeAll();
    await this.pingAllOthers();
  }


  /** */
  async openPlayInfoDialog(play: Play) {
    const dialog = this.playInfoDialogElem;
    const template = this._dvm.playsetZvm.getTemplate(play.space.origin);
    dialog.open(play, template);
  }


  /** */
  async openTemplateDialog(templateEh?: EntryHashB64) {
    this.templateDialogElem.clearAllFields();
    const template = templateEh? this._dvm.playsetZvm.getTemplate(templateEh) : undefined;
    this.templateDialogElem.open(template);
  }

  /** */
  async openArchiveDialog() {
    this.archiveDialogElem.open();
  }

  /** */
  async openPlayDialog(spaceEh?: EntryHashB64) {
    const maybePlay = spaceEh? this._dvm.getPlay(spaceEh) : undefined;
    this.playDialogElem.resetAllFields();
    this.playDialogElem.open(maybePlay);
    if (maybePlay) {
      this.playDialogElem.loadPreset();
    }
  }


  /** */
  private async handlePlaySelected(e: any): Promise<void> {
    const index = e.detail.index;
    if (index < 0) {
      return;
    }
    const value = this.playListElem.items[index].value;
    await this.selectPlay(value);
  }


  /** */
  private async onTemplateCreated(e: any) {
    const template = e.detail as Template;
    const eh = await this._dvm.playsetZvm.publishTemplateEntry(template);
    this._dvm.notifyPeers(
      {from: this._dvm.cell.agentPubKey, message: {type:"NewTemplate", content: eh}},
      this._dvm.allCurrentOthers(),
    )
  }

  /** */
  private async onPlayCreated(e: any) {
    console.log("onPlayCreated()", e.detail)
    const newPlayInput = e.detail;
    const spaceEh = await this._dvm.constructNewPlay(newPlayInput.space, newPlayInput.sessionNames)
    /* - Notify others */
    const newSpace: SignalPayload = {maybeSpaceHash: spaceEh, from: this._dvm.cell.agentPubKey, message: {type: 'NewSpace', content: spaceEh}};
    this._dvm.notifyPeers(newSpace, this._dvm.allCurrentOthers());
    /* */
    await this.selectPlay(spaceEh);
  }


  /** */
  async resetMyLocations() {
    await this._dvm.deleteAllMyLocations(this.currentSpaceEh!);
  }

  /** */
  private async handleArchiveDialogClosing(e: any) {
    /** Check if current play has been archived */
    if (e.detail.includes(this.currentSpaceEh)) {
      /** Select first visible play */
      const firstSpaceEh = this.getFirstVisiblePlay(this.perspective.plays);
      this.currentSpaceEh = firstSpaceEh;
      this.requestUpdate();
    }
  }


  /** */
  openCreateMenu() {
    const menu = this.shadowRoot!.getElementById("create-menu") as Menu;
    menu.open = true;
  }


  /** */
  openLudothequeMenu() {
    const menu = this.shadowRoot!.getElementById("page-ludotheque-menu") as Menu;
    menu.open = true;
  }

  /** */
  openExportMenu() {
    const menu = this.shadowRoot!.getElementById("export-menu") as Menu;
    menu.open = true;
  }

  /** */
  openSpaceMenu() {
    console.log("openSpaceMenu()")
    this.anchorSpaceMenu();
    const menu = this.shadowRoot!.getElementById("space-menu") as Menu;
    menu.open = true;
  }

  /** */
  onSpaceMenuSelected(e:any) {
    const menu = e.currentTarget as Menu;
    const selected = menu.selected as ListItem;
    console.log("onSpaceMenuSelected", selected);
    if (!selected) {
      return;
    }
    this.currentSpaceEh = selected.value;
    menu.open = false;
  }



  /** */
  onExportMenuSelected(e:any) {
    const menu = e.currentTarget as Menu;
    const selected = menu.selected as ListItem;
    console.log("onExportMenuSelected()", selected);
    if (!selected) {
      return;
    }
    if (selected.value == "__new__") {
      const dialog = this.shadowRoot!.getElementById("clone-ludo-dialog") as WhereLudoDialog;
      dialog.open();
      return;
    }
    const ludoCloneId = selected.value
      ? this.ludoRoleCells.clones[selected.value].cell_id
      : this.ludoRoleCells.provisioned.cell_id;

    if (this.currentSpaceEh) {
      this._dvm.playsetZvm.exportPiece(this.currentSpaceEh, PlaysetEntryType.Space, ludoCloneId);
    } else {
      console.warn("No space or ludotheque cell to export to");
    }
  }


  /** */
  onLudothequeMenuSelected(e:any) {
    const menu = e.currentTarget as Menu;
    const selected = menu.selected as ListItem;
    console.log("onLudothequeMenuSelected()", selected);
    if (!selected) {
      return;
    }
    if (selected.value == "__new__") {
      const dialog = this.shadowRoot!.getElementById("clone-ludo-dialog") as WhereLudoDialog;
      dialog.open();
      return;
    }
    this.dispatchEvent(new CustomEvent<string>('show-ludotheque', { detail: selected.value, bubbles: true, composed: true }));
  }


  /** */
  handleMenuSelect(e: any) {
    const menu = e.currentTarget as Menu;
    // console.log("handleMenuSelect: " + menu)
    const selected = menu.selected as ListItem;
    //console.log({selected})
    if (!selected) {
      return;
    }
    switch (selected.value) {
      case "fork_template":
        this.openTemplateDialog(this._currentTemplateEh)
        break;
      case "fork_space":
        this.openPlayDialog(this.currentSpaceEh? this.currentSpaceEh : undefined)
        break;
      case "create_template":
        this.openTemplateDialog(undefined)
        break;
      case "create_space":
        this.openPlayDialog( undefined)
        break;
      // case "archive_space":
      //   this.archiveSpace()
      //   break;
      // case "export_template":
      //   if (this._currentTemplateEh && this.ludoCellId) {
      //     this._dvm.playsetZvm.exportPiece(this._currentTemplateEh!, PlaysetEntryType.Template, this.ludoCellId!)
      //   } else {
      //     console.warn("No template or ludotheque cell to export to");
      //   }
      //   break;
      // case "export_space":
      //   if (this.currentSpaceEh && this.ludoCellId) {
      //     this._dvm.playsetZvm.exportPiece(this.currentSpaceEh, PlaysetEntryType.Space, this.ludoCellId!)
      //   } else {
      //     console.warn("No space or ludotheque cell to export to");
      //   }
        break;
      default:
        break;
    }
  }


  /** */
  async handleColorChange(e: any) {
    console.log("handleColorChange: " + e.target.lastValueEmitted)
    const color = e.target.lastValueEmitted;
    const profile = this._myProfile!;
    await this.setMyProfile(profile.nickname, profile.fields['avatar'], color)
  }


  /** */
  private async handleSpaceClick(event: any) {
    await this.pingActiveOthers();
  }


  /** */
  handleAvatarClicked(key: AgentPubKeyB64) {
    console.log("Avatar clicked: " + key)
    if (this.spaceElem) {
      this.spaceElem.soloAgent = key == this.spaceElem.soloAgent? null : key;
      this.requestUpdate();
    }
  }


  /** */
  getCellName(cloneId?: CloneId): string {
    if (!cloneId) {
      return this.ludoRoleCells.provisioned.name;
    }
    return this.ludoRoleCells.clones[cloneId].name;
  }


  /** */
  onAvatarClicked() {
    console.log("<where-page> onAvatarClicked()");
    this.profileDialogElem.open = true;
  }


  /** */
  private async onProfileEdited(profile: ProfileMat) {
    await this._dvm.profilesZvm.updateMyProfile(profile);
    this.profileDialogElem.open = false;
    /** Make sure a redraw is triggered */
    this._myProfile.fields.avatar = profile.fields.avatar;
    this._myProfile.fields.color = profile.fields.color;
    this.requestUpdate();
  }


  /** */
  render() {
    console.log("<where-page> render()", this._initialized, this.currentSpaceEh);
    if (!this._initialized) {
      return html`<mwc-circular-progress indeterminate></mwc-circular-progress>`;
    }

    // DEBUG
    //console.log({WhereDnaPerspective: this.perspective})
    //console.log({PlaysetPerspective: this._dvm.playsetZvm.perspective})


    /* -- Grab things from the perspective -- */

    this._myProfile = this._dvm.profilesZvm.getMyProfile();


    /* -- Build elements -- */

    if (this.drawerElem) {
      this._neighborWidth = (this.drawerElem.open ? 256 : 0) + (this._canShowPeers ? 150 : 0);
    }

    /** build ludotheque list */
    let ludoNamesLi: any[] = [];
    if (this.ludoRoleCells) {
      ludoNamesLi = Object.entries(this.ludoRoleCells!.clones).map(
        ([cloneId, cell]) => {
          return html`
          <mwc-list-item class="ludo-clone-li" value="${cell.clone_id}">
            ${cell.name}
          </mwc-list-item>
        `;
        }
      );
    }
    if (ludoNamesLi.length > 0) {
      ludoNamesLi.push(html`<li divider role="separator"></li>`);
    }
    ludoNamesLi.push(html`<mwc-list-item class="ludo-clone-li" value="${null}">${msg('Global')}</mwc-list-item>`);

    //let LudoConnectLi: any[] = []//JSON.parse(JSON.stringify(ludoNamesLi));
    //ludoNamesLi.forEach(val => LudoConnectLi.push(Object.assign({}, val)));
    ludoNamesLi.push(html`<li divider role="separator"></li>`);
    ludoNamesLi.push(html`<mwc-list-item class="ludo-clone-li" value="__new__">${msg('Add')}...</mwc-list-item>`);


    /*
        <mwc-list-item graphic="icon" value="export_template" .disabled="${this.ludoCellId == null}"><span>${msg('Share Template')}</span><mwc-icon slot="graphic">cloud_upload</mwc-icon></mwc-list-item>
        <mwc-list-item graphic="icon" value="export_space" .disabled="${this.ludoCellId == null}"><span>${msg('Share Space')}</span><mwc-icon slot="graphic">cloud_upload</mwc-icon></mwc-list-item>
        <mwc-list-item graphic="icon" value="archive_space"><span>${msg('Archive Space')}</span><mwc-icon slot="graphic">delete</mwc-icon></mwc-list-item>
     */
    const create_menu = html`
      <mwc-menu id="create-menu" fixed @click=${this.handleMenuSelect}>
        <mwc-list-item graphic="icon" value="fork_template"><span>${msg('Fork Template')}</span><mwc-icon slot="graphic">fork_right</mwc-icon></mwc-list-item>
        <mwc-list-item graphic="icon" value="fork_space"><span>${msg('Fork Space')}</span><mwc-icon slot="graphic">fork_right</mwc-icon></mwc-list-item>
        <li divider role="separator"></li>
        <mwc-list-item graphic="icon" value="create_template"><span>${msg('New Template')}</span><mwc-icon slot="graphic">add</mwc-icon></mwc-list-item>
        <mwc-list-item graphic="icon" value="create_space"><span>${msg('New Space')}</span><mwc-icon slot="graphic">add</mwc-icon></mwc-list-item>
      </mwc-menu>`
    ;


    /** Build play list */
    let spaceName = "<none>"
    const playItems = Object.entries(this.perspective.plays).map(
      ([spaceEh, play]) => {
        if (!this._dvm.getVisibility(spaceEh)!) {
          return html ``;
        }
        if (spaceEh == this.currentSpaceEh) {
          spaceName = play.space.name;
        }
        const template = this._dvm.playsetZvm.getTemplate(play.space.origin);
        return html`
          <mwc-list-item class="space-li" .selected=${spaceEh == this.currentSpaceEh} multipleGraphics twoline value="${spaceEh}" graphic="large">
            <span>${play.space.name}</span>
              <!--<span slot="secondary">${template? template.name : 'unknown'}</span>-->
            <span slot="graphic" style="width:75px;">${renderSurface(play.space.surface, play.space.name, 70, 56)}</span>
              <!-- <mwc-icon slot="graphic">folder</mwc-icon>-->
              <!-- <mwc-icon-button slot="meta" icon="info" @click=${() => this.onRefresh()}></mwc-icon-button> -->
          </mwc-list-item>
          `
      }
    );

    /** Fabs */
    const fabs = this.canShowBuildView? html`
      <mwc-fab id="create-fab" icon="add" style="" @click=${() => this.openCreateMenu()}></mwc-fab>
      ${create_menu}
      ` : html``;

      const isInDev = HAPP_ENV == HappEnvType.Devtest || HAPP_ENV == HappEnvType.DevtestWe || HAPP_ENV == HappEnvType.DevTestHolo;


      /** Render all */
    return html`
<!--  DRAWER -->
<mwc-drawer type="dismissible" id="my-drawer" style="width: 100%">
  <div>
    <mwc-list>
    <mwc-list-item twoline graphic="avatar" hasMeta>
      ${!this._myProfile ? html`` : html`
      <span>${this.myNickName}</span>
      <sl-avatar style="margin-left:-22px;border:none;background-color:${this.myColor};" slot="graphic" .image=${this.myAvatar}></sl-avatar>
        <sl-color-picker hoist slot="meta" size="small" noFormatToggle format='rgb' @click="${this.handleColorChange}"
        value=${this._myProfile.fields['color']}></sl-color-picker>
      `}
    </mwc-list-item>
    <li divider role="separator"></li>
    </mwc-list>
    <mwc-button icon="add_circle" @click=${() => this.openTemplateDialog()}>${msg('Template')}</mwc-button>
    <!-- SPACE LIST -->
    <mwc-list id="play-list" activatable @selected=${this.handlePlaySelected}>
      ${playItems}
    </mwc-list>

  </div>
  <!-- END DRAWER -->
  <div slot="appContent" style="flex: 1;">
    <!-- TOP APP BAR -->
    <mwc-top-app-bar id="app-bar" dense centerTitle style="position: relative;">
      <!-- <mwc-icon-button icon="menu" slot="navigationIcon"></mwc-icon-button> -->
      <div id="top-title" slot="title" style="cursor:pointer;" >
        <mwc-icon style="cursor: pointer;vertical-align: middle; padding-right:10px;"
                  @click=${() => {const play = this._dvm.getPlay(this.currentSpaceEh); this.openPlayInfoDialog(play)}}
        >info</mwc-icon>
        <span @click=${() => this.openSpaceMenu()}>
            ${spaceName}
            <mwc-icon id="space-menu-button" style="vertical-align: sub" >keyboard_arrow_down</mwc-icon>
        </span>
      </div>
      <mwc-menu id="space-menu" absolute x="0" y="30" @click=${this.onSpaceMenuSelected}>
        ${playItems}
      </mwc-menu>
      <sl-tooltip slot="navigationIcon" content=${msg('Back to home')} placement="bottom-start" distance="4">
      <mwc-icon-button id="exit-button" icon="home" @click=${() => {
        //this.currentSpaceEh = null;
        this.dispatchEvent(new CustomEvent('play-selected', { detail: null, bubbles: true, composed: true }));
      }} ></mwc-icon-button></sl-tooltip>
      <!-- ACTIONS MENU -->
      ${isInDev? html`<mwc-icon-button id="dump-signals-button" slot="actionItems" icon="bug_report" @click=${() => this.onDumpLogs()} ></mwc-icon-button>` : html``}
      ${this.canShowBuildView?
        html`
          <sl-tooltip slot="actionItems" content=${msg('Sync with network')} placement="bottom" distance="4">
            <mwc-icon-button id="pull-button" icon="cloud_sync" @click=${() => this.onRefresh()} ></mwc-icon-button>
          </sl-tooltip>
        ` : html``}
      <div style="position: relative" slot="actionItems">
        <sl-tooltip content=${msg('Export space to Library')} placement="bottom" distance="4">
            <mwc-icon-button id="export-button" style="display:${this.canShowBuildView? "inline-flex": "none"}" icon="backup" @click=${() => this.openExportMenu()}></mwc-icon-button>
        </sl-tooltip>
        <mwc-menu id="export-menu" corner="BOTTOM_LEFT" @click=${this.onExportMenuSelected}>
          ${ludoNamesLi}
        </mwc-menu>
      </div>
      <div style="position: relative" slot="actionItems">
        <sl-tooltip content=${msg('Go to Library')} placement="bottom" distance="4">
            <mwc-icon-button id="page-ludo-button" style="display:${this.canShowBuildView? "inline-flex": "none"}" icon="travel_explore" @click=${() => this.openLudothequeMenu()}></mwc-icon-button>
        </sl-tooltip>
        <mwc-menu id="page-ludotheque-menu" corner="BOTTOM_LEFT" @click=${this.onLudothequeMenuSelected}>
          ${ludoNamesLi}
        </mwc-menu>
      </div>
      <sl-tooltip slot="actionItems" content=${msg('Help')} placement="bottom" distance="4">
        <mwc-icon-button onIcon="person_off" icon="help" @click=${() => this.helpDialogElem.open = true}></mwc-icon-button>
      </sl-tooltip>
      <sl-tooltip slot="actionItems" content=${msg('Show / hide peer list')} placement="bottom" distance="4">
        <mwc-icon-button-toggle onIcon="person_off" offIcon="person" @click=${() => this._canShowPeers = !this._canShowPeers}></mwc-icon-button-toggle>
      </sl-tooltip>
      ${this.canShowBuildView? html`
        <sl-tooltip slot="actionItems" content=${msg('Change mode')} placement="bottom" distance="4">
            <mwc-icon-button icon="handyman" @click=${() => {
        this.dispatchEvent(new CustomEvent('canShowBuildView-set', { detail: false, bubbles: true, composed: true }));
      }}><mwc-icon>keyboard_arrow_down</mwc-icon></mwc-icon-button></sl-tooltip>
      ` : html`
        <sl-tooltip slot="actionItems" content=${msg('Change mode')} placement="bottom" distance="4">
        <mwc-icon-button icon="videogame_asset" @click=${() => {
        this.dispatchEvent(new CustomEvent('canShowBuildView-set', { detail: true, bubbles: true, composed: true }));
      }}><mwc-icon>keyboard_arrow_down</mwc-icon></mwc-icon-button></sl-tooltip>
      `}
      <sl-tooltip slot="actionItems" placement="bottom-end" distance="4">
        <div slot="content"><strong>${msg('Profile')}</strong><br/>${this._myProfile.nickname}</div>
        <sl-avatar id="avatar" @click="${(_e) => this.onAvatarClicked()}" .image=${this._myProfile.fields.avatar}
                   style="background-color:${this._myProfile.fields.color};border: ${this._myProfile.fields.color} 1px solid;cursor: pointer;">
        </sl-avatar>
      </sl-tooltip>
    </mwc-top-app-bar>
    <!-- APP BODY -->
    <div class="appBody">
      ${this.currentSpaceEh ?
        html`<where-space id="where-space" .currentSpaceEh=${this.currentSpaceEh} @click=${this.handleSpaceClick} .neighborWidth="${this._neighborWidth}"></where-space>`
      : html`<div class="surface" style="width: 300px; height: 300px;max-width: 300px; max-height: 300px;">${msg('No space found')}</div>`}
      ${this._canShowPeers ?
      html`
        <where-peer-list id="where-peer-list" style="margin-top:1px;"
                         @avatar-clicked=${(e) => this.handleAvatarClicked(e.detail)}
                         @delete-locations-requested=${() => this.resetMyLocations()}
        ></where-peer-list>
      ` : html``}
    </div>
    ${fabs}
    <!-- DIALOGS -->
    <where-play-info-dialog id="play-info-dialog"></where-play-info-dialog>
    <where-clone-ludo-dialog id="clone-ludo-dialog"></where-clone-ludo-dialog>
    <where-archive-dialog id="archive-dialog" @archive-updated="${this.handleArchiveDialogClosing}"></where-archive-dialog>
    <where-template-dialog id="template-dialog" @template-created=${this.onTemplateCreated}></where-template-dialog>
    ${!this._myProfile ? html`` : html`
      <where-play-dialog id="play-dialog"
                          .currentProfile=${this._myProfile}
                          @play-created=${this.onPlayCreated}>
      </where-play-dialog>
    `}
    <mwc-dialog id="where-profile-dialog" hideActions heading="${msg('Edit Profile')}" >
      <div class="column" style="margin: 16px;">
        <edit-profile
          .profile="${this._myProfile}"
          .saveProfileLabel=${msg('Edit Profile')}
          @save-profile=${(e: CustomEvent) => this.onProfileEdited(e.detail.profile)}
        ></edit-profile>
      </div>
    </mwc-dialog>
    <mwc-dialog id="help-dialog" hideActions heading="${msg('Help')}" >
      <div class="column" style="margin: 16px;">
        ${msg('Click somewhere on the image to place your Location.')}
        <br/>
        ${msg('You can move your Locations with drag & drop.')}
        <br/>
        ${msg('You can also zoom on the image with the mousewheel.')}
      </div>
    </mwc-dialog>
  </div>
</mwc-drawer>
`;
  }

  // /** */
  // static get scopedElements() {
  //   return {
  //     "mwc-button": Button,
  //     "mwc-icon": Icon,
  //     "mwc-icon-button": IconButton,
  //     "mwc-icon-button-toggle": IconButtonToggle,
  //     "mwc-drawer": Drawer,
  //     "mwc-top-app-bar": TopAppBar,
  //     "mwc-textfield": TextField,
  //     "mwc-select": Select,
  //     "mwc-list": List,
  //     "mwc-fab": Fab,
  //     "mwc-list-item": ListItem,
  //     "mwc-menu": Menu,
  //     "mwc-slider": Slider,
  //     "mwc-switch": Switch,
  //     "where-clone-ludo-dialog": WhereLudoDialog,
  //     "where-play-dialog" : WherePlayDialog,
  //     "where-template-dialog" : WhereTemplateDialog,
  //     "where-archive-dialog" : WhereArchiveDialog,
  //     "where-play-info-dialog" : WherePlayInfoDialog,
  //     "where-space": WhereSpace,
  //     "where-peer-list": WherePeerList,
  //     "mwc-formfield": Formfield,
  //     'sl-avatar': SlAvatar,
  //     'sl-tooltip': SlTooltip,
  //     'sl-color-picker': SlColorPicker,
  //     'sl-badge': SlBadge,
  //   };
  // }

  /** */
  static get styles() {
    return [
      sharedStyles,
      css`
        :host {
          background: #ecebee;
          height: 100vh;
          display: block;
        }

        .mdc-drawer__header {
          display: none;
        }

        #where-space {
          /*border: 1px solid rgb(208, 174, 238);*/
          background: white;
        }

        mwc-top-app-bar {
          /**--mdc-theme-primary: #00ffbb;*/
          /**--mdc-theme-on-primary: black;*/
        }

        #app-bar {
          /*margin-top: -15px;*/
        }

        #my-drawer {
          /*margin-top: -20px;*/
        }

        .zoom {
          display: inline-block;
        }

        .zoom mwc-icon-button {
          height: 30px;
          margin-top: -8px;
        }

        .appBody {
          width: 100%;
          margin-top: 2px;
          margin-bottom: 0px;
          display: flex;
        }

        mwc-fab {
          position: fixed !important;
          right: 30px;
          bottom: 30px;
          --mdc-fab-box-shadow: 0px 7px 8px -4px rgba(0, 0, 0, 0.2), 0px 12px 17px 2px rgba(0, 0, 0, 0.14), 0px 5px 22px 4px rgba(0, 0, 0, 0.12);
          /*--mdc-theme-secondary: white;*/
          /*--mdc-theme-on-secondary: black;*/
        }

        mwc-textfield.rounded {
          --mdc-shape-small: 20px;
          width: 7em;
          margin-top: 10px;
        }

        mwc-textfield label {
          padding: 0px;
        }

        @media (min-width: 640px) {
          main {
            max-width: none;
          }
        }
      `,
    ];
  }
}
