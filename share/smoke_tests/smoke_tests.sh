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

#-------------------------------------------------------------------------------
# Smoke tests for OpenNebula, to be triggered by travis or manually
# It executes all scripts in 'tests' folder and expects 0 exit code
#-------------------------------------------------------------------------------

# default parameters values

LOG_FILE='smoke_tests.results'

check_test() {
    local TEST=$1

    echo "Executing test $TEST" >> ${LOG_FILE}
    eval $TEST >> ${LOG_FILE} 2>&1
    RC=$?
    echo "RC for $TEST is $RC"
    return $RC
}

for smoke_test in share/smoke_tests/tests/*.sh; do
  check_test "$smoke_test" || break
done

if [ $RC == 0 ]; then
   echo "All tests OK!"
else
   echo "Test failed: "$smoke_test
   echo "Log follows:"
   cat $LOG_FILE
fi

exit $RC
