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

if [ -z $ONE_LOCATION ]; then
    ONEDCONF_LOCATION="/etc/one/oned.conf"
else
    ONEDCONF_LOCATION="$ONE_LOCATION/etc/oned.conf"
fi

if [ -f $ONEDCONF_LOCATION ]; then
    echo "$ONEDCONF_LOCATION has to be overwritten, move it to a safe place."
    exit -1
fi

if [ -z $ONE_LOCATION ]; then
    sudo cp oned.conf $ONEDCONF_LOCATION
else
    cp oned.conf $ONEDCONF_LOCATION
fi

export ONE_XMLRPC=http://localhost:2666/RPC2

RC=0

./test.sh HostTest
let RC=RC+$?

./test.sh ImageTest
let RC=RC+$?

./test.sh SessionTest
let RC=RC+$?

./test.sh UserTest
let RC=RC+$?

./test.sh VirtualMachineTest
let RC=RC+$?

./test.sh VirtualNetworkTest
let RC=RC+$?

./test.sh TemplateTest
let RC=RC+$?

./test.sh GroupTest
let RC=RC+$?

./test.sh AclTest
let RC=RC+$?

./test.sh DocumentTest
let RC=RC+$?

./test.sh VdcTest
let RC=RC+$?

./test.sh SecurityGroupTest
let RC=RC+$?

./test.sh VirtualRouterTest
let RC=RC+$?

exit $RC