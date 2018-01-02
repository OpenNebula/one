# -------------------------------------------------------------------------- #
# Copyright 2002-2018, OpenNebula Project, OpenNebula Systems                #
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

require 'shellwords'

################################################################################
# The VNMMAD module provides the basic abstraction to implement custom
# virtual network drivers. The VNMAD module includes:
#   - VNMNetwork with base classes and main functionality to manage Virtual Nets
#   - SGIPTables a module with a SG implementation based in iptables/ipset
################################################################################
module VNMMAD

    ############################################################################
    # Base driver class to implement a Network driver. It relays on two filter
    # drivers FirewallDriver and SGDriver.
    ############################################################################
    class VNMDriver
        attr_reader :vm

        # Creates new driver using:
        #   @param vm_tpl [String] XML String from oned
        #   @param xpath_filter [String] to get relevant NICs for the driver
        #   @param deploy_id [String]
        def initialize(vm_tpl, xpath_filter, deploy_id = nil)
            @locking ||= false

            @vm = VNMNetwork::VM.new(REXML::Document.new(vm_tpl).root,
                                        xpath_filter, deploy_id)
        end

        # Creates a new VNMDriver using:
        #   @param vm_64 [String] Base64 encoded XML String from oned
        #   @param deploy_id [String]
        def self.from_base64(vm_64, xpath_filter = nil, deploy_id = nil)
            vm_xml = Base64::decode64(vm_64)

            self.new(vm_xml, xpath_filter, deploy_id)
        end

        # Locking function to serialized driver operations if needed. Similar
        # to flock. File is created as /tmp/onevnm-<driver>-lock
        def lock
            if @locking
                driver_name = self.class.name.downcase
                @locking_file = File.open("/tmp/onevnm-#{driver_name}-lock","w")
                @locking_file.flock(File::LOCK_EX)
            end
        end

        # Unlock driver execution mutex
        def unlock
            if @locking
               @locking_file.close
            end
        end

        # Executes the given block on each NIC
        def process(&block)
            blk = lambda do |nic|
                add_nic_conf(nic)
                add_bridge_conf(nic)
                add_ip_link_conf(nic)

                block.call(nic)
            end

            @vm.each_nic(blk)
        end

        # Parse network configuration and add it to the nic
        def add_nic_conf(nic)
            default_conf = CONF || {}
            nic_conf = {}

            if nic[:conf]
                parse_options(nic[:conf]).each do |option, value|
                    case value.downcase
                    when 'true', 'yes'
                        value = true
                    when 'false', 'no'
                        value = false
                    end

                    nic_conf[option.to_sym] = value
                end
            end

            nic[:conf] = default_conf.merge(nic_conf)
        end

        def add_bridge_conf(nic)
            add_command_conf(nic, :bridge_conf)
        end

        def add_ip_link_conf(nic)
            add_command_conf(nic, :ip_link_conf)
        end

        def add_command_conf(nic, conf_name)
            default_conf = CONF[conf_name] || {}
            nic_conf = {}

            # sanitize
            default_conf.each do |key, value|
                option  = Shellwords.escape(key.to_s.strip.downcase)
                if value.class == String
                    value   = Shellwords.escape(value.strip)
                end

                nic_conf[option] = value
            end

            if nic[conf_name]
                parse_options(nic[conf_name]).each do |option, value|
                    if value == '__delete__'
                        nic_conf.delete(option.strip.downcase)
                    else
                        option  = Shellwords.escape(option.strip.downcase)
                        if value == ''
                            value = nil
                        else
                            value = Shellwords.escape(value)
                        end

                        nic_conf[option] = value
                    end
                end
            end

            nic[conf_name] = nic_conf
        end

        # Returns a filter object based on the contents of the template
        #
        # @return SGDriver object
        def self.filter_driver(vm_64, xpath_filter, deploy_id)
            SGDriver.new(vm_64, xpath_filter, deploy_id)
        end

        # Returns the associated command including sudo and other configuration
        # attributes
        def command(cmd)
            if VNMNetwork::COMMANDS.keys.include?(cmd.to_sym)
                cmd_str = "#{VNMNetwork::COMMANDS[cmd.to_sym]}"
            else
                cmd_str = "#{cmd}"
            end

            return cmd_str
        end

        def parse_options(string)
            self.class.parse_options(string)
        end

        def self.parse_options(string)
            options = {}
            return options if !string

            string.split(',').each do |op|
                m = op.match(/^\s*(?<option>[^=]+)\s*=\s*(?<value>.*?)\s*$/)

                options[m['option']] = m['value'] if m
            end

            options
        end
    end
end
