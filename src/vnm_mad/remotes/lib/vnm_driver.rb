# -------------------------------------------------------------------------- #
# Copyright 2002-2014, OpenNebula Project (OpenNebula.org), C12G Labs        #
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
        attr_reader :hypervisor, :vm

        # Creates new driver using:
        #   @param vm_tpl [String] XML String from oned
        #   @param xpath_filter [String] to get relevant NICs for the driver
        #   @param deploy_id [String]
        #   @param hypervisor [String]
        def initialize(vm_tpl, xpath_filter, deploy_id = nil, hypervisor = nil)
            @locking ||= false

            if !hypervisor
                @hypervisor = detect_hypervisor
            else
                @hypervisor = hypervisor
            end

            @vm = VNMNetwork::VM.new(REXML::Document.new(vm_tpl).root, 
                xpath_filter, deploy_id, @hypervisor)
        end

        # Creates a new VNDriver using:
        #   @param vm_64 [String] Base64 encoded XML String from oned
        #   @param deploy_id [String]
        #   @param hypervisor [String]
        def self.from_base64(vm_64, deploy_id = nil, hypervisor = nil)
            vm_xml =  Base64::decode64(vm_64)
            self.new(vm_xml, deploy_id, hypervisor)
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
            @vm.each_nic(block)
        end

        # Return a string for the hypervisor
        #   @return [String] "kvm", "xen" or nil
        def detect_hypervisor
            lsmod       = `#{VNMNetwork::COMMANDS[:lsmod]}`
            xen_file    = "/proc/xen/capabilities"

            if File.exists?(xen_file)
                "xen"
            elsif lsmod.match(/kvm/)
                "kvm"
            else
                nil
            end
        end
        
        # Returns true if the template contains the deprecated firewall attributes:
        # - ICMP
        # - WHITE_PORTS_TCP
        # - WHITE_PORTS_UDP
        # - BLACK_PORTS_TCP
        # - BLACK_PORTS_UDP
        #
        # @return Boolean
        def self.has_fw_attrs?(vm_xml)
            vm_root = REXML::Document.new(vm_xml).root
            !vm_root.elements[FWDriver::XPATH_FILTER].nil?
        end

        # Returns a filter object based on the contents of the template
        #
        # @return FWDriver or SGDriver object
        def self.filter_driver(vm_64, deploy_id = nil, hypervisor = nil)
            vm_xml =  Base64::decode64(vm_64)

            if self.has_fw_attrs?(vm_xml)
                FWDriver.new(vm_xml, deploy_id, hypervisor)
            else
                SGDriver.new(vm_xml, deploy_id, hypervisor)
            end
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
    end
end
