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

# Usage: test.sh <Test_name>
# For instance: test.sh ImageTest

JUNIT_JAR="/usr/share/java/junit4.jar"

if [ -z $ONE_LOCATION ]; then
    echo "ONE_LOCATION not defined."
    exit -1
fi

VAR_LOCATION="$ONE_LOCATION/var"

if [ -f $VAR_LOCATION/one.db ]; then
    echo "$VAR_LOCATION/one.db has to be overwritten, move it to a safe place."
    exit -1
fi

echo "========================================================================="
echo "Doing $1"
echo "========================================================================="

PID=$$

oned -f &

sleep 10s;

java -cp ../lib/*:../jar/*:$JUNIT_JAR:. org.junit.runner.JUnitCore $1

CODE=$?

pkill -P $PID oned
sleep 4s;
pkill -9 -P $PID oned
rm -f $VAR_LOCATION/one.db

exit $CODE