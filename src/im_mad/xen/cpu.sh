#!/bin/sh

if [ -f /proc/cpuinfo ]; then

    echo -n "MODELNAME=\""
    grep -m 1 "model name" /proc/cpuinfo | cut -d: -f2 | sed -e 's/^ *//' | sed -e 's/$/"/'
    
fi

