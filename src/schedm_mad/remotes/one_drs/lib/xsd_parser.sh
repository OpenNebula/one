#!/bin/bash
#!/usr/bin/env python3
# -------------------------------------------------------------------------- #
# Copyright 2002-2025, OpenNebula Project, OpenNebula Systems                #
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
# -------------------------------------------------------------------------- #

PACKAGE="models"
OPENNEBULA_XSD_DIR="/usr/share/one/schemas/xsd"
SCHEDULER_DRIVER_ACTION="scheduler_driver_action.xsd"
SCHEDULER_DRIVER_OUTPUT="plan.xsd"

echo "Generating Python models from XSData..."
xsdata generate -p lib.${PACKAGE} ${OPENNEBULA_XSD_DIR}/${SCHEDULER_DRIVER_OUTPUT} 
xsdata generate -p lib.${PACKAGE} ${OPENNEBULA_XSD_DIR}/${SCHEDULER_DRIVER_ACTION}

echo "Moving generated models..."
mkdir -p ./${PACKAGE}
mv ./lib/${PACKAGE}/* ./${PACKAGE}
rm -rf ./lib

echo "Updating generated models..."
sed -i "1i from lib.${PACKAGE}.plan import Plan" "./${PACKAGE}/__init__.py"
sed -i '/^__all__ = \[/ a\    "Plan",' "./${PACKAGE}/__init__.py"
for file in ./${PACKAGE}/*.py; do
  sed -i '/^__NAMESPACE__ = "http:\/\/opennebula.org\/XMLSchema"$/,+1d' "$file"
  sed -i '/namespace/d' "$file"
done

echo "Cleaning up..."
rm -rf ./.ruff_cache ./${PACKAGE}/__pycache__ ./__pycache__