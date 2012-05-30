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
    class Host < PoolElement
        #######################################################################
        # Constants and Class Methods
        #######################################################################


        HOST_METHODS = {
            :info       => "host.info",
            :allocate   => "host.allocate",
            :delete     => "host.delete",
            :enable     => "host.enable",
            :update     => "host.update",
            :monitoring => "host.monitoring"
        }

        HOST_STATES=%w{INIT MONITORING_MONITORED MONITORED ERROR DISABLED MONITORING_ERROR}

        SHORT_HOST_STATES={
            "INIT"                 => "init",
            "MONITORING_MONITORED" => "update",          
            "MONITORED"            => "on",
            "ERROR"                => "err",
            "DISABLED"             => "off",
            "MONITORING_ERROR"     => "retry", 
        }

        # Creates a Host description with just its identifier
        # this method should be used to create plain Host objects.
        # +id+ the id of the host
        #
        # Example:
        #   host = Host.new(Host.build_xml(3),rpc_client)
        #
        def Host.build_xml(pe_id=nil)
            if pe_id
                host_xml = "<HOST><ID>#{pe_id}</ID></HOST>"
            else
                host_xml = "<HOST></HOST>"
            end

            XMLElement.build_xml(host_xml, 'HOST')
        end

        # Class constructor
        def initialize(xml, client)
            super(xml,client)

            @client = client
            @pe_id  = self['ID'].to_i if self['ID']
        end

        #######################################################################
        # XML-RPC Methods for the Host
        #######################################################################
        
        # Retrieves the information of the given Host.
        def info()
            super(HOST_METHODS[:info], 'HOST')
        end

        # Allocates a new Host in OpenNebula
        #
        # @param hostname [String] Name of the new Host.
        # @param im [String] Name of the im_driver (information/monitoring)
        # @param vmm [String] Name of the vmm_driver (hypervisor)
        # @param tm [String] Name of the vnm_driver (networking)
        # @param cluster_id [String] Id of the cluster
        #
        # @return [Integer, OpenNebula::Error] the new ID in case of
        #   success, error otherwise
        def allocate(hostname,im,vmm,vnm,cluster_id=ClusterPool::NONE_CLUSTER_ID)
            super(HOST_METHODS[:allocate],hostname,im,vmm,vnm,cluster_id)
        end

        # Deletes the Host
        def delete()
            super(HOST_METHODS[:delete])
        end

        # Enables the Host
        def enable()
            set_enabled(true)
        end

        # Disables the Host
        def disable()
            set_enabled(false)
        end

        # Replaces the template contents
        #
        # +new_template+ New template contents
        def update(new_template)
            super(HOST_METHODS[:update], new_template)
        end

        # Retrieves this Host's monitoring data from OpenNebula
        #
        # @param [Array<String>] xpath_expressions Elements to retrieve.
        #
        # @return [Hash<String, Array<Array<int>>>, OpenNebula::Error] Hash with
        #   the requested xpath expressions, and an Array of 'timestamp, value'.
        #
        # @example
        #   host.monitoring( ['HOST_SHARE/FREE_CPU', 'HOST_SHARE/RUNNING_VMS'] )
        #
        #   { "HOST_SHARE/RUNNING_VMS" =>
        #       [["1337266000", "1"], 
        #        ["1337266044", "1"], 
        #        ["1337266088", "3"]],
        #     "HOST_SHARE/FREE_CPU" =>
        #       [["1337266000", "800"], 
        #        ["1337266044", "800"], 
        #        ["1337266088", "800"]]
        #   }
        def monitoring(xpath_expressions)
            return super(HOST_METHODS[:monitoring], 'HOST',
                'LAST_MON_TIME', xpath_expressions)
        end

        # Retrieves this Host's monitoring data from OpenNebula, in XML
        #
        # @return [String] Monitoring data, in XML
        def monitoring_xml()
            return Error.new('ID not defined') if !@pe_id

            return @client.call(HOST_METHODS[:monitoring], @pe_id)
        end

        #######################################################################
        # Helpers to get Host information
        #######################################################################

        # Returns the state of the Host (numeric value)
        def state
            self['STATE'].to_i
        end

        # Returns the state of the Host (string value)
        def state_str
            HOST_STATES[state]
        end

        # Returns the state of the Host (string value)
        def short_state_str
            SHORT_HOST_STATES[state_str]
        end

    private
        def set_enabled(enabled)
            return Error.new('ID not defined') if !@pe_id

            rc = @client.call(HOST_METHODS[:enable], @pe_id, enabled)
            rc = nil if !OpenNebula.is_error?(rc)

            return rc
        end
    end
end
