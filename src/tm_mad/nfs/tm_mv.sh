#!/bin/bash

SRC=$1
DST=$2

. $ONE_LOCATION/libexec/tm_common.sh

SRC_PATH=`arg_path $SRC`
DST_PATH=`arg_path $DST`

if [ "$SRC_PATH" == "$DST_PATH" ]; then
    log "Will not move, source and destination are equal"
else
    # Is saving a disk image?
    echo "$DST_PATH" | egrep -e "^$ONE_LOCATION/var/.+/disk\..+$"
    if [ "x$?" == "x0" ]; then
        log "Moving $SRC_PATH"
        exec_and_log "mv $SRC_PATH $DST_PATH"
    else
        log "Will not move, is not saving image"
    fi
fi

