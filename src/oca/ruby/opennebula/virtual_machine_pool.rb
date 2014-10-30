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


require 'opennebula/pool'

module OpenNebula
    class VirtualMachinePool < Pool
        #######################################################################
        # Constants and Class attribute accessors
        #######################################################################


        VM_POOL_METHODS = {
            :info       => "vmpool.info",
            :monitoring => "vmpool.monitoring",
            :accounting => "vmpool.accounting",
            :showback   => "vmpool.showback"
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

        alias_method :info!, :info
        alias_method :info_all!, :info_all
        alias_method :info_mine!, :info_mine
        alias_method :info_group!, :info_group

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

        # Retrieves the showback data for all the VMs in the pool, in XML
        #
        # @param [Integer] filter_flag Optional filter flag to retrieve all or
        #   part of the Pool. Possible values: INFO_ALL, INFO_GROUP, INFO_MINE
        #   or user_id
        # @param [Hash] options
        # @option params [Integer] :start_time Start date and time to take into account,
        #   if no start_time is required use -1
        # @option params [Integer] :end_time End date and time to take into account,
        #   if no end_time is required use -1
        def showback_xml(filter_flag=INFO_ALL, options={})

            filter_flag ||= INFO_ALL
            options[:start_time] ||= -1
            options[:end_time] ||= -1

            return @client.call(VM_POOL_METHODS[:showback],
                        filter_flag,
                        options[:start_time],
                        options[:end_time])
        end

        # Retrieves the accounting data for all the VMs in the pool
        #
        # @param [Integer] filter_flag Optional filter flag to retrieve all or
        #   part of the Pool. Possible values: INFO_ALL, INFO_GROUP, INFO_MINE
        #   or user_id
        # @param [Hash] options
        # @option params [Integer] :start_time Start date and time to take into account,
        #   if no start_time is required use -1
        # @option params [Integer] :end_time End date and time to take into account,
        #   if no end_time is required use -1
        # @option params [Integer] :host Host id to filter the results
        # @option params [Integer] :group Group id to filter the results
        # @option params [String] :xpath Xpath expression to filter the results.
        #    For example: HISTORY[ETIME>0]
        # @option params [String] :order_by_1 Xpath expression to group the
        # @option params [String] :order_by_2 Xpath expression to group the
        #   returned hash. This will be the second level of the hash
        #
        # @return [Hash, OpenNebula::Error]
        #   The first level hash uses the :order_by_1 values as keys, and
        #   as value a Hash with the :order_by_2 values and the HISTORY_RECORDS
        #
        # @example
        #   {"HISTORY_RECORDS"=>
        #       {"HISTORY"=> [
        #         {"OID"=>"0",
        #          "SEQ"=>"0",
        #          "HOSTNAME"=>"dummy",
        #          ...
        #         },
        #         {"OID"=>"0",
        #          "SEQ"=>"0",
        #          "HOSTNAME"=>"dummy",
        #
        # @example :order_by_1 => VM/UID
        #   {"0"=>
        #       {"HISTORY_RECORDS"=>
        #          {"HISTORY"=> [
        #            {"OID"=>"0",
        #             "SEQ"=>"0",
        #             "HOSTNAME"=>"dummy",
        #             ...
        #            },
        #            {"OID"=>"0",
        #             "SEQ"=>"0",
        #             "HOSTNAME"=>"dummy",
        #
        # @example :order_by_1 => VM/UID, :order_by_2 => VM/ID
        #   {"0"=>
        #       {"0"=>
        #           {"HISTORY_RECORDS"=>
        #               {"HISTORY"=> [
        #                 {"OID"=>"0",
        #                  "SEQ"=>"0",
        #                  "HOSTNAME"=>"dummy",
        #                  ...
        #                 },
        #                 {"OID"=>"0",
        #                  "SEQ"=>"0",
        #                  "HOSTNAME"=>"dummy",
        #
        def accounting(filter_flag=INFO_ALL, options={})
            acct_hash = Hash.new

            rc = build_accounting(filter_flag, options) do |history|
                hash = acct_hash

                if options[:order_by_1]
                    id_1 = history[options[:order_by_1]]
                    acct_hash[id_1] ||= Hash.new

                    if options[:order_by_2]
                        id_2 = history[options[:order_by_2]]
                        acct_hash[id_1][id_2] ||= Hash.new

                        hash = acct_hash[id_1][id_2]
                    else
                        hash = acct_hash[id_1]
                    end
                end

                hash["HISTORY_RECORDS"] ||= Hash.new
                hash["HISTORY_RECORDS"]["HISTORY"] ||= Array.new
                hash["HISTORY_RECORDS"]["HISTORY"] << history.to_hash['HISTORY']
            end

            return rc if OpenNebula.is_error?(rc)

            acct_hash
        end

        # Retrieves the accounting data for all the VMs in the pool in xml
        #
        # @param [Integer] filter_flag Optional filter flag to retrieve all or
        #   part of the Pool. Possible values: INFO_ALL, INFO_GROUP, INFO_MINE
        #   or user_id
        # @param [Hash] options
        # @option params [Integer] :start_time Start date and time to take into account,
        #   if no start_time is required use -1
        # @option params [Integer] :end_time End date and time to take into account,
        #   if no end_time is required use -1
        # @option params [Integer] :host Host id to filter the results
        # @option params [Integer] :group Group id to filter the results
        # @option params [String] :xpath Xpath expression to filter the results.
        #    For example: HISTORY[ETIME>0]
        #
        # @return [String] the xml representing the accounting data
        def accounting_xml(filter_flag=INFO_ALL, options={})
            acct_hash = Hash.new
            xml_str = "<HISTORY_RECORDS>\n"

            rc = build_accounting(filter_flag, options) do |history|
                xml_str << history.to_xml
            end

            return rc if OpenNebula.is_error?(rc)

            xml_str << "\n</HISTORY_RECORDS>"
            xml_str
        end

        private

        def build_accounting(filter_flag, options, &block)
            xml_str = @client.call(VM_POOL_METHODS[:accounting],
                        filter_flag,
                        options[:start_time],
                        options[:end_time])

            return xml_str if OpenNebula.is_error?(xml_str)

            xmldoc = XMLElement.new
            xmldoc.initialize_xml(xml_str, 'HISTORY_RECORDS')

            xpath_array = Array.new
            xpath_array << "HISTORY[HID=#{options[:host]}]" if options[:host]
            xpath_array << "HISTORY[VM/GID=#{options[:group]}]" if options[:group]
            xpath_array << options[:xpath] if options[:xpath]

            if xpath_array.empty?
                xpath_str = "HISTORY"
            else
                xpath_str = xpath_array.join(' | ')
            end

            acct_hash = Hash.new

            xmldoc.each(xpath_str) do |history|
                block.call(history)
            end

            acct_hash
        end

        def info_filter(xml_method, who, start_id, end_id, state)
            return xmlrpc_info(xml_method, who, start_id, end_id, state)
        end
    end
end
