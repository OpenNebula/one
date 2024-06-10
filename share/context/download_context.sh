#!/bin/bash

#-------------------------------------------------------------------------------
# This function returns the associated context packages version to the installed
# OpenNebula version
#-------------------------------------------------------------------------------
function get_tag_version {
    local creleases=`curl -sSL $1 | jq -r '.[].tag_name' | cut -d 'v' -f 2`

    for tag in `echo $creleases`; do
        if [ "$tag" = "`echo -e "$tag\n$VERSION" | sort -V | head -n1`" ]; then
            echo "$tag"
            break
        fi
    done
}

CONTEXT_API="https://api.github.com/repos/OpenNebula/one-apps/releases"
VERSION=`cat ../../src/im_mad/remotes/VERSION`

###############################################################################
# Download linux & windows packages
###############################################################################

TAG_VERSION=`get_tag_version $CONTEXT_API`

# If the current ONE version is greater than every context version the last one is retrieved
if [ -z "$TAG_VERSION" ]; then
    TAG_VERSION=`curl -s $CONTEXT_API | jq -r '.[0].tag_name' | cut -d 'v' -f 2`
fi

TAG="v$TAG_VERSION"

curl -s $CONTEXT_API | \
        jq -r --arg TAG "$TAG" '.[] | select(.tag_name == $TAG) | .assets[].browser_download_url' | \
		xargs wget -P .
