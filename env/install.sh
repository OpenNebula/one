#!/bin/bash

# -------------------------------------------------------------------------- #
# Copyright 2010-2012, C12G Labs S.L.                                        #
#                                                                            #
# Licensed under the C12G Commercial Open-source License (the                #
# "License"); you may not use this file except in compliance                 #
# with the License. You may obtain a copy of the License as part             #
# of the software distribution.                                              #
#                                                                            #
# Unless agreed to in writing, software distributed under the                #
# License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES             #
# OR CONDITIONS OF ANY KIND, either express or implied. See the              #
# License for the specific language governing permissions and                #
# limitations under the License.                                             #
#--------------------------------------------------------------------------- #

TEMP_OPT=`getopt -o ld: -n 'install.sh' -- "$@"`

if [ $? != 0 ] ; then
    usage
    exit 1
fi

eval set -- "$TEMP_OPT"

LINK="no"
SRC_DIR=$PWD

while true ; do
    case "$1" in
        -d) ROOT="$2" ; shift 2 ;;
        -l) LINK="yes" ; shift ;;
        --) shift ; break ;;
        *)  usage; exit 1 ;;
    esac
done

if [ -z "ROOT" ]; then
    LIB_LOCATION="/usr/lib/one/ruby/apptools"
    BIN_LOCATION="/usr/bin"
else
    LIB_LOCATION="$ROOT/lib/ruby/apptools"
    BIN_LOCATION="$ROOT/bin"
fi

DIRECTORIES="$LIB_LOCATION $BIN_LOCATION"

do_file() {
    if [ "$UNINSTALL" = "yes" ]; then
        rm $2/`basename $1`
    else
        if [ "$LINK" = "yes" ]; then
            ln -s $SRC_DIR/$1 $DESTDIR$2
        else
            cp $SRC_DIR/$1 $DESTDIR$2
        fi
    fi
}

copy_files() {
    FILES=$1
    DST=$DESTDIR$2

    mkdir -p $DST

    for f in $FILES; do
        do_file $f $DST
    done
}

copy_files "lib/* cli/*" "$LIB_LOCATION"
copy_files "bin/*" "$BIN_LOCATION"

