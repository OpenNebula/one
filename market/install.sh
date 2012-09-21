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

if [ -z "$ROOT" ]; then
    LIB_LOCATION="/usr/lib/one/ruby/apptools/market"
    BIN_LOCATION="/usr/bin"
    ETC_LOCATION="/etc/one"
    SUNSTONE_LOCATION="/usr/lib/one/sunstone"
else
    LIB_LOCATION="$ROOT/lib/ruby/apptools/market"
    BIN_LOCATION="$ROOT/bin"
    ETC_LOCATION="$ROOT/etc"
    SUNSTONE_LOCATION="$ROOT/lib/sunstone"
fi

DIRECTORIES="$LIB_LOCATION $BIN_LOCATION $ETC_LOCATION"

do_file() {
    if [ "$UNINSTALL" = "yes" ]; then
        rm $2/`basename $1`
    else
        if [ "$LINK" = "yes" ]; then
            ln -fs $SRC_DIR/$1 $2
        else
            cp -R $SRC_DIR/$1 $2
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

## Client files
copy_files "client/lib/*" "$LIB_LOCATION"
copy_files "client/bin/*" "$BIN_LOCATION"

## Server files

# bin
copy_files "bin/*" "$BIN_LOCATION"

# dirs containing files
copy_files "controllers models public views" "$LIB_LOCATION"

# files
copy_files "lib/* models.rb config.ru Gemfile Gemfile.lock \
            Rakefile config/init.rb" "$LIB_LOCATION"

# Sunstone
copy_files "sunstone/public/js/user-plugins/*" \
    "$SUNSTONE_LOCATION/public/js/user-plugins"
copy_files "sunstone/routes/*" "$SUNSTONE_LOCATION/routes"

# Do not link the ETC files
LINK="no"
copy_files "sunstone/etc/sunstone-appmarket.conf" "$ETC_LOCATION"
copy_files "config/appmarket-server.conf" "$ETC_LOCATION"

