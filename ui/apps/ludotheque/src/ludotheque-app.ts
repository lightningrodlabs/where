import {contextProvided, ContextProvider} from "@holochain-open-dev/context";
import {EntryHashB64, serializeHash} from '@holochain-open-dev/core-types';
import { state } from "lit/decorators.js";
import {
  ludothequeContext,
  LudothequeController,
  LudothequeStore,
  whereContext,
} from "@where/elements";

import { HolochainClient } from "@holochain-open-dev/cell-client";
import { ScopedElementsMixin } from "@open-wc/scoped-elements";
import { LitElement, html } from "lit";

let APP_ID = 'ludotheque'
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
  @state()
  loaded = false;

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
    const cellClient = hcClient.forCell(hcClient.appInfo.cell_data[0]);
    console.log({cellClient})

    // Send dnaHash to electron
    if (IS_ELECTRON) {
      const ipc = window.require('electron').ipcRenderer;
      const dnaHashB64 = serializeHash(cellClient.cellId[0])
      let _reply = ipc.sendSync('dnaHash', dnaHashB64);
    }


    new ContextProvider(this, ludothequeContext, new LudothequeStore(cellClient));

    this.loaded = true;
  }


  render() {
    console.log("ludotheque-app render()")
    if (!this.loaded) {
      return html`<span>Loading...</span>`;
    }
    return html`
         <ludotheque-controller id="controller" examples></ludotheque-controller>
    `;
  }

  static get scopedElements() {
    return {
      "ludotheque-controller": LudothequeController,
    };
  }
}
