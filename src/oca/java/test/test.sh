#!/bin/bash
# Usage: test.sh <Test_name>
# For instance: test.sh ImageTest

JUNIT_JAR="/usr/share/java/junit4.jar"

if [ -z $ONE_LOCATION ]; then
    echo "ONE_LOCATION not defined."
    exit -1
fi

VAR_LOCATION="$ONE_LOCATION/var"

if [ "$(ls -A $VAR_LOCATION)" ]; then
    echo "$VAR_LOCATION is not empty."
    exit -1
fi

PID=$$

oned -f &

sleep 4s;

java -cp ../lib/*:../jar/*:$JUNIT_JAR:. org.junit.runner.JUnitCore $1

CODE=$?

pkill -P $PID oned
sleep 4s;
pkill -9 -P $PID oned
rm -rf $VAR_LOCATION
mkdir $VAR_LOCATION

exit $CODE