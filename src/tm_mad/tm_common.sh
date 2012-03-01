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

export LANG=C

ONE_SH=$ONE_LIB/sh

. $ONE_SH/scripts_common.sh

# ------------------------------------------------------------------------------
# Set enviroment for the tm drivers (bash-based)
# ------------------------------------------------------------------------------
if [ -z "$ONE_LOCATION" ]; then
    ONE_LOCAL_VAR=/var/lib/one
    ONE_LIB=/usr/lib/one
else
    ONE_LOCAL_VAR=$ONE_LOCATION/var
    ONE_LIB=$ONE_LOCATION/lib
fi

if [ "x$(uname -s)" = "xLinux" ]; then
    SED="$SED -r"
else
    SED="/usr/bin/sed -E"
fi

# ------------------------------------------------------------------------------
# Function to get hosts and paths from arguments
# ------------------------------------------------------------------------------

# Gets the host from an argument
function arg_host
{
    echo $1 | $SED 's/^([^:]*):.*$/\1/'
}

# Gets the path from an argument
function arg_path
{
    echo $1 | $SED 's/^[^:]*:(.*)$/\1/'
}

#Return the DATASTORE_LOCATION from OpenNebula configuration
function set_ds_location
{
    DS_LOCATION=`grep '^DATASTORE_LOCATION=' $ONE_LOCAL_VAR/config | cut -d= -f2`
    DS_LOCATION=`fix_var_slashes $DS_LOCATION`
}
