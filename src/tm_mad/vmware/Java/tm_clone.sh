#!/bin/bash

# -------------------------------------------------------------------------- #
# Copyright 2002-2009, Distributed Systems Architecture Group, Universidad   #
# Complutense de Madrid (dsa-research.org)                                   #
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


#Setup driver variables
DRIVER_NAME="tm_vmware"

if [ -z "${ONE_LOCATION}" ]; then
    DRIVERRC=/etc/one/${DRIVER_NAME}/${DRIVER_NAME}rc
    TMCOMMON=/usr/lib/one/mads/tm_common.sh
else
    DRIVERRC=$ONE_LOCATION/etc/${DRIVER_NAME}/${DRIVER_NAME}rc
    TMCOMMON=$ONE_LOCATION/lib/mads/tm_common.sh
fi

. $TMCOMMON

# Export the im_mad specific rc

export_rc_vars $DRIVERRC

echo $VMWARE_TRUSTORE

LOG_FILE=$DRIVER_NAME

MAD_FILE="TMClone"

if [ -z "${ONE_LOCATION}" ]; then
    MAD_LOG_PATH=/var/log/one/$LOG_FILE.log	
else
    MAD_LOG_PATH=$ONE_LOCATION/var/$LOG_FILE.log
fi

# Execute the actual MAD
if [ -n "${ONE_MAD_DEBUG}" ]; then
    exec_and_log "exec nice -n $PRIORITY java -cp .:$CLASSPATH \
      -Djavax.net.ssl.trustStore=$VMWARE_TRUSTORE -Dusername=$USERNAME \
      -Dpassword=$PASSWORD -Xmx1024M $MAD_FILE $*"
else
     exec nice -n $PRIORITY java -cp .:$CLASSPATH \
      -Djavax.net.ssl.trustStore=$VMWARE_TRUSTORE -Dusername=$USERNAME \ 
      -Dpassword=$PASSWORD -Xmx1024M $MAD_FILE $* 2> /dev/null
fi



