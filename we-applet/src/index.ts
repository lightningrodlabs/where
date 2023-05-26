import {
  AdminWebsocket,
  AppAgentClient,
  AppAgentWebsocket,
  encodeHashToBase64,
  EntryHash,
} from "@holochain/client";
import {WeApplet, WeServices, AppletViews, CrossAppletViews, Hrl} from "@lightningrodlabs/we-applet";
//import {LudothequeStandaloneApp} from "ludotheque";
import {WhereApp} from "@where/app";
import {render, html} from "lit";

import "@holochain-open-dev/profiles/dist/elements/profiles-context.js";
import {ProfilesClient} from "@holochain-open-dev/profiles";
import {PlaysetProxy} from "@where/elements/dist/bindings/playset.proxy";
import {asCellProxy} from "./we-utils";

import "@where/elements";


/** */
function appletViews(
  client: AppAgentClient,
  _weAppletId: EntryHash,
  profilesClient: ProfilesClient,
  weServices: WeServices
): AppletViews {
  return {
    main: (element) => {
      const agentWs = client as AppAgentWebsocket;
      console.log("whereApplet.main()", client, agentWs.appWebsocket)
      /** Link to Font */
      const font = document.createElement('link');
      font.href = "https://fonts.googleapis.com/css?family=Material+Icons&display=block";
      font.rel = "stylesheet";
      element.appendChild(font);
      /** <where-app> */
      //registry.define("where-app", WhereApp);
      const app = new WhereApp(agentWs.appWebsocket, undefined, true, "where-applet");
      element.appendChild(app);
    },
    blocks: {},
    entries: {
      rWhere: {
        playset_integrity: {
          space: {
            info: async (hrl: Hrl) => {
              const cellProxy = await asCellProxy(client, hrl, "where-applet", "rWhere");
              const proxy: PlaysetProxy = new PlaysetProxy(cellProxy);
              const space = await proxy.getSpace(encodeHashToBase64(hrl[1]));
              if (!space) {
                return;
              }
              return {
                icon_src: "",
                name: space.name,
              };
            },
            view: async (element, hrl: Hrl, context) => {
              //const cellProxy = await asCellProxy(client, hrl, "where-applet", "rWhere");
              //const proxy: PlaysetProxy = new PlaysetProxy(cellProxy);
              const spaceElem = html`
                  <div>Before where-space custom element</div>
                  <where-space .currentSpaceEh=${encodeHashToBase64(hrl[1])}></where-space>
                  <div>After where-space custom element</div>
              `;
              render(spaceElem, element);
            },
          },
        }
      }
    },
  };
}


/** */
function crossAppletViews(
  applets: ReadonlyMap<EntryHash, {profilesClient: ProfilesClient; appletClient: AppAgentClient}>, // Segmented by groupId
  weServices: WeServices
): CrossAppletViews {
  return {
    main: (element) => {},
    blocks: {},
  };
}



/** */
const whereApplet: WeApplet = {
  appletViews,
  crossAppletViews,
  attachmentTypes: async (appletClient: AppAgentClient) => {return {} },
  search: async (appletClient: AppAgentClient, filter: string) => {
    return []
  },
};



// /** */
// const whereApplet: WeApplet = {
//   async appletRenderers(
//     appWebsocket: AppWebsocket,
//     adminWebsocket: AdminWebsocket,
//     weServices: WeServices,
//     appletAppInfo: AppletInfo[]
//   ): Promise<AppletRenderers> {
//     return {
//       full(element: HTMLElement, registry: CustomElementRegistry) {
//         console.log("whereApplet.full()", appWebsocket.client.socket.url)
//         /** Link to Font */
//         const font = document.createElement('link');
//         font.href = "https://fonts.googleapis.com/css?family=Material+Icons&display=block";
//         font.rel = "stylesheet";
//         element.appendChild(font);
//         /** <where-app> */
//         registry.define("where-app", WhereApp);
//         const ludoApp = new WhereApp(appWebsocket, adminWebsocket, "where-applet");
//         element.appendChild(ludoApp);
//       },
//       blocks: [],
//     };
//   },
// };

//
// /** */
// const ludoApplet: WeApplet = {
//   async appletRenderers(
//     appWebsocket: AppWebsocket,
//     adminWebsocket: AdminWebsocket,
//     weServices: WeServices,
//     appletAppInfo: AppletInfo[]
//   ): Promise<AppletRenderers> {
//     return {
//       full(element: HTMLElement, registry: CustomElementRegistry) {
//         console.log("ludoApplet.full()", appWebsocket.client.socket.url)
//         /** Link to Font */
//         const font = document.createElement('link');
//         font.href = "https://fonts.googleapis.com/css?family=Material+Icons&display=block";
//         font.rel = "stylesheet";
//         element.appendChild(font);
//         /** <ludotheque-app> */
//         registry.define("ludotheque-app", LudothequeStandaloneApp);
//         const ludoApp = new LudothequeStandaloneApp(appWebsocket, "ludotheque-applet");
//         element.appendChild(ludoApp);
//       },
//       blocks: [],
//     };
//   },
// };


//export default ludoApplet;
export default whereApplet;
