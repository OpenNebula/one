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
DST_PATH=`arg_path $DST`

SRC_HOST=`arg_host $SRC`
DST_HOST=`arg_host $DST`

DST_DIR=`dirname $DST_PATH`

VID=`get_vid $SRC_PATH`

if [ -z $SIZE ] ; then
    SIZE=$DEFAULT_LV_SIZE
fi

# Check that we are not stopping, migrating or resuming
if echo `basename $SRC_PATH`|grep -vq '^disk'; then
    log_error "This TM does not support stop, migrating or resuming."
    exit 1
fi

if [ "$SRC_HOST" != "$HOSTNAME" ]; then
    log "Dumping LV to disk image"

    echo "if [ -L "$SRC_PATH" ]; then
        lv=\$(readlink $SRC_PATH)
        rm $SRC_PATH
        touch $SRC_PATH
        $SUDO $DD if=\$lv of=$SRC_PATH bs=64k
    else
        exit 1
    fi" | $SSH $SRC_HOST "$BASH -s"

    [ "$?" != "0" ] && log_error "Error dumping LV to disk image"

    log "Deleting remote LVs"
    exec_and_log "$SSH $SRC_HOST $SUDO $LVREMOVE -f \$(echo $VG_NAME/\$($SUDO $LVS --noheadings $VG_NAME|$AWK '{print \$1}'|grep lv-one-$VID))"
fi

log "Moving $SRC_PATH"
exec_and_log "$SSH $DST_HOST mkdir -p $DST_DIR"
exec_and_log "$SCP -r $SRC $DST"
exec_and_log "$SSH $SRC_HOST rm -rf $SRC_PATH"

if [ "$DST_HOST" != "$HOSTNAME" ]; then
    log_error "This TM does not support resuming."
fi

