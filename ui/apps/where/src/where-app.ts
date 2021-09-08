import { ContextProvider } from '@lit-labs/context';
import { WhereController, WhereSpace, whereContext, createWhereStore  } from "@where/elements"
import {
  ProfilePrompt,
  createProfilesStore,
  profilesStoreContext,
} from "@holochain-open-dev/profiles";
import { AppWebsocket } from "@holochain/conductor-api";
import { HolochainClient } from "@holochain-open-dev/cell-client";
import { ScopedElementsMixin } from '@open-wc/scoped-elements';
import { LitElement, html } from 'lit';

class WhereApp extends ScopedElementsMixin(LitElement) {
  static get properties() {
    return {
      loaded: {
        type: Boolean,
      },
    };
  }

  async firstUpdated() {
    const appWebsocket = await AppWebsocket.connect(
      'ws://localhost:8888'
    );
    const appInfo = await appWebsocket.appInfo({
      installed_app_id: 'where',
    });

    const cellData = appInfo.cell_data[0];
    const cellClient = new HolochainClient(appWebsocket, cellData);

    new ContextProvider(
      this,
      profilesStoreContext,
      createProfilesStore(cellClient)
    );

    new ContextProvider(
      this,
      whereContext,
      createWhereStore(cellClient)
    );

    this.loaded = true;
  }

  render() {
    if (!this.loaded) return html`<span>Loading...</span>`;
    return html`
<profile-prompt style="height: 400px; width: 500px">
<where-controller></where-controller>
</profile-prompt>
`;
  }

  static get scopedElements() {
    return {
      'profile-prompt': ProfilePrompt,
      'where-controller': WhereController,
      'where-space': WhereSpace
    };
  }
}
