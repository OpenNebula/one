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

if [ "$SRC_HOST" != "$HOSTNAME" ]; then
    log "Dumping LVs to disk images"

    echo "for disk in \$(ls $SRC_PATH/|grep ^disk);do
    disk=$SRC_PATH/\$disk
    lv=\$(readlink \$disk)
    rm \$disk
    sudo dd if=\$lv of=\$disk bs=64k
done" | ssh $SRC_HOST "cat > $SRC_PATH/lv_dump.sh"

    exec_and_log "eval ssh $SRC_HOST 'bash $SRC_PATH/lv_dump.sh; rm $SRC_PATH/lv_dump.sh'"

    log "Deleting remote LVs"
    exec_and_log "ssh $SRC_HOST sudo lvremove -f \$(echo $VG_NAME/\$(sudo lvs --noheadings $VG_NAME|awk '{print \$1}'|grep lv-one-$VID))"
fi

log "Moving $SRC_PATH"
exec_and_log "ssh $DST_HOST mkdir -p $DST_DIR"
exec_and_log "scp -r $SRC $DST"
exec_and_log "ssh $SRC_HOST rm -rf $SRC_PATH"

if [ "$DST_HOST" != "$HOSTNAME" ]; then
    log "Creating LVs in remote host"

    if echo "$DST_PATH" |grep -qv images$ ; then
        DST_PATH="$DST_PATH/images"
    fi

    echo "for disk in \$(ls $DST_PATH/|grep ^disk); do
    ndisk=\$(echo \$disk|cut -d. -f2)
    disk=$DST_PATH/\$disk
    lv=lv-one-$VID-\$ndisk
    sudo lvcreate -L$SIZE -n \$lv $VG_NAME
    sudo dd if=\$disk of=/dev/$VG_NAME/\$lv bs=64k
    rm \$disk
    ln -s /dev/$VG_NAME/\$lv \$disk
done" | ssh $DST_HOST "cat > $DST_PATH/lv_restore.sh"

    exec_and_log "eval ssh $DST_HOST 'bash $DST_PATH/lv_restore.sh; rm $DST_PATH/lv_restore.sh'"
fi

