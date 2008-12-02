#!/bin/bash

SRC=$1
DST=$2

. $ONE_LOCATION/libexec/tm_common.sh

SRC_PATH=`arg_path $SRC`
DST_PATH=`arg_path $DST`
DST_HOST=`arg_host $DST`

DST_DIR=`dirname $DST_PATH`

log "Creating directory $DST_DIR"
exec_and_log "ssh $DST_HOST mkdir -p $DST_DIR"


log "Link $SRC_PATH"
exec_and_log "ssh $DST_HOST ln -s $SRC_PATH $DST_PATH"
