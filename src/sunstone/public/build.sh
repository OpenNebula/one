#!/bin/bash

#-------------------------------------------------------------------------------
usage() {
 echo
 echo "Usage: build.sh [-d] [-c] [-h]"
 echo
 echo "-d: install build dependencies (bower, grunt)"
 echo "-c: clean build"
 echo "-h: prints this help"
}

clean() {
    rm -rf dist node_modules bower_components
}

dependencies() {
    npm install bower
    npm install grunt
    npm install grunt-cli

    export PATH=$PATH:$PWD/node_modules/.bin
}

install_patch() {

    npm install

    bower install --force --allow-root --config.interactive=false

    grunt --gruntfile ./Gruntfile.js sass

    grunt --gruntfile ./Gruntfile.js requirejs

    mv dist/main.js dist/main-dist.js

    mv dist/main.js.map dist/main-dist.js.map

    PATCH_DIR="./patches/"

    for i in `ls ${PATCH_DIR}` ; do
        if [ -f "${PATCH_DIR}/$i" ]; then
            patch -p1 <"${PATCH_DIR}/$i"
        fi
    done
}
#-------------------------------------------------------------------------------

PARAMETERS="dch"

if [ $(getopt --version | tr -d " ") = "--" ]; then
    TEMP_OPT=`getopt $PARAMETERS "$@"`
else
    TEMP_OPT=`getopt -o $PARAMETERS -n 'build.sh' -- "$@"`
fi

DEPENDENCIES="no"
CLEAN="no"

eval set -- "$TEMP_OPT"

while true ; do
    case "$1" in
        -d) DEPENDENCIES="yes"   ; shift ;;
        -c) CLEAN="yes"   ; shift ;;
        -h) usage; exit 0;;
        --) shift ; break ;;
        *)  usage; exit 1 ;;
    esac
done

if [ "$CLEAN" = "yes" ]; then
    clean
    exit 0
fi

if [ "$DEPENDENCIES" = "yes" ]; then
    dependencies
    exit 0
fi

install_patch
