import {html, css} from "lit";
import { state, customElement } from "lit/decorators.js";
import {localized, msg} from '@lit/localize';
import {AdminWebsocket, AppSignal, AppWebsocket, EntryHashB64, InstalledAppId, RoleName} from "@holochain/client";
import {CellContext, delay, HCL, CellsForRole, HappElement, HvmDef} from "@ddd-qc/lit-happ";
import {
  LudothequeDvm, WhereDvm,
  DEFAULT_WHERE_DEF, MY_ELECTRON_API, IS_ELECTRON
} from "@where/elements";
import {WhereProfile} from "@where/elements/dist/viewModels/profiles.proxy";
import {setLocale} from "./localization";

import {HC_ADMIN_PORT, HC_APP_PORT} from "./globals"
import {Inventory} from "@where/elements/dist/viewModels/playset.perspective";

import "@shoelace-style/shoelace/dist/components/card/card.js";

import "@material/mwc-circular-progress";
import "@material/mwc-button";
import "@material/mwc-dialog";
import {Dialog} from "@material/mwc-dialog";


/**
 *
 */
@localized()
@customElement("where-app")
export class WhereApp extends HappElement {

  @state() private _loaded = false;


  @state() private _canLudotheque = false;
  @state() private _hasStartingProfile = false;
  @state() private _lang?: string

  @state() private _currentSpaceEh: null | EntryHashB64 = null;

  static readonly HVM_DEF: HvmDef = DEFAULT_WHERE_DEF;

  private _currentPlaysetEh: null | EntryHashB64 = null;

  @state() private _ludoRoleCells!: CellsForRole;
  @state() private _curLudoCloneId?: RoleName; // = LudothequeDvm.DEFAULT_BASE_ROLE_NAME;


  private _whereInventory: Inventory | null = null;


  @state() private _canShowBuildView = false;



  /** */
  constructor(appWs?: AppWebsocket, private _adminWs?: AdminWebsocket, private _canAuthorizeZfns?: boolean, appId?: InstalledAppId) {
    super(appWs? appWs : HC_APP_PORT, appId);
    if (_canAuthorizeZfns == undefined) {
      this._canAuthorizeZfns = true;
    }
  }


  /** -- Getters -- */

  get whereDvm(): WhereDvm { return this.hvm.getDvm(WhereDvm.DEFAULT_BASE_ROLE_NAME)! as WhereDvm }
  get ludothequeDvm(): LudothequeDvm {
    const hcl = new HCL(this.hvm.appId, LudothequeDvm.DEFAULT_BASE_ROLE_NAME, this._curLudoCloneId);
    const maybeDvm = this.hvm.getDvm(hcl);
    if (!maybeDvm) console.error("DVM not found for ludotheque " + hcl.toString(), this.hvm);
    return maybeDvm! as LudothequeDvm;
  }

  get importingDialogElem() : Dialog {
    return this.shadowRoot!.getElementById("importing-dialog") as Dialog;
  }

  /** -- Methods -- */

  /** */
  handleSignal(sig: AppSignal) {
    //console.log("<where-app> handleSignal()", sig);
    this.conductorAppProxy.onSignal(sig);
  }


  /** */
  async hvmConstructed() {
    console.log("hvmConstructed()", this._adminWs, this._canAuthorizeZfns)
    /** Authorize all zome calls */
    if (!this._adminWs && this._canAuthorizeZfns) {
      this._adminWs = await AdminWebsocket.connect(`ws://localhost:${HC_ADMIN_PORT}`);
      console.log("hvmConstructed() connect called", this._adminWs);
    }
    if (this._adminWs && this._canAuthorizeZfns) {
      await this.hvm.authorizeAllZomeCalls(this._adminWs);
      console.log("*** Zome call authorization complete");
    } else {
      if (!this._canAuthorizeZfns) {
        console.warn("No adminWebsocket provided (Zome call authorization done)")
      } else {
        console.log("Zome call authorization done externally")

      }
    }
    /** Send dnaHash to electron */
    if (IS_ELECTRON) {
      const whereDnaHashB64 = this.hvm.getDvm(WhereDvm.DEFAULT_BASE_ROLE_NAME)!.cell.dnaHash;
      //let _reply = MY_ELECTRON_API.dnaHashSync(whereDnaHashB64);
      //const ipc = window.require('electron').ipcRenderer;
      //const ipc = window.require('electron').ipcRenderer;
      let _reply = MY_ELECTRON_API.sendSync('dnaHash', whereDnaHashB64);
    }

    /** Grab ludo cells */
    this._ludoRoleCells = await this.conductorAppProxy.fetchCells(DEFAULT_WHERE_DEF.id, LudothequeDvm.DEFAULT_BASE_ROLE_NAME);

  }


  /** */
  //async perspectiveInitializedOffline(): Promise<void> {}


  /** */
  async perspectiveInitializedOnline(): Promise<void> {
    console.log("<where-app>.perspectiveInitializedOnline()");
    /** Load My profile */
    const maybeMyProfile = this.whereDvm.profilesZvm.perspective.profiles[this.whereDvm.cell.agentPubKey]
    console.log("<where-app>.perspectiveInitializedOnline() maybeMyProfile", maybeMyProfile);
    if (maybeMyProfile) {
      const maybeLang = maybeMyProfile.fields['lang'];
      if (maybeLang) {
        setLocale(maybeLang);
      }
      this._hasStartingProfile = true;
    }

    this._whereInventory = await this.whereDvm.playsetZvm.probeInventory();

    /** Done */
    this._loaded = true;
  }


  /** */
  async createMyProfile(profile: WhereProfile) {
    //console.log("onNewProfile()", profile)
    await this.whereDvm.profilesZvm.createMyProfile(profile);
    this._hasStartingProfile = true;
  }


  /** */
  async onShowLudo(cloneId: RoleName | null) {
    if (cloneId) {
      this._curLudoCloneId = cloneId;
    } else {
      this._curLudoCloneId = undefined;
    }
    this._whereInventory = await this.whereDvm.playsetZvm.probeInventory();
    this._canLudotheque = true;
  }


  /** */
  async onAddLudoClone(uuid: string, cloneName?: string) {
    console.log("onAddLudoClone()", uuid, cloneName);
    const cellDef = { modifiers: {network_seed: uuid}, cloneName: cloneName}
    const [_cloneIndex, dvm] = await this.hvm.cloneDvm(LudothequeDvm.DEFAULT_BASE_ROLE_NAME, cellDef);
    this._ludoRoleCells = await this.conductorAppProxy.fetchCells(this.hvm.appId, LudothequeDvm.DEFAULT_BASE_ROLE_NAME);
    this._curLudoCloneId = dvm.cell.cloneId;
    console.log("Ludotheque clone created:", dvm.hcl.toString(), dvm.cell.name, this._curLudoCloneId);
  }


  /** */
  render() {
    console.log("*** <where-app> render()", this._canLudotheque, this._hasStartingProfile, this._curLudoCloneId)
    if (!this._loaded) {
      return html`        
      <div style="display: flex; justify-content: center; align-items: center; height: 100vh">
        <mwc-circular-progress indeterminate></mwc-circular-progress>
      </div>
      `;
    }

    /** Pages */
    const ludothequePage = html`
        <cell-context .cell="${this.ludothequeDvm.cell}">
                  <ludotheque-page examples
                                   .whereInventory="${this._whereInventory}"
                                   .whereCellId=${this.whereDvm.cell.id}
                                   @space-exported="${this.handleSpaceExported}"
                                   @import-playset-requested="${this.handleImportRequest}"
                                   @exit="${() => this._canLudotheque = false}"
                  ></ludotheque-page>
        </cell-context>
    `;

    const wherePage = html`
        <cell-context .cell="${this.whereDvm.cell}">
            ${this._currentSpaceEh? html`
            <where-page
                    .currentSpaceEh=${this._currentSpaceEh}
                    .canShowBuildView=${this._canShowBuildView}
                    .ludoRoleCells=${this._ludoRoleCells}
                    @canShowBuildView-set="${(e:any) => {e.stopPropagation(); this._canShowBuildView = e.detail}}"
                    @show-ludotheque="${(e:any) => {e.stopPropagation(); this.onShowLudo(e.detail)}}"
                    @add-ludotheque="${(e:any) => {e.stopPropagation(); this.onAddLudoClone(e.detail.uuid, e.detail.cloneName)}}"
                    @play-selected="${(e:any) => {e.stopPropagation(); this._currentSpaceEh = e.detail}}"
                    @lang-selected=${(e: CustomEvent) => {console.log("<where-app> set lang", e.detail); setLocale(e.detail)}}                    
            ></where-page>` :
            html`<where-dashboard
                    .canShowBuildView=${this._canShowBuildView}
                    .ludoRoleCells=${this._ludoRoleCells}
                    @canShowBuildView-set="${(e:any) => {e.stopPropagation(); this._canShowBuildView = e.detail}}"     
                    @show-ludotheque="${(e:any) => {e.stopPropagation(); this.onShowLudo(e.detail)}}"
                    @add-ludotheque="${(e:any) => {e.stopPropagation(); this.onAddLudoClone(e.detail.uuid, e.detail.cloneName)}}"
                    @play-selected="${(e:any) => {e.stopPropagation(); this._currentSpaceEh = e.detail}}"                    
                    @lang-selected=${(e: CustomEvent) => {console.log("<where-app> set lang", e.detail); setLocale(e.detail)}}                    
            ></where-dashboard>`}
        </cell-context>
    `;


    const page = this._canLudotheque? ludothequePage : wherePage

    // const guardedPage = this.hasStartingProfile
    //   ? page
    //   : html`<profile-prompt style="margin-left:-7px; margin-top:0px;display:block;" @profile-created=${(e:any) => this.onNewProfile(e.detail.profile)}>
    //             ${page}
    //         </profile-prompt>`;


    const createProfile = html `
        <div class="column"
             style="align-items: center; justify-content: center; flex: 1; padding-bottom: 10px;"
        >
          <h1 style="font-family: arial;color: #5804A8;"><img src="logo.svg" width="32" height="32" style="padding-left: 5px;padding-top: 5px;"/> Where</h1>            
          <div class="column" style="align-items: center;">
            <sl-card style="box-shadow: rgba(0, 0, 0, 0.19) 0px 10px 20px, rgba(0, 0, 0, 0.23) 0px 6px 6px;">
                <div class="title" style="margin-bottom: 24px; align-self: flex-start">
                  ${msg('Create Profile')}
                </div>
                  <edit-profile
                          .saveProfileLabel=${msg('Create Profile')}
                          @save-profile=${(e: CustomEvent) => this.createMyProfile(e.detail.profile)}
                          @lang-selected=${(e: CustomEvent) => {console.log("<where-app> set lang", e.detail); setLocale(e.detail)}}
                  ></edit-profile>
            </sl-card>
            </div>
        </div>`;

    const guardedPage = this._hasStartingProfile? page : createProfile;


    /** Render all */
    return html`
        ${guardedPage}
        <!-- DIALOGS -->
        <mwc-dialog id="importing-dialog"  heading="${msg('Importing Playset')}" scrimClickAction="" escapeKeyAction="">
            <div>Playset ${this._currentPlaysetEh}...</div>
            <!--<mwc-button
                    slot="secondaryAction"
                    dialogAction="discard">
                Discard
            </mwc-button>-->
            <mwc-button
                    slot="primaryAction"
                    dialogAction="cancel">
                Cancel
            </mwc-button>
        </mwc-dialog>
    `;
  }


  /** Create sessions for each space */
  private async importSpaces(spaceEhs: EntryHashB64[]) {
    for (const spaceEh of spaceEhs) {
      const space = await this.whereDvm.playsetZvm.getSpace(spaceEh);
      //console.log("importSpaces().loop", spaceEh, space)
      if (!space) {
        console.warn("importSpaces() did not find spaceEh", spaceEh);
        continue;
      }
      if (space.meta.sessionCount == 0) {
        await this.whereDvm.constructNewPlay(space);
      } else {
        await this.whereDvm.constructNewPlay(space, space!.meta.sessionLabels);
      }
    }
  }


  /** */
  private async handleSpaceExported(event: CustomEvent<EntryHashB64>) {
    console.log("handleSpaceExported() : " + event.detail);
    await this.whereDvm.playsetZvm.ProbePlaysets();
    await this.importSpaces([event.detail]);
  }


  /** */
  private async handleImportRequest(event: CustomEvent<EntryHashB64>) {
    console.log("handleImportRequest() : " + JSON.stringify(event.detail))
    this._currentPlaysetEh = event.detail;
    if(!this._currentPlaysetEh) {
      console.warn("handleImportRequest aborted. Missing entryHash value in event detail.");
      return;
    }

    const startTime = Date.now();
    this.importingDialogElem.open = true;
    const spaceEhs = await this.ludothequeDvm.ludothequeZvm.exportPlayset(this._currentPlaysetEh, this.whereDvm.cell.id)
    console.log("handleImportRequest()", spaceEhs.length)
    await this.whereDvm.playsetZvm.ProbePlaysets();

    await this.importSpaces(spaceEhs);

    this._whereInventory = await this.whereDvm.playsetZvm.probeInventory();

    /** Wait a minimum amount of time before closing dialog */
    while(Date.now() - startTime < 500) {
      //console.log(Date.now() - startTime)
      await delay(20);
    }
    this.importingDialogElem.open = false;
    this.requestUpdate();
  }


  // /** */
  // static get scopedElements() {
  //   return {
  //     "where-page": WherePage,
  //     "mwc-circular-progress": CircularProgress,
  //     "mwc-dialog": Dialog,
  //     "mwc-button": Button,
  //     "where-dashboard": WhereDashboard,
  //     "ludotheque-page": LudothequePage,
  //     "cell-context": CellContext,
  //     "edit-profile": EditProfile,
  //     'sl-card': SlCard,
  //   };
  // }


  /** */
  static get styles() {
    return [
      css`
        :host {
          background: #f7f6f8;
          display: block;
          height: 100vh;
        }

        .column {
          display: flex;
          flex-direction: column;
        }

        .title {
          font-size: 20px;
        }

      `,

    ];
  }
}



