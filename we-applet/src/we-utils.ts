import {asCell, BaseRoleName, Cell, CellProxy, ConductorAppProxy} from "@ddd-qc/cell-proxy";
import {AppAgentClient, AppAgentWebsocket, CellInfo, encodeHashToBase64, InstalledAppId} from "@holochain/client";
import {Hrl} from "@lightningrodlabs/we-applet";


/** */
export async function getCellInfo(client: AppAgentClient, hrl: Hrl, baseRoleName: BaseRoleName): Promise<CellInfo | null> {
  const appInfo = await client.appInfo();
  const cells = appInfo.cell_info[baseRoleName];
  for (const cellInfo of cells) {
    const cell = asCell(cellInfo);
    if (!cell) {
      continue;
    }
    const cellId = cell.cell_id;
    if (encodeHashToBase64(cellId[0]) == encodeHashToBase64(hrl[0])) {
      return cellInfo;
    }
  }
  return null;
}


/** */
export async function asCellProxy(client: AppAgentClient, hrl: Hrl, appId: InstalledAppId, baseRoleName: BaseRoleName): Promise<CellProxy> {
  const agentWs = client as AppAgentWebsocket;
  const appProxy = await ConductorAppProxy.new(agentWs.appWebsocket);
  const cellInfo = await getCellInfo(client, hrl, baseRoleName);
  const cell = Cell.from(cellInfo, appId, baseRoleName)
  const cellProxy = new CellProxy(appProxy, cell);
  return cellProxy;
}
