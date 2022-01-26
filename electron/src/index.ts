import {app, BrowserWindow, globalShortcut, ipcMain, Menu, screen, shell} from 'electron'
import * as path from 'path'
// import log from 'electron-log'
import initAgent, {
  StateSignal,
  STATUS_EVENT,
} from 'electron-holochain'

import {
  createHolochainOptions,
  stateSignalToText,
  BINARY_PATHS,
} from './holochain'

import { log } from './logger'
import { mainMenuTemplate } from './menu'
import  { loadUserSettings } from './userSettings'

import {
  BACKGROUND_COLOR,
  DEVELOPMENT_UI_URL,
  LINUX_ICON_FILE,
  SPLASH_FILE,
  MAIN_FILE,
  IS_DEBUG
} from './constants'

import {setupApp, addUid} from "./setup";
import * as prompt from 'electron-prompt';

//--------------------------------------------------------------------------------------------------
// PRE-INIT
//--------------------------------------------------------------------------------------------------

//require('electron-context-menu')();
//require('fix-path')();

process.env.WASM_LOG="WARN";
process.env.RUST_LOG="WARN";

//--------------------------------------------------------------------------------------------------
// -- Globals
//--------------------------------------------------------------------------------------------------

let g_userSettings = undefined;
let g_sessionDataPath = undefined;
let g_uid = '';
let g_uidList = [];


//--------------------------------------------------------------------------------------------------
// -- Functions
//--------------------------------------------------------------------------------------------------

/**
 *
 */
const createMainWindow = (): BrowserWindow => {
  /** Create the browser window */
  let { width, height } = g_userSettings.get('windowBounds');
  let title = "Where v" + app.getVersion() + " - " + g_uid
  const options: Electron.BrowserWindowConstructorOptions = {
    height,
    width,
    title: IS_DEBUG? "[DEBUG] " + title : title,
    show: false,
    backgroundColor: BACKGROUND_COLOR,
    // use these settings so that the ui can check paths
    webPreferences: {
      contextIsolation: false,
      nodeIntegration: true,
      devTools: IS_DEBUG,
      webgl: false,
      enableWebSQL: false,
    },
    icon: __dirname + `/logo/logo48.png`,
  }
  if (process.platform === 'linux') {
    options.icon = LINUX_ICON_FILE
  }
  const mainWindow = new BrowserWindow(options)

  /** Things to setup at start */
  let { x, y } = g_userSettings.get('windowPosition');
  mainWindow.setPosition(x, y);

  globalShortcut.register('f5', function() {
    //console.log('f5 is pressed')
    mainWindow.reload()
  })

  /** load the index.html of the app */
  if (app.isPackaged) {
    mainWindow.loadFile(MAIN_FILE)
  } else {
    // development
    log('debug', "createMainWindow ; loadURL: " + DEVELOPMENT_UI_URL)
    mainWindow.webContents.openDevTools();
    //mainWindow.loadURL(DEVELOPMENT_UI_URL)
    mainWindow.loadURL(DEVELOPMENT_UI_URL + "/index.html")
  }

  /** Open <a href='' target='_blank'> with default system browser */
  mainWindow.webContents.on('new-window', function (event, url) {
    event.preventDefault()
    console.debug("new-window ; open: " + url)
    shell.openExternal(url)
  })
  /** once its ready to show, show */
  mainWindow.once('ready-to-show', () => {
    mainWindow.show()
  })

  mainWindow.on('resize', () => {
    // The event doesn't pass us the window size,
    // so we call the `getBounds` method which returns an object with
    // the height, width, and x and y coordinates.
    let { width, height } = mainWindow.getBounds();
    // Now that we have them, save them using the `set` method.
    g_userSettings.set('windowBounds', { width, height });
  });

  /** Save position on close */
  mainWindow.on('close', (_event) => {
    let positions = mainWindow.getPosition();
    g_userSettings.set('windowPosition', { x: Math.floor(positions[0]), y: Math.floor(positions[1]) });
    // if (g_canQuit) {
    //   mainWindow = null;
    // } else {
    //   event.preventDefault();
    //   mainWindow.hide();
    // }
  })

  /** Done */
  return mainWindow
}


/**
 *
 */
const createSplashWindow = (): BrowserWindow => {
  /** Create the browser window */
  const splashWindow = new BrowserWindow({
    height: 450,
    width: 850,
    center: true,
    resizable: false,
    frame: false,
    show: false,
    backgroundColor: BACKGROUND_COLOR,
    webPreferences: {
      contextIsolation: false,
      nodeIntegration: true,
      devTools: true,
      webgl: false,
      enableWebSQL: false,
    },
    icon: path.join(__dirname, "/logo/logo48.png"),
  })
  /** and load it */
  if (app.isPackaged) {
    splashWindow.loadFile(SPLASH_FILE)
  } else {
    /** development */
    //splashWindow.webContents.openDevTools();
    splashWindow.loadURL(`${DEVELOPMENT_UI_URL}/splashscreen.html`)
    //splashWindow.loadURL("C:\\github\\where-damien\\web\\splashscreen.html")
  }
  /** once its ready to show, show */
  splashWindow.once('ready-to-show', () => {
    splashWindow.show()
  })
  /** Done */
  return splashWindow
}


/**
* This method will be called when Electron has finished initialization and is ready to create browser windows.
* Some APIs can only be used after this event occurs.
*/
app.on('ready', async () => {
  log('debug', "APP READY - " + __dirname)
  //log('debug', process.env)

  /* Create Splash Screen */
  const splashWindow = createSplashWindow()
  /** Load user settings */
  g_userSettings = loadUserSettings(1920, 1080);
  /** Setup initial things */
  const {sessionDataPath, uidList } = setupApp();
  g_sessionDataPath = sessionDataPath
  g_uidList = uidList
  log('debug', "g_sessionDataPath: " + g_sessionDataPath);
  /** Determine starting UID */
  const maybeUid = g_userSettings.get("lastUid")
  const hasUid = maybeUid? g_uidList.includes(maybeUid): false;
  if (hasUid) {
    g_uid = maybeUid
  } else {
    if (g_uidList.length == 0) {
      await promptUid(true);
    }
    g_uid = g_uidList[0]
    g_userSettings.set('lastUid', g_uid)
  }
  /** Init conductor */
  const opts = createHolochainOptions(!app.isPackaged, g_uid, g_sessionDataPath)
  log('debug', {opts})
  const statusEmitter = await initAgent(app, opts, BINARY_PATHS)
  statusEmitter.on(STATUS_EVENT, (state: StateSignal) => {
    log('debug', "STATUS EVENT: " + stateSignalToText(state) + " (" + state + ")")
    switch (state) {
      case StateSignal.IsReady:
        log('debug', "STATUS EVENT: IS READY")
        // Its important to create the window before closing the current one
        // otherwise this triggers the 'all-windows-closed' event
        const mainWindow = createMainWindow()
        splashWindow.close()
        break
      default:
        splashWindow.webContents.send('status', stateSignalToText(state))
    }
  })
})


/**
 * Quit when all windows are closed, except on macOS. There, it's common
 * for applications and their menu bar to stay active until the user quits
 * explicitly with Cmd + Q.
 */
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('activate', () => {
  // On OS X it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (BrowserWindow.getAllWindows().length === 0) {
    createMainWindow()
  }
})


// ipcMain.handle('getProjectsPath', () => {
//   return whereDnaPath
// })


/**************************************************************************************************
 * PROMPTS
 *************************************************************************************************/

 /**
 * @returns false if user cancelled
 */
async function promptUid(canExitOnCancel) {
  let r = await prompt({
    title: 'Where: Join new Network',
    height: 180,
    width: 500,
    alwaysOnTop: true,
    label: 'Network Access Key:',
    value: g_uid,
    inputAttrs: {
      minlength: "2",
      required: true,
      pattern: "[a-zA-Z0-9\-_.]+",
      type: 'string'
    },
    type: 'input'
  });
  if(r === null) {
    log('debug','user cancelled. Can exit: ' + canExitOnCancel);
    if (canExitOnCancel) {
      app.quit();
    }
  } else {
    const succeeded = addUid(r, g_sessionDataPath);
    if (succeeded) {
      g_uid = r
      g_uidList.push(r)
    }
  }
  return r !== null
}

/**************************************************************************************************
 * FINALIZE
 *************************************************************************************************/

Menu.setApplicationMenu(Menu.buildFromTemplate(mainMenuTemplate));

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
// if (require('electron-squirrel-startup')) {
// eslint-disable-line global-require
// app.quit()
// }
