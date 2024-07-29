#!/bin/bash -xv
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

# lint ruby code

ln -s  $GITHUB_WORKSPACE/share/linters/.rubocop.yml $HOME
cd $GITHUB_WORKSPACE

rubocop

rc=$?; if [[ $rc != 0 ]]; then exit $rc; fi

# check for require 'pry'
find . -name "*.rb"|xargs grep 'require'|grep "pry\|pry-byebug"

rc=$?; if [[ $rc != 1 ]]; then exit 1; fi

find src/cli/* \( -path src/cli/one_helper -o -path src/cli/etc \) -prune -o -print |xargs grep 'require'|grep "pry\|pry-byebug"

rc=$?; if [[ $rc != 1 ]]; then exit 1; fi

exit 0
