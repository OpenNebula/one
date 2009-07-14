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

if [ -z "${ONE_LOCATION}" ]; then
    TMCOMMON=/usr/lib/one/mads/tm_common.sh
else
    TMCOMMON=$ONE_LOCATION/lib/mads/tm_common.sh
fi

. $TMCOMMON

SIZE=$1
FSTYPE=$2
DST=$3

DST_PATH=`arg_path $DST`
DST_HOST=`arg_host $DST`
DST_DIR=`dirname $DST_PATH`
# Get rid of path/images, we don't need it
DST_DIR=`dirname $DST_DIR`

DST_HASH=`echo -n $DST | md5sum | awk '{print $1}'`
TMP_DIR="$ONE_LOCATION/var/$DST_HASH"
NAME_OF_CONTEXT_FILE=`basename $DST_PATH`

DST_ONEID_FOLDER=`basename $DST_DIR`

exec_and_log "mkdir -p $TMP_DIR"

ssh $DST_HOST \"cd /vmfs/volumes/$DATASTORE; mkdir $DST_DIR\"
exec_and_log "dd if=/dev/zero of=$TMP_DIR/$NAME_OF_CONTEXT_FILE bs=1 count=1 seek=${SIZE}M"
exec_and_log "mkfs -t $FSTYPE -F $TMP_DIR/$NAME_OF_CONTEXT_FILE"
scp $TMP_DIR/$NAME_OF_CONTEXT_FILE $DST_HOST:/vmfs/volumes/$DATASTORE/$DST_ONEID_FOLDER
ssh $DST_HOST chmod a+rw $DST_PATH
