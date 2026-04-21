#!/bin/bash -xv
# -------------------------------------------------------------------------- #
# Copyright 2002-2026, OpenNebula Project, OpenNebula Systems                #
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

# lint ruby code

ln -s  $GITHUB_WORKSPACE/share/linters/.rubocop.yml $HOME
cd $GITHUB_WORKSPACE

RUBOCOP_VER=$(rubocop --version | cut -d. -f1,2)

rubocop
rc=$?

if [[ $rc != 0 ]]; then
    COPS=$(rubocop --format json | jq -r '.files[].offenses[].cop_name' | sort -u)

    for COP in $COPS; do
        ADDED_VER=$(rubocop --show-cops "$COP" | awk '/VersionAdded:/ {print $2}' | tr -d "'\"" | cut -d. -f1,2)

        if [[ "$ADDED_VER" == "$RUBOCOP_VER" ]]; then
            CATEGORY=$(echo "$COP" | cut -d/ -f1 | tr 'a-z' 'A-Z')

            sed -i "/# $CATEGORY/!b;n;a \\n$COP:\n  Enabled: false\n" share/linters/.rubocop.yml
        fi
    done

    exit $rc
fi

# check for require 'pry'
find . -name "*.rb"|xargs grep 'require'|grep "pry\|pry-byebug"

rc=$?; if [[ $rc != 1 ]]; then exit 1; fi

find src/cli/* \( -path src/cli/one_helper -o -path src/cli/etc \) -prune -o -print |xargs grep 'require'|grep "pry\|pry-byebug"

rc=$?; if [[ $rc != 1 ]]; then exit 1; fi

exit 0
