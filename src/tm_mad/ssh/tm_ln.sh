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
    TM_COMMANDS_LOCATION=/usr/lib/one/tm_commands/ 
else
    TMCOMMON=$ONE_LOCATION/lib/mads/tm_common.sh
    TM_COMMANDS_LOCATION=$ONE_LOCATION/lib/tm_commands/
fi

. $TMCOMMON

log "Link $SRC_PATH (non shared dir, will clone)"
#exec_and_log "ln -s $SRC_PATH $DST_PATH"
exec $TM_COMMANDS_LOCATION/ssh/tm_clone.sh $SRC $DST
