#!/bin/bash

# -------------------------------------------------------------------------- #
# Copyright 2002-2009, Distributed Systems Architecture Group, Universidad   #
# Complutense de Madrid (dsa-research.org)                                   #
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
SIZE=$3

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

if [ -z $SIZE ] ; then
    SIZE=$DEFAULT_LV_SIZE
fi

LV_NAME=`get_lv_name $DST_PATH`

log "$1 $2"
log "DST: $DST_PATH"

DST_DIR=`dirname $DST_PATH`

log "Creating directory $DST_DIR"
exec_and_log "ssh $DST_HOST mkdir -p $DST_DIR"

case $SRC_PATH in
#------------------------------------------------------------------------------
#Get the image from http repository and dump it to a new LV
#------------------------------------------------------------------------------
http://*)
    TMP_NAME="$DST_PATH.tmp"

    log "Downloading $SRC"
    exec_and_log "ssh $DST_HOST wget -O $TMP_NAME $SRC"

    log "Creating LV $LV_NAME"
    exec_and_log "ssh $DST_HOST sudo lvcreate -L$SIZE -n $LV_NAME $VG_NAME"
    exec_and_log "ssh $DST_HOST ln -s /dev/$VG_NAME/$LV_NAME $DST_PATH"

    log "Dumping Image $TMP_NAME into $/dev/$VG_NAME/$LV_NAME"
    exec_and_log "ssh $DST_HOST sudo dd if=$TMP_NAME of=/dev/$VG_NAME/$LV_NAME bs=64k"
    exec_and_log "ssh $DST_HOST rm -f $TMP_NAME"
    ;;

#------------------------------------------------------------------------------
#Make a snapshot from the given dev (already in DST_HOST)
#------------------------------------------------------------------------------
/dev/*)
    log "Cloning LV $LV_NAME"
    exec_and_log "ssh $DST_HOST sudo lvcreate -s -L$SIZE -n $LV_NAME $SRC_PATH"
    exec_and_log "ssh $DST_HOST ln -s /dev/$VG_NAME/$LV_NAME $DST_PATH"
    ;;

#------------------------------------------------------------------------------
#Get the image from SRC_HOST and dump it to a new LV
#------------------------------------------------------------------------------
*)
    log "Copying $SRC"
    exec_and_log "scp $SRC $DST.scp"

    log "Creating LV $LV_NAME"
    exec_and_log "ssh $DST_HOST sudo lvcreate -L$SIZE -n $LV_NAME $VG_NAME"
    exec_and_log "ssh $DST_HOST ln -s /dev/$VG_NAME/$LV_NAME $DST_PATH"

    log "Dumping Image"
    exec_and_log "ssh $DST_HOST sudo dd if=$DST_PATH.scp of=/dev/$VG_NAME/$LV_NAME bs=64k"
    exec_and_log "ssh $DST_HOST rm -f $DST_PATH.scp"
    ;;
esac

