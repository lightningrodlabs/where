#!/bin/bash

# TOP LEVEL
rm -rf .hc*
rm -rf node_modules
rm package-lock.json
# DNA
rm -rf dna/tests/node_modules
# WEBCOMPONENTS
rm -rf webcomponents/dist
rm -rf webcomponents/node_modules
rm -rf webcomponents/src/generated
rm webcomponents/package-lock.json
rm webcomponents/tsconfig.tsbuildinfo
# WE-APPLET
rm -rf we-applet/.rollup.cache/
rm -rf we-applet/node_modules/
rm -rf we-applet/out-tsc/
rm -rf we-applet/dist/
rm we-applet/.hc*
rm we-applet/tsconfig.tsbuildinfo
rm we-applet/webhapp.workdir/where-applet.webhapp
# WEBAPP
rm -rf webapp/node_modules/
rm -rf webapp/dist/
rm -rf webapp/out-tsc/
rm webapp/package-lock.json
rm webapp/tsconfig.tsbuildinfo
#WEBAPP LUDOTHEQUE
rm -rf webapp.ludotheque/node_modules/
rm -rf webapp.ludotheque/dist/
rm -rf webapp.ludotheque/out-tsc/
rm webapp.ludotheque/package-lock.json
rm webapp.ludotheque/tsconfig.tsbuildinfo
# ELECTRON
rm -rf electron/bin/lair*
rm -rf electron/bin/holochain*
rm -rf electron/node_modules
rm -rf electron/dist
rm -rf electron/out
rm electron/web/*.js
rm electron/web/*.map
rm electron/package-lock.json
rm electron/tsconfig.tsbuildinfo
