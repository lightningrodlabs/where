# where

Tooling for group self-awareness on holochain

##  Background

Groups, especially remote colaborative groups, often lack contextual information about collaborators that makes working together harder.  Co-locating oneself across a number of spaces in the context of a group (or groups) provides an important avenue for improving both sense-making and working together.  **Where** provides a generalized pattern for creating shared maps for groups to see the emergent "whereness" of each other across self-evolved sets of maps.

Initial prototype:
![screencast](spec/where.gif)

## Design

For more details read the [design documents](spec/DESIGN.md).

## Dev testing

Where runs on **Holochain 0.7.1** and is built as a **Moss Tool** (`moss-tool/`).
See [UPGRADE-0.7.md](UPGRADE-0.7.md) for what changed in the 0.7 upgrade.

### Setup
Enter the nix dev shell first (holonix `main-0.7`: `holochain`, `hc`, `lair-keystore`,
`kitsune2-bootstrap-srv`, Rust with the wasm target, node 22), then install:

``` bash
nix develop
npm install
npm run build:localize
```

Run every other command from inside that shell.

Without nix: install Rust + the wasm target (`npm run install:rust`), fetch the 0.7.1
binaries into `bin/` with `npm run install:hc`, put `bin/` and a `lair-keystore` 0.7.x on
your PATH. `npm run install:zits` is only needed to regenerate the TS bindings.

### Build
- `npm run build:happ` builds the zomes and packs `artifacts/where.happ` (and the ludotheque happ)
- `npm run build:bindings` regenerates the zome TS bindings with zits
- `npm run build:webapp` builds the standalone webapp

### Run in Moss (Tool dev mode)
`npm run start:moss` builds the happ and launches two Moss agents with the Tool served
by a live vite server (`weave.dev.config.ts`). `npm run launch:moss` skips the happ build,
and the `-1` variants (`start:moss-1`, `launch:moss-1`) run a single agent.

### Run standalone in a browser
`npm run devtest` builds the happ and starts a sandbox conductor plus the webapp dev server.
`npm run smoke` (with `HC_ADMIN_PORT`/`HC_APP_PORT` set to a running sandbox) exercises the zome API.

## Package

To package the Moss Tool webhapp:

``` bash
npm run package
```

All output files (`*.webhapp`, `*.dna`, `*.happ`, etc.) will be in the `artifacts` folder.


## Project structure

| Directory                                  | Description                                                                                                                 |
|:-------------------------------------------| :-------------------------------------------------------------------------------------------------------------------------- |
| `/dna/`                                    | DNA source code
| `/electron/`                               | Electron app directory (not upgraded to Holochain 0.7, not part of the npm workspaces)
| `/webapp/`                                 | The Where webapp source code
| &nbsp;&nbsp;&nbsp;&nbsp;`webhapp.workdir/` | webhapp work directory
| `/webapp.ludotheque/`                      | The Ludotheque standalone webapp source code
| `/webcomponents/`                          | The web components source code
| `/moss-tool/`                              | The Moss Tool (Weave) integration

## License
[![License: CAL 1.0](https://img.shields.io/badge/License-CAL%201.0-blue.svg)](https://github.com/holochain/cryptographic-autonomy-license)

  Copyright (C) 2021, Harris-Braun Enterprises, LLC

This program is free software: you can redistribute it and/or modify it under the terms of the license
provided in the LICENSE file (CAL-1.0).  This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.
