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
else
    TMCOMMON=$ONE_LOCATION/lib/mads/tm_common.sh
fi

. $TMCOMMON

SRC_PATH=`arg_path $SRC`
DST_PATH=`arg_path $DST`

SRC_HOST=`arg_host $SRC`
DST_HOST=`arg_host $DST`

if [ $SRC_HOST -ne `hostname` ]; then
    $VM_ID=`sed -e 's/.*\/\([0-9]\+\)\/images\/.*/\1/`
    $VM_NAME=one-$VM_ID
    $LAST_BIT_OF_PATH=`basename $SRC_PATH`
    if [ $LAST_BIT_OF_PATH -eq "images" ]; then
	SRC_PATH="/vmfs/volumes/$DATASTORE/"$VM_NAME
    else
	SRC_PATH="/vmfs/volumes/$DATASTORE/"$VM_NAME"/$LAST_BIT_OF_PATH
    fi
fi

if [ $DST_HOST -ne `hostname` ]; then
    $VM_ID=`sed -e 's/.*\/\([0-9]\+\)\/images\/.*/\1/`    
    $VM_NAME=one-$VM_ID
    $LAST_BIT_OF_PATH=`basename $DST_PATH`
    if [ $LAST_BIT_OF_PATH -eq "images" ]; then
        DST_PATH="/vmfs/volumes/$DATASTORE/"$VM_NAME
    else
        DST_PATH="/vmfs/volumes/$DATASTORE/"$VM_NAME"/$LAST_BIT_OF_PATH
    fi
fi


DST_DIR=`dirname $DST_PATH`

if [ -d $DST_PATH ]; then
    DST_ONEID_FOLDER=`basename `
else
fi

log "Moving $SRC_PATH"
scp -r $SRC $DST_HOST:/vmfs/volumes/$DATASTORE/$
ssh $SRC_HOST rm -rf $SRC_PATH
