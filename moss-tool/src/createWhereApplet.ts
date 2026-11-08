import {AppClient, AppWebsocket, encodeHashToBase64} from "@holochain/client";
import {RenderInfo, WeaveServices} from "@theweave/api";

import {ProfileInfo, WhereApp} from "@where/app";
import {AppletViewInfo, ProfilesApi} from "@ddd-qc/we-utils";
import {destructureCloneId, ExternalAppProxy, HCL} from "@ddd-qc/cell-proxy";


/** */
export async function createWhereApplet(
  renderInfo: RenderInfo,
  weServices: WeaveServices,
): Promise<WhereApp> {

  if (renderInfo.type == "cross-group-view") {
    throw Error("cross-group-view not implemented by Where");
  }

  const appletViewInfo = renderInfo as unknown as AppletViewInfo;

  console.log("createWhereApplet() client", appletViewInfo.appletClient);
  console.log("createWhereApplet() thisAppletId", encodeHashToBase64(appletViewInfo.appletHash));
  const mainAppInfo = await appletViewInfo.appletClient.appInfo();
  if (!mainAppInfo) {
    throw Promise.reject("Missing Main AppInfo");
  }
  console.log("createWhereApplet() mainAppInfo", mainAppInfo);
  const mainAppWs = appletViewInfo.appletClient as AppWebsocket;


  /** Determine profilesAppInfo */
  const profilesClient = appletViewInfo.profilesClient;
  let profilesAppInfo = await profilesClient.client.appInfo();
  if (!profilesAppInfo) {
    throw Promise.reject("Missing Profiles AppInfo");
  }
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
  /** @ddd-qc/we-utils 0.36 ProfilesApi predates @holochain/client 0.21.1, which added
   * sendDirectSignal/grantDirectSignalCapability to AppClient. ExternalAppProxy never calls them. */
  const profilesAppProxy = new ExternalAppProxy(profilesApi as unknown as AppClient, "", 10 * 1000);
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
      appletViewInfo.view,
      profileInfo,
      );

  /** Done */
  return app;
}
