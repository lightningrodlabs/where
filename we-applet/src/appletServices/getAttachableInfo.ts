import {asCellProxy, wrapPathInSvg} from "@ddd-qc/we-utils";
import {encodeHashToBase64} from "@holochain/client";
import {PlaysetEntryType, PlaysetProxy, WHERE_DEFAULT_ROLE_NAME} from "@where/elements";
import {pascal} from "@ddd-qc/cell-proxy";
import {mdiMapbox} from "@mdi/js";


/** */
export async function getAttachableInfo(
    appletClient,
    roleName,
    integrityZomeName,
    entryType,
    hrl
) {
    if (roleName != WHERE_DEFAULT_ROLE_NAME) {
        throw new Error(`Where/we-applet: Unknown role name '${roleName}'.`);
    }
    if (integrityZomeName != "playset_integrity") {
        throw new Error(`Where/we-applet: Unknown zome '${integrityZomeName}'.`);
    }

    const mainAppInfo = await appletClient.appInfo();
    const pEntryType = pascal(entryType);

    switch (pEntryType) {
        case PlaysetEntryType.Space: {
            console.log("Where/we-applet: space info for", hrl);
            const cellProxy = await asCellProxy(
                appletClient,
                undefined, //hrl[0],
                mainAppInfo.installed_app_id, //"ThreadsWeApplet",
                WHERE_DEFAULT_ROLE_NAME,
            );
            const proxy: PlaysetProxy = new PlaysetProxy(cellProxy);
            const space = await proxy.getSpace(encodeHashToBase64(hrl[1]));
            if (!space) {
                return;
            }
            return {
                icon_src: wrapPathInSvg(mdiMapbox),
                name: space.name,
            };
        }
        default:
            throw new Error(`Files/we-applet: Unknown entry type ${entryType}.`);
    }
}




