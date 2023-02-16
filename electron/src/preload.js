const { contextBridge, ipcRenderer } = require('electron')

const BUILD_MODE = process.env.BUILD_MODE? process.env.BUILD_MODE : 'prod';

console.log("Electron preload. BUILD_MODE = " + JSON.stringify(process.env.BUILD_MODE));

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
