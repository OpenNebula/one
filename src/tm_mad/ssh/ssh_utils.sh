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

if [ -z "$ONE_LOCATION" ]; then
    ONE_LOCAL_VAR=/var/lib/one
    SSH_RC=/var/lib/one/remotes/etc/tm/ssh/sshrc
else
    ONE_LOCAL_VAR=$ONE_LOCATION/var
    SSH_RC=$ONE_LOCATION/var/remotes/etc/tm/ssh/sshrc
fi

. $SSH_RC

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

        ssh_exec_and_log_stdin $REPLICA_HOST \
            "clean_cache \"$(dirname $IMG_PATH)\"" \
            "$ONE_LOCAL_VAR/remotes/tm/ssh/ssh_utils.sh" \
            "Failed to run clean_cache on $REPLICA_HOST"

    fi
}

# ------------------------------------------------------------------------------
# Returns MB size of file/dir
# ------------------------------------------------------------------------------
function size_mb {
    du -s -BM $1 | cut -f1 -d'M'
}

# ------------------------------------------------------------------------------
# Delete images from replica directory cache
# ------------------------------------------------------------------------------
function clean_cache() {
    local CACHE_DIR=$1
    local MAX_MB=$REPLICA_MAX_SIZE_MB
    local CACHE_MB=$( size_mb $CACHE_DIR )

    if [ ! -d $CACHE_DIR ]; then
        return 0
    fi

    # if MAX_MB not given count it by perc limit from disk size
    if [ -z "$MAX_MB" ]; then
        SIZE=$(df -BM --output=size $CACHE_DIR | tail -1 | cut -f1 -d'M')
        USED=$(df -BM --output=used $CACHE_DIR | tail -1 | cut -f1 -d'M')
        MAX_MB=$(( ${REPLICA_MAX_USED_PERC:-90} * SIZE / 100 - USED + CACHE_MB))
    fi

    if [ $CACHE_MB -le $MAX_MB ]; then
        return 0
    fi

    local TO_FREE="$(( ((CACHE_MB - MAX_MB) * 9) / 10 ))"
    local FREED=0

    IMAGES=$(find $CACHE_DIR -mindepth 1 -maxdepth 1 -regex '.*/[-a-f0-9]*' -printf '%A@ %p\n'\
        | sort -n)

    (
        IFS=$'\n'
        for I in $IMAGES; do
            IMG=$(echo $I | sed 's/[0-9.]* //')

            rm -f $IMG
            rm -f $IMG.md5sum

            FREED=$((FREED + $( size_mb $IMG ) ))
            if [ $FREED -ge $TO_FREE ]; then
                break;
            fi
        done
    )
}
