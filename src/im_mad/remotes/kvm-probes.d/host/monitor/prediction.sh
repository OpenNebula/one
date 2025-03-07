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

PYTHON_PATH=/var/tmp/one/im/lib/python

PYTHON_VERSION=$(python3 --version | cut -d ' ' -f2)
MAJOR=$(echo "$PYTHON_VERSION" | cut -d. -f1)
MINOR=$(echo "$PYTHON_VERSION" | cut -d. -f2)

if [[ "$MAJOR" -lt 3 ]] || [[ "$MAJOR" -eq 3 && "$MINOR" -lt 9 ]]; then
    if command -v python3.9 &>/dev/null; then
        PYTHON=python3.9
    else
        exit 0
    fi
else
   PYTHON=python3
fi

PYTHONPATH=$PYTHON_PATH $PYTHON $PYTHON_PATH/prediction.py --entity host,0,0,/var/tmp/one --pythonpath $PYTHON_PATH
