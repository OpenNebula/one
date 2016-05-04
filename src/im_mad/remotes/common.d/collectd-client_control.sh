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


#--------------------------------------------------------------------------- #
# Process Arguments
#--------------------------------------------------------------------------- #

ACTION="start"

if [ "$1" = "stop" ]; then
    shift
    ACTION="stop"
fi

ARGV=$*

#--------------------------------------------------------------------------- #
#--------------------------------------------------------------------------- #

# Directory that contains this file
DIR=$(pwd)

# Basename
BASENAME=$(basename $0 _control.sh)

# Collectd client (Ruby)
CLIENT=$DIR/${BASENAME}.rb

# Collectd client PID
CLIENT_PID_FILE=/tmp/one-collectd-client.pid

# Launch the client
function start_client() {
    nohup /usr/bin/env ruby $CLIENT $ARGV >/dev/null 2>&1 &
}

function stop_client() {
    PID=$(get_pid)
    kill $PID
}

function remove_pid_file() {
    rm -f $CLIENT_PID_FILE
}

# Write the PID
function write_pid() {
    echo $1 > $CLIENT_PID_FILE
}

function get_pid() {
    cat $CLIENT_PID_FILE
}

# Check if running process
function check_running() {
    # Assume the process is not running if there is no pid file
    test ! -f $CLIENT_PID_FILE && return 1

    PID=$(get_pid)

    if ps --no-headers -o command $PID 2>/dev/null | grep -q $BASENAME; then
        return 0
    else
        # Stale PID file
        rm -f $CLIENT_PID_FILE
        return 1
    fi
}

case $ACTION in
start)
    if ! check_running; then
        start_client
        write_pid $!
    fi

    # This script returns the run_probes execution
    HYPERVISOR=$1
    shift
    set $HYPERVISOR-probes $@

    $DIR/../run_probes $@

    ;;

stop)
    if check_running; then
        stop_client
        remove_pid_file
    fi
    ;;
esac
