#!/bin/bash

# -------------------------------------------------------------------------- #
# Copyright 2002-2020, OpenNebula Project, OpenNebula Systems                #
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

#-------------------------------------------------------------------------------
# Configuration attributes and parameters
#-------------------------------------------------------------------------------
img_raw=""
dockerdir=""
tarball=""
action=""

while getopts ":i:d:t:a:" opt; do
    case $opt in
        i) img_raw="$OPTARG" ;;
        d) dockerdir="$OPTARG" ;;
        t) tarball="$OPTARG" ;;
        a) action="$OPTARG" ;;
    esac
done

if [ -z "$action" ]; then
    exit -1
fi

if [ $action == "CREATE" ]; then
    # Mount container disk image and untar rootfs contents to it
    mount -o noexec,nodev $img_raw $dockerdir/mnt > /dev/null 2>&1
    chmod o+w $dockerdir/mnt
    tar xpf $tarball -C $dockerdir/mnt > /dev/null 2>&1

    sync

    umount $dockerdir/mnt

    exit 0
elif [ $action == "CLEAN" ]; then
    umount "$dockerdir/mnt"

    exit 0
fi

