#!/bin/sh

# Script for updating version number across the code base

# Check pre-conditions
if [ $# != 1 ]; then
  echo 1>&2 "$0: Aborting. Missing argument: new version number"
  exit 2
fi

for pkg in moss-tool webcomponents webapp webapp.ludotheque; do
  OLD_VER=`awk -F ":" '/"version"/ {print $2}' ./$pkg/package.json | sed 's/"//g' | sed 's/,//g' | sed 's/ //g'`
  echo "./$pkg/package.json $OLD_VER -> $1"
  sed -i "s/\"version\": \"$OLD_VER\"/\"version\": \"$1\"/" ./$pkg/package.json
done
