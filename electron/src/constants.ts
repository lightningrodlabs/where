import * as path from "path";
import {app} from "electron";

export const IS_DEBUG = process.env.APP_DEV ? (process.env.APP_DEV.trim() === 'true') : false;

export const MAIN_APP_ID = 'main-app'
export const COMMUNITY_PROXY_URL =
  'kitsune-proxy://SYVd4CF3BdJ4DS7KwLLgeU3_DbHoZ34Y-qroZ79DOs8/kitsune-quic/h/165.22.32.11/p/5779/--'

export const CONFIG_PATH = path.join(app.getPath('appData'), 'where');

export const BACKGROUND_COLOR = '#fbf9f7'

export const CURRENT_DIR = path.join(__dirname, '..');
export const MAIN_FILE = path.join(__dirname, '../web/index.html')
export const SPLASH_FILE = path.join(__dirname, '../web/splashscreen.html')
export const LINUX_ICON_FILE = path.join(__dirname, '../web/logo/logo64.png')

// export const DEVELOPMENT_UI_URL = process.env.TEST_USER_2
//   ? 'http://localhost:8081'
//   : 'http://localhost:8080'

export const DEVELOPMENT_UI_URL = path.join(__dirname, '../../web')
