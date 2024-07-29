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

(
[ -f /tmp/one-monitord-client.pid ] || exit 0
running_pid=$(cat /tmp/one-monitord-client.pid)
pids=$(ps axuwww | grep -e /monitord-client.rb| grep -v grep | awk '{ print $2 }' | grep -v "^${running_pid}$")

if [ -n "$pids" ]; then
    kill $pids
fi

) > /dev/null

