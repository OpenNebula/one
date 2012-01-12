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
    LVMRC=/etc/one/tm_lvm/tm_lvmrc
else
    TMCOMMON=$ONE_LOCATION/lib/mads/tm_common.sh
    LVMRC=$ONE_LOCATION/etc/tm_lvm/tm_lvmrc
fi

. $TMCOMMON
. $LVMRC

SRC_PATH=`arg_path $SRC`
SRC_HOST=`arg_host $SRC`

VID=`get_vid $SRC_PATH`

log "Deleting remote LVs"
exec_and_log "$SSH $SRC_HOST $SUDO $LVREMOVE -f \$(echo $VG_NAME/\$($SUDO $LVS --noheadings $VG_NAME|$AWK '{print \$1}'|grep lv-one-$VID))"

log "Deleting $SRC_PATH"
exec_and_log "$SSH $SRC_HOST rm -rf $SRC_PATH"
