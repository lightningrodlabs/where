import {AppletInfo, GroupProfile, WeaveServices} from "@theweave/api";
import {createDefaultWeServicesMock, wrapPathInSvg} from "@ddd-qc/we-utils";
import {ActionId, DnaId, EntryId, intoDhtId} from "@ddd-qc/cell-proxy";
import {mdiClipboard} from "@mdi/js";


/** WeaveServices mock used when running the Tool outside of Moss (devtest) */
export async function createWhereWeServicesMock(devtestAppletId: EntryId): Promise<WeaveServices> {

    const fakeGroupId = DnaId.empty(71);

    const myWeServicesMock = await createDefaultWeServicesMock(devtestAppletId)

    myWeServicesMock.groupProfile = async (_groupId): Promise<GroupProfile> => {
        return {
            name: "fakeGroupeName",
            icon_src: "https://media.istockphoto.com/id/1412901513/vector/modern-hand-technology-logo-design.jpg?s=612x612&w=0&k=20&c=zZ4Kh-J2BV_oLfx8Tfd65aUFdTNlCvjmWxLOT4sEeVs=",
        }
    }

    /** appletInfo() */
    myWeServicesMock.appletInfo = async (appletHash): Promise<AppletInfo | undefined> => {
        const appletId = new EntryId(appletHash);
        console.log("WhereWeServicesMock.appletInfo()", appletId.b64);
        if (appletId.b64 == devtestAppletId.b64) {
            return {
                appletBundleId: ActionId.empty(87).b64,
                appletName: "DevTestWeApplet",
                appletIcon: "",
                groupsHashes: [fakeGroupId.hash],
            }
        }
        throw Error("appletInfo() failed. Unknown appletHash");
    };

    /** assetInfo() */
    myWeServicesMock.assets.assetInfo = async (wal) => {
        console.log("WhereWeServicesMock.assetInfo()", wal);
        return {
            appletHash: devtestAppletId.hash,
            assetInfo: {
                icon_src: wrapPathInSvg(mdiClipboard),
                name: "fake:" + intoDhtId(wal.hrl[1]).short,
            }
        }
    }

    /** Done */
    return myWeServicesMock;
}
