import { AppWebsocket, InstalledCell } from "@holochain/conductor-api";
import { html, render } from "lit";

import { WhereApp } from "./where-app";

export default function (appWebsocket: AppWebsocket, cellData: InstalledCell) {
  return {
    full(element: HTMLElement, registry: CustomElementRegistry) {
      registry.define("where-app", WhereApp);
      render(
        html`<where-app
          .appWebsocket=${appWebsocket}
          .cellData=${cellData}
        ></where-app>`,
        element
      );
    },
    blocks: [],
  };
}
