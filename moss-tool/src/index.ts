import {DevTestNames, setup, createDefaultWeServicesMock} from "@ddd-qc/we-utils";
import {createWhereApplet} from "./createWhereApplet";
import {createWhereWeServicesMock} from "./createWhereWeServicesMock";
import {PlaysetEntryType, WHERE_DEFAULT_ROLE_NAME} from "@where/elements";
import {AppletServices, initializeHotReload} from "@theweave/api";
import {getAssetInfo} from "./appletServices/getAssetInfo";
import {createLudoApplet} from "./createLudoApplet";
import {search} from "./appletServices/search";
import {LitElement} from "lit";


export default setupWhereTool;


/** Names used when running the Tool outside of Moss (devtest) */
export const whereDevtestNames: DevTestNames = {
  installed_app_id: "where-moss-tool",
  provisionedRoleName: WHERE_DEFAULT_ROLE_NAME,
}

export const ludoDevtestNames: DevTestNames = {
  installed_app_id: "ludotheque-moss-tool",
  provisionedRoleName: "rLudotheque",
}


/** */
async function setupWhereTool(): Promise<LitElement> {
  try {
    return await setupWhereApplet();
  } catch(e) {
    console.log("setupWhereApplet() failed", e);
    return await setupLudoApplet();
  }
}

/** */
export async function setupWhereApplet(): Promise<LitElement> {
  /** When Moss serves this Tool from the vite dev server (weave.dev.config.ts with
   *  source.type "localhost") the iframe is on http://localhost:<uiPort> instead of
   *  Moss's own applet origin, so the bridge WeaveClient connects over has to be
   *  pulled in explicitly first. Without it, we-utils' setup() awaits an
   *  'applet-iframe-ready' event that never fires and the Tool renders nothing,
   *  with no error. Dev only: a packaged webhapp neither needs nor has it. */
  if ((import.meta as any).env?.DEV) {
    try {
      await initializeHotReload();
    } catch (e) {
      console.warn("Tool hot-reload not initialized. Expected unless running under `npm run start:moss`.", e);
    }
  }
  /** Determine appletView */
  let APPLET_VIEW = "main";
  try {
    APPLET_VIEW = process.env.APPLET_VIEW!;
  } catch (e) {
  }
  console.log("Where Moss Tool setup() APPLET_VIEW", APPLET_VIEW);
  switch(APPLET_VIEW) {
    case PlaysetEntryType.Space: return setupWhereEntryView();
    case "main":
    default: return setupWhereMainView();
  }
}

/** */
async function setupWhereMainView(): Promise<LitElement> {
  const appletServices: AppletServices = {
    creatables: {},
    getAssetInfo,
    search,
  };
  return setup(appletServices, createWhereApplet, whereDevtestNames, createWhereWeServicesMock);
}


/** */
async function setupLudoApplet(): Promise<LitElement> {
  const appletServices: AppletServices = {
    creatables: {},
    getAssetInfo: async () => {return undefined},
    search: async (_appletClient, _appletHash, _weServices, _searchFilter) => {return []},
  };
  return setup(appletServices, createLudoApplet, ludoDevtestNames, createDefaultWeServicesMock);
}


/** -- DevTest Entry Views -- */

export async function setupWhereEntryView(): Promise<LitElement> {
  throw new Error("Where Moss Tool: devtest entry view not implemented");
}
