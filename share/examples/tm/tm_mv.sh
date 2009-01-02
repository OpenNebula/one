#!/bin/bash

SRC=$1
DST=$2

if [ -z "${ONE_LOCATION}" ]; then
    TMCOMMON=/usr/lib/one/mads/tm_common.sh
    VAR_LOCATION=/var/lib/one/
else
    TMCOMMON=$ONE_LOCATION/lib/mads/tm_common.sh
    VAR_LOCATION=$ONE_LOCATION/var/
fi

. $TMCOMMON

SRC_PATH=`arg_path $SRC`
DST_PATH=`arg_path $DST`
DST_HOST=`arg_host $DST`

if [ "$SRC_PATH" == "$DST_PATH" ]; then
    log "Will not move, source and destination are equal"
else
    # Is saving a disk image?
    echo "$DST_PATH" | egrep -e "^$VAR_LOCATION.+/disk\..+$"
    if [ "x$?" == "x0" ]; then
        log "Moving $SRC_PATH"
        exec_and_log "ssh $DST_HOST mv $SRC_PATH $DST_PATH"
    else
        log "Will not move, is not saving image"
    fi
fi

