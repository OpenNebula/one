#!/bin/bash

# -------------------------------------------------------------------------- #
# Copyright 2010-2014, C12G Labs S.L.                                        #
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

VERSION=${VERSION:-4.6.2}
MAINTAINER=${MAINTAINER:-C12G Labs <support@c12g.com>}
LICENSE=${LICENSE:-Apache 2.0}
PACKAGE_NAME=${PACKAGE_NAME:-one-context}
VENDOR=${VENDOR:-C12G Labs}
DESC="
This package prepares a VM image for OpenNebula:
  * Disables udev net and cd persistent rules
  * Deletes udev net and cd persistent rules
  * Unconfigures the network
  * Adds OpenNebula contextualization scripts to startup
    * Configure network
    * Configure dns (from DNS and ETH*_DNS context variables)
    * Set root authorized keys (from SSH_PUBLIC_KEY and EC2_PUBLIC_KEY)

To get support check the OpenNebula web page:
  http://OpenNebula.org
"
DESCRIPTION=${DESCRIPTION:-$DESC}
PACKAGE_TYPE=${PACKAGE_TYPE:-deb}
URL=${URL:-http://opennebula.org}

SCRIPTS_DIR=$PWD
NAME="${PACKAGE_NAME}_${VERSION}.${PACKAGE_TYPE}"
rm $NAME

rm -rf tmp
mkdir tmp
cp -r base/* tmp
cp -r base_$PACKAGE_TYPE/* tmp

for i in $*; do
  cp -r "$i" tmp
done

cd tmp

fpm -n "$PACKAGE_NAME" -t "$PACKAGE_TYPE" -s dir --vendor "$VENDOR" \
    --license "$LICENSE" --description "$DESCRIPTION" --url "$URL" \
    -m "$MAINTAINER" -v "$VERSION" --after-install $SCRIPTS_DIR/postinstall \
    -a all -p $SCRIPTS_DIR/$NAME *

echo $NAME


