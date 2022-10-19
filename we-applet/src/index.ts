import {
  AdminWebsocket,
  AppWebsocket,
} from "@holochain/client";
import {
  WeApplet,
  AppletRenderers,
  WeServices,
  InstalledAppletInfo,
} from "@lightningrodlabs/we-applet";

import { WhereApplet } from "./where-applet";
import { LudothequeApplet } from "./ludotheque-applet";


const whereApplet: WeApplet = {
  async appletRenderers(
    appWebsocket: AppWebsocket,
    adminWebsocket: AdminWebsocket,
    weServices: WeServices,
    appletAppInfo: InstalledAppletInfo[]
  ): Promise<AppletRenderers> {
    return {
      full(element: HTMLElement, registry: CustomElementRegistry) {
        registry.define("where-applet", WhereApplet);
        element.innerHTML = `
            <link href="https://fonts.googleapis.com/css?family=Material+Icons&display=block" rel="stylesheet">
            <where-applet></where-applet>
        `;
        const appletElement = element.querySelector("where-applet") as any;
        appletElement.appWebsocket =  appWebsocket;
        appletElement.profilesStore = weServices.profilesStore;
        appletElement.appletAppInfo = appletAppInfo;
      },
      blocks: [],
    };
  },
};



const ludoApplet: WeApplet = {
  async appletRenderers(
    appWebsocket: AppWebsocket,
    adminWebsocket: AdminWebsocket,
    weServices: WeServices,
    appletAppInfo: InstalledAppletInfo[]
  ): Promise<AppletRenderers> {
    return {
      full(element: HTMLElement, registry: CustomElementRegistry) {
        registry.define("ludotheque-applet", LudothequeApplet);
        element.innerHTML = `
            <link href="https://fonts.googleapis.com/css?family=Material+Icons&display=block" rel="stylesheet">
            <ludotheque-applet></ludotheque-applet>
        `;
        const appletElement = element.querySelector("ludotheque-applet") as any;

        appletElement.appWebsocket =  appWebsocket;
        appletElement.appletAppInfo = appletAppInfo;
      },
      blocks: [],
    };
  },
};


export default whereApplet;
