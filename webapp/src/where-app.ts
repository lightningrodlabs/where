import { LitElement, html } from "lit";
import { state } from "lit/decorators.js";
import { msg } from '@lit/localize';
import {EntryHashB64} from '@holochain-open-dev/core-types';
import { ScopedElementsMixin } from "@open-wc/scoped-elements";
import {Dialog} from "@scoped-elements/material-web";
import {CellId} from "@holochain/client";
import { ConductorAppProxy, HappViewModel, } from "@ddd-qc/dna-client";
import {Profile, ProfilePrompt, ProfilesService, ProfilesStore, profilesStoreContext} from "@holochain-open-dev/profiles";
import {LudothequeApp, setLocale, LudothequeDvm, whereHappDef} from "where-mvvm";


/** ------- */

const delay = (ms:number) => new Promise(r => setTimeout(r, ms))


/** -- Globals -- */

const APP_DEV = process.env.APP_DEV? process.env.APP_DEV : false;
let HC_APP_PORT: any = process.env.HC_APP_PORT;

/** override installed_app_id  when in Electron */
export const IS_ELECTRON = (window.location.port === ""); // No HREF PORT when run by Electron
if (IS_ELECTRON) {
  let APP_ID = 'main-app'
  let searchParams = new URLSearchParams(window.location.search);
  HC_APP_PORT = searchParams.get("PORT");
  const NETWORK_ID = searchParams.get("UID");
  console.log(NETWORK_ID)
  whereHappDef.id = APP_ID + '-' + NETWORK_ID;  // override installed_app_id
}

console.log({APP_ID: whereHappDef.id})
console.log({HC_APP_PORT})


/**
 *
 */
export class WhereApp extends ScopedElementsMixin(LitElement) {

  @state() private _loaded = false;
  @state() private _canLudotheque = false;

  private _conductorAppProxy!: ConductorAppProxy;
  private _happ!: HappViewModel;
  private _currentPlaysetEh: null | EntryHashB64 = null;

  //hasProfile = false;
  //_inventory: Inventory | null = null;

  private _whereCellId!: CellId;
  private _ludoCellId!: CellId;
  private _lang?: string


  /** -- Getters -- */

  get importingDialogElem() : Dialog {
    return this.shadowRoot!.getElementById("importing-dialog") as Dialog;
  }

  get langDialogElem() : Dialog {
    return this.shadowRoot!.getElementById("lang-dialog") as Dialog;
  }


  /** -- Methods -- */

  /** */
  async updated() {
    if (!APP_DEV && this._loaded && !this._lang) {
      this.langDialogElem.open = true;
    }
  }


  /** */
  async firstUpdated() {
    this._conductorAppProxy = await ConductorAppProxy.new(Number(process.env.HC_APP_PORT));
    this._happ = await this._conductorAppProxy.newHappViewModel(this, whereHappDef); // FIXME this can throw an error

    this._whereCellId = this._happ.getDvm("where")!.cellData.cell_id;
    this._ludoCellId = this._happ.getDvm("ludotheque")!.cellData.cell_id;


    /** Send Where dnaHash to electron */
    if (IS_ELECTRON) {
      const whereDnaHashB64 = this._happ.getDnaHash("where");
      const ipc = window.require('electron').ipcRenderer;
      let _reply = ipc.sendSync('dnaHash', whereDnaHashB64);
    }

    // /** ProfilesStore */
    // const profilesService = new ProfilesService(whereClient);
    // const profilesStore = new ProfilesStore(profilesService, {
    //   //additionalFields: ['color', 'lang'],
    //   avatarMode: APP_DEV? "avatar-optional" : "avatar-required"
    // })
    // console.log({profilesStore})
    // await profilesStore.fetchAllProfiles()
    // const me = await profilesStore.fetchAgentProfile(profilesStore.myAgentPubKey);
    // console.log({me})
    // if (me) {
    //   this.hasProfile = true;
    // }
    // new ContextProvider(this, profilesStoreContext, profilesStore);

    /** Done */
    this._loaded = true;
  }


  /** */
  onNewProfile(profile: Profile) {
    console.log({profile})
    //this.hasProfile = true;
    this.requestUpdate();
  }


  /** */
  render() {
    console.log("where-app render()"/*, this.hasProfile*/)
    console.log("_canLudotheque:", this._canLudotheque)

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

    if (!this._loaded) {
      console.log("where-app render() => Loading...");
      return html`<span>${msg('Loading')}...</span>`;
    }
    return html`
        ${lang}
        <!-- <profile-prompt style="margin-left:-7px; margin-top:0px;display:block;" @profile-created=${(e:any) => this.onNewProfile(e.detail.profile)}> -->
            ${this._canLudotheque? html`
                  <ludotheque-app id="ludo-controller" examples
                                         .whereCellId=${this._whereCellId}
                                         @import-playset="${this.handleImportRequest}"
                                         @exit="${() => this._canLudotheque = false}"
                  ></ludotheque-app>`
              : html`<where-app                                       
                .ludoCellId=${this._ludoCellId}
                @show-ludotheque="${() => this._canLudotheque = true}"
                    ></where-app>`
            }

        <!-- </profile-prompt> -->
        
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
    const ludoDvm = this._happ.getDvm("ludotheque");
    if(!ludoDvm || !this._whereCellId) {
      console.error("No ludoStore or whereCell in where-app")
      return;
    }
    const startTime = Date.now();
    this.importingDialogElem.open = true;
    await (ludoDvm as LudothequeDvm).ludothequeZvm.exportPlayset(this._currentPlaysetEh!, this._whereCellId!)
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
      "where-app": WhereApp,
      "ludotheque-app": LudothequeApp,
      "mwc-dialog": Dialog,
    };
  }
}
