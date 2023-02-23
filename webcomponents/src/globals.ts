
/**
 *
 */
// export interface IpcRendererApi {
//   send: (channel: string) => void,
//   on: (channel: string, listener: (event: any, ...args: any[]) => void) => this;
//   newMailSync: (title: string, body: string)  => unknown,
//   startingInfo: (startingHandle, dnaHash)  => string,
//   newCountAsync: (newCount)  => unknown,
//   BUILD_MODE: string,
//   versions: {
//     node: string,
//     chrome: string,
//     electron: string,
//   }
// }


/** APP SETUP */

export let BUILD_MODE: string;
export const MY_ELECTRON_API = 'electronBridge' in window? window.electronBridge as any : undefined;
export const IS_ELECTRON = typeof MY_ELECTRON_API !== 'undefined'
 if (MY_ELECTRON_API) {
   BUILD_MODE = MY_ELECTRON_API.BUILD_MODE;
 } else {
   try {
     BUILD_MODE = process.env.BUILD_MODE;
   } catch (e) {
     console.log("BUILD_MODE not defined. Defaulting to 'prod'");
     BUILD_MODE = 'prod';
   }
}

export const IS_DEV = BUILD_MODE === 'dev';

console.log("BUILD_MODE =", BUILD_MODE)
console.log("IS_ELECTRON =", IS_ELECTRON);

/** Remove console.log() in PROD */
if (BUILD_MODE === 'prod') {
  console.log("console.log() disabled");
  console.log = () => {};
}
