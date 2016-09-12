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

#Return LCM_STATE
function lcm_state
{
    XPATH="${ONE_LOCAL_VAR}/remotes/datastore/xpath.rb --stdin"

    unset i XPATH_ELEMENTS

    while IFS= read -r -d '' element; do
        XPATH_ELEMENTS[i++]="$element"
    done < <(onevm show -x $VMID| $XPATH \
                        /VM/LCM_STATE )

    LCM_STATE="${XPATH_ELEMENTS[0]}"

    echo $LCM_STATE
}

function migrate_other
{
    DRIVER_PATH=$(dirname $0)
    MAD=${DRIVER_PATH##*/}

    XPATH="$DRIVER_PATH/../../datastore/xpath.rb"

    unset i
    while IFS= read -r -d '' element; do
        XPATH_ELEMENTS[i++]="$element"
    done< <("$XPATH" -b "$6" \
            /VM/TEMPLATE/CONTEXT/DISK_ID \
            %m%/VM/TEMPLATE/DISK/DISK_ID \
            %m%/VM/TEMPLATE/DISK/CLONE \
            %m%/VM/TEMPLATE/DISK/TM_MAD)

    unset i
    CONTEXT_DISK_ID="${XPATH_ELEMENTS[i++]}"
    DISK_IDS="${XPATH_ELEMENTS[i++]}"
    CLONES="${XPATH_ELEMENTS[i++]}"
    TM_MADS="${XPATH_ELEMENTS[i++]}"
    DISK_ID_ARRAY=($DISK_IDS)
    CLONE_ARRAY=($CLONES)
    TM_MAD_ARRAY=($TM_MADS)

    if [ -n "$7" ]; then
        return 0
    fi

    for i in ${!TM_MAD_ARRAY[@]}; do
        TM="${TM_MAD_ARRAY[i]}"

        if [ "$TM" = "$MAD" ]; then
            continue
        fi
        if [ "${PROCESSED/ $TM /}" = "$PROCESSED" ]; then
            # call the other TM_MADs with same arguments
            # but mark that it is not SYSTEM_DS
            log "Call $TM/${0##*/}"
            "${DRIVER_PATH}/../$TM/${0##*/}" "$@" "$MAD"
            PROCESSED+=" $TM "
        fi
    done
}
