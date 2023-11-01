import {DevTestNames, setup} from "@ddd-qc/we-utils";
import {createWhereApplet} from "./createWhereApplet";
import {createWhereWeServicesMock} from "./createWhereWeServicesMock";
import {WHERE_DEFAULT_ROLE_NAME} from "@where/elements";
import {AppletServices} from "@lightningrodlabs/we-applet";
import {getEntryInfo} from "./appletServices/getEntryInfo";
import {createLudoApplet} from "./createLudoApplet";


export default setupApplet;


async function setupApplet() {
  try {
    return await setupWhereApplet();
  } catch(e) {
    console.log("setupWhereApplet() failed", e);
    return await setupLudoApplet();
  }
}


/** */
async function setupWhereApplet() {
  const whereNames: DevTestNames = {
    installed_app_id: "where-applet",
    provisionedRoleName: WHERE_DEFAULT_ROLE_NAME,
  }
  const appletServices: AppletServices = {
    attachmentTypes: async (_appletClient) => ({}),
    getEntryInfo,
    blockTypes: {},
    search: async (appletClient, searchFilter) => {return []},
  };
  return setup(appletServices, createWhereApplet, whereNames, createWhereWeServicesMock);
}


async function setupLudoApplet() {
  const whereNames: DevTestNames = {
    installed_app_id: "ludotheque-applet",
    provisionedRoleName: "rLudotheque",
  }
  const appletServices: AppletServices = {
    attachmentTypes: async (_appletClient) => ({}),
    getEntryInfo: ()  => {return undefined},
    blockTypes: {},
    search: async (appletClient, searchFilter) => {return []},
  };
  return setup(appletServices, createLudoApplet, whereNames, createWhereWeServicesMock);
}
