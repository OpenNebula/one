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

#
# This class provides support for launching and stopping a websockify proxy
#

require 'rubygems'
require 'json'
require 'opennebula'
require 'base64'
require 'openssl'
require 'sunstone_remotes'

if !ONE_LOCATION
    VAR_LOCATION ||= '/var/lib/one/'
else
    VAR_LOCATION ||= ONE_LOCATION + '/var/'
end

ONE_KEY = VAR_LOCATION + '/.one/one_key'
FIREEDGE_KEY = VAR_LOCATION + '/.one/fireedge_key'

# Class for Guacamole connection configuration
class SunstoneGuac < SunstoneRemoteConnections

    attr_reader :proxy_port

    def initialize(logger, options = {})
        super
    end

    def proxy(vm_resource, type_connection = 'vnc', client = nil)
        # Check configurations and VM attributes
        if !allowed_console_states.include?(vm_resource['LCM_STATE'])
            error_message = "Wrong state (#{vm_resource['LCM_STATE']})
             to open a Guacamole session"
            return error(400, error_message)
        end

        unless ['vnc', 'rdp', 'ssh'].include?(type_connection.downcase)
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
        when 'ssh' then settings = get_config_ssh(vm_resource, client)
        else {
            :error => error(400, 'Type connection not supported by Guacamole')
        }
        end

        return settings[:error] if settings.key?(:error)

        if !File.exist?(FIREEDGE_KEY)
            return error(400, 'Fireedge_key is not available')
        end

        info = SunstoneVMHelper.get_remote_info(vm_resource)
        encode_info = Base64.encode64(info.to_json)

        data = encrypt_data(
            {
                'connection' => {
                    'type' =>  type_connection.downcase,
                    'settings' =>  {
                        'security' =>  'any',
                        'ignore-cert' =>  'true',
                        'enable-drive' =>  'true',
                        # 'enable-audio' =>  'true',
                        'create-drive-path' =>  'true'
                    }.merge!(settings)
                }
            }
        )

        [200, { :token => data, :info => encode_info }.to_json]
    end

    private

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
            hostname =
                vm_resource['/VM/HISTORY_RECORDS/HISTORY[last()]/HOSTNAME']
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
        hostname =
            vm_resource["TEMPLATE/NIC[RDP='YES'][1]/EXTERNAL_IP"] ||
            vm_resource["TEMPLATE/NIC[RDP='YES'][1]/IP"] ||
            vm_resource["TEMPLATE/NIC_ALIAS[RDP='YES'][1]/EXTERNAL_IP"] ||
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

    def get_config_ssh(vm_resource, client)
        hostname =
            vm_resource["TEMPLATE/NIC[SSH='YES'][1]/EXTERNAL_IP"] ||
            vm_resource["TEMPLATE/NIC[SSH='YES'][1]/IP"] ||
            vm_resource["TEMPLATE/NIC_ALIAS[SSH='YES'][1]/EXTERNAL_IP"] ||
            vm_resource["TEMPLATE/NIC_ALIAS[SSH='YES'][1]/IP"]

        external_port_range = vm_resource['TEMPLATE/
                                           NIC[EXTERNAL_PORT_RANGE][1]/
                                           EXTERNAL_PORT_RANGE']

        if external_port_range
            ip = vm_resource['HISTORY_RECORDS/
                              HISTORY[HOSTNAME][last()]/
                              HOSTNAME']

            unless ip.nil?
                hostname = ip
                port = Integer(external_port_range.split(':')[0]) + 21
            end
        end

        if hostname.nil?
            error_message = 'Wrong configuration. Cannot find a NIC with SSH'
            return { :error => error(400, error_message) }
        end

        hash = {
            'hostname' =>  hostname,
            'port' =>  port || vm_resource['TEMPLATE/CONTEXT/SSH_PORT']
        }

        if vm_resource['TEMPLATE/CONTEXT/USERNAME']
            hash['username'] = vm_resource['TEMPLATE/CONTEXT/USERNAME']
        end

        if vm_resource['TEMPLATE/CONTEXT/PASSWORD']
            password = vm_resource['TEMPLATE/CONTEXT/PASSWORD']
            hash['password'] = decrypt_by_one_key(password)
        end

        if vm_resource['TEMPLATE/CONTEXT/SSH_PUBLIC_KEY']
            user = User.new_with_id(OpenNebula::User::SELF, client)
            rc   = user.info

            if OpenNebula.is_error?(rc)
                error_message = "VMID:#{vmid} user.info error: #{rc.message}"
                return { :error => error(400, error_message) }
            end

            private_key = user['TEMPLATE/SSH_PRIVATE_KEY']
            if !private_key.nil?
                hash['private-key'] = private_key
            end

            passphrase = user['TEMPLATE/SSH_PASSPHRASE']
            if !passphrase.nil?
                hash['passphrase'] = passphrase
            end

        end

        {
            'hostname' => 'localhost',
            'port' =>  '22'
        }.merge(hash)
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

    def decrypt_by_one_key(password)
        # rubocop:disable Style/GlobalVars
        system = OpenNebula::System.new($cloud_auth.client)
        # rubocop:enable Style/GlobalVars
        config = system.get_configuration
        need_decrypt = config['VM_ENCRYPTED_ATTR'].include? 'CONTEXT/PASSWORD'

        return password unless need_decrypt

        key = File.read(ONE_KEY)
        key = key.strip.delete("\n")

        cipher = OpenSSL::Cipher.new('aes-256-cbc')
        cipher.decrypt

        # truncate token to 32-bytes for Ruby >= 2.4
        cipher.key = key[0..31]

        rc =  cipher.update(Base64.decode64(password))
        rc << cipher.final
    rescue StandardError
        password
    end

end
