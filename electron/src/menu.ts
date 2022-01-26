
import {app, dialog, Menu, MenuItem, MenuItemConstructorOptions, shell} from "electron";

import {APP_DATA_PATH} from "./constants";

import {electronLogger} from "./logger"

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


/**
 * In this file you can include the rest of your app's specific main process code.
 * You can also put them in separate files and require them here.
 */
const networkMenuTemplate: Array<MenuItemConstructorOptions> = [
  {
    id: 'join-network',
    label: 'Join new Network',
    click: async function (menuItem, browserWindow, _event) {
      // let changed = await promptUid(false);
      // if (changed) {
      //   await browserWindow.loadURL(g_switchingUrl);
      //   await browserWindow.setEnabled(false);
      //   await installApp(g_adminWs, g_uid);
      //   await startConductorAndLoadPage(false);
      //   await browserWindow.setEnabled(true);
      // }
    },
  },
  {
    id: 'switch-network',
    label: 'Switch Network',
    click: async function (menuItem, _browserWindow, _event) {
      // let changed = await promptUidSelect(false);
      // if (changed) {
      //   await g_mainWindow.loadURL(g_switchingUrl);
      //   await g_mainWindow.setEnabled(false);
      //   await startConductorAndLoadPage(false);
      //   await g_mainWindow.setEnabled(true);
      // }
    },
  },
  {
    type: 'separator'
  },
  {
    label: 'Change Network type',
    click: async function (menuItem, _browserWindow, _event) {
      // let changed = await promptNetworkType(false);
      // let menu = Menu.getApplicationMenu();
      // menu.getMenuItemById('join-network').enabled = !g_canMdns;
      // menu.getMenuItemById('switch-network').enabled = !g_canMdns;
      // menu.getMenuItemById('change-bootstrap').enabled = !g_canMdns;
      // if (changed) {
      //   await startConductorAndLoadPage(true);
      // }
    },
  },
  {
    id: 'change-bootstrap',
    label: 'Change Bootstrap Server',
    click: async function (menuItem, _browserWindow, _event) {
      // let changed = await promptBootstrapUrl(false);
      // if (changed) {
      //   await startConductorAndLoadPage(true);
      // }
    }
  },
  {
    label: 'Change Proxy Server',
    click: async function (menuItem, _browserWindow, _event) {
      // const prevCanProxy = g_canProxy;
      // let canProxy = await promptCanProxy();
      // const proxyChanged = prevCanProxy !== canProxy;
      // if (canProxy) {
      //   let changed = await promptProxyUrl(false);
      //   if(changed || proxyChanged) {
      //     await startConductorAndLoadPage(true);
      //   }
      // } else  {
      //   if(proxyChanged) {
      //     await startConductorAndLoadPage(true);
      //   }
      // }
    }
  },
];


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
    label: 'Restart Conductor', click: async function (menuItem, _browserWindow, _event) {
      //await startConductorAndLoadPage(false);
    }
  },
  {
    label: 'Reload window', click: async function (menuItem, browserWindow, _event) {
      browserWindow.reload();
    }
  },

];


/**
 *
 */
export const mainMenuTemplate: Array<MenuItemConstructorOptions> = [
  {
    label: 'File', submenu: [{
      label:`Check for Update`,
      click: function (menuItem, _browserWindow, _event) {
        //checkForUpdates(this);
      }
    }, {
      label: 'Quit',
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
    label: 'Network',
    submenu: networkMenuTemplate,
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
    label: 'Help', submenu: [{
      label: 'Report bug / issue',
      click: function (menuItem, _browserWindow, _event) {
        shell.openExternal(`https://github.com/lightningrodlabs/where/issues/new`)
      }
    },
      {
        type: 'separator'
      },
      {
        label: 'About',
        //accelerator: 'Command+A',
        click: async function (menuItem, _browserWindow, _event) {
          //await showAbout();
        },
      },],
  },
];


/**
 *
 */
// const trayMenuTemplate: Array<MenuItemConstructorOptions> = [
//   { label: 'Tray / Untray', click: function (menuItem, _browserWindow, _event) {
//     // g_mainWindow.isVisible()? g_mainWindow.hide() : g_mainWindow.show();
//     }
//   },
//   //{ label: 'Settings', submenu: networkMenuTemplate },
//   {
//     label: 'Switch network',
//     click: async function (menuItem, _browserWindow, _event) {
//       // let changed = await promptUidSelect(false);
//       // if(changed) {
//       //   await g_mainWindow.setEnabled(false);
//       //   await startConductorAndLoadPage(false);
//       //   await g_mainWindow.setEnabled(true);
//       // }
//     }
//   },
//   //{ label: 'Debug', submenu: debugMenuTemplate },
//   { type: 'separator' },
//   { label: 'About', click: async function (menuItem, _browserWindow, _event) { /*await showAbout();*/ } },
//   { type: 'separator' },
//   { label: 'Exit', click: function (menuItem, _browserWindow, _event) { app.quit() } }
// ];



