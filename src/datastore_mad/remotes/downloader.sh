#!/bin/bash

# -------------------------------------------------------------------------- #
# Copyright 2002-2019, OpenNebula Project, OpenNebula Systems                #
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

if [ -z "${ONE_LOCATION}" ]; then
    LIB_LOCATION=/usr/lib/one
    VAR_LOCATION=/var/lib/one
else
    LIB_LOCATION=$ONE_LOCATION/lib
    VAR_LOCATION=$ONE_LOCATION/var
fi

. $LIB_LOCATION/sh/scripts_common.sh

DRIVER_PATH=$(dirname $0)

# Escape single quotes
function esc_sq
{
    echo "$1" | sed -e "s/'/'\\\''/g"
}

# Execute a command (first parameter) and use the first kb of stdout
# to determine the file type
function get_type
{
    if [ "$NO_DECOMPRESS" = "yes" ]; then
        echo "application/octet-stream"
    else
        command=$1

        ( eval "$command" | head -n 1024 | file -b --mime-type - ) 2>/dev/null
    fi
}

# Gets the command needed to decompress an stream.
function get_decompressor
{
    type=$1

    case "$type" in
    "application/x-gzip"|"application/gzip")
        echo "gunzip -c -"
        ;;
    "application/x-bzip2")
        echo "bunzip2 -qc -"
        ;;
    "application/x-xz")
        echo "unxz -c -"
        ;;
    *)
        echo "cat"
        ;;
    esac
}

# Function called to decompress a stream. The first parameter is the command
# used to decompress the stream. Second parameter is the output file or
# - for stdout.
function decompress
{
    command="$1"
    to="$2"

    if [ "$to" = "-" ]; then
        $command
    else
        $command > "$to"
    fi
}

# Function called to hash a stream. First parameter is the algorithm name.
function hasher
{
    if [ -n "$1" ]; then
        openssl dgst -$1 | awk '{print $NF}' > $HASH_FILE
    else
        # Needs something consuming stdin or the pipe will break
        cat >/dev/null
    fi
}

# Unarchives a tar or a zip a file to a directory with the same name.
function unarchive
{
    TO="$1"

    file_type=$(get_type "cat $TO")

    tmp="$TO"

    # Add full path if it is relative
    if [ ${tmp:0:1} != "/" ]; then
        tmp="$PWD/$tmp"
    fi

    IN="$tmp.tmp"
    OUT="$tmp"

    case "$file_type" in
    "application/x-tar")
        command="tar -xf $IN -C $OUT"
        ;;
    "application/zip")
        command="unzip -d $OUT $IN"
        ;;
    *)
        command=""
        ;;
    esac

    if [ -n "$command" ]; then
        mv "$OUT" "$IN"
        mkdir "$OUT"

        $command

        if [ "$?" != "0" ]; then
            echo "Error uncompressing archive" >&2
            exit -1
        fi

        rm "$IN"
    fi
}

function s3_env
{
    XPATH="$DRIVER_PATH/xpath.rb -b $DRV_ACTION"

    unset i j XPATH_ELEMENTS

    while IFS= read -r -d '' element; do
        XPATH_ELEMENTS[i++]="$element"
    done < <($XPATH     /DS_DRIVER_ACTION_DATA/MARKETPLACE/TEMPLATE/ACCESS_KEY_ID \
                        /DS_DRIVER_ACTION_DATA/MARKETPLACE/TEMPLATE/SECRET_ACCESS_KEY \
                        /DS_DRIVER_ACTION_DATA/MARKETPLACE/TEMPLATE/ENDPOINT)

    S3_ACCESS_KEY_ID="${XPATH_ELEMENTS[j++]}"
    S3_SECRET_ACCESS_KEY="${XPATH_ELEMENTS[j++]}"
    S3_ENDPOINT="${XPATH_ELEMENTS[j++]}"
}

function s3_curl_args
{
    FROM="$1"

    ENDPOINT=${S3_ENDPOINT:-https://s3.amazonaws.com}
    OBJECT=$(basename "$FROM")
    BUCKET=$(basename $(dirname "$FROM"))

    DATE="`date -u +'%a, %d %b %Y %H:%M:%S GMT'`"
    AUTH_STRING="GET\n\n\n${DATE}\n/${BUCKET}/${OBJECT}"

    SIGNED_AUTH_STRING=`echo -en "$AUTH_STRING" | \
                        openssl sha1 -hmac ${S3_SECRET_ACCESS_KEY} -binary | \
                        base64`

    echo " -H \"Date: ${DATE}\"" \
         " -H \"Authorization: AWS ${S3_ACCESS_KEY_ID}:${SIGNED_AUTH_STRING}\"" \
         " '$(esc_sq "${ENDPOINT}/${BUCKET}/${OBJECT}")'"
}

function get_rbd_cmd
{
    local i j URL_ELEMENTS

    FROM="$1"

    URL_RB="$DRIVER_PATH/url.rb"

    while IFS= read -r -d '' element; do
        URL_ELEMENTS[i++]="$element"
    done < <($URL_RB    "$FROM" \
                        USER \
                        HOST \
                        SOURCE \
                        PARAM_DS \
                        PARAM_CEPH_USER \
                        PARAM_CEPH_KEY \
                        PARAM_CEPH_CONF)

    USER="${URL_ELEMENTS[j++]}"
    DST_HOST="${URL_ELEMENTS[j++]}"
    SOURCE="${URL_ELEMENTS[j++]}"
    DS="${URL_ELEMENTS[j++]}"
    CEPH_USER="${URL_ELEMENTS[j++]}"
    CEPH_KEY="${URL_ELEMENTS[j++]}"
    CEPH_CONF="${URL_ELEMENTS[j++]}"

    # Remove leading '/'
    SOURCE="${SOURCE#/}"

    if [ -n "$USER" ]; then
        DST_HOST="$USER@$DST_HOST"
    fi

    if [ -n "$CEPH_USER" ]; then
        RBD="$RBD --id '$(esc_sq "${CEPH_USER}")'"
    fi

    if [ -n "$CEPH_KEY" ]; then
        RBD="$RBD --keyfile '$(esc_sq "${CEPH_KEY}")'"
    fi

    if [ -n "$CEPH_CONF" ]; then
        RBD="$RBD --conf '$(esc_sq "${CEPH_CONF}")'"
    fi

    echo "ssh '$(esc_sq "$DST_HOST")' \"$RBD export '$(esc_sq "$SOURCE")' -\""
}

TEMP=`getopt -o m:s:l:c:n -l md5:,sha1:,limit:,max-size:,convert:,nodecomp -- "$@"`

if [ $? != 0 ] ; then
    echo "Arguments error" >&2
    exit -1
fi

eval set -- "$TEMP"

while true; do
    case "$1" in
        -m|--md5)
            HASH_TYPE=md5
            HASH=$2
            shift 2
            ;;
        -s|--sha1)
            HASH_TYPE=sha1
            HASH=$2
            shift 2
            ;;
        -n|--nodecomp)
            export NO_DECOMPRESS="yes"
            shift
            ;;
        -l|--limit)
            export LIMIT_RATE="$2"
            shift 2
            ;;
        -c|--max-size)
            export MAX_SIZE="$2"
            shift 2
            ;;
        --convert)
            export CONVERT="$2"
            shift 2
            ;;
        --)
            shift
            break
            ;;
        *)
            shift
            ;;
    esac
done

FROM="$1"
TO="$2"

if [ -n "${HASH_TYPE}" -a -n "${MAX_SIZE}" ]; then
    echo "Hash check not supported for partial downloads" >&2
    exit -1
else
    # File used by the hasher function to store the resulting hash
    export HASH_FILE="/tmp/downloader.hash.$$"
fi

GLOBAL_CURL_ARGS="--fail -sS -k -L"

case "$FROM" in
http://*|https://*)
    # -k  so it does not check the certificate
    # -L  to follow redirects
    # -sS to hide output except on failure
    # --limit_rate to limit the bw
    curl_args="$GLOBAL_CURL_ARGS '$(esc_sq "${FROM}")'"

    if [ -n "$LIMIT_RATE" ]; then
        curl_args="--limit-rate $LIMIT_RATE $curl_args"
    fi

    command="curl $curl_args"
    ;;
ssh://*)
    # pseudo-url for ssh transfers ssh://user@host:path
    # -l to limit the bw
    ssh_src=${FROM#ssh://}
    ssh_arg=(${ssh_src/:/ })

    rmt_cmd="\"cat '$(esc_sq "${ssh_arg[1]}")'\""

    command="ssh ${ssh_arg[0]} $rmt_cmd"
    ;;
s3://*)
    # Read s3 environment
    s3_env

    if [ -z "$S3_ACCESS_KEY_ID" -o -z "$S3_SECRET_ACCESS_KEY" ]; then
        echo "S3_ACCESS_KEY_ID and S3_SECRET_ACCESS_KEY are required" >&2
        exit -1
    fi

    curl_args="$(s3_curl_args "$FROM")"

    command="curl $GLOBAL_CURL_ARGS $curl_args"
    ;;
rbd://*)
    command="$(get_rbd_cmd "$FROM")"
    ;;
vcenter://*)
    command="$VAR_LOCATION/remotes/datastore/vcenter_downloader.rb '$(esc_sq "$FROM")'"
    ;;
lxd://*)
    file_type="application/octet-stream"
    command="$VAR_LOCATION/remotes/datastore/lxd_downloader.sh \"$FROM\""
    ;;
docker://*)
    file_type="application/octet-stream"
    command="$VAR_LOCATION/remotes/datastore/docker_downloader.sh \"$FROM\""
    ;;
*)
    if [ ! -r $FROM ]; then
        echo "Cannot read from $FROM" >&2
        exit -1
    fi
    command="cat '$(esc_sq "$FROM")'"
    ;;
esac

[ -z "$file_type" ] && file_type=$(get_type "$command")
decompressor=$(get_decompressor "$file_type")

if [ -z "${MAX_SIZE}" ]; then
    eval "$command" | \
        tee >( hasher $HASH_TYPE) | \
        decompress "$decompressor" "$TO"

    if [ "$?" != "0" -o "$PIPESTATUS" != "0" ]; then
        echo "Error copying" >&2
        exit -1
    fi
else
    # Order of the 'head' command is here on purpose:
    # 1. We want to download more bytes than needed to get a requested
    #    number of bytes on the output. Decompressor may need more
    #    data to decompress the stream.
    # 2. Decompressor command is also misused to detect SIGPIPE error.
    eval "$command" | \
        decompress "$decompressor" "$TO" 2>/dev/null | \
        head -c "${MAX_SIZE}"

    # Following table shows exit codes of each command
    # in the pipe for various scenarios:
    #
    # ----------------------------------------------------
    # | $COMMAND | TYPE          | PIPESTATUS | BEHAVIOUR
    # ----------------------------------------------------
    # | cat      | partial       | 141 141  0 | OK
    # | cat      | full          |   0   0  0 | OK
    # | cat      | error         |   1   0  0 | fail
    # | curl     | partial       |  23 141  0 | OK
    # | curl     | full          |   0   0  0 | OK
    # | curl     | error         |  22   0  0 | fail
    # | ssh      | partial       | 255 141  0 | OK
    # | ssh      | full          |   0   0  0 | OK
    # | ssh      | error ssh     | 255   0  0 | fail
    # | ssh      | error ssh cat |   1   0  0 | fail
    if [ \( "${PIPESTATUS[0]}" != '0' -a "${PIPESTATUS[1]}" = '0' \) \
         -o \( "${PIPESTATUS[1]}" != '0' -a "${PIPESTATUS[1]}" != '141' \) \
         -o \( "${PIPESTATUS[2]}" != "0" \) ];
    then
        echo "Error copying" >&2
        exit -1
    fi
fi

if [ -n "$HASH_TYPE" ]; then
    HASH_RESULT=$( cat $HASH_FILE)
    rm $HASH_FILE
    if [ "$HASH_RESULT" != "$HASH" ]; then
        echo "Hash does not match" >&2
        exit -1
    fi
fi

function convert_image
{
    original_type=$(qemu-img info $TO | grep "^file format:" | awk '{print $3}' || :)
    if [ "$CONVERT" != "$original_type" ]; then
        tmpimage=$TO".tmp"
        qemu-img convert -f $original_type -O $CONVERT $TO $tmpimage
        mv $tmpimage $TO
    fi
}

# Unarchive only if the destination is filesystem
if [ "$TO" != "-" ]; then
    unarchive "$TO"

    if [ -n "$CONVERT" ] && [ -f "$TO" ]; then
        convert_image
    fi

elif [ -n "$CONVERT" ]; then
    convert_image
fi
