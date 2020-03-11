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

#Arguments: hypervisor ds_location monitord_port monitor_push_period host_id hostname
HYPERVISOR=$1
DATASTORE_LOCATION=${2:-"/var/lib/one/datastores"}

DRIVER_PATH=$(dirname $0)
REMOTES_DIR="${DRIVER_PATH}/../.."

mkdir -p "$DATASTORE_LOCATION"

declare -A SEEN
read -r SRC DS_TOTAL_MB DS_USED_MB DS_FREE_MB \
    <<< $(df -B1M --output=source,size,used,avail $DATASTORE_LOCATION \
    2>/dev/null | tail -n1)

# mark the the datasore location SRC as seen
SEEN[$SRC]=1

for DS in $(ls $DATASTORE_LOCATION); do
    echo $DS | grep -q -E '^[0123456789]+$' || continue

    DIR=$DATASTORE_LOCATION/$DS

    test -d "$DIR" || continue

    read -r SRC TOTAL_MB USED_MB FREE_MB \
        <<< $(df -B1M --output=source,size,used,avail $DIR \
        2>/dev/null | tail -n1)

    USED_MB=${USED_MB:-"0"}
    TOTAL_MB=${TOTAL_MB:-"0"}
    FREE_MB=${FREE_MB:-"0"}

    echo "DS = ["
    echo "  ID = $DS,"
    echo "  USED_MB = $USED_MB,"
    echo "  TOTAL_MB = $TOTAL_MB,"
    echo "  FREE_MB = $FREE_MB"
    echo "]"

    # If didn't seen yet add it to the total
    if [ "${SEEN[$SRC]}" = "" ]; then
        SEEN[$SRC]=1
        DS_USED_MB=$((( $DS_USED_MB + $USED_MB )))
        DS_TOTAL_MB=$((( $DS_TOTAL_MB + $TOTAL_MB )))
        DS_FREE_MB=$((( $DS_FREE_MB + $FREE_MB )))
    fi

    # Skip if datastore is not marked for local monitoring
    [ -e "${DIR}/.monitor" ] || continue

    DRIVER=$(cat ${DIR}/.monitor)
    [ -z "$DRIVER" ] && DRIVER="ssh" # default is ssh

    SCRIPT_PATH="${REMOTES_DIR}/tm/$DRIVER/monitor_ds"
    [ -e "$SCRIPT_PATH" ] && "$SCRIPT_PATH" "$DIR"
done

echo "DS_LOCATION_USED_MB=$DS_USED_MB"
echo "DS_LOCATION_TOTAL_MB=$DS_TOTAL_MB"
echo "DS_LOCATION_FREE_MB=$DS_FREE_MB"
