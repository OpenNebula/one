# -------------------------------------------------------------------------- #
# Copyright 2002-2020, OpenNebula Project, OpenNebula Systems                #
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

# ------------------------------------------------------------------------------
# Returns REPLICA_HOST attribute from DATASTORE template
# ------------------------------------------------------------------------------
function get_replica_host {
    local DS_ID=$1

    XPATH="${ONE_LOCAL_VAR}/remotes/datastore/xpath.rb --stdin"
    LOC='/DATASTORE/TEMPLATE/REPLICA_HOST'

    echo "$(awk 'gsub(/[\0]/, x)' <(onedatastore show $DS_ID -x|$XPATH $LOC))"
}

# ------------------------------------------------------------------------------
# Computes md5sum for image or for image with snapshots
# ------------------------------------------------------------------------------
function md5sum_with_snaps {
    local IMG=$1
    local DIR=${2:-.snap}

    SNAPS="$(ls ${IMG}${DIR} 2>/dev/null)"

    if [ -z "$SNAPS" ]; then
        md5sum $IMG | awk '{print $1}'
    else
        CMD="md5sum $IMG"

        for S in $SNAPS; do
            CMD+=" ${IMG}${DIR}/${S}"
        done

        $CMD | md5sum | awk '{print $1}'
    fi
}

# ------------------------------------------------------------------------------
# Compares md5sum of image on REPLICA_HOST and local
# ------------------------------------------------------------------------------
function repl_img_outdated {
    local IMG_PATH="$1"
    local REPLICA_HOST="$2"

    if [ ! -f "${IMG_PATH}.md5sum" ]; then
        md5sum_with_snaps "$IMG_PATH" > "${IMG_PATH}.md5sum"
    fi

    SRC_MD5SUM=$(cat "${IMG_PATH}.md5sum")

    # replica can not reuse md5sum_with_snaps, duplicate it
    SCRIPT=$(cat <<EOF
        if [ -f ${IMG_PATH}.md5sum ]; then
            cat ${IMG_PATH}.md5sum
        else
            SNAPS="\$(ls ${IMG_PATH}.snap 2>/dev/null)"

            if [ -z "\$SNAPS" ]; then
                md5sum $IMG_PATH 2>/dev/null | cut -d " " -f 1 > ${IMG_PATH}.md5sum
            else
                CMD="md5sum $IMG_PATH"

                for S in \$SNAPS; do
                    CMD+=" ${IMG_PATH}.snap/${S}"
                done

                \$CMD | md5sum | cut -d " " -f 1 > ${IMG_PATH}.md5sum
            fi

            cat ${IMG_PATH}.md5sum
        fi
EOF
)

    DST_MD5SUM=$(ssh "$REPLICA_HOST" "$SCRIPT")

    [ "$SRC_MD5SUM" != "$DST_MD5SUM" ]
}

# ------------------------------------------------------------------------------
# Rsync (tar|ssh) IMG_PATH to the REPLICA_HOST
# ------------------------------------------------------------------------------
function rsync_img_to_replica {
    local IMG_PATH="$1"
    local REPLICA_HOST="$2"
    local LOCK_TIMEOUT="${REPLICA_COPY_LOCK_TIMEOUT:-600}"
    local DST_DIR=$(dirname $IMG_PATH)

    ssh_make_path $REPLICA_HOST $DST_DIR

    # sync to replica, include .md5sum and .snap dir
    LOCK="$REPLICA_HOST-${IMG_PATH//\//-}"
    if exclusive "$LOCK" "$LOCK_TIMEOUT" repl_img_outdated $IMG_PATH $REPLICA_HOST; then
        LOCK="replica-$REPLICA_HOST-${IMG_PATH//\//-}"
        RSYNC_CMD=$(cat <<EOF
            set -e -o pipefail
            tar -cSf - ${IMG_PATH}* | \
                ssh $REPLICA_SSH_FE_OPTS $REPLICA_HOST 'tar xSf - -C / '
EOF
)
        exclusive "$LOCK" "$LOCK_TIMEOUT" \
            multiline_exec_and_log "$RSYNC_CMD" \
                "Failed to rsync $IMG_PATH to $REPLICA_HOST"
    fi
}
