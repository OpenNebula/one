#!/bin/bash

SRC=$1
DST=$2

if [ -z "${ONE_LOCATION}" ]; then
    TMCOMMON=/usr/lib/one/mads/tm_common.sh
    TM_COMMANDS_LOCATION=/usr/lib/one/tm_commands/ 
else
    TMCOMMON=$ONE_LOCATION/lib/mads/tm_common.sh
    TM_COMMANDS_LOCATION=$ONE_LOCATION/lib/tm_commands/
fi

. $TMCOMMON

log "Link $SRC_PATH (non shared dir, will clone)"
#exec_and_log "ln -s $SRC_PATH $DST_PATH"
exec $TM_COMMANDS_LOCATION/ssh/tm_clone.sh $SRC $DST
