#!/bin/bash

TARGET=~/projects/decky-loader/plugins/decky-notes

bash "./build.sh"

mkdir -p $TARGET
cp -r dist $TARGET

cp package.json $TARGET/package.json
cp plugin.json $TARGET/plugin.json
cp main.py $TARGET/main.py

echo "Plugin exported"
