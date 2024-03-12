import {DevTestNames, setup} from "@ddd-qc/we-utils";
import {createWhereApplet} from "./createWhereApplet";
import {createWhereWeServicesMock} from "./createWhereWeServicesMock";
import {PlaysetEntryType, WHERE_DEFAULT_ROLE_NAME, WhereEntryType} from "@where/elements";
import {AppletServices} from "@lightningrodlabs/we-applet";
import {getAttachableInfo} from "./appletServices/getAttachableInfo";
import {createLudoApplet} from "./createLudoApplet";
import {search} from "./appletServices/search";


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
export async function setupWhereApplet() {
  /** Determine appletView */
  let APPLET_VIEW = "main";
  try {
    APPLET_VIEW = process.env.APPLET_VIEW;
    //console.log(`HAPP_ENV defined by process.ENV: "${happEnv}"`);
  } catch (e) {
  }
  console.log("Where we-applet setup() APPLET_VIEW", APPLET_VIEW);
  switch(APPLET_VIEW) {
    case PlaysetEntryType.Space: return setupWhereEntryView();
    case "main":
    default: return setupWhereMainView();
  }
}

/** */
async function setupWhereMainView() {
  const whereNames: DevTestNames = {
    installed_app_id: "where-we_applet",
    provisionedRoleName: WHERE_DEFAULT_ROLE_NAME,
  }
  const appletServices: AppletServices = {
    creatables: {},
    getAttachableInfo,
    blockTypes: {},
    search,
    bindAsset: async (a, b, c, d,e,f) => {},
  };
  return setup(appletServices, createWhereApplet, whereNames, createWhereWeServicesMock);
}


async function setupLudoApplet() {
  const whereNames: DevTestNames = {
    installed_app_id: "ludotheque-we_applet",
    provisionedRoleName: "rLudotheque",
  }
  const appletServices: AppletServices = {
    creatables: {},
    getAttachableInfo: ()  => {return undefined},
    blockTypes: {},
    search: async (appletClient, searchFilter) => {return []},
    bindAsset: async (a, b, c, d,e,f) => {},
  };
  return setup(appletServices, createLudoApplet, whereNames, createWhereWeServicesMock);
}


/** -- DevTest Entry Views -- */

export async function setupWhereEntryView() {
  // FIXME
}
