#!/bin/bash

function get_type
{
    command=$1

    ( $command | head -1024 | file -b --mime-type - ) 2>/dev/null
}

function get_decompressor
{
    type=$1

    case "$type" in
    "application/x-gzip")
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

function decompress
{
    command="$1"
    to="$2"

    if [ "x$to" = "x-" ]; then
        $command
    else
        $command > "$to"
    fi
}

function hasher
{
    algo=$1

    if [ -n "$algo" ]; then
        openssl dgst -$algo > $HASH_FILE
    fi
}

function unarchive
{
    TO="$1"

    file_type=$(get_type "cat $TO")

    tmp="$TO"

    if [ ${tmp:0:1} = "/" ]; then
        $tmp="$PWD/$tmp"
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

TEMP=`getopt -o m:s: -l md5:,sha1: -- "$@"`

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
        --)
            shift
            break
            ;;
        *)
            shift
            ;;
    esac
done

FROM=$1
TO=$2

export HASH_FILE="/tmp/downloader.hash.$$"

case "$FROM" in
http://*)
    command="curl -L $FROM"
    ;;
*)
    command="cat $FROM"
    ;;
esac

file_type=$(get_type "$command")
decompressor=$(get_decompressor "$file_type")

$command | tee >( decompress "$decompressor" "$TO" ) \
    >( hasher $HASH_TYPE ) >/dev/null

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

if [ "$TO" != "-" ]; then
    unarchive "$TO"
fi

