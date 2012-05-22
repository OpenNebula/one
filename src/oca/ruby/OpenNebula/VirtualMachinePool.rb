# -------------------------------------------------------------------------- #
# Copyright 2002-2012, OpenNebula Project Leads (OpenNebula.org)             #
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


require 'OpenNebula/Pool'

module OpenNebula
    class VirtualMachinePool < Pool
        #######################################################################
        # Constants and Class attribute accessors
        #######################################################################


        VM_POOL_METHODS = {
            :info       => "vmpool.info",
            :monitoring => "vmpool.monitoring"
        }

        # Constants for info queries (include/RequestManagerPoolInfoFilter.h)
        INFO_NOT_DONE = -1
        INFO_ALL_VM   = -2

        #######################################################################
        # Class constructor & Pool Methods
        #######################################################################


        # +client+ a Client object that represents a XML-RPC connection
        # +user_id+ is to refer to a Pool with VirtualMachines from that user
        def initialize(client, user_id=0)
            super('VM_POOL','VM',client)

            @user_id  = user_id
        end

        # Default Factory Method for the Pools
        def factory(element_xml)
            OpenNebula::VirtualMachine.new(element_xml,@client)
        end

        #######################################################################
        # XML-RPC Methods for the Virtual Network Object
        #######################################################################

        # Retrieves all or part of the VirtualMachines in the pool.
        # No arguments, returns the not-in-done VMs for the user 
        # [user_id, start_id, end_id]
        # [user_id, start_id, end_id, state]
        def info(*args)
            case args.size
                when 0
                    info_filter(VM_POOL_METHODS[:info],
                                @user_id,
                                -1,
                                -1,
                                INFO_NOT_DONE)
                when 1
                    info_filter(VM_POOL_METHODS[:info],
                                args[0],
                                -1,
                                -1,
                                INFO_NOT_DONE)
                when 3
                    info_filter(VM_POOL_METHODS[:info],
                                args[0],
                                args[1],
                                args[2],
                                INFO_NOT_DONE)
                when 4
                    info_filter(VM_POOL_METHODS[:info],
                                args[0],
                                args[1],
                                args[2],
                                args[3])
            end
        end

        def info_all()
            return info_filter(VM_POOL_METHODS[:info],
                               INFO_ALL,
                               -1,
                               -1,
                               INFO_NOT_DONE)
        end

        def info_mine()
            return info_filter(VM_POOL_METHODS[:info],
                               INFO_MINE,
                               -1,
                               -1,
                               INFO_NOT_DONE)
        end

        def info_group()
            return info_filter(VM_POOL_METHODS[:info],
                               INFO_GROUP,
                               -1,
                               -1,
                               INFO_NOT_DONE)
        end

        # Retrieves the monitoring data for all the VMs in the pool
        #
        # @param [Array<String>] xpath_expressions Elements to retrieve.
        # @param [Integer] filter_flag Optional filter flag to retrieve all or
        #   part of the Pool. Possible values: INFO_ALL, INFO_GROUP, INFO_MINE.
        #
        # @return [Hash<String, <Hash<String, Array<Array<int>>>>>,
        #   OpenNebula::Error] The first level hash uses the VM ID as keys, and
        #   as value a Hash with the requested xpath expressions,
        #   and an Array of 'timestamp, value'.
        #
        # @example
        #   vm_pool.monitoring( ['CPU', 'NET_TX', 'TEMPLATE/CUSTOM_PROBE'] )
        #
        #   {"1"=>
        #    {"CPU"=>
        #      [["1337608271", "0"], ["1337608301", "0"], ["1337608331", "0"]],
        #     "NET_TX"=>
        #      [["1337608271", "510"], ["1337608301", "510"], ["1337608331", "520"]],
        #     "TEMPLATE/CUSTOM_PROBE"=>
        #      []},
        #  
        #   "0"=>
        #    {"CPU"=>
        #      [["1337608271", "0"], ["1337608301", "0"], ["1337608331", "0"]],
        #     "NET_TX"=>
        #      [["1337608271", "510"], ["1337608301", "510"], ["1337608331", "520"]],
        #     "TEMPLATE/CUSTOM_PROBE"=>
        #      []}}
        def monitoring(xpath_expressions, filter_flag=INFO_ALL)
            return super(VM_POOL_METHODS[:monitoring],
                'VM', 'LAST_POLL', xpath_expressions, filter_flag)
        end

        # Retrieves the monitoring data for all the VMs in the pool, in XML
        #
        # @param [Integer] filter_flag Optional filter flag to retrieve all or
        #   part of the Pool. Possible values: INFO_ALL, INFO_GROUP, INFO_MINE.
        #
        # @return [String] VM monitoring data, in XML
        def monitoring_xml(filter_flag=INFO_ALL)
            return @client.call(VM_POOL_METHODS[:monitoring], filter_flag)
        end

        private

        def info_filter(xml_method, who, start_id, end_id, state)
            return xmlrpc_info(xml_method, who, start_id, end_id, state)
        end
    end
end
