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


require 'opennebula/pool'

module OpenNebula
    class VirtualMachinePool < Pool
        #######################################################################
        # Constants and Class attribute accessors
        #######################################################################

        VM_POOL_METHODS = {
            :info               => 'vmpool.info',
            :info_extended      => 'vmpool.infoextended',
            :info_set           => 'vmpool.infoset',
            :monitoring         => 'vmpool.monitoring',
            :accounting         => 'vmpool.accounting',
            :showback           => 'vmpool.showback',
            :calculate_showback => 'vmpool.calculateshowback'
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

        # Get info extended VM
        def get_hash_extended
            rc = info_search(:extended => true)
            return rc if OpenNebula.is_error?(rc)
            to_hash
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
        alias_method :info!, :info

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

        # Define info methods shortcuts for different filters
        # info_all()
        # info_all!()
        # info_all_extended
        # info_all_extended!()
        # info_mine()
        # info_mine!()
        # info_mine_extended
        # info_mine_extended!()
        # info_group()
        # info_group!()
        # info_group_extended
        # info_group_extended!()
        # info_primary_group()
        # info_primary_group!()
        # info_primary_group_extended
        # info_primary_group_extended!()
        %w[mine all group primary_group].each do |ifilter|
            const_name = "OpenNebula::Pool::INFO_#{ifilter.upcase}"

            define_method("info_#{ifilter}") do
                info_filter(VM_POOL_METHODS[:info],
                            Object.const_get(const_name), -1, -1,INFO_NOT_DONE)
            end

            define_method("info_#{ifilter}_extended") do
                info_filter(VM_POOL_METHODS[:info_extended],
                            Object.const_get(const_name), -1, -1,
                            INFO_NOT_DONE)
            end

            alias_method "info_#{ifilter}!".to_sym, "info_#{ifilter}".to_sym
            alias_method "info_#{ifilter}_extended!".to_sym, "info_#{ifilter}_extended".to_sym
        end

        def info_search(args = {})
            default_args = {
                :who      => INFO_ALL,
                :start_id => -1,
                :end_id   => -1,
                :state    => INFO_NOT_DONE,
                :query    => "",
                :extended => false
            }.merge!(args)

            if args[:extended]
                method = VM_POOL_METHODS[:info_extended]
            else
                method = VM_POOL_METHODS[:info]
            end

            info_filter(method,
                        default_args[:who],
                        default_args[:start_id],
                        default_args[:end_id],
                        default_args[:state],
                        default_args[:query])
        end

        # Retrieves the set of VMs especified in vm_ids
        #
        # @param [String] comma separated list of vm ids.
        # @param [Boolean] if true extended body is retrieved.
        #
        def info_set(vm_ids, extended)
            xmlrpc_info(VM_POOL_METHODS[:info_set], vm_ids, extended)
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
        #   vm_pool.monitoring( ['MONITORING/CPU', 'MONITORING/NETTX'] )
        #
        #   {"3"=>
        #     {
        #     "MONITORING/CPU"=>[["1435085098", "47"], ["1435085253", "5"],
        #       ["1435085410", "48"], ["1435085566", "3"], ["1435088136", "2"]],
        #     "MONITORING/NETTX"=>[["1435085098", "0"], ["1435085253", "50"],
        #     ["1435085410", "50"], ["1435085566", "50"], ["1435085723", "50"]]
        #     },
        #    "43" =>
        #     {
        #     "MONITORING/CPU"=>[["1435085098", "47"], ["1435085253", "5"],
        #       ["1435085410", "48"], ["1435085566", "3"], ["1435088136", "2"]],
        #     "MONITORING/NETTX"=>[["1435085098", "0"], ["1435085253", "50"],
        #     ["1435085410", "50"], ["1435085566", "50"], ["1435085723", "50"]]
        #     }
        #   }
        #
        def monitoring(xpaths, filter_flag=INFO_ALL)
            return super(VM_POOL_METHODS[:monitoring], xpaths, filter_flag)
        end

        def monitoring_last(filter_flag=INFO_ALL)
            return super(VM_POOL_METHODS[:monitoring], filter_flag, 0)
        end

        # Retrieves the monitoring data for all the VMs in the pool, in XML
        #
        # @param [Integer] filter_flag Optional filter flag to retrieve all or
        #   part of the Pool. Possible values: INFO_ALL, INFO_GROUP, INFO_MINE.
        # @param [Integer] num Optional Retrieve monitor records in the last num
        #   seconds. 0 just the last record, -1 or nil all records
        # @return [String] VM monitoring data, in XML
        def monitoring_xml(filter_flag=INFO_ALL, num=nil)
            return @client.call(VM_POOL_METHODS[:monitoring], filter_flag) if num.nil?

            @client.call(VM_POOL_METHODS[:monitoring], filter_flag, num.to_i)
        end

        # Processes all the history records, and stores the monthly cost for
        # each VM
        #
        #  @param [Integer] start_month First month (+year) to process. January is 1.
        #  Use -1 to unset
        #  @param [Integer] start_year First year (+month) to process. e.g. 2014.
        #  Use -1 to unset
        #  @param [Integer] end_month Last month (+year) to process. January is 1.
        #  Use -1 to unset
        #  @param [Integer] end_year Last year (+month) to process. e.g. 2014.
        #  Use -1 to unset
        def calculate_showback(start_month, start_year, end_month, end_year)
            start_month ||= -1
            start_year  ||= -1
            end_month   ||= -1
            end_year    ||= -1

            return @client.call(VM_POOL_METHODS[:calculate_showback],
                                start_month, start_year, end_month, end_year)
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

        # Retrieves the showback data for all the VMs in the pool
        #
        # @param [Integer] filter_flag Optional filter flag to retrieve all or
        #   part of the Pool. Possible values: INFO_ALL, INFO_GROUP, INFO_MINE
        #   or user_id
        # @param [Hash] options
        # @option params [Integer] :start_year First month (+year) to take
        #   into account, if no start time is required use -1
        # @option params [Integer] :start_month First year (+month) to take
        #   into account, if no start time is required use -1
        # @option params [Integer] :end_year Last month (+year) to take
        #   into account, if no end time is required use -1
        # @option params [Integer] :end_month Last year (+month) to take
        #   into account, if no end time is required use -1
        # @option params [Integer] :group Group id to filter the results
        # @option params [String] :xpath Xpath expression to filter the results.
        #    For example: SHOWBACK[TOTAL_COST>0]
        # @option params [String] :order_by_1 Xpath expression to group the
        # @option params [String] :order_by_2 Xpath expression to group the
        #   returned hash. This will be the second level of the hash
        #
        # @return [Hash, OpenNebula::Error]
        #   The first level hash uses the :order_by_1 values as keys, and
        #   as value a Hash with the :order_by_2 values and the SHOWBACK_RECORDS
        def showback(filter_flag=INFO_ALL, options={})
            data_hash = Hash.new

            rc = build_showback(filter_flag, options) do |record|
                hash = data_hash

                if options[:order_by_1]
                    id_1 = record[options[:order_by_1]]
                    data_hash[id_1] ||= Hash.new

                    if options[:order_by_2]
                        id_2 = record[options[:order_by_2]]
                        data_hash[id_1][id_2] ||= Hash.new

                        hash = data_hash[id_1][id_2]
                    else
                        hash = data_hash[id_1]
                    end
                end

                hash["SHOWBACK_RECORDS"] ||= Hash.new
                hash["SHOWBACK_RECORDS"]["SHOWBACK"] ||= Array.new
                hash["SHOWBACK_RECORDS"]["SHOWBACK"] << record.to_hash['SHOWBACK']
            end

            return rc if OpenNebula.is_error?(rc)

            data_hash
        end

        # Retrieves the showback data for all the VMs in the pool, in xml
        #
        # @param [Integer] filter_flag Optional filter flag to retrieve all or
        #   part of the Pool. Possible values: INFO_ALL, INFO_GROUP, INFO_MINE
        #   or user_id
        # @param [Hash] options
        # @option params [Integer] :start_year First month (+year) to take
        #   into account, if no start time is required use -1
        # @option params [Integer] :start_month First year (+month) to take
        #   into account, if no start time is required use -1
        # @option params [Integer] :end_year Last month (+year) to take
        #   into account, if no end time is required use -1
        # @option params [Integer] :end_month Last year (+month) to take
        #   into account, if no end time is required use -1
        # @option params [Integer] :group Group id to filter the results
        # @option params [String] :xpath Xpath expression to filter the results.
        #    For example: SHOWBACK[TOTAL_COST>10]
        #
        # @return [String] the xml representing the showback data
        def showback_xml(filter_flag=INFO_ALL, options={})
            xml_str = "<SHOWBACK_RECORDS>\n"

            rc = build_showback(filter_flag, options) do |showback|
                xml_str << showback.to_xml
            end

            return rc if OpenNebula.is_error?(rc)

            xml_str << "\n</SHOWBACK_RECORDS>"
            xml_str
        end

        private

        def build_accounting(filter_flag, options, &block)

            options[:start_time] = -1 if options[:start_time].nil?
            options[:end_time]   = -1 if options[:end_time].nil?

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

        def build_showback(filter_flag, options, &block)
            xml_str = @client.call(VM_POOL_METHODS[:showback],
                        filter_flag,
                        options[:start_month],
                        options[:start_year],
                        options[:end_month],
                        options[:end_year])

            return xml_str if OpenNebula.is_error?(xml_str)

            xmldoc = XMLElement.new
            xmldoc.initialize_xml(xml_str, 'SHOWBACK_RECORDS')

            xpath_array = Array.new
            xpath_array << "SHOWBACK[GID=#{options[:group]}]" if options[:group]
            xpath_array << options[:xpath] if options[:xpath]

            if xpath_array.empty?
                xpath_str = "SHOWBACK"
            else
                xpath_str = xpath_array.join(' | ')
            end

            data_hash = Hash.new

            xmldoc.each(xpath_str) do |showback|
                block.call(showback)
            end

            data_hash
        end

        def info_filter(xml_method, who, start_id, end_id, state, query="")
            return xmlrpc_info(xml_method, who, start_id, end_id, state, query)
        end
    end
end
