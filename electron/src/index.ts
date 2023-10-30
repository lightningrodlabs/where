import {
  app,
  BrowserWindow,
  dialog,
  globalShortcut,
  ipcMain as ipc,
  Menu,
  MenuItemConstructorOptions,
  nativeImage,
  RelaunchOptions,
  shell,
  Tray
} from 'electron'
import * as path from 'path'
// import log from 'electron-log'
import initAgent, {
  APP_PORT_EVENT,
  ERROR_EVENT,
  getRunnerVersion,
  HOLOCHAIN_RUNNER_QUIT,
  StateSignal,
  STATUS_EVENT,
} from "@lightningrodlabs/electron-holochain"

import {BINARY_PATHS, createHolochainOptions, stateSignalToText,} from './holochain'

import {electronLogger, log} from './logger'
import {loadUserSettings} from './userSettings'
import {
  APP_DATA_PATH,
  BACKGROUND_COLOR,
  DEVELOPMENT_UI_URL,
  getAdminPort,
  ICON_FILEPATH,
  LINUX_ICON_FILE,
  MAIN_FILE,
  SPLASH_FILE,
} from './constants'

import {addUidToDisk, initApp} from "./init";
//import * as prompt from 'electron-prompt';
import prompt from 'electron-prompt';

/** Global Localization service. Loaded on app 'ready' event */
let i18n;
/** Test french */
//app.commandLine.appendSwitch('lang', 'fr')

export const delay = (ms:number) => new Promise(r => setTimeout(r, ms))

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
let g_statusEmitter = undefined;
let g_shutdown = undefined;
let g_canQuit = false;
let g_userSettings = undefined;
let g_sessionDataPath = undefined;
let g_tray = null;
let g_uid = '';
let g_uidList = [];
let g_appPort = '';
let g_mainWindow: BrowserWindow | null = null;
let g_runner_version = 'holochain runner version (unknown)'
//let g_lair_version = 'lair version (unknown)'
let g_dnaHash = '(unknown)'


//--------------------------------------------------------------------------------------------------
// -- Functions
//--------------------------------------------------------------------------------------------------

//import {HAPP_ENV, HappEnvType} from "@ddd-qc/lit-happ";

const HAPP_ENV = "Electron";

/**
 *
 */
const createMainWindow = async (appPort: string): Promise<BrowserWindow> => {
  //const isInDev = HAPP_ENV == HappEnvType.Devtest || HappEnvType.DevtestWe || HappEnvType.DevTestHolo;
  const isInDev = false;

  /** Create the browser window */
  let { width, height } = g_userSettings.get('windowBounds');
  let title = "Where v" + app.getVersion() + " - " + g_uid
  const options: Electron.BrowserWindowConstructorOptions = {
    height,
    width,
    title: isInDev? "[" + HAPP_ENV + "] " + title : title,
    show: false,
    backgroundColor: BACKGROUND_COLOR,
    /* Use these settings so that the ui can check paths */
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: true,
      devTools: true,
      webgl: false,
      enableWebSQL: false,
    },
    icon: process.platform === 'linux'? LINUX_ICON_FILE : ICON_FILEPATH,
  }
  let mainWindow = new BrowserWindow(options)

  /** Things to set up at startup */
  let { x, y } = g_userSettings.get('windowPosition');
  mainWindow.setPosition(x, y);

  globalShortcut.register('f5', function() {
    //console.log('f5 is pressed')
    mainWindow.reload()
  })

  if (isInDev) {
    mainWindow.webContents.openDevTools();
  }

  /** load the index.html of the app */
  let mainUrl = app.isPackaged? MAIN_FILE : path.join(DEVELOPMENT_UI_URL, "index.html")
  mainUrl += "?ADMIN="+ await getAdminPort() + "&APP=" + appPort + "&UID=" + g_uid
  log('info', "createMainWindow ; mainUrl = " + mainUrl)
  try {
    await mainWindow.loadURL("file://" + mainUrl)
  } catch(err) {
    log('error', 'loadURL() failed:');
    log('error',{err});
  }

  /** Open <a href='' target='_blank'> with default system browser */
  mainWindow.webContents.on('new-window', function (event, url) {
    event.preventDefault()
    log('info', "new-window ; open: " + url)
    shell.openExternal(url).then(_r => {});
  })
  /** once it's ready to show, show */
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
  mainWindow.on('close', async (event) => {
    let positions = mainWindow.getPosition();
    g_userSettings.set('windowPosition', { x: Math.floor(positions[0]), y: Math.floor(positions[1]) });
    if (g_canQuit) {
      log('info', 'WINDOW EVENT "close" -> canQuit')
      //await try_shutdown();
      mainWindow = null;
    } else {
      event.preventDefault();
      mainWindow.hide();
    }
  })

  /** Emitted when the window is closed. */
  mainWindow.on('closed', async function () {
    log('info', 'WINDOW EVENT "closed"');
    // await try_shutdown();
    // /** Wait for kill subprocess to finish on slow machines */
    // let start = Date.now();
    // let diff = 0;
    // do {
    //   diff = Date.now() - start;
    // } while(diff < 1000);
    // log('info', '*** Holochain Closed\n');
    /**
     * Dereference the window object, usually you would store windows
     * in an array if your app supports multi windows, this is the time
     * when you should delete the corresponding element.
     */
    g_mainWindow = null;
    // g_statusEmitter = null;
  });

  /** Done */
  return mainWindow
}


/**
 *
 */
async function try_shutdown() {
  try {
    if (g_shutdown) {
      log('info', 'calling g_shutdown()...');
      await g_shutdown();
    }
  } catch (e) {
    log('error', 'g_shutdown() failed: '+ e);
  }
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
    icon: process.platform === 'linux'? LINUX_ICON_FILE : ICON_FILEPATH,
  })
  /** and load it */
  if (app.isPackaged) {
    splashWindow.loadFile(SPLASH_FILE)
  } else {
    /** development */
    //splashWindow.webContents.openDevTools();
    splashWindow.loadURL(`${DEVELOPMENT_UI_URL}/splashscreen.html`)
  }
  /** once it's ready to show, show */
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
  log('debug', "ELECTRON READY - " + __dirname)
  i18n = new(require('./localization/i18n'));
  Menu.setApplicationMenu(Menu.buildFromTemplate(mainMenuTemplate()));
  const splashWindow = createSplashWindow();
  /** Load user settings */
  g_userSettings = loadUserSettings(1920, 1080);
  /** init app */
  {
    const {sessionDataPath, uidList} = initApp();
    g_sessionDataPath = sessionDataPath
    g_uidList = uidList
  }
  /** Determine starting UID */
  const maybeUid = g_userSettings.get("lastUid")
  const hasUid = maybeUid? g_uidList.includes(maybeUid): false;
  if (hasUid) {
    g_uid = maybeUid
  } else {
    if (g_uidList.length == 0) {
      while (!splashWindow.isVisible()) {
        await delay(20)
      }
      await promptUid(true, splashWindow);
    }
    g_uid = g_uidList[0]
    g_userSettings.set('lastUid', g_uid)
  }
  log('debug', "g_uid: " + g_uid);
  g_sessionDataPath = path.join(g_sessionDataPath, g_uid)
  log('debug', "g_sessionDataPath: " + g_sessionDataPath);
  /** Get Versions */
  g_runner_version = getRunnerVersion(BINARY_PATHS?.holochainRunnerBinaryPath)
  //g_lair_version = getLairVersion(BINARY_PATHS?.lairKeystoreBinaryPath)

  /** Create sys tray */
  create_tray();
  g_tray.setToolTip('Where v' + app.getVersion());
  const menu = Menu.buildFromTemplate(trayMenuTemplate());
  g_tray.setContextMenu(menu);

  /** Start holochain and main window */
  await startMainWindow(splashWindow)
})


/**
 * Create sys tray
 */
function create_tray() {
  try {
    g_tray = new Tray('web/logo/logo16.png');
  } catch(e) {
    try {
      g_tray = new Tray('resources/app/web/logo/logo16.png');
    } catch(e) {
      try {
        g_tray = new Tray(app.getAppPath() + '/web/logo/logo16.png');
      } catch(e) {
        log('error', "Could not find favicon. appPath: " + app.getAppPath());
        g_tray = new Tray(nativeImage.createEmpty());
      }
    }
  }
}


/**
 *
 */
async function startMainWindow(splashWindow: BrowserWindow) {
  /** Init conductor */
  const opts = await createHolochainOptions(g_uid, g_sessionDataPath);
  log('debug', {opts})
  const {statusEmitter, shutdown } = await initAgent(app, opts, BINARY_PATHS)
  g_statusEmitter = statusEmitter;
  g_shutdown = shutdown;
  statusEmitter.on(STATUS_EVENT, async (state: StateSignal) => {
    //log('debug', "STATUS EVENT: " + stateSignalToText(state) + " (" + state + ")")
    switch (state) {
      case StateSignal.IsReady:
        log('debug', "STATUS EVENT: IS READY")
        // Its important to create the window before closing the current one
        // otherwise this triggers the 'all-windows-closed' event
        g_mainWindow = await createMainWindow(g_appPort)
        splashWindow.close()
        g_mainWindow.show()
        break
      default:
        if (splashWindow) {
          splashWindow.webContents.send('status', stateSignalToText(state))
        }
    }
  })
  statusEmitter.on(APP_PORT_EVENT, (appPort: string) => {
    //log('debug', "APP_PORT_EVENT: " + appPort)
    g_appPort = appPort
  })
  statusEmitter.on(ERROR_EVENT, (error: Error) => {
    const error_msg = error;
    log('error', error_msg)
    if (g_mainWindow == null && splashWindow) {
      splashWindow.webContents.send('status', error_msg)
    }
  })
  statusEmitter.on(HOLOCHAIN_RUNNER_QUIT, () => {
    const msg = "HOLOCHAIN_RUNNER_QUIT event received"
    log('warn', msg)
    if (g_mainWindow) {
      promptHolochainError(g_mainWindow, msg)
    } else {
      if (splashWindow) {
        splashWindow.webContents.send('status', msg)
      }
    }
    //app.quit()
  })
  // statusEmitter.on(LAIR_KEYSTORE_QUIT, (e) => {
  //   let msg = "LAIR_KEYSTORE_QUIT event received"
  //   log('warn', msg)
  //   if (g_mainWindow) {
  //     promptHolochainError(g_mainWindow, msg)
  //   } else {
  //     if (splashWindow) {
  //       splashWindow.webContents.send('status', msg)
  //     }
  //   }
  //   //app.quit()
  // })
}


/**
 * Quit when all windows are closed, except on macOS. There, it's common
 * for applications and their menu bar to stay active until the user quits
 * explicitly with Cmd + Q.
 */
app.on('window-all-closed', async () => {
  log('info', 'APP EVENT "window-all-closed"')
  if (process.platform !== 'darwin') {
    await try_shutdown();
    app.quit()
  }
})


/**
 *
 */
app.on('activate', async () => {
  // On OS X it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (BrowserWindow.getAllWindows().length === 0) {
    await createMainWindow(g_appPort)
  }
})


/**
 * When main window has been closed and the application will quit, destroy conductor subprocess
 */
app.on('will-quit', async (event) => {
  log('info','APP EVENT "will-quit"');
  if (!g_canQuit) {
    event.preventDefault();
  } else {
    //await try_shutdown();
  }
});


/**
 *
 */
app.on('before-quit', function () {
  log('debug','APP EVENT "before-quit"');
  g_canQuit = true;
});


/**************************************************************************************************
 * IPC
 *************************************************************************************************/

// ipcMain.handle('getProjectsPath', () => {
//   return whereDnaPath
// })


/**
 * Receive synchronous notification
 */
ipc.on('dnaHash', (event, dnaHash) => {
  g_dnaHash = dnaHash
  event.returnValue = true;
});


/**************************************************************************************************
 * PROMPTS
 *************************************************************************************************/

/**
 * @returns false if user cancelled
 */
async function promptUid(canExitOnCancel: boolean, parentBrowserWindow: BrowserWindow) {
  let r = await prompt({
    title: 'Where: ' + i18n.msg('Join new Network'),
    height: 180,
    width: 500,
    alwaysOnTop: true,
    label:  i18n.msg('Network Access Key') + ':',
    buttonLabels: {ok: i18n.msg('OK'), cancel: i18n.msg('cancel')},
    value: g_uid,
    inputAttrs: {
      minlength: "2",
      required: 'true',
      pattern: "[a-zA-Z0-9\-_.]+",
      type: 'string'
    },
    type: 'input'
  }, parentBrowserWindow);
  if(r === null) {
    log('debug','user cancelled. Can exit: ' + canExitOnCancel);
    if (canExitOnCancel) {
      app.quit();
    }
  } else {
    let sessionPath = g_sessionDataPath;
    if (g_uid) {
      sessionPath = path.join(g_sessionDataPath, "../")
    }
    const succeeded = addUidToDisk(r, sessionPath);
    //log('info', "promptUid() succeeded = " + succeeded)
    if (succeeded) {
      g_uid = r
      g_uidList.push(r)
      g_userSettings.set('lastUid', g_uid);
    }
  }
  return r !== null
}


/**
 * @returns false if user cancelled
 */
async function promptUidSelect(canExitOnCancel) {
  let selectOptions = {};
  const uidSet = new Set(g_uidList)
  const uniq = Array.from(uidSet.values());
  for (const uid of uniq) {
    selectOptions[uid] = uid;
  }
  let r = await prompt({
    title: i18n.msg('Select network'),
    height: 180,
    width: 300,
    alwaysOnTop: true,
    label: i18n.msg('Choose network') + ':',
    buttonLabels: {ok: i18n.msg('OK'), cancel: i18n.msg('cancel')},
    value: g_uid,
    type: 'select',
    selectOptions,
  });
  if(r === null) {
    log('debug','user cancelled. Can exit: ' + canExitOnCancel);
    if (canExitOnCancel) {
      app.quit();
    }
  } else {
    g_uid = r;
    g_userSettings.set('lastUid', g_uid);
  }
  return r !== null
}

/**
 *
 */
async function showAbout() {
  log("info", `[${g_runner_version}] DNA hash of "${g_uid}": ${g_dnaHash}\n`)
  await dialog.showMessageBoxSync(g_mainWindow, {
    //width: 900,
    title: i18n.msg('About'),
    message: `${app.getName()} - v${app.getVersion()}`,
    detail: i18n.msg("Tooling for group self-awareness on holochain from Lightning Rod Labs") + "\n\n"
      // + `Zome hash:\n${DNA_HASH}\n\n`
      + "DNA hash " + i18n.msg("of") + ` "${g_uid}":\n${g_dnaHash}\n\n`
      + '' + g_runner_version + ''
      //+ '' + g_lair_version
      + `\n`,
    buttons: ['OK'],
    type: "info",
    //iconIndex: 0,
    //icon: CONFIG.ICON,
    //icon: app.getFileIcon(path)
  });
}


/**
 *
 */
async function promptHolochainError(browserWindow: BrowserWindow, msg: string) {
  await dialog.showMessageBoxSync(browserWindow, {
    //width: 900,
    title: `Fatal Error`,
    message: `Holochain not running`,
    detail: `${msg}`,
    buttons: ['OK'],
    type: "error",
  });
}

/**************************************************************************************************
 * MENUS
 *************************************************************************************************/


// const optionsMenuTemplate: Array<MenuItemConstructorOptions> = [
//   {
//     id: 'launch-at-startup',
//     label: 'Launch at startup',
//     type: 'checkbox',
//     click: function (menuItem, _browserWindow, _event) {
//       //updateAutoLaunchSetting(menuItem.checked);
//     },
//   },
//   {
//     id: 'notify-msg',
//     label: 'Allow Notifications',
//     type: 'checkbox',
//     click: function (menuItem, _browserWindow, _event) {
//       //updateNotificationSetting(menuItem.checked);
//     },
//   },
// ];

async function restart() {
  log('debug', "*** Restarting...");
  g_mainWindow = null;
  //g_statusEmitter = null;
  //await try_shutdown();
  log('debug', "*** Restarting: RELAUNCH");

  if (app.isPackaged && process.env.APPIMAGE) {
    log('debug', "*** ... with APPIMAGE: " + process.env.APPIMAGE);
    //log('debug', "*** ... with execPath: " + process.execPath);

    // // Pipe errors if console.log() is called + plus possible other issues when relaunching again
    // const options: RelaunchOptions = {
    //   args: process.argv.slice(1).concat(['--relaunch']),
    //   execPath: process.execPath
    // };
    // execFile(process.env.APPIMAGE, options.args);
    // app.quit();
    // return;

    // FUSE can still fail
    let options: RelaunchOptions = {
      execPath: process.env.APPIMAGE,
     args:['--appimage-extract-and-run']
    };
    //console.log({options})
    app.relaunch(options)
  } else {
    app.relaunch()
  }
  app.exit(0)
}


/**
 * In this file you can include the rest of your app's specific main process code.
 * You can also put them in separate files and require them here.
 */
function networkMenuTemplate(): Array<MenuItemConstructorOptions> {
  return [
    {
      id: 'join-network',
      label: i18n.msg('Join new Network'),
      click: async function (menuItem, browserWindow, _event) {
        let changed = await promptUid(false, g_mainWindow);
        if (changed) {
          await restart()
        }
      },
    },
    {
      id: 'switch-network',
      label: i18n.msg('Switch Network'),
      click: async function (menuItem, _browserWindow, _event) {
        let changed = await promptUidSelect(false);
        if (changed) {
          await restart()
        }
      },
    },
    // {
    //   type: 'separator'
    // },
    // {
    //   label: 'Change Network type',
    //   click: async function (menuItem, _browserWindow, _event) {
    //     // let changed = await promptNetworkType(false);
    //     // let menu = Menu.getApplicationMenu();
    //     // menu.getMenuItemById('join-network').enabled = !g_canMdns;
    //     // menu.getMenuItemById('switch-network').enabled = !g_canMdns;
    //     // menu.getMenuItemById('change-bootstrap').enabled = !g_canMdns;
    //     // if (changed) {
    //     //   await startConductorAndLoadPage(true);
    //     // }
    //   },
    // },
    // {
    //   id: 'change-bootstrap',
    //   label: 'Change Bootstrap Server',
    //   click: async function (menuItem, _browserWindow, _event) {
    //     // let changed = await promptBootstrapUrl(false);
    //     // if (changed) {
    //     //   await startConductorAndLoadPage(true);
    //     // }
    //   }
    // },
    // {
    //   label: 'Change Proxy Server',
    //   click: async function (menuItem, _browserWindow, _event) {
    //     // const prevCanProxy = g_canProxy;
    //     // let canProxy = await promptCanProxy();
    //     // const proxyChanged = prevCanProxy !== canProxy;
    //     // if (canProxy) {
    //     //   let changed = await promptProxyUrl(false);
    //     //   if(changed || proxyChanged) {
    //     //     await startConductorAndLoadPage(true);
    //     //   }
    //     // } else  {
    //     //   if(proxyChanged) {
    //     //     await startConductorAndLoadPage(true);
    //     //   }
    //     // }
    //   }
    // },
  ];
}

const debugMenuTemplate: Array<MenuItemConstructorOptions> = [
  // {
  //   label: 'Dump logs', click: function() {
  //     log('debug', {process})
  //   }
  // },
  {
    label: 'Open Config Folder',
    click: function (menuItem, _browserWindow, _event) {
      shell.openExternal('file://' + APP_DATA_PATH);
    },
  },
  {
    label: 'Open Log File',
    click: function (menuItem, _browserWindow, _event) {
      shell.openExternal('file://' + electronLogger.transports.file.file);
    },
  },
  {
    label: 'devTools',
    role: "toggleDevTools",
  },
  {
    label: 'Restart Holochain',
    click: async function (menuItem, _browserWindow, _event) {
      await restart()
    }
  },
  {
    label: 'Reload window',
    accelerator: 'F5',
    click: async function (menuItem, browserWindow, _event) {
      browserWindow.reload();
    }
  },
];


/**
 *
 */
function mainMenuTemplate(): Array<MenuItemConstructorOptions> {
  return [
    {
      label: i18n.msg('File'), submenu: [
        // {
        //   label:`Check for Update`,
        //   click: function (menuItem, _browserWindow, _event) {
        //   //checkForUpdates(this);
        //   }
        // },
        {
          label: i18n.msg('Quit'),
          role: 'quit',
          //accelerator: 'Command+Q',
          // click: async function (menuItem, _browserWindow, _event) {
          //   let dontConfirmOnExit = g_settingsStore.get("dontConfirmOnExit");
          //   if (dontConfirmOnExit) {
          //     app.quit();
          //   } else {
          //     let canExit = await confirmExit();
          //     if (canExit) {
          //       app.quit();
          //     }
          //   }
          // },
        },
      ],
    },
    {
      label: i18n.msg('Network'),
      submenu: networkMenuTemplate(),
    },
    // {
    //   label: 'Options',
    //   submenu: optionsMenuTemplate,
    // },
    {
      label: 'Debug',
      submenu: debugMenuTemplate,
    },
    {
      label: i18n.msg('Help'), submenu: [{
        label: i18n.msg('Report bug / issue'),
        click: function (menuItem, _browserWindow, _event) {
          shell.openExternal(`https://github.com/lightningrodlabs/where/issues/new`)
        }
      },
        {
          type: 'separator'
        },
        {
          label: i18n.msg('About'),
          //accelerator: 'Command+A',
          click: async function (menuItem, _browserWindow, _event) {
            await showAbout();
          },
        },],
    },
  ];
}

/**
 *
 */
function trayMenuTemplate(): Array<MenuItemConstructorOptions> {
  return [
    {
      label: i18n.msg('Tray / Untray'), click: function (menuItem, _browserWindow, _event) {
        g_mainWindow.isVisible() ? g_mainWindow.hide() : g_mainWindow.show();
      }
    },
    {
      label: i18n.msg('Switch Network'),
      click: async function (menuItem, _browserWindow, _event) {
        let changed = await promptUidSelect(false);
        if (changed) {
          await restart()
        }
      }
    },
    //{ label: 'Debug', submenu: debugMenuTemplate },
    {type: 'separator'},
    {
      label: i18n.msg('About'), click: async function (menuItem, _browserWindow, _event) {
        await showAbout();
      }
    },
    {type: 'separator'},
    {label: i18n.msg('Exit'), role: 'quit'}
  ];
}

/**************************************************************************************************
 * FINALIZE
 *************************************************************************************************/

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
// if (require('electron-squirrel-startup')) {
// eslint-disable-line global-require
// app.quit()
// }
