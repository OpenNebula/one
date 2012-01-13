#!/bin/bash

# -------------------------------------------------------------------------- #
# Copyright 2002-2012, OpenNebula Project Leads (OpenNebula.org)             #
#                                                                            #
# Licensed under the Apache License, Version 2.0 (the "License"); you may    #
# not use this file except in compliance with the License. You may obtain    #
# a copy of the License at                                                   #
#                                                                            #
# http://www.apache.org/licenses/LICENSE-2.0                                 #
#                                                                            #
# Unless required by applicable law or agreed to in writing, software        #
# distributed under the License is distributed on an "AS IS" BASIS,          #
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.   #
# See the License for the specific language governing permissions and        #
# limitations under the License.                                             #
#--------------------------------------------------------------------------- #

SIZE=$1
DST=$2

if [ -z "${ONE_LOCATION}" ]; then
    TMCOMMON=/usr/lib/one/mads/tm_common.sh
else
    TMCOMMON=$ONE_LOCATION/lib/mads/tm_common.sh
fi

. $TMCOMMON

DST_PATH=`arg_path $DST`
DST_HOST=`arg_host $DST`

DST_DIR=`dirname $DST_PATH`

log "Creating ${SIZE}Mb image in $DST_PATH"
exec_and_log "$SSH $DST_HOST mkdir -p $DST_DIR"
exec_and_log "$SSH $DST_HOST $DD if=/dev/zero of=$DST_PATH bs=1 count=1 seek=${SIZE}M" \
    "Could not create image file $DST_PATH"

log "Initializing swap space"
exec_and_log "$SSH $DST_HOST $MKSWAP $DST_PATH" \
    "Could not create swap on $DST_PATH"

exec_and_log "$SSH $DST_HOST chmod a+w $DST_PATH"

