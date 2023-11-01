import {DEFAULT_WHERE_DEF} from "@where/elements";
import {HAPP_ENV, HappEnvType} from "@ddd-qc/lit-happ";

export let HC_APP_PORT: number;
export let HC_ADMIN_PORT: number;

/** override happ id when in Electron */
if (HAPP_ENV == HappEnvType.Electron) {
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

console.log("WHERE_HAPP_ID =", DEFAULT_WHERE_DEF.id)
console.log("  HC_APP_PORT =", HC_APP_PORT);
console.log("HC_ADMIN_PORT =", HC_ADMIN_PORT);
