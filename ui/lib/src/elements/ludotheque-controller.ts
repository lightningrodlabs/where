import { html, css, LitElement } from "lit";
import { state, property } from "lit/decorators.js";

import { contextProvided } from "@holochain-open-dev/context";
import { StoreSubscriber } from "lit-svelte-stores";

import randomColor from "randomcolor";
import { sharedStyles } from "../sharedStyles";
import {whereContext, Play, Dictionary, ludothequeContext, SpaceEntry, PlaysetEntry} from "../types";
import { WhereStore } from "../where.store";
import { WhereSpace } from "./where-space";
import { WhereSpaceDialog } from "../dialogs/where-space-dialog";
import { WhereTemplateDialog } from "../dialogs/where-template-dialog";
import { WhereArchiveDialog } from "../dialogs/where-archive-dialog";
import {SlAvatar, SlBadge, SlColorPicker, SlTooltip} from '@scoped-elements/shoelace';
import { ScopedElementsMixin } from "@open-wc/scoped-elements";
import {
  ListItem,
  Select,
  IconButton,
  Button, TextField, TopAppBar, Drawer, List, Icon, Switch, Formfield, Slider, Menu, Tab, TabBar,
} from "@scoped-elements/material-web";
import {prefix_canvas} from "../templates";
import {AgentPubKeyB64, EntryHashB64} from "@holochain-open-dev/core-types";
import {delay, renderSurface} from "../sharedRender";
import {addHardcodedSpaces} from "../examples";
import {LudothequeStore} from "../ludotheque.store";
import {query} from "lit/decorators";

/**
 * @element ludotheque-controller
 */
export class LudothequeController extends ScopedElementsMixin(LitElement) {
  constructor() {
    super();
  }

  /** Public attributes */
  @property({ type: Boolean, attribute: 'dummy' })
  canLoadDummy: boolean = false;

  @property({ type: Boolean, attribute: 'examples' })
  canLoadExamples: boolean = false;

  /** Dependencies */

  @contextProvided({ context: ludothequeContext })
  _store!: LudothequeStore;


  _playsets = new StoreSubscriber(this, () => this._store.playsets);
  _spaces = new StoreSubscriber(this, () => this._store.spaces);
  //_templates = new StoreSubscriber(this, () => this._store.templates);


  /** Private properties */

  @state() _currentPlayset: null | PlaysetEntry = null;
  @state() _currentPlaysetEh: null | EntryHashB64 = null;
  @state() _currentTemplateEh: null| EntryHashB64 = null;

  private _initialized: boolean = false;
  private _initializing: boolean = false;


  @query('#body-tab-bar') bodyTabBar!: TabBar;

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


  get spaceDialogElem() : WhereSpaceDialog {
    return this.shadowRoot!.getElementById("space-dialog") as WhereSpaceDialog;
  }


  /** Launch init when myProfile has been set */
  private subscribePlayset() {
    this._store.playsets.subscribe(async (playsets) => {
      if (!this._currentPlaysetEh) {

        // /** Select first play */
        const firstEh = this.getFirstVisiblePlayset(playsets);
        if (firstEh) {
          await this.selectPlayset(firstEh);
          //console.log("starting Template: ", /*templates[this._currentTemplateEh!].name,*/ this._currentTemplateEh);
          console.log("    starting Playset: ", playsets[firstEh].name, this._currentPlaysetEh);
          //console.log(" starting Session: ", plays[firstSpaceEh].name, this._currentPlaysetEh);
        }
      }
    });
  }

  /** After first render only */
  async firstUpdated() {
    this.subscribePlayset();
  }


  private getFirstVisiblePlayset(playsets: Dictionary<PlaysetEntry>): null| EntryHashB64 {
    if (Object.keys(playsets).length == 0) {
      return null;
    }
    for (let eh in playsets) {
      const play = playsets[eh]
      // if (play.visible) {
         return eh;
      // }
    }
    return null;
  }


  private async init() {
    this._initializing = true
    console.log("ludotheque-controller.init() - START");
    /** Get latest public entries from DHT */
    await this._store.pullDht();
    const playsets = this._playsets.value;
    //const templates = this._templates.value;
    console.log({playsets})
    //console.log({templates})

    /** load initial plays & templates if there are none */
    if (this.canLoadExamples && Object.keys(playsets).length == 0) {
      await addHardcodedSpaces(this._store);
      console.log("addHardcodedSpaces() - DONE");
    }
    // if (Object.keys(plays).length == 0 || Object.keys(templates).length == 0) {
    //   console.warn("No plays or templates found")
    // }

    /** Drawer */
    if (this.drawerElem) {
      const container = this.drawerElem.parentNode!;
      container.addEventListener('MDCTopAppBar:nav', () => {
        this.drawerElem.open = !this.drawerElem.open;
        const margin = this.drawerElem.open? '256px' : '0px';
        const menuButton = this.shadowRoot!.getElementById("menu-button") as IconButton;
        menuButton.style.marginRight = margin;
      });
    }
    /** Menu */
    const menu = this.shadowRoot!.getElementById("top-menu") as Menu;
    const button = this.shadowRoot!.getElementById("menu-button") as IconButton;
    menu.anchor = button
    /** Done */
    this._initialized = true
    this._initializing = false
    console.log("ludotheque-controller.init() - DONE");
  }


  private async selectPlayset(playsetEh: EntryHashB64): Promise<void> {
    console.log("selectPlayset() " + playsetEh);
    let playset = null;
    // - Wait for store to be updated with newly created Play
    // TODO: better to trigger select on subscribe of playStore
    let time = 0;
    while(!playset && time < 2000) {
      playset = this._playsets.value[playsetEh];
      await delay(100);
      time += 100;
    }
    if (!playset) {
      console.error("selectPlayset failed: Playset not found in store")
      return Promise.reject("Playset not found in store")
    }

    // - This will trigger a render()
    this._currentPlayset = playset;
    this._currentPlaysetEh = playsetEh;
    //this._currentTemplateEh = playset.space.origin;

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
    // await this._store.hidePlay(this._currentPlaysetEh!)
    // /** Select first play */
    // const spaces = this._plays.value;
    // const firstSpaceEh = this.getFirstVisiblePlay(spaces)
    // console.log({firstSpaceEh})
    // this._currentPlaysetEh = firstSpaceEh
    // this.requestUpdate()
  }


  async onRefresh() {
    console.log("refresh: Pulling data from DHT")
    await this._store.pullDht()
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

  private async handlePlaysetDialogClosing(e: any) {
    console.log("handlePlaysetDialogClosing() : " + e.detail)
    //const playset = e.detail;
    this._currentPlayset = e.detail;
    this.requestUpdate();
  }

  private async handleArchiveDialogClosing(e: any) {
    // const spaces = this._plays.value;
    // /** Check if current play has been archived */
    // if (e.detail.includes(this._currentSpaceEh)) {
    //   /** Select first visible play */
    //   const firstSpaceEh = this.getFirstVisiblePlay(spaces);
    //   this._currentSpaceEh = firstSpaceEh;
    //   this.requestUpdate();
    // }
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
        //this.openSpaceDialog(this._currentSpaceEh? this._currentSpaceEh : undefined)
        break;
      case "archive_space":
        this.archiveSpace()
        break;
      default:
        break;
    }
  }

  // private async handleSpaceClick(event: any) {
  //   await this.pingOthers();
  // }

  /**
   *
   */
  render() {
    console.log("ludotheque-controller render() - " + this._currentPlaysetEh)
    const playset = this._currentPlaysetEh? this._store.playset(this._currentPlaysetEh) : null;

    let playsetItems = [html``];
    if (playset) {
      /** Build playset */
      playsetItems = Object.values(playset?.spaces).map(spaceEh => {
          // if (!playset.visible) {
          //   return html ``;
          // }
          // if (key == this._currentPlaysetEh) {
          //   playsetName = space.name;
          // }
          const space = this._store.spaceFromEh(spaceEh)
          //const template = this._store.template(play.space.origin);
          return html`
            <mwc-list-item class="space-li"
                           multipleGraphics twoline value="${space.name}" graphic="large">
              <span>${space.name}</span>
              <span slot="secondary">${space.meta.markerType}</span>
              <span slot="graphic" style="width:75px;">${renderSurface(space, 70, 56)}</span>
              <!-- <mwc-icon slot="graphic">folder</mwc-icon>-->
                <!-- <mwc-icon-button slot="meta" icon="info" @click=${() => this.onRefresh()}></mwc-icon-button> -->
            </mwc-list-item>
          `
        }
      )
    }

    console.log("tab bar index: " + this.bodyTabBar.activeIndex);


    let bodyItems;
    switch (this.bodyTabBar.activeIndex) {
      case 0:
        bodyItems = [html`<div>INDEX 0</div>`]
        break;
      case 1:
        bodyItems = [html`<div>INDEX 1</div>`]
        break;
      default:
        bodyItems = [html`<div>INDEX WHATEVER</div>`]
        break
    }

    return html`
<!--  DRAWER -->
<mwc-drawer type="dismissible" id="my-drawer">
  <div>
    <mwc-list>
    <mwc-list-item twoline hasMeta>
      ${!this._currentPlaysetEh ? html`` : html`
      <span>${playset?.name}</span>
      <span slot="secondary">${playset?.description}</span>
      <span slot="meta">${playset?.spaces.length}</span>
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
    <mwc-list id="playset-list">
      ${playsetItems}
    </mwc-list>
  </div>
  <!-- END DRAWER -->
  <div slot="appContent">
    <!-- TOP APP BAR -->
    <mwc-top-app-bar id="app-bar" dense style="position: relative;">
      <mwc-icon-button icon="menu" slot="navigationIcon"></mwc-icon-button>
      <div slot="title">Where - Ludothèque</div>
      <mwc-icon-button id="pull-button" slot="actionItems" icon="autorenew" @click=${() => this.onRefresh()} ></mwc-icon-button>
      <mwc-icon-button id="menu-button" slot="actionItems" icon="more_vert" @click=${() => this.openTopMenu()}
                       .disabled=${!this._currentPlaysetEh}></mwc-icon-button>
      <mwc-menu id="top-menu" corner="BOTTOM_LEFT" @click=${this.handleMenuSelect}>
        <mwc-list-item graphic="icon" value="fork_template"><span>Fork Template</span><mwc-icon slot="graphic">build</mwc-icon></mwc-list-item>
        <mwc-list-item graphic="icon" value="fork_space"><span>Fork Space</span><mwc-icon slot="graphic">edit</mwc-icon></mwc-list-item>
        <mwc-list-item graphic="icon" value="archive_space"><span>Archive Space</span><mwc-icon slot="graphic">delete</mwc-icon></mwc-list-item>
      </mwc-menu>
    </mwc-top-app-bar>
    <!-- APP BODY -->
    <div class="appBody">
      <mwc-tab-bar id="body-tab-bar" @MDCTabBar:activated=${this.handleTabSelected}></mwc-tab-bar>
      <mwc-tab label="Playsets"></mwc-tab>
      <mwc-tab label="Spaces"></mwc-tab>
      <mwc-tab label="Templates"></mwc-tab>
      <mwc-tab label="SvgMarkers"></mwc-tab>
      <mwc-tab label="EmojiGroups"></mwc-tab>
      <!-- SPACE LIST -->
      <mwc-list id="body-list">
        ${bodyItems}
      </mwc-list>
    </div>
    <!-- DIALOGS -->
    <where-archive-dialog id="archive-dialog" @archive-update="${this.handleArchiveDialogClosing}"></where-archive-dialog>
    <where-template-dialog id="template-dialog" @template-added=${(e:any) => console.log(e.detail)}></where-template-dialog>
    <where-playset-dialog id="playset-dialog" @playset-added="${this.handlePlaysetDialogClosing}"></where-playset-dialog>

  </div>
</mwc-drawer>
`;
  }

  private async handleTabSelected(e: any) {
    //console.log("handleTabSelected: " + e.detail.index)
    //const selectedSessionEh = this._sessions[e.detail.index];
    //this._store.updateCurrentSession(this.currentSpaceEh!, selectedSessionEh);
    this.requestUpdate();
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
      "mwc-tab": Tab,
      "mwc-tab-bar": TabBar,
      "where-space-dialog" : WhereSpaceDialog,
      "where-template-dialog" : WhereTemplateDialog,
      "where-archive-dialog" : WhereArchiveDialog,
      "where-space": WhereSpace,
      "mwc-formfield": Formfield,
      'sl-tooltip': SlTooltip,
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
