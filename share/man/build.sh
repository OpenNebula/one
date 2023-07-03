#!/bin/bash

# -------------------------------------------------------------------------- #
# Copyright 2002-2023, OpenNebula Project, OpenNebula Systems                #
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

set -e

# COMMANDS: array of pairs
# 'command' 'description'
# we want to generate the manual pages for
COMMANDS=(
    'bin/oneacct'           'OpenNebula Accounting Tool'
    'bin/oneacl'            'manages OpenNebula ACLs'
    'bin/onebackupjob'      'manages OpenNebula Backup Jobs'
    'bin/onecfg'            'OpenNebula configuration management tool'
    'bin/onedb'             'OpenNebula database migration tool'
    'bin/onegroup'          'manages OpenNebula groups'
    'bin/onehost'           'manages OpenNebula hosts'
    'bin/onehook'           'manages OpenNebula hooks'
    'bin/oneimage'          'manages OpenNebula images'
    'bin/onetemplate'       'manages OpenNebula templates'
    'bin/oneuser'           'manages OpenNebula users'
    'bin/onevm'             'manages OpenNebula virtual machines'
    'bin/onevnet'           'manages OpenNebula networks'
    'bin/onezone'           'manages OpenNebula zones'
    'bin/onevdc'            'manages OpenNebula Virtual DataCenters'
    'bin/onecluster'        'manages OpenNebula clusters'
    'bin/onedatastore'      'manages OpenNebula datastores'
    'bin/onevcenter'        'vCenter import tool'
    'bin/oneshowback'       'OpenNebula Showback Tool'
    'bin/onesecgroup'       'manages OpenNebula security groups'
    'bin/onevrouter'        'manages OpenNebula Virtual Routers'
    'bin/onemarket'         'manages internal and external Marketplaces'
    'bin/onemarketapp'      'manages appliances from Marketplaces'
    'bin/onevmgroup'        'manages VM groups'
    'bin/onevntemplate'     'manages Virtual Network Templates'

    'bin/oneprovision'      'manages OpenNebula provisions'
    'bin/oneprovider'       'manages OpenNebula providers'

    'bin/oneflow'           'Manage oneFlow Services'
    'bin/oneflow-template'  'Manage oneFlow Templates'

    'lib/onegate/onegate'   'Manage communication between VMs and OpenNebula'

    'bin/onelog'            'Access to OpenNebula services log files'
    'bin/oneirb'            'Opens an irb session'
)

DIR_BUILD=$(mktemp -d)
trap "rm -rf ${DIR_BUILD}" EXIT

ONE_MAN=$(dirname $0)
ONE_INSTALL="${ONE_MAN}/../../install.sh"
ONE_REPO=$(dirname "${ONE_INSTALL}")

###

(
    cd "${ONE_REPO}"
    ./install.sh -l -d "${DIR_BUILD}"
)

export ONE_LOCATION="${DIR_BUILD}"

INDEX=0
while [ -n "${COMMANDS[${INDEX}]}" ]; do
    MAN_CMD_PATH="${COMMANDS[${INDEX}]}"
    MAN_CMD=$(basename "${COMMANDS[${INDEX}]}")
    MAN_DESC="${MAN_CMD}(1) -- ${COMMANDS[$((INDEX + 1))]}"

    echo "${MAN_DESC}"

    # base document
    echo "# ${MAN_DESC}" >"${MAN_CMD}.1.ronn"
    echo >> "${MAN_CMD}.1.ronn"
    "${DIR_BUILD}/${MAN_CMD_PATH}" --help &>> "${MAN_CMD}.1.ronn" || :

    # manual pages/html
    ronn --style toc --manual="${MAN_DESC}" "${MAN_CMD}.1.ronn"
    gzip -c "${MAN_CMD}.1" >> "${MAN_CMD}.1.gz"

    unlink "${MAN_CMD}.1.ronn"

    INDEX=$((INDEX + 2))
done
