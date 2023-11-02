#!/bin/bash

# TOP LEVEL
rm -rf .hc*
rm -rf target
# WEBCOMPONENTS
rm -rf webcomponents/dist
rm -rf webcomponents/src/generated
rm webcomponents/tsconfig.tsbuildinfo
# WE-APPLET
rm -rf we-applet/.rollup.cache/
rm -rf we-applet/out-tsc/
rm -rf we-applet/dist/
rm we-applet/.hc*
rm we-applet/tsconfig.tsbuildinfo
rm we-applet/webhapp.workdir/*.webhapp
# WEBAPP
rm -rf webapp/dist/
rm -rf webapp/out-tsc/
rm webapp/tsconfig.tsbuildinfo
#WEBAPP LUDOTHEQUE
rm -rf webapp.ludotheque/dist/
rm -rf webapp.ludotheque/out-tsc/
rm webapp.ludotheque/tsconfig.tsbuildinfo
# ELECTRON
rm -rf electron/bin/lair*
rm -rf electron/bin/holochain*
rm -rf electron/dist
rm -rf electron/out
rm electron/web/*.js
rm electron/web/*.map
rm electron/tsconfig.tsbuildinfo
