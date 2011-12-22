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
else
    TMCOMMON=$ONE_LOCATION/lib/mads/tm_common.sh
fi

. $TMCOMMON

get_vmdir

SRC_PATH=`arg_path $SRC`
DST_PATH=`arg_path $DST`

fix_dst_path

DST_DIR=`dirname $DST_PATH`

# SRC_PATH needs to be made relative to $ONE_LOCATION/var
VM_FOLDER_NAME=`basename $SRC_PATH`
REPO_NAME="images"
RELATIVE_SRC_PATH="../../$REPO_NAME/$VM_FOLDER_NAME"

log "Creating directory $DST_PATH"
exec_and_log "rm -rf $DST"
exec_and_log "mkdir -p $DST_PATH"
exec_and_log "chmod a+w $DST_PATH"

log "Link all files in $SRC_PATH to $DST_PATH"
IMAGE_DIR=`dirname $DST_PATH`

cd $IMAGE_DIR

for file in `find $RELATIVE_SRC_PATH/* -type f`; do
    file_name=`basename $file`
    exec_and_log "ln -sf ../$file $DST_PATH/$file_name"
done



