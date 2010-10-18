#!/bin/bash
# Usage: test.sh <Test_name>
# For instance: test.sh ImageTest

JUNIT_JAR="/usr/share/java/junit4.jar"
ONEDB="$ONE_LOCATION/var/one.db"

PID=$$

oned -f &

sleep 4s;

java -cp ../lib/*:../jar/*:$JUNIT_JAR:. org.junit.runner.JUnitCore $1

CODE=$?

pkill -P $PID oned
sleep 4s;
pkill -9 -P $PID oned
rm $ONEDB

exit $CODE