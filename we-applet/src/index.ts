import {AdminWebsocket, AppAgentClient, AppAgentWebsocket, AppWebsocket, CellType, EntryHash} from "@holochain/client";
import {WeApplet, WeServices, AppletInfo, AppletViews, CrossAppletViews} from "@lightningrodlabs/we-applet";
//import {LudothequeStandaloneApp} from "ludotheque";
import {WhereApp} from "@where/app";
import {render, html} from "lit";

import "@holochain-open-dev/profiles/dist/elements/profiles-context.js";
import {ProfilesClient} from "@holochain-open-dev/profiles";


/** */
function appletViews(
  client: AppAgentClient,
  _appletId: EntryHash,
  profilesClient: ProfilesClient,
  weServices: WeServices
): AppletViews {
  return {
    main: (element) => {
      // const sillyTemplate =  html`
      //       <we-services-context .services=${weServices}>
      //         <profiles-context .store=${new ProfilesStore(profilesClient)}>
      //           <applet-main></applet-main>
      //       </profiles-context>
      //     </we-services-context>
      //     `;
      // render(sillyTemplate, element);

      const agentWs = client as AppAgentWebsocket;
      console.log("whereApplet..main()", client)
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
    entries: {},
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
