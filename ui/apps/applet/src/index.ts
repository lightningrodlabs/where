import { WeGame } from '@lightningrodlabs/we-game';
import { HolochainClient } from '@holochain-open-dev/cell-client';
import { DnaHash } from '@holochain/client';
import { html, render } from 'lit';

import { WhereStore } from '@where/elements';
import { WhereApplet } from './where-applet';

const whereApplet: WeGame = {
  gameRenderers: (appWs, adminWs, weServices, gameInfo) => {
    const notebooksCell = gameInfo.cell_data.find(
      c => c.role_id === 'notebooks'
    )!;

    const whereStore = new WhereStore(
      new HolochainClient(appWs),
      weServices.profilesStore,
    );

    return {
      full: (rootElement: HTMLElement, registry: CustomElementRegistry) => {
        registry.define('where-applet', WhereApplet);

        render(
          html`<where-applet
            .profilesStore=${weServices.profilesStore}
          ></where-applet>`,
          rootElement
        );
      },
      blocks: [],
    };
  },
};

export default whereApplet;
