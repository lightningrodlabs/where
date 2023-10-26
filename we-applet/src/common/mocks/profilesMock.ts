import {AgentPubKey} from "@holochain/client/lib/types";
import {AppInfo, AppInfoRequest, AppInfoResponse, fakeAgentPubKey, fakeDnaHash} from "@holochain/client";
import {CellInfo} from "@holochain/client/lib/api/admin/types";
import {ConductorAppProxy} from "@ddd-qc/cell-proxy";


/** */
async function generateFakeProfilesAppInfo(myKey: AgentPubKey): Promise<AppInfo> {
    const fakeProfilesDnaCellInfo: CellInfo = {
        provisioned: {
            name: "profiles",
            cell_id: [await fakeDnaHash(), myKey],
            dna_modifiers: {
                network_seed: "profiles-mock-ns",
                properties: new Uint8Array(),
                origin_time: 1640995200000000,
                quantum_time: {secs: 1, nanos: 0},
            }
        }
    }
    /** AppInfo */
    return {
        agent_pub_key: myKey,
        installed_app_id: "profiles",
        cell_info: {
            profiles: [fakeProfilesDnaCellInfo],
        },
        status: {
            running: null,
        }
    };
}


/** */
export class ConductorProxyProfilesMock extends ConductorAppProxy {
    constructor(public readonly myKey: AgentPubKey) {
        super(10 * 1000);
    }


    /** */
    async appInfo(_args: AppInfoRequest): Promise<AppInfoResponse> {
        return generateFakeProfilesAppInfo(await fakeAgentPubKey());
    }

}
