import {getEntryInfo} from "./getEntryInfo";
import {AppletServices} from "@lightningrodlabs/we-applet";
import {DevTestNames} from "@ddd-qc/we-utils";
import {WHERE_DEFAULT_ROLE_NAME} from "@where/elements";


/** */
export const whereNames: DevTestNames = {
    installed_app_id: "where-applet",
    provisionedRoleName: WHERE_DEFAULT_ROLE_NAME,
}


/** */
export const appletServices: AppletServices = {
    attachmentTypes: async (_appletClient) => ({}),
    getEntryInfo,
    blockTypes: {},
    search: async (appletClient, searchFilter) => {return []},
};
