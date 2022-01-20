import { app, BrowserWindow, ipcMain, shell } from 'electron'
import * as path from 'path'
// import log from 'electron-log'
import initAgent, {
  StateSignal,
  STATUS_EVENT,
} from 'electron-holochain'

import {
  devOptions,
  whereDnaPath,
  prodOptions,
  stateSignalToText,
  BINARY_PATHS,
} from './holochain'

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
// if (require('electron-squirrel-startup')) {
// eslint-disable-line global-require
// app.quit()
// }

const BACKGROUND_COLOR = '#fbf9f7'


const MAIN_FILE = path.join(__dirname, '../web/index.html')
const SPLASH_FILE = path.join(__dirname, '../web/splashscreen.html')
const LINUX_ICON_FILE = path.join(__dirname, '../web/logo/logo64.png')

// const DEVELOPMENT_UI_URL = process.env.TEST_USER_2
//   ? 'http://localhost:8081'
//   : 'http://localhost:8080'

// const DEVELOPMENT_UI_URL = "C:\\github\\where-damien\\ui\\apps\\where\\index.html"
const DEVELOPMENT_UI_URL =  'file://' + "C:/github/where-damien/web/"

/**
 *
 */
const createMainWindow = (): BrowserWindow => {
  // Create the browser window.
  const options: Electron.BrowserWindowConstructorOptions = {
    height: 1080,
    width: 1920,
    show: false,
    backgroundColor: BACKGROUND_COLOR,
    // use these settings so that the ui can check paths
    webPreferences: {
      contextIsolation: false,
      nodeIntegration: true,
      devTools: true,
      webgl: false,
      enableWebSQL: false,
    },
  }
  if (process.platform === 'linux') {
    options.icon = LINUX_ICON_FILE
  }
  const mainWindow = new BrowserWindow(options)
  // and load the index.html of the app.
  if (app.isPackaged) {
    mainWindow.loadFile(MAIN_FILE)
  } else {
    // development
    console.log("createMainWindow ; loadURL: " + DEVELOPMENT_UI_URL)
    mainWindow.webContents.openDevTools();
    //mainWindow.loadURL(DEVELOPMENT_UI_URL)
    mainWindow.loadURL(DEVELOPMENT_UI_URL + "/index.html")
  }
  // Open <a href='' target='_blank'> with default system browser
  mainWindow.webContents.on('new-window', function (event, url) {
    event.preventDefault()
    console.log("new-window ; open: " + url)
    shell.openExternal(url)
  })
  // once its ready to show, show
  mainWindow.once('ready-to-show', () => {
    mainWindow.show()
  })
  return mainWindow
}

/**
 *
 */
const createSplashWindow = (): BrowserWindow => {
  // Create the browser window.
  const splashWindow = new BrowserWindow({
    height: 450,
    width: 800,
    center: true,
    resizable: false,
    frame: false,
    show: false,
    backgroundColor: BACKGROUND_COLOR,
    // use these settings so that the ui
    // can listen for status change events
    webPreferences: {
      contextIsolation: false,
      nodeIntegration: true,
      devTools: true,
      webgl: false,
      enableWebSQL: false,
    },
    icon: path.join(__dirname, "/assets/favicon.png"),
  })

  // and load the splashscreen.html of the app.
  if (app.isPackaged) {
    splashWindow.loadFile(SPLASH_FILE)
  } else {
    // development
    //splashWindow.webContents.openDevTools();
    splashWindow.loadURL(`${DEVELOPMENT_UI_URL}/splashscreen.html`)
    //splashWindow.loadURL("C:\\github\\where-damien\\web\\splashscreen.html")
  }
  // once its ready to show, show
  splashWindow.once('ready-to-show', () => {
    splashWindow.show()
  })

  //// Open the DevTools.
  // mainWindow.webContents.openDevTools();
  return splashWindow
}


/**
* This method will be called when Electron has finished initialization and is ready to create browser windows.
* Some APIs can only be used after this event occurs.
*/
app.on('ready', async () => {
  console.log("APP READY")
  const splashWindow = createSplashWindow()
  //console.log("splashWindow CREATED")
  const opts = app.isPackaged ? prodOptions : devOptions
  console.log({opts})
  const statusEmitter = await initAgent(app, opts, BINARY_PATHS)
  //console.log("statusEmitter: " + JSON.stringify(statusEmitter))
  statusEmitter.on(STATUS_EVENT, (state: StateSignal) => {
    console.log("STATIS EVENT: " + stateSignalToText(state) + " (" + state + ")")
    switch (state) {
      case StateSignal.IsReady:
        console.log("STATIS EVENT: IS READY")
        // important that this line comes before the next one
        // otherwise this triggers the 'all-windows-closed' event
        createMainWindow()
        splashWindow.close()
        break
      default:
        splashWindow.webContents.send('status', stateSignalToText(state))
    }
  })
})

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
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
