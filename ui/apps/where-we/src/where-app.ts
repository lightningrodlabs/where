import { ContextProvider } from "@lit-labs/context";
import { property, state } from "lit/decorators.js";
import {
  WhereController,
  WhereSpace,
  WhereStore,
  whereContext,
} from "@where/elements";
import {
  ProfilePrompt,
  ProfilesStore,
  profilesStoreContext,
} from "@holochain-open-dev/profiles";
import { AppWebsocket, CellId, InstalledCell } from "@holochain/conductor-api";
import { HolochainClient } from "@holochain-open-dev/cell-client";
import { ScopedElementsMixin } from "@open-wc/scoped-elements";
import { LitElement, html } from "lit";

export class WhereApp extends ScopedElementsMixin(LitElement) {
  @property()
  appWebsocket!: AppWebsocket;
  @property()
  cellData!: InstalledCell;

  @state()
  loaded = false;

  async firstUpdated() {
    const cellClient = new HolochainClient(this.appWebsocket, this.cellData);
    const store = new ProfilesStore(cellClient, { avatarMode: "avatar" });

    store.fetchAllProfiles();

    new ContextProvider(this, profilesStoreContext, store);

    new ContextProvider(this, whereContext, new WhereStore(cellClient, store));

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
