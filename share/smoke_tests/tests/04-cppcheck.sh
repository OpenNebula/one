#!/bin/sh

# This script uses static analysis tool CppCheck to find issues in C++ code

# As first step it's doing just basic checks, we should solve them and
# consider adding more with flag --enable:
#  - performance - should be added first, shows minor performance issues
#  - information
#  - warning - adds lot of issues: uninitialized variable, redundant condition,
#              index out of range, ...
#  - style - adds lot of low priority issues
#  - all - all check, too many errors

# To disable specific error messages use cppcheck-suppressions.xml file

SOURCES="src"
INCLUDES="-I include -I src/monitor/include -I src/scheduler/include"
DEFINES="-DSQLITE_DB -DMYSQL_DB -DSYSTEMD"
ENABLE="--enable=performance,information,warning,portability,style"
IGNORE="-i .xmlrpc_test/ -i src/sunstone/ -i src/svncterm_server/ -i src/fireedge -i src/parsers -i src/vmm/LibVirtDriverKVM.cc"
SUPRESS="--suppress-xml=share/smoke_tests/config/cppcheck-suppressions.xml"
OTHERS="--std=c++17 --error-exitcode=2 -q -j 4"

cppcheck $SOURCES $INCLUDES $DEFINES $IGNORE $ENABLE $SUPRESS $OTHERS
