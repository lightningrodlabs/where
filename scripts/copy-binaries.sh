#!/bin/bash

echo $OSTYPE

if [[ $OSTYPE == 'darwin'* ]]; then
  cp node_modules/@lightningrodlabs/electron-holochain/binaries/lair-keystore electron/bin/lair-keystore
  cp node_modules/@lightningrodlabs/electron-holochain/binaries/holochain-runner electron/bin/holochain-runner
elif [[ $OSTYPE == 'linux-gnu'* ]]; then
  cp node_modules/@lightningrodlabs/electron-holochain/binaries/lair-keystore electron/bin/lair-keystore
  cp node_modules/@lightningrodlabs/electron-holochain/binaries/holochain-runner electron/bin/holochain-runner
elif [[ $OSTYPE == "cygwin" ]]; then
  # POSIX compatibility layer and Linux environment emulation for Windows
  cp node_modules/@lightningrodlabs/electron-holochain/binaries/lair-keystore.exe electron/bin/lair-keystore.exe
  cp node_modules/@lightningrodlabs/electron-holochain/binaries/holochain-runner.exe electron/bin/holochain-runner.exe
elif [[ $OSTYPE == "msys" ]]; then
  # Lightweight shell and GNU utilities compiled for Windows (part of MinGW)
  cp node_modules/@lightningrodlabs/electron-holochain/binaries/lair-keystore.exe electron/bin/lair-keystore.exe
  cp node_modules/@lightningrodlabs/electron-holochain/binaries/holochain-runner.exe electron/bin/holochain-runner.exe
fi
