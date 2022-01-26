import * as fs from "fs";
import * as path from "path";
import {app} from "electron";

import {log} from "./logger";
import {APP_DATA_PATH, USER_DATA_PATH } from "./constants";

const UID_LIST_FILENAME = 'uid-list.txt';


export function initApp() {
  // --  Create missing dirs -- //
  if (!fs.existsSync(APP_DATA_PATH)) {
    log('info', "Creating missing dir: " + APP_DATA_PATH);
    fs.mkdirSync(APP_DATA_PATH)
  }
  if (!fs.existsSync(USER_DATA_PATH)) {
    log('info', "Creating missing dir: " + USER_DATA_PATH);
    fs.mkdirSync(USER_DATA_PATH)
  }

  // -- Determine Session ID -- //
  let sessionId;
  if (process.argv.length > 2) {
    sessionId = process.argv[2];
  } else {
    sessionId = 'default';
  }

  // -- Setup storage folder -- //
  const sessionDataPath = path.join(USER_DATA_PATH, sessionId);
  log('info', {SESSION_PATH: sessionDataPath});
  let VERSION_FILE = path.join(sessionDataPath, "app_version.txt");
  // Create storage and setup if none found
  if (!fs.existsSync(sessionDataPath)) {
    log('info', "Creating missing dir: " + sessionDataPath);
    fs.mkdirSync(sessionDataPath)
    try {
      fs.writeFileSync(VERSION_FILE, app.getVersion(), 'utf-8');
    } catch (e) {
      //showErrorDialog('Failed to save the version_txt file !');
      log('error', 'Failed to save the version_txt file !')
      process.abort();
    }
  } else {
    // Make sure its a compatible version
    try {
      log('debug', 'Reading: ' + VERSION_FILE);
      const read_version = fs.readFileSync(VERSION_FILE, 'utf-8');
      if (read_version !== app.getVersion()) {
        // FIXME Check only DNA versions
        // log('error', 'App Version mismatch :-(')
        // log('error', read_version);
        // log('error', app.getVersion());
        // //dialog.showOpenDialogSync({ properties: ['openFile', 'multiSelections'] })
        // //showErrorDialog('App Version mismatch :-(');
        // //app.quit();
        // process.abort();
      }
    } catch (e) {
      //showErrorDialog('Failed to read the version_txt file !');
      //app.quit();
      log('error', 'Failed to read app_version.txt !')
      log('error', e);
      process.abort();
    }
  }

  // -- UID List -- //
  let uidList = []
  try {
    let uidListPath = path.join(sessionDataPath, UID_LIST_FILENAME);
    log('debug', 'Reading file ' + uidListPath);
    const uidListStr = fs.readFileSync(uidListPath).toString();
    uidList = uidListStr.replace(/\r\n/g,'\n').split('\n');
    uidList = uidList.filter(function (el) {return el !== '';});
    log('debug', {uidList});
  } catch(err) {
    if(err.code === 'ENOENT') {
      log('error', 'File not found: ' + err);
    } else {
      log('error','Loading config file failed: ' + err);
    }
    log('error','continuing...');
  }
  // if (uidList.length == 0) {
  //   uidList.push(INITIAL_UID)
  // }


  //// -- Determine final conductor config file path -- //
  //g_configPath = path.join(g_storagePath, CONDUCTOR_CONFIG_FILENAME);
  //log('debug', {g_configPath});
  //let g_appConfigPath = path.join(g_storagePath, APP_CONFIG_FILENAME);

  // -- Set Globals from current conductor config -- //

// tryLoadingConfig()
  {
    try {

      // // -- Conductor Config -- //
      // const conductorConfigBuffer = fs.readFileSync(g_configPath);
      // const conductorConfig = conductorConfigBuffer.toString();
      // // log('debug', {conductorConfig})
      // // Get Admin PORT
      // let regex = /port: (.*)$/gm;
      // let match = regex.exec(conductorConfig);
      // // log('silly', {match});
      // g_adminPort = match[1];
      // // Get bootstrap server URL
      // regex = /bootstrap_service: (.*)$/gm;
      // match = regex.exec(conductorConfig);
      // // log('silly', {match});
      // g_bootstrapUrl = match[1];
      // // Get proxy server URL
      // try {
      //   regex = /proxy_url: (.*)$/gm;
      //   match = regex.exec(conductorConfig);
      //   g_proxyUrl = match[1];
      //   log('debug', {g_proxyUrl});
      // } catch (err) {
      //   log('info', 'No proxy URL found in config. Using default proxy.');
      //   g_proxyUrl = DEFAULT_PROXY_URL;
      // }

    } catch (err) {
      if (err.code === 'ENOENT') {
        log('error', 'File not found: ' + err);
      } else {
        log('error', 'Loading file failed: ' + err);
      }
      log('error', 'continuing...');
    }
  }
  /** Done */
  return {sessionDataPath, uidList}
}



export function addUidToDisk(newUid: string, sessionDataPath: string): boolean {
  let uidListPath = path.join(sessionDataPath, UID_LIST_FILENAME);
  try {
    fs.appendFileSync(uidListPath, newUid + '\n');
  } catch (err) {
    log('error','Writing to file failed: ' + err);
    return false;
  }
  return true;
}
