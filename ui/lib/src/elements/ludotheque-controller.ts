import { html, css, LitElement } from "lit";
import { state, property } from "lit/decorators.js";

import { contextProvided } from "@holochain-open-dev/context";
import { StoreSubscriber } from "lit-svelte-stores";

import { sharedStyles } from "../sharedStyles";
import { Dictionary, ludothequeContext, PlaysetEntry} from "../types";
import { WhereSpace } from "./where-space";
import { WhereSpaceDialog } from "../dialogs/where-space-dialog";
import { WhereTemplateDialog } from "../dialogs/where-template-dialog";
import { WhereArchiveDialog } from "../dialogs/where-archive-dialog";
import {SlTab, SlTabGroup, SlTabPanel, SlTooltip} from '@scoped-elements/shoelace';
import { ScopedElementsMixin } from "@open-wc/scoped-elements";
import {
  ListItem,
  Select,
  IconButton,
  Button, TextField, TopAppBar, Drawer, List, Icon, Switch, Formfield, Slider, Menu, Tab, TabBar, CheckListItem,
} from "@scoped-elements/material-web";
import {EntryHashB64} from "@holochain-open-dev/core-types";
import {delay, renderSurface, renderSvgMarker} from "../sharedRender";
import {addHardcodedSpaces} from "../examples";
import {LudothequeStore} from "../ludotheque.store";
import {WherePlaysetDialog} from "../dialogs/where-playset-dialog";

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
  _templates = new StoreSubscriber(this, () => this._store.templates);
  _svgMarkers = new StoreSubscriber(this, () => this._store.svgMarkers);
  _emojiGroups = new StoreSubscriber(this, () => this._store.emojiGroups);


  /** Private properties */

  @state() _currentPlayset: null | PlaysetEntry = null;
  @state() _currentPlaysetEh: null | EntryHashB64 = null;
  @state() _currentTemplateEh: null| EntryHashB64 = null;

  private _initialized: boolean = false;
  private _initializing: boolean = false;


  // get tabElem() : TabBar {
  //   return this.shadowRoot!.getElementById("body-tab-bar") as TabBar;
  // }

  get drawerElem() : Drawer {
    return this.shadowRoot!.getElementById("my-drawer") as Drawer;
  }


  get playsetDialogElem() : WherePlaysetDialog {
    return this.shadowRoot!.getElementById("playset-dialog") as WherePlaysetDialog;
  }


  // get archiveDialogElem() : WhereArchiveDialog {
  //   return this.shadowRoot!.getElementById("archive-dialog") as WhereArchiveDialog;
  // }
  //
  // get templateDialogElem() : WhereTemplateDialog {
  //   return this.shadowRoot!.getElementById("template-dialog") as WhereTemplateDialog;
  // }

  // get playListElem(): List {
  //   return this.shadowRoot!.getElementById("play-list") as List;
  // }

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
        // const firstEh = this.getFirstVisiblePlayset(playsets);
        // if (firstEh) {
        //   await this.selectPlayset(firstEh);
        //   //console.log("starting Template: ", /*templates[this._currentTemplateEh!].name,*/ this._currentTemplateEh);
        //   console.log("    starting Playset: ", playsets[firstEh].name, this._currentPlaysetEh);
        //   //console.log(" starting Session: ", plays[firstSpaceEh].name, this._currentPlaysetEh);
        // }
        await this.init();
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
    if (this._initialized) {
      return;
    }
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
  //  this.templateDialogElem.clearAllFields();
  //  this.templateDialogElem.open(templateEh);
  }

  async openArchiveDialog() {
   // this.archiveDialogElem.open();
  }

  async openSpaceDialog(spaceEh?: EntryHashB64) {
    this.spaceDialogElem.resetAllFields();
    this.spaceDialogElem.open(spaceEh);
    if (spaceEh) {
      this.spaceDialogElem.loadPreset(spaceEh);
    }
  }

  private async handlePlaysetDialogClosing(e: any) {
    console.log("handlePlaysetDialogClosing() : " + JSON.stringify(e.detail))
    //const playset = e.detail;
    this._currentPlayset = e.detail;
    this.requestUpdate();
  }

  private async commitPlayset() {
    console.log("commitPlayset() : " + JSON.stringify(this._currentPlayset))
    if (!this._currentPlayset) {
      return;
    }

    const spaceList = this.shadowRoot!.getElementById("space-list") as List;
    let selectedSpaces = new Array();
    for (const item of spaceList.items) {
      //console.log({item})
      if (item.selected) {
        selectedSpaces.push(item.value)
      }
    }
    this._currentPlayset.spaces = selectedSpaces;
    await this._store.addPlayset(this._currentPlayset!);
    this.resetCurrentPlayset();
    this.requestUpdate();
  }

  private resetCurrentPlayset() {
    this._currentPlayset = null;
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

    //this._activeIndex = -1

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
              <span slot="graphic" style="width:75px;">${renderSurface(space.surface, space.name, 70, 56)}</span>
              <!-- <mwc-icon slot="graphic">folder</mwc-icon>-->
                <!-- <mwc-icon-button slot="meta" icon="info" @click=${() => this.onRefresh()}></mwc-icon-button> -->
            </mwc-list-item>
          `
        }
      )
    }

//      console.log("tab bar index: " + this.tabElem.activeIndex);

     return html`
<!--  DRAWER -->
<mwc-drawer type="dismissible" id="my-drawer">
  <div>
    <mwc-list>
      <mwc-list-item twoline hasMeta>
        ${!this._currentPlayset
          ? html`<span>No playset selected</span>`
          : html`
          <span>${this._currentPlayset?.name}</span>
          <span slot="secondary">${this._currentPlayset?.description}</span>
          <span slot="meta">${this._currentPlayset?.spaces.length}</span>
        `}
      </mwc-list-item>
        <li divider role="separator"></li>
    </mwc-list>
    <mwc-button icon="add_circle" @click=${() => this.openPlaysetDialog()}>Playset</mwc-button>
    <mwc-button icon="add_circle" @click=${() => this.openSpaceDialog()}>Space</mwc-button>
    <mwc-button icon="add_circle" @click=${() => this.openTemplateDialog()}>Template</mwc-button>
    <mwc-button icon="archive" @click=${() => this.openArchiveDialog()}>View Archives</mwc-button>
    <!-- <mwc-formfield label="View Archived">
      <mwc-switch @click=${this.handleViewArchiveSwitch}></mwc-switch>
    </mwc-formfield>
    <mwc-list id="playset-list">
      ${playsetItems}
    </mwc-list>-->
    <div>
      <div>   Spaces: ${this._currentPlayset?.spaces.length}</div>
      <div>Templates: ${this._currentPlayset?.templates.length}</div>
      <div>  Markers: ${this._currentPlayset?.markers.length}</div>
    </div>
    <div id="drawer-button-bar">
      <mwc-button id="commit-playset-button" @click=${this.resetCurrentPlayset}>reset</mwc-button>
      <mwc-button id="commit-playset-button" raised @click=${this.commitPlayset}>ok</mwc-button>
    </div>
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
      <sl-tab-group id="body-tab-group">
        <sl-tab id="playsets-tab" slot="nav" panel="playsets">Playsets</sl-tab>
        <sl-tab id="spaces-tab" slot="nav" panel="spaces">Spaces</sl-tab>
        <sl-tab id="templates-tab" slot="nav" panel="templates">Templates</sl-tab>
        <sl-tab id="svg-markers-tab" slot="nav" panel="svg-markers">Svg Markers</sl-tab>
        <sl-tab id="emoji-groups-tab" slot="nav" panel="emoji-groups">Emoji Groups</sl-tab>
        <!-- LISTs -->
        <sl-tab-panel name="playsets">
          ${this.renderPlaysets()}
        </sl-tab-panel>
        <sl-tab-panel name="spaces">
          ${this.renderSpaces()}
        </sl-tab-panel>
        <sl-tab-panel name="templates">
          ${this.renderTemplates()}
        </sl-tab-panel>
        <sl-tab-panel name="svg-markers">
          ${this.renderSvgMarkers()}
        </sl-tab-panel>
        <sl-tab-panel name="emoji-groups">
          ${this.renderEmojiGroups()}
        </sl-tab-panel>
      </sl-tab-group>
    </div>
    <!-- DIALOGS -->
      <!--<where-archive-dialog id="archive-dialog" @archive-update="${this.handleArchiveDialogClosing}"></where-archive-dialog>
    <where-template-dialog id="template-dialog" @template-added=${(e:any) => console.log(e.detail)}></where-template-dialog> -->
    <where-playset-dialog id="playset-dialog" @playset-added="${this.handlePlaysetDialogClosing}"></where-playset-dialog>

  </div>
</mwc-drawer>
`;
  }

  private renderPlaysets() {
    const items = Object.entries(this._playsets.value).map(
      ([key, playset]) => {
        //const template = this._store.template(space.origin);
        return html`
          <mwc-list-item class="space-li" twoline value="${key}" graphic="large">
            <span>${playset.name} (${playset.spaces.length})</span>
            <span slot="secondary">${playset.description}</span>
          </mwc-list-item>
          `
      }
    )
    return html `
      <mwc-list noninteractive id="playset-list" class="body-list">
        ${items}
      </mwc-list>
    `;
  }

  private renderSpaces() {
    const items = Object.entries(this._spaces.value).map(
      ([key, space]) => {
        const surface = JSON.parse(space.surface);
        const template = this._store.template(space.origin);
        return html`
          <mwc-check-list-item class="space-li" multipleGraphics twoline value="${key}" graphic="large">
            <span>${space.name}</span>
            <span slot="secondary">${template? template.name : 'unknown'}</span>
            <span slot="graphic" style="width:75px;">${renderSurface(surface, space.name, 70, 56)}</span>
              <!-- <mwc-icon slot="graphic">folder</mwc-icon>-->
              <!-- <mwc-icon-button slot="meta" icon="info" @click=${() => this.onRefresh()}></mwc-icon-button> -->
          </mwc-check-list-item>
          `
      }
    )
    return html `
      <mwc-list multi id="space-list" class="body-list">
        ${items}
      </mwc-list>
    `;
  }

  private renderTemplates() {
    const items = Object.entries(this._templates.value).map(
      ([key, template]) => {
        const surface = JSON.parse(template.surface);
        return html`
          <mwc-check-list-item class="space-li" multipleGraphics twoline value="${key}" graphic="large">
            <span>${template.name}</span>
            <span slot="secondary">${template? template.name : 'unknown'}</span>
            <span slot="graphic" style="width:75px;">${renderSurface(surface, template.name, 70, 56)}</span>
          </mwc-check-list-item>
          `
      }
    );
    return html `
      <mwc-list multi id="template-list" class="body-list">
        ${items}
      </mwc-list>
    `;
  }

  private renderSvgMarkers() {
    const items = Object.entries(this._svgMarkers.value).map(
      ([key, svgMarker]) => {
        let svg = renderSvgMarker(svgMarker.value, "black");
        return html`
          <mwc-check-list-item class="space-li" multipleGraphics twoline value="${key}" graphic="large">
            <span>${svgMarker.name}</span>
            <span slot="secondary">toto</span>
            <span slot="graphic" style="width:64px;">${svg}</span>
          </mwc-check-list-item>
          `
      }
    );
    return html `
      <mwc-list multi id="svg-marker-list" class="body-list">
        ${items}
      </mwc-list>
    `;
  }

  private renderEmojiGroups() {
    const items = Object.entries(this._emojiGroups.value).map(
      ([key, emojiGroup]) => {
        return html`
          <mwc-check-list-item class="space-li" twoline value="${key}" graphic="large">
            <span>${emojiGroup.name}</span>
            <span slot="secondary">${emojiGroup.unicodes}</span>
          </mwc-check-list-item>
          `
      }
    );
    return html `
      <mwc-list multi id="emoji-group-list" class="body-list">
        ${items}
      </mwc-list>
    `;
  }

  async openPlaysetDialog(eh?: any) {
    this.playsetDialogElem.clearAllFields();
    this.playsetDialogElem.open(eh);
  }

  // private async handleTabSelected(e: any) {
  //   console.log("handleTabSelected: " + e.detail)
  //   this._activeIndex = e.detail.index;
  //   //const selectedSessionEh = this._sessions[e.detail.index];
  //   //this._store.updateCurrentSession(this.currentSpaceEh!, selectedSessionEh);
  //   this.requestUpdate();
  // }


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
      "mwc-check-list-item": CheckListItem,
      "mwc-icon": Icon,
      "mwc-icon-button": IconButton,
      "mwc-button": Button,
      'sl-tab-group': SlTabGroup,
      'sl-tab': SlTab,
      'sl-tab-panel': SlTabPanel,
      "where-space-dialog" : WhereSpaceDialog,
      "where-template-dialog" : WhereTemplateDialog,
      "where-archive-dialog" : WhereArchiveDialog,
      "where-playset-dialog" : WherePlaysetDialog,
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

        sl-tab-panel {
          --padding: 0px;
          min-height: 500px;
        }
        sl-tab-group {
          --indicator-color: rgb(110, 20, 239);
        }

        .mdc-drawer__header {
          display: none;
        }

        mwc-top-app-bar {
          --mdc-theme-primary: #d78a18;
          --mdc-theme-on-primary: black;
        }

        #app-bar {
          /*margin-top: -15px;*/
        }

        #my-drawer {
          margin-top: -20px;
        }

        #drawer-button-bar {
          display: flex;
          justify-content:flex-end;
          margin-top:20px;
          margin-right:12px;
        }
        #body-tab-group {
          /*width:100%;*/
        }

        .appBody {
          width: 100%;
          margin-top: 2px;
          margin-bottom: 0px;
          display: flex;
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
