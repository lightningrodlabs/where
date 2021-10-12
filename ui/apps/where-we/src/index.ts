import { AppWebsocket, InstalledCell } from "@holochain/conductor-api";
import { html, render } from "lit";

import { WhereApp } from "./where-app";
import { ScopedElementsHost } from "@open-wc/scoped-elements/types/src/types";

export default function (appWebsocket: AppWebsocket, cellData: InstalledCell) {
  return {
    full(element: HTMLElement, host: ScopedElementsHost) {
      host.defineScopedElement("where-app", WhereApp);
      element.innerHTML = `<where-app></where-app>`;
      let app = (element.querySelector('where-app') as any)
      app.appWebsocket = appWebsocket
      app.cellData = cellData
    },
    blocks: [],
  };
}
