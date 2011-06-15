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

export ONE_XMLRPC=http://localhost:2888/RPC2
export PATH=$ONE_LOCATION/bin:$PATH

if [ -z $ONE_LOCATION ]; then
    echo "ONE_LOCATION not defined."
    exit -1
fi

VAR_LOCATION="$ONE_LOCATION/var"

if [ -f $VAR_LOCATION/one.db ]; then
    echo "$VAR_LOCATION/one.db has to be overwritten, move it to a safe place."
    exit -1
fi


echo "Starting oned, some resources will be created"

PID=$$

oned -f &

sleep 2s;

mkdir results

./create.sh

pkill -P $PID oned
sleep 2s;
pkill -9 -P $PID oned

echo "All resources created, now 2.2 DB will be upgraded."

cp $VAR_LOCATION/one.db results/one.db.3.0
cp 2.2/one.db results/one.db.upgraded

onedb upgrade --sqlite results/one.db.upgraded --backup results/one.db.backup

echo "Done. Upgraded DB and the one created will be compared."

ruby compare_schema.rb results/one.db.upgraded results/one.db.3.0

CODE=$?


exit $CODE