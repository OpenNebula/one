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
    class HostPool < Pool
        #######################################################################
        # Constants and Class attribute accessors
        #######################################################################


        HOST_POOL_METHODS = {
            :info       => "hostpool.info",
            :monitoring => "hostpool.monitoring"
        }

        #######################################################################
        # Class constructor & Pool Methods
        #######################################################################


        # +client+ a Client object that represents a XML-RPC connection
        def initialize(client)
            super('HOST_POOL','HOST',client)
        end

        # Factory Method for the Host Pool
        def factory(element_xml)
            OpenNebula::Host.new(element_xml,@client)
        end

        #######################################################################
        # XML-RPC Methods for the Host Pool 
        #######################################################################

        # Retrieves all the Hosts in the pool.
        def info()
            super(HOST_POOL_METHODS[:info])
        end

        # Retrieves the monitoring data for all the Hosts in the pool
        #
        # @param [Array<String>] xpath_expressions Elements to retrieve.
        #
        # @return [Hash<String, <Hash<String, Array<Array<int>>>>>,
        #   OpenNebula::Error] The first level hash uses the Host ID as keys,
        #   and as value a Hash with the requested xpath expressions,
        #   and an Array of 'timestamp, value'.
        #
        # @example
        #   host_pool.monitoring(
        #     ['HOST_SHARE/FREE_CPU',
        #     'HOST_SHARE/RUNNING_VMS',
        #     'TEMPLATE/CUSTOM_PROBE'] )
        #
        #   {"1"=>
        #     {"TEMPLATE/CUSTOM_PROBE"=>[],
        #      "HOST_SHARE/FREE_CPU"=>[["1337609673", "800"]],
        #      "HOST_SHARE/RUNNING_VMS"=>[["1337609673", "3"]]},
        #    "0"=>
        #     {"TEMPLATE/CUSTOM_PROBE"=>[],
        #      "HOST_SHARE/FREE_CPU"=>[["1337609673", "800"]],
        #      "HOST_SHARE/RUNNING_VMS"=>[["1337609673", "3"]]}}
        def monitoring(xpath_expressions)
            return super(HOST_POOL_METHODS[:monitoring],
                'HOST', 'LAST_MON_TIME', xpath_expressions)
        end

        # Retrieves the monitoring data for all the Hosts in the pool, in XML
        #
        # @return [String] VM monitoring data, in XML
        def monitoring_xml()
            return @client.call(HOST_POOL_METHODS[:monitoring])
        end
    end
end
