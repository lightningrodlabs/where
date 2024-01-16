import {
  AppAgentWebsocket, encodeHashToBase64,
} from "@holochain/client";
//import { msg } from "@lit/localize";

import {
  RenderInfo,
  WeServices,
} from "@lightningrodlabs/we-applet";


import {WhereApp} from "@where/app";
import {AppletViewInfo} from "@ddd-qc/we-utils";


/** */
export async function createWhereApplet(
  renderInfo: RenderInfo,
  weServices: WeServices,
): Promise<WhereApp> {

  if (renderInfo.type =="cross-applet-view") {
    throw Error("cross-applet-view not implemented by Where");
  }

  const appletViewInfo = renderInfo as unknown as AppletViewInfo;

  console.log("createWhereApplet() client", appletViewInfo.appletClient);
  console.log("createWhereApplet() thisAppletId", encodeHashToBase64(appletViewInfo.appletHash));
  const mainAppInfo = await appletViewInfo.appletClient.appInfo();
  console.log("createWhereApplet() mainAppInfo", mainAppInfo);
  const mainAppAgentWs = appletViewInfo.appletClient as AppAgentWebsocket;
  const mainAppWs = mainAppAgentWs.appWebsocket;
  /** Create WhereApp */
  const app = new WhereApp(
      mainAppWs,
      undefined,
      false,
      mainAppInfo.installed_app_id,
      weServices,
      appletViewInfo.view,
      //encodeHashToBase64(appletViewInfo.appletHash),
      );
  /** Done */
  return app;
}