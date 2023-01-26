import {html, css} from "lit";
import { state } from "lit/decorators.js";
import {localized, msg} from '@lit/localize';
import {Button, Card, Dialog} from "@scoped-elements/material-web";
import {AdminWebsocket, AppSignal, AppWebsocket, EntryHashB64, InstalledAppId, RoleName} from "@holochain/client";
import {CellContext, delay, HCL, CellsForRole, HappElement, HvmDef} from "@ddd-qc/lit-happ";
import {
  LudothequePage, LudothequeDvm, WherePage, WhereDvm,
  DEFAULT_WHERE_DEF, EditProfile
} from "@where/elements";
import {WhereProfile} from "@where/elements/dist/viewModels/profiles.proxy";
import {setLocale} from "./localization";


/** -- Globals -- */

const APP_DEV = process.env.APP_DEV? process.env.APP_DEV : false;
let HC_APP_PORT: number;
let HC_ADMIN_PORT: number;
/** override installed_app_id  when in Electron */
//export const MY_ELECTRON_API = (window as any).myElectronAPI;
//console.log("MY_ELECTRON_API = ", MY_ELECTRON_API);
export const IS_ELECTRON = (window.location.port === ""); // No HREF PORT when run by Electron
if (IS_ELECTRON) {
  const APP_ID = 'main-app'
  const searchParams = new URLSearchParams(window.location.search);
  const urlPort = searchParams.get("APP");
  if(!urlPort) {
    console.error("Missing APP value in URL", window.location.search)
  }
  HC_APP_PORT = Number(urlPort);
  const urlAdminPort = searchParams.get("ADMIN");
  HC_ADMIN_PORT = Number(urlAdminPort);
  const NETWORK_ID = searchParams.get("UID");
  console.log(NETWORK_ID)
  DEFAULT_WHERE_DEF.id = APP_ID + '-' + NETWORK_ID;  // override installed_app_id
} else {
  HC_APP_PORT = Number(process.env.HC_APP_PORT);
  HC_ADMIN_PORT = Number(process.env.HC_ADMIN_PORT);
}

console.log("APP_ID =", DEFAULT_WHERE_DEF.id)
console.log("HC_APP_PORT", HC_APP_PORT);
console.log("HC_ADMIN_PORT", HC_ADMIN_PORT);



/**
 *
 */
@localized()
export class WhereApp extends HappElement {

  @state() private _loaded = false;


  @state() private _canLudotheque = false;
  @state() private _hasStartingProfile = false;
  @state() private _lang?: string

  static readonly HVM_DEF: HvmDef = DEFAULT_WHERE_DEF;


  //@state() private _hvm!: HappViewModel;
  //private _conductorAppProxy!: ConductorAppProxy;

  private _currentPlaysetEh: null | EntryHashB64 = null;

  @state() private _ludoRoleCells!: CellsForRole;
  //private _curLudoCellId?: CellId;

  @state() private _curLudoCloneId?: RoleName; // = LudothequeDvm.DEFAULT_BASE_ROLE_NAME;


  /** */
  // constructor(port_or_socket?: number | AppWebsocket, appId?: InstalledAppId) {
  //   super(port_or_socket ? port_or_socket : HC_APP_PORT, appId);
  //   this.initializeHapp();
  // }

  constructor(socket?: AppWebsocket, appId?: InstalledAppId) {
    super(HC_APP_PORT);
    //this.initializeHapp(socket, appId);
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

  // get langDialogElem() : Dialog {
  //   return this.shadowRoot!.getElementById("lang-dialog") as Dialog;
  // }


  /** -- Methods -- */

  handleSignal(sig: AppSignal) {
    //console.log("<where-app> handleSignal()", sig);
    this.conductorAppProxy.onSignal(sig);
  }

  /** */
  async happInitialized() {
    console.log("happInitialized()")
    /** Authorize all zome calls */
    const adminWs = await AdminWebsocket.connect(`ws://localhost:${HC_ADMIN_PORT}`);
    //console.log({ adminWs });
    await this.hvm.authorizeAllZomeCalls(adminWs);
    console.log("*** Zome call authorization complete");
    /** Probe */
    await this.hvm.probeAll();
    /** Send dnaHash to electron */
    if (IS_ELECTRON) {
      const whereDnaHashB64 = this.hvm.getDvm(WhereDvm.DEFAULT_BASE_ROLE_NAME)!.cell.dnaHash;
      //let _reply = MY_ELECTRON_API.dnaHashSync(whereDnaHashB64);
      const ipc = window.require('electron').ipcRenderer;
      let _reply = ipc.sendSync('dnaHash', whereDnaHashB64);
    }

    /** Grab ludo cells */
    this._ludoRoleCells = await this.conductorAppProxy.fetchCells(DEFAULT_WHERE_DEF.id, LudothequeDvm.DEFAULT_BASE_ROLE_NAME);

    /** Done */
    this._loaded = true;
  }

  //
  // /** */
  // async initializeHapp(socket?: AppWebsocket, appId?: InstalledAppId) {
  //   if (!socket) {
  //     const wsUrl =`ws://localhost:${HC_APP_PORT}`
  //     console.log("<where-app> Creating AppWebsocket with", wsUrl);
  //     socket = await AppWebsocket.connect(wsUrl, 10 * 1000);
  //   }
  //
  //   this._conductorAppProxy = await ConductorAppProxy.new(socket);
  //
  //   // const hcClient = new HolochainClient(socket); // This will recreate the sockets interal WsClient with a new signalCb... x_x
  //   // hcClient.addSignalHandler((sig) => {
  //   //   //console.log("<where-app> signalCb()", sig);
  //   //   this.handleSignal(sig);
  //   // })
  //   this._conductorAppProxy.addSignalHandler(this.handleSignal);
  //
  //   const hvmDef = DEFAULT_WHERE_DEF;
  //   if (appId) {hvmDef.id = appId};
  //   const hvm = await HappViewModel.new(this, this._conductorAppProxy, hvmDef); // FIXME this can throw an error
  //
  //   /* Do this if not providing cellContext via <cell-context> */
  //   //new ContextProvider(this, cellContext, this.whereDvm.installedCell)
  //
  //   /** Send Where dnaHash to electron */
  //   if (IS_ELECTRON) {
  //     const whereDnaHashB64 = hvm.getDvm(WhereDvm.DEFAULT_BASE_ROLE_NAME)!.dnaHash;
  //     const ipc = window.require('electron').ipcRenderer;
  //     let _reply = ipc.sendSync('dnaHash', whereDnaHashB64);
  //   }
  //
  //   /** Grab ludo cells */
  //   this._ludoRoleCells = await this._conductorAppProxy.fetchCells(hvmDef.id, LudothequeDvm.DEFAULT_BASE_ROLE_NAME);
  //
  //
  //   /** ProfilesStore used by <create-profile> */
  //   // if (!profilesStore) {
  //   //   const whereCell = hvm.getDvm(WhereDvm.DEFAULT_BASE_ROLE_NAME)!.cell;
  //   //   const installedCell: InstalledCell = {
  //   //     cell_id: whereCell.cell_id,
  //   //     role_name: whereCell.name,
  //   //   }
  //   //   const whereClient = new CellClient(hcClient, installedCell);
  //   //   const profilesService = new ProfilesService(whereClient, "zProfiles");
  //   //   profilesStore = new ProfilesStore(profilesService, {
  //   //     additionalFields: ['color'], //['color', 'lang'],
  //   //     avatarMode: APP_DEV ? "avatar-optional" : "avatar-required"
  //   //   })
  //   // }
  //   // console.log({profilesStore})
  //   // new ContextProvider(this, profilesStoreContext, profilesStore);
  //
  //
  //   await hvm.probeAll();
  //   let profileZvm = (hvm.getDvm(WhereDvm.DEFAULT_BASE_ROLE_NAME)! as WhereDvm).profilesZvm;
  //   const me = await profileZvm.probeProfile(profileZvm.agentPubKey);
  //   console.log({me})
  //   if (me) {
  //     this._hasStartingProfile = true;
  //   }
  //   /** Done. Trigger update */
  //   this._hvm = hvm;
  // }


  /** */
  // shouldUpdate() {
  //   return !!this._hvm;
  // }


  /** */
  // async updated() {
  //   if (!APP_DEV && !this._lang) {
  //     this.langDialogElem.open = true;
  //   }
  // }


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
    this._canLudotheque = true;
  }


  /** */
  async onAddLudoClone(cloneName: string) {
    console.log("onAddLudoClone()", cloneName);
    const cellDef = { modifiers: {network_seed: cloneName}, cloneName: cloneName}
    const [_cloneIndex, dvm] = await this.hvm.cloneDvm(LudothequeDvm.DEFAULT_BASE_ROLE_NAME, cellDef);
    this._ludoRoleCells = await this.conductorAppProxy.fetchCells(this.hvm.appId, LudothequeDvm.DEFAULT_BASE_ROLE_NAME);
    this._curLudoCloneId = dvm.cell.cloneId;
    console.log("Ludotheque clone created:", dvm.hcl.toString(), dvm.cell.name, this._curLudoCloneId);
  }


  /** */
  render() {
    console.log("*** <where-app> render()", this._canLudotheque, this._hasStartingProfile, this._curLudoCloneId)

    /** Select language */
    // const lang = html`
    //     <mwc-dialog id="lang-dialog"  heading="${msg('Choose language')}" scrimClickAction="" escapeKeyAction="">
    //         <mwc-button
    //                 slot="primaryAction"
    //                 dialogAction="primaryAction"
    //                 @click="${() => {setLocale('fr-fr');this._lang = 'fr-fr'}}" >
    //             FR
    //         </mwc-button>
    //         <mwc-button
    //                 slot="primaryAction"
    //                 dialogAction="primaryAction"
    //                 @click="${() => {setLocale('en'); this._lang = 'en'}}" >
    //             EN
    //         </mwc-button>
    //     </mwc-dialog>
    // `;

    //.dvm="${this.ludothequeDvm}"

    /** Pages */
    const ludothequePage = html`
        <cell-context .cell="${this.ludothequeDvm.cell}">
                  <ludotheque-page examples
                                   .whereCellId=${this.whereDvm.cell.id}
                                   @import-playset-requested="${this.handleImportRequest}"
                                   @exit="${() => this._canLudotheque = false}"
                  ></ludotheque-page>
        </cell-context>
    `;

    const wherePage = html`
        <cell-context .cell="${this.whereDvm.cell}">
            <where-page 
                    .ludoRoleCells=${this._ludoRoleCells} 
                    .selectedLudoCloneId=${this._curLudoCloneId}
                    @show-ludotheque="${(e:any) => {e.stopPropagation(); this.onShowLudo(e.detail)}}"
                    @add-ludotheque="${(e:any) => {e.stopPropagation(); this.onAddLudoClone(e.detail)}}"
            ></where-page>
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
          <div class="column" style="align-items: center;">
            <mwc-card>
              <div class="column" style="margin: 16px;">
                <span class="title" style="margin-bottom: 24px; align-self: flex-start">
                  ${msg('Create Profile')}
                </span>
                  <edit-profile
                          .saveProfileLabel=${msg('Create Profile')}
                          @save-profile=${(e: CustomEvent) => this.createMyProfile(e.detail.profile)}
                          @lang-selected=${(e: CustomEvent) => {console.log("<where-app> set lang", e.detail); setLocale(e.detail)}}
                  ></edit-profile>
              </div>
            </mwc-card>
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


  /** */
  private async handleImportRequest(e: any) {
    console.log("handleImportRequest() : " + JSON.stringify(e.detail))
    this._currentPlaysetEh = e.detail;
    if(!this._currentPlaysetEh) {
      console.warn("this._currentPlaysetEh is null can't import")
      return;
    }

    const startTime = Date.now();
    this.importingDialogElem.open = true;
    const spaceEhs = await this.ludothequeDvm.ludothequeZvm.exportPlayset(this._currentPlaysetEh!, this.whereDvm.cell.id)
    console.log("handleImportRequest()", spaceEhs.length)
    await this.whereDvm.playsetZvm.probeAll();
    /** Create sessions for each space */
    for (const spaceEh of spaceEhs) {
      const space = await this.whereDvm.playsetZvm.getSpace(spaceEh);
      console.log("handleImportRequest().loop", spaceEh, space)
      if (!space) {
        console.warn("handleImportRequest() did not find spaceEh", spaceEh);
        continue;
      }
      if (space.meta.sessionCount == 0) {
        await this.whereDvm.constructNewPlay(space);
      } else {
        await this.whereDvm.constructNewPlay(space, space!.meta.sessionLabels);
      }
    }
    /** Wait for completion */
    while(Date.now() - startTime < 500) {
      //console.log(Date.now() - startTime)
      await delay(20);
    }
    this.importingDialogElem.open = false;
  }


  /** */
  static get scopedElements() {
    return {
      "where-page": WherePage,
      "ludotheque-page": LudothequePage,
      "mwc-dialog": Dialog,
      "mwc-button": Button,
      "cell-context": CellContext,
      "edit-profile": EditProfile,
      'mwc-card': Card,
    };
  }


  /** */
  static get styles() {
    return [
      css`
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



