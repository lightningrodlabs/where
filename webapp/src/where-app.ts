import {ContextProvider} from "@lit-labs/context";
import { LitElement, html } from "lit";
import { state } from "lit/decorators.js";
import { msg } from '@lit/localize';
import {EntryHashB64} from '@holochain-open-dev/core-types';
import {serializeHash} from '@holochain-open-dev/utils';
import {CellClient, HolochainClient} from "@holochain-open-dev/cell-client";
import { ScopedElementsMixin } from "@open-wc/scoped-elements";
import {Dialog} from "@scoped-elements/material-web";
import {CellId, InstalledCell, AppWebsocket} from "@holochain/client";
import {
  Profile,
  ProfilePrompt, ProfilesService,
  ProfilesStore,
  profilesStoreContext,
} from "@holochain-open-dev/profiles";
import {
  WhereController,
  WhereStore,
  whereContext, LudothequeController, ludothequeContext, LudothequeStore,
  Inventory, setLocale,
} from "@where/elements";



/** ------- */

const delay = (ms:number) => new Promise(r => setTimeout(r, ms))

const APP_DEV = process.env.APP_DEV? process.env.APP_DEV : false;
let APP_ID = 'where'
let HC_PORT:any = process.env.HC_PORT;
let NETWORK_ID: any = null
export const IS_ELECTRON = (window.location.port === ""); // No HREF PORT when run by Electron
if (IS_ELECTRON) {
  APP_ID = 'main-app'
  let searchParams = new URLSearchParams(window.location.search);
  HC_PORT = searchParams.get("PORT");
  NETWORK_ID = searchParams.get("UID");
  console.log(NETWORK_ID)
}

// FIXME
//const HC_PORT = process.env.HC_PORT
//const HC_PORT = 8889
console.log("HC_PORT = " + HC_PORT + " || " + process.env.HC_PORT);


export class WhereApp extends ScopedElementsMixin(LitElement) {

  @state() loaded = false;
  @state() _canLudotheque: boolean = false;

  hasProfile: boolean = false;
  _currentPlaysetEh: null | EntryHashB64 = null;

  _ludoStore: LudothequeStore | null = null;
  _whereStore: WhereStore | null = null;

  _inventory: Inventory | null = null;

  _whereCellId: CellId | null = null;
  _ludoCellId: CellId | null = null;

  _lang?: string

  get importingDialogElem() : Dialog {
    return this.shadowRoot!.getElementById("importing-dialog") as Dialog;
  }

  get langDialogElem() : Dialog {
    return this.shadowRoot!.getElementById("lang-dialog") as Dialog;
  }


  /** */
  async updated() {
    if (!APP_DEV && this.loaded && !this._lang) {
      this.langDialogElem.open = true;
    }
  }


  /** */
  async firstUpdated() {
    /** Connect appWebsocket */
    const wsUrl = `ws://localhost:${HC_PORT}`
    const appWebsocket = await AppWebsocket.connect(wsUrl);
    console.log({appWebsocket})
    const hcClient = new HolochainClient(appWebsocket)
    console.log({hcClient})
    /** Get appInfo */
    const installed_app_id = NETWORK_ID == null || NETWORK_ID == ''
      ? APP_ID
      : APP_ID + '-' + NETWORK_ID;
    console.log({installed_app_id})
    const appInfo = await hcClient.appWebsocket.appInfo({installed_app_id});

    /** Get Cells by role 'manually' */
    let where_cell: InstalledCell | undefined = undefined;
    let ludo_cell: InstalledCell | undefined = undefined;
    for (const cell_data of appInfo.cell_data) {
      if (cell_data.role_id == "where") {
        where_cell = cell_data;
      }
      if (cell_data.role_id == "ludotheque") {
        ludo_cell = cell_data;
      }
    }
    if (!where_cell) {
      alert(msg("Error: Where app not installed"));
      return;
    }

    /** Setup Ludotheque client & store */
    if (ludo_cell) {
      this._ludoCellId = ludo_cell.cell_id;
      this._ludoStore = new LudothequeStore(hcClient, appInfo, ludo_cell.cell_id)
      new ContextProvider(this, ludothequeContext, this._ludoStore);
    } else {
      alert(msg("No Ludotheques DNA were found. Ludotheque features will be disabled."))
    }

    /** Setup Where client */
    this._whereCellId = where_cell.cell_id;
    const whereClient = new CellClient(hcClient, where_cell)
    console.log({whereClient})

    /** Send Where dnaHash to electron */
    if (IS_ELECTRON) {
      const ipc = window.require('electron').ipcRenderer;
      const whereDnaHashB64 = serializeHash(where_cell.cell_id[0])
      let _reply = ipc.sendSync('dnaHash', whereDnaHashB64);
    }

    /** ProfilesStore */
    const profilesService = new ProfilesService(whereClient);
    const profilesStore = new ProfilesStore(profilesService, {
      //additionalFields: ['color', 'lang'],
      avatarMode: APP_DEV? "avatar-optional" : "avatar-required"
    })
    console.log({profilesStore})
    await profilesStore.fetchAllProfiles()
    const me = await profilesStore.fetchAgentProfile(profilesStore.myAgentPubKey);
    console.log({me})
    if (me) {
      this.hasProfile = true;
    }
    new ContextProvider(this, profilesStoreContext, profilesStore);

    /** WhereStore */
    this._whereStore = new WhereStore(hcClient, profilesStore, appInfo, where_cell.cell_id);
    new ContextProvider(this, whereContext, this._whereStore);

    /** */
    this.loaded = true;
  }


  /** */
  onNewProfile(profile: Profile) {
    console.log({profile})
    this.hasProfile = true;
    this.requestUpdate();
  }


  /** */
  render() {
    console.log("where-app render() || " + this.hasProfile)
    console.log("_canLudotheque: " + this._canLudotheque)

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

    if (!this.loaded) {
      console.log("where-app render() => Loading...");
      return html`<span>Loading...</span>`;
    }
    return html`
        ${lang}
        <profile-prompt style="margin-left:-7px; margin-top:0px;display:block;"
            @profile-created=${(e:any) => this.onNewProfile(e.detail.profile)}>
        
            ${this._canLudotheque? html`
                  <ludotheque-controller id="ludo-controller" examples
                                         .whereCellId=${this._whereCellId}
                                         @import-playset="${this.handleImportRequest}"
                                         @exit="${() => this._canLudotheque = false}"
                  ></ludotheque-controller>`
              : html`<where-controller                                       
                .ludoCellId=${this._ludoCellId}
                @show-ludotheque="${() => this._canLudotheque = true}"
                    ></where-controller>`
            }
        
            </profile-prompt>
            <!--<where-controller id="controller" dummy></where-controller>-->

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
    if(!this._ludoStore || !this._whereCellId) {
      console.error("No ludoStore or whereCell in where-app")
      return;
    }
    const startTime = Date.now();
    this.importingDialogElem.open = true;
    await this._ludoStore.exportPlayset(this._currentPlaysetEh!, this._whereCellId!)
    while(Date.now() - startTime < 500) {
      console.log(Date.now() - startTime)
       await delay(20);
    }
    this.importingDialogElem.open = false;
  }


  /** */
  static get scopedElements() {
    return {
      "profile-prompt": ProfilePrompt,
      "where-controller": WhereController,
      "ludotheque-controller": LudothequeController,
      "mwc-dialog": Dialog,
    };
  }
}
