import {AdminWebsocket, AppWebsocket} from "@holochain/client";
import {WeApplet, AppletRenderers, WeServices, AppletInfo} from "@lightningrodlabs/we-applet";
import {LudothequeStandaloneApp} from "@where/ludo-app";
import {WhereApp} from "@where/app";


/** */
const whereApplet: WeApplet = {
  async appletRenderers(
    appWebsocket: AppWebsocket,
    adminWebsocket: AdminWebsocket,
    weServices: WeServices,
    appletAppInfo: AppletInfo[]
  ): Promise<AppletRenderers> {
    return {
      full(element: HTMLElement, registry: CustomElementRegistry) {
        console.log("whereApplet.full()", appWebsocket.client.socket.url)
        /** Link to Font */
        const font = document.createElement('link');
        font.href = "https://fonts.googleapis.com/css?family=Material+Icons&display=block";
        font.rel = "stylesheet";
        element.appendChild(font);
        /** <where-app> */
        registry.define("where-app", WhereApp);
        const ludoApp = new WhereApp(appWebsocket, "where-applet");
        element.appendChild(ludoApp);
      },
      blocks: [],
    };
  },
};


/** */
const ludoApplet: WeApplet = {
  async appletRenderers(
    appWebsocket: AppWebsocket,
    adminWebsocket: AdminWebsocket,
    weServices: WeServices,
    appletAppInfo: AppletInfo[]
  ): Promise<AppletRenderers> {
    return {
      full(element: HTMLElement, registry: CustomElementRegistry) {
        console.log("full()", appWebsocket.client.socket.url)
        /** Link to Font */
        const font = document.createElement('link');
        font.href = "https://fonts.googleapis.com/css?family=Material+Icons&display=block";
        font.rel = "stylesheet";
        element.appendChild(font);
        /** <ludotheque-app> */
        registry.define("ludotheque-app", LudothequeStandaloneApp);
        const ludoApp = new LudothequeStandaloneApp(appWebsocket, "ludotheque-applet");
        element.appendChild(ludoApp);
      },
      blocks: [],
    };
  },
};


//export default ludoApplet;
export default whereApplet;
