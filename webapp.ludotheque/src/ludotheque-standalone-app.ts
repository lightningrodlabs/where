import { state } from "lit/decorators.js";
import {setLocale, ludothequeHappDef} from "@where/elements";
import { ScopedElementsMixin } from "@open-wc/scoped-elements";
import { LitElement, html } from "lit";
import {cellContext, ConductorAppProxy, HappViewModel} from "@ddd-qc/dna-client";
import {LudothequePage} from "where-mvvm";
import {msg} from "@lit/localize";
import {ContextProvider} from "@lit-labs/context";

/** Localization */

setLocale('fr-fr');


/** -- Globals -- */

let HC_APP_PORT: any = process.env.HC_APP_PORT;

/** override installed_app_id when in Electron */
export const IS_ELECTRON = (window.location.port === ""); // No HREF PORT when run by Electron
if (IS_ELECTRON) {
  let APP_ID = 'main-app'
  let searchParams = new URLSearchParams(window.location.search);
  HC_APP_PORT = searchParams.get("PORT");
  const NETWORK_ID = searchParams.get("UID");
  console.log(NETWORK_ID)
  ludothequeHappDef.id = APP_ID + '-' + NETWORK_ID;
}

console.log({APP_ID: ludothequeHappDef.id})
console.log({HC_APP_PORT})


/**
 *
 */
export class LudothequeStandaloneApp extends ScopedElementsMixin(LitElement) {

  @state() private _loaded = false;

  private _conductorAppProxy!: ConductorAppProxy;
  private _happ!: HappViewModel;

  /** */
  async firstUpdated() {
    this._conductorAppProxy = await ConductorAppProxy.new(Number(HC_APP_PORT));
    this._happ = await this._conductorAppProxy.newHappViewModel(this, ludothequeHappDef); // WARN this can throw an error
    new ContextProvider(this, cellContext, this._happ.getDvm("rLudotheque")!.cellDef)
    /* Send dnaHash to electron */
    if (IS_ELECTRON) {
      const ludoDnaHashB64 = this._happ.getDnaHash("rLudotheque");
      const ipc = window.require('electron').ipcRenderer;
      let _reply = ipc.sendSync('dnaHash', ludoDnaHashB64);
    }
    /* Done */
    this._loaded = true;
  }


  /** */
  render() {
    console.log("ludotheque-standalone-app render()", this._loaded)
    if (!this._loaded) {
      return html`<span>${msg('Loading')}...</span>`;
    }
    return html`
      <ludotheque-page examples @import-playset-requested="${this.handleImportRequest}"></ludotheque-page>
    `;
  }


  /** */
  private async handleImportRequest(e: any) {
    console.log("handleImportRequest() : " + JSON.stringify(e.detail))
  }


  /** */
  static get scopedElements() {
    return {
      "ludotheque-page": LudothequePage,
    };
  }
}
