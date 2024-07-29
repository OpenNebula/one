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
    if [ "$2" = "NOFIX" ]; then
        echo "$ARG_PATH"
    else
        fix_dir_slashes "$ARG_PATH"
    fi
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
    done < <(onevm show -x "${1:-$VMID}" | $XPATH \
                        /VM/LCM_STATE )

    LCM_STATE="${XPATH_ELEMENTS[0]}"

    echo $LCM_STATE
}

# Check if the VM is undeployed/stopped

function is_undeployed
{
    XPATH="${ONE_LOCAL_VAR}/remotes/datastore/xpath.rb --stdin"

    unset i XPATH_ELEMENTS

    while IFS= read -r -d '' element; do
        XPATH_ELEMENTS[i++]="$element"
    done < <(onevm show -x "${1:-$VMID}" | $XPATH \
                        '/VM/HISTORY_RECORDS/HISTORY[last()]/HOSTNAME' )

    LAST_HOST="${XPATH_ELEMENTS[0]}"
    CURRENT_HOST="$2"

    if [ "$LAST_HOST" != "$CURRENT_HOST" ]; then
        return 0
    fi

    return 1
}

function migrate_other
{

    DRIVER_PATH=$(dirname $0)
    MAD=${DRIVER_PATH##*/}

    XPATH="$DRIVER_PATH/../../datastore/xpath.rb"

    unset i
    while IFS= read -r -d '' element; do
        XPATH_ELEMENTS[i++]="$element"
    done< <(echo $TEMPLATE_64 | base64 -d | "$XPATH" \
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

    if [ -n "$6" ]; then
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
            echo $TEMPLATE_64 | "${DRIVER_PATH}/../$TM/${0##*/}" "$@" "$MAD"
            PROCESSED+=" $TM "
        fi
    done
}

#--------------------------------------------------------------------------------
# Rebase backing files of snapshots in current directory
#  @param $1 name of the backing_file symlink used internally
#--------------------------------------------------------------------------------
rebase_backing_files() {
    local DST_FILE=$1

    for SNAP_ID in $(find * -maxdepth 0 -type f -print); do
        INFO=$(qemu-img info --output=json $SNAP_ID)

        if [[ $INFO =~ "backing-filename" ]]; then
            BACKING_FILE=${INFO/*backing-filename\": \"/}
            BACKING_FILE=${BACKING_FILE/\"*/}
            BACKING_FILE=$(basename ${BACKING_FILE})
            qemu-img rebase -f qcow2 -F qcow2 -u -b "${DST_FILE}.snap/$BACKING_FILE" $SNAP_ID
        fi
    done
}

# ------------------------------------------------------------------------------
# Prints command that creates qcow2 dir structure as follows:
#
# parameters:
#     $1 <- SRC_PATH
#     $2 <- DST_PATH
#     $3 <- convert | create
#
# disk.0                   symlink -> disk.0.snap/0
# disk.0.snap              dir
# disk.0.snap/disk.0.snap  symlink -> . for relative referencing
#
# if $3 == convert
# disk.0.snap/0            qcow2 standalone image

# if $3 == create
# disk.0.snap/0            qcow2 with backing file -> $SRC_PATH
# ------------------------------------------------------------------------------

function qcow_dir_cmd
{
    local SRC_PATH="$1"
    local DST_PATH="$2"
    local ACTION="$3"
    local DST_FILE

    DST_FILE=$(basename "$DST_PATH")
    DST_DIR=$(dirname "$DST_PATH")

    echo "set -e -o pipefail"
    echo "pushd ${DST_DIR}"

    echo "rm -rf ${DST_PATH}.snap"
    echo "mkdir -p ${DST_PATH}.snap"

    if [ "$ACTION" = "convert" ]; then
        echo "qemu-img convert -q -O qcow2 $SRC_PATH $DST_PATH.snap/0"

    elif [ "$ACTION" = "create" ]; then
        echo "B_FORMAT=\$($QEMU_IMG info $SRC_PATH | grep '^file format:' | awk '{print \$3}' || :)"
        echo "$QEMU_IMG create -o backing_fmt=\${B_FORMAT:-raw} -b $SRC_PATH -f qcow2 $QCOW2_OPTIONS ${DST_PATH}.snap/0"
    fi

    echo "rm -f $DST_PATH"
    echo "cd ${DST_PATH}.snap"
    echo "ln -sf . ${DST_FILE}.snap"
    echo "ln -sf ${DST_FILE}.snap/0 $DST_PATH"
    echo "popd"
}

# To allow more positive parameters options
function is_yes
{
    [[ "$1" =~ ^(yes|YES|true|TRUE)$ ]]
}
