import {LitElement, html, css} from "lit";
import { state } from "lit/decorators.js";
import { msg } from '@lit/localize';
import {EntryHashB64} from '@holochain-open-dev/core-types';
import { ScopedElementsMixin } from "@open-wc/scoped-elements";
import {Button, Dialog} from "@scoped-elements/material-web";
import {AppSignal, AppWebsocket, CellId, InstalledAppId} from "@holochain/client";
import {CellContext, ConductorAppProxy, HappViewModel, delay, RoleCells, HCL, RoleInstanceId} from "@ddd-qc/lit-happ";
import {CreateProfile, Profile, ProfilePrompt, ProfilesService, ProfilesStore, profilesStoreContext} from "@holochain-open-dev/profiles";
import {LudothequePage, setLocale, LudothequeDvm, WherePage, WhereDvm, DEFAULT_WHERE_DEF} from "@where/elements";
import {ContextProvider} from "@lit-labs/context";
import {CellClient, HolochainClient} from "@holochain-open-dev/cell-client";
import * as net from "net";


/** -- Globals -- */

const APP_DEV = process.env.APP_DEV? process.env.APP_DEV : false;
let HC_APP_PORT: number = Number(process.env.HC_APP_PORT);

/** override installed_app_id  when in Electron */
export const IS_ELECTRON = (window.location.port === ""); // No HREF PORT when run by Electron
if (IS_ELECTRON) {
  let APP_ID = 'main-app'
  let searchParams = new URLSearchParams(window.location.search);
  const urlPort = searchParams.get("PORT");
  if(!urlPort) {
    console.error("Missing PORT value in URL", window.location.search)
  }
  HC_APP_PORT = Number(urlPort);
  const NETWORK_ID = searchParams.get("UID");
  console.log(NETWORK_ID)
  DEFAULT_WHERE_DEF.id = APP_ID + '-' + NETWORK_ID;  // override installed_app_id
}

console.log({APP_ID: DEFAULT_WHERE_DEF.id})
console.log({HC_APP_PORT})


/**
 *
 */
export class WhereApp extends ScopedElementsMixin(LitElement) {

  @state() private _canLudotheque = false;
  @state() private _hasStartingProfile = false;
  @state() private _lang?: string

  @state() private _hvm!: HappViewModel;
  private _conductorAppProxy!: ConductorAppProxy;
  private _currentPlaysetEh: null | EntryHashB64 = null;

  @state() private _ludoRoleCells!: RoleCells;
  //private _curLudoCellId?: CellId;

  @state() private _curLudoRoleInstanceId: RoleInstanceId = LudothequeDvm.DEFAULT_BASE_ROLE_NAME;


  /** */
  // constructor(port_or_socket?: number | AppWebsocket, appId?: InstalledAppId) {
  //   super(port_or_socket ? port_or_socket : HC_APP_PORT, appId);
  //   this.initializeHapp();
  // }

  constructor(socket?: AppWebsocket, appId?: InstalledAppId, profilesStore?: ProfilesStore) {
    super();
    this.initializeHapp(socket, appId, profilesStore);
  }


  /** -- Getters -- */

  get whereDvm(): WhereDvm { return this._hvm.getDvm(WhereDvm.DEFAULT_BASE_ROLE_NAME)! as WhereDvm }
  get ludothequeDvm(): LudothequeDvm {
    //const hcl = this._curLudoRoleInstanceId !== LudothequeDvm.DEFAULT_BASE_ROLE_NAME
      //? new HCL(this._hvm.appId, LudothequeDvm.DEFAULT_BASE_ROLE_NAME, -1, this._curLudoRoleInstanceId) /* cloneIndex will not be used */
      //: new HCL(this._hvm.appId, LudothequeDvm.DEFAULT_BASE_ROLE_NAME);
    const hcl = new HCL(this._hvm.appId, this._curLudoRoleInstanceId);
    const maybeDvm = this._hvm.getDvm(hcl);
    if (!maybeDvm) console.error("DVM not found for ludotheque " + hcl.toString(), this._hvm);
    return maybeDvm! as LudothequeDvm;
  }

  get importingDialogElem() : Dialog {
    return this.shadowRoot!.getElementById("importing-dialog") as Dialog;
  }

  get langDialogElem() : Dialog {
    return this.shadowRoot!.getElementById("lang-dialog") as Dialog;
  }


  /** -- Methods -- */

  handleSignal(sig: AppSignal) {
    //console.log("<where-app> handleSignal()", sig);
    this._conductorAppProxy.onSignal(sig);
  }

  /** */
  async initializeHapp(socket?: AppWebsocket, appId?: InstalledAppId, profilesStore?: ProfilesStore) {
    if (!socket) {
      const wsUrl =`ws://localhost:${HC_APP_PORT}`
      console.log("<where-app> Creating AppWebsocket with", wsUrl);
      socket = await AppWebsocket.connect(wsUrl, 10 * 1000);
    }

    this._conductorAppProxy = await ConductorAppProxy.new(socket);

    const hcClient = new HolochainClient(socket); // This will recreate the sockets interal WsClient with a new signalCb... x_x
    hcClient.addSignalHandler((sig) => {
      //console.log("<where-app> signalCb()", sig);
      this.handleSignal(sig);
    })

    const hvmDef = DEFAULT_WHERE_DEF;
    if (appId) {hvmDef.id = appId};
    const hvm = await HappViewModel.new(this, this._conductorAppProxy, hvmDef); // FIXME this can throw an error

    /* Do this if not providing cellContext via <cell-context> */
    //new ContextProvider(this, cellContext, this.whereDvm.installedCell)

    /** Send Where dnaHash to electron */
    if (IS_ELECTRON) {
      const whereDnaHashB64 = hvm.getDvm(WhereDvm.DEFAULT_BASE_ROLE_NAME)!.dnaHash;
      const ipc = window.require('electron').ipcRenderer;
      let _reply = ipc.sendSync('dnaHash', whereDnaHashB64);
    }

    /** Grab ludo cells */
    this._ludoRoleCells = await this._conductorAppProxy.fetchCells(hvmDef.id, LudothequeDvm.DEFAULT_BASE_ROLE_NAME);


    /** ProfilesStore used by <create-profile> */
    if (!profilesStore) {
      const whereCell = hvm.getDvm(WhereDvm.DEFAULT_BASE_ROLE_NAME)!.installedCell;
      const whereClient = new CellClient(hcClient, whereCell);
      const profilesService = new ProfilesService(whereClient, "zProfiles");
      profilesStore = new ProfilesStore(profilesService, {
        additionalFields: ['color'], //['color', 'lang'],
        avatarMode: APP_DEV ? "avatar-optional" : "avatar-required"
      })
    }
    console.log({profilesStore})
    new ContextProvider(this, profilesStoreContext, profilesStore);


    await hvm.probeAll();
    let profileZvm = (hvm.getDvm(WhereDvm.DEFAULT_BASE_ROLE_NAME)! as WhereDvm).profilesZvm;
    const me = await profileZvm.probeProfile(profileZvm.agentPubKey);
    console.log({me})
    if (me) {
      this._hasStartingProfile = true;
    }
    /** Done. Trigger update */
    this._hvm = hvm;
  }


  /** */
  shouldUpdate() {
    return !!this._hvm;
  }


  /** */
  async updated() {
    if (!APP_DEV && !this._lang) {
      this.langDialogElem.open = true;
    }
  }


  /** */
  async onNewProfile(profile: Profile) {
    //console.log("onNewProfile()", profile)
    await this.whereDvm.profilesZvm.createMyProfile(profile);
    this._hasStartingProfile = true;
  }


  /** */
  async onShowLudo(roleInstanceId: RoleInstanceId) {
    this._curLudoRoleInstanceId = roleInstanceId;
    this._canLudotheque = true;
  }


  /** */
  async onAddLudoClone(cloneName: string) {
    console.log("onAddLudoClone()", cloneName);
    // if (this._ludoRoleCells.clones[cloneName]) {
    //   console.warn(`AddLudoClone() aborted. Ludotheque clone "${cloneName}" already exists.`)
    //   return;
    // }
    const cellDef = { modifiers: {network_seed: cloneName}/*, cloneName: cloneName*/}
    const [cloneIndex, dvm] = await this._hvm.cloneDvm(LudothequeDvm.DEFAULT_BASE_ROLE_NAME, cellDef);
    console.log("Ludotheque clone created:", dvm.hcl.toString());
    this._ludoRoleCells = await this._conductorAppProxy.fetchCells(this._hvm.appId, LudothequeDvm.DEFAULT_BASE_ROLE_NAME);
    this._curLudoRoleInstanceId = dvm.roleInstanceId;
  }


  /** */
  render() {
    console.log("<where-app> render()", this._canLudotheque, this._hasStartingProfile)

    /** Select language */
    const lang = html`
        <mwc-dialog id="lang-dialog"  heading="${msg('Choose language')}" scrimClickAction="" escapeKeyAction="">
            <mwc-button
                    slot="primaryAction"
                    dialogAction="primaryAction"
                    @click="${() => {setLocale('fr-fr');this._lang = 'fr-fr'}}" >
                FR
            </mwc-button>
            <mwc-button
                    slot="primaryAction"
                    dialogAction="primaryAction"
                    @click="${() => {setLocale('en'); this._lang = 'en'}}" >
                EN
            </mwc-button>
        </mwc-dialog>
    `;

    /** Pages */
    const ludothequePage = html`
        <cell-context .installedCell="${this.ludothequeDvm.installedCell}">
                  <ludotheque-page examples
                                   .dvm="${this.ludothequeDvm}"
                                   .whereCellId=${this.whereDvm.cellId}
                                   @import-playset-requested="${this.handleImportRequest}"
                                   @exit="${() => this._canLudotheque = false}"
                  ></ludotheque-page>
        </cell-context>
    `;

    const wherePage = html`
        <cell-context .installedCell="${this.whereDvm.installedCell}">
            <where-page 
                    .ludoRoleCells=${this._ludoRoleCells} 
                    .selectedLudo=${this._curLudoRoleInstanceId}
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
        <div
                class="column"
                style="align-items: center; justify-content: center; flex: 1; padding-bottom: 10px;"
        >
            <div class="column" style="align-items: center;">
                <slot name="hero"></slot>
                <create-profile @profile-created=${(e:any) => this.onNewProfile(e.detail.profile)}></create-profile>
            </div>
        </div>`;

    const guardedPage = this._hasStartingProfile? page : createProfile;


    /** Render all */
    return html`
        ${lang}
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
    const spaceEhs = await this.ludothequeDvm.ludothequeZvm.exportPlayset(this._currentPlaysetEh!, this.whereDvm.cellId)
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
      "profile-prompt": ProfilePrompt,
      "where-page": WherePage,
      "ludotheque-page": LudothequePage,
      "mwc-dialog": Dialog,
      "mwc-button": Button,
      "cell-context": CellContext,
      'create-profile': CreateProfile,
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
      `,
    ];
  }
}



