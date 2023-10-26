import {getEntryInfo} from "./getEntryInfo";
import {AppletServices} from "@lightningrodlabs/we-applet";
import {DevTestNames} from "@ddd-qc/we-utils";


/** */
export const whereNames: DevTestNames = {
    installed_app_id: "where-applet",
    provisionedRoleName: "rWhere",
}


/** */
export const appletServices: AppletServices = {
    attachmentTypes: async (_appletClient) => ({}),
    getEntryInfo,
    blockTypes: {},
    search: async (appletClient, searchFilter) => {return []},
};
