const { contextBridge, ipcRenderer } = require('electron')

console.log("Electron preload. HAPP_BUILD_MODE = " + JSON.stringify(process.env.HAPP_BUILD_MODE));
const BUILD_MODE = process.env.HAPP_BUILD_MODE? process.env.HAPP_BUILD_MODE : 'Retail';

/** Define and add 'electronBridge' to 'window' */

const electronBridge = {
  send: (channel) => {ipcRenderer.send(channel)},
  on: (channel, listener) => {ipcRenderer.on(channel, listener)},
  sendSync: (channel, ...args) => {ipcRenderer.sendSync(channel, args)},
  BUILD_MODE,
  versions: {
    node: process.versions.node,
    chrome: process.versions.chrome,
    electron: process.versions.electron,
  }
};


contextBridge.exposeInMainWorld('electronBridge', electronBridge)
