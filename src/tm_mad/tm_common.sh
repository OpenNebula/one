# -------------------------------------------------------------------------- #
# Copyright 2002-2015, OpenNebula Project (OpenNebula.org), C12G Labs        #
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

# ------------------------------------------------------------------------------
# Set enviroment for the tm drivers (bash-based)
# ------------------------------------------------------------------------------
if [ -z "$ONE_LOCATION" ]; then
    ONE_LOCAL_VAR=/var/lib/one
    ONE_LIB=/usr/lib/one
    DS_DIR=/var/lib/one/datastores
else
    ONE_LOCAL_VAR=$ONE_LOCATION/var
    ONE_LIB=$ONE_LOCATION/lib
    DS_DIR=$ONE_LOCATION/var/datastores
fi

ONE_SH=$ONE_LIB/sh

. $ONE_SH/scripts_common.sh

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
    ARG_PATH=`echo $1 | $SED 's/^[^:]*:(.*)$/\1/'`
    fix_dir_slashes "$ARG_PATH"
}

#Return 1 if the first argument is a disk
function is_disk
{
    echo "$1" | $GREP '/disk\.[0-9]\+' > /dev/null 2>&1

    if [ $? -eq 0 ]; then
        echo "1"
    else
        echo "0"
    fi
}

#Makes path src ($1) relative to dst ($2)
function make_relative {
    src=$1
    dst=$2

    common=$dst

    while [ -z "`echo $src | grep -E "^$common"`" ]; do
        common=`dirname $common`
        dots="../$dots"
    done

    echo $dots${src#$common/}
}

#Return DISK_TYPE
function disk_type
{
    # Let's check if it is a CDROM
    DISK_ID=$(echo "$DST_PATH" | $AWK -F. '{print $NF}')
    XPATH="${ONE_LOCAL_VAR}/remotes/datastore/xpath.rb --stdin"

    unset i XPATH_ELEMENTS

    while IFS= read -r -d '' element; do
        XPATH_ELEMENTS[i++]="$element"
    done < <(onevm show -x $VMID| $XPATH \
                        /VM/TEMPLATE/DISK[DISK_ID=$DISK_ID]/TYPE )

    DISK_TYPE="${XPATH_ELEMENTS[0]}"

    echo $DISK_TYPE
}