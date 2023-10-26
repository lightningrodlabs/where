import {asCellProxy} from "../common/we-utils";
import {encodeHashToBase64} from "@holochain/client";
import {whereNames} from "./appletServices";
import {PlaysetProxy} from "@where/elements/dist/bindings/playset.proxy";


/** */
export async function getEntryInfo(
    appletClient,
    roleName,
    integrityZomeName,
    entryType,
    hrl
) {
    if (roleName != whereNames.provisionedRoleName) {
        throw new Error(`Where/we-applet: Unknown role name '${roleName}'.`);
    }
    if (integrityZomeName != "playset_integrity") {
        throw new Error(`Where/we-applet: Unknown zome '${integrityZomeName}'.`);
    }

    const mainAppInfo = await appletClient.appInfo();

    switch (entryType) {
        case "space": {
            console.log("Where/we-applet: space info for", hrl);
            const cellProxy = await asCellProxy(
                appletClient,
                undefined, //hrl[0],
                mainAppInfo.installed_app_id, //"ThreadsWeApplet",
                whereNames.provisionedRoleName,
            );
            const proxy: PlaysetProxy = new PlaysetProxy(cellProxy);
            const space = await proxy.getSpace(encodeHashToBase64(hrl[1]));
            if (!space) {
                return;
            }
            return {
                icon_src: "",
                name: space.name,
            };
        }
        default:
            throw new Error(`Files/we-applet: Unknown entry type ${entryType}.`);
    }
}




