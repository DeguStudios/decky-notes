#!/bin/bash

bash "./build.sh"

PLUGIN_NAME=deckyNotes
TARGET=$PLUGIN_NAME
ZIP_NAME=$PLUGIN_NAME-v0.0.0.zip

rm -rf $TARGET
rm $ZIP_NAME

mkdir -p $TARGET
cp -r dist $TARGET
cp -r bin $TARGET

cp package.json $TARGET/package.json
cp plugin.json $TARGET/plugin.json
cp main.py $TARGET/main.py
cp README.md $TARGET/README.md

zip -r $ZIP_NAME $TARGET

rm -rf $TARGET

echo "Package generated"
