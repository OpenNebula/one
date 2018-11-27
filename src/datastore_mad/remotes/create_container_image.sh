#!/bin/bash

# -------------------------------------------------------------------------- #
# Copyright 2002-2018, OpenNebula Project, OpenNebula Systems                #
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
    LIB_LOCATION=/usr/lib/one
    VAR_LOCATION=/var/lib/one
else
    LIB_LOCATION=$ONE_LOCATION/lib
    VAR_LOCATION=$ONE_LOCATION/var
fi

. $LIB_LOCATION/sh/scripts_common.sh

DRIVER_PATH=$(dirname $0)

tmp_dir=$1
id=$2
extension=$3
terminal=$4

commands=$(cat /dev/stdin)

case $extension in
    "tar.xz")
        untar_options="xvJpf"
        ;;
    "tar.gz")
        untar_options="xvzpf"
        ;;
esac

mount $tmp_dir/$id.raw $tmp_dir/$id
chown oneadmin:oneadmin $tmp_dir/$id
tar $untar_options $tmp_dir/$id.$extension -C $tmp_dir/$id > /dev/null 2>&1

sync

cat << EOF | chroot $tmp_dir/$id $terminal
$commands
echo "#This file is modified by OpenNebula. Don't write in here" > /etc/resolv.conf
rm -f /etc/ssh/ssh_host_* > /dev/null 2>&1
usermod -p '*' root > /dev/null 2>&1
EOF
sync

umount $tmp_dir/$id
