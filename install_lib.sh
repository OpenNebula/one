# -------------------------------------------------------------------------- #
# Copyright 2010-2013, C12G Labs S.L.                                        #
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

usage() {
 echo
 echo "Usage: install.sh [-u install_user] [-g install_group] [-f flavour]"
 echo "                  [-d ONE_LOCATION] [-l] [-h]"
 echo
 echo "-f: distribution, debian or other"
 echo "-d: target installation directory, if not defined it'd be root. Must be"
 echo "    an absolute path."
 echo "-l: creates symlinks instead of copying files, useful for development"
 echo "-h: prints this help"
}

TEMP_OPT=`getopt -o hlu:g:d:f: -n 'install.sh' -- "$@"`

if [ $? != 0 ] ; then
    usage
    exit 1
fi

eval set -- "$TEMP_OPT"

LINK="no"
ONEADMIN_USER=`id -u`
ONEADMIN_GROUP=`id -g`
SRC_DIR=$PWD
FLAVOR="other"

while true ; do
    case "$1" in
        -h) usage; exit 0;;
        -d) ROOT="$2" ; shift 2 ;;
        -l) LINK="yes" ; shift ;;
        -u) ONEADMIN_USER="$2" ; shift 2;;
        -g) ONEADMIN_GROUP="$2"; shift 2;;
        -f) FLAVOR="$2"; shift 2;;
        --) shift ; break ;;
        *)  usage; exit 1 ;;
    esac
done

echo $FLAVOR

if [ -z "$ROOT" ]; then
    case "$FLAVOR" in
    "debian")
        LIB_LOCATION="/usr/lib/one/ruby/oneapps"
        BIN_LOCATION="/usr/bin"
        PACKAGES_LOCATION="/usr/share/opennebula/oneapps"
        SHARE_LOCATION="/usr/share/opennebula/oneapps"
        ETC_LOCATION="/etc/one"
        SUNSTONE_LOCATION="/usr/share/opennebula/sunstone"
        ;;
    *)
        LIB_LOCATION="/usr/lib/one/ruby/oneapps"
        BIN_LOCATION="/usr/bin"
        PACKAGES_LOCATION="/usr/share/one/oneapps"
        SHARE_LOCATION="/usr/share/one/oneapps"
        ETC_LOCATION="/etc/one"
        SUNSTONE_LOCATION="/usr/lib/one/sunstone"
        ;;
    esac
else
    LIB_LOCATION="$ROOT/lib/ruby/oneapps"
    BIN_LOCATION="$ROOT/bin"
    PACKAGES_LOCATION="$ROOT/share/oneapps"
    SHARE_LOCATION="$ROOT/share/oneapps"
    ETC_LOCATION="$ROOT/etc"
    SUNSTONE_LOCATION="$ROOT/lib/sunstone"
fi

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

create_dirs() {
    DIRS=$*

    for d in $DIRS; do
        dir=$DESTDIR$d
        mkdir -p $dir
    done
}

change_ownership() {
    DIRS=$*
    for d in $DIRS; do
        chown -R $ONEADMIN_USER:$ONEADMIN_GROUP $DESTDIR$d
    done
}
