#!/bin/bash

# Script for writing zome hashes to files

# Compute hash of where zome
value=`./bin/hash_zome ./target/wasm32-unknown-unknown/release/where_zome.wasm`
echo "$value" > electron/bin/where_zome_hash.txt
echo
echo "     WHERE ZOME HASH = $value"

# Compute hash of ludotheque zome
value=`./bin/hash_zome ./target/wasm32-unknown-unknown/release/where_ludotheque_zome.wasm`
echo "$value" > electron/bin/ludotheque_zome_hash.txt
echo
echo "LUDOTHEQUE ZOME HASH = $value"
