#!/bin/bash

# -------------------------------------------------------------------------- #
# Copyright 2002-2016, OpenNebula Project, OpenNebula Systems                #
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

#Arguments: hypervisor ds_location collectd_port monitor_push_period host_id hostname
HYPERVISOR=$1
DATASTORE_LOCATION=${2:-"/var/lib/one/datastores"}

DRIVER_PATH=$(dirname $0)
REMOTES_DIR="${DRIVER_PATH}/../.."

mkdir -p "$DATASTORE_LOCATION"

USED_MB=$(df -B1M -P $DATASTORE_LOCATION 2>/dev/null | tail -n 1 | awk '{print $3}')
TOTAL_MB=$(df -B1M -P $DATASTORE_LOCATION 2>/dev/null | tail -n 1 | awk '{print $2}')
FREE_MB=$(df -B1M -P $DATASTORE_LOCATION 2>/dev/null | tail -n 1 | awk '{print $4}')

USED_MB=${USED_MB:-"0"}
TOTAL_MB=${TOTAL_MB:-"0"}
FREE_MB=${FREE_MB:-"0"}

echo "DS_LOCATION_USED_MB=$USED_MB"
echo "DS_LOCATION_TOTAL_MB=$TOTAL_MB"
echo "DS_LOCATION_FREE_MB=$FREE_MB"

dirs=$(ls $DATASTORE_LOCATION)

for ds in $dirs; do
    echo $ds | grep -q -E '^[0123456789]+$' || continue

    dir=$DATASTORE_LOCATION/$ds

    USED_MB=$(df -B1M -P $dir 2>/dev/null | tail -n 1 | awk '{print $3}')
    TOTAL_MB=$(df -B1M -P $dir 2>/dev/null | tail -n 1 | awk '{print $2}')
    FREE_MB=$(df -B1M -P $dir 2>/dev/null | tail -n 1 | awk '{print $4}')

    USED_MB=${USED_MB:-"0"}
    TOTAL_MB=${TOTAL_MB:-"0"}
    FREE_MB=${FREE_MB:-"0"}

    echo "DS = ["
    echo "  ID = $ds,"
    echo "  USED_MB = $USED_MB,"
    echo "  TOTAL_MB = $TOTAL_MB,"
    echo "  FREE_MB = $FREE_MB"
    echo "]"

    # Skip if datastore is not marked for local monitoring
    [ -e "${dir}/.monitor" ] || continue

    DRIVER=$(cat ${dir}/.monitor)
    [ -z "$DRIVER" ] && DRIVER="ssh" # default is ssh

    SCRIPT_PATH="${REMOTES_DIR}/tm/$DRIVER/monitor_ds"
    [ -e "$SCRIPT_PATH" ] && "$SCRIPT_PATH" "$dir"
done
