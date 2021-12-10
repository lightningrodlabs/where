import { html, css, LitElement } from "lit";
import { state, property } from "lit/decorators.js";

import { contextProvided } from "@lit-labs/context";
import { StoreSubscriber } from "lit-svelte-stores";
import {Unsubscriber} from "svelte/store";

import randomColor from "randomcolor";
import { sharedStyles } from "../sharedStyles";
import {whereContext, Space, Dictionary, Signal, Coord, MarkerType, EmojiGroupEntry} from "../types";
import { WhereStore } from "../where.store";
import { WhereSpace } from "./where-space";
import { WhereSpaceDialog } from "../dialogs/where-space-dialog";
import { WhereTemplateDialog } from "../dialogs/where-template-dialog";
import { WhereArchiveDialog } from "../dialogs/where-archive-dialog";
import {lightTheme, SlAvatar, SlBadge, SlColorPicker, SlTooltip} from '@scoped-elements/shoelace';
import { ScopedElementsMixin } from "@open-wc/scoped-elements";
import {
  ListItem,
  Select,
  IconButton,
  Button, TextField, TopAppBar, Drawer, List, Icon, Switch, Formfield, Slider, Menu,
} from "@scoped-elements/material-web";
import {
  profilesStoreContext,
  ProfilesStore,
} from "@holochain-open-dev/profiles";
import {prefix_canvas} from "../templates";
import {AgentPubKeyB64, EntryHashB64} from "@holochain-open-dev/core-types";
import {renderSurface} from "../sharedRender";
import {addHardcodedSpaces} from "../examples";
import {WhereFolks} from "./where-folks";


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

  @property({ type: Boolean, attribute: 'examples' })
  canLoadExamples: boolean = false;

  /** Dependencies */

  @contextProvided({ context: whereContext })
  _store!: WhereStore;

  @contextProvided({ context: profilesStoreContext })
  _profiles!: ProfilesStore;

  _myProfile = new StoreSubscriber(this, () => this._profiles.myProfile);
  _knownProfiles = new StoreSubscriber(this, () => this._profiles.knownProfiles);
  _spaces = new StoreSubscriber(this, () => this._store.spaces);

  @state() _canShowFolks: boolean = true;
  @state() _neighborWidth: number = 150;

  /** Private properties */

  @state() _currentSpaceEh: null | EntryHashB64 = null;
  @state() _currentTemplateEh: null| EntryHashB64 = null;

  private _initialized: boolean = false;
  private _initializing: boolean = false;


  get drawerElem() : Drawer {
    return this.shadowRoot!.getElementById("my-drawer") as Drawer;
  }

  get archiveDialogElem() : WhereArchiveDialog {
    return this.shadowRoot!.getElementById("archive-dialog") as WhereArchiveDialog;
  }

  get templateDialogElem() : WhereTemplateDialog {
    return this.shadowRoot!.getElementById("template-dialog") as WhereTemplateDialog;
  }

  get spaceListElem(): List {
    return this.shadowRoot!.getElementById("spaces-list") as List;
  }

  get spaceElem(): WhereSpace {
    return this.shadowRoot!.getElementById("where-space") as WhereSpace;
  }

  get folksElem(): WhereFolks {
    return this.shadowRoot!.getElementById("where-folks") as WhereFolks;
  }

  get spaceDialogElem() : WhereSpaceDialog {
    return this.shadowRoot!.getElementById("space-dialog") as WhereSpaceDialog;
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

  private subscribeProfile() {
    let unsubscribe: Unsubscriber;
    unsubscribe = this._profiles.myProfile.subscribe(async (profile) => {
      if (profile) {
        //console.log({profile})
        await this.checkInit();
      }
      // unsubscribe()
    });
  }

  async firstUpdated() {
    if (this.canLoadDummy) {
      await this.createDummyProfile();
    }
    this.subscribeProfile();
  }

  async updated(changedProperties: any) {
    // look for canvas in spaces and render them
    for (let spaceEh in this._spaces.value) {
      let space: Space = this._spaces.value[spaceEh];
      if (space.surface.canvas) {
        const id = space.name + '-canvas'
        const canvas = this.shadowRoot!.getElementById(id) as HTMLCanvasElement;
        if (!canvas) {
          console.log("CANVAS not found for " + id);
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
          let canvas_code = prefix_canvas(id) + space.surface.canvas;
          var renderCanvas = new Function(canvas_code);
          renderCanvas.apply(this);
        } catch (e) {}
      }
    }
  }


  private getFirstVisibleSpace(spaces: Dictionary<Space>): null| EntryHashB64 {
    if (Object.keys(spaces).length == 0) {
      return null;
    }
    for (let spaceEh in spaces) {
      const space = spaces[spaceEh]
      if (space.visible) {
        return spaceEh
      }
    }
    return null;
  }


  private async checkInit() {
    if (this._initialized || this._initializing) {
      this._initialized = true;
      return;
    }
    this._initializing = true  // because checkInit gets call whenever profiles changes...
    let spaces = await this._store.pullDht();
    let templates = await this._store.updateTemplates();
    // FIXME something is broken here as templates length will show 0
    // FIXME need to make sure it works for all agents when only one agent has committed initial spaces
    console.log("* templates found: " + Object.keys(templates).length);

    /** load initial spaces & templates if there are none */
    if (this.canLoadExamples && Object.keys(templates).length == 0) {
      await addHardcodedSpaces(this._store);
    }
    if (Object.keys(spaces).length == 0 || Object.keys(templates).length == 0) {
      console.warn("No spaces or templates found")
    }
    /** Select first space */
    const firstSpaceEh = this.getFirstVisibleSpace(spaces);
    if (firstSpaceEh) {
      await this.selectSpace(firstSpaceEh);
      console.log("   starting space: ", spaces[firstSpaceEh].name, this._currentSpaceEh);
      console.log("starting template: ", /*templates[this._currentTemplateEh!].name,*/ this._currentTemplateEh);
    }
    /** Drawer */
    if (this.drawerElem) {
      const container = this.drawerElem.parentNode!;
      container.addEventListener('MDCTopAppBar:nav', () => {
        this.drawerElem.open = !this.drawerElem.open;
        const margin = this.drawerElem.open? '256px' : '0px';
        const menuButton = this.shadowRoot!.getElementById("menu-button") as IconButton;
        menuButton.style.marginRight = margin;
        this._neighborWidth = (this.drawerElem.open? 256 : 0) + (this._canShowFolks? 150 : 0);
      });
    }
    /** Menu */
    const menu = this.shadowRoot!.getElementById("top-menu") as Menu;
    const button = this.shadowRoot!.getElementById("menu-button") as IconButton;
    menu.anchor = button
    // - Done
    this._initializing = false
    this._initialized = true
  }


  private async selectSpace(spaceEh: EntryHashB64): Promise<void> {
    console.log("   selected space: " + spaceEh);
    this._currentSpaceEh = spaceEh;
    await this.selectTemplateOf(spaceEh);
    await this.pingOthers();
  }


  private async selectTemplateOf(spaceEh: EntryHashB64): Promise<void> {
    const spaces = await this._store.pullDht();
    if (!spaces[spaceEh]) {
      return Promise.reject(new Error("Space not found"));
    }
    this._currentTemplateEh = spaces[spaceEh].origin;
    console.log("selected template: " + this._currentTemplateEh);
    const templates = await this._store.updateTemplates()
    let div = this.shadowRoot!.getElementById("template-label") as HTMLElement;
    if (div) {
      div.innerText = templates[this._currentTemplateEh].name;
    }
  }

  /**
   * Hide Current space and select first available one
   */
  async archiveSpace() {
    await this._store.hideSpace(this._currentSpaceEh!)
    /** Select first space */
    const spaces = await this._store.pullDht()
    const firstSpaceEh = this.getFirstVisibleSpace(spaces)
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

  async openSpaceDialog(space?: any) {
    this.spaceDialogElem.resetAllFields();
    this.spaceDialogElem.open(space);
    if (space) {
      this.spaceDialogElem.loadPreset(space);
    }
  }

  private async handleSpaceSelected(e: any): Promise<void> {
    const index = e.detail.index;
    if (index < 0) {
      return;
    }
    const value = this.spaceListElem.items[index].value;
    this.selectSpace(value);
  }

  private async handleArchiveDialogClosing(e: any) {
    const spaces = await this._store.pullDht();
    /** Check if current space has been archived */
    if (e.detail.includes(this._currentSpaceEh)) {
      /** Select first visible space */
      const firstSpaceEh = this.getFirstVisibleSpace(spaces);
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
        this.openSpaceDialog(this._currentSpaceEh)
        break;
      case "archive_space":
        this.archiveSpace()
        break;
      default:
        break;
    }
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

    if (this.drawerElem) {
      this._neighborWidth = (this.drawerElem.open ? 256 : 0) + (this._canShowFolks ? 150 : 0);
    }

    /** Build space list */
    const spaces = Object.entries(this._spaces.value).map(
      ([key, space]) => {
        if (!space.visible) {
          return html ``;
        }
        const template = this._store.template(space.origin);
        return html`
          <mwc-list-item class="space-li" .selected=${key == this._currentSpaceEh} multipleGraphics twoline value="${key}" graphic="large">
            <span>${space.name}</span>
            <span slot="secondary">${template? template.name : 'unknown'}</span>
            <span slot="graphic" style="width:75px;">${renderSurface(space, 70, 56)}</span>
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
    <mwc-list id="spaces-list" activatable @selected=${this.handleSpaceSelected}>
      ${spaces}
    </mwc-list>

  </div>
  <!-- END DRAWER -->
  <div slot="appContent">
    <!-- TOP APP BAR -->
    <mwc-top-app-bar id="app-bar" dense style="position: relative;">
      <mwc-icon-button icon="menu" slot="navigationIcon"></mwc-icon-button>
      <div slot="title">Where - ${this._currentSpaceEh? this._spaces.value[this._currentSpaceEh].name : "none"}</div>
      <mwc-icon-button id="folks-button" slot="actionItems" icon="people_alt" @click=${() => this._canShowFolks = !this._canShowFolks}></mwc-icon-button>
      <mwc-icon-button id="pull-button" slot="actionItems" icon="autorenew" @click=${() => this.onRefresh()} ></mwc-icon-button>
      <mwc-icon-button id="menu-button" slot="actionItems" icon="more_vert" @click=${() => this.openTopMenu()}
                       .disabled=${!this._currentSpaceEh}></mwc-icon-button>
      <mwc-menu id="top-menu" corner="BOTTOM_LEFT" @click=${this.handleMenuSelect}>
        <mwc-list-item graphic="icon" value="fork_template"><span>Fork Template</span><mwc-icon slot="graphic">build</mwc-icon></mwc-list-item>
        <mwc-list-item graphic="icon" value="fork_space"><span>Fork Space</span><mwc-icon slot="graphic">edit</mwc-icon></mwc-list-item>
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
    <where-template-dialog id="template-dialog" @template-added=${(e:any) => console.log(e.detail)}></where-template-dialog>
    ${!this._myProfile.value ? html`` : html`
      <where-space-dialog id="space-dialog"
                          .myProfile=${this._myProfile.value}
                          @space-added=${(e:any) => this.selectSpace(e.detail)}>
      </where-space-dialog>
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
      "mwc-button": Button,
      "where-space-dialog" : WhereSpaceDialog,
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
      lightTheme,
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
