import {
  AppAgentClient,
  AppAgentWebsocket,
  EntryHash
} from "@holochain/client";
//import { msg } from "@lit/localize";

import {
  WeServices,
} from "@lightningrodlabs/we-applet";

import "@lightningrodlabs/we-applet/dist/elements/we-client-context.js";
import "@lightningrodlabs/we-applet/dist/elements/hrl-link.js";

import {WhereApp} from "@where/app";
import {ProfilesClient} from "@holochain-open-dev/profiles";


/** */
export async function createWhereApplet(
  client: AppAgentClient,
  thisAppletHash: EntryHash,
  _profilesClient: ProfilesClient,
  weServices: WeServices,
): Promise<WhereApp> {
  console.log("createWhereApplet() client", client);
  console.log("createWhereApplet() thisAppletId", thisAppletHash);
  const mainAppInfo = await client.appInfo();
  console.log("createWhereApplet() mainAppInfo", mainAppInfo);
  const mainAppAgentWs = client as AppAgentWebsocket;
  const mainAppWs = mainAppAgentWs.appWebsocket;
  /** Create WhereApp */
  const app = new WhereApp(
      mainAppWs,
      undefined,
      false,
      mainAppInfo.installed_app_id,
      weServices, thisAppletHash);
  /** Done */
  return app;
}
