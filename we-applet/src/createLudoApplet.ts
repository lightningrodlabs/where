import {
  AppWebsocket,
  encodeHashToBase64,
} from "@holochain/client";
//import { msg } from "@lit/localize";

import {
  RenderInfo,
  WeaveServices,
} from "@theweave/api";


import {AppletViewInfo} from "@ddd-qc/we-utils";
import {LudothequeStandaloneApp} from "ludotheque";


/** */
export async function createLudoApplet(
  renderInfo: RenderInfo,
  weServices: WeaveServices,
): Promise<LudothequeStandaloneApp> {

  if (renderInfo.type =="cross-group-view") {
    throw Error("cross-applet-view not implemented by Where");
  }

  const appletViewInfo = renderInfo as unknown as AppletViewInfo;

  console.log("createLudoApplet() client", appletViewInfo.appletClient);
  console.log("createLudoApplet() thisAppletId", encodeHashToBase64(appletViewInfo.appletHash));
  const mainAppInfo = await appletViewInfo.appletClient.appInfo();
  console.log("createLudoApplet() mainAppInfo", mainAppInfo);
  const mainAppWs = appletViewInfo.appletClient as AppWebsocket;
  //const mainAppWs = mainAppAgentWs.appWebsocket;
  /** Create WhereApp */
  const app = new LudothequeStandaloneApp(
      mainAppWs,
    undefined,
      mainAppInfo.installed_app_id,
      );
  /** Done */
  return app;
}
