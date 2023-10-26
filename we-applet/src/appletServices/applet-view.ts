

// /** space view */
// async (element, hrl: Hrl, context) => {
//   //const cellProxy = await asCellProxy(client, hrl, "where-applet", "rWhere");
//   //const proxy: PlaysetProxy = new PlaysetProxy(cellProxy);
//   const spaceElem = html`
//                   <div>Before where-space custom element</div>
//                   <where-space .currentSpaceEh=${encodeHashToBase64(hrl[1])}></where-space>
//                   <div>After where-space custom element</div>
//               `;
//   render(spaceElem, element);
// }


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

