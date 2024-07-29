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
                        /DS_DRIVER_ACTION_DATA/MARKETPLACE/TEMPLATE/REGION \
                        /DS_DRIVER_ACTION_DATA/MARKETPLACE/TEMPLATE/AWS \
                        /DS_DRIVER_ACTION_DATA/MARKETPLACE/TEMPLATE/ENDPOINT)

    S3_ACCESS_KEY_ID="${XPATH_ELEMENTS[j++]}"
    S3_SECRET_ACCESS_KEY="${XPATH_ELEMENTS[j++]}"
    S3_REGION="${XPATH_ELEMENTS[j++]}"
    S3_AWS="${XPATH_ELEMENTS[j++]}"
    S3_ENDPOINT="${XPATH_ELEMENTS[j++]}"

    CURRENT_DATE_DAY="$(date -u '+%Y%m%d')"
    CURRENT_DATE_ISO8601="${CURRENT_DATE_DAY}T$(date -u '+%H%M%S')Z"
}

# Create an SHA-256 hash in hexadecimal.
# Usage:
#   hash_sha256 <string>
function hash_sha256 {
  printf "${1}" | openssl dgst -sha256 | sed 's/^.* //'
}

# Create an SHA-256 hmac in hexadecimal.
# Usage:
#   hmac_sha256 <key> <data>
function hmac_sha256 {
  printf "${2}" | openssl dgst -sha256 -mac HMAC -macopt "${1}" | sed 's/^.* //'
}

# Create the signature.
# Usage:
#   create_signature
function create_signature {
    stringToSign="AWS4-HMAC-SHA256\n${CURRENT_DATE_ISO8601}\n${CURRENT_DATE_DAY}/${S3_REGION}/s3/aws4_request\n$(hash_sha256 "${HTTP_CANONICAL_REQUEST}")"
    dateKey=$(hmac_sha256 key:"AWS4${S3_SECRET_ACCESS_KEY}" "${CURRENT_DATE_DAY}")
    regionKey=$(hmac_sha256 hexkey:"${dateKey}" "${S3_REGION}")
    serviceKey=$(hmac_sha256 hexkey:"${regionKey}" "s3")
    signingKey=$(hmac_sha256 hexkey:"${serviceKey}" "aws4_request")

    printf "${stringToSign}" | openssl dgst -sha256 -mac HMAC -macopt hexkey:"${signingKey}" | sed 's/.*(stdin)= //'
}

function s3_curl_args
{
    FROM="$1"

    ENDPOINT="$S3_ENDPOINT"
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

function s3_curl_args_aws
{
    FROM="$1"

    OBJECT=$(basename "$FROM")
    BUCKET=$(basename "$(dirname "$FROM")")

    ENDPOINT="$BUCKET.s3.amazonaws.com"

    AWS_S3_PATH="$(echo $OBJECT | sed 's;^\([^/]\);/\1;')"

    HTTP_REQUEST_PAYLOAD_HASH="$(echo "" | openssl dgst -sha256 | sed 's/^.* //')"
    HTTP_CANONICAL_REQUEST_URI="${AWS_S3_PATH}"
    HTTP_REQUEST_CONTENT_TYPE='application/octet-stream'

    HTTP_CANONICAL_REQUEST_HEADERS="content-type:${HTTP_REQUEST_CONTENT_TYPE}
host:${ENDPOINT}
x-amz-content-sha256:${HTTP_REQUEST_PAYLOAD_HASH}
x-amz-date:${CURRENT_DATE_ISO8601}"

    HTTP_REQUEST_SIGNED_HEADERS="content-type;host;x-amz-content-sha256;x-amz-date"
HTTP_CANONICAL_REQUEST="GET
${HTTP_CANONICAL_REQUEST_URI}\n
${HTTP_CANONICAL_REQUEST_HEADERS}\n
${HTTP_REQUEST_SIGNED_HEADERS}
${HTTP_REQUEST_PAYLOAD_HASH}"

    SIGNATURE="$(create_signature)"
    HTTP_REQUEST_AUTHORIZATION_HEADER="AWS4-HMAC-SHA256 Credential=${S3_ACCESS_KEY_ID}/${CURRENT_DATE_DAY}/${S3_REGION}/s3/aws4_request, SignedHeaders=${HTTP_REQUEST_SIGNED_HEADERS}, Signature=${SIGNATURE}"

    echo " -H \"Authorization: ${HTTP_REQUEST_AUTHORIZATION_HEADER}\"" \
         " -H \"content-type: ${HTTP_REQUEST_CONTENT_TYPE}\"" \
         " -H \"x-amz-content-sha256: ${HTTP_REQUEST_PAYLOAD_HASH}\"" \
         " -H \"x-amz-date: ${CURRENT_DATE_ISO8601}\"" \
         " \"https://${ENDPOINT}${HTTP_CANONICAL_REQUEST_URI}\""
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

# Compare 2 version strings using sort -V
# Usage:
#   verlte "3.2.9" "3.4.0"
function verlte() {
    [  "$1" = "`echo -e "$1\n$2" | sort -V | head -n1`" ]
}

# Returns curl retry options based on its version
function curl_retry_args {
    [ "$NO_RETRY" = "yes" ] && return

    RETRY_ARGS="--retry 3 --retry-delay 3"

    CURL_VER=`curl --version | grep -o 'curl [0-9\.]*' | awk '{print $2}'`

    # To retry also on conn-reset-by-peer fresh curl is needed
    if verlte "7.71.0" "$CURL_VER" && [ -z ${MAX_SIZE} ] ; then
        RETRY_ARGS+=" --retry-all-errors"
    fi

    echo $RETRY_ARGS
}

TEMP=`getopt -o m:s:l:c:no -l md5:,sha1:,limit:,max-size:,nodecomp,noretry -- "$@"`

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
        -o|--noretry)
            export NO_RETRY="yes"
            shift
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

GLOBAL_CURL_ARGS="--fail -sS -k -L $(curl_retry_args)"

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

    curl_args=""

    if [[ "$S3_AWS" =~ (no|NO) ]]; then
        curl_args="$(s3_curl_args "$FROM")"
    else
        curl_args="$(s3_curl_args_aws "$FROM")"
    fi

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
restic://*)
    eval `$VAR_LOCATION/remotes/datastore/restic_downloader.rb "$FROM" | grep -e '^command=' -e '^clean_command='`
    ;;
rsync://*)
    eval `$VAR_LOCATION/remotes/datastore/rsync_downloader.rb "$FROM" | grep -e '^command=' -e '^clean_command='`
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

# Unarchive only if the destination is filesystem
if [ "$TO" != "-" ]; then
    unarchive "$TO"
fi

# Perform any clean operation
if [ -n "${clean_command}" ]; then
    eval "$clean_command"
fi
