#!/bin/bash

echo $OSTYPE

if [[ $OSTYPE == 'darwin'* ]]; then
  cp node_modules/electron-holochain/binaries/lair-keystore electron/binaries/lair-keystore
  cp node_modules/electron-holochain/binaries/holochain-runner electron/binaries/holochain-runner
elif [[ $OSTYPE == 'linux-gnu'* ]]; then
  cp node_modules/electron-holochain/binaries/lair-keystore electron/binaries/lair-keystore
  cp node_modules/electron-holochain/binaries/holochain-runner electron/binaries/holochain-runner
elif [[ $OSTYPE == "cygwin" ]]; then
  # POSIX compatibility layer and Linux environment emulation for Windows
  cp node_modules/electron-holochain/binaries/lair-keystore.exe electron/binaries/lair-keystore.exe
  cp node_modules/electron-holochain/binaries/holochain-runner.exe electron/binaries/holochain-runner.exe
elif [[ $OSTYPE == "msys" ]]; then
  # Lightweight shell and GNU utilities compiled for Windows (part of MinGW)
  cp node_modules/electron-holochain/binaries/lair-keystore.exe electron/binaries/lair-keystore.exe
  cp node_modules/electron-holochain/binaries/holochain-runner.exe electron/binaries/holochain-runner.exe
fi
