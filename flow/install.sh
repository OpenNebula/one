#!/bin/bash

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

. ../install_lib.sh

if [ -z "$ROOT" ]; then
    LOG_LOCATION="/var/log/one/appflow"
else
    LOG_LOCATION="$ROOT/var/appflow"
fi

DIRECTORIES="$LIB_LOCATION $BIN_LOCATION $ETC_LOCATION $LOG_LOCATION"

create_dirs $DIRECTORIES

## Client files
copy_files "client/lib/*" "$LIB_LOCATION/flow"
copy_files "client/bin/*" "$BIN_LOCATION"

## Server files

# bin
copy_files "bin/*" "$BIN_LOCATION"

# dirs containing files
copy_files "controllers models lcm" "$LIB_LOCATION/flow"

# files
copy_files "lib/* models.rb config.ru Gemfile Gemfile.lock \
            Rakefile" "$LIB_LOCATION/flow"

# Sunstone
copy_files "sunstone/public/js/user-plugins/*" "$SUNSTONE_LOCATION/public/js/user-plugins"
copy_files "sunstone/public/images/*" "$SUNSTONE_LOCATION/public/images"
copy_files "sunstone/routes/*" "$SUNSTONE_LOCATION/routes"

# Do not link the ETC files
LINK="no"
copy_files "sunstone/etc/sunstone-appflow.conf" "$ETC_LOCATION"
copy_files "config/appflow-server.conf" "$ETC_LOCATION"

change_ownership $LOG_LOCATION
