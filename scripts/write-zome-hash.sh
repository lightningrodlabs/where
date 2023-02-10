#!/bin/bash
set -e

# Script for writing zome hashes to files

echo Executing \"$0\".

# Check pre-conditions
if [ $# != 1 ]; then
  echo 1>&2 "$0: Aborting. Missing argument: bin folder path"
  exit 2
fi

binFoloder=$1

# Compute hash of where zome
value=`$binFoloder/hash_zome ./target/wasm32-unknown-unknown/release/where_zome.wasm`
echo "$value" > electron/bin/where_zome_hash.txt
echo
echo "     WHERE ZOME HASH = $value"

# Compute hash of ludotheque zome
value=`$binFoloder/hash_zome ./target/wasm32-unknown-unknown/release/where_ludotheque_zome.wasm`
echo "$value" > electron/bin/ludotheque_zome_hash.txt
echo
echo "LUDOTHEQUE ZOME HASH = $value"
