#!/bin/bash

# TOP LEVEL
rm -rf .hc*
rm -rf target
# WEBCOMPONENTS
rm -rf webcomponents/dist
rm -rf webcomponents/src/generated
rm -f webcomponents/tsconfig.tsbuildinfo
# MOSS TOOL
rm -rf moss-tool/dist/
rm -f moss-tool/.hc*
rm -f moss-tool/webhapp.workdir/*.webhapp
# WEBAPP
rm -rf webapp/dist/
rm -rf webapp/src/generated
# WEBAPP LUDOTHEQUE
rm -rf webapp.ludotheque/dist/
rm -f webapp.ludotheque/tsconfig.tsbuildinfo
