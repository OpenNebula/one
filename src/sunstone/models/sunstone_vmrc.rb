# -------------------------------------------------------------------------- #
# Copyright 2002-2021, OpenNebula Project, OpenNebula Systems                #
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

if !ONE_LOCATION
    VMRC_TICKETS = '/var/lib/one/sunstone_vmrc_tokens/'
else
    VMRC_TICKETS = ONE_LOCATION + '/var/sunstone_vmrc_tokens/'
end

FileUtils.mkdir_p VMRC_TICKETS

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

        vm_id  = vm_resource['ID']
        one_vm = VCenterDriver::VIHelper.one_item(
            OpenNebula::VirtualMachine,
            vm_id
        )
        vm_ref = one_vm['DEPLOY_ID']

        host_id = one_vm['HISTORY_RECORDS/HISTORY[last()]/HID'].to_i

        vi_client = VCenterDriver::VIClient.new_from_host(host_id, client)

        vm = VCenterDriver::VirtualMachine.new(vi_client, vm_ref, vm_id)

        parameters = vm.html_console_parameters

        data = {
            :host   => parameters[:host],
            :port   => parameters[:port],
            :ticket => parameters[:ticket]
        }

        file = File.open(
            VMRC_TICKETS +
            VCenterDriver::FileHelper.sanitize(data[:ticket]),
            'w'
        )
        file.write('https://' + data[:host] + ':' + data[:port].to_s)
        file.close

        info = SunstoneVMHelper.get_remote_info(vm_resource)
        encode_info = Base64.encode64(info.to_json)

        [200, { :data => data, :info => encode_info }.to_json]
    end

end
