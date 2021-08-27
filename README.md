# Reusable Module Template

This repository is meant to be a scaffolding starting point to build reusable holochain modules (zome & UI module).

This is what is has included:

- UI and Zome Instructions to use the module in a bigger app
- Github Actions automatic integration with building and testing
- Zome
  - Basic sample code
  - Integrated tests with tryorama
  - Instructions to include the zome as a crate in any DNA
- UI
  - Reusable CustomElements with `lit-element`
  - Automated demoing with `storybook`, also publishing to `gh-pages`
  - Automated testing with `web-test-runner`
  - Automated end-to-end testing with the holochain zome
  - See [open-wc](https://open-wc.org/) for all the available tools and documentation

## How to scaffold a holochain reusable module

1. Create a new repository from this template (you can use the `Use this template` button on the top of this page).
2. Look for all the `TODO` keyword to see the places that need to be changed. (NOTE: replacing it inside the files can easily be done with your IDE, and for renaming files & directories you can use this bash one-liner: `new_name=YOUR_NEW_NAME_HERE find . -name "*todo_rename*" | while read line ; do mv $line $(echo $line | sed 's/todo_rename/$new_name/g') ; done`)
3. Remove this section of this README.md until this next line.

---

# TODO_RENAME_MODULE

> TODO: carefully change whatever needed in this README.

Small zome to create and see calendar events, in holochain RSM.

This module is designed to be included in other DNAs, assuming as little as possible from those. It is packaged as a holochain zome, and an npm package that offers native Web Components that can be used across browsers and frameworks.

## Documentation

See our [`storybook`](https://holochain-open-dev.github.io/hc_zome_where).

## Installation and usage

### Including the zome in your DNA

1. Create a new folder in the `zomes` of the consuming DNA, with the name you want to give to this zome in your DNA.
2. Add a new `Cargo.toml` in that folder. In its content, paste the `Cargo.toml` content from any zome.
3. Change the `name` properties of the `Cargo.toml` file to the name you want to give to this zome in your DNA.
4. Add this zome as a dependency in the `Cargo.toml` file:

```toml
[dependencies]
hc_zome_where = {git = "https://github.com/lightningrodlabs/where-new", package = "hc_zome_where"}
```

5. Create a `src` folder besides the `Cargo.toml` with this content:

```rust
extern crate hc_zome_where;
```

6. Add the zome into your `dna.yaml` file with the name `todo_rename`.
7. Compile the DNA with the usual `CARGO_TARGET=target cargo build --release --target wasm32-unknown-unknown`.

### Including the UI

See the list of available elements [here](https://lightningrodlabs/where-new).

1. Install the module with `npm install "https://github.com/holochain-open-dev/todo_rename#ui-build"`.

2. Import and define the the elements you want to include:

```js
import ConductorApi from "@holochain/conductor-api";
import {
  MyCalendar,
  CalendarEventsService,
  CALENDAR_EVENTS_SERVICE_CONTEXT,
} from "@holochain-open-dev/todo_rename";
import { ContextProviderElement } from "@holochain-open-dev/context";

async function setupCalendarEvents() {
  const appWebsocket = await ConductorApi.AppWebsocket.connect(
    "ws://localhost:8888"
  );

  const appInfo = await appWebsocket.appInfo({
    installed_app_id: "test-app",
  });
  const cellId = appInfo.cell_data[0].cell_id;

  const service = new CalendarEventsService(appWebsocket, cellId);

  customElements.define("context-provider", ContextProviderElement);

  const provider = document.getElementById("provider");
  provider.name = CALENDAR_EVENTS_SERVICE_CONTEXT;
  provider.value = service;

  customElements.define("my-calendar", MyCalendar);
}
```

3. Include the elements in your html:

```html
<body>
  <context-provider id="provider">
    <my-calendar> </my-calendar>
  </context-provider>
</body>
```

Take into account that at this point the elements already expect a holochain conductor running at `ws://localhost:8888`.

You can see a full working example [here](/ui/demo/index.html).

## Developer Setup

See our [developer setup guide](/dev-setup.md).
