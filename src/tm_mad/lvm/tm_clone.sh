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
exec_and_log "$SSH $DST_HOST mkdir -p $DST_DIR"

case $SRC in
#------------------------------------------------------------------------------
#Get the image from http repository and dump it to a new LV
#------------------------------------------------------------------------------
http://*)
    log "Creating LV $LV_NAME"
    exec_and_log "$SSH $DST_HOST $SUDO $LVCREATE -L$SIZE -n $LV_NAME $VG_NAME"
    exec_and_log "$SSH $DST_HOST ln -s /dev/$VG_NAME/$LV_NAME $DST_PATH"

    log "Dumping Image into /dev/$VG_NAME/$LV_NAME"
    exec_and_log "eval $SSH $DST_HOST '$WGET $SRC -q -O- | $SUDO $DD of=/dev/$VG_NAME/$LV_NAME bs=64k'"
    ;;

#------------------------------------------------------------------------------
#Make a snapshot from the given dev (already in DST_HOST)
#------------------------------------------------------------------------------
*:/dev/*)
    log "Cloning LV $LV_NAME"
    exec_and_log "$SSH $DST_HOST $SUDO $LVCREATE -s -L$SIZE -n $LV_NAME $SRC_PATH"
    exec_and_log "$SSH $DST_HOST ln -s /dev/$VG_NAME/$LV_NAME $DST_PATH"
    ;;

#------------------------------------------------------------------------------
#Get the image from SRC_HOST and dump it to a new LV
#------------------------------------------------------------------------------
*)
    log "Creating LV $LV_NAME"
    exec_and_log "$SSH $DST_HOST $SUDO $LVCREATE -L$SIZE -n $LV_NAME $VG_NAME"
    exec_and_log "$SSH $DST_HOST ln -s /dev/$VG_NAME/$LV_NAME $DST_PATH"

    log "Dumping Image"
    exec_and_log "eval cat $SRC_PATH | $SSH $DST_HOST $SUDO $DD of=/dev/$VG_NAME/$LV_NAME bs=64k"
    ;;
esac
