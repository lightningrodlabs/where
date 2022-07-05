import {
  AdminWebsocket,
  AppWebsocket,
  InstalledAppInfo,
  InstalledCell,
} from "@holochain/client";
import {
  WeApplet,
  AppletRenderers,
  WeServices,
} from "@lightningrodlabs/we-applet";

import { WhereApplet } from "./where-applet";

const whereApplet: WeApplet = {
  async appletRenderers(
    appWebsocket: AppWebsocket,
    adminWebsocket: AdminWebsocket,
    weServices: WeServices,
    appletAppInfo: InstalledAppInfo
  ): Promise<AppletRenderers> {
    return {
      full(element: HTMLElement, registry: CustomElementRegistry) {
        registry.define("where-applet", WhereApplet);
        element.innerHTML = `<where-applet></where-applet>`;
        const appletElement = element.querySelector("where-applet") as any;

        appletElement.appWebsocket =  appWebsocket;
        appletElement.profilesStore = weServices.profilesStore;
        appletElement.appletAppInfo = appletAppInfo;
      },
      blocks: [],
    };
  },
};

export default whereApplet;
