import {
    AppAgentClient,
    decodeHashFromBase64,
} from "@holochain/client";
import {AppletHash, WAL} from "@lightningrodlabs/we-applet/dist/types";
import {WeServices} from "@lightningrodlabs/we-applet/dist/api";
import {asCellProxy} from "@ddd-qc/we-utils";
import {PlaysetProxy, SpaceOutput, WHERE_DEFAULT_ROLE_NAME} from "@where/elements";


/**
 * Returns spaces that matchs the searchFilters
 */
export async function search(appletClient: AppAgentClient, appletHash: AppletHash, weServices: WeServices, searchFilter: string): Promise<Array<WAL>> {
    console.log("Where/we-applet/search():", searchFilter);
    const searchLC = searchFilter.toLowerCase();

    /** Get Cell proxy */
    const mainAppInfo = await appletClient.appInfo();
    const cellProxy = await asCellProxy(
        appletClient,
        undefined,
        mainAppInfo.installed_app_id,
        WHERE_DEFAULT_ROLE_NAME);
    console.log("Where/we-applet/search(): cellProxy", cellProxy);
    const playsetProxy/*: FilesProxy */ = new PlaysetProxy(cellProxy);
    const dnaHash = decodeHashFromBase64(playsetProxy.cell.dnaHash);

    /** Search spaces */
    const spaces = await playsetProxy.getSpaces();
    console.log("Where/we-applet/search(): spaces", spaces.length);
    const matching: SpaceOutput[] = spaces
        .filter((spaceOutput) => spaceOutput.content.name.toLowerCase().includes(searchLC))
    console.log("Where/we-applet/search(): matching", matching);

    /** Transform results into WAL */
    const results: Array<WAL> = matching
        .map((spaceOutput) => { return {
            hrl: [dnaHash, decodeHashFromBase64(spaceOutput.hash)],
            context: {
                subjectName: spaceOutput.content.name,
                subjectType: "Space",
                //subjectAuthor:,
            },
        }})

    /** Done */
    return results;
}
