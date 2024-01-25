import {
    decodeHashFromBase64,
    encodeHashToBase64,
    fakeDnaHash, fakeEntryHash
} from "@holochain/client";
import {HoloHashMap} from "@holochain-open-dev/utils";
import {AppletHash, AttachmentName, AttachmentType, GroupProfile, WeServices} from "@lightningrodlabs/we-applet";
import {createDefaultWeServicesMock, emptyWeServicesMock, wrapPathInSvg} from "@ddd-qc/we-utils";
import {HrlWithContext} from "@lightningrodlabs/we-applet/dist/types";
import {mdiClipboard, mdiFileOutline, mdiInformation} from "@mdi/js";





/** */
export async function createWhereWeServicesMock(devtestAppletId: string): Promise<WeServices> {

    const fakeThreadsAppletHash = await fakeEntryHash();
    const fakeThreadsAppletId = encodeHashToBase64(fakeThreadsAppletHash);

    const fakeFilesAppletHash = await fakeEntryHash();
    const fakeFilesAppletId = encodeHashToBase64(fakeFilesAppletHash);

    const fakeGroupId = await fakeDnaHash();

    //const myWeServicesMock = emptyWeServicesMock;
    const myWeServicesMock = await createDefaultWeServicesMock(devtestAppletId)

    myWeServicesMock.groupProfile = async (groupId): Promise<GroupProfile> => {
        return {
            name: "fakeGroupeName",
            logo_src: "https://media.istockphoto.com/id/1412901513/vector/modern-hand-technology-logo-design.jpg?s=612x612&w=0&k=20&c=zZ4Kh-J2BV_oLfx8Tfd65aUFdTNlCvjmWxLOT4sEeVs=",
        }
    }

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
                appletName: "hThreadsWeApplet",
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
    myWeServicesMock.attachableInfo = async (hrlc) => {
        console.log("WhereWeServicesMock.entryInfo()", hrlc);
        return {
            appletHash: decodeHashFromBase64(devtestAppletId),
            attachableInfo: {
                icon_src: wrapPathInSvg(mdiClipboard),
                name: "fake:" + encodeHashToBase64(hrlc.hrl[1]),
            }
        }
    }
    /** attachmentTypes */
    const attachmentsMap = new HoloHashMap<AppletHash, Record<AttachmentName, AttachmentType>>();
    const fakeThreadsAttachmentTypes = {
        thread: {
            label: "Thread",
            icon_src: wrapPathInSvg(mdiInformation),
            async create(_attachToHrl): Promise<HrlWithContext> {return {hrl: undefined, context: {},};}
        },
    }
    const fakeFilesAttachmentTypes = {
        file: {
            label: "File",
            icon_src: wrapPathInSvg(mdiFileOutline),
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
