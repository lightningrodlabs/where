import { contextProvider, ContextProvider } from "@lit-labs/context";
import {EntryHashB64, serializeHash} from '@holochain-open-dev/core-types';
import { property, state } from "lit/decorators.js";
import {
  WhereController,
  WhereStore,
  whereContext, LudothequeController, ludothequeContext, LudothequeStore,
  Inventory,
} from "@where/elements";
import {
  Profile,
  ProfilePrompt,
  ProfilesService,
  ProfilesStore,
  profilesStoreContext,
} from "@holochain-open-dev/profiles";
import { CellClient, HolochainClient} from "@holochain-open-dev/cell-client";
import { ScopedElementsMixin } from "@open-wc/scoped-elements";
import { LitElement, html } from "lit";
import {Dialog} from "@scoped-elements/material-web";
import {AppWebsocket, CellId, InstalledCell} from "@holochain/client";

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


export class WhereApplet extends ScopedElementsMixin(LitElement) {

  @contextProvider({ context: profilesStoreContext })
  @property()
  profilesStore!: ProfilesStore;

  @state() _canLudotheque: boolean = false;

  _currentPlaysetEh: null | EntryHashB64 = null;

  _ludoStore: LudothequeStore | null = null;
  _whereStore: WhereStore | null = null;

  _inventory: Inventory | null = null;

  _whereCellId: CellId | null = null;
  _ludoCellId: CellId | null = null;

  get importingDialogElem() : Dialog {
    return this.shadowRoot!.getElementById("importing-dialog") as Dialog;
  }




  /**
   *
   */
  render() {
    console.log("_canLudotheque: " + this._canLudotheque)

    return html`
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
