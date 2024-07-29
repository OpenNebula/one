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

##############################################################################
# WARNING! WARNING! WARNING! WARNING! WARNING! WARNING! WARNING! WARNING!
#
# This script needs to be modified to enable fencing of the host. By default it
# will fail, as the first line is 'exit 1'. You will need to remove it.
#
# In order to perform the fencing, you will probably need to install a fencing
# utility. They are typically found in: fence-agents-all (CentOS) and fence-
# agents (Ubuntu). They come with many utilities: fence_ilo, fence_ipmilan,
# fence_apc, etc...
#
# To call the fencing utility, you will need to pass some parameters, which are
# typically the iLO IP of the host, etc. We recommend you enter this information
# in the host's template, and pick it up using the xpath example below. AS AN
# EXAMPLE (only an example) the script below expects that you have defined a
# parameter called FENCE_IP in the Host's template, and it will rely on that to
# call the fencing mechanism. You should customize this to your needs. It is
# perfectly OK to discard the code below and use a different mechanism, like
# storing the information required to perform the fencing in a separate CMDB,
# etc. However, you will probably need to get the host's NAME, which should be
# done as shown below.
#
# WARNING! WARNING! WARNING! WARNING! WARNING! WARNING! WARNING! WARNING!
#############################################################################

# Configuration attributes
SLEEP_TIME="1"
RETRIES="5"
USERNAME=""
PASSWORD=''
ACTION="off"

# @param $1 the host information in base64
HOST_TEMPLATE=$(cat -)

# @return 0 on success. Make sure this script does not return 0 if it fails.

# To enable remove this line
echo ""Fence host not configured, please edit ft/fence_host.sh"" && exit 1

#-------------------------------------------------------------------------------
# Get host parameters with XPATH
#-------------------------------------------------------------------------------

if [ -z "$ONE_LOCATION" ]; then
    XPATH=/var/lib/one/remotes/datastore/xpath.rb
else
    XPATH=$ONE_LOCATION/var/remotes/datastore/xpath.rb
fi

if [ ! -x "$XPATH" ]; then
    echo "XPATH not found: $XPATH"
    exit 1
fi

XPATH="${XPATH} -b ${HOST_TEMPLATE}"

unset i j XPATH_ELEMENTS

while IFS= read -r -d '' element; do
    XPATH_ELEMENTS[i++]="$element"
done < <($XPATH     /HOST/ID \
                    /HOST/NAME \
                    /HOST/TEMPLATE/FENCE_IP )

HOST_ID="${XPATH_ELEMENTS[j++]}"
NAME="${XPATH_ELEMENTS[j++]}"
FENCE_IP="${XPATH_ELEMENTS[j++]}"

if [ -z "$FENCE_IP" ]; then
    echo "Fence ip not found"
    exit 1
fi

#-------------------------------------------------------------------------------
# Fence
#-------------------------------------------------------------------------------

# Examples:
#
# Without retries
# fence_ilo -a $FENCE_IP -l <username> -p <password> && exit 0
#
# With retries
# while [ "$RETRIES" -gt 0 ]
# do
#     fence_ilo5 -P --ip=$FENCE_IP --password="${PASSWORD}" --username="${USERNAME}" --action="${ACTION}" && exit 0
#     RETRIES=$((RETRIES-1))
#     sleep $SLEEP_TIME
# done

# Reaching this point means fencing failed
exit 1
