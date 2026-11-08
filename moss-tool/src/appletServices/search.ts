import {AppClient, decodeHashFromBase64} from "@holochain/client";
import {AppletHash, WAL, WeaveServices} from "@theweave/api";
import {asCellProxy} from "@ddd-qc/we-utils";
import {PlaysetProxy, SpaceOutput, WHERE_DEFAULT_ROLE_NAME} from "@where/elements";


/**
 * Returns spaces that match the searchFilter
 */
export async function search(appletClient: AppClient, _appletHash: AppletHash, _weServices: WeaveServices, searchFilter: string): Promise<Array<WAL>> {
    console.log("Where Moss Tool/search():", searchFilter);
    const searchLC = searchFilter.toLowerCase();

    /** Get Cell proxy */
    const mainAppInfo = await appletClient.appInfo();
    if (!mainAppInfo) {
        throw Promise.reject("Missing Main AppInfo");
    }
    const cellProxy = await asCellProxy(
        appletClient,
        undefined,
        mainAppInfo.installed_app_id,
        WHERE_DEFAULT_ROLE_NAME);
    console.log("Where Moss Tool/search(): cellProxy", cellProxy);
    const playsetProxy = new PlaysetProxy(cellProxy);
    const dnaHash = playsetProxy.cell.address.dnaId.hash;

    /** Search spaces */
    const spaces = await playsetProxy.getSpaces({input: null, local: true});
    console.log("Where Moss Tool/search(): spaces", spaces.length);
    const matching: SpaceOutput[] = spaces
        .filter((spaceOutput) => spaceOutput.content.name.toLowerCase().includes(searchLC))
    console.log("Where Moss Tool/search(): matching", matching);

    /** Transform results into WALs */
    const results: Array<WAL> = matching
        .map((spaceOutput) => { return {
            hrl: [dnaHash, decodeHashFromBase64(spaceOutput.hash)],
            context: {
                subjectName: spaceOutput.content.name,
                subjectType: "Space",
            },
        }})

    /** Done */
    return results;
}
