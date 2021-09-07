# where

Tooling for group self-awareness on holochain

##  Background

Groups, especially remote colaborative groups, often lack contextual information about collaborators that makes working together harder.  Co-locating oneself across a number of spaces in the context of a group (or groups) provides an important avenue for improving both sense-making and working together.  **Where** provides a generalized pattern for creating shared maps for groups to see the emergent "whereness" of each other across self-evolved sets of maps.

## Design

For more details read the [design documents](DESIGN.md).

## Installation

1. Install the holochain dev environment: https://developer.holochain.org/docs/install/
2. Clone this repo: `git clone https://github.com/holochain/where && cd ./where`
3. Enter the nix shell: `nix-shell`

## Building the DNA

- Build the DNA (assumes you are still in the nix shell for correct rust/cargo versions from step above):
  - Assemble the DNA:

```bash
cd zome
CARGO_TARGET_DIR=target cargo build --release --target wasm32-unknown-unknown
hc dna pack workdir/dna
hc app pack workdir/happ
```
### Running the DNA tests
```bash
cd zome/tests
npm run test
```

## UI

To test out the UI:

``` bash
cd ui
npm run start
```


## License
[![License: CAL 1.0](https://img.shields.io/badge/License-CAL%201.0-blue.svg)](https://github.com/holochain/cryptographic-autonomy-license)

  Copyright (C) 2021, Harris-Braun Enterprises, LLC

This program is free software: you can redistribute it and/or modify it under the terms of the license
provided in the LICENSE file (CAL-1.0).  This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.
