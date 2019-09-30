#!/bin/bash

# -------------------------------------------------------------------------- #
# Copyright 2002-2019, OpenNebula Project, OpenNebula Systems                #
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
    'oneacct'           'OpenNebula Accounting Tool'
    'oneacl'            'manages OpenNebula ACLs'
    'onedb'             'OpenNebula database migration tool'
    'onegroup'          'manages OpenNebula groups'
    'onehost'           'manages OpenNebula hosts'
    'onehook'           'manages OpenNebula hooks'
    'oneimage'          'manages OpenNebula images'
    'onetemplate'       'manages OpenNebula templates'
    'oneuser'           'manages OpenNebula users'
    'onevm'             'manages OpenNebula virtual machines'
    'onevnet'           'manages OpenNebula networks'
    'onezone'           'manages OpenNebula zones'
    'onevdc'            'manages OpenNebula Virtual DataCenters'
    'onecluster'        'manages OpenNebula clusters'
    'onedatastore'      'manages OpenNebula datastores'
    'onevcenter'        'vCenter import tool'
    'oneshowback'       'OpenNebula Showback Tool'
    'onesecgroup'       'manages OpenNebula security groups'
    'onevrouter'        'manages OpenNebula Virtual Routers'
    'onemarket'         'manages internal and external Marketplaces'
    'onemarketapp'      'manages appliances from Marketplaces'
    'onevmgroup'        'manages VM groups'
    'onevntemplate'     'manages Virtual Network Templates'
    'oneprovision'      'manages OpenNebula provisions'

    'oneflow'           'Manage oneFlow Services'
    'oneflow-template'  'Manage oneFlow Templates'

    'econe-allocate-address'     'Allocates a new elastic IP address for the user'
    'econe-associate-address'    'Associates a publicIP of the user with a given instance'
    'econe-attach-volume'        'Attaches a DATABLOCK to an instance'
    'econe-create-keypair'       'Creates the named keypair'
    'econe-create-volume'        'Creates a new DATABLOCK in OpenNebula'
    'econe-delete-keypair'       'Deletes the named keypair, removes the associated keys'
    'econe-delete-volume'        'Deletes an existing DATABLOCK'
    'econe-describe-addresses'   'Lists elastic IP addresses'
    'econe-describe-images'      'Lists all registered images belonging to one particular user'
    'econe-describe-instances'   'Outputs a list of launched images belonging to one particular user'
    'econe-describe-keypairs'    'List and describe the key pairs available to the user'
    'econe-describe-volumes'     'Describe all available DATABLOCKs for this user'
    'econe-detach-volume'        'Detaches a DATABLOCK from an instance'
    'econe-disassociate-address' 'Disasociate a publicIP of the user currently associated with an instance'
    'econe-reboot-instances'     'Reboots a set of virtual machines'
    'econe-register'             'Registers an image'
    'econe-release-address'      'Releases a publicIP of the user'
    'econe-run-instances'        'Runs an instance of a particular image (that needs to be referenced)'
    'econe-start-instances'      'Starts a set of virtual machines'
    'econe-stop-instances'       'Stops a set of virtual machines'
    'econe-terminate-instances'  'Shutdowns a set of virtual machines (or cancel, depending on its state)'
    'econe-upload'               'Uploads an image to OpenNebula'
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
    MAN_CMD="${COMMANDS[${INDEX}]}"
    MAN_DESC="${MAN_CMD}(1) -- ${COMMANDS[$((INDEX + 1))]}"

    echo "${MAN_DESC}"

    # base document
    echo "# ${MAN_DESC}" >"${MAN_CMD}.1.ronn"
    echo >>"${MAN_CMD}.1.ronn"
    "${DIR_BUILD}/bin/${MAN_CMD}" --help >>"${MAN_CMD}.1.ronn" || :

    # manual pages/html
    ronn --style toc --manual="${MAN_DESC}" "${MAN_CMD}.1.ronn"
    gzip -c "${MAN_CMD}.1" >>"${MAN_CMD}.1.gz"

    unlink "${MAN_CMD}.1.ronn"

    INDEX=$((INDEX + 2))
done
