import {WeClient, WeServices} from "@lightningrodlabs/we-applet";
import {setBasePath, getBasePath} from '@shoelace-style/shoelace/dist/utilities/base-path.js';
import {delay, HappElement} from "@ddd-qc/lit-happ";
import {appletServices} from "../appletServices/appletServices";
import {setupDevtest} from "./setupDevtest";
import {AppAgentClient, EntryHash} from "@holochain/client";
import {ProfilesClient} from "@holochain-open-dev/profiles";


export type CreateAppletFn = (
    client: AppAgentClient,
    thisAppletHash: EntryHash,
    profilesClient: ProfilesClient,
    weServices: WeServices
) => Promise<HappElement>;


export type CreateWeServicesMockFn = (devtestAppletId: string) => Promise<WeServices>;

export interface DevTestNames {
    installed_app_id: string,
    provisionedRoleName: string,
}



/** */
export async function setup(createApplet: CreateAppletFn, devtestNames: DevTestNames, createWeServicesMock: CreateWeServicesMockFn): Promise<HappElement> {
    let BUILD_MODE = "prod";
    try {
        BUILD_MODE = process.env.BUILD_MODE;
    } catch (e) {
        console.log(`BUILD_MODE env variable not set. Defaulting to "prod".`)
    }
    console.log("BUILD_MODE", BUILD_MODE);

    if (BUILD_MODE == "devtest") {
        return setupDevtest(createApplet, devtestNames, createWeServicesMock);
    } else {
        return setupProd(createApplet);
    }
}


/** */
export async function setupProd(createApplet: CreateAppletFn): Promise<HappElement> {
    console.log("setup()");

    setBasePath('./');
    console.log("shoelace basePath", getBasePath());

    console.log("WeClient.connect()...", WeClient);
    const weClient = await WeClient.connect(appletServices);
    console.log("weClient", weClient);
    if (weClient.renderInfo.type != "applet-view") {
        console.error("Setup called for non 'applet-view' type")
        return;
    }

    /** Delay because of We 'CellDisabled' bug at startup race condition */
    await delay(1000);

    const renderInfo = weClient.renderInfo as any;
    const applet = await createApplet(renderInfo.appletClient, renderInfo.appletHash, renderInfo.profilesClient, weClient);
    console.log("applet", applet);
    return applet;
}
