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

IO_FIFO_PATH="/tmp/vcenter_monitor.fifo"

if [ -z "$ONE_LOCATION" ]; then
    LOG=/var/log/one/vcenter_monitor.log
    BIN=/var/lib/one/remotes/im/lib/vcenter_monitor.rb
else
    BIN=$ONE_LOCATION/var/remotes/im/lib/vcenter_monitor.rb
    LOG=$ONE_LOCATION/var/vcenter_monitor.log
fi

#-------------------------------------------------------------------------------
# Check if vcenter_monitor is running
#-------------------------------------------------------------------------------
if [ ! -p $IO_FIFO_PATH ]; then
    rm -f $IO_FIFO_PATH > /dev/null 2>&1
    mkfifo $IO_FIFO_PATH
fi

pid=`ps auxx | grep vcenter_monitor.rb | grep -v grep | awk '{print $2}'`

if [ -z $pid ]; then
    ruby $BIN > $LOG 2>&1 &

    sleep 3

    pid=`ps auxx | grep vcenter_monitor.rb | grep -v grep | awk '{print $2}'`

    if [ -z $pid ]; then
        echo "Cannot start vcenter_monitor service: `cat $LOG`"
        exit 1
    fi
fi

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

MONITOR_ACTION="$ACTION $HID $STDIN"

#todo check it is running wait for fifo

echo $MONITOR_ACTION > $IO_FIFO_PATH

echo "<MONITOR_MESSAGES></MONITOR_MESSAGES>"

exit 0

