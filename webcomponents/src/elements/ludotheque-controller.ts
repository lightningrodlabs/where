import {css, html, LitElement} from "lit";
import {property, state} from "lit/decorators.js";

import {contextProvided} from "@lit-labs/context";
import {StoreSubscriber} from "lit-svelte-stores";

import {sharedStyles} from "../sharedStyles";
import {count_inventory, Inventory, ludothequeContext, PieceType, PlaysetEntry} from "../types";
import {WhereSpace} from "./where-space";
import {WhereSpaceDialog} from "../dialogs/where-space-dialog";
import {WhereTemplateDialog} from "../dialogs/where-template-dialog";
import {WhereArchiveDialog} from "../dialogs/where-archive-dialog";
import {
  //SlButton,
  SlCard,
  //SlIcon,
  //SlIconButton,
  SlRating,
  SlTab,
  SlTabGroup,
  SlTabPanel,
  SlTooltip
} from '@scoped-elements/shoelace';
import {ScopedElementsMixin} from "@open-wc/scoped-elements";
import {
  Button,
  CheckListItem,
  Drawer,
  Formfield,
  Icon,
  IconButton,
  List,
  ListItem,
  Menu,
  Select,
  Slider,
  Switch,
  TextField,
  TopAppBar,
} from "@scoped-elements/material-web";
import {EntryHashB64} from "@holochain-open-dev/core-types";
import {delay, renderSurface, renderSvgMarker} from "../sharedRender";
import {addExamplePieces} from "../examples";
import {LudothequeStore} from "../ludotheque.store";
import {WherePlaysetDialog} from "../dialogs/where-playset-dialog";
import {CellId} from "@holochain/client";
import {WhereSvgMarkerDialog} from "../dialogs/where-svg-marker-dialog";
import {WhereEmojiGroupDialog} from "../dialogs/where-emoji-group-dialog";
import { localized, msg } from '@lit/localize';


/** @element ludotheque-controller */
@localized()
export class LudothequeController extends ScopedElementsMixin(LitElement) {
  constructor() {
    super();
  }

  @property()
  whereCellId: CellId | null = null;


  /** Public attributes */
  @property({ type: Boolean, attribute: 'dummy' })
  canLoadDummy: boolean = false;

  @property({ type: Boolean, attribute: 'examples' })
  canLoadExamples: boolean = false;

  /** Dependencies */

  @contextProvided({ context: ludothequeContext/*, subscribe: true*/ })
  _store!: LudothequeStore;


  _playsets = new StoreSubscriber(this, () => this._store?.playsets);
  _spaces = new StoreSubscriber(this, () => this._store?.spaces);
  _templates = new StoreSubscriber(this, () => this._store?.templates);
  _svgMarkers = new StoreSubscriber(this, () => this._store?.svgMarkers);
  _emojiGroups = new StoreSubscriber(this, () => this._store?.emojiGroups);


  /** Private properties */

  @state() _currentWhereId: null | string = null;

  @state() _currentPlayset: null | PlaysetEntry = null;
  @state() _currentPlaysetEh: null | EntryHashB64 = null;
  @state() _currentTemplateEh: null| EntryHashB64 = null;

  private _initialized: boolean = false;
  private _initializing: boolean = false;
  private _canCreatePlayset: boolean = false;

  private _whereInventory: Inventory | null = null;


  get emojiGroupDialogElem() : WhereEmojiGroupDialog {
    return this.shadowRoot!.getElementById("emoji-group-dialog") as WhereEmojiGroupDialog;
  }

  get svgMarkerDialogElem() : WhereSvgMarkerDialog {
    return this.shadowRoot!.getElementById("svg-marker-dialog") as WhereSvgMarkerDialog;
  }

  get templateDialogElem() : WhereTemplateDialog {
    return this.shadowRoot!.getElementById("template-dialog") as WhereTemplateDialog;
  }

  get playsetDialogElem() : WherePlaysetDialog {
    return this.shadowRoot!.getElementById("playset-dialog") as WherePlaysetDialog;
  }

  get spaceDialogElem() : WhereSpaceDialog {
    return this.shadowRoot!.getElementById("space-dialog") as WhereSpaceDialog;
  }

  get drawerElem() : Drawer {
    return this.shadowRoot!.getElementById("playset-drawer") as Drawer;
  }

  get spaceElem(): WhereSpace {
    return this.shadowRoot!.getElementById("where-space") as WhereSpace;
  }

  get tabElem(): SlTabGroup {
    return this.shadowRoot!.getElementById("body-tab-group") as SlTabGroup;
  }

  // get archiveDialogElem() : WhereArchiveDialog {
  //   return this.shadowRoot!.getElementById("archive-dialog") as WhereArchiveDialog;
  // }
  //

  // get playListElem(): List {
  //   return this.shadowRoot!.getElementById("play-list") as List;
  // }


  /** -- methods -- */

  private pullWhereInventory() {
    this._store.getWhereInventory().then(inventory => {
      const nextCount = count_inventory(inventory);
      if (!this._whereInventory || nextCount > count_inventory(this._whereInventory)) {
        this._whereInventory = inventory;
        this.requestUpdate();
      }
    });
  }

  /**
   *
   */
  hasPiece(eh: EntryHashB64, type: PieceType): boolean {
    if (!this._whereInventory) {
      console.warn("No localInventory found")
      return false;
    }
    switch(type) {
      case PieceType.Template:
        return this._whereInventory!.templates.includes(eh);
        break;
      case PieceType.SvgMarker:
        return this._whereInventory!.svgMarkers.includes(eh);
        break;
      case PieceType.EmojiGroup:
        return this._whereInventory!.emojiGroups.includes(eh);
        break;
      case PieceType.Space:
        return this._whereInventory!.spaces.includes(eh);
        break;
      default:
        console.warn("Unknown piece type: " + type)
        break;
    }
    return false;
  }


  /** Launch init when myProfile has been set */
  private async subscribePlayset() {
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
      }
    });
    await this.init();
  }

  /** After first render only */
  async firstUpdated() {
    await this.subscribePlayset();
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
      await addExamplePieces(this._store);
      console.log("addExamplePieces() - DONE");
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
    /** Done */
    this._initialized = true
    this._initializing = false
    this.requestUpdate();
    console.log("ludotheque-controller.init() - DONE");
  }


  updated(changedProperties: any) {
    /** Menu */
    const menu = this.shadowRoot!.getElementById("add-menu") as Menu;
    const button = this.shadowRoot!.getElementById("add-menu-button") as IconButton;
    if (menu && button) {
      menu.anchor = button
    }
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
   //this.archiveDialogElem.open();
  }

  async openSpaceDialog(spaceEh?: EntryHashB64) {
    this.spaceDialogElem.resetAllFields();
    this.spaceDialogElem.open(spaceEh);
    if (spaceEh) {
      this.spaceDialogElem.loadPreset(spaceEh);
    }
  }


  openAddMenu() {
    const menu = this.shadowRoot!.getElementById("add-menu") as Menu;
    menu.open = true;
  }

  async openEmojiGroupDialog(groupEh: EntryHashB64 | null) {
    let group = undefined;
    if (groupEh) {
      group = this._emojiGroups.value[groupEh]
    }
    const dialog = this.emojiGroupDialogElem;
    dialog.clearAllFields();
    dialog.open(group);
    if (group) {
      dialog.loadPreset(group);
    }
  }

  async openSvgMarkerDialog(eh: EntryHashB64 | null) {
    let svgMarker = undefined;
    if (eh) {
      svgMarker = this._svgMarkers.value[eh]
    }
    const dialog = this.svgMarkerDialogElem;
    dialog.clearAllFields();
    dialog.open(svgMarker);
    if (svgMarker) {
      dialog.loadPreset(svgMarker);
    }
  }


  handleAddMenuSelect(e: any) {
    const menu = e.currentTarget as Menu;
    // console.log("handleMenuSelect: " + menu)
    const selected = menu.selected as ListItem;
    //console.log({selected})
    switch (selected.value) {
      case "add_playset":
        this.openPlaysetDialog()
        break;
      case "add_space":
        this.openSpaceDialog()
        break;
      case "add_template":
        this.openTemplateDialog()
        break;
      case "add_svgMarker":
        this.openSvgMarkerDialog(null)
        break;
      case "add_emojiGroup":
        this.openEmojiGroupDialog(null)
        break;
      default:
        break;
    }
  }


  /**
   *
   */
  private async handlePlaysetDialogClosing(e: any) {
    console.log("handlePlaysetDialogClosing() : " + JSON.stringify(e.detail))
    //const playset = e.detail;
    this.tabElem.show("spaces");
    this._currentPlayset = e.detail;
    this.drawerElem.open = true;
    this._canCreatePlayset = true;
    this.requestUpdate();
  }


  /**
   *
   */
  private async commitPlayset() {
    console.log("commitPlayset() : " + JSON.stringify(this._currentPlayset))
    if (!this._currentPlayset) {
      return;
    }
    // Spaces
    const spaceList = this.shadowRoot!.getElementById("space-list") as List;
    let selectedSpaces = new Array();
    for (const item of spaceList.items) {
      //console.log({item})
      if (item.selected) {
        selectedSpaces.push(item.value)
      }
    }
    this._currentPlayset.spaces = selectedSpaces;
    // Templates
    const templateList = this.shadowRoot!.getElementById("template-list") as List;
    let selectedTemplates = new Array();
    for (const item of templateList.items) {
      //console.log({item})
      if (item.selected) {
        selectedTemplates.push(item.value)
      }
    }
    this._currentPlayset.templates = selectedTemplates;
    // SvgMarkers
    const svgList = this.shadowRoot!.getElementById("svg-marker-list") as List;
    let selectedSvg = new Array();
    for (const item of svgList.items) {
      //console.log({item})
      if (item.selected) {
        selectedSvg.push(item.value)
      }
    }
    this._currentPlayset.svgMarkers = selectedSvg;
    // EmojiGroups
    const emojiGroupList = this.shadowRoot!.getElementById("emoji-group-list") as List;
    let selectedGroups = new Array();
    for (const item of emojiGroupList.items) {
      //console.log({item})
      if (item.selected) {
        selectedGroups.push(item.value)
      }
    }
    this._currentPlayset.emojiGroups = selectedGroups;
    // Check
    if (this._currentPlayset.spaces.length == 0
    && this._currentPlayset.templates.length == 0
    && this._currentPlayset.svgMarkers.length == 0
    && this._currentPlayset.emojiGroups.length == 0) {
      console.warn("No piece added to playset")
      return;
    }
    // Commit
    await this._store.addPlaysetWithCheck(this._currentPlayset!);
    // Reset
    this.resetCurrentPlayset();
    this._canCreatePlayset = false;
    this.drawerElem.open = false;
    this.requestUpdate();
  }


  /**
   *
   */
  private resetCurrentPlayset() {
    this._currentPlayset = null;
    this._canCreatePlayset = false;
    this.drawerElem.open = false;
    this.requestUpdate();
  }


  /**
   *
   */
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



  private renderPlaysets() {
    const items = Object.entries(this._playsets.value).map(
      ([key, playset]) => {
        // return html`
        //   <mwc-list-item class="space-li" twoline value="${key}" graphic="large">
        //     <span>${playset.name} (${playset.spaces.length})</span>
        //     <span slot="secondary">${playset.description}</span>
        //   </mwc-list-item>
        //   `
        return html`
        <sl-card class="card-header">
        <div slot="header">
          <bold>${playset.name}</bold>
          <mwc-icon-button name="pencil-square"></mwc-icon-button>
        </div>
          <div style="margin-left:10px;">
            ${playset.description}
            <div style="margin-top:10px;">${msg('Spaces')}: ${playset.spaces.length}</div>
            <div>   ${msg('Templates')}: ${playset.templates.length}</div>
            <div> ${msg('SVG Markers')}: ${playset.svgMarkers.length}</div>
            <div>${msg('Emoji Groups')}: ${playset.emojiGroups.length}</div>
          </h4>
          <div slot="footer">
            <sl-rating></sl-rating>
            <mwc-button id="primary-action-button" raised dense slot="primaryAction" @click=${(e:any) => this.importPlayset(key)}>${msg('Import')}</mwc-button>
          </div>
        </sl-card>
        `
      }
    )
    return html `
      <mwc-list id="playset-list" class="body-list">
        ${items}
      </mwc-list>
    `;
  }


  /** */
  private renderPieceIcon(key: string, type: PieceType) {
    //console.log({whereCellId: this.whereCellId})
    const hasPiece = this.hasPiece(key, type);
    return hasPiece
      ? html `<mwc-icon class="piece-icon-button done-icon-button" slot="meta">done</mwc-icon>`
      : html `
        <mwc-icon-button class="piece-icon-button import-icon-button" slot="meta" icon="download_for_offline"
                               @click=${() => this._store.exportPiece(key, type, this.whereCellId!)}
        ></mwc-icon-button>
      `;
  }


  /** */
  private renderSpaces() {
    const items = Object.entries(this._spaces.value).map(
      ([key, space]) => {
        const icon = this.renderPieceIcon(key, PieceType.Space);
        const surface = JSON.parse(space.surface);
        const template = this._store.template(space.origin);
        const itemContent = html`
            <span>${space.name}</span>
            <span slot="secondary">${template? template.name : 'unknown'}</span>
            <span slot="graphic" style="width:75px;">${renderSurface(surface, space.name, 70, 56)}</span>
            ${icon}
          `;
        return this._canCreatePlayset? html`
            <mwc-check-list-item class="space-li" multipleGraphics twoline value="${key}" graphic="large">
              ${itemContent}
            </mwc-check-list-item>
          `
          : html`
            <mwc-list-item hasMeta class="space-li" multipleGraphics twoline value="${key}" graphic="large">
              ${itemContent}
            </mwc-list-item>
          `;
      }
    )
    return html `
      <mwc-list multi id="space-list" class="body-list">
        ${items}
      </mwc-list>
    `;
  }


  /** */
  private renderTemplates() {
    /* Render items */
    const items = Object.entries(this._templates.value).map(
      ([key, template]) => {
        const icon = this.renderPieceIcon(key, PieceType.Template);
        const surface = JSON.parse(template.surface);
        const itemContent = html`
            <span>${template.name}</span>
            <span slot="secondary">${template? template.name : 'unknown'}</span>
            <span slot="graphic" style="width:75px;">${renderSurface(surface, template.name, 70, 56)}</span>
            ${icon}
            <!--<mwc-button slot="meta" style="margin-left:-40px;" dense unelevated>add</mwc-button>-->
        `;

        return this._canCreatePlayset? html`
            <mwc-check-list-item class="space-li" multipleGraphics twoline value="${key}" graphic="large">
              ${itemContent}
            </mwc-check-list-item>
          `
          : html`
            <mwc-list-item hasMeta class="space-li" multipleGraphics twoline value="${key}" graphic="large">
              ${itemContent}
            </mwc-list-item>
          `;
      }
    );
    /* Render list */
    return html `
      <mwc-list multi id="template-list" class="body-list">
        ${items}
      </mwc-list>
    `;
  }


  /** */
  private renderSvgMarkers() {
    /* Render items */
    const items = Object.entries(this._svgMarkers.value).map(
      ([key, svgMarker]) => {
        const icon = this.renderPieceIcon(key, PieceType.SvgMarker);
        let svg = renderSvgMarker(svgMarker.value, "black");
        const itemContent = html`
            <span>${svgMarker.name}</span>
            <span slot="graphic" style="width:64px;">${svg}</span>
            ${icon}
          `;
        return this._canCreatePlayset? html`
            <mwc-check-list-item class="space-li" multipleGraphics twoline value="${key}" graphic="large">
              ${itemContent}
            </mwc-check-list-item>
          `
          : html`
            <mwc-list-item hasMeta class="space-li" multipleGraphics twoline value="${key}" graphic="large">
              ${itemContent}
            </mwc-list-item>
          `;
      }
    );
    /* Render list */
    return html `
      <mwc-list multi id="svg-marker-list" class="body-list">
        ${items}
      </mwc-list>
    `;
  }


  /* Render  */
  private renderEmojiGroups() {
    const items = Object.entries(this._emojiGroups.value).map(
      ([key, emojiGroup]) => {
        const icon = this.renderPieceIcon(key, PieceType.EmojiGroup);
        const itemContent = html`
            <span>${emojiGroup.name}</span>
            <span slot="secondary">${emojiGroup.unicodes}</span>
            ${icon}
          `;
        return this._canCreatePlayset? html`
            <mwc-check-list-item class="space-li" twoline value="${key}">
              ${itemContent}
            </mwc-check-list-item>
          `
          : html`
            <mwc-list-item hasMeta class="space-li" twoline value="${key}">
              ${itemContent}
            </mwc-list-item>
          `;
      }
    );
    return html `
      <mwc-list multi id="emoji-group-list" class="body-list">
        ${items}
      </mwc-list>
    `;
  }



  /**
   *
   */
  render() {
    console.log("ludotheque-controller render() - " + this._initialized)
    const playset = this._currentPlaysetEh? this._store.playset(this._currentPlaysetEh) : null;

    //this._activeIndex = -1
    this.pullWhereInventory();

    if (!this._initialized) {
      return html`<span>${msg('Loading')}...</span>`;
    }

    // let playsetItems = [html``];
    // if (playset) {
    //   /** Build playset */
    //   playsetItems = Object.values(playset?.spaces).map(spaceEh => {
    //       // if (!playset.visible) {
    //       //   return html ``;
    //       // }
    //       // if (key == this._currentPlaysetEh) {
    //       //   playsetName = space.name;
    //       // }
    //       const space = this._store.spaceFromEh(spaceEh)
    //       //const template = this._store.template(play.space.origin);
    //       return html`
    //         <mwc-list-item class="space-li" multipleGraphics twoline value="${space.name}" graphic="large">
    //           <span>${space.name}</span>
    //           <span slot="secondary">${space.meta.markerType}</span>
    //           <span slot="graphic" style="width:75px;">${renderSurface(space.surface, space.name, 70, 56)}</span>
    //           <!-- <mwc-icon slot="graphic">folder</mwc-icon>-->
    //             <!-- <mwc-icon-button slot="meta" icon="info" @click=${() => this.onRefresh()}></mwc-icon-button> -->
    //         </mwc-list-item>
    //       `
    //     }
    //   )
    // }
    // let cellItems = [html``];
    // playsetItems = Object.values(playset?.spaces).map(spaceEh => {
    //   return html`
    //     <mwc-list-item @request-selected=${() => this.handleTypeSelect(TemplateType.Html)} selected value="html">HTML
    //     </mwc-list-item>
    //   `;
    // });


    return html`
<!--  DRAWER -->
<mwc-drawer type="dismissible" id="playset-drawer">
  <div>
    <mwc-list>
      <mwc-list-item twoline hasMeta>
        <bold>${msg('New Playset')}</bold>
        <span slot="secondary">${this._currentPlayset?.name}</span>
        <!--<span slot="secondary">${this._currentPlayset?.description}</span>
        <span slot="meta">${this._currentPlayset?.spaces.length}</span>-->
      </mwc-list-item>
        <li divider role="separator"></li>
    </mwc-list>
      <!--<mwc-button icon="add_circle" @click=${() => this.openPlaysetDialog()}>Playset</mwc-button>
    <mwc-button icon="add_circle" @click=${() => this.openSpaceDialog()}>Space</mwc-button>
    <mwc-button icon="add_circle" @click=${() => this.openTemplateDialog()}>Template</mwc-button>
    <mwc-button icon="archive" @click=${() => this.openArchiveDialog()}>View Archives</mwc-button>-->
    <!-- <mwc-formfield label="View Archived">
      <mwc-switch @click=${this.handleViewArchiveSwitch}></mwc-switch>
    </mwc-formfield>
    <mwc-list id="playset-list">
      playsetItems
    </mwc-list>-->
    <h4 style="margin-top:0px;margin-left:10px;">${msg('Description')}</h4>
    <div style="margin-left:20px;">
          <!--<div>      Spaces: ${this._currentPlayset?.spaces.length}</div>
      <div>   Templates: ${this._currentPlayset?.templates.length}</div>
      <div> SVG Markers: ${this._currentPlayset?.svgMarkers.length}</div>
      <div>Emoji Groups: ${this._currentPlayset?.emojiGroups.length}</div>
      -->
        ${this._currentPlayset?.description}
    </div>
    <div id="drawer-button-bar">
      <mwc-button id="commit-playset-button" @click=${this.resetCurrentPlayset}>${msg('cancel')}</mwc-button>
      <mwc-button id="commit-playset-button" raised @click=${this.commitPlayset}>${msg('create')}</mwc-button>
    </div>
  </div>
  <!-- END DRAWER -->
  <div slot="appContent">
    <!-- TOP APP BAR -->
    <mwc-top-app-bar id="app-bar" dense style="position: relative;">
        <!-- <mwc-icon-button icon="menu" slot="navigationIcon"></mwc-icon-button>
        <mwc-icon>library_books</mwc-icon>-->
      <div slot="title">${msg('Library')}</div>

      <mwc-icon-button id="add-menu-button" slot="actionItems" icon="add" @click=${() => this.openAddMenu()}></mwc-icon-button>
      <mwc-menu id="add-menu" corner="BOTTOM_LEFT" @click=${this.handleAddMenuSelect}>
        <mwc-list-item value="add_playset"><span>${msg('Add Playset')}</span></mwc-list-item>
        <mwc-list-item value="add_space"><span>${msg('Add Space')}</span></mwc-list-item>
        <mwc-list-item value="add_template"><span>${msg('Add Template')}</span></mwc-list-item>
        <mwc-list-item value="add_svgMarker"><span>${msg('Add SvgMarker')}</span></mwc-list-item>
        <mwc-list-item value="add_emojiGroup"><span>${msg('Add EmojiGroup')}</span></mwc-list-item>
      </mwc-menu>

      <mwc-icon-button id="pull-button" slot="actionItems" icon="autorenew" @click=${() => this.onRefresh()} ></mwc-icon-button>
      <mwc-icon-button id="menu-button" slot="actionItems" icon="exit_to_app" @click=${() => this.exitLudotheque()}
      ></mwc-icon-button>
    </mwc-top-app-bar>
    <!-- APP BODY -->
    <div class="appBody">
      <sl-tab-group id="body-tab-group">
        ${this._canCreatePlayset? html`` : html`<sl-tab id="playsets-tab" slot="nav" panel="playsets">${msg('Playsets')}</sl-tab>`}
        <sl-tab id="spaces-tab" slot="nav" panel="spaces">${msg('Spaces')}</sl-tab>
        <sl-tab id="templates-tab" slot="nav" panel="templates">${msg('Templates')}</sl-tab>
        <sl-tab id="svg-markers-tab" slot="nav" panel="svg-markers">${msg('SVG Markers')}</sl-tab>
        <sl-tab id="emoji-groups-tab" slot="nav" panel="emoji-groups">${msg('Emoji Groups')}</sl-tab>
        <!-- LISTs -->
        <sl-tab-panel name="playsets">
          ${this.renderPlaysets()}
        </sl-tab-panel>
        <sl-tab-panel id="spaces-panel" name="spaces">
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
    <where-playset-dialog id="playset-dialog" @playset-added="${this.handlePlaysetDialogClosing}"></where-playset-dialog>
    <where-template-dialog id="template-dialog" .store="${this._store}" @template-added=${(e:any) => console.log(e.detail)}
    ></where-template-dialog>
    <where-emoji-group-dialog id="emoji-group-dialog" .store="${this._store}" @emoji-group-added=${(e:any) => console.log(e.detail)}></where-emoji-group-dialog>
    <where-svg-marker-dialog id="svg-marker-dialog" .store="${this._store}" @svg-marker-added=${(e:any) => console.log(e.detail)}></where-svg-marker-dialog>
    <where-space-dialog id="space-dialog" @space-added=${(e:any) => console.log(e.detail)}></where-space-dialog>
  </div>
</mwc-drawer>
`;
  }

  private exitLudotheque(e?: any) {
    console.log("exitLudotheque()")
    this.dispatchEvent(new CustomEvent('exit', { detail: {}, bubbles: true, composed: true }));
  }

  private importPlayset(key: string) {
    console.log("importPlayset() in " + this._currentWhereId + " | " + key)
    this.dispatchEvent(new CustomEvent('import-playset', { detail: key, bubbles: true, composed: true }));
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
      "sl-card": SlCard,
      //"sl-icon": SlIcon,
      //"sl-icon-button": SlIconButton,
      //"sl-button": SlButton,
      "sl-rating": SlRating,
      'sl-tab-group': SlTabGroup,
      'sl-tab': SlTab,
      'sl-tab-panel': SlTabPanel,
      "where-playset-dialog" : WherePlaysetDialog,
      "where-template-dialog" : WhereTemplateDialog,
      "where-svg-marker-dialog" : WhereSvgMarkerDialog,
      "where-emoji-group-dialog" : WhereEmojiGroupDialog,
      "where-space-dialog" : WhereSpaceDialog,
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

        sl-tab-panel {
          --padding: 0px;
          min-height: 500px;
        }

        sl-tab-group {
          --indicator-color: #d78a18;
        }

        .mdc-drawer__header {
          display: none;
        }

        mwc-top-app-bar {
          --mdc-theme-primary: #d78a18;
          --mdc-theme-on-primary: black;
        }

        .card-header {
          max-width: 300px;
        }

        .card-header [slot='header'] {
          display: flex;
          align-items: center;
          justify-content: space-between;
        }

        .card-header h3 {
          margin: 0;
        }

        .card-header sl-icon-button {
          font-size: var(--sl-font-size-medium);
        }

        .card-footer {
          max-width: 300px;
        }

        .card-footer [slot='footer'] {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .piece-icon-button {
        }

        .done-icon-button {
          color: #343434;
          margin-left: -10px;
        }

        .import-icon-button {
          color: #d78a18;
          margin-top: -10px;
          margin-left: -20px;
          --mdc-icon-size: 32px;
        }


        #app-bar {
          /*margin-top: -15px;*/
        }

        #playset-drawer {
          margin-top: -20px;
        }

        #drawer-button-bar {
          display: flex;
          justify-content: flex-end;
          margin-top: 20px;
          margin-right: 12px;
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
