#!/bin/bash

SIZE=$1
DST=$2

. $ONE_LOCATION/libexec/tm_common.sh

DST_PATH=`arg_path $DST`
DST_HOST=`arg_host $DST`

log "Creating ${SIZE}Mb image in $DST_PATH"
exec_and_log "ssh $DST_HOST dd if=/dev/zero of=$DST_PATH bs=1 count=1 seek=${SIZE}M"

log "Initializing swap space"
exec_and_log "ssh $DST_HOST mkswap $DST_PATH"

exec_and_log "ssh $DST_HOST chmod a+w $DST_PATH"

