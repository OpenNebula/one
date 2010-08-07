#!/bin/bash
#-------------------------------------------------------------------------------
# COMMAND LINE PARSING
#-------------------------------------------------------------------------------


#-------------------------------------------------------------------------------
# COMMAND LINE PARSING
#-------------------------------------------------------------------------------
usage() {
 echo
 echo "Usage: do_test.sh [-smvgclh]"
 echo
 echo "-m: use MyQSL backend (defaults to Sqlite)"
 echo "-v: run tests using valgrind (memcheck) output will be memgrind.out"
 echo "-g: run tests using valgrind (callgrind) output will be callgrind.out"
 echo "-l: keep logs"
 echo "-c: clear everything"
 echo "-b: just build the tests and do not run them"
 echo
 echo "-h: prints this help"
}
#-------------------------------------------------------------------------------

TEMP_OPT=`getopt -o mvgclbh -n 'install.sh' -- "$@"`

if [ $? != 0 ] ; then
    usage
    exit 1
fi

eval set -- "$TEMP_OPT"

MYSQL="no"
VAL_MEM="no"
VAL_CALL="no"
LOGS="no"
CLEAR="no"
BUILD="no"

TWD_DIR="../../src"
BASE_DIR=$PWD

while true ; do
    case "$1" in
        -h) usage; exit 0;;
        -m) MYSQL="yes"   ; shift ;;
        -v) VAL_MEM="yes" ; shift ;;
        -g) VAL_CALL="yes"; shift ;;
        -l) LOGS="yes"    ; shift ;;
        -c) CLEAR="yes"   ; shift ;;
        -b) BUILD="yes"   ; shift ;;
        --) shift ; break ;;
        *)  usage; exit 1 ;;
    esac
done


#-------------------------------------------------------------------------------
# SETUP ARGUMENTS
#-------------------------------------------------------------------------------

if [ "$MYSQL" = "yes" ] ; then
    TEST_ARGS="-m"
    BUILD_ARGS="mysql=yes sqlite=no"
else
    TEST_ARGS="-s"
    BUILD_ARGS="mysql=no sqlite=yes"
fi

if [ "$LOGS" = "yes" ] ; then
    TEST_ARGS="$TEST_ARGS -l"
fi

CALLER=""

if [ "$VAL_MEM" = "yes" ] ; then
    CALLER="valgrind --show-reachable=yes --leak-check=full"
elif [ "$VAL_CALL" = "yes" ] ; then
    CALLER="valgrind --tool=callgrind"
fi

TESTS=`find $TWD_DIR -name test -type d | grep -v ruby`

for i in $TESTS ; do
    cd $BASE_DIR

    echo "Doing $i ..."
    cd $i

    if [ "$CLEAR" = "yes" ] ; then
        scons -c
        rm -f callgrind.out* test.db* *.log* memgrid.out*
    elif [ "$BUILD" = "yes" ] ; then
        scons $BUILD_ARGS
    else
        for j in `ls test*` ; do
	    if [ -x $j ] ; then
            	$CALLER ./$j $TEST_ARGS
            fi
        done
    fi
done

cd $BASE_DIR

exit 0
