import {css, html} from "lit";
import {property, state} from "lit/decorators.js";
import {sharedStyles} from "../sharedStyles";
import {WhereSpace} from "./where-space";
import {WhereSpaceDialog} from "../dialogs/where-space-dialog";
import {WhereTemplateDialog} from "../dialogs/where-template-dialog";
import {WhereArchiveDialog} from "../dialogs/where-archive-dialog";
import {SlCard, SlRating, SlTab, SlTabGroup, SlTabPanel, SlTooltip} from '@scoped-elements/shoelace';
import {
  Button, CheckListItem, CircularProgress, Drawer, Formfield, Icon, IconButton, List, ListItem, Menu, Select,
  Slider, Switch, TextField, TopAppBar,
} from "@scoped-elements/material-web";
import {delay, renderSurface, renderSvgMarker} from "../sharedRender";
import {publishExamplePlayset} from "../examples";
import {WherePlaysetDialog} from "../dialogs/where-playset-dialog";
import {CellId, encodeHashToBase64, EntryHashB64} from "@holochain/client";
import {WhereSvgMarkerDialog} from "../dialogs/where-svg-marker-dialog";
import {WhereEmojiGroupDialog} from "../dialogs/where-emoji-group-dialog";
import { localized, msg } from '@lit/localize';
import {LudothequePerspective} from "../viewModels/ludotheque.zvm";
import {Playset} from "../bindings/ludotheque.types";
import {Inventory, PlaysetPerspective} from "../viewModels/playset.perspective";
import {countInventory} from "../viewModels/playset.zvm";
import {PlaysetEntry, PlaysetEntryType} from "../bindings/playset.types";
import {LudothequeDvm} from "../viewModels/ludotheque.dvm";
import {DnaElement} from "@ddd-qc/lit-happ";
import {IS_DEV} from "../globals";

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


/**
 * @element ludotheque-page
 */
@localized()
export class LudothequePage extends DnaElement<unknown, LudothequeDvm> {
  constructor() {
    super(LudothequeDvm.DEFAULT_BASE_ROLE_NAME);
  }

  /** -- Properties -- */

  @property()
  whereCellId: CellId | null = null;

  @property({ type: Boolean, attribute: 'examples' })
  canLoadExamples: boolean = false;

  @property({type: Object, attribute: false, hasChanged: (_v, _old) => true})
  ludothequePerspective!: LudothequePerspective;
  @property({type: Object, attribute: false, hasChanged: (_v, _old) => true})
  playsetPerspective!: PlaysetPerspective;


  /** -- Private -- */

  @state() private _currentPlayset: null | Playset = null;
  @state() private _currentPlaysetEh: null | EntryHashB64 = null;
  //@state() private _currentTemplateEh: null| EntryHashB64 = null;

  @state() private _inventory: Inventory | null = null;

  @state() private _initialized: boolean = false;
  private _canPostInit: boolean = false;
  private _canCreatePlayset: boolean = false;



  /** -- Getters -- */

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


  /** -- Methods -- */


  /** After first render only */
  async firstUpdated() {
    this._dvm.ludothequeZvm.subscribe(this, 'ludothequePerspective');
    this._dvm.playsetZvm.subscribe(this, 'playsetPerspective');
    await this.init();
    /** add custom styles to TopAppBar */
    const topBar = this.shadowRoot!.getElementById("app-bar") as TopAppBar;
    topBar.shadowRoot!.appendChild(tmpl.content.cloneNode(true));
  }


  /** */
  private async init() {
    console.log("ludotheque-page.init() - START");
    /** Get latest public entries from DHT */
    this._dvm.probeAll();
    await this.probeInventory();
    const playsets = this._dvm.ludothequeZvm.perspective.playsets
    //const templates = this._templates.value;
    console.log({playsets})
    //console.log({templates})

    /** load initial plays & templates if there are none (in base cell only) */
    if (this.canLoadExamples && Object.keys(playsets).length == 0 && !this._dvm.cell.cloneId) {
      await publishExamplePlayset(this._dvm);
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
    this._canPostInit = true;
    this._initialized = true
    console.log("ludotheque-page.init() - DONE");
  }

  /** */
  private anchorCreateMenu() {
    const menu = this.shadowRoot!.getElementById("add-menu") as Menu;
    const button = this.shadowRoot!.getElementById("add-fab") as any;
    console.log("<ludotheque> Anchoring Menu to top button", menu, button)
    if (menu && button) {
      menu.anchor = button
    }
  }


  /** */
  async updated(changedProperties: any) {
    if (this._canPostInit) {
      this.anchorCreateMenu();
    }
    await this.probeInventory();
  }


  /** */
  private async probeInventory() {
    const inventory = await this._dvm.playsetZvm.probeInventory();
    const nextCount = countInventory(inventory);
    if (!this._inventory || nextCount > countInventory(this._inventory)) {
      this._inventory = inventory;
    }
  }


  /** */
  hasPiece(eh: EntryHashB64, type: PlaysetEntryType): boolean {
    if (!this._inventory) {
      console.warn("No localInventory found")
      return false;
    }
    switch(type) {
      case PlaysetEntryType.Template:
        return this._inventory!.templates.includes(eh);
        break;
      case PlaysetEntryType.SvgMarker:
        return this._inventory!.svgMarkers.includes(eh);
        break;
      case PlaysetEntryType.EmojiGroup:
        return this._inventory!.emojiGroups.includes(eh);
        break;
      case PlaysetEntryType.Space:
        return this._inventory!.spaces.includes(eh);
        break;
      default:
        console.warn("Unknown piece type: " + type)
        break;
    }
    return false;
  }


  /** */
  async onDumpLogs() {
    this._dvm.dumpLogs();
  }


  /** */
  private async selectPlayset(playsetEh: EntryHashB64): Promise<void> {
    console.log("selectPlayset() " + playsetEh);
    let playset = null;
    // - Wait for store to be updated with newly created Play
    // TODO: better to trigger select on subscribe of playStore
    let time = 0;
    while(!playset && time < 2000) {
      playset = this._dvm.ludothequeZvm.getPlayset(playsetEh);
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



  /** Hide Current play and select first available one */
  async archiveSpace() {
    // await this._store.hidePlay(this._currentPlaysetEh!)
    // /** Select first play */
    // const spaces = this._plays.value;
    // const firstSpaceEh = this.getFirstVisiblePlay(spaces)
    // console.log({firstSpaceEh})
    // this._currentPlaysetEh = firstSpaceEh
    // this.requestUpdate()
  }


  /** */
  onRefresh() {
    console.log("refresh: Pulling data from DHT")
    this._dvm.probeAll();
  }

  /** */
  async openTemplateDialog(templateEh?: any) {
    this.templateDialogElem.clearAllFields();
    this.templateDialogElem.open(templateEh);
  }


  /** */
  async openArchiveDialog() {
   //this.archiveDialogElem.open();
  }


  /** */
  async openSpaceDialog(spaceEh?: EntryHashB64) {
    this.spaceDialogElem.resetAllFields();
    this.spaceDialogElem.open(spaceEh);
    if (spaceEh) {
      this.spaceDialogElem.loadPreset();
    }
  }


  /** */
  openAddMenu() {
    const menu = this.shadowRoot!.getElementById("add-menu") as Menu;
    menu.open = true;
  }


  /** */
  async openEmojiGroupDialog(groupEh: EntryHashB64 | null) {
    let group = undefined;
    if (groupEh) {
      group = this._dvm.playsetZvm.getEmojiGroup(groupEh)
    }
    const dialog = this.emojiGroupDialogElem;
    dialog.clearAllFields();
    dialog.open(group);
    if (group) {
      dialog.loadPreset(group);
    }
  }


  /** */
  async openSvgMarkerDialog(eh: EntryHashB64 | null) {
    let svgMarker = undefined;
    if (eh) {
      svgMarker = this._dvm.playsetZvm.getSvgMarker(eh)
    }
    const dialog = this.svgMarkerDialogElem;
    dialog.clearAllFields();
    dialog.open(svgMarker);
    if (svgMarker) {
      dialog.loadPreset();
    }
  }


  /** */
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


  /** */
  private async handleSpaceDialogClosing(e: any) {
    console.log("handleSpaceDialogClosing()", e.detail)
    //const space = e.detail as Space;
    this._dvm.playsetZvm.publishSpace(e.detail)
  }


  /** */
  private async handlePlaysetDialogClosing(e: any) {
    console.log("handlePlaysetDialogClosing()", e.detail)
    //const playset = e.detail;
    this.tabElem.show("spaces");
    this._currentPlayset = e.detail;
    this.drawerElem.open = true;
    this._canCreatePlayset = true;
    this.requestUpdate();
  }


  /** */
  private async publishCurrentPlayset() {
    console.log("commitPlayset()", this._currentPlayset)
    if (!this._currentPlayset) {
      return;
    }
    /* Spaces */
    const spaceList = this.shadowRoot!.getElementById("space-list") as List;
    let selectedSpaces = new Array();
    for (const item of spaceList.items) {
      //console.log({item})
      if (item.selected) {
        selectedSpaces.push(item.value)
      }
    }
    this._currentPlayset.spaces = selectedSpaces;
    /* Templates */
    const templateList = this.shadowRoot!.getElementById("template-list") as List;
    let selectedTemplates = new Array();
    for (const item of templateList.items) {
      //console.log({item})
      if (item.selected) {
        selectedTemplates.push(item.value)
      }
    }
    this._currentPlayset.templates = selectedTemplates;
    /* SvgMarkers */
    const svgList = this.shadowRoot!.getElementById("svg-marker-list") as List;
    let selectedSvg = new Array();
    for (const item of svgList.items) {
      //console.log({item})
      if (item.selected) {
        selectedSvg.push(item.value)
      }
    }
    this._currentPlayset.svgMarkers = selectedSvg;
    /* EmojiGroups */
    const emojiGroupList = this.shadowRoot!.getElementById("emoji-group-list") as List;
    let selectedGroups = new Array();
    for (const item of emojiGroupList.items) {
      //console.log({item})
      if (item.selected) {
        selectedGroups.push(item.value)
      }
    }
    this._currentPlayset.emojiGroups = selectedGroups;
    /* Check */
    if (this._currentPlayset.spaces.length == 0
    && this._currentPlayset.templates.length == 0
    && this._currentPlayset.svgMarkers.length == 0
    && this._currentPlayset.emojiGroups.length == 0) {
      console.warn("No piece added to playset")
      return;
    }
    /* Commit */
    await this._dvm.ludothequeZvm.publishPlayset(this._currentPlayset!);
    /* Reset */
    this.resetCurrentPlayset();
    this._canCreatePlayset = false;
    this.drawerElem.open = false;
    this.requestUpdate();
  }


  /** */
  private resetCurrentPlayset() {
    this._currentPlayset = null;
    this._canCreatePlayset = false;
    this.drawerElem.open = false;
    this.requestUpdate();
  }


  /** */
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

  /** */
  handleViewArchiveSwitch(e: any) {
    // console.log("handleViewArchiveSwitch: " + e.originalTarget.checked)
    // this.canViewArchive = e.originalTarget.checked;
    // this.requestUpdate()
  }


  /** */
  private renderPlaysets() {
    const items = Object.entries(this._dvm.ludothequeZvm.perspective.playsets).map(
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
            <mwc-button id="primary-action-button" .disabled="${!this.whereCellId}" raised dense slot="primaryAction" @click=${(e:any) => this.importPlayset(key)}>${msg('Import')}</mwc-button>
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
  private renderPieceIcon(key: string, type: PlaysetEntryType) {
    //console.log({whereCellId: this.whereCellId})
    const hasPiece = this.hasPiece(key, type);
    return hasPiece
      ? html `<mwc-icon class="piece-icon-button done-icon-button" slot="meta">done</mwc-icon>`
      : html `
        <mwc-icon-button class="piece-icon-button import-icon-button" slot="meta" icon="download_for_offline"
                               @click=${() => this._dvm.playsetZvm.exportPiece(key, type, this.whereCellId!)}
        ></mwc-icon-button>
      `;
  }


  /** */
  private renderSpaces() {
    const items = Object.entries(this._dvm.playsetZvm.perspective.spaces).map(
      ([key, space]) => {
        const icon = this.renderPieceIcon(key, PlaysetEntryType.Space);
        const template = this._dvm.playsetZvm.getTemplate(space.origin);
        const itemContent = html`
            <span>${space.name}</span>
            <span slot="secondary">${template? template.name : 'unknown'}</span>
            <span slot="graphic" style="width:75px;">${renderSurface(space.surface, space.name, 70, 56)}</span>
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
    const items = Object.entries(this._dvm.playsetZvm.perspective.templates).map(
      ([key, template]) => {
        const icon = this.renderPieceIcon(key, PlaysetEntryType.Template);
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
    const items = Object.entries(this._dvm.playsetZvm.perspective.svgMarkers).map(
      ([key, svgMarker]) => {
        const icon = this.renderPieceIcon(key, PlaysetEntryType.SvgMarker);
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
    const items = Object.entries(this._dvm.playsetZvm.perspective.emojiGroups).map(
      ([key, emojiGroup]) => {
        const icon = this.renderPieceIcon(key, PlaysetEntryType.EmojiGroup);
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
    console.log("ludotheque-page render(), ", this._initialized)

    if (!this._initialized) {
      return html`
        <div style="display: flex; justify-content: center; align-items: center; height: 100vh">
          <mwc-circular-progress indeterminate></mwc-circular-progress>
        </div>
      `;
    }

    console.log({PlaysetPerspective: this.playsetPerspective})


    const playset = this._currentPlaysetEh? this._dvm.ludothequeZvm.getPlayset(this._currentPlaysetEh) : null;

    //this._activeIndex = -1

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
      <mwc-button id="commit-playset-button" raised @click=${this.publishCurrentPlayset}>${msg('create')}</mwc-button>
    </div>
  </div>
  <!-- END DRAWER -->
  <div slot="appContent">
    <!-- TOP APP BAR -->
    <mwc-top-app-bar id="app-bar" dense>
        <!-- <mwc-icon-button icon="menu" slot="navigationIcon"></mwc-icon-button>
        <mwc-icon>library_books</mwc-icon>-->
      <div slot="title">${msg('Library')}: ${this._dvm.cell.name === "dLudotheque"? msg("Global") : this._dvm.cell.name}</div>

      ${IS_DEV? html`<mwc-icon-button id="dump-signals-button" slot="navigationIcon" icon="bug_report" @click=${() => this.onDumpLogs()} ></mwc-icon-button>` : html``}
      <sl-tooltip slot="actionItems" content="${msg('Sync with network')}"  placement="bottom-end" distance="4">
        <mwc-icon-button id="pull-button" icon="cloud_sync" @click=${() => this.onRefresh()} ></mwc-icon-button>
      </sl-tooltip>
      ${this.whereCellId === null? html`` : html`
        <sl-tooltip slot="actionItems" content="${msg('Exit library')}" placement="bottom-end" distance="4">
        <mwc-icon-button id="menu-button" icon="exit_to_app" @click=${() => this.exitLudotheque()}></mwc-icon-button>
          </sl-tooltip>`}
    </mwc-top-app-bar>
    <!-- APP BODY -->
    <div class="appBody">
      <mwc-fab id="add-fab" icon="add" @click=${() => this.openAddMenu()}></mwc-fab>
      <mwc-menu id="add-menu" absolute x="0" y="0" corner="BOTTOM_LEFT" @click=${this.handleAddMenuSelect}>
        <mwc-list-item value="add_playset"><span>${msg('Add Playset')}</span></mwc-list-item>
        <mwc-list-item value="add_space"><span>${msg('Add Space')}</span></mwc-list-item>
        <mwc-list-item value="add_template"><span>${msg('Add Template')}</span></mwc-list-item>
        <mwc-list-item value="add_svgMarker"><span>${msg('Add SvgMarker')}</span></mwc-list-item>
        <mwc-list-item value="add_emojiGroup"><span>${msg('Add EmojiGroup')}</span></mwc-list-item>
      </mwc-menu>
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
        <sl-tab-panel name="svg-markers">
          ${this.renderSvgMarkers()}
        </sl-tab-panel>
        <sl-tab-panel name="emoji-groups">
          ${this.renderEmojiGroups()}
        </sl-tab-panel>
        <sl-tab-panel name="templates">
          ${this.renderTemplates()}
        </sl-tab-panel>
      </sl-tab-group>
    </div>
    <!-- DIALOGS -->
    <where-playset-dialog id="playset-dialog" @playset-added="${this.handlePlaysetDialogClosing}"></where-playset-dialog>
    <where-template-dialog id="template-dialog" @template-created=${(e:any) => console.log(e.detail)}
    ></where-template-dialog>
    <where-emoji-group-dialog id="emoji-group-dialog" @emoji-group-added=${(e:any) => console.log(e.detail)}></where-emoji-group-dialog>
    <where-svg-marker-dialog id="svg-marker-dialog" @svg-marker-added=${(e:any) => console.log(e.detail)}></where-svg-marker-dialog>
    <where-space-dialog id="space-dialog" @space-created=${this.handleSpaceDialogClosing}></where-space-dialog>
  </div>
</mwc-drawer>
`;
  }

  private exitLudotheque(e?: any) {
    console.log("exitLudotheque()")
    this.dispatchEvent(new CustomEvent('exit', { detail: {}, bubbles: true, composed: true }));
  }

  private importPlayset(eh: EntryHashB64) {
    console.log("importPlayset() in " + encodeHashToBase64(this.whereCellId![0]) + " | " + eh)
    this.dispatchEvent(new CustomEvent<EntryHashB64>('import-playset-requested', { detail: eh, bubbles: true, composed: true }));
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
      "mwc-circular-progress": CircularProgress,
    };
  }

  static get styles() {
    return [
      sharedStyles,
      css`
        :host {
          background: #ecebee;
          height: 100vh;
          display: block;
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
          /*margin-top: -20px;*/
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

        mwc-fab {
          position: fixed !important;
          right: 30px;
          bottom: 30px;
          --mdc-fab-box-shadow: 0px 7px 8px -4px rgba(0, 0, 0, 0.2), 0px 12px 17px 2px rgba(0, 0, 0, 0.14), 0px 5px 22px 4px rgba(0, 0, 0, 0.12);
          --mdc-theme-secondary: #ef9439;
          --mdc-theme-on-secondary: black;
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
