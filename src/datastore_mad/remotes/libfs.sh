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

#------------------------------------------------------------------------------
#  Set up environment variables
#    @param $1 - Datastore base_path
#    @param $2 - Restricted directories
#    @param $3 - Safe dirs
#    @return sets the following environment variables
#      - RESTRICTED_DIRS: Paths that cannot be used to register images
#      - SAFE_DIRS: Paths that are safe to specify image paths
#      - BASE_PATH: Path where the images will be stored
#------------------------------------------------------------------------------
function set_up_datastore {
    #
    # Load the default configuration for FS datastores
    #
    BASE_PATH="$1"
    RESTRICTED_DIRS="$2"
    SAFE_DIRS="$3"

    if [ -z "${ONE_LOCATION}" ]; then
        VAR_LOCATION=/var/lib/one/
        ETC_LOCATION=/etc/one/
    else
        VAR_LOCATION=$ONE_LOCATION/var/
        ETC_LOCATION=$ONE_LOCATION/etc/
    fi

    #
    # RESTRICTED AND SAFE DIRS (from default configuration)
    #
    RESTRICTED_DIRS="$VAR_LOCATION $ETC_LOCATION $HOME/ $RESTRICTED_DIRS"

    export BASE_PATH
    export RESTRICTED_DIRS
    export SAFE_DIRS
}

#-------------------------------------------------------------------------------
# Get file format using qemu-img
#   @return string representation of the format, empty if error
#-------------------------------------------------------------------------------
function image_format {
    $QEMU_IMG info $1 2>/dev/null | grep -Po '(?<=^file format: )\w+'
}

#-------------------------------------------------------------------------------
# Get image virtual size using qemu-img
#   @return string representation of the format, empty if error
#-------------------------------------------------------------------------------
function image_vsize {
    echo "$($QEMU_IMG info --output json "${1}" | jq '."virtual-size"')"
}

#-------------------------------------------------------------------------------
# Get minimal image size required to download
#   @return integer number of bytes
#-------------------------------------------------------------------------------
function image_size_required {
    unset REQUIRED

    OUT=$($QEMU_IMG info "${1}" 2>&1)
    if [ $? -ne 0 ]; then
        if file "${1}" | grep -q 'LUKS encrypted file'; then
            REQUIRED="$(du -sb ${2} | cut -f1)"
        else
            REQUIRED=$(echo "${OUT}" | \
                grep 'expecting at least [0-9]* bytes' | \
                sed -e 's/.*expecting at least \([0-9]*\) bytes.*/\1/')
        fi
    fi

    echo "${REQUIRED:-65536}"
}

#-------------------------------------------------------------------------------
# Generates an unique image hash. Requires ID to be set
#   @return hash for the image (empty if error)
#-------------------------------------------------------------------------------
function generate_image_hash {

    CANONICAL_STR="`$DATE +%s`:$ID"

    CANONICAL_MD5=$($MD5SUM - << EOF
$CANONICAL_STR
EOF
)
    IMAGE_HASH="$(echo $CANONICAL_MD5 | cut -d ' ' -f1)"

    if [ -z "$IMAGE_HASH" ]; then
        log_error "Error generating the path in generate_image_hash."
        exit 1
    fi

    echo "${IMAGE_HASH}"
}

#-------------------------------------------------------------------------------
# Generates an unique image path. Requires BASE_PATH to be set
#   @return path for the image (empty if error)
#-------------------------------------------------------------------------------
function generate_image_path {
    IMAGE_HASH=`generate_image_hash`

    if [ -z "$BASE_PATH" ]; then
        log_error "Error generating the path in generate_image_path."
        exit 1
    fi

    echo "${BASE_PATH}/${IMAGE_HASH}"
}

#-------------------------------------------------------------------------------
# Set up the arguments for the downloader script
#   @param $1 - MD5 string
#   @param $2 - SHA1 string
#   @param $3 - NO_DECOMPRESS
#   @param $4 - BW LIMIT
#   @param $5 - SRC
#   @param $6 - DST
#   @return downloader.sh util arguments
#-------------------------------------------------------------------------------
function set_downloader_args {
    HASHES=" "

    if [ -n "$1" ]; then
        HASHES="--md5 $1"
    fi

    if [ -n "$2" ]; then
        HASHES="$HASHES --sha1 $2"
    fi

    if [ "x$(echo "$3" | tr A-Z a-z)" = "xyes" ]; then
        HASHES="$HASHES --nodecomp"
    fi

    if [ -n "$4" ]; then
        HASHES="$HASHES --limit $4"
    fi

    [ -n "$HASHES" ] && echo -ne "$HASHES "
    [ -n "$5" ]      && echo -ne "'$5' "
    [ -n "$6" ]      && echo -ne "'$6'"
}

#------------------------------------------------------------------------------
# Gets the size in bytes of a file
#   @param $1 - Path to the image
#   @return size of the image in bytes
#------------------------------------------------------------------------------

function file_size {
    stat --version &> /dev/null

    if [ $? = 0 ]; then
        # Linux
        STAT_CMD="stat -c %s"
    else
        # Darwin
        STAT_CMD="stat -f %z"
    fi

    $STAT_CMD "$*"
}


#------------------------------------------------------------------------------
# Gets the MIME type of a file
#   @param $1 - Path to the image
#   @return MIME type
#------------------------------------------------------------------------------

function file_type {
    file -b --mime-type "${1}" | tr A-Z a-z
}

#------------------------------------------------------------------------------
# Gets the size in bytes of a gzipped file
#   @param $1 - Path to the image
#   @return size of the image in bytes
#------------------------------------------------------------------------------

function gzip_file_size {
    gzip -l "$1" | tail -n 1 | awk '{print $2}'
}

#------------------------------------------------------------------------------
# Gets the size in bytes of a xzipped file
#   @param $1 - Path to the image
#   @return size of the image in bytes
#------------------------------------------------------------------------------

function xz_file_size {
    xz -l --robot "$1" | tail -n 1 | awk '{print $5}'
}

#------------------------------------------------------------------------------
# Gets the size in bytes of a bzipped file
#   @param $1 - Path to the image
#   @return size of the image in bytes
#------------------------------------------------------------------------------

function bzip_file_size {
    bunzip2 -c "${1}" | wc -c
}

#-------------------------------------------------------------------------------
# Computes the size of an image
#   @param $1 - Path to the image
#   @param $2 - NO_DECOMPRESS
#   @param $3 - BW LIMIT
#   @return status code
#     - on success: 0
#     - on failure: != 0
#   @return stdout with data
#     - on success: size of image in MiB
#     - on failure: error message
#-------------------------------------------------------------------------------
function fs_size {
    SRC=$1
    NO_DECOMPRESS=$(echo "$2" | tr A-Z a-z)
    LIMIT_TRANSFER_BW=$3

    DOWNLOADER_ARGS=`set_downloader_args '' '' "${NO_DECOMPRESS}" "${LIMIT_TRANSFER_BW}"`

    if [ -z "${UTILS_PATH}" ] && [ -n "${DRIVER_PATH}" ]; then
        UTILS_PATH="${DRIVER_PATH}/../../datastore"
    fi

    if ! [ -d "${UTILS_PATH}" ]; then
        log_error "Failed to detect downloader.sh location"
        exit 1
    fi

    error=1

    # limit only on local or remote http(s)
    if [ -d "${SRC}" ]; then
        SIZE=`set -o pipefail; du -sb "${SRC}" | cut -f1`
        error=$?
    elif [ -f "${SRC}" ] || (echo "${SRC}" | grep -qe '^https\?://'); then
        IMAGE=$(mktemp)

        HEAD_SIZE=0
        NEW_HEAD_SIZE=$(image_size_required "${IMAGE}")

        while [ "${HEAD_SIZE}" != "${NEW_HEAD_SIZE}" ]; do
            HEAD_SIZE=${NEW_HEAD_SIZE}

            # try first download only a part of image
            $UTILS_PATH/downloader.sh ${DOWNLOADER_ARGS} -c "${HEAD_SIZE}" "${SRC}" - >"${IMAGE}" 2>/dev/null
            error=$?
            if [ $error -ne 0 ]; then
                # better fail here ...
                echo "Failed to get image head"
                return 1
            fi

            TYPE=$(image_format "${IMAGE}")
            if [ -z "${TYPE}" ]; then
                # if unknown image type, maybe we haven't downloaded
                # enough bytes; check if qemu-img info doesn't complain
                # on least than expected bytes and redownload more bytes
                NEW_HEAD_SIZE=$(image_size_required "${IMAGE}" "${SRC}")
                if [ -n "${NEW_HEAD_SIZE}" ] && [ "${NEW_HEAD_SIZE}" != "${HEAD_SIZE}" ]; then
                    continue  # redownload more bytes
                else
                    echo "Failed to detect image format"
                    return 1
                fi
            fi
        done

        # raw images requires special handling, as there is no image header
        # with size available and we can't predict image virtual size just
        # from a part of the file
        if [ "${TYPE}" = 'raw' ] || [ "${TYPE}" = 'luks' ]; then
            $UTILS_PATH/downloader.sh ${DOWNLOADER_ARGS} --nodecomp -c "${HEAD_SIZE}" "${SRC}" - >"${IMAGE}" 2>/dev/null
            error=$?
            if [ $error -ne 0 ]; then
                # better fail here ...
                echo "Failed to get image head"
                return 1
            fi

            ORIG_TYPE=$(file_type "${IMAGE}")

            # if NO_DECOMPRESS=yes is configured on the datastore,
            # treat the downloaded data as image as is
            if [ "${NO_DECOMPRESS}" = 'yes' ]; then
                ORIG_TYPE='application/octet-stream'
            fi

            if [ -f "${SRC}" ] ; then
                # for local raw images:
                # - compressed: use decompressor on local file
                # - uncompressed: get file size
                case ${ORIG_TYPE} in
                "application/x-gzip"|"application/gzip")
                    SIZE=$(gzip_file_size "${SRC}")
                    error=$?
                    ;;
                "application/x-xz")
                    SIZE=$(xz_file_size "${SRC}")
                    error=$?
                    ;;
                "application/x-bzip2")
                    SIZE=$(bzip_file_size "${SRC}")
                    error=$?
                    ;;
                *)
                    SIZE=$(image_vsize "${SRC}")
                    error=$?
                    ;;
                esac
            else
                # !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
                # code which allows downloading is experimental for future use,
                # longer downloads may result in image import failure, as
                # the datastore stat operation is synchronous with import call
                # !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
                ALLOW_DOWNLOADS='no'

                # for remote raw images
                # - compressed: complete download and use decompressor
                # - uncompressed: get size from HTTP headers or complete download
                case ${ORIG_TYPE} in
                "application/x-gzip"|"application/gzip")
                    if [ "${ALLOW_DOWNLOADS}" = 'yes' ]; then
                        $UTILS_PATH/downloader.sh ${DOWNLOADER_ARGS} --nodecomp "${SRC}" - >"${IMAGE}" 2>/dev/null
                        error=$?
                        if [ $error -eq 0 ]; then
                            SIZE=$(gzip_file_size "${IMAGE}")
                            error=$?
                        fi
                    else
                        echo 'Unsupported remote image format'
                        return 1
                    fi
                    ;;
                "application/x-xz")
                    if [ "${ALLOW_DOWNLOADS}" = 'yes' ]; then
                        $UTILS_PATH/downloader.sh ${DOWNLOADER_ARGS} --nodecomp "${SRC}" - >"${IMAGE}" 2>/dev/null
                        error=$?
                        if [ $error -eq 0 ]; then
                            SIZE=$(xz_file_size "${IMAGE}")
                            error=$?
                        fi
                    else
                        echo 'Unsupported remote image format'
                        return 1
                    fi
                    ;;
                "application/x-bzip2")
                    if [ "${ALLOW_DOWNLOADS}" = 'yes' ]; then
                        $UTILS_PATH/downloader.sh ${DOWNLOADER_ARGS} "${SRC}" - >"${IMAGE}" 2>/dev/null
                        error=$?
                        if [ $error -eq 0 ]; then
                            SIZE=$(image_vsize "${IMAGE}")
                            error=$?
                        fi
                    else
                        echo 'Unsupported remote image format'
                        return 1
                    fi
                    ;;
                *)
                    HEADERS=`curl -LIk --max-time 60 "${SRC}" 2>&1`
                    error=$?
                    SIZE=$(echo "$HEADERS" | grep -i "^Content-Length:" | tail -n1 | cut -d: -f2 | tr -d "\r")

                    if [ -z "${SIZE}" ]; then
                        if [ "${ALLOW_DOWNLOADS}" = 'yes' ]; then
                            $UTILS_PATH/downloader.sh ${DOWNLOADER_ARGS} "${SRC}" - >"${IMAGE}" 2>/dev/null
                            error=$?
                            if [ $error -eq 0 ]; then
                                SIZE=$(image_vsize "${IMAGE}")
                                error=$?
                            fi
                        else
                            echo 'Unsupported remote image format'
                            return 1
                        fi
                    fi
                    ;;
                esac
            fi
        else
            SIZE=$(image_vsize "${IMAGE}")
        fi

        if [ -f "${IMAGE}" ]; then
            unlink "${IMAGE}" 2>/dev/null
        fi
    else
        echo 'File not found'
        return 1
    fi

    #####

    SIZE=$(echo ${SIZE:-0} | tr -d "\r")

    if [ $error -ne 0 ] || [ "${SIZE}" = '0' ]; then
        SIZE='Runtime error during size estimation'

        if [ $error -eq 0 ]; then
            error=1
        fi
    else
        SIZE=$((($SIZE+1048575)/1048576))
    fi

    echo "${SIZE}"

    return $error
}

#-------------------------------------------------------------------------------
# Checks if a path is safe for copying the image from
#   @param $1 - Path to the image
#   @return 0 if the path is safe, 1 otherwise
#-------------------------------------------------------------------------------
function check_restricted {
    for path in $SAFE_DIRS ; do
        if [ -n "`readlink -f $1 | grep -E "^$path"`" ] ; then
            echo 0
            return
        fi
    done

    for path in $RESTRICTED_DIRS ; do
        if [ -n "`readlink -f $1 | grep -E "^$path"`" ] ; then
            echo 1
            return
        fi
    done

    echo 0
}

#-------------------------------------------------------------------------------
# Filter out hosts which are OFF, ERROR or DISABLED
#   @param $1 - space separated list of hosts
#   @return   - space separated list of hosts which are not in OFF, ERROR or
#               DISABLED sate
#-------------------------------------------------------------------------------
function remove_off_hosts {
    ALL_HOSTS_ARRAY=($1)
    OFF_HOSTS_STR=$(onehost list --operator OR --no-pager --csv \
		--filter="STAT=off,STAT=err,STAT=dsbl" --list=NAME,STAT 2>/dev/null)

    if [ $? -eq 0 ]; then
        OFF_HOSTS_ARRAY=($( echo "$OFF_HOSTS_STR" | awk -F, '{ if (NR>1) print $1 }'))
        for HOST in "${ALL_HOSTS_ARRAY[@]}"; do
            OFF=false
            for OFF_HOST in "${OFF_HOSTS_ARRAY[@]}"; do
                [ $HOST = $OFF_HOST ] && { OFF=true; break; }
            done
            $OFF || echo -ne "$HOST "
        done
    else
        # onehost cmd failed, can't filter anything, better return unchanged
        echo $1
        return 1
    fi
}

#-------------------------------------------------------------------------------
# Gets the host to be used as bridge to talk to the storage system
# Implements a round robin for the bridges
#   @param $1 - ID to be used to round-robin between host bridges. Random if
#   not defined
#   @return host to be used as bridge
#-------------------------------------------------------------------------------
function get_destination_host {
    REDUCED_LIST=$(remove_off_hosts "$BRIDGE_LIST")

    if [ -z "$REDUCED_LIST" -a -n "$BRIDGE_LIST" ]; then
        error_message "All hosts from 'BRIDGE_LIST' are offline, error or disabled"
        exit -1
    fi

    HOSTS_ARRAY=($REDUCED_LIST)
    N_HOSTS=${#HOSTS_ARRAY[@]}

    if [ -n "$1" ]; then
        ARRAY_INDEX=$(($1 % ${N_HOSTS}))
    else
        ARRAY_INDEX=$((RANDOM % ${N_HOSTS}))
    fi

    echo ${HOSTS_ARRAY[$ARRAY_INDEX]}
}
