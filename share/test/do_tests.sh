#!/bin/bash
#-------------------------------------------------------------------------------
# DEFINE THE TESTS
#-------------------------------------------------------------------------------
TWD_DIR="../../src"
BASE_DIR=$PWD

TESTS="$TWD_DIR/vnm/test \
       $TWD_DIR/scheduler/src/xml/test \
       $TWD_DIR/scheduler/src/pool/test \
       $TWD_DIR/hm_mad/test \
       $TWD_DIR/common/test \
       $TWD_DIR/host/test \
       $TWD_DIR/template/test \
       $TWD_DIR/image/test \
       $TWD_DIR/authm/test \
       $TWD_DIR/vm/test \
       $TWD_DIR/um/test \
       $TWD_DIR/lcm/test \
       $TWD_DIR/pool/test"

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

if [ "$BUILD" = "yes" ] ; then
    cd ../..
    scons tests=yes $BUILD_ARGS

    cd $BASE_DIR
    exit 0
fi

if [ "$CLEAR" = "yes" ] ; then
    cd ../..
    scons tests=yes -c

    cd $BASE_DIR
fi

TESTS=`find $TWD_DIR -name test -type d`

for i in $TESTS ; do
    cd $BASE_DIR

    if [ ! -f "$i/SConstruct" ] ; then
        continue
    fi

    echo ; echo
    echo "#####################################################################"
    echo "#####################################################################"
    echo "Doing $i ..."
    echo "#####################################################################"
    echo "#####################################################################"
    echo ; echo
    cd $i

    if [ "$CLEAR" = "yes" ] ; then
        rm -f callgrind.out* test.db* *.log* memgrid.out* *.xml ONE_test_database*
    else
        for j in `ls test*` ; do
            if [ -x $j ] ; then
                echo ; echo "---------------------------------------------------------------------"
                echo "Test Program: $j"
                echo "---------------------------------------------------------------------"
                $CALLER ./$j $TEST_ARGS
                echo "---------------------------------------------------------------------"
            fi
        done
    fi
done

cd $BASE_DIR

exit 0
