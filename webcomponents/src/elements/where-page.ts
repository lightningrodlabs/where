import {css, html} from "lit";
import {property, state} from "lit/decorators.js";

import randomColor from "randomcolor";
import {sharedStyles} from "../sharedStyles";
import {SlAvatar, SlBadge, SlColorPicker, SlTooltip} from '@scoped-elements/shoelace';
import {
  Button, Drawer, Formfield,
  Icon, IconButton, IconButtonToggle,
  List, ListItem, Menu, Select,
  Slider, Switch, TextField, TopAppBar,
} from "@scoped-elements/material-web";

import {AgentPubKeyB64, Dictionary, EntryHashB64} from "@holochain-open-dev/core-types";
import {CellId} from "@holochain/client";

import {delay, renderSurface} from "../sharedRender";
import {prefix_canvas} from "../templates";
import {WhereFolks} from "./where-folks";
import {WhereSpace} from "./where-space";
import {WherePlayDialog} from "../dialogs/where-play-dialog";
import {WhereTemplateDialog} from "../dialogs/where-template-dialog";
import {WhereArchiveDialog} from "../dialogs/where-archive-dialog";
import { localized, msg } from '@lit/localize';
import {WhereDnaPerspective, WhereDvm} from "../viewModels/where.dvm";
import {Play} from "../viewModels/where.perspective";
import {PlaysetPerspective} from "../viewModels/playset.perspective";
import {PieceType, TemplateEntry} from "../viewModels/playset.bindings";
import {WhereSignal} from "../viewModels/where.signals";
import {DnaElement} from "@ddd-qc/dna-client";
import {ProfilesPerspective} from "../viewModels/profiles.zvm";
import {WhereProfile} from "../viewModels/profiles.proxy";



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
export class WherePage extends DnaElement<WhereDnaPerspective, WhereDvm> {
  constructor() {
    super("rWhere");
  }

  /** Properties */
  @property({ type: Boolean, attribute: 'dummy' })
  canLoadDummy: boolean = false;

  @property()
  ludoCellId: CellId | null = null;

  /** ViewModels */

  // @property({type: Object, attribute: false, hasChanged: (_v, _old) => true})
  // wherePerspective!: WherePerspective;
  // @property({type: Object, attribute: false, hasChanged: (_v, _old) => true})
  // playsetPerspective!: PlaysetPerspective;
  // @property({type: Object, attribute: false, hasChanged: (_v, _old) => true})
  // profilesPerspective!: ProfilesPerspective;


  private _myProfile?: WhereProfile;

  /** State */

  @state() private _canShowFolks: boolean = true;
  @state() private _neighborWidth: number = 150;

  @state() private _currentSpaceEh: null | EntryHashB64 = null;
  @state() private _currentTemplateEh: null| EntryHashB64 = null;

  private _initialized: boolean = false;
  private _initializing: boolean = false;
  private _canPostInit: boolean = false;

  /** Getters */

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

  get folksElem(): WhereFolks {
    return this.shadowRoot!.getElementById("where-folks") as WhereFolks;
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
    await this.createMyProfile(nickname, `https://robohash.org/${nickname}`, color)
    //await this.updateProfile("Cam", "https://cdn3.iconfinder.com/data/icons/avatars-9/145/Avatar_Cat-512.png", "#69de85")
  }


  /** */
  async createMyProfile(nickname: string, avatar: string, color: string) {
    // FIXME
    console.log("updateProfile() called:", nickname)
    try {
      const fields: Dictionary<string> = {};
      fields['color'] = color;
      fields['avatar'] = avatar;
      await this._dvm.profilesZvm.createMyProfile({
        nickname,
        fields,
      });

    } catch (e) {
      console.log("updateProfile() failed");
      console.log(e);
    }
  }


  /** Launch init when myProfile has been set */
  // private subscribePlay() {
  //   this._whereStore.plays.subscribe(async (plays) => {
  //     if (!this._currentSpaceEh) {
  //       /** Select first play  if none is set */
  //       const firstSpaceEh = this.getFirstVisiblePlay(plays);
  //       if (firstSpaceEh) {
  //         await this.selectPlay(firstSpaceEh);
  //         console.log("starting Template: ", /*templates[this._currentTemplateEh!].name,*/ this._currentTemplateEh);
  //         console.log("    starting Play: ", plays[firstSpaceEh].space.name, this._currentSpaceEh);
  //         //console.log(" starting Session: ", plays[firstSpaceEh].name, this._currentSpaceEh);
  //       }
  //     }
  //   });
  // }

  /** After first render only */
  async firstUpdated() {
    await super.firstUpdated();
    console.log("where-page first updated!")
    if (this.canLoadDummy) {
      await this.createDummyProfile();
    }
    await this.init();
    /** add custom styles to TopAppBar */
    // FIXME
    //const topBar = this.shadowRoot!.getElementById("app-bar") as TopAppBar;
    //topBar.shadowRoot!.appendChild(tmpl.content.cloneNode(true));

    //await this.subscribeProfile();
    //this.subscribePlay();

    /* FIXME Dont know why I need to call this since init() should update some state properties */
    this.requestUpdate();
  }


  /** After each render */
  async updated(changedProperties: any) {
    if (this._canPostInit) {
      this.postInit();
    }
    //this.anchorMenu();

    /* look for canvas in plays and render them */
    for (let spaceEh in this.perspective.plays) {
      let play: Play = this.perspective.plays[spaceEh];
      if (play.space.surface.canvas && play.visible) {
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
      const play = plays[spaceEh]
      if (play.visible) {
        return spaceEh
      }
    }
    return null;
  }


  /** Called once a profile has been set */
  private async init() {
    this._initializing = true
    console.log("where-page.init() - START");
    //this._dvm.whereZvm.subscribe(this, 'wherePerspective');
    //this._dvm.playsetZvm.subscribe(this, 'playsetPerspective');
    /** Get latest public entries from DHT */
    await this._dvm.probeAll();
    /** Done */
    this._initialized = true
    this._initializing = false
    this._canPostInit = true;

    // FIXME
    // const profiles = get(await this.profileStore.fetchAllProfiles());
    // console.log({profiles})
    // const me = get(await this.profileStore.fetchAgentProfile(this.profileStore.myAgentPubKey));
    // console.log({me})

    //this.requestUpdate();
    console.log("where-page.init() - DONE");
  }


  /** */
  private anchorMenu() {
    const menu = this.shadowRoot!.getElementById("top-menu") as Menu;
    const button = this.shadowRoot!.getElementById("where-menu-button") as IconButton;
    console.log("Anchoring Menu to top button", menu, button)
    if (menu && button) {
      menu.anchor = button
    }
  }


  /** */
  private postInit() {
    /** Menu */
    this.anchorMenu()
    /** Drawer */
    const container = this.drawerElem.parentNode!;
    container.addEventListener('MDCTopAppBar:nav', () => {
      this.drawerElem.open = !this.drawerElem.open;
      // const margin = this.drawerElem.open? '256px' : '0px';
      // const menuButton = this.shadowRoot!.getElementById("where-menu-button") as IconButton;
      // menuButton.style.marginRight = margin;
      this._neighborWidth = (this.drawerElem.open? 256 : 0) + (this._canShowFolks? 150 : 0);
    });
    this._canPostInit = false;
  }


  /** */
  private async selectPlay(spaceEh: EntryHashB64): Promise<void> {
    console.log("Requested Play: " + spaceEh);
    let play = null;
    // - Wait for store to be updated with newly created Play
    // TODO: better to trigger select on subscribe of playStore
    let time = 0;
    while(!play && time < 2000) {
      play = this._dvm.getPlay(spaceEh);
      await delay(100);
      time += 100;
    }
    if (!play) {
      console.error("selectPlay failed: Play not found in store")
      return Promise.reject("Play not found in store")
    }

    // - Check if play should generate a new session for today
    if (play.space.meta.sessionCount < 0) {
      const today = new Intl.DateTimeFormat('en-GB', {timeZone: "America/New_York"}).format(new Date())
      let hasToday = false;
      Object.entries(play.sessions).map(
        ([key, session]) => {
          if (session.name == today /*"dummy-test-name"*/) {
            hasToday = true;
          }
        })
      //console.log("hasToday: " + hasToday + " | " + play.space.name + " | " + today)
      if (!hasToday) {
        await this._dvm.whereZvm.createNextSession(spaceEh, today /*"dummy-test-name"*/)
      }
    }

    // - This will trigger a render()
    this._currentSpaceEh = spaceEh;
    this._currentTemplateEh = play.space.origin;

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
    await this._dvm.whereZvm.hidePlay(this._currentSpaceEh!)
    /** Select first play */
    const firstSpaceEh = this.getFirstVisiblePlay(this.perspective.plays)
    console.log({firstSpaceEh})
    this._currentSpaceEh = firstSpaceEh
    this.requestUpdate()
  }


  /** */
  async pingOthers() {
    if (this._currentSpaceEh) {
      // console.log("Pinging All")
      // FIXME
      //await this._whereStore.pingOthers(this._currentSpaceEh, serializeHash(this.profileStore.myAgentPubKey))
    }
  }



  /** */
  async onRefresh() {
    console.log("refresh: Pulling data from DHT")
    await this._dvm.probeAll();
    await this.pingOthers();
    // await this._whereDvm.getEntryDefs("where")
    // await this._whereDvm.getEntryDefs("where_ludotheque")
    // await this._whereDvm.getEntryDefs("where_playset")
    // await this._whereDvm.getEntryDefs("where_integrity")
    this.requestUpdate();
  }


  /** */
  async openTemplateDialog(templateEh?: any) {
    this.templateDialogElem.clearAllFields();
    this.templateDialogElem.open(templateEh);
  }

  /** */
  async openArchiveDialog() {
    this.archiveDialogElem.open();
  }

  /** */
  async openSpaceDialog(spaceEh?: EntryHashB64) {
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
    this.selectPlay(value);
  }


  /** */
  private async onTemplateCreated(e: any) {
    const template = e.detail as TemplateEntry;
    const eh = await this._dvm.playsetZvm.publishTemplateEntry(template);
    this._dvm.notifyPeers(
      {maybeSpaceHash: null, from: this._dvm.agentPubKey, message: {type:"NewTemplate", content: eh}},
      this._dvm.allOthers(),
    )
  }

  /** */
  private async onPlayCreated(e: any) {
    console.log("onPlayCreated()", e.detail)
    const newPlayInput = e.detail;
    const spaceEh = await this._dvm.constructNewPlay(newPlayInput.space, newPlayInput.sessionNames)
    /* - Notify others */
    const newSpace: WhereSignal = {maybeSpaceHash: spaceEh, from: this._dvm.agentPubKey, message: {type: 'NewSpace', content: spaceEh}};
    this._dvm.notifyPeers(newSpace, this._dvm.allOthers());
    /* */
    await this.selectPlay(spaceEh);
  }



  /** */
  private async handleArchiveDialogClosing(e: any) {
    /** Check if current play has been archived */
    if (e.detail.includes(this._currentSpaceEh)) {
      /** Select first visible play */
      const firstSpaceEh = this.getFirstVisiblePlay(this.perspective.plays);
      this._currentSpaceEh = firstSpaceEh;
      this.requestUpdate();
    }
  }

  /** */
  handleViewArchiveSwitch(e: any) {
    // console.log("handleViewArchiveSwitch: " + e.originalTarget.checked)
    // this.canViewArchive = e.originalTarget.checked;
    // this.requestUpdate()
  }


  /** */
  openTopMenu() {
    const menu = this.shadowRoot!.getElementById("top-menu") as Menu;
    menu.open = true;
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
        this.openSpaceDialog(this._currentSpaceEh? this._currentSpaceEh : undefined)
        break;
      case "archive_space":
        this.archiveSpace()
        break;
      case "export_template":
        if (this._currentTemplateEh && this.ludoCellId) {
          this._dvm.playsetZvm.exportPiece(this._currentTemplateEh, PieceType.Template, this.ludoCellId!)
        } else {
          console.warn("No template or ludotheque cell to export to");
        }
        break;
      case "export_space":
        if (this._currentSpaceEh && this.ludoCellId) {
          this._dvm.playsetZvm.exportPiece(this._currentSpaceEh, PieceType.Space, this.ludoCellId!)
        } else {
          console.warn("No space or ludotheque cell to export to");
        }
        break;
      default:
        break;
    }
  }

  private showLudotheque(e?: any) {
    console.log("showLudotheque()")
    this.dispatchEvent(new CustomEvent('show-ludotheque', { detail: {}, bubbles: true, composed: true }));
  }

  async handleColorChange(e: any) {
    console.log("handleColorChange: " + e.target.lastValueEmitted)
    const color = e.target.lastValueEmitted;
    const profile = this._myProfile!;
    await this.createMyProfile(profile.nickname, profile.fields['avatar'], color)
  }

  private async handleSpaceClick(event: any) {
    await this.pingOthers();
  }

  handleAvatarClicked(key: AgentPubKeyB64) {
    console.log("Avatar clicked: " + key)
    if (this.spaceElem) {
      this.spaceElem.soloAgent = key == this.spaceElem.soloAgent? null : key;
      this.requestUpdate();
    }
  }


  /** */
  render() {
    console.log("where-page render()", this._currentSpaceEh);
    if (!this._initialized) {
      return html`<span>${msg('Loading')}...</span>`;
    }
    //var userLang = navigator.language
    //console.log({userLang})

    /* Grab things from the perspectives */
    this._myProfile = this._dvm.profilesZvm.getProfile(this._dvm.agentPubKey);

    /** Select first play if none is set */
    if (!this._currentSpaceEh) {
      const firstSpaceEh = this.getFirstVisiblePlay(this.perspective.plays);
      if (firstSpaceEh) {
        this.selectPlay(firstSpaceEh);
        //console.log("starting Template: ", /*templates[this._currentTemplateEh!].name,*/ this._currentTemplateEh);
        //console.log("    starting Play: ", plays[firstSpaceEh].space.name, this._currentSpaceEh);
        //console.log(" starting Session: ", plays[firstSpaceEh].name, this._currentSpaceEh);
      }
    }

    //  FIXME
    if (this.drawerElem) {
      this._neighborWidth = (this.drawerElem.open ? 256 : 0) + (this._canShowFolks ? 150 : 0);
    }


    /** Build play list */
    let spaceName = "none"
    const playItems = Object.entries(this.perspective.plays).map(
      ([key, play]) => {
        if (!play.visible) {
          return html ``;
        }
        if (key == this._currentSpaceEh) {
          spaceName = play.space.name;
        }
        const template = this._dvm.playsetZvm.getTemplate(play.space.origin);
        return html`
          <mwc-list-item class="space-li" .selected=${key == this._currentSpaceEh} multipleGraphics twoline value="${key}" graphic="large">
            <span>${play.space.name}</span>
            <span slot="secondary">${template? template.name : 'unknown'}</span>
            <span slot="graphic" style="width:75px;">${renderSurface(play.space.surface, play.space.name, 70, 56)}</span>
              <!-- <mwc-icon slot="graphic">folder</mwc-icon>-->
              <!-- <mwc-icon-button slot="meta" icon="info" @click=${() => this.onRefresh()}></mwc-icon-button> -->
          </mwc-list-item>
          `
      }
    )

    return html`
<!--  DRAWER -->
<mwc-drawer type="dismissible" id="my-drawer" style="width: 100%">
  <div>
    <mwc-list>
    <mwc-list-item twoline graphic="avatar" hasMeta>
      ${!this._myProfile ? html`` : html`
      <span>${this.myNickName}</span>
      <!-- FIXME <span slot="secondary">${this._dvm.agentPubKey}</span> -->
      <sl-avatar style="margin-left:-22px;border:none;background-color:${this.myColor};" slot="graphic" .image=${this.myAvatar}></sl-avatar>
        <sl-color-picker hoist slot="meta" size="small" noFormatToggle format='rgb' @click="${this.handleColorChange}"
        value=${this._myProfile.fields['color']}></sl-color-picker>
      `}
    </mwc-list-item>
    <li divider role="separator"></li>
    </mwc-list>
    <mwc-button icon="add_circle" @click=${() => this.openSpaceDialog()}>${msg('Space')}</mwc-button>
    <mwc-button icon="add_circle" @click=${() => this.openTemplateDialog()}>${msg('Template')}</mwc-button>
    <mwc-button icon="archive" @click=${() => this.openArchiveDialog()}>${msg('View Archives')}</mwc-button>
    <!-- <mwc-formfield label="View Archived">
      <mwc-switch @click=${this.handleViewArchiveSwitch}></mwc-switch>
    </mwc-formfield> -->

    <!-- SPACE LIST -->
    <mwc-list id="play-list" activatable @selected=${this.handlePlaySelected}>
      ${playItems}
    </mwc-list>

  </div>
  <!-- END DRAWER -->
  <div slot="appContent" style="flex: 1;">
    <!-- TOP APP BAR -->
    <mwc-top-app-bar id="app-bar" dense>
      <mwc-icon-button icon="menu" slot="navigationIcon"></mwc-icon-button>
      <div slot="title">Where - ${spaceName}</div>
      <mwc-icon-button-toggle slot="actionItems"  onIcon="person_off" offIcon="person" @click=${() => this._canShowFolks = !this._canShowFolks}></mwc-icon-button-toggle>
        <!-- <mwc-icon-button id="folks-button" slot="actionItems" icon="people_alt" @click=${() => this._canShowFolks = !this._canShowFolks}></mwc-icon-button> -->
      <mwc-icon-button id="pull-button" slot="actionItems" icon="cloud_sync" @click=${() => this.onRefresh()} ></mwc-icon-button>
      <mwc-icon-button slot="actionItems" icon="travel_explore" @click=${this.showLudotheque} .disabled="${this.ludoCellId == null}"></mwc-icon-button>
      <mwc-icon-button id="where-menu-button" slot="actionItems" icon="more_vert" @click=${() => this.openTopMenu()}
                       .disabled=${!this._currentSpaceEh}></mwc-icon-button>
      <mwc-menu id="top-menu" corner="BOTTOM_LEFT" @click=${this.handleMenuSelect}>
        <mwc-list-item graphic="icon" value="fork_template"><span>${msg('Fork Template')}</span><mwc-icon slot="graphic">fork_right</mwc-icon></mwc-list-item>
        <mwc-list-item graphic="icon" value="export_template" .disabled="${this.ludoCellId == null}"><span>${msg('Share Template')}</span><mwc-icon slot="graphic">cloud_upload</mwc-icon></mwc-list-item>
        <mwc-list-item graphic="icon" value="fork_space"><span>${msg('Fork Space')}</span><mwc-icon slot="graphic">fork_right</mwc-icon></mwc-list-item>
        <mwc-list-item graphic="icon" value="export_space" .disabled="${this.ludoCellId == null}"><span>${msg('Share Space')}</span><mwc-icon slot="graphic">cloud_upload</mwc-icon></mwc-list-item>
        <mwc-list-item graphic="icon" value="archive_space"><span>${msg('Archive Space')}</span><mwc-icon slot="graphic">delete</mwc-icon></mwc-list-item>
      </mwc-menu>
    </mwc-top-app-bar>
    <!-- APP BODY -->
    <div class="appBody">
      ${this._currentSpaceEh ?
        html`<where-space id="where-space" .currentSpaceEh=${this._currentSpaceEh} @click=${this.handleSpaceClick} .neighborWidth="${this._neighborWidth}"></where-space>`
      : html`<div class="surface" style="width: 300px; height: 300px;max-width: 300px; max-height: 300px;">${msg('No space found')}</div>`}
      ${this._canShowFolks ?
      html`<where-folks id="where-folks" @avatar-clicked=${(e:any) => this.handleAvatarClicked(e.detail)} style="margin-top:1px;"></where-folks>`
    : html``}

    </div>
    <!-- DIALOGS -->
    <where-archive-dialog id="archive-dialog" @archive-updated="${this.handleArchiveDialogClosing}"></where-archive-dialog>
    <where-template-dialog id="template-dialog" @template-created=${this.onTemplateCreated}></where-template-dialog>
    ${!this._myProfile ? html`` : html`
      <where-play-dialog id="play-dialog"
                          .currentProfile=${this._myProfile}
                          @play-created=${this.onPlayCreated}>
      </where-play-dialog>
    `}
  </div>
</mwc-drawer>
`;
  }



  static get scopedElements() {
    return {
      "mwc-menu": Menu,
      "mwc-slider": Slider,
      "mwc-switch": Switch,
      "mwc-drawer": Drawer,
      "mwc-top-app-bar": TopAppBar,
      "mwc-textfield": TextField,
      "mwc-select": Select,
      "mwc-list": List,
      "mwc-list-item": ListItem,
      "mwc-icon": Icon,
      "mwc-icon-button": IconButton,
      "mwc-icon-button-toggle": IconButtonToggle,
      "mwc-button": Button,
      "where-play-dialog" : WherePlayDialog,
      "where-template-dialog" : WhereTemplateDialog,
      "where-archive-dialog" : WhereArchiveDialog,
      "where-space": WhereSpace,
      "where-folks": WhereFolks,
      "mwc-formfield": Formfield,
      'sl-avatar': SlAvatar,
      'sl-tooltip': SlTooltip,
      'sl-color-picker': SlColorPicker,
      'sl-badge': SlBadge,
    };
  }

  static get styles() {
    return [
      sharedStyles,
      css`
        :host {
          /*margin: 10px;*/
        }

        .mdc-drawer__header {
          display:none;
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
          display:flex;
        }

        mwc-textfield.rounded {
          --mdc-shape-small: 20px;
          width: 7em;
          margin-top:10px;
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
