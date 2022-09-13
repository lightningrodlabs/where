#!/bin/bash

# assumes that dna/workdir/dna/where.dna
# is already pre-compiled and up to date
# In CI this is handled via .github/workflows/release.yml
# where it calls install-hc-tools and and dna-pack

# ensure all necessary binaries are packaged in the app
#rm -rf electron/bin
#mkdir electron/bin
#cp dna/workdir/dna-ludotheque/where.dna electron/bin/where.dna
cp dna/workdir/happ-where/where.happ electron/bin/where.happ

#cp dna/where_zome_hash.txt electron/bin

bash scripts/copy-binaries.sh

# ui
npm run build:ui
