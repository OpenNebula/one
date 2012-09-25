#!/bin/bash

# -------------------------------------------------------------------------- #
# Copyright 2010-2012, C12G Labs S.L.                                        #
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

VERSION=${VERSION:-3.6.0}
MAINTAINER=${MAINTAINER:-C12G Labs <support@c12g.com>}
LICENSE=${LICENSE:-Apache}
PACKAGE_NAME=${PACKAGE_NAME:-oneapps}
VENDOR=${VENDOR:-C12G Labs}
DESC="
OpenNebula Apps description
"
DESCRIPTION=${DESCRIPTION:-$DESC}
PACKAGE_TYPE=${PACKAGE_TYPE:-deb}
URL=${URL:-http://opennebula.pro}

SCRIPTS_DIR=$PWD
NAME="${PACKAGE_NAME}_${VERSION}.${PACKAGE_TYPE}"
rm $NAME

DIRS="oneapps stage flow market"
export DESTDIR=$PWD/tmp

if [ "$(id -u)" = "0" ]; then
    OWNER_FLAGS='-u oneadmin -g oneadmin'
fi

rm -rf $DESTDIR
mkdir $DESTDIR

for TOOL in $DIRS; do
    (
        cd $TOOL
        ./install.sh $OWNER_FLAGS
    )
done

cd tmp

fpm -n "$PACKAGE_NAME" -t "$PACKAGE_TYPE" -s dir --vendor "$VENDOR" \
    --license "$LICENSE" --description "$DESCRIPTION" --url "$URL" \
    -m "$MAINTAINER" -v "$VERSION" \
    -a all -p $SCRIPTS_DIR/$NAME *

#  --after-install $SCRIPTS_DIR/postinstall \

echo $NAME


