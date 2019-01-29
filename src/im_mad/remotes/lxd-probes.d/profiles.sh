#!/bin/bash

cmd='lxc profile list'

profiles=$($cmd | grep -v -- -+- | grep -v NAME | grep -v default | awk '{print $2}')

if [ "$?" -ne "0" ]; then
    profiles=$(sudo $cmd | grep -v -- -+- | grep -v NAME | grep -v default | awk '{print $2}')
fi

while IFS= read -r line ; do
    config=$(lxc profile show "$line")

    echo "PROFILE=["
    echo "  $config ]"
done <<< "$profiles"
