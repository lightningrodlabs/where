#!/bin/bash

rm -rf .hc*

rm -rf electron/bin/lair*
rm -rf electron/bin/holochain*
rm -rf electron/node_modules
rm -rf electron/node_modules
rm -rf electron/dist
rm -rf electron/out
rm electron/package-lock.json

rm -rf node_modules
rm -rf test/node_modules
rm -rf ui/lib/node_modules

rm -rf ui/apps/where/node_modules/
rm -rf ui/apps/where/dist/
rm -rf ui/apps/where/out-tsc/
rm -rf ui/apps/ludotheque/node_modules/
rm -rf ui/apps/ludotheque/dist/
rm -rf ui/apps/ludotheque/out-tsc/

rm package-lock.json
rm ui/lib/package-lock.json
rm ui/apps/where/package-lock.json
rm ui/apps/ludotheque/package-lock.json
