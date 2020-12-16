#!/bin/bash

set -e

#-------------------------------------------------------------------------------
usage() {
 echo
 echo "Usage: build.sh [-d] [-c] [-l] [-h] [-e]"
 echo
 echo "-d: install build dependencies"
 echo "-c: clean build"
 echo "-e: apply enterprise edition patchs"
 echo "-h: prints this help"
}

clean() {
    rm -rf ./dist ./node_modules
}

dependencies() {
    npm i --production
}

install() {
    clean
    dependencies
    npm run build
}

install_enterprise() {
    clean
    dependencies
    # npm run build-enterprise
    npm run build
}

#-------------------------------------------------------------------------------

PARAMETERS="dche"

if [ $(getopt --version | tr -d " ") = "--" ]; then
    TEMP_OPT=`getopt $PARAMETERS "$@"`
else
    TEMP_OPT=`getopt -o $PARAMETERS -n 'build.sh' -- "$@"`
fi

DEPENDENCIES="no"
CLEAN="no"
ENTERPRISE="no"

eval set -- "$TEMP_OPT"

while true ; do
    case "$1" in
        -d) DEPENDENCIES="yes"  ; shift ;;
        -c) CLEAN="yes"         ; shift ;;
        -e) ENTERPRISE="yes"    ; shift;;
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

if [ "$ENTERPRISE" = "yes" ]; then
    install_enterprise
    exit 0
fi

install