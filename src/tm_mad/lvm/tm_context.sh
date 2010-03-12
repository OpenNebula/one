#!/bin/bash

# -------------------------------------------------------------------------- #
# Copyright 2002-2010, OpenNebula Project Leads (OpenNebula.org)             #
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

# Parameters: a b c d e f g h
# SRC: a b c d e f g
# DST: h
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


DST_PATH=`arg_path $DST`
DST_DIR=`dirname $DST_PATH`
DST_FILE=`basename $DST_PATH`
DST_HASH=`echo -n $DST | md5sum | awk '{print $1}'`
TMP_DIR="$ONE_LOCATION/var/$DST_HASH"
ISO_DIR="$TMP_DIR/isofiles"


exec_and_log "mkdir -p $ISO_DIR"

for f in $SRC; do
    case $f in
    http://*)
        exec_and_log "wget -O $ISO_DIR $f"
        ;;

    *)
        exec_and_log "cp -R $f $ISO_DIR"
        ;;
    esac
done

exec_and_log "mkisofs -o $TMP_DIR/$DST_FILE -J -R $ISO_DIR"
exec_and_log "scp $TMP_DIR/$DST_FILE $DST"
exec_and_log "rm -rf $TMP_DIR"

