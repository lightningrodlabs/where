import {
    decodeHashFromBase64,
    encodeHashToBase64,
    fakeDnaHash, fakeEntryHash
} from "@holochain/client";
import {HoloHashMap} from "@holochain-open-dev/utils";
import {AppletHash, AttachmentName, AttachmentType, WeServices} from "@lightningrodlabs/we-applet";
import {emptyWeServicesMock} from "./common/mocks/weServicesMock";
import {HrlWithContext} from "@lightningrodlabs/we-applet/dist/types";


/** */
export async function createWhereWeServicesMock(devtestAppletId: string): Promise<WeServices> {
    const myWeServicesMock = emptyWeServicesMock;
    /** appletInfo() */
    myWeServicesMock.appletInfo = async (appletId) => {
        const appletIdB64 = encodeHashToBase64(appletId);
        console.log("WhereWeServicesMock.appletInfo()", appletIdB64, appletIdB64);
        if (appletIdB64 == devtestAppletId) {
            return {
                appletBundleId: await fakeEntryHash(),
                appletName: "DevTestWeApplet",
                groupsIds: [await fakeDnaHash()],
            }
        }
        return {
            appletBundleId: await fakeEntryHash(),
            appletName: "FakeThreadsApplet",
            groupsIds: [await fakeDnaHash()],
        };
    };
    /** entryInfo() */
    myWeServicesMock.entryInfo = async (hrl) => {
        console.log("WhereWeServicesMock.entryInfo()", hrl);
        return {
            appletHash: decodeHashFromBase64(devtestAppletId),
            entryInfo: {
                icon_src: "",
                name: "demo:" + encodeHashToBase64(hrl[1]),
            }
        }
    }
    /** attachmentTypes */
    const attachmentsMap = new HoloHashMap<AppletHash, Record<AttachmentName, AttachmentType>>();
    const fakeThreadsAppletId = await fakeEntryHash();
    const fakeThreadsAttachmentTypes = {
        thread: {
            label: "Thread",
            icon_src: "",
            async create(_attachToHrl): Promise<HrlWithContext> {return {hrl: undefined, context: {},};}
        }
    }
    attachmentsMap.set(fakeThreadsAppletId, fakeThreadsAttachmentTypes);
    myWeServicesMock.attachmentTypes = attachmentsMap;
    /** Done */
    return myWeServicesMock;
}
