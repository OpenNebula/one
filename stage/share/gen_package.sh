#!/bin/bash

if [ -z "$ONE_SOURCE" ]; then
    echo "You must define ONE_SOURCE environment variable"
    exit -1
fi

EXTRA="$PWD/guest/*"
PACKAGER_DIR="$ONE_SOURCE/share/scripts/context-packages"

export PACKAGE_NAME=app-context
export VERSION=3.8.2
export LICENSE="C12G Commercial Open-source License"
export URL="http://c12g.com"
export DESCRIPTION="
This package prepares a VM image for OpenNebula:
  * Disables udev net and cd persistent rules
  * Deletes udev net and cd persistent rules
  * Unconfigures the network
  * Adds OpenNebula contextualization scripts to startup
  * Prepares the image to be used with AppStage

To get support use the OpenNebula.pro portal:
  http://opennebula.pro
"

cd $PACKAGER_DIR
./generate.sh $EXTRA



