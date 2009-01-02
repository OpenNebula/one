#!/bin/bash

SIZE=$1
DST=$2

if [ -z "${ONE_LOCATION}" ]; then
    TMCOMMON=/usr/lib/one/mads/tm_common.sh
else
    TMCOMMON=$ONE_LOCATION/lib/mads/tm_common.sh
fi

. $TMCOMMON

DST_PATH=`arg_path $DST`

log "Creating ${SIZE}Mb image in $DST_PATH"
exec_and_log "dd if=/dev/zero of=$DST_PATH bs=1 count=1 seek=${SIZE}M"

log "Initializing swap space"
exec_and_log "mkswap $DST_PATH"

exec_and_log "chmod a+w $DST_PATH"

