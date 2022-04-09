import * as fs from "fs";
import * as path from "path";
import {app, dialog} from "electron";

import {log} from "./logger";
import {APP_DATA_PATH, DNA_VERSION_FILENAME, RUNNING_ZOME_HASH_FILEPATH, USER_DATA_PATH} from "./constants";

const UID_LIST_FILENAME = 'uid-list.txt';


/**
 *
 */
function fatalError(message: string, error?: any) {
  log('error', message);
  log('error', error);
  dialog.showMessageBoxSync({
    title: 'Where: Fatal error',
    buttons: ['exit'],
    type: 'error',
    message,
    detail: JSON.stringify(error),
  });
  process.abort();
}


/**
 *
 */
export function initApp() {
  /** Read where_zome_hash.txt in app folder */
  const runningDnaHash = loadRunningZomeHash();
  log('info', "WHERE ZOME HASH: " + runningDnaHash);

  /** --  Create missing dirs -- **/
  try {
    if (!fs.existsSync(APP_DATA_PATH)) {
      log('info', "Creating missing dir: " + APP_DATA_PATH);
      fs.mkdirSync(APP_DATA_PATH)
    }
    if (!fs.existsSync(USER_DATA_PATH)) {
      log('info', "Creating missing dir: " + USER_DATA_PATH);
      fs.mkdirSync(USER_DATA_PATH)
    }
  } catch (e) {
    fatalError("Failed to create data folders on disk", e)
  }

  /** -- Determine Session ID -- **/
  let sessionId;
  if (process.argv.length > 2) {
    sessionId = process.argv[2];
  } else {
    sessionId = 'default';
  }

  /** -- Setup storage folder -- **/
  const sessionDataPath = path.join(USER_DATA_PATH, sessionId);
  log('info', {sessionDataPath});
  setupSessionStorage(sessionDataPath, runningDnaHash)

  /** -- UID List -- **/
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
      log('warn', 'File not found: ' + err);
    } else {
      log('warn','Loading config file failed: ' + err);
    }
    log('warn','continuing...');
  }
  // if (uidList.length == 0) {
  //   uidList.push(INITIAL_UID)
  // }

  //// -- Determine final conductor config file path -- //
  //g_configPath = path.join(g_storagePath, CONDUCTOR_CONFIG_FILENAME);
  //log('debug', {g_configPath});
  //let g_appConfigPath = path.join(g_storagePath, APP_CONFIG_FILENAME);

  /** Done */
  return {sessionDataPath, uidList}
}


/**
 *
 */
function setupSessionStorage(sessionPath, dnaHash) {

  const dna_version_txt = path.join(sessionPath, DNA_VERSION_FILENAME);

  // Create storage and setup if none found
  if (!fs.existsSync(sessionPath)) {
    log('info', "Creating missing dir: " + sessionPath);
    try {
      fs.mkdirSync(sessionPath)
      fs.writeFileSync(dna_version_txt, dnaHash, 'utf-8');
    } catch(e) {
      fatalError("Failed to setup storage folder on disk", e)
    }
  } else {
    /** Make sure its a compatible version */
    let storedDnaHash = '<not found>';
    try {
      log('debug', 'Reading: ' + dna_version_txt);
      storedDnaHash = fs.readFileSync(dna_version_txt, 'utf-8');
    } catch (e) {
      log('error', 'Failed to read the dna_version_txt file !');
      log('error', e);
    }
    if (storedDnaHash !== dnaHash) {
      const msg = "The data found on disk is for a different version of Where's core:\n" +
        '  Stored data version: ' + storedDnaHash + '\n' +
        'This running version: ' + dnaHash;
      log('error', msg);
      const canErase = promptVersionMismatch(msg);
      if (canErase) {
        try {
          fs.rmdirSync(sessionPath, {recursive: true});
          /* Start over */
          setupSessionStorage(sessionPath, dnaHash);
        } catch (e) {
          fatalError('Failed erasing current stored data', e);
        }
      }
    }
  }
}

/**
 *
 */
export function addUidToDisk(newUid: string, sessionDataPath: string): boolean {
  //log('info','addUidToDisk(): ' + newUid);
  //log('info','addUidToDisk() sessionDataPath = ' + sessionDataPath);
  let uidListPath = path.join(sessionDataPath, UID_LIST_FILENAME);
  try {
    fs.appendFileSync(uidListPath, newUid + '\n');
  } catch (err) {
    log('error','Writing to file failed: ' + err);
    return false;
  }
  return true;
}



/**
 * @returns dnaHash
 */
function loadRunningZomeHash() {
  if(fs.existsSync(RUNNING_ZOME_HASH_FILEPATH)) {
    return fs.readFileSync(RUNNING_ZOME_HASH_FILEPATH, 'utf-8');
  }
  if(fs.existsSync('resources/app/' + RUNNING_ZOME_HASH_FILEPATH)) {
    return fs.readFileSync('resources/app/' + RUNNING_ZOME_HASH_FILEPATH, 'utf-8');
  }
  if(fs.existsSync(app.getAppPath() + '/' + RUNNING_ZOME_HASH_FILEPATH)) {
    return fs.readFileSync(app.getAppPath() + '/' + RUNNING_ZOME_HASH_FILEPATH, 'utf-8');
  }
  fatalError("Corrupt installation. Missing zome hash file.");
}


/**
 * Return true if user wants to erase stored data
 */
function promptVersionMismatch(message) {
  const result = dialog.showMessageBoxSync({
    title: `${app.getName()} - v${app.getVersion()}`,
    message: `Version mismatch`,
    detail: message,
    type: "warning",
    defaultId: 0,
    buttons: ['Erase stored data', 'Continue anyway', 'Exit'],
  });
  switch (result) {
    case 0: {
      return true;
      break;
    }
    case 1: {
      return false;
      break;
    }
    case 2: {
      app.exit();
      break;
    }
    default:
      break;
  }
  return false;
}
