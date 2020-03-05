#!/bin/bash

# -------------------------------------------------------------------------- #
# Copyright 2002-2019, OpenNebula Project, OpenNebula Systems                #
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

function clean () {
    # Clean temporary directories
    umount "$MAP_PATH/fs"
    rm -rf "$MAP_PATH"
}

# exit when any command fails
set -eE

SYSDS_PATH=""
ROOTFS_ID=""
VM_ID=""

while getopts ":s:c:r:v:" opt; do
    case $opt in
        s) SYSDS_PATH="$OPTARG" ;;
        c) CONTEXT_ID=$OPTARG ;;
        r) ROOTFS_ID="$OPTARG" ;;
        v) VM_ID="$OPTARG" ;;
    esac
done

shift $(($OPTIND - 1))


if [ -z "$SYSDS_PATH" ] || [ -z "$CONTEXT_ID" ] || [ -z "$ROOTFS_ID" ] || [ -z "$VM_ID" ]; then
    exit -1
fi

rgx_num="^[0-9]+$"
if ! [[ $CONTEXT_ID =~ $rgx_num ]] || ! [[ $ROOTFS_ID =~ $rgx_num ]] || ! [[ $VM_ID =~ $rgx_num ]]; then
    exit -1
fi

VM_LOCATION="$SYSDS_PATH/$VM_ID"

MAP_PATH="$VM_LOCATION/map_context"
CONTEXT_PATH="$VM_LOCATION/disk.$CONTEXT_ID"
ROOTFS_PATH="$VM_LOCATION/disk.$ROOTFS_ID"

trap clean ERR

# Create temporary directories
mkdir "$MAP_PATH"
mkdir "$MAP_PATH/context"
mkdir "$MAP_PATH/fs"

# Mount rootfs
mount "$ROOTFS_PATH" "$MAP_PATH/fs"

# Create /context directory inside rootfs
if [ ! -d "$MAP_PATH/fs/context" ]; then
    mkdir "$MAP_PATH/fs/context"
fi

# Move the context disk info into the microVM fs
bsdtar -xf "$CONTEXT_PATH" -C "$MAP_PATH/fs/context"

clean

exit 0