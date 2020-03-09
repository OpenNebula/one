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

source /var/tmp/one/scripts_common.sh

# exit when any command fails
set -e

CGROUP_PATH=""
VM_NAME=""
CGROUP_TO=60
ONLY_UMOUNT=""

while getopts ":c:v:t:o" opt; do
    case $opt in
        c) CGROUP_PATH="$OPTARG" ;;
        v) VM_NAME="$OPTARG" ;;
        t) CGROUP_TO=$OPTARG ;;
        o) ONLY_UMOUNT="1"
    esac
done

shift $(($OPTIND - 1))

if [ -z "$CGROUP_PATH" ] || [ -z "$VM_NAME" ]; then
    exit -1
fi

ROOTFS_PATH="/srv/jailer/firecracker/$VM_NAME/root"

# Remove Firecracker residual files
rm -rf "$ROOTFS_PATH/dev"
rm -f "$ROOTFS_PATH/api.socket"
rm -f "$ROOTFS_PATH/firecracker"

# Unmount VM directory
umount "$ROOTFS_PATH"

#-------------------------------------------------------------------------------
# Wait for a cgroup to not being used
#   @param $1 - Path to cgroup
#-------------------------------------------------------------------------------
function wait_cgroup () {
    t_start=$(date +%s)

    while [ $(($(date +%s)-$t_start)) -lt $CGROUP_TO ] &&
          [ ! -z "$(cat $1/tasks)" ] &&
          [ ! -z "$(lsof $1)" ]; do continue; done
}

function clean_cgroups () {
    DIR="$CGROUP_PATH/cpu/firecracker/$VM_NAME"
    wait_cgroup $DIR
    if [ -d "$DIR" ]; then rmdir "$DIR"; fi

    DIR="$CGROUP_PATH/cpuset/firecracker/$VM_NAME"
    wait_cgroup $DIR
    if [ -d "$DIR" ]; then rmdir "$DIR"; fi

    DIR="$CGROUP_PATH/pids/firecracker/$VM_NAME"
    wait_cgroup $DIR
    if [ -d "$DIR" ]; then rmdir "$DIR"; fi
}

retry 3 clean_cgroups

#-------------------------------------------------------------------------------
# Remove VM chroot directory
#-------------------------------------------------------------------------------
if [ -n "${ONLY_UMOUNT}" ]; then
    exit 0
fi

rm -rf $(dirname $ROOTFS_PATH)

exit 0
