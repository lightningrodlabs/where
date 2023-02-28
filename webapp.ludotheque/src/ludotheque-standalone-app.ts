import { state, property } from "lit/decorators.js";
import { html } from "lit";
import {cellContext, HappElement} from "@ddd-qc/lit-happ";
import {DEFAULT_LUDOTHEQUE_DEF, DEFAULT_WHERE_DEF, LudothequeDvm, LudothequePage, WhereDvm} from "@where/elements";
import {msg} from "@lit/localize";
import {ContextProvider} from "@lit-labs/context";
import {AdminWebsocket, AppSignal, AppWebsocket, EntryHashB64, InstalledAppId} from "@holochain/client";
import {setLocale} from "@where/app";

/** Localization */

//setLocale('fr-fr');


/** -- Globals -- */

let HC_APP_PORT: number;
let HC_ADMIN_PORT: number;
/** override installed_app_id when in Electron */
export const IS_ELECTRON = (window.location.port === ""); // No HREF PORT when run by Electron
if (IS_ELECTRON) {
  let APP_ID = 'main-app'
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
  DEFAULT_LUDOTHEQUE_DEF.id = APP_ID + '-' + NETWORK_ID;
} else {
  HC_APP_PORT = Number(process.env.HC_APP_PORT);
  HC_ADMIN_PORT = Number(process.env.HC_ADMIN_PORT);
}


console.log("APP_ID =", DEFAULT_LUDOTHEQUE_DEF.id)
console.log("HC_APP_PORT", HC_APP_PORT);
console.log("HC_ADMIN_PORT", HC_ADMIN_PORT);


/**
 *
 */
export class LudothequeStandaloneApp extends HappElement {

  /** Ctor */
  constructor(port_or_socket?: number | AppWebsocket, appId?: InstalledAppId) {
    super(port_or_socket? port_or_socket : HC_APP_PORT, appId);
  }

  static HVM_DEF = DEFAULT_LUDOTHEQUE_DEF;

  @state() private _loaded = false;


  /** QoL */
  get ludothequeDvm(): LudothequeDvm { return this.hvm.getDvm(LudothequeDvm.DEFAULT_BASE_ROLE_NAME)! as LudothequeDvm }


  private onSignal(signal: AppSignal): void {
    //console.log("<ludotheque-standalone-app> onSignal()", signal);
  }


  /** */
  async hvmConstructed() {
    console.log("hvmConstructed()")
    /** Provide Context */
    new ContextProvider(this, cellContext, this.ludothequeDvm.cell);
    this.conductorAppProxy.addSignalHandler((sig) => this.onSignal(sig), this.ludothequeDvm.hcl.toString());
    /** Authorize all zome calls */
    const adminWs = await AdminWebsocket.connect(`ws://localhost:${HC_ADMIN_PORT}`);
    //console.log({ adminWs });
    await this.hvm.authorizeAllZomeCalls(adminWs);
    console.log("*** Zome call authorization complete");
    /* Send dnaHash to electron */
    if (IS_ELECTRON) {
      const ludoDnaHashB64 = this.ludothequeDvm.cell.dnaHash;
      //const ipc = window.require('electron').ipcRenderer;
      const ipc = window.require('electron').ipcRenderer;
      let _reply = ipc.sendSync('dnaHash', ludoDnaHashB64);
    }
  }


  /** */
  //async perspectiveInitializedOffline(): Promise<void> {}


  /** */
  async perspectiveInitializedOnline(): Promise<void> {
    console.log("<ludo-app>.perspectiveInitializedOnline()");
    this.hvm.probeAll();
    this._loaded = true;
  }


  /** */
  render() {
    console.log("*** <ludotheque-standalone-app> render()", this._loaded)
    if (!this._loaded) {
      return html`<span>${msg('Loading')}...</span>`;
    }
    return html`
      <ludotheque-page examples @import-playset-requested="${this.handleImportRequest}"></ludotheque-page>
    `;
  }


  /** */
  private async handleImportRequest(e: CustomEvent<EntryHashB64>) {
    console.log("handleImportRequest() : " + JSON.stringify(e.detail))
  }


  /** */
  static get scopedElements() {
    return {
      "ludotheque-page": LudothequePage,
    };
  }
}
