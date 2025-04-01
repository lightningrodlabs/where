import {asCellProxy, wrapPathInSvg} from "@ddd-qc/we-utils";
import {AppClient, encodeHashToBase64} from "@holochain/client";
import {PlaysetEntryType, PlaysetProxy, WHERE_DEFAULT_ROLE_NAME} from "@where/elements";
import {pascal} from "@ddd-qc/cell-proxy";
import {mdiMapbox} from "@mdi/js";
import {AssetInfo, RecordInfo, WAL} from "@theweave/api";


/** */
export async function getAssetInfo(
  appletClient: AppClient,
  wal: WAL,
  recordInfo?: RecordInfo,
): Promise<AssetInfo> {
    console.log("Where/we-applet: getAssetInfo", recordInfo);
    if (!recordInfo) {
        throw new Error(`Where/we-applet: Missing recordInfo.`);
    }
    if (recordInfo.roleName != WHERE_DEFAULT_ROLE_NAME) {
        throw new Error(`Where/we-applet: Unknown role name '${recordInfo.roleName}'.`);
    }
    if (recordInfo.integrityZomeName != "playset_integrity") {
        throw new Error(`Where/we-applet: Unknown zome '${recordInfo.integrityZomeName}'.`);
    }

    const mainAppInfo = await appletClient.appInfo();
    const pEntryType = pascal(recordInfo.entryType);

    switch (pEntryType) {
        case PlaysetEntryType.Space: {
            console.debug("Where/we-applet: space info for", wal);
            const cellProxy = await asCellProxy(
                appletClient,
                undefined, //hrl[0],
                mainAppInfo.installed_app_id, //"ThreadsWeApplet",
                WHERE_DEFAULT_ROLE_NAME,
            );
            const proxy: PlaysetProxy = new PlaysetProxy(cellProxy);
            const spaceEh = encodeHashToBase64(wal.hrl[1]);
            const space = await proxy.getSpace(spaceEh);
            if (!space) {
                console.debug("Where/we-applet: space NOT FOUND", spaceEh);
                return;
            }
            const icon_src = wrapPathInSvg(mdiMapbox);
            //console.debug("Where/we-applet: space FOUND", spaceEh, space.name, icon_src);
            const info: AssetInfo = {icon_src, name: space.name};
            console.debug("Where/we-applet: space info FOUND", info);
            return info;
        }
        break;
        default:
            throw new Error(`Files/we-applet: Unknown entry type ${recordInfo.entryType}.`);
    }
}




