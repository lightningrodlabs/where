/** Smoke test: install-time init + the ZomeFnInput read API against a running 0.7.1 sandbox */
import {AdminWebsocket, AppWebsocket, encodeHashToBase64} from "@holochain/client";

const ADMIN = Number(process.argv[2]); const APP = Number(process.argv[3]);
const admin = await AdminWebsocket.connect({url: new URL(`ws://127.0.0.1:${ADMIN}`), wsClientOptions: {origin: "smoke"}});
const apps = await admin.listApps({});
console.log("apps:", apps.map((a) => [a.installed_app_id, a.status]));
const appId = apps[0].installed_app_id;
const token = (await admin.issueAppAuthenticationToken({installed_app_id: appId})).token;
const app = await AppWebsocket.connect({url: new URL(`ws://127.0.0.1:${APP}`), token, wsClientOptions: {origin: "smoke"}});
const info = await app.appInfo();
console.log("roles:", Object.keys(info.cell_info));
for (const [role, cells] of Object.entries(info.cell_info)) {
  console.log(" ", role, cells.map((c) => c.type));
}
const whereCell = info.cell_info["rWhere"].find((c) => c.type === "provisioned").value;
const cell_id = whereCell.cell_id;
console.log("rWhere dna:", encodeHashToBase64(cell_id[0]));
await admin.authorizeSigningCredentials(cell_id);
const call = (zome_name, fn_name, payload) => app.callZome({cell_id, zome_name, fn_name, payload}, 30000);

/** playset */
const templateEh = await call("zPlayset", "create_template", {name: "Smoke template", surface: JSON.stringify({size: {x: 100, y: 100}})});
console.log("create_template ->", templateEh);
const templates = await call("zPlayset", "get_templates", {input: null, local: true});
console.log("get_templates(local) ->", templates.length, templates[0].content.name);
const spaceEh = await call("zPlayset", "create_space", {name: "Smoke space", origin: templateEh, surface: "{}", maybeMarkerPiece: null, meta: {}});
console.log("create_space ->", spaceEh);
const space = await call("zPlayset", "get_space", {input: spaceEh, local: true});
console.log("get_space(local) ->", space.name);
const spacesNet = await call("zPlayset", "get_spaces", {input: null, local: false});
console.log("get_spaces(network) ->", spacesNet.length);
const inventory = await call("zPlayset", "get_inventory", {input: null});
console.log("get_inventory(default local) ->", inventory);

/** where */
const sessionEhs = await call("zWhere", "create_sessions", {spaceEh, sessionNames: ["global"]});
console.log("create_sessions ->", sessionEhs);
const sessions = await call("zWhere", "get_space_sessions", {input: spaceEh, local: true});
console.log("get_space_sessions ->", sessions);
const sessionEh = await call("zWhere", "get_session", {input: {spaceEh, index: 0}, local: true});
console.log("get_session ->", sessionEh);
const session = await call("zWhere", "get_session_from_eh", {input: sessionEh});
console.log("get_session_from_eh ->", session);
const linkAh = await call("zWhere", "add_here", {spaceEh, sessionIndex: 0, value: JSON.stringify({x: 1, y: 2}), meta: {tag: "me"}});
console.log("add_here ->", linkAh);
const heres = await call("zWhere", "get_heres", {input: sessionEh, local: true});
console.log("get_heres(local) ->", heres.map((h) => [h.entry.value, h.author === encodeHashToBase64(cell_id[1])]));
const [nextEh, nextIdx] = await call("zWhere", "create_next_session", {spaceEh, name: "second"});
console.log("create_next_session ->", nextIdx);
await call("zWhere", "hide_space", spaceEh);
console.log("get_hidden_spaces ->", await call("zWhere", "get_hidden_spaces", {input: null, local: true}));
await call("zWhere", "unhide_space", spaceEh);
console.log("get_hidden_spaces after unhide ->", await call("zWhere", "get_hidden_spaces", {input: null, local: true}));
await call("zWhere", "delete_here", linkAh);
console.log("get_heres after delete ->", (await call("zWhere", "get_heres", {input: sessionEh, local: true})).length);
/** profiles */
await call("profiles", "create_profile", [{nickname: "smoke", fields: {}}, cell_id[1]]);
const me = await call("profiles", "find_profile_from_local", cell_id[1]);
console.log("find_profile_from_local ->", me && me[1].nickname);
/** remote signal to self (exercises recv_remote_signal cap grant) */
app.on("signal", (s) => console.log("SIGNAL received:", s.type, s.value?.payload?.message?.type));
await call("zWhere", "notify_peers", {signal: {maybeSpaceHash: spaceEh, from: encodeHashToBase64(cell_id[1]), message: {type: "Ping", content: encodeHashToBase64(cell_id[1])}}, peers: [encodeHashToBase64(cell_id[1])]});
await new Promise((r) => setTimeout(r, 3000));
console.log("SMOKE OK");
process.exit(0);
