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

RC=0

./test.sh HostTest
let RC=RC+$?

./test.sh ImageTest
let RC=RC+$?

./test.sh SessionTest
let RC=RC+$?

./test.sh UserTest
let RC=RC+$?

./test.sh VirtualMachineTest
let RC=RC+$?

./test.sh VirtualNetworkTest
let RC=RC+$?

./test.sh TemplateTest
let RC=RC+$?

./test.sh GroupTest
let RC=RC+$?

exit $RC