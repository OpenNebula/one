#!/bin/bash

SRC=$1
DST=$2

if [ -z "${ONE_LOCATION}" ]; then
    TMCOMMON=/usr/lib/one/mads/tm_common.sh
else
    TMCOMMON=$ONE_LOCATION/lib/mads/tm_common.sh
fi

. $TMCOMMON

SRC_PATH=`arg_path $SRC`
DST_PATH=`arg_path $DST`

SRC_HOST=`arg_host $SRC`
DST_HOST=`arg_host $DST`


log "$1 $2"
log "DST: $DST_PATH"

DST_DIR=`dirname $DST_PATH`

log "Creating directory $DST_DIR"
exec_and_log "ssh $DST_HOST mkdir -p $DST_DIR"

case $SRC in
http://*)
    log "Downloading $SRC"
    exec_and_log "ssh $DST_HOST wget -O $DST_PATH $SRC_PATH"
    ;;

*)
    log "Cloning $SRC"
    exec_and_log "scp $SRC $DST"
    ;;
esac

exec_and_log "ssh $DST_HOST chmod a+w $DST_PATH"

