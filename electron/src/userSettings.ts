import {screen} from "electron";
import {APP_DATA_PATH} from "./constants";

const path = require('path');
const fs = require('fs');


/**
 * Object for handling/storing all user preferences
 */
export class SettingsStore {

  path: string;
  data: Object;

  constructor(opts) {
    // Renderer process has to get `app` module via `remote`, whereas the main process can get it directly
    // app.getPath('userData') will return a string of the user's app data directory path.
    // const userDataPath = (app || remote.app).getPath('userData');

    this.path = path.join(opts.storagePath, opts.configName + '.json');

    this.data = parseSettingsFile(this.path, opts.defaults);
  }

  // This will just return the property on the `data` object
  get(key) {
    return this.data[key];
  }

  // ...and this will set it
  set(key, val) {
    this.data[key] = val;
    // Wait, I thought using the node.js' synchronous APIs was bad form?
    // We're not writing a server so there's not nearly the same IO demand on the process
    // Also if we used an async API and our app was quit before the asynchronous write had a chance to complete,
    // we might lose that data. Note that in a real app, we would try/catch this.
    fs.writeFileSync(this.path, JSON.stringify(this.data));
  }
}


/**
 *
 * @param filePath
 * @param defaults
 */
function parseSettingsFile(filePath, defaults) {
  // We'll try/catch it in case the file doesn't exist yet, which will be the case on the first application run.
  // `fs.readFileSync` will return a JSON string which we then parse into a Javascript object
  try {
    return JSON.parse(fs.readFileSync(filePath));
  } catch(error) {
    // if there was some kind of error, return the passed in defaults instead.
    return defaults;
  }
}

/**
 *
 */
export function loadUserSettings(initialWidth: number, initialHeight: number): SettingsStore {
  // Get Settings
  const { width, height } = screen.getPrimaryDisplay().workAreaSize;
  let starting_width = Math.min(width, initialWidth);
  let starting_height = Math.min(height, initialHeight);

  let x = Math.floor((width - starting_width) / 2);
  let y = Math.floor((height - starting_height) / 2);

  let userSettings = new SettingsStore({
    // We'll call our data file 'user-preferences'
    configName: 'user-preferences',
    storagePath: APP_DATA_PATH,
    defaults: {
      windowBounds: { width: starting_width, height: starting_height },
      canAutoLaunch: false,
      windowPosition: {x, y},
      dontConfirmOnExit: false,
      canNotify: false,
      lastUid: undefined,
    }
  });
  return userSettings;
}
