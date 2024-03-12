import {
  AppAgentWebsocket, encodeHashToBase64, InstalledAppId, ZomeName,
} from "@holochain/client";
//import { msg } from "@lit/localize";

import {
  RenderInfo,
  WeServices,
} from "@lightningrodlabs/we-applet";


import {ProfileInfo, WhereApp} from "@where/app";
import {AppletViewInfo, ProfilesApi} from "@ddd-qc/we-utils";
import {destructureCloneId, ExternalAppProxy, HCL} from "@ddd-qc/cell-proxy";
import {AppProxy, BaseRoleName, CloneId} from "@ddd-qc/lit-happ";


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


  /** Determine profilesAppInfo */
  const profilesClient = appletViewInfo.profilesClient;
  let profilesAppInfo = await profilesClient.client.appInfo();
  console.log("createWhereApplet() profilesAppInfo", profilesAppInfo, profilesClient.roleName);

  /** Check if roleName is actually a cloneId */
  let maybeCloneId = undefined;
  let baseRoleName = profilesClient.roleName;
  const maybeBaseRoleName = destructureCloneId(profilesClient.roleName);
  if (maybeBaseRoleName) {
    baseRoleName = maybeBaseRoleName[0];
    maybeCloneId = profilesClient.roleName;
  }
  /** Determine profilesCellProxy */
  const hcl = new HCL(profilesAppInfo.installed_app_id, baseRoleName, maybeCloneId);
  const profilesApi = new ProfilesApi(profilesClient);
  const profilesAppProxy = new ExternalAppProxy(profilesApi, 10 * 1000);
  await profilesAppProxy.fetchCells(profilesAppInfo.installed_app_id, baseRoleName);
  const profilesCellProxy = await profilesAppProxy.createCellProxy(hcl);
  console.log("createWhereApplet() profilesCellProxy", profilesCellProxy);

  const profileInfo: ProfileInfo = {
    profilesAppId: profilesAppInfo.installed_app_id,
    profilesBaseRoleName: baseRoleName,
    profilesCloneId: maybeCloneId,
    profilesZomeName: profilesClient.zomeName,
    profilesProxy: profilesAppProxy,
  }

  /** Create WhereApp */
  const app = new WhereApp(
      mainAppWs,
      undefined,
      false,
      mainAppInfo.installed_app_id,
      weServices,
      encodeHashToBase64(appletViewInfo.appletHash),
      appletViewInfo.view, //encodeHashToBase64(appletViewInfo.appletHash),
      profileInfo,
      );

  /** Done */
  return app;
}
