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

# lint C++ code

cd $GITHUB_WORKSPACE

# The astyle will format the C++ files, overwriting the original file
astyle --options=share/linters/.astylerc --formatted --verbose *.h,*.cc

# 'git diff --exit-code' returns 0 return code, if there is no difference to the HEAD commit
git --no-pager diff --exit-code
