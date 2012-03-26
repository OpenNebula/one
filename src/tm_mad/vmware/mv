#!/bin/bash 

# ---------------------------------------------------------------------------- #
# Copyright 2010-2011, C12G Labs S.L                                           #
#                                                                              #
# Licensed under the Apache License, Version 2.0 (the "License"); you may      #
# not use this file except in compliance with the License. You may obtain      #
# a copy of the License at                                                     #
#                                                                              #
# http://www.apache.org/licenses/LICENSE-2.0                                   #
#                                                                              #
# Unless required by applicable law or agreed to in writing, software          #
# distributed under the License is distributed on an "AS IS" BASIS,            #
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.     #
# See the License for the specific language governing permissions and          #
# limitations under the License.                                               #
# ---------------------------------------------------------------------------- #

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
. "`dirname $0`/functions.sh"

get_vmdir

SRC_PATH=`arg_path $SRC`
DST_PATH=`arg_path $DST`

fix_paths

DST_PATH=`fix_dir_slashes "$DST_PATH"`
SRC_PATH=`fix_dir_slashes "$SRC_PATH"`

if [ "$SRC_PATH" = "$DST_PATH" ]; then
    log "Will not move, source and destination are equal"
elif [ -L "$SRC_PATH/.disk" ]; then 
    exec_and_log "mv $SRC_PATH/.disk $DST_PATH"
elif [ "`is_disk $SRC_PATH`" = "0" ] ; then
    log "Moving $SRC_PATH"
    exec_and_log "mv $SRC_PATH $DST_PATH"
elif [ -d $SRC_PATH ]; then
    log "Will not move, it is not saving a VM disk image"
else
    log "Moving $SRC_PATH"
    exec_and_log "mv $SRC_PATH $DST_PATH"
fi
