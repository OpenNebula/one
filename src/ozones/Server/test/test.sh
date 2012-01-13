#!/bin/bash

# -------------------------------------------------------------------------- #
# Copyright 2002-2012, OpenNebula Project Leads (OpenNebula.org)             #
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


VAR_LOCATION="$PWD/var"
OZONES_LOCATION="$PWD/../"

mkdir -p $VAR_LOCATION

if [ "$(ls -A $VAR_LOCATION)" ]; then
    echo "$VAR_LOCATION is not empty."
    exit -1
fi

rm -rf coverage_server

rcov  --exclude /Library --exclude /Users/tinova/.gem -o coverage_server `which rackup` -- $OZONES_LOCATION/config.ru -s thin -p 6121 -o localhost  &> server.log  &
RCOVPID=$!
sleep 5

rake test_with_rcov
CODE=$?

kill $RCOVPID
sleep 2s;

if [ $CODE != 0 ] ; then
    exit 1
fi

find $VAR_LOCATION -mindepth 1 -delete
