#!/bin/bash

SRC=$1
DST=$2

. $ONE_LOCATION/libexec/tm_common.sh

SRC_PATH=`arg_path $SRC`

log "Deleting $SRC_PATH"
exec_and_log "rm -rf $SRC_PATH"
