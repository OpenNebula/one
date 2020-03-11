#!/bin/bash

cmd='lxc profile list 2>/dev/null'

profiles=$($cmd | grep -v -- -+- | grep -v NAME | grep -v default | awk '{print $2}')

if [ "$?" -ne "0" ]; then
    profiles=$(sudo $cmd | grep -v -- -+- | grep -v NAME | grep -v default | awk '{print $2}')
fi

tmpfile=$(mktemp /tmp/lxd_probe.XXXXXX)

echo "$profiles" > "$tmpfile"
out=$(tr '\n' ' ' < "$tmpfile")
out=${out::-1}

echo -e LXD_PROFILES=\""$out"\"

rm "$tmpfile"
