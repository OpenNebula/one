#!/bin/bash

# -------------------------------------------------------------------------- #
# Copyright 2002-2024, OpenNebula Project, OpenNebula Systems                #
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

# exit when any command fails
set -e

function is_mounted {
    grep -qs "$1" /proc/mounts
}

function clean {
    if is_mounted "${dockerdir}/mnt"; then
        umount "${dockerdir}/mnt"
    fi
}

#-------------------------------------------------------------------------------
# Configuration attributes and parameters
#-------------------------------------------------------------------------------
img_raw=""
dockerdir=""
tarball=""

while getopts ":i:d:t:a:" opt; do
    case $opt in
        i) img_raw="$OPTARG" ;;
        d) dockerdir="$OPTARG" ;;
        t) tarball="$OPTARG" ;;
    esac
done

# Check img_raw is a valid file
if [ ! -f "$img_raw" ]; then
    exit -1
fi

# Check tarball is a valid file
if [ ! -f "$tarball" ]; then
    exit -1
fi

# Check dockerdir is different than / and the directory name is an uuid
regex_uuid="^\{?[0-9]+-[0-9]+-[0-9]+-[0-9]+-[0-9]+\}?$"
if [ ! -d "$dockerdir" ] || [[ ! $(basename "$dockerdir") =~ $regex_uuid ]]; then
    exit -1
fi

trap clean EXIT

# Mount container disk image and untar rootfs contents to it

# try first to mount with the fuse2fs command and if that fails fallback to the
# regular mount
# NOTE: fuse2fs returns zero even when actual mount fails
_fuse_failed=''
if ! fuse2fs -o noexec,nodev,nosuid "$img_raw" "${dockerdir}/mnt" >/dev/null 2>&1 ; then
    _fuse_failed=yes
fi

if [ "$_fuse_failed" = "yes" ] || ! is_mounted "${dockerdir}/mnt" ; then
    mount -o noexec,nodev,nosuid "$img_raw" "${dockerdir}/mnt"
fi

chmod o+w "${dockerdir}/mnt"
tar xpf "$tarball" -C "${dockerdir}/mnt" > /dev/null 2>&1

sync

exit 0
