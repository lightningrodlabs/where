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
): Promise<AssetInfo | undefined> {
    if (!recordInfo) {
        throw new Error(`Where Moss Tool/getAssetInfo(): Missing recordInfo`);
    }
    if (recordInfo.roleName != WHERE_DEFAULT_ROLE_NAME) {
        throw new Error(`Where Moss Tool: Unknown role name '${recordInfo.roleName}'.`);
    }
    if (recordInfo.integrityZomeName != "playset_integrity") {
        throw new Error(`Where Moss Tool: Unknown zome '${recordInfo.integrityZomeName}'.`);
    }

    const mainAppInfo = await appletClient.appInfo();
    if (!mainAppInfo) {
        throw Promise.reject("Missing Main AppInfo");
    }
    const pEntryType = pascal(recordInfo.entryType);

    switch (pEntryType) {
        case PlaysetEntryType.Space: {
            console.log("Where Moss Tool: space info for", wal);
            const cellProxy = await asCellProxy(
                appletClient,
                undefined,
                mainAppInfo.installed_app_id,
                WHERE_DEFAULT_ROLE_NAME,
            );
            const proxy: PlaysetProxy = new PlaysetProxy(cellProxy);
            const space = await proxy.getSpace({input: encodeHashToBase64(wal.hrl[1]), local: true});
            if (!space) {
                return undefined;
            }
            return {
                icon_src: wrapPathInSvg(mdiMapbox),
                name: space.name,
            };
        }
        default:
            throw new Error(`Where Moss Tool: Unknown entry type ${recordInfo.entryType}.`);
    }
}
