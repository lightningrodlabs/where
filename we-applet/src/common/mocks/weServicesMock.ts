import {
  ActionHash,
  decodeHashFromBase64, encodeHashToBase64,
  EntryHash, fakeActionHash,
  fakeDnaHash
} from "@holochain/client";
import {AppletInfo, EntryLocationAndInfo, Hrl, WeNotification, WeServices} from "@lightningrodlabs/we-applet";
import {HrlWithContext} from "@lightningrodlabs/we-applet/dist/types";


export const emptyWeServicesMock: WeServices = {
  //attachmentTypes: new HoloHashMap<AppletHash, Record<AttachmentName, AttachmentType>>(),
  attachmentTypes: undefined,
  openAppletMain: (appletHash: EntryHash): Promise<void> => {throw new Error("openAppletMain() is not implemented on WeServicesMock.");},
  openAppletBlock: (appletHash, block: string, context: any): Promise<void> => {throw new Error("openAppletBlock() is not implemented on WeServicesMock.");},
  openCrossAppletMain: (appletBundleId: ActionHash): Promise<void> => {throw new Error("openCrossAppletMain() is not implemented on WeServicesMock.");},
  openCrossAppletBlock: (appletBundleId: ActionHash, block: string, context: any): Promise<void> => {throw new Error("openCrossAppletBlock() is not implemented on WeServicesMock.");},
  openHrl: (hrl: Hrl, context: any): Promise<void> => {throw new Error("openHrl() is not implemented on WeServicesMock.");},
  groupProfile: (groupId): Promise<any> => {throw new Error("groupProfile() is not implemented on WeServicesMock.");},
  appletInfo: (appletHash): Promise<AppletInfo | undefined> => {throw new Error("appletInfo() is not implemented on WeServicesMock.");},
  entryInfo: (hrl: Hrl): Promise<EntryLocationAndInfo | undefined> => {throw new Error("entryInfo() is not implemented on WeServicesMock.");},
  hrlToClipboard: (hrl: HrlWithContext): Promise<void> => {throw new Error("hrlToClipboard() is not implemented on WeServicesMock.");},
  search: (searchFilter: string): Promise<any> => {throw new Error("search() is not implemented on WeServicesMock.");},
  userSelectHrl: (): Promise<HrlWithContext | undefined> => {throw new Error("userSelectHrl() is not implemented on WeServicesMock.");},
  notifyWe: (notifications: Array<WeNotification>): Promise<any> => {throw new Error("notifyWe() is not implemented on WeServicesMock.");}
};


/** Create custom WeServices Mock */
export async function createDefaultWeServicesMock(devtestAppletId: string): Promise<WeServices> {
  console.log("createDefaultWeServicesMock() devtestAppletId", devtestAppletId);
  const weServicesMock = emptyWeServicesMock;
  weServicesMock.appletInfo = async (appletId) => {
    const appletIdB64 = encodeHashToBase64(appletId);
    console.log("DefaultWeServicesMock.appletInfo()", appletIdB64, devtestAppletId);
    if (appletIdB64 == devtestAppletId) {
      const appletInfo: AppletInfo = {
        appletBundleId: await fakeActionHash(),
        appletName: "DevTestWeApplet",
        groupsIds: [await fakeDnaHash()],
      };
      return appletInfo;
    }
    return undefined;
  };
  weServicesMock.entryInfo = async (hrl) => {
    console.log("DefaultWeServicesMock.entryInfo()", hrl);
    return {
      appletHash: decodeHashFromBase64(devtestAppletId),
      entryInfo: {
        icon_src: "",
        name: "demo:" + encodeHashToBase64(hrl[1]),
      }
    } as EntryLocationAndInfo;
  }
  return weServicesMock;
}
