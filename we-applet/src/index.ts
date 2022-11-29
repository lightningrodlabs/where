import {
  AdminWebsocket,
  AppWebsocket,
} from "@holochain/client";
import {
  WeApplet,
  AppletRenderers,
  WeServices,
  InstalledAppletInfo,
} from "@lightningrodlabs/we-applet";

//import { WhereApplet } from "./where-applet";
//import { LudothequeApplet } from "./ludotheque-applet";
import {LudothequeStandaloneApp} from "ludo-app";



// const whereApplet: WeApplet = {
//   async appletRenderers(
//     appWebsocket: AppWebsocket,
//     adminWebsocket: AdminWebsocket,
//     weServices: WeServices,
//     appletAppInfo: InstalledAppletInfo[]
//   ): Promise<AppletRenderers> {
//     return {
//       full(element: HTMLElement, registry: CustomElementRegistry) {
//         registry.define("where-applet", WhereApplet);
//         element.innerHTML = `
//             <link href="https://fonts.googleapis.com/css?family=Material+Icons&display=block" rel="stylesheet">
//             <where-applet style="flex: 1; display: flex;"></where-applet>
//         `;
//         const appletElement = element.querySelector("where-applet") as any;
//         appletElement.appWebsocket =  appWebsocket;
//         appletElement.profilesStore = weServices.profilesStore;
//         appletElement.appletAppInfo = appletAppInfo;
//       },
//       blocks: [],
//     };
//   },
// };



const ludoApplet: WeApplet = {
  async appletRenderers(
    appWebsocket: AppWebsocket,
    adminWebsocket: AdminWebsocket,
    weServices: WeServices,
    appletAppInfo: InstalledAppletInfo[]
  ): Promise<AppletRenderers> {
    return {
      full(element: HTMLElement, registry: CustomElementRegistry) {
        console.log("full()", appWebsocket.client.socket.url)

        const font = document.createElement('link');
        font.href = "https://fonts.googleapis.com/css?family=Material+Icons&display=block";
        font.rel = "stylesheet";
        element.appendChild(font);


        registry.define("ludotheque-app", LudothequeStandaloneApp);
        const ludoApp = new LudothequeStandaloneApp(appWebsocket, "ludotheque-applet");
        element.appendChild(ludoApp);
      },
      blocks: [],
    };
  },
};

export default ludoApplet;
//export default whereApplet;
