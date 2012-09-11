#!/bin/bash

if [ -z "$ONE_SOURCE" ]; then
    echo "You must define ONE_SOURCE environment variable"
    exit -1
fi

EXTRA="$PWD/guest/*"
PACKAGER_DIR="$ONE_SOURCE/share/scripts/context-packages"

export PACKAGE_NAME=one-chef

cd $PACKAGER_DIR
./generate.sh $EXTRA



