#!/bin/bash

set -e

#-------------------------------------------------------------------------------
usage() {
 echo
 echo "Usage: build.sh [-d] [-c] [-l] [-h]"
 echo
 echo "-d: install build dependencies (bower, grunt)"
 echo "-c: clean build"
 echo "-l: preserve main.js"
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

    (cd bower_components/no-vnc/ && npm install && ./utils/use_require.js --clean --as amd && sed -i -e "s/'\.\//'\.\.\/bower_components\/no-vnc\/lib\//g" lib/rfb.js )

    PATCH_DIR="./patches/"

    for i in `ls ${PATCH_DIR}` ; do
        if [ -f "${PATCH_DIR}/$i" ]; then
            patch -p1 <"${PATCH_DIR}/$i"
        fi
    done

    if [ "$DO_LINK" = "yes" ]; then
        mv -f dist/main.js ./main.js
    fi

    grunt --gruntfile ./Gruntfile.js sass

    grunt --gruntfile ./Gruntfile.js requirejs

    mv -f dist/main.js dist/main-dist.js

    if [ "$DO_LINK" = "yes" ]; then
        mv ./main.js dist/main.js
    fi

}
#-------------------------------------------------------------------------------

PARAMETERS="dlch"

if [ $(getopt --version | tr -d " ") = "--" ]; then
    TEMP_OPT=`getopt $PARAMETERS "$@"`
else
    TEMP_OPT=`getopt -o $PARAMETERS -n 'build.sh' -- "$@"`
fi

DEPENDENCIES="no"
CLEAN="no"
DO_LINK="no"

eval set -- "$TEMP_OPT"

while true ; do
    case "$1" in
        -d) DEPENDENCIES="yes"   ; shift ;;
        -c) CLEAN="yes"   ; shift ;;
        -l) DO_LINK="yes"   ; shift ;;
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
