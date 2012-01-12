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

