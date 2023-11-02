import {
    decodeHashFromBase64,
    encodeHashToBase64,
    fakeDnaHash, fakeEntryHash
} from "@holochain/client";
import {HoloHashMap} from "@holochain-open-dev/utils";
import {AppletHash, AttachmentName, AttachmentType, WeServices} from "@lightningrodlabs/we-applet";
import {emptyWeServicesMock} from "@ddd-qc/we-utils";
import {HrlWithContext} from "@lightningrodlabs/we-applet/dist/types";





/** */
export async function createWhereWeServicesMock(devtestAppletId: string): Promise<WeServices> {

    const fakeThreadsAppletHash = await fakeEntryHash();
    const fakeThreadsAppletId = encodeHashToBase64(fakeThreadsAppletHash);

    const fakeFilesAppletHash = await fakeEntryHash();
    const fakeFilesAppletId = encodeHashToBase64(fakeFilesAppletHash);

    const fakeGroupId = await fakeDnaHash();

    const myWeServicesMock = emptyWeServicesMock;
    /** appletInfo() */
    myWeServicesMock.appletInfo = async (appletHash) => {
        const appletId = encodeHashToBase64(appletHash);
        console.log("WhereWeServicesMock.appletInfo()", appletId, appletId);
        if (appletId == devtestAppletId) {
            return {
                appletBundleId: await fakeEntryHash(),
                appletName: "DevTestWeApplet",
                groupsIds: [fakeGroupId],
            }
        }
        if (fakeThreadsAppletId == appletId) {
            return {
                appletBundleId: await fakeEntryHash(),
                appletName: "threads-we_applet",
                groupsIds: [fakeGroupId],
            }
        }
        if (fakeFilesAppletId == appletId) {
            return {
                appletBundleId: await fakeEntryHash(),
                appletName: "files-we_applet",
                groupsIds: [fakeGroupId],
            }
        }
        throw Error("appletInfo() failed. Unknown appletHash");
    };
    /** entryInfo() */
    myWeServicesMock.entryInfo = async (hrl) => {
        console.log("WhereWeServicesMock.entryInfo()", hrl);
        return {
            appletHash: decodeHashFromBase64(devtestAppletId),
            entryInfo: {
                icon_src: "",
                name: "fake:" + encodeHashToBase64(hrl[1]),
            }
        }
    }
    /** attachmentTypes */
    const attachmentsMap = new HoloHashMap<AppletHash, Record<AttachmentName, AttachmentType>>();
    const fakeThreadsAttachmentTypes = {
        thread: {
            label: "Thread",
            icon_src: "",
            async create(_attachToHrl): Promise<HrlWithContext> {return {hrl: undefined, context: {},};}
        },
    }
    const fakeFilesAttachmentTypes = {
        file: {
            label: "File",
            icon_src: "",
            async create(_attachToHrl): Promise<HrlWithContext> {
                return {hrl: undefined, context: {},};
            }
        }
    }
    attachmentsMap.set(fakeThreadsAppletHash, fakeThreadsAttachmentTypes);
    attachmentsMap.set(fakeFilesAppletHash, fakeFilesAttachmentTypes);
    myWeServicesMock.attachmentTypes = attachmentsMap;
    /** Done */
    return myWeServicesMock;
}
