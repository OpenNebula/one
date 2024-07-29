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

# start sunstone
sunstone-server start

# check it's up
RC=`timeout 60 sh -c 'until nc -z $0 $1; do sleep 1; done' localhost 9869`

echo "Sunstone log"
cat /var/log/one/sunstone.log
echo
echo "Sunstone error log"
cat /var/log/one/sunstone.error
echo "---------"

exit $RC
