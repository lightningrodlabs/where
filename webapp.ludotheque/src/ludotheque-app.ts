import { state } from "lit/decorators.js";
import {setLocale, ludothequeHappDef} from "@where/elements";
import { ScopedElementsMixin } from "@open-wc/scoped-elements";
import { LitElement, html } from "lit";
import { ConductorAppProxy, HappViewModel} from "@ddd-qc/dna-client";

/** Localization */

setLocale('fr-fr');


/** -- Globals -- */

let HC_PORT: any = process.env.HC_PORT;

/** override installed_app_id when in Electron */
export const IS_ELECTRON = (window.location.port === ""); // No HREF PORT when run by Electron
if (IS_ELECTRON) {
  let APP_ID = 'main-app'
  let searchParams = new URLSearchParams(window.location.search);
  HC_PORT = searchParams.get("PORT");
  const NETWORK_ID = searchParams.get("UID");
  console.log(NETWORK_ID)
  ludothequeHappDef.id = APP_ID + '-' + NETWORK_ID;
}

console.log({APP_ID: ludothequeHappDef.id})
console.log({HC_PORT})


/**
 *
 */
export class LudothequeApp extends ScopedElementsMixin(LitElement) {

  @state() private _loaded = false;

  private _conductorAppProxy!: ConductorAppProxy;
  private _happ!: HappViewModel;


  /** */
  async firstUpdated() {
    this._conductorAppProxy = await ConductorAppProxy.new(Number(process.env.HC_PORT));
    this._happ = await this._conductorAppProxy.newHappViewModel(this, ludothequeHappDef); // WARN this can throw an error

    /* Send dnaHash to electron */
    if (IS_ELECTRON) {
      const ludoDnaHashB64 = this._happ.getDnaHash("ludotheque");
      const ipc = window.require('electron').ipcRenderer;
      let _reply = ipc.sendSync('dnaHash', ludoDnaHashB64);
    }

    this._loaded = true;
  }


  /** */
  render() {
    console.log("ludotheque-app render()")
    if (!this._loaded) {
      return html`<span>Loading...</span>`;
    }
    return html`
      <ludotheque-app id="controller" examples @import-playset="${this.handleImportRequest}"></ludotheque-app>
    `;
  }


  /** */
  private async handleImportRequest(e: any) {
    console.log("handleImportRequest() : " + JSON.stringify(e.detail))
  }


  /** */
  static get scopedElements() {
    return {
      "ludotheque-app": LudothequeApp,
    };
  }
}
