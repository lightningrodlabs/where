import {AppWebsocket, encodeHashToBase64} from "@holochain/client";
import {RenderInfo, WeaveServices} from "@theweave/api";

import {AppletViewInfo} from "@ddd-qc/we-utils";
import {LudothequeStandaloneApp} from "ludotheque";


/** */
export async function createLudoApplet(
  renderInfo: RenderInfo,
  _weServices: WeaveServices,
): Promise<LudothequeStandaloneApp> {

  if (renderInfo.type == "cross-group-view") {
    throw Error("cross-group-view not implemented by Where");
  }

  const appletViewInfo = renderInfo as unknown as AppletViewInfo;

  console.log("createLudoApplet() client", appletViewInfo.appletClient);
  console.log("createLudoApplet() thisAppletId", encodeHashToBase64(appletViewInfo.appletHash));
  const mainAppInfo = await appletViewInfo.appletClient.appInfo();
  if (!mainAppInfo) {
    throw Promise.reject("Missing Main AppInfo");
  }
  console.log("createLudoApplet() mainAppInfo", mainAppInfo);
  const mainAppWs = appletViewInfo.appletClient as AppWebsocket;
  /** Create LudothequeStandaloneApp */
  const app = new LudothequeStandaloneApp(
      mainAppWs,
      mainAppInfo.installed_app_id,
      );
  /** Done */
  return app;
}
