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

if [ -z "${ONE_LOCATION}" ]; then
    MAD_LOCATION=/usr/lib/one/mads
    VAR_LOCATION=/var/lib/one
    RUN_LOCATION=/var/run/one
    LOCK_LOCATION=/var/lock/one
    LOG_LOCATION=/var/log/one
else
    MAD_LOCATION=$ONE_LOCATION/lib/mads
    VAR_LOCATION=$ONE_LOCATION/var
    RUN_LOCATION=$ONE_LOCATION/var/run
    LOCK_LOCATION=$ONE_LOCATION/var/lock
    LOG_LOCATION=$ONE_LOCATION/var
fi

LOG="$LOG_LOCATION/vcenter_monitor.log"
LOCK_FILE="$LOCK_LOCATION/vcenter_monitor"
FIFO_PATH="$RUN_LOCATION/vcenter_monitor.fifo"
VMON_PATH="$VAR_LOCATION/remotes/im/lib/vcenter_monitor.rb"

function vcenter_running {
    VMON_PIDS=$(ps axuww | grep "ruby[^ ]* $VMON_PATH" | grep -v grep | awk '{print $2}')

    if [ -z "$VMON_PIDS" ]; then
        return 1
    fi

    return 0
}

#-------------------------------------------------------------------------------
# Process Arguments
#-------------------------------------------------------------------------------
ACTION="start"

if [ "$1" = "stop" ]; then
    shift
    ACTION="stop"
fi

ARGV=$*
HYPERV=$1
HID=$2

STDIN=`cat -`

# Start of critical section (opens LOCK_FILE with fd 45)
exec 45>$LOCK_FILE

flock 45

# Check if vcenter_monitor is running and restart if needed
vcenter_running

if [ $? -eq 1 ]; then
    /usr/bin/env ruby $VMON_PATH </dev/null &>$LOG &

    sleep 3

    vcenter_running

    if [  $? -eq 1 ]; then
        echo "Cannot start vcenter_monitor service"
        exit 1
    fi
fi

MONITOR_ACTION="$ACTION $HID $STDIN"

echo $MONITOR_ACTION > $FIFO_PATH

echo "<MONITOR_MESSAGES></MONITOR_MESSAGES>"

exit 0
