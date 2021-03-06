import {css, html, LitElement} from "lit";
import {property, state} from "lit/decorators.js";

import {contextProvided} from "@holochain-open-dev/context";
import {StoreSubscriber} from "lit-svelte-stores";

import randomColor from "randomcolor";
import {sharedStyles} from "../sharedStyles";
import {Dictionary, PieceType, Play, whereContext} from "../types";
import {WhereStore} from "../where.store";
import {WhereSpace} from "./where-space";
import {WherePlayDialog} from "../dialogs/where-play-dialog";
import {WhereTemplateDialog} from "../dialogs/where-template-dialog";
import {WhereArchiveDialog} from "../dialogs/where-archive-dialog";
import {SlAvatar, SlBadge, SlColorPicker, SlTooltip} from '@scoped-elements/shoelace';
import {ScopedElementsMixin} from "@open-wc/scoped-elements";
import {
  Button,
  Drawer,
  Formfield,
  Icon,
  IconButton, IconButtonToggle,
  List,
  ListItem,
  Menu,
  Select,
  Slider,
  Switch,
  TextField,
  TopAppBar,
} from "@scoped-elements/material-web";
import {ProfilesStore, profilesStoreContext} from "@holochain-open-dev/profiles";
import {prefix_canvas} from "../templates";
import {AgentPubKeyB64, EntryHashB64} from "@holochain-open-dev/core-types";
import {delay, renderSurface} from "../sharedRender";
import {WhereFolks} from "./where-folks";
import {CellId} from "@holochain/client/lib/types/common";

/**
 * @element where-controller
 */
export class WhereController extends ScopedElementsMixin(LitElement) {
  constructor() {
    super();
  }

  /** Public attributes */
  @property({ type: Boolean, attribute: 'dummy' })
  canLoadDummy: boolean = false;

  @property()
  ludoCellId: CellId | null = null;

  /** Dependencies */

  @contextProvided({ context: profilesStoreContext })
  _profiles!: ProfilesStore;

  @contextProvided({ context: whereContext })
  _store!: WhereStore;

  _plays = new StoreSubscriber(this, () => this._store?.plays);
  _templates = new StoreSubscriber(this, () => this._store?.templates);
  _myProfile = new StoreSubscriber(this, () => this._profiles?.myProfile);
  _knownProfiles = new StoreSubscriber(this, () => this._profiles?.knownProfiles);

  @state() _canShowFolks: boolean = true;
  @state() _neighborWidth: number = 150;

  /** Private properties */

  @state() _currentSpaceEh: null | EntryHashB64 = null;
  @state() _currentTemplateEh: null| EntryHashB64 = null;

  private _initialized: boolean = false;
  private _initializing: boolean = false;
  private _canPostInit: boolean = false;


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

  get spaceDialogElem() : WherePlayDialog {
    return this.shadowRoot!.getElementById("space-dialog") as WherePlayDialog;
  }


  get myNickName(): string {
    return this._myProfile.value.nickname;
  }
  get myAvatar(): string {
    return this._myProfile.value.fields.avatar;
  }
  get myColor(): string {
    return this._myProfile.value.fields.color;
  }


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

  private async createDummyProfile() {
    const nickname: string = this.randomRobotName();
    //console.log(nickname);
    const color: string = randomColor({luminosity: 'light'});
    //console.log(color);
    await this.updateProfile(nickname, `https://robohash.org/${nickname}`, color)
    //await this.updateProfile("Cam", "https://cdn3.iconfinder.com/data/icons/avatars-9/145/Avatar_Cat-512.png", "#69de85")
  }


  async updateProfile(nickname: string, avatar: string, color: string) {
    try {
      const fields: Dictionary<string> = {};
      fields['color'] = color;
      fields['avatar'] = avatar;
      await this._profiles.createProfile({
        nickname,
        fields,
      });

    } catch (e) {
      console.log("updateProfile() failed");
      console.log(e);
    }
  }

  /** Launch init when myProfile has been set */
  private subscribeProfile() {
    this._profiles.myProfile.subscribe(async (profile) => {
      console.log({profile})
      if (profile) {
        if (!this._initialized && !this._initializing) {
          await this.init();
        }
      }
    });
  }

  /** Launch init when myProfile has been set */
  private subscribePlay() {
    this._store.plays.subscribe(async (plays) => {
      if (!this._currentSpaceEh) {
        /** Select first play */
        const firstSpaceEh = this.getFirstVisiblePlay(plays);
        if (firstSpaceEh) {
          await this.selectPlay(firstSpaceEh);
          console.log("starting Template: ", /*templates[this._currentTemplateEh!].name,*/ this._currentTemplateEh);
          console.log("    starting Play: ", plays[firstSpaceEh].space.name, this._currentSpaceEh);
          //console.log(" starting Session: ", plays[firstSpaceEh].name, this._currentSpaceEh);
        }
      }
    });
  }

  /** After first render only */
  async firstUpdated() {
    console.log("where-controller first updated!")
    if (this.canLoadDummy) {
      await this.createDummyProfile();
    }
    this.subscribeProfile();
    this.subscribePlay();
  }

  /** After each render */
  async updated(changedProperties: any) {
    if (this._canPostInit) {
      this.postInit();
    }
    // look for canvas in plays and render them
    for (let spaceEh in this._plays.value) {
      let play: Play = this._plays.value[spaceEh];
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


  /**
   * Called once a profile has been set
   */
  private async init() {
    this._initializing = true
    console.log("where-controller.init() - START");
    /** Get latest public entries from DHT */
    await this._store.pullDht();
    const plays = this._plays.value;
    const templates = this._templates.value;
    console.log({plays})
    console.log({templates})
    /** Done */
    this._initialized = true
    this._initializing = false
    this._canPostInit = true;
    this.requestUpdate();
    console.log("where-controller.init() - DONE");
  }

  private postInit() {
    /** Menu */
    const menu = this.shadowRoot!.getElementById("top-menu") as Menu;
    const button = this.shadowRoot!.getElementById("menu-button") as IconButton;
    menu.anchor = button
    /** Drawer */
    const container = this.drawerElem.parentNode!;
    container.addEventListener('MDCTopAppBar:nav', () => {
      this.drawerElem.open = !this.drawerElem.open;
      const margin = this.drawerElem.open? '256px' : '0px';
      const menuButton = this.shadowRoot!.getElementById("menu-button") as IconButton;
      menuButton.style.marginRight = margin;
      this._neighborWidth = (this.drawerElem.open? 256 : 0) + (this._canShowFolks? 150 : 0);
    });
    this._canPostInit = false;
  }


  private async selectPlay(spaceEh: EntryHashB64): Promise<void> {
    console.log("Requested Play: " + spaceEh);
    let play = null;
    // - Wait for store to be updated with newly created Play
    // TODO: better to trigger select on subscribe of playStore
    let time = 0;
    while(!play && time < 2000) {
      play = this._plays.value[spaceEh];
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
        await this._store.createNextSession(spaceEh, today /*"dummy-test-name"*/)
      }
    }

    // - This will trigger a render()
    this._currentSpaceEh = spaceEh;
    this._currentTemplateEh = play.space.origin;

    //console.log(" - selected template: " + this._currentTemplateEh);

    // const templates = await this._store.updateTemplates()
    // let div = this.shadowRoot!.getElementById("template-label") as HTMLElement;
    // if (div) {
    //   div.innerText = templates[this._currentTemplateEh].name;
    // }
  }



  /**
   * Hide Current play and select first available one
   */
  async archiveSpace() {
    await this._store.hidePlay(this._currentSpaceEh!)
    /** Select first play */
    const spaces = this._plays.value;
    const firstSpaceEh = this.getFirstVisiblePlay(spaces)
    console.log({firstSpaceEh})
    this._currentSpaceEh = firstSpaceEh
    this.requestUpdate()
  }


  async pingOthers() {
    if (this._currentSpaceEh) {
      // console.log("Pinging All")
      await this._store.pingOthers(this._currentSpaceEh, this._profiles.myAgentPubKey)
    }
  }


  async onRefresh() {
    console.log("refresh: Pulling data from DHT")
    await this._store.pullDht()
    await this._profiles.fetchAllProfiles()
    await this.pingOthers()
    this.requestUpdate();
  }


  async openTemplateDialog(templateEh?: any) {
    this.templateDialogElem.clearAllFields();
    this.templateDialogElem.open(templateEh);
  }

  async openArchiveDialog() {
    this.archiveDialogElem.open();
  }

  async openSpaceDialog(spaceEh?: EntryHashB64) {
    this.spaceDialogElem.resetAllFields();
    this.spaceDialogElem.open(spaceEh);
    if (spaceEh) {
      this.spaceDialogElem.loadPreset(spaceEh);
    }
  }

  private async handlePlaySelected(e: any): Promise<void> {
    const index = e.detail.index;
    if (index < 0) {
      return;
    }
    const value = this.playListElem.items[index].value;
    this.selectPlay(value);
  }

  private async handleArchiveDialogClosing(e: any) {
    const spaces = this._plays.value;
    /** Check if current play has been archived */
    if (e.detail.includes(this._currentSpaceEh)) {
      /** Select first visible play */
      const firstSpaceEh = this.getFirstVisiblePlay(spaces);
      this._currentSpaceEh = firstSpaceEh;
      this.requestUpdate();
    }
  }


  handleViewArchiveSwitch(e: any) {
    // console.log("handleViewArchiveSwitch: " + e.originalTarget.checked)
    // this.canViewArchive = e.originalTarget.checked;
    // this.requestUpdate()
  }


  openTopMenu() {
    const menu = this.shadowRoot!.getElementById("top-menu") as Menu;
    menu.open = true;
  }


  handleMenuSelect(e: any) {
    const menu = e.currentTarget as Menu;
    // console.log("handleMenuSelect: " + menu)
    const selected = menu.selected as ListItem;
    //console.log({selected})
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
          this._store.exportPiece(this._currentTemplateEh, PieceType.Template, this.ludoCellId!)
        } else {
          console.warn("No template or ludotheque cell to export to");
        }
        break;
      case "export_space":
        if (this._currentSpaceEh && this.ludoCellId) {
          this._store.exportPiece(this._currentSpaceEh, PieceType.Space, this.ludoCellId!)
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
    const profile = this._myProfile.value;
    await this.updateProfile(profile.nickname, profile.fields['avatar'], color)
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


  /**
   *
   */
  render() {
    console.log("where-controller render() - " + this._currentSpaceEh);
    if (!this._initialized) {
      return html`<span>Loading...</span>`;
    }

    //var userLang = navigator.language
    //console.log({userLang})

    if (this.drawerElem) {
      this._neighborWidth = (this.drawerElem.open ? 256 : 0) + (this._canShowFolks ? 150 : 0);
    }
    /** Build play list */
    let spaceName = "none"
    const playItems = Object.entries(this._plays.value).map(
      ([key, play]) => {
        if (!play.visible) {
          return html ``;
        }
        if (key == this._currentSpaceEh) {
          spaceName = play.space.name;
        }
        const template = this._store.template(play.space.origin);
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
<mwc-drawer type="dismissible" id="my-drawer">
  <div>
    <mwc-list>
    <mwc-list-item twoline graphic="avatar" hasMeta>
      ${!this._myProfile.value ? html`` : html`
      <span>${this.myNickName}</span>
      <span slot="secondary">${this._profiles.myAgentPubKey}</span>
      <sl-avatar style="margin-left:-22px;border:none;background-color:${this.myColor};" slot="graphic" .image=${this.myAvatar}></sl-avatar>
        <sl-color-picker hoist slot="meta" size="small" noFormatToggle format='rgb' @click="${this.handleColorChange}"
        value=${this._myProfile.value.fields['color']}></sl-color-picker>
      `}
    </mwc-list-item>
    <li divider role="separator"></li>
    </mwc-list>
    <mwc-button icon="add_circle" @click=${() => this.openSpaceDialog()}>Space</mwc-button>
    <mwc-button icon="add_circle" @click=${() => this.openTemplateDialog()}>Template</mwc-button>
    <mwc-button icon="archive" @click=${() => this.openArchiveDialog()}>View Archives</mwc-button>
    <!-- <mwc-formfield label="View Archived">
      <mwc-switch @click=${this.handleViewArchiveSwitch}></mwc-switch>
    </mwc-formfield> -->

    <!-- SPACE LIST -->
    <mwc-list id="play-list" activatable @selected=${this.handlePlaySelected}>
      ${playItems}
    </mwc-list>

  </div>
  <!-- END DRAWER -->
  <div slot="appContent">
    <!-- TOP APP BAR -->
    <mwc-top-app-bar id="app-bar" dense style="position: relative;">
      <mwc-icon-button icon="menu" slot="navigationIcon"></mwc-icon-button>
      <div slot="title">Where - ${spaceName}</div>
      <mwc-icon-button-toggle slot="actionItems"  onIcon="person_off" offIcon="person" @click=${() => this._canShowFolks = !this._canShowFolks}></mwc-icon-button-toggle>
        <!-- <mwc-icon-button id="folks-button" slot="actionItems" icon="people_alt" @click=${() => this._canShowFolks = !this._canShowFolks}></mwc-icon-button> -->
      <mwc-icon-button id="pull-button" slot="actionItems" icon="cloud_sync" @click=${() => this.onRefresh()} ></mwc-icon-button>
      <mwc-icon-button slot="actionItems" icon="travel_explore" @click=${this.showLudotheque}></mwc-icon-button>
      <mwc-icon-button id="menu-button" slot="actionItems" icon="more_vert" @click=${() => this.openTopMenu()}
                       .disabled=${!this._currentSpaceEh}></mwc-icon-button>
      <mwc-menu id="top-menu" corner="BOTTOM_LEFT" @click=${this.handleMenuSelect}>
        <mwc-list-item graphic="icon" value="fork_template"><span>Fork Template</span><mwc-icon slot="graphic">fork_right</mwc-icon></mwc-list-item>
        <mwc-list-item graphic="icon" value="export_template"><span>Share Template</span><mwc-icon slot="graphic">cloud_upload</mwc-icon></mwc-list-item>
        <mwc-list-item graphic="icon" value="fork_space"><span>Fork Space</span><mwc-icon slot="graphic">fork_right</mwc-icon></mwc-list-item>
        <mwc-list-item graphic="icon" value="export_space"><span>Share Space</span><mwc-icon slot="graphic">cloud_upload</mwc-icon></mwc-list-item>
        <mwc-list-item graphic="icon" value="archive_space"><span>Archive Space</span><mwc-icon slot="graphic">delete</mwc-icon></mwc-list-item>
      </mwc-menu>
    </mwc-top-app-bar>
    <!-- APP BODY -->
    <div class="appBody">
      ${this._currentSpaceEh ?
        html`<where-space id="where-space" .currentSpaceEh=${this._currentSpaceEh} @click=${this.handleSpaceClick} .neighborWidth="${this._neighborWidth}"></where-space>`
      : html`<div class="surface" style="width: 300px; height: 300px;max-width: 300px; max-height: 300px;">No space found</div>`}
      ${this._canShowFolks ?
      html`<where-folks id="where-folks" @avatar-clicked=${(e:any) => this.handleAvatarClicked(e.detail)} style="margin-top:1px;"></where-folks>`
    : html``}

    </div>
    <!-- DIALOGS -->
    <where-archive-dialog id="archive-dialog" @archive-update="${this.handleArchiveDialogClosing}"></where-archive-dialog>
    <where-template-dialog id="template-dialog" .store="${this._store}" @template-added=${(e:any) => console.log(e.detail)}></where-template-dialog>
    ${!this._myProfile.value ? html`` : html`
      <where-play-dialog id="space-dialog"
                          .currentProfile=${this._myProfile.value}
                          @play-added=${(e:any) => this.selectPlay(e.detail)}>
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
          margin: 10px;
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
          margin-top: -20px;
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
