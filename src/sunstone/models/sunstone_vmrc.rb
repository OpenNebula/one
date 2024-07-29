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

#----------------------------------------------------------------------------#
# This class provides support for launching and stopping a vmrc proxy server #
#----------------------------------------------------------------------------#

require 'rubygems'
require 'json'
require 'opennebula'
require 'base64'
require 'openssl'
require 'vcenter_driver'
require 'fileutils'
require 'sunstone_remotes'

# Class for necessary VMRC ticket creation
class SunstoneVMRC < SunstoneRemoteConnections

    attr_reader :proxy_port

    def initialize(logger, options = {})
        super
    end

    def proxy(vm_resource, client = nil)
        # Check configurations and VM attributes
        unless allowed_console_states.include?(vm_resource['LCM_STATE'])
            error_message = "Wrong state (#{vm_resource['LCM_STATE']}) to
             open a VMRC session"
            return error(400, error_message)
        end

        unless vm_resource['USER_TEMPLATE/HYPERVISOR'] == 'vcenter'
            return error(400, 'VMRC Connection is only for vcenter hipervisor')
        end

        unless vm_resource['MONITORING/VCENTER_ESX_HOST']
            error_message = 'Could not determine the vCenter ESX host where
             the VM is running. Wait till the VCENTER_ESX_HOST attribute is
             retrieved once the host has been monitored'
            return error(400, error_message)
        end

        info = SunstoneVMHelper.get_remote_info(vm_resource)
        encode_info = Base64.encode64(info.to_json)

        [200, { :info => encode_info }.to_json]
    end

end
