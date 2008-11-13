#!/bin/bash

SRC=$1
DST=$2

. $ONE_LOCATION/libexec/tm_common.sh

SRC_PATH=`arg_path $SRC`
DST_PATH=`arg_path $DST`

SRC_HOST=`arg_host $SRC`
DST_HOST=`arg_host $DST`

DST_DIR=`dirname $DST_PATH`

log "Moving $SRC_PATH"
exec_and_log "ssh $DST_HOST mkdir -p $DST_DIR"
exec_and_log "scp -r $SRC $DST"
exec_and_log "ssh $SRC_HOST rm -rf $SRC_PATH"
