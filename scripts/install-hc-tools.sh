#!/bin/bash

rustc --version
rustup install 1.61.0
rustup override set 1.61.0

# install wasm32 compilation target
rustup target install wasm32-unknown-unknown

# install `hc` cli tool
# KEEP THIS IN SYNC
cargo install holochain_cli --version 0.0.52
