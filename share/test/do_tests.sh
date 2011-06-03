#!/bin/bash
#-------------------------------------------------------------------------------
# DEFINE THE TESTS
#-------------------------------------------------------------------------------
TWD_DIR="../../src"
BASE_DIR=$PWD

TESTS="$TWD_DIR/vnm/test \
       $TWD_DIR/xml/test \
       $TWD_DIR/scheduler/src/pool/test \
       $TWD_DIR/common/test \
       $TWD_DIR/host/test \
       $TWD_DIR/template/test \
       $TWD_DIR/image/test \
       $TWD_DIR/authm/test \
       $TWD_DIR/vm/test \
       $TWD_DIR/um/test \
       $TWD_DIR/lcm/test \
       $TWD_DIR/pool/test \
       $TWD_DIR/vm_template/test \
       $TWD_DIR/group/test"

#-------------------------------------------------------------------------------
# COMMAND LINE PARSING
#-------------------------------------------------------------------------------
usage() {
 echo
 echo "Usage: do_test.sh [-smvgxclh]"
 echo
 echo "-m: use MyQSL backend (defaults to Sqlite)"
 echo "-v: run tests using valgrind (memcheck) output will be memgrind.out"
 echo "-g: run tests using valgrind (callgrind) output will be callgrind.out"
 echo "-l: keep logs"
 echo "-x: create xml output files, for Hudson"
 echo "-c: clear output files from previous executions"
 echo
 echo "-h: prints this help"
}
#-------------------------------------------------------------------------------

TEMP_OPT=`getopt -o mvgclbhx -n 'install.sh' -- "$@"`

if [ $? != 0 ] ; then
    usage
    exit 1
fi

eval set -- "$TEMP_OPT"

MYSQL="no"
VAL_MEM="no"
VAL_CALL="no"
LOGS="no"
XMLS="no"
CLEAR="no"


while true ; do
    case "$1" in
        -h) usage; exit 0;;
        -m) MYSQL="yes"   ; shift ;;
        -v) VAL_MEM="yes" ; shift ;;
        -g) VAL_CALL="yes"; shift ;;
        -l) LOGS="yes"    ; shift ;;
        -x) XMLS="yes"    ; shift ;;
        -c) CLEAR="yes"   ; shift ;;
        --) shift ; break ;;
        *)  usage; exit 1 ;;
    esac
done


#-------------------------------------------------------------------------------
# SETUP ARGUMENTS
#-------------------------------------------------------------------------------

if [ "$MYSQL" = "yes" ] ; then
    TEST_ARGS="-m"
else
    TEST_ARGS="-s"
fi

if [ "$LOGS" = "yes" ] ; then
    TEST_ARGS="$TEST_ARGS -l"
fi

if [ "$XMLS" = "yes" ] ; then
    TEST_ARGS="$TEST_ARGS -x"
fi

CALLER=""

if [ "$VAL_MEM" = "yes" ] ; then
    CALLER="valgrind --show-reachable=yes --leak-check=full"
elif [ "$VAL_CALL" = "yes" ] ; then
    CALLER="valgrind --tool=callgrind"
fi


for i in $TESTS ; do
    cd $BASE_DIR

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
