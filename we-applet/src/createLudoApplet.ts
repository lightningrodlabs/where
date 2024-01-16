import {
  AppAgentWebsocket, encodeHashToBase64,
} from "@holochain/client";
//import { msg } from "@lit/localize";

import {
  RenderInfo,
  WeServices,
} from "@lightningrodlabs/we-applet";


import {AppletViewInfo} from "@ddd-qc/we-utils";
import {LudothequeStandaloneApp} from "ludotheque";


/** */
export async function createLudoApplet(
  renderInfo: RenderInfo,
  weServices: WeServices,
): Promise<LudothequeStandaloneApp> {

  if (renderInfo.type =="cross-applet-view") {
    throw Error("cross-applet-view not implemented by Where");
  }

  const appletViewInfo = renderInfo as unknown as AppletViewInfo;

  console.log("createLudoApplet() client", appletViewInfo.appletClient);
  console.log("createLudoApplet() thisAppletId", encodeHashToBase64(appletViewInfo.appletHash));
  const mainAppInfo = await appletViewInfo.appletClient.appInfo();
  console.log("createLudoApplet() mainAppInfo", mainAppInfo);
  const mainAppAgentWs = appletViewInfo.appletClient as AppAgentWebsocket;
  const mainAppWs = mainAppAgentWs.appWebsocket;
  /** Create WhereApp */
  const app = new LudothequeStandaloneApp(
      mainAppWs,
      mainAppInfo.installed_app_id,
      );
  /** Done */
  return app;
}
