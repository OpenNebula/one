#!/bin/bash

TWD="../../src"
BASE=$PWD

TESTS=`find $TWD -name test -type d`

for i in $TESTS ; do
    cd $BASE

    echo "Doing $i ..."
    cd $i
    scons -c
    scons > /dev/null 2>&1
    rm callgrind.out
    rm test.db* test.log
    for j in `ls test*` ; do
#        valgrind ./$j -s
#        valgrind --tool=callgrind ./$j -s
	 ./$j -s
    done
done

cd $BASE
