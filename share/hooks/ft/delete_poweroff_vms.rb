#!/usr/bin/env ruby

# -------------------------------------------------------------------------- #
# Copyright 2002-2016, OpenNebula Project, OpenNebula Systems                #
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

##############################################################################
# Script to implement host failure tolerance
#   It can be set to
#           -m migrate VMs to another host. Only for images in shared storage
#           -r recreate VMs running in the host. State will be lost.
#           -d delete VMs running in the host
#   Additional flags
#           -f force resubmission of suspended VMs
#           -p <n> avoid resubmission if host comes
#                  back after n monitoring cycles
##############################################################################

##############################################################################
# WARNING! WARNING! WARNING! WARNING! WARNING! WARNING! WARNING! WARNING!
#
# This script needs to fence the error host to prevent split brain VMs. You
# may use any fence mechanism and invoke it around L105, using host_name
#
# WARNING! WARNING! WARNING! WARNING! WARNING! WARNING! WARNING! WARNING!
#############################################################################

ONE_LOCATION=ENV["ONE_LOCATION"]

if !ONE_LOCATION
    RUBY_LIB_LOCATION="/usr/lib/one/ruby"
    VMDIR="/var/lib/one"
    CONFIG_FILE="/var/lib/one/config"
else
    RUBY_LIB_LOCATION=ONE_LOCATION+"/lib/ruby"
    VMDIR=ONE_LOCATION+"/var"
    CONFIG_FILE=ONE_LOCATION+"/var/config"
end

$: << RUBY_LIB_LOCATION

require 'opennebula'
require 'vcenter_driver'
include OpenNebula
require 'base64'

require 'getoptlong'

vm_id = ARGV[0]
prev_state=ARGV[1]
prev_lcm_state=ARGV[2]
template=ARGV[3]

if !vm_id ||
   !prev_state ||
   !prev_lcm_state ||
   !template
    exit -1
end

templ    = Base64.decode64(template)

template = OpenNebula::XMLElement.new
template.initialize_xml(templ, 'VM')

lcm_state_num = template["/VM/LCM_STATE"].to_i
deploy_id     = template["/VM/DEPLOY_ID"]
lcm_state     = OpenNebula::VirtualMachine::LCM_STATE[lcm_state_num]
keep_disks    = !template['/VM/USER_TEMPLATE/KEEP_DISKS_ON_DONE'].nil? &&
                 template['/VM/USER_TEMPLATE/KEEP_DISKS_ON_DONE'].downcase=="yes"
disks         = [template.to_hash["VM"]["TEMPLATE"]["DISK"]].flatten.compact
host          =  template.retrieve_elements("/VM/HISTORY_RECORDS/HISTORY/HOSTNAME").last

cloned_tmplt = nil
if !template['/VMM_DRIVER_ACTION_DATA/VM/TEMPLATE/CLONING_TEMPLATE_ID'].nil?
    cloned_tmplt  =  template['/VMM_DRIVER_ACTION_DATA/VM/TEMPLATE/TEMPLATE_ID']
end

VCenterDriver::VCenterVm.cancel(deploy_id, host, lcm_state, keep_disks, disks, cloned_tmplt)
