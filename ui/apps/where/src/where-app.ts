import {ContextProvider} from "@holochain-open-dev/context";
import {EntryHashB64, serializeHash} from '@holochain-open-dev/core-types';
import { state } from "lit/decorators.js";
import {
  WhereController,
  WhereStore,
  whereContext, LudothequeController, ludothequeContext, LudothequeStore,
  Inventory,
} from "@where/elements";
import {
  Profile,
  ProfilePrompt,
  ProfilesStore,
  profilesStoreContext,
} from "@holochain-open-dev/profiles";
import {BaseClient, HolochainClient} from "@holochain-open-dev/cell-client";
import { ScopedElementsMixin } from "@open-wc/scoped-elements";
import { LitElement, html } from "lit";
import {Dialog} from "@scoped-elements/material-web";
import {CellId} from "@holochain/client";

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

  get importingDialogElem() : Dialog {
    return this.shadowRoot!.getElementById("importing-dialog") as Dialog;
  }

  /**
   *
   */
  async firstUpdated() {
    const wsUrl = `ws://localhost:${HC_PORT}`
    const installed_app_id = NETWORK_ID == null || NETWORK_ID == ''
      ? APP_ID
      : APP_ID + '-' + NETWORK_ID;
    console.log({installed_app_id})

    const hcClient = await HolochainClient.connect(wsUrl, installed_app_id);
    console.log({hcClient})
    // Where
    let where_cell = hcClient.cellDataByRoleId("where");
    if (!where_cell) {
      alert("Where Cell not found in happ")
    }
    this._whereCellId = where_cell!.cell_id;
    const whereClient = hcClient.forCell(where_cell!);
    console.log({whereClient})
    // Ludotheque
    let ludo_cell = hcClient.cellDataByRoleId("ludotheque");
    if (!ludo_cell) {
      alert("Ludotheque Cell not found in happ")
    }
    const ludoClient = hcClient.forCell(ludo_cell!);
    console.log({ludoClient})

    // Send dnaHash to electron
    if (IS_ELECTRON) {
      const ipc = window.require('electron').ipcRenderer;
      const dnaHashB64 = serializeHash(whereClient.cellId[0])
      let _reply = ipc.sendSync('dnaHash', dnaHashB64);
    }

    const profilesStore = new ProfilesStore(whereClient, {
      //additionalFields: ['color'],
      avatarMode: "avatar"
    })
    console.log({profilesStore})
    await profilesStore.fetchAllProfiles()
    const me = await profilesStore.fetchAgentProfile(profilesStore.myAgentPubKey);
    console.log({me})
    if (me) {
      this.hasProfile = true;
    }

    this._ludoStore = new LudothequeStore(hcClient)

    new ContextProvider(this, ludothequeContext, this._ludoStore);

    new ContextProvider(this, profilesStoreContext, profilesStore);

    this._whereStore = new WhereStore(hcClient, profilesStore);

    new ContextProvider(this, whereContext, this._whereStore);

    this.loaded = true;
  }

  onNewProfile(profile: Profile) {
    console.log({profile})
    this.hasProfile = true;
    this.requestUpdate();
  }

  render() {
    console.log("where-app render() - " + this.hasProfile)
    if (!this.loaded) {
      return html`<span>Loading...</span>`;
    }
    return html`
        <!--<profile-prompt style="margin-left:-7px; margin-top:0px;display:block;"
            @profile-created=${(e:any) => this.onNewProfile(e.detail.profile)}>-->
        
            ${this._canLudotheque? html`
                  <ludotheque-controller id="ludo-controller" examples
                                         .whereCellId=${this._whereCellId}
                                         @import-playset="${this.handleImportRequest}"
                                         @exit="${() => this._canLudotheque = false}"
                  ></ludotheque-controller>`
              : html`<where-controller dummy @show-ludotheque="${() => this._canLudotheque = true}"></where-controller>`
            }
        
            <!--</profile-prompt>-->
            <!--<where-controller id="controller" dummy></where-controller>-->

        <mwc-dialog id="importing-dialog"  heading="Importing Playset" scrimClickAction="" escapeKeyAction="">
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
    this.importingDialogElem.open = true;
    await this._ludoStore.exportPlayset(this._currentPlaysetEh!, this._whereCellId!)
    this.importingDialogElem.open = false;
  }


  static get scopedElements() {
    return {
      "profile-prompt": ProfilePrompt,
      "where-controller": WhereController,
      "ludotheque-controller": LudothequeController,
      "mwc-dialog": Dialog,
    };
  }
}
