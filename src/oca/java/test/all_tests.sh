#!/bin/bash

if [ -z $ONE_LOCATION ]; then
    echo "ONE_LOCATION not defined."
    exit -1
fi

ONEDCONF_LOCATION="$ONE_LOCATION/etc/oned.conf"

if [ -f $ONEDCONF_LOCATION ]; then
    echo "$ONEDCONF_LOCATION has to be overwritten, move it to a safe place."
    exit -1
fi

cp oned.conf $ONEDCONF_LOCATION

export ONE_XMLRPC=http://localhost:2666/RPC2


./test.sh HostTest
./test.sh ImageTest
./test.sh SessionTest
./test.sh UserTest
./test.sh VirtualMachineTest
./test.sh VirtualNetworkTest
./test.sh TemplateTest
./test.sh GroupTest