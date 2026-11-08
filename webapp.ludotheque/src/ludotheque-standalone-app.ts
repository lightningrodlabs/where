import {customElement, state} from "lit/decorators.js";
import {html} from "lit";
import {cellContext, HappElement, HcConnectionOptions} from "@ddd-qc/lit-happ";
import {DEFAULT_LUDOTHEQUE_DEF, LudothequeDvm} from "@where/elements";
import {msg} from "@lit/localize";
import {ContextProvider} from "@lit/context";
import {AppWebsocket, EntryHashB64, InstalledAppId, Signal} from "@holochain/client";


/** -- Globals -- */

let HC_APP_PORT: number;
let HC_ADMIN_PORT: number;

try {
  HC_APP_PORT = Number(process.env.HC_APP_PORT);
  HC_ADMIN_PORT = Number(process.env.HC_ADMIN_PORT);
} catch (e) {
  console.log("HC_APP_PORT not defined")
}


console.log("LUDOTHEQUE APP_ID =", DEFAULT_LUDOTHEQUE_DEF.id)
console.log("      HC_APP_PORT =", HC_APP_PORT);
console.log("    HC_ADMIN_PORT =", HC_ADMIN_PORT);


/**
 *
 */
@customElement("ludotheque-standalone-app")
export class LudothequeStandaloneApp extends HappElement {

  /** Ctor */
  constructor(appWs?: AppWebsocket, appId?: InstalledAppId) {
    const adminUrl = HC_ADMIN_PORT ? new URL(`ws://localhost:${HC_ADMIN_PORT}`) : undefined;
    const options: HcConnectionOptions = appWs
      ? {socket: appWs, timeout: 20 * 1000}
      : {port: HC_APP_PORT, timeout: 20 * 1000, adminUrl};
    super(options, undefined, appId);
  }

  static override HVM_DEF = DEFAULT_LUDOTHEQUE_DEF;

  @state() private _loaded = false;


  /** QoL */
  get ludothequeDvm(): LudothequeDvm { return this.hvm.getDvm(LudothequeDvm.DEFAULT_BASE_ROLE_NAME)! as LudothequeDvm }


  private onSignal(signal: Signal): void {
    //console.log("<ludotheque-standalone-app> onSignal()", signal);
  }


  /** */
  override async hvmConstructed() {
    console.log("hvmConstructed()")
    /** Provide Context */
    new ContextProvider(this, cellContext, this.ludothequeDvm.cell);
    this.appProxy.addSignalHandler((sig) => this.onSignal(sig), this.ludothequeDvm.hcl.toString());
  }


  /** */
  override async perspectiveInitializedFromLocal(): Promise<void> {
    console.log("<ludo-app>.perspectiveInitializedFromLocal()");
    this._loaded = true;
  }


  /** */
  override async perspectiveInitializedFromNetwork(): Promise<void> {
    console.log("<ludo-app>.perspectiveInitializedFromNetwork()");
    await this.hvm.initializePerspectiveFromNetwork();
  }


  /** */
  override render() {
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

}
