import {css, html} from "lit";
import {property, state} from "lit/decorators.js";

import {sharedStyles} from "../sharedStyles";
import {SlAvatar, SlBadge, SlCard, SlColorPicker, SlTooltip} from '@scoped-elements/shoelace';
import {
  Button, CircularProgress, Dialog, Drawer, Fab, Formfield,
  Icon, IconButton, IconButtonToggle,
  List, ListItem, Menu, Select,
  Slider, Switch, TextField, TopAppBar, TopAppBarFixed,
} from "@scoped-elements/material-web";

import {EntryHashB64} from "@holochain/client";

import {delay, DnaElement} from "@ddd-qc/lit-happ";
import {Dictionary} from "@ddd-qc/cell-proxy";
import {CellsForRole} from "@ddd-qc/cell-proxy/dist/types";

import {renderSurface} from "../sharedRender";
import {prefix_canvas} from "../templates";
import {WherePeerList} from "./where-peer-list";
import {WhereSpace} from "./where-space";
import {WherePlayDialog} from "../dialogs/where-play-dialog";
import {WhereTemplateDialog} from "../dialogs/where-template-dialog";
import {WhereArchiveDialog} from "../dialogs/where-archive-dialog";
import { localized, msg } from '@lit/localize';
import {WhereDnaPerspective, WhereDvm} from "../viewModels/where.dvm";
import {Play, WherePerspective} from "../viewModels/where.perspective";
import {Template} from "../bindings/playset.types";

import {WhereProfile} from "../viewModels/profiles.proxy";
//import {WhereCloneLudoDialog} from "../dialogs/where-clone-ludo-dialog";
import {WhereLudoDialog} from "../dialogs/where-ludo-dialog";
import {WherePlayInfoDialog} from "../dialogs/where-play-info-dialog";
import {SignalPayload} from "../bindings/where.types";
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

/** ----- */


/** @element where-page */
@localized()
export class WhereDashboard extends DnaElement<WhereDnaPerspective, WhereDvm> {
  constructor() {
    super(WhereDvm.DEFAULT_BASE_ROLE_NAME);
  }

  /** Properties */

  @property()
  ludoRoleCells: CellsForRole | null = null;

  @property({ type: Boolean, attribute: 'canShowBuildView' })
  canShowBuildView!: boolean;


  private _curSpaceEh: EntryHashB64;

  /** ViewModels */

  @property({type: Object, attribute: false, hasChanged: (_v, _old) => true})
  wherePerspective!: WherePerspective;

  private _myProfile?: WhereProfile;


  /** State */

  @state() private _initialized = false;
  @state() private _canPostInit = false;


  /** Getters */

  get ludoMenuElem(): Menu {
    return this.shadowRoot!.getElementById("ludotheque-menu") as Menu;
  }

  get profileDialogElem(): Dialog {
    return this.shadowRoot!.getElementById("where-profile-dialog") as Dialog;
  }

  get templateDialogElem(): WhereTemplateDialog {
    return this.shadowRoot!.getElementById("template-dialog") as WhereTemplateDialog;
  }

  get archiveDialogElem(): WhereArchiveDialog {
    return this.shadowRoot!.getElementById("archive-dialog") as WhereArchiveDialog;
  }

  get playInfoDialogElem(): WherePlayInfoDialog {
    return this.shadowRoot!.getElementById("play-info-dialog") as WherePlayInfoDialog;
  }

  get playDialogElem() : WherePlayDialog {
    return this.shadowRoot!.getElementById("play-dialog") as WherePlayDialog;
  }


  /** -- Methods -- */

  /** */
  async setMyProfile(nickname: string, avatar: string, color: string) {
    console.log("setMyProfile()", nickname)
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
    console.log("<where-dashboard> firstUpdated()");
    await this._dvm.probeAllPlays();
    /** Done */
    this._initialized = true
    this._canPostInit = true;
  }


  /** After each render */
  async updated(changedProperties: unknown) {
    console.log("<where-dashboard> updated()")
    if (this._canPostInit && this.shadowRoot!.getElementById("app-bar")) {
      this.postInit();
    }
    //this.anchorLudothequeMenu();

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
        } catch (e) {
        }
      }
    }
  }


  /** */
  private postInit() {
    this._canPostInit = false;
    /** add custom styles to TopAppBar */
    const topBar = this.shadowRoot!.getElementById("app-bar") as TopAppBarFixed;
    console.log("<where-dashboard> postInit()", topBar);
    topBar.shadowRoot!.appendChild(tmpl.content.cloneNode(true));
    /** Menu */
    this.anchorLudothequeMenu();
  }


  /** */
  onRefresh() {
    console.log("refresh: Pulling data from DHT")
    this._dvm.probeAll();
  }


  /** Hide Current play and select first available one */
  async archiveSpace(spaceEh: EntryHashB64) {
    await this._dvm.whereZvm.hidePlay(spaceEh);
    this.requestUpdate();
  }


  /** */
  async openTemplateDialog(templateEh?: EntryHashB64) {
    this.templateDialogElem.clearAllFields();
    const template = templateEh ? this._dvm.playsetZvm.getTemplate(templateEh) : undefined;
    this.templateDialogElem.open(template);
  }


  /** */
  async openPlayDialog() {
    this.playDialogElem.resetAllFields();
    this.playDialogElem.open(undefined);
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
  private async selectPlay(spaceEh: EntryHashB64): Promise<void> {
    console.log("selectPlay()", spaceEh);
    let play = null;
    /** Wait for store to be updated with newly created Play */
      // TODO: Remove this hack
    let time = 0;
    while (!play && time < 2 * 1000) {
      play = this._dvm.getPlay(spaceEh);
      await delay(100);
      time += 100;
    }
    if (!play) {
      console.error("selectPlay() failed: Play not found")
      return Promise.reject("Play not found")
    }
    this.dispatchEvent(new CustomEvent('play-selected', { detail: spaceEh, bubbles: true, composed: true }));

  }


  /** */
  private async handleArchiveDialogClosing(e: any) {
    this.requestUpdate();
  }


  /** */
  openTopMenu() {
    const menu = this.shadowRoot!.getElementById("top-menu") as Menu;
    menu.open = true;
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
  private anchorLudothequeMenu() {
    const menu = this.shadowRoot!.getElementById("ludotheque-menu") as Menu;
    const button = this.shadowRoot!.getElementById("ludo-button") as any;
    console.log("<where-dashboard> Anchoring Menu to top button", menu, button)
    if (menu && button) {
      menu.anchor = button
    }
  }


  /** */
  onLudothequeMenuSelected(e:any) {
    const menu = e.currentTarget as Menu;
    const selected = menu.selected as ListItem;
    console.log("onLudothequeMenuSelected()", selected);
    if (!selected) {
      console.warn("No value selected during onLudothequeMenuSelected()");
      return;
    }
    if (selected.value == "__new__") {
      const dialog = this.shadowRoot!.getElementById("clone-ludo-dialog") as WhereLudoDialog;
      dialog.open();
      return;
    }
    this.dispatchEvent(new CustomEvent('show-ludotheque', { detail: selected.value, bubbles: true, composed: true }));
  }

  async openPlayInfoDialog(play: Play) {
    const dialog = this.playInfoDialogElem;
    const template = this._dvm.playsetZvm.getTemplate(play.space.origin);
    dialog.open(play, template);
  }


  /** */
  render() {
    console.log("<where-dashboard> render()", this._initialized, this.canShowBuildView, this._dvm);
    if (!this._initialized) {
      return html`
        <div style="display: flex; justify-content: center; align-items: center; height: 100vh">
            <mwc-circular-progress indeterminate></mwc-circular-progress>
        </div>
      `;
    }

    // DEBUG
    //console.log({WhereDnaPerspective: this.perspective})
    //console.log({PlaysetPerspective: this._dvm.playsetZvm.perspective})

     /* -- Grab things from the perspective -- */

    this._myProfile = this._dvm.profilesZvm.getProfile(this._dvm.cell.agentPubKey);


    /* -- Build elements -- */

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
    ludoNamesLi.push(html`<li divider role="separator"></li>`);
    ludoNamesLi.push(html`<mwc-list-item class="ludo-clone-li" value="__new__">${msg('Add')}...</mwc-list-item>`);

    /** Build space/play list */
    const playVisibles = Object.entries(this.perspective.plays).map(
      ([spaceEh, play]) => {
        if (!this._dvm.getVisibility(spaceEh)!) {
          return html ``;
        }
        //const template = this._dvm.playsetZvm.getTemplate(play.space.origin);
        const r = play.space.surface.size.x / play.space.surface.size.y;
        return html`
          <sl-card class="card-image" >
            <span slot="image" @click=${() => this.selectPlay(spaceEh)}>${renderSurface(play.space.surface, play.space.name, 290, 200)}</span>
            <b >${play.space.name}</b>
            <mwc-icon class="info-icon" style="cursor: pointer;"
                      @click=${() => {const play = this._dvm.getPlay(spaceEh); this.openPlayInfoDialog(play)}}
            >info</mwc-icon>
          </sl-card>
          `
      }
    );


    /** Render all */
    return html`
    <!-- TOP APP BAR -->
    <mwc-top-app-bar-fixed id="app-bar" dense centerTitle>
      <div slot="title">Where</div>
      ${IS_DEV? html`
        <sl-tooltip slot="navigationIcon" content="Dump logs" placement="bottom" distance="4">
            <mwc-icon-button id="dump-signals-button" icon="bug_report" @click=${() => this._dvm.dumpLogs()} ></mwc-icon-button>
        </sl-tooltip>
      ` : html``}
      <sl-tooltip slot="actionItems" content=${msg('Sync with network')} placement="bottom" distance="4">
        <mwc-icon-button id="pull-button" style="display:${this.canShowBuildView? "inline-flex": "none"}" icon="cloud_sync" @click=${() => this.onRefresh()} ></mwc-icon-button>
      </sl-tooltip>
      <div style="position: relative" slot="actionItems">
        <sl-tooltip content=${msg('Go to Library')} placement="bottom" distance="4">
        <mwc-icon-button id="ludo-button"  style="display:${this.canShowBuildView? "inline-flex": "none"}" icon="travel_explore" @click=${() => this.ludoMenuElem.open = true}></mwc-icon-button>
        </sl-tooltip>
        <mwc-menu id="ludotheque-menu" corner="BOTTOM_LEFT" @click=${this.onLudothequeMenuSelected}>
          ${ludoNamesLi}
        </mwc-menu>
      </div>
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
        <sl-avatar id="avatar" @click="${(_e) => this.profileDialogElem.open = true}" .image=${this._myProfile.fields.avatar}
             style="background-color:${this._myProfile.fields.color};border: ${this._myProfile.fields.color} 1px solid;cursor: pointer;">
        </sl-avatar>
      </sl-tooltip>
    </mwc-top-app-bar-fixed>
    <!-- APP BODY -->
    <div class="appBody">
      ${this.canShowBuildView? html`
        <mwc-fab id="archive-fab" icon="archive" @click=${() => this.archiveDialogElem.open()}></mwc-fab>
        <mwc-fab id="add-fab" icon="add" @click=${() => this.openPlayDialog()}></mwc-fab>
      ` : html``}
      <!-- FIXME Grid of spaces -->
      <!-- SPACE LIST -->
      ${playVisibles.length == 0 ? html`
          <div style="font-size:32px;margin-top:20px;">
            ${msg('No spaces found.')}
            <br/><br/>
            ${msg('You can create or import a space from build mode')}: <mwc-icon>videogame_asset</mwc-icon> <mwc-icon>east</mwc-icon> <mwc-icon>handyman</mwc-icon>
          </div>
      ` : html`
        ${playVisibles}
      `}
    </div>
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
  </div>
`;
  }

  //  @lang-selected=${(e: CustomEvent) => {console.log("<where-dashboard> set lang", e.detail); setLocale(e.detail)}}

  private async onProfileEdited(profile: WhereProfile) {
    await this._dvm.profilesZvm.updateMyProfile(profile);
    this.profileDialogElem.open = false;
    /** Make sure a redraw is triggered */
    this._myProfile.fields.avatar = profile.fields.avatar;
    this._myProfile.fields.color = profile.fields.color;
    this.requestUpdate();
  }


  /** */
  static get scopedElements() {
    return {
      "mwc-button": Button,
      "mwc-circular-progress": CircularProgress,
      "mwc-dialog": Dialog,
      "mwc-drawer": Drawer,
      "mwc-fab": Fab,
      "mwc-icon": Icon,
      "mwc-icon-button": IconButton,
      "mwc-icon-button-toggle": IconButtonToggle,
      "mwc-list": List,
      "mwc-list-item": ListItem,
      "mwc-menu": Menu,
      "mwc-slider": Slider,
      "mwc-switch": Switch,
      "mwc-top-app-bar": TopAppBar,
      "mwc-top-app-bar-fixed": TopAppBarFixed,
      "mwc-textfield": TextField,
      "mwc-select": Select,
      "where-clone-ludo-dialog": WhereLudoDialog,
      "where-play-dialog" : WherePlayDialog,
      "where-template-dialog" : WhereTemplateDialog,
      "where-archive-dialog" : WhereArchiveDialog,
      "where-play-info-dialog" : WherePlayInfoDialog,
      "where-space": WhereSpace,
      "where-peer-list": WherePeerList,
      "mwc-formfield": Formfield,
      'sl-avatar': SlAvatar,
      'sl-card': SlCard,
      'sl-tooltip': SlTooltip,
      'sl-color-picker': SlColorPicker,
      'sl-badge': SlBadge,
    };
  }


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

        .info-icon {
          color: rgb(164, 182, 223);
          /*--mdc-icon-size: 22px;*/
          margin-left: 5px;
          vertical-align: middle;
        }

        .card-image {
          /*cursor: pointer;*/
        }

        .card-image::part(image) {
          cursor: pointer;
          background: rgb(233, 225, 240);
          margin: 5px;
          border: 1px solid rgb(233, 225, 240);
        }

        .card-image::part(base) {
          background: #ffffff;
          box-shadow: rgba(0, 0, 0, 0.12) 0px 1px 3px, rgba(0, 0, 0, 0.24) 0px 1px 2px;
        }

        .card-image::part(body) {
          /*background: rgba(229, 222, 248, 0.52);*/
          text-align: center;
        }

        .column {
          display: flex;
          flex-direction: column;
        }


        #app-bar {
          /*margin-top: -15px;*/
        }


        .appBody {
          width: 100%;
          margin-top: 3px;
          display: flex;
          justify-content: space-evenly;
          flex-direction: row;
          flex-wrap: wrap;
          align-content: space-around;
          gap: 20px 10px;
        }

        mwc-textfield.rounded {
          --mdc-shape-small: 20px;
          width: 7em;
          margin-top: 10px;
        }

        mwc-textfield label {
          padding: 0px;
        }

        #archive-fab {
          position: fixed !important;
          right: 30px;
          bottom: 100px;
          --mdc-fab-box-shadow: 0px 7px 8px -4px rgba(0, 0, 0, 0.2), 0px 12px 17px 2px rgba(0, 0, 0, 0.14), 0px 5px 22px 4px rgba(0, 0, 0, 0.12);
          /*--mdc-theme-secondary: white;*/
          /*--mdc-theme-on-secondary: black;*/
        }

        #add-fab {
          position: fixed !important;
          right: 30px;
          bottom: 30px;
          --mdc-fab-box-shadow: 0px 7px 8px -4px rgba(0, 0, 0, 0.2), 0px 12px 17px 2px rgba(0, 0, 0, 0.14), 0px 5px 22px 4px rgba(0, 0, 0, 0.12);
          /*--mdc-theme-secondary: white;*/
          /*--mdc-theme-on-secondary: black;*/
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
