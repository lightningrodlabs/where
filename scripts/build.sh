#!/bin/bash

# assumes that dna/workdir/dna/where.dna
# is already pre-compiled and up to date
# In CI this is handled via .github/workflows/release.yml
# where it calls install-hc-tools and and dna-pack

# ensure all necessary binaries are packaged in the app
#rm -rf electron/binaries
#mkdir electron/binaries
cp dna/workdir/dna-ludotheque/where.dna electron/binaries/where.dna
cp dna/workdir/happ-where/where.happ electron/binaries/where.happ
cp dna/where_zome_hash.txt electron/binaries

bash scripts/copy-binaries.sh

# ui
npm run build:ui
