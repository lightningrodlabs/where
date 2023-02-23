import {BUILD_MODE, DEFAULT_WHERE_DEF, IS_ELECTRON} from "@where/elements";


/** -- BUILD_MODE & IS_ELECTRON -- */

// export let BUILD_MODE: string;
// export const MY_ELECTRON_API = 'electronBridge' in window? window.electronBridge as any : undefined;
// export const IS_ELECTRON = typeof MY_ELECTRON_API !== 'undefined'
// if (MY_ELECTRON_API) {
//   BUILD_MODE = MY_ELECTRON_API.BUILD_MODE;
// } else {
//   try {
//     BUILD_MODE = process.env.BUILD_MODE;
//   } catch (e) {
//     console.log("BUILD_MODE not set. Defaulting to prod.")
//     BUILD_MODE = 'prod';
//   }
// }
//
// export const IS_DEV = BUILD_MODE === 'dev';
//
// console.log("BUILD_MODE =", BUILD_MODE);
// console.log("IS_ELECTRON =", IS_ELECTRON);


/** -- HC_APP_PORT & friends -- */

export let HC_APP_PORT: number;
export let HC_ADMIN_PORT: number;
/** override happ id  when in Electron */
if (IS_ELECTRON) {
  const APP_ID = 'main-app'
  const searchParams = new URLSearchParams(window.location.search);
  const urlPort = searchParams.get("APP");
  if(!urlPort) {
    console.error("Missing APP value in URL", window.location.search)
  }
  HC_APP_PORT = Number(urlPort);
  const urlAdminPort = searchParams.get("ADMIN");
  HC_ADMIN_PORT = Number(urlAdminPort);
  const NETWORK_ID = searchParams.get("UID");
  console.log(NETWORK_ID)
  DEFAULT_WHERE_DEF.id = APP_ID + '-' + NETWORK_ID;  // override installed_app_id
} else {
  try {
    HC_APP_PORT = Number(process.env.HC_APP_PORT);
    HC_ADMIN_PORT = Number(process.env.HC_ADMIN_PORT);
  } catch (e) {
    console.log("HC_APP_PORT not defined")
  }
}

console.log("HAPP_ID =", DEFAULT_WHERE_DEF.id)
console.log("HC_APP_PORT =", HC_APP_PORT);
console.log("HC_ADMIN_PORT =", HC_ADMIN_PORT);


/** Remove console.log() in PROD */
if (BUILD_MODE === 'prod') {
  console.log("console.log() disabled");
  console.log = () => {};
}
