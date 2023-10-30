import {
  AppAgentClient,
  AppAgentWebsocket, encodeHashToBase64,
  EntryHash
} from "@holochain/client";
//import { msg } from "@lit/localize";

import {
  RenderInfo,
  WeServices,
} from "@lightningrodlabs/we-applet";

import "@lightningrodlabs/we-applet/dist/elements/we-client-context.js";
import "@lightningrodlabs/we-applet/dist/elements/hrl-link.js";

import {WhereApp} from "@where/app";
import {AppletViewInfo} from "@ddd-qc/we-utils";


/** */
export async function createWhereApplet(
  renderInfo: RenderInfo,
  weServices: WeServices,
): Promise<WhereApp> {

  if (renderInfo.type =="cross-applet-view") {
    throw Error("cross-applet-view not implemented by Files");
  }

  const appletViewInfo = renderInfo as AppletViewInfo;

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
      encodeHashToBase64(appletViewInfo.appletHash),
      );
  /** Done */
  return app;
}
