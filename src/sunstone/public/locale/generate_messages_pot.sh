#!/bin/bash

# -------------------------------------------------------------------------- #
# Copyright 2002-2015, OpenNebula Project (OpenNebula.org), C12G Labs        #
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

COPYRIGHT_HOLDER="2002-2015, OpenNebula Project (OpenNebula.org), C12G Labs"
PACKAGE_NAME="OpenNebula"

find ../app -name \*.js > file_list.txt
xgettext --from-code=utf-8 --copyright-holder="$COPYRIGHT_HOLDER" --package-name="$PACKAGE_NAME" --no-wrap --keyword= --keyword=tr -L JavaScript -f file_list.txt -p .

# xgettext-template project: https://github.com/gmarty/xgettext
# tail removes the first configuration lines for msgid ""

find ../app -name \*.hbs -exec sh -c "xgettext-template -L Handlebars --from-code utf-8 --force-po --keyword tr {}| tail -n +3 >> messages.po" \;

mv messages.po messages.pot

# Because hbs files are done individually, we have duplicated entries
msguniq messages.pot -o messages.pot --no-wrap

rm file_list.txt

# TODO hbs tr helper as a parameter to other helpers:
# {{#advancedSection (tr "Advanced Options") }}
