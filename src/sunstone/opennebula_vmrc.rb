# -------------------------------------------------------------------------- #
# Copyright 2002-2020, OpenNebula Project, OpenNebula Systems                #
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

if !ONE_LOCATION
    VMRC_TICKETS = '/var/lib/one/sunstone_vmrc_tokens/'
else
    VMRC_TICKETS = ONE_LOCATION + '/var/sunstone_vmrc_tokens/'
end

FileUtils.mkdir_p VMRC_TICKETS

VMRC_STATES = [
    # 0,  # LCM_INIT
    # 1,  # PROLOG
    # 2,  # BOOT
    '3',  # RUNNING
    '4',  # MIGRATE
    # 5,  # SAVE_STOP
    # 6,  # SAVE_SUSPEND
    # 7,  # SAVE_MIGRATE
    # 8,  # PROLOG_MIGRATE
    # 9,  # PROLOG_RESUME
    # 10, # EPILOG_STOP
    # 11, # EPILOG
    '12', # SHUTDOWN
    '13', # CANCEL
    # 14, # FAILURE
    # 15, # CLEANUP_RESUBMIT
    '16', # UNKNOWN
    '17', # HOTPLUG
    '18', # SHUTDOWN_POWEROFF
    # 19, # BOOT_UNKNOWN
    # 20, # BOOT_POWEROFF
    # 21, # BOOT_SUSPENDED
    # 22, # BOOT_STOPPED
    # 23, # CLEANUP_DELETE
    '24', # HOTPLUG_SNAPSHOT
    '25', # HOTPLUG_NIC
    '26', # HOTPLUG_SAVEAS
    '27', # HOTPLUG_SAVEAS_POWEROFF
    '28', # HOTPLUG_SAVEAS_SUSPENDED
    '29', # SHUTDOWN_UNDEPLOY
    # 30, # EPILOG_UNDEPLOY
    # 31, # PROLOG_UNDEPLOY
    # 32, # BOOT_UNDEPLOY
    # 33, # HOTPLUG_PROLOG_POWEROFF
    # 34, # HOTPLUG_EPILOG_POWEROFF
    # 35, # BOOT_MIGRATE
    # 36, # BOOT_FAILURE
    # 37, # BOOT_MIGRATE_FAILURE
    # 38, # PROLOG_MIGRATE_FAILURE
    # 39, # PROLOG_FAILURE
    # 40, # EPILOG_FAILURE
    # 41, # EPILOG_STOP_FAILURE
    # 42, # EPILOG_UNDEPLOY_FAILURE
    # 43, # PROLOG_MIGRATE_POWEROFF
    # 44, # PROLOG_MIGRATE_POWEROFF_FAILURE
    # 45, # PROLOG_MIGRATE_SUSPEND
    # 46, # PROLOG_MIGRATE_SUSPEND_FAILURE
    # 47, # BOOT_UNDEPLOY_FAILURE
    # 48, # BOOT_STOPPED_FAILURE
    # 49, # PROLOG_RESUME_FAILURE
    # 50, # PROLOG_UNDEPLOY_FAILURE
    # 51, # DISK_SNAPSHOT_POWEROFF
    # 52, # DISK_SNAPSHOT_REVERT_POWEROFF
    # 53, # DISK_SNAPSHOT_DELETE_POWEROFF
    # 54, # DISK_SNAPSHOT_SUSPENDED
    # 55, # DISK_SNAPSHOT_REVERT_SUSPENDED
    # 56, # DISK_SNAPSHOT_DELETE_SUSPENDED
    '57', # DISK_SNAPSHOT
    '58', # DISK_SNAPSHOT_REVERT
    # 59, # DISK_SNAPSHOT_DELETE
    # 60, # PROLOG_MIGRATE_UNKNOWN
    # 61, # PROLOG_MIGRATE_UNKNOWN_FAILURE
    '62' # DISK_RESIZE
    # 63, # DISK_RESIZE_POWEROFF
    # 64  # DISK_RESIZE_UNDEPLOYED
    # 65  # HOTPLUG_NIC_POWEROFF
]

# Class for necessary VMRC ticket creation
class OpenNebulaVMRC

    attr_reader :proxy_port

    def initialize(logger, options = {})
        opts={ :json_errors => true }.merge(options)

        @options = opts
        @logger = logger
    end

    def sanitize(ticket)
        # Bad as defined by wikipedia: https://en.wikipedia.org/wiki/Filename#Reserved_characters_and_words
        # Also have to escape the backslash
        bad_chars = ['/', '\\', '?', '%', '*', ':',
                     '|', '"', '<', '>', '.', ' ']
        bad_chars.each do |bad_char|
            ticket.gsub!(bad_char, '_')
        end
        ticket
    end

    def proxy(vm_resource)
        # Check configurations and VM attributes
        unless VMRC_STATES.include?(vm_resource['LCM_STATE'])
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

        vi_client = VCenterDriver::VIClient.new_from_host(host_id)

        vm = VCenterDriver::VirtualMachine.new(vi_client, vm_ref, vm_id)

        parameters = vm.get_html_console_parameters

        data = {
            :host   => parameters[:host],
            :port   => parameters[:port],
            :ticket => parameters[:ticket]
        }

        file = File.open(VMRC_TICKETS + sanitize(data[:ticket]), 'w')
        file.write('https://' + data[:host] + ':' + data[:port].to_s)
        file.close

        [200, { :data => data }.to_json]
    end

    private

    def error(code, msg)
        if @options[:json_errors]
            [code, OpenNebula::Error.new(msg).to_json]
        else
            [code, msg]
        end
    end

end
