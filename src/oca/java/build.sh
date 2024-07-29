#!/bin/bash

# -------------------------------------------------------------------------- #
# Copyright 2002-2024, OpenNebula Project, OpenNebula Systems                #
#                                                                            #
# Licensed under the Apache License, Version 2.0 (the "License"); you may    #
# not use this file except in compliance with the License. You may obtain    #
# a copy of the License at                                                   #
#                                                                            #
# http://www.apache.org/licenses/LICENSE-2.0                                 #
#                                                                            #
# Unless required by applicable law or agreed to in writing, software        #
# distributed under the License is distributed on an "AS IS" BASIS,          #
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.   #
# See the License for the specific language governing permissions and        #
# limitations under the License.                                             #
#--------------------------------------------------------------------------- #

set -e

#-------------------------------------------------------------------------------
# DIR DEFINITIONS
#-------------------------------------------------------------------------------

DOC_DIR="./share/doc"
BIN_DIR="./bin"
JAR_DIR="./jar"
LIB_DIR="/usr/share/java"
EXA_DIR="./share/examples"

OCA_JAR=$JAR_DIR"/org.opennebula.client.jar"


#-------------------------------------------------------------------------------
# COMMAND LINE PARSING
#-------------------------------------------------------------------------------
usage() {
 echo
 echo "Usage: build.sh [-d ] [-h] [-s] [-p version]"
 echo
 echo "-d: build the documentation"
 echo "-s: compile the examples"
 echo "-c: clean compilation files"
 echo "-p: build the java-oca-version-tar.gz package"
 echo "-h: prints this help"
}
#-------------------------------------------------------------------------------

TEMP_OPT=`getopt -o hsdcp: -n 'build.sh' -- "$@"`

eval set -- "$TEMP_OPT"

DO_DOC="no"
DO_EXA="no"
DO_CLEAN="no"
DO_PACKAGE="no"
VERSION=""

while true ; do
    case "$1" in
        -h) usage; exit 0;;
        -d) DO_DOC="yes"; shift ;;
        -s) DO_EXA="yes"; shift ;;
        -c) DO_CLEAN="yes"; shift ;;
        -p) DO_PACKAGE="yes"; VERSION=$2; shift 2;;
        --) shift ; break ;;
        *)  usage; exit 1 ;;
    esac
done

#-------------------------------------------------------------------------------
# BUILD FUNCTIONS
#-------------------------------------------------------------------------------

do_documentation()
{
    echo "Generating javadocs..."

    rm -rf $DOC_DIR > /dev/null 2>&1
    mkdir -p $DOC_DIR
    javadoc -quiet -classpath $LIB_DIR"/*" -d $DOC_DIR \
      -sourcepath ./src/ \
      -subpackages org.opennebula \
      -windowtitle 'OpenNebula Cloud API' \
      -doctitle 'OpenNebula Cloud API Specification' \
      -header '<b>OpenNebula</b><br><font size="-1">Cloud API</font>' \
      -bottom 'Visit <a
href="http://opennebula.io/">OpenNebula.io</a><br>Copyright 2002-2024 &copy;
OpenNebula Project, OpenNebula Systems.'
}

do_jar()
{
    rm -rf $BIN_DIR > /dev/null 2>&1
    mkdir -p $BIN_DIR

    rm -rf $JAR_DIR > /dev/null 2>&1
    mkdir -p $JAR_DIR

    echo "Compiling java files into class files..."
    javac -d $BIN_DIR -cp $LIB_DIR"/*" `find src -name *.java`

    if [ $? -eq 0 ]; then
        echo "Packaging class files in a jar..."
        jar cf $OCA_JAR -C $BIN_DIR org
    fi
}

do_examples()
{
    echo "Compiling OpenNebula Cloud API Examples..."
    javac -d $EXA_DIR -classpath $OCA_JAR:$LIB_DIR/* `find share/examples -name *.java`
}

do_clean()
{
    echo "Cleaning .class files..."
    rm -rf $BIN_DIR > /dev/null 2>&1
    mkdir -p $BIN_DIR

    find share/examples -name '*.class' -delete

    if [ -d test/ ]; then
        find test/ -name '*.class' -delete
    fi

    echo "Cleaning javadoc files..."
    rm -rf $DOC_DIR > /dev/null 2>&1

    echo "Cleaning jar files..."
    rm -rf $JAR_DIR > /dev/null 2>&1
}

if [ "$DO_CLEAN" = "yes" ] ; then
    do_clean
    exit 0
fi

do_jar

if [ "$DO_DOC" = "yes" ] ; then
    do_documentation
fi

if [ "$DO_EXA" = "yes" ] ; then
    do_examples
fi

if [ "$DO_PACKAGE" = "yes" ] ; then
    do_documentation

    PACK_NAME="java-oca-$VERSION"

    mkdir $PACK_NAME
    cp -r share/doc $PACK_NAME
    cp -r jar $PACK_NAME

    tar czf $PACK_NAME.tar.gz $PACK_NAME

    rm -rf $PACK_NAME
fi
