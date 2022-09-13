import { ContextProvider } from '@lit-labs/context';
import { serializeHash } from '@holochain-open-dev/utils';
import { state } from "lit/decorators.js";

import {
  ludothequeContext,
  LudothequeController,
  LudothequeStore,
  setLocale,
} from "@where/elements";

import { HolochainClient } from "@holochain-open-dev/cell-client";
import { ScopedElementsMixin } from "@open-wc/scoped-elements";
import { LitElement, html } from "lit";
import { AppWebsocket, InstalledCell } from "@holochain/client";

/** Localization */

setLocale('fr-fr');

/** ------- */

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


export class LudothequeApp extends ScopedElementsMixin(LitElement) {

  @state() loaded = false;

  /**
   *
   */
  async firstUpdated() {
    const wsUrl = `ws://localhost:${HC_PORT}`
    const installed_app_id = NETWORK_ID == null || NETWORK_ID == ''
      ? APP_ID
      : APP_ID + '-' + NETWORK_ID;
    console.log({installed_app_id})

    const appWebsocket = await AppWebsocket.connect(wsUrl);
    console.log({appWebsocket})
    const hcClient = new HolochainClient(appWebsocket)
    console.log({hcClient})
    const appInfo = await hcClient.appWebsocket.appInfo({installed_app_id});

    /** Get Cells by role by hand */
    let ludo_cell: InstalledCell | undefined = undefined;
    for (const cell_data of appInfo.cell_data) {
      if (cell_data.role_id == "ludotheque") {
        ludo_cell = cell_data;
      }
    }
    if (!ludo_cell) {
      alert("Ludotheque Cell not found in happ")
      return;
    }

    // Send dnaHash to electron
    if (IS_ELECTRON) {
      const ipc = window.require('electron').ipcRenderer;
      const ludoDnaHashB64 = serializeHash(ludo_cell.cell_id[0])
      let _reply = ipc.sendSync('dnaHash', ludoDnaHashB64);
    }

    new ContextProvider(this, ludothequeContext, new LudothequeStore(hcClient, appInfo, ludo_cell.cell_id));

    this.loaded = true;
  }


  render() {
    console.log("ludotheque-app render()")
    if (!this.loaded) {
      return html`<span>Loading...</span>`;
    }
    return html`
         <ludotheque-controller id="controller" examples @import-playset="${this.handleImportRequest}"></ludotheque-controller>
    `;
  }

  private async handleImportRequest(e: any) {
    console.log("handleImportRequest() : " + JSON.stringify(e.detail))
  }

  static get scopedElements() {
    return {
      "ludotheque-controller": LudothequeController,
    };
  }
}
