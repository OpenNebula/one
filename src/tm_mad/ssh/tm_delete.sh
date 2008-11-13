#!/bin/bash

SRC=$1
DST=$2

. $ONE_LOCATION/libexec/tm_common.sh

SRC_PATH=`arg_path $SRC`
SRC_HOST=`arg_host $SRC`

log "Deleting $SRC_PATH"
exec_and_log "ssh $SRC_HOST rm -rf $SRC_PATH"
