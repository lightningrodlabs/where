import { ContextProvider } from "@lit-labs/context";
import { state } from "lit/decorators.js";
import {
  WhereController,
  WhereSpace,
  whereContext,
  createWhereStore,
} from "@where/elements";
import {
  ProfilePrompt,
  ProfilesStore,
  profilesStoreContext,
} from "@holochain-open-dev/profiles";
import { AppWebsocket } from "@holochain/conductor-api";
import { HolochainClient } from "@holochain-open-dev/cell-client";
import { ScopedElementsMixin } from "@open-wc/scoped-elements";
import { LitElement, html } from "lit";

export class WhereApp extends ScopedElementsMixin(LitElement) {
  @state()
  loaded = false;

  async firstUpdated() {
    const appWebsocket = await AppWebsocket.connect(
      `ws://localhost:${process.env.HC_PORT}`
    );
    const appInfo = await appWebsocket.appInfo({
      installed_app_id: "where",
    });

    const cellData = appInfo.cell_data[0];
    const cellClient = new HolochainClient(appWebsocket, cellData);

    const store = new ProfilesStore(cellClient, {avatarMode: "avatar"})

    store.fetchAllProfiles()

    new ContextProvider(
      this,
      profilesStoreContext,
      store
    );

    new ContextProvider(this, whereContext, createWhereStore(cellClient, store));

    this.loaded = true;
  }

  render() {
    if (!this.loaded) return html`<span>Loading...</span>`;
    return html`
      <profile-prompt></profile-prompt>
      <where-controller></where-controller>
    `;
  }

  static get scopedElements() {
    return {
      "profile-prompt": ProfilePrompt,
      "where-controller": WhereController,
      "where-space": WhereSpace,
    };
  }
}
