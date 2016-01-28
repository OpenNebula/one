#!/bin/bash

# -------------------------------------------------------------------------- #
# Copyright 2002-2015, OpenNebula Project, OpenNebula Systems                #
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

# Execute a command (first parameter) and use the first kb of stdout
# to determine the file type
function get_type
{
    if [ "$NO_DECOMPRESS" = "yes" ]; then
        echo "application/octet-stream"
    else
        command=$1

        ( $command | head -n 1024 | file -b --mime-type - ) 2>/dev/null
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
        echo "bunzip2 -c -"
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

# Unarchives a tar or a zip a file to a directpry with the same name.
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

function s3_request
{
    FROM="$1"

    OBJECT=$(basename $FROM)
    BUCKET=$(basename $(dirname $FROM))

    DATE="`date +'%a, %d %b %Y %H:%M:%S %z'`"
    AUTH_STRING="GET\n\n\n${DATE}\n/${BUCKET}/${OBJECT}"

    SIGNED_AUTH_STRING=`echo -en "$AUTH_STRING" | \
                        openssl sha1 -hmac ${S3_SECRET_ACCESS_KEY} -binary | \
                        base64`

    echo " -H \"Date: ${DATE}\"" \
         " -H \"Authorization: AWS ${S3_ACCESS_KEY_ID}:${SIGNED_AUTH_STRING}\"" \
         " https://${BUCKET}.s3.amazonaws.com/${OBJECT}"
}

TEMP=`getopt -o m:s:l:n -l md5:,sha1:,limit:,nodecomp -- "$@"`

if [ $? != 0 ] ; then
    echo "Arguments error"
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

# File used by the hasher function to store the resulting hash
export HASH_FILE="/tmp/downloader.hash.$$"

case "$FROM" in
http://*|https://*)
    # -k  so it does not check the certificate
    # -L  to follow redirects
    # -sS to hide output except on failure
    # --limit_rate to limit the bw
    curl_args="-sS -k -L $FROM"

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

    rmt_cmd="'cat ${ssh_arg[1]}'"

    command="ssh ${ssh_arg[0]} $rmt_cmd"
    ;;
s3://*)
    if [ -z "$S3_ACCESS_KEY_ID" -o -z "$S3_SECRET_ACCESS_KEY" ]; then
        echo "S3_ACCESS_KEY_ID and S3_SECRET_ACCESS_KEY are required" >&2
        exit -1
    fi

    curl_args="$(s3_request $FROM)"
    command="curl $curl_args"
    ;;
*)
    if [ ! -r $FROM ]; then
        echo "Cannot read from $FROM" >&2
        exit -1
    fi
    command="cat $FROM"
    ;;
esac

file_type=$(get_type "$command")
decompressor=$(get_decompressor "$file_type")

eval "$command" | tee >( hasher $HASH_TYPE) | decompress "$decompressor" "$TO"

if [ "$?" != "0" ]; then
    echo "Error copying" >&2
    exit -1
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

