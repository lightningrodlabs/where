import * as path from "path";
import {app} from "electron";

/** Debugging */
export const IS_DEBUG = process.env.APP_DEV ? (process.env.APP_DEV.trim() === 'true') : false;
export const DEVELOPMENT_UI_URL = path.join(__dirname, '../web')
//export const DEVELOPMENT_UI_URL = path.join(__dirname, '../../web')

/** Networking */
//export const INITIAL_UID = "__startup__"
export const COMMUNITY_PROXY_URL =
  'kitsune-proxy://SYVd4CF3BdJ4DS7KwLLgeU3_DbHoZ34Y-qroZ79DOs8/kitsune-quic/h/165.22.32.11/p/5779/--'

/** App consts */
export const DNA_VERSION_FILENAME = "dna_version.txt";
export const RUNNING_ZOME_HASH_FILEPATH = 'dna/where_zome_hash.txt';
export const MAIN_APP_ID = 'main-app'
export const APP_DATA_PATH = IS_DEBUG
  ? path.join(__dirname, '../../.dev-app-data')
  : path.join(app.getPath('appData'), 'where')
export const USER_DATA_PATH = path.join(APP_DATA_PATH, 'users');


/** UI consts */
export const BACKGROUND_COLOR = '#fbf9f7'
//export const CURRENT_DIR = path.join(__dirname, '..');
export const MAIN_FILE = path.join(__dirname, '../web/index.html')
export const SPLASH_FILE = path.join(__dirname, '../web/splashscreen.html')
export const LINUX_ICON_FILE = path.join(__dirname, '../web/logo/logo256.png')
