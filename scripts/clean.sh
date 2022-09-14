#!/bin/bash

# TOP LEVEL
rm -rf .hc*
rm -rf node_modules
rm package-lock.json
# ELECTRON
rm -rf electron/bin/lair*
rm -rf electron/bin/holochain*
rm -rf electron/node_modules
rm -rf electron/dist
rm -rf electron/out
rm electron/web/*.js
rm electron/web/*.map
rm electron/package-lock.json
# DNA
rm -rf dna/tests/node_modules
# WE-APPLET
rm -rf we-applet/node_modules/
rm -rf we-applet/out-tsc/
rm -rf we-applet/dist/
rm we-applet/.hc*
rm we-applet/tsconfig.tsbuildinfo
# WEBAPP
rm -rf webapp/node_modules/
rm -rf webapp/dist/
rm -rf webapp/out-tsc/
rm webapp/package-lock.json
#WEBAPP LUDOTHEQUE
rm -rf webapp.ludotheque/ludotheque/node_modules/
rm -rf webapp.ludotheque/ludotheque/dist/
rm -rf webapp.ludotheque/ludotheque/out-tsc/
rm webapp.ludotheque/ludotheque/package-lock.json
# WEBCOMPONENTS
rm -rf webcomponents/node_modules
rm webcomponents/package-lock.json
