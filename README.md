# where

Tooling for group self-awareness on holochain

##  Background

Groups, especially remote colaborative groups, often lack contextual information about collaborators that makes working together harder.  Co-locating oneself across a number of spaces in the context of a group (or groups) provides an important avenue for improving both sense-making and working together.  **Where** provides a generalized pattern for creating shared maps for groups to see the emergent "whereness" of each other across self-evolved sets of maps.

Initial prototype:
![screencast](spec/where.gif)

## Design

For more details read the [design documents](spec/DESIGN.md).

## Dev testing

### Setup
1. Install the required tools
  1. Rust wasm target: `npm run install:rust`
  1. [`holochain`](https://github.com/holochain/holochain): `cargo install holochain` (or use nix-shell)
  4. `npm run install:hc`
  3. `npm run install:zits`
4. `npm install`
5. `npm run install:submodules`
5. `npm run install:hash-zome`
5. `npm run build:localize`

### Web
`npm run devtest`

### Electron
`npm run devtest:electron`


## Network

To bootstrap a network of N agents:

``` bash
npm run network 3
```

Replace the "3" for the number of agents you want to bootstrap.
## Package

To package the web-happ:

``` bash
npm run package:webapp
```

All output files (`*.webhapp`, `*.dna`, `*.happ`, etc.) will be in the `artifacts` folder.


## Project structure

| Directory                                  | Description                                                                                                                 |
|:-------------------------------------------| :-------------------------------------------------------------------------------------------------------------------------- |
| `/dna/`                                    | DNA source code
| `/electron/`                               | Electron app directory
| &nbsp;&nbsp;&nbsp;&nbsp;`bin/`             | All the binaries we are dependent on and must ship with the app
| &nbsp;&nbsp;&nbsp;&nbsp;`src/`             | The electron app source code
| &nbsp;&nbsp;&nbsp;&nbsp;`web/`             | Final artifacts for the electron app (includes output from `webapp`)
| `/webapp/`                                 | The Where webapp source code
| &nbsp;&nbsp;&nbsp;&nbsp;`webhapp.workdir/` | webhapp work directory
| `/webapp.ludotheque/`                      | The Ludotheque standalone webapp source code
| `/webcomponents/`                          | The web components source code
| `/we-applet/`                              | The applet for We integration

## License
[![License: CAL 1.0](https://img.shields.io/badge/License-CAL%201.0-blue.svg)](https://github.com/holochain/cryptographic-autonomy-license)

  Copyright (C) 2021, Harris-Braun Enterprises, LLC

This program is free software: you can redistribute it and/or modify it under the terms of the license
provided in the LICENSE file (CAL-1.0).  This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.
