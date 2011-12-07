#!/bin/bash

# --------------------------------------------------------------------------
# Copyright 2010, C12G Labs S.L.
#
# This file is part of OpenNebula VMware Drivers.
#
# OpenNebula VMware Drivers is free software: you can redistribute it
# and/or modify it under the terms of the GNU General Public License
# as published by the Free Software Foundation, either version 3 of
# the License, or the hope That it will be useful, but (at your
# option) any later version.
#
# OpenNebula VMware Drivers is distributed in WITHOUT ANY WARRANTY;
# without even the implied warranty of MERCHANTABILITY or FITNESS FOR
# A PARTICULAR PURPOSE.  See the GNU General Public License for more
# details.
#
# You should have received a copy of the GNU General Public License
# along with OpenNebula VMware Drivers . If not, see
# <http://www.gnu.org/licenses/>
# --------------------------------------------------------------------------

while (( "$#" )); do
    if [ "$#" == "1" ]; then
        DST=$1
    else
        SRC="$SRC $1"
    fi
    shift
done


if [ -z "${ONE_LOCATION}" ]; then
    TMCOMMON=/usr/lib/one/mads/tm_common.sh
else
    TMCOMMON=$ONE_LOCATION/lib/mads/tm_common.sh
fi

. $TMCOMMON

get_vmdir

DST_PATH=`arg_path $DST`

fix_dst_path

DST_DIR=`dirname $DST_PATH`
ISO_DIR=$DST_DIR/isofiles

exec_and_log "mkdir -p $ISO_DIR"

for f in $SRC; do
    case $f in
    http://*)
        exec_and_log "$WGET -O $ISO_DIR $f"
        ;;

    *)
        exec_and_log "cp -R $f $ISO_DIR"
        ;;
    esac
done

exec_and_log "$MKISOFS -o $DST_PATH.iso -J -R $ISO_DIR"

exec_and_log "rm -rf $ISO_DIR"
