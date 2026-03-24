#!/bin/bash

# -------------------------------------------------------------------------- #
# Copyright 2002-2025, OpenNebula Project, OpenNebula Systems                #
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

DRIVER_PATH=$(dirname $0)

source $DRIVER_PATH/../../etc/vmm/kvm/kvmrc
source $DRIVER_PATH/../../scripts_common.sh

#-------------------------------------------------------------------------------
# OpenNebula virtiofsd wrapper
#-------------------------------------------------------------------------------

USER="oneadmin"

for bin in $VIRTIOFSD_BINARY_PATH; do
    if [ -x "$bin" ]; then
        VIRTIOFSD_BINARY="$bin"
        break
    fi
done

if [ -z "$VIRTIOFSD_BINARY" ]; then
    error_message "virtiofsd binary not found. Checked: $VIRTIOFSD_BINARY_PATH"
    exit 1
fi

# ------------------------------------------------------------------------------
# Execute with dropped privileges
# ------------------------------------------------------------------------------

# Virtiofsd from non rust version (qemu from) calls setgroups() and gets
# permission denied
if [[ $VIRTIOFSD_BINARY =~ qemu ]]; then
    exec "$VIRTIOFSD_BINARY" "$@"
else
    exec su -s /bin/bash "$USER" -c "$VIRTIOFSD_BINARY $*"
fi
