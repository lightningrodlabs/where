import * as path from "path";
import {app} from "electron";

/** Build Mode */

//export const IS_PACKAGED = app.isPackaged;
export const DEVELOPMENT_UI_URL = path.join(__dirname, '../web')
//export const DEVELOPMENT_UI_URL = path.join(__dirname, '../../web')

/** Networking */
//export const INITIAL_UID = "__startup__"
export const COMMUNITY_PROXY_URL =
  'kitsune-proxy://SYVd4CF3BdJ4DS7KwLLgeU3_DbHoZ34Y-qroZ79DOs8/kitsune-quic/h/165.22.32.11/p/5779/--'

/** App consts */
export const DNA_VERSION_FILENAME = "dna_version.txt";
export const RUNNING_ZOME_HASH_FILEPATH = 'bin/where_zome_hash.txt';
export const MAIN_APP_ID = 'main-app'
export const APP_DATA_PATH = /*IS_PACKAGED ? path.join(__dirname, '../../.dev-app-data') : */
  path.join(app.getPath('appData'), 'where')
export const USER_DATA_PATH = path.join(APP_DATA_PATH, 'users');


/** UI consts */
export const BACKGROUND_COLOR = '#fbf9f7'
//export const CURRENT_DIR = path.join(__dirname, '..');
export const MAIN_FILE = path.join(__dirname, '../web/index.html')
export const SPLASH_FILE = path.join(__dirname, '../web/splashscreen.html')
export const LINUX_ICON_FILE = path.join(__dirname, '../web/logo/icon512.png')
export const ICON_FILEPATH = path.join(__dirname, "/logo/logo256.png")


/** ADMIN */

/** */
let g_adminPort = null;
export async function getAdminPort(): Promise<number> {
  if (g_adminPort === null) {
    g_adminPort = await getPortFree();
  }
  return g_adminPort;
}

import net, {AddressInfo} from "net"

async function getPortFree() {
  console.log("debug", "getPortFree()")
  return new Promise( res => {
    const srv = net.createServer();
    srv.listen(0, () => {
      const port = (srv.address() as AddressInfo).port;
      srv.close((err) => res(port))
    });
  })
}
