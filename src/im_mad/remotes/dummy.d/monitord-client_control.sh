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

#--------------------------------------------------------------------------- #
# Process Arguments
#--------------------------------------------------------------------------- #
ACTION="start"

if [ "$1" = "stop" ]; then
    shift
    ACTION="stop"
fi

ARGV=$*

HID=$2
HNAME=$3

STDIN=`cat -`

# Directory that contains this file
DIR=$(pwd)

# Basename
BASENAME=$(basename $0 _control.sh)

# Collectd client (Ruby)
CLIENT=$DIR/${BASENAME}.rb

# Collectd client PID
CLIENT_PID_FILE=/tmp/one-monitord-$HID.pid

# Launch the client
function start_client() {
    rm $CLIENT_PID_FILE >/dev/null 2>&1

    echo "$STDIN" | base64 -d - | /usr/bin/env ruby $CLIENT $ARGV &

    echo $! > $CLIENT_PID_FILE

    sleep 10

    ps axuww | grep "$CLIENT $ARGV" | grep -v grep > /dev/null 2>&1 || exit -1
}

# Stop the client
function stop_client() {
    local pids=$(ps axuww | grep "$CLIENT $ARGV" | grep -v grep | awk '{print $2}')

    if [ -n "$pids" ]; then
        kill $pids
    fi

    rm -f $CLIENT_PID_FILE
}

case $ACTION in
start)
    stop_client
    start_client
    ;;

stop)
    stop_client
    ;;
esac
