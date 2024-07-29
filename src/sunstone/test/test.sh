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

if [ -z $ONE_LOCATION ]; then
    echo "ONE_LOCATION not defined."
    exit -1
fi

VAR_LOCATION="$ONE_LOCATION/var"

if [ "$(ls -A $VAR_LOCATION)" ]; then
    echo "$VAR_LOCATION is not empty."
    exit -1
fi

for j in `ls ./spec/*_spec.rb` ; do
    PID=$$

    oned -f &
    sleep 1
    until grep 'Auth Manager loaded' ${VAR_LOCATION}/oned.log; do sleep 1; done

    rspec $j -f s
    CODE=$?

    pkill -P $PID oned
    sleep 2s;
    pkill -9 -P $PID oned

    if [ $CODE != 0 ] ; then
        exit 1
    fi

    find $VAR_LOCATION -mindepth 1 -delete
done
