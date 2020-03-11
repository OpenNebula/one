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

#--------------------------------------------------------------------------- #
# Process Arguments
#--------------------------------------------------------------------------- #
ACTION="start"

if [ "$1" = "stop" ]; then
    shift
    ACTION="stop"
fi

ARGV=$*

STDIN=`cat -`

# Directory that contains this file
DIR=$(pwd)

# Basename
BASENAME=$(basename $0 _control.sh)

# Collectd client (Ruby)
CLIENT=$DIR/${BASENAME}.rb

# Collectd client PID
CLIENT_PID_FILE=/tmp/one-monitord-client.pid

# Launch the client
function start_client() {
    echo "$STDIN" | /usr/bin/env ruby $CLIENT $ARGV &

    echo $! > $CLIENT_PID_FILE
}

# Stop the client
function stop_client() {
    local pids=$(ps axuww | grep /monitord-client.rb | grep -v grep | awk '{print $2}')

    if [ -n "$pids" ]; then
        kill -9 $pids
        sleep 5
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
