import {
    decodeHashFromBase64,
    encodeHashToBase64, EntryHash,
    fakeDnaHash, fakeEntryHash
} from "@holochain/client";
import {AppletInfo, GroupProfile, WeaveServices} from "@theweave/api";
import {createDefaultWeServicesMock, wrapPathInSvg} from "@ddd-qc/we-utils";
import {mdiClipboard, mdiFileOutline, mdiInformation} from "@mdi/js";
import {EntryId} from "@ddd-qc/cell-proxy";





/** */
export async function createWhereWeServicesMock(devtestAppletId: EntryId): Promise<WeaveServices> {

    const fakeThreadsAppletHash = await fakeEntryHash();
    const fakeThreadsAppletId = encodeHashToBase64(fakeThreadsAppletHash);

    const fakeFilesAppletHash = await fakeEntryHash();
    const fakeFilesAppletId = encodeHashToBase64(fakeFilesAppletHash);

    const fakeGroupHash = await fakeDnaHash();

    //const myWeServicesMock = emptyWeServicesMock;
    const myWeServicesMock = await createDefaultWeServicesMock(devtestAppletId)

    myWeServicesMock.groupProfile = async (groupId): Promise<GroupProfile> => {
        return {
            name: "fakeGroupeName",
            icon_src: "https://media.istockphoto.com/id/1412901513/vector/modern-hand-technology-logo-design.jpg?s=612x612&w=0&k=20&c=zZ4Kh-J2BV_oLfx8Tfd65aUFdTNlCvjmWxLOT4sEeVs=",
        }
    }

    const appletBundleId = "fakeAppletBundleId"; // await fakeEntryHash(),

    /** appletInfo() */
    myWeServicesMock.appletInfo = async (appletHash: EntryHash): Promise<AppletInfo | undefined> => {
        const appletId = encodeHashToBase64(appletHash);
        console.log("WhereWeServicesMock.appletInfo()", appletId, appletId);
        if (devtestAppletId.equals(appletId)) {
            return {
                appletBundleId,
                appletName: "DevTestWeApplet",
                appletIcon: "",
                groupsHashes: [fakeGroupHash],
            }
        }
        if (fakeThreadsAppletId == appletId) {
            return {
                appletBundleId,
                appletName: "hThreadsWeApplet",
                appletIcon: "",
                groupsHashes: [fakeGroupHash],
            }
        }
        if (fakeFilesAppletId == appletId) {
            return {
                appletBundleId,
                appletName: "files-we_applet",
                appletIcon: "",
                groupsHashes: [fakeGroupHash],
            }
        }
        throw Error("appletInfo() failed. Unknown appletHash");
    };
    /** entryInfo() */
    myWeServicesMock.assets.assetInfo = async (wal) => {
        console.log("WhereWeServicesMock.entryInfo()", wal);
        return {
            appletHash: devtestAppletId.hash,
            assetInfo: {
                icon_src: wrapPathInSvg(mdiClipboard),
                name: "fake:" + encodeHashToBase64(wal.hrl[1]),
            }
        }
    }
    // FIXME
    // /** attachmentTypes */
    // const attachmentsMap = new HoloHashMap<AppletHash, Record<AttachmentName, AttachmentType>>();
    // const fakeThreadsAttachmentTypes = {
    //     thread: {
    //         label: "Thread",
    //         icon_src: wrapPathInSvg(mdiInformation),
    //         async create(_attachToHrl): Promise<HrlWithContext> {return {hrl: undefined, context: {},};}
    //     },
    // }
    // const fakeFilesAttachmentTypes = {
    //     file: {
    //         label: "File",
    //         icon_src: wrapPathInSvg(mdiFileOutline),
    //         async create(_attachToHrl): Promise<HrlWithContext> {
    //             return {hrl: undefined, context: {},};
    //         }
    //     }
    // }
    // attachmentsMap.set(fakeThreadsAppletHash, fakeThreadsAttachmentTypes);
    // attachmentsMap.set(fakeFilesAppletHash, fakeFilesAttachmentTypes);
    // myWeServicesMock.attachmentTypes = attachmentsMap;
    /** Done */
    return myWeServicesMock;
}
