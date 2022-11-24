import {LitElement, html, css} from "lit";
import { state, property } from "lit/decorators.js";
import {ContextProvider} from "@lit-labs/context";
//import { msg } from '@lit/localize';
import { ScopedElementsMixin } from "@open-wc/scoped-elements";
import {CellId, InstalledCell, AppWebsocket} from "@holochain/client";
import {CellClient, HolochainClient} from "@holochain-open-dev/cell-client";

import {InstalledAppletInfo} from "@lightningrodlabs/we-applet";
import {
  LudothequeController,
  ludothequeContext,
  LudothequeStore,
  //Inventory,
  //setLocale,
} from "@where/elements";


/** ------- */

const delay = (ms:number) => new Promise(r => setTimeout(r, ms))

const APP_DEV = process.env.APP_DEV? process.env.APP_DEV : false;


/** */
export class LudothequeApplet extends ScopedElementsMixin(LitElement) {
  @property()
  appWebsocket!: AppWebsocket;

  // @property()
  // profilesStore!: ProfilesStore;

  @property()
  appletAppInfo!: InstalledAppletInfo[];

  @state() loaded = false;

  //_lang?: string


  // get importingDialogElem() : Dialog {
  //   return this.shadowRoot!.getElementById("importing-dialog") as Dialog;
  // }
  //
  // get langDialogElem() : Dialog {
  //   return this.shadowRoot!.getElementById("lang-dialog") as Dialog;
  // }


  // /** */
  // async updated() {
  //   if (!APP_DEV && this.loaded && !this._lang) {
  //     this.langDialogElem.open = true;
  //   }
  // }


  /** */
  async firstUpdated() {
    /** Get AppInfo */
    //console.log({appletAppInfo: this.appletAppInfo})
    const appInfo = this.appletAppInfo[0].installedAppInfo

    /** Get Cells by role by hand */
    let ludo_cell: InstalledCell | undefined = undefined;
    for (const cell_data of appInfo.cell_data) {
      if (cell_data.role_id == "rLudotheque") {
        ludo_cell = cell_data;
      }
    }
    if (!ludo_cell) {
      alert("Ludotheque Cell not found in happ")
      return;
    }

    /** Setup Ludotheque client & store */
    const hcClient = new HolochainClient(this.appWebsocket)
    console.log({hcClient})

    new ContextProvider(this, ludothequeContext, new LudothequeStore(hcClient, appInfo, ludo_cell.cell_id));

    /** */
    this.loaded = true;
  }


  /** */
  render() {
    console.log("ludotheque-applet render()")
    if (!this.loaded) {
      return html`<span>Loading...</span>`;
    }
    return html`
         <ludotheque-controller id="controller" examples @import-playset-requested="${this.handleImportRequest}"></ludotheque-controller>
    `;
  }


  /** */
  private async handleImportRequest(e: any) {
    console.log("handleImportRequest() : " + JSON.stringify(e.detail))
  }


  /** */
  static get scopedElements() {
    return {
      "ludotheque-controller": LudothequeController,
    };
  }

}
