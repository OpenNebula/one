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

#
# This class provides support for launching and stopping a websockify proxy
#

require 'rubygems'
require 'json'
require 'opennebula'
require 'base64'
require 'openssl'

if !ONE_LOCATION
    GUAC_LOCK_FILE = '/var/lock/one/.guac.lock'
    GUACD_PID_FILE = '/var/run/one/guacd.pid'
    VAR_LOCATION = '/var/lib/one/'
else
    GUAC_LOCK_FILE= ONE_LOCATION + '/var/.guac.lock'
    GUACD_PID_FILE= ONE_LOCATION + '/var/guacd.pid'
    VAR_LOCATION = ONE_LOCATION + '/var/'
end

FIREEDGE_KEY = VAR_LOCATION + '/.one/fireedge_key'

GUAC_STATES = [
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
    # 64,  # DISK_RESIZE_UNDEPLOYED
    # 65,  #HOTPLUG_NIC_POWEROFF
]

# Class for Guacamole connection configuration
class OpenNebulaGuac

    attr_reader :proxy_port

    def initialize(logger, options = {})
        opts={ :json_errors => true }.merge(options)

        @lock_file = GUAC_LOCK_FILE
        @guacd_pid_file = GUACD_PID_FILE

        @options = opts
        @logger = logger
    end

    def proxy(vm_resource, type_connection = 'vnc')
        # Check configurations and VM attributes
        if !GUAC_STATES.include?(vm_resource['LCM_STATE'])
            error_message = "Wrong state (#{vm_resource['LCM_STATE']})
             to open a Guacamole session"
            return error(400, error_message)
        end

        unless %w[vnc rdp ssh].include?(type_connection.downcase)
            return error(400, 'Type connection not supported by Guacamole')
        end

        # TODO, (* : optional)   ================================
        # =======================================================
        # type      : telnet
        # hostname  : vm_resource["TEMPLATE/NIC[1]/IP"]
        # port*     : 23 by default
        # username* : vm_resource['TEMPLATE/CONTEXT/USERNAME']
        # password* : vm_resource['TEMPLATE/CONTEXT/PASSWORD']

        settings = nil
        case type_connection.downcase
        when 'vnc' then settings = get_config_vnc(vm_resource)
        when 'rdp' then settings = get_config_rdp(vm_resource)
        when 'ssh' then settings = get_config_ssh(vm_resource)
        else {
            :error => error(400, 'Type connection not supported by Guacamole')
        }
        end

        return settings[:error] if settings.key?(:error)

        if !File.exist?(FIREEDGE_KEY)
            return error(400, 'Fireedge_key is not available')
        end

        data = encrypt_data(
            {
                'connection' => {
                    'type' =>  type_connection.downcase,
                    'settings' =>  {
                        'security' =>  'any',
                        'ignore-cert' =>  'true',
                        'enable-drive' =>  'true',
                        'enable-audio' =>  'true',
                        'create-drive-path' =>  'true'
                    }.merge!(settings)
                }
            }
        )

        [200, { :token => data }.to_json]
    end

    private

    def error(code, msg)
        unless @options[:json_error]
            return [code, msg]
        end

        [code, OpenNebula::Error.new(msg).to_json]
    end

    if RUBY_VERSION<'1.9'
        def spawn(*args)
            fork do
                command=args[0..-2]

                # Close stdin and point out and err to log file
                $stdout.reopen(GUACAMOLE_LOG, 'a')
                $stderr.reopen(GUACAMOLE_LOG, 'a')
                $stdin.close

                # Detach process from the parent
                Process.setsid

                exec(*command)
            end
        end
    end

    def get_config_vnc(vm_resource)
        # If it is a vCenter VM
        if vm_resource['USER_TEMPLATE/HYPERVISOR'] == 'vcenter'
            if vm_resource['MONITORING/VCENTER_ESX_HOST']
                hostname = vm_resource['MONITORING/VCENTER_ESX_HOST']
            else
                error_message = 'Could not determine the vCenter ESX host where
                 the VM is running. Wait till the VCENTER_ESX_HOST attribute is
                 retrieved once the host has been monitored'
                return error(400, error_message)
            end
        else
            hostname = vm_resource[
                '/VM/HISTORY_RECORDS/HISTORY[last()]/HOSTNAME'
            ]
        end

        {
            'hostname' => 'localhost',
            'port' => '5900',
            'password' => nil
        }.merge(
            {
                'hostname' =>  hostname,
                'port' =>  vm_resource['TEMPLATE/GRAPHICS/PORT'],
                'password' =>  vm_resource['TEMPLATE/GRAPHICS/PASSWD']
            }
        )
    end

    def get_config_rdp(vm_resource)
        hostname = vm_resource["TEMPLATE/NIC[RDP='YES'][1]/IP"] ||
                   vm_resource["TEMPLATE/NIC_ALIAS[RDP='YES'][1]/IP"]

        if hostname.nil?
            error_message = 'Wrong configuration. Cannot find a NIC with RDP'
            return { :error => error(400, error_message) }
        end

        {
            'hostname' => 'localhost',
            'port' => '3389',
            'username' => nil,
            'password' => nil
        }.merge(
            {
                'hostname' =>  hostname,
                'port' =>  vm_resource['TEMPLATE/CONTEXT/RDP_PORT'],
                'username' =>  vm_resource['TEMPLATE/CONTEXT/USERNAME'],
                'password' => vm_resource['TEMPLATE/CONTEXT/PASSWORD']
            }
        )
    end

    def get_config_ssh(vm_resource)
        hostname = vm_resource["TEMPLATE/NIC[SSH='YES'][1]/IP"] ||
                   vm_resource["TEMPLATE/NIC_ALIAS[SSH='YES'][1]/IP"]

        if hostname.nil?
            error_message = 'Wrong configuration. Cannot find a NIC with SSH'
            return { :error => error(400, error_message) }
        end

        {
            'hostname' => 'localhost',
            'port' =>  '22',
            'username' =>  nil,
            'password' =>  nil
        }.merge(
            {
                'hostname' =>  hostname,
                'port' =>  vm_resource['TEMPLATE/CONTEXT/SSH_PORT'],
                'username' =>  vm_resource['TEMPLATE/CONTEXT/USERNAME'],
                'password' =>  vm_resource['TEMPLATE/CONTEXT/PASSWORD']
            }
        )
    end

    def encrypt_data(data)
        iv = OpenSSL::Random.random_bytes(16)

        key = File.read(FIREEDGE_KEY)

        cipher = OpenSSL::Cipher.new('aes-256-cbc')
        cipher.encrypt
        cipher.key = key
        cipher.iv = iv

        crypted = cipher.update(data.to_json)
        crypted << cipher.final
        token = {
            'iv' => Base64.encode64(iv).strip,
            'value' => Base64.strict_encode64(crypted).strip
        }

        Base64.strict_encode64(token.to_json).encode('utf-8').strip
    end

end
