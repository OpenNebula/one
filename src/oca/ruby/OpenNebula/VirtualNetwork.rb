# -------------------------------------------------------------------------- #
# Copyright 2002-2011, OpenNebula Project Leads (OpenNebula.org)             #
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
    class VirtualNetwork < PoolElement
        # ---------------------------------------------------------------------
        # Constants and Class Methods
        # ---------------------------------------------------------------------
        VN_METHODS = {
            :info       => "vn.info",
            :allocate   => "vn.allocate",
            :publish    => "vn.publish",
            :delete     => "vn.delete",
            :addleases  => "vn.addleases",
            :rmleases   => "vn.rmleases"
        }

        NETWORK_TYPES=%w{RANGED FIXED}

        SHORT_NETWORK_TYPES={
            "RANGED" => "R",
            "FIXED"  => "F"
        }

        # Creates a VirtualNetwork description with just its identifier
        # this method should be used to create plain VirtualNetwork objects.
        # +id+ the id of the network
        #
        # Example:
        #   vnet = VirtualNetwork.new(VirtualNetwork.build_xml(3),rpc_client)
        #
        def VirtualNetwork.build_xml(pe_id=nil)
            if pe_id
                vn_xml = "<VNET><ID>#{pe_id}</ID></VNET>"
            else
                vn_xml = "<VNET></VNET>"
            end

            XMLElement.build_xml(vn_xml, 'VNET')
        end

        # Class constructor
        def initialize(xml, client)
            super(xml,client)

            @client = client
        end

        #######################################################################
        # XML-RPC Methods for the Virtual Network Object
        #######################################################################

        # Retrieves the information of the given VirtualNetwork.
        def info()
            super(VN_METHODS[:info], 'VNET')
        end

        # Allocates a new VirtualNetwork in OpenNebula
        #
        # +description+ A string containing the template of the VirtualNetwork.
        def allocate(description)
            super(VN_METHODS[:allocate],description)
        end
        
        # Publishes the VirtualNetwork, to be used by other users
        def publish
            set_publish(true)
        end

        # Unplubishes the VirtualNetwork
        def unpublish
            set_publish(false)
        end

        # Deletes the VirtualNetwork
        def delete()
            super(VN_METHODS[:delete])
        end

        # Adds a lease to the VirtualNetwork
        def addleases(ip, mac = nil)
            return Error.new('ID not defined') if !@pe_id

            lease_template = "LEASES = [ IP = #{ip}"
            lease_template << ", MAC = #{mac}" if mac
            lease_template << " ]"

            rc = @client.call(VN_METHODS[:addleases], @pe_id, lease_template)
            rc = nil if !OpenNebula.is_error?(rc)

            return rc
        end

        # Removes a lease from the VirtualNetwork
        def rmleases(ip)
            return Error.new('ID not defined') if !@pe_id

            lease_template = "LEASES = [ IP = #{ip} ]"

            rc = @client.call(VN_METHODS[:rmleases], @pe_id, lease_template)
            rc = nil if !OpenNebula.is_error?(rc)

            return rc
        end

        #######################################################################
        # Helpers to get Virtual Network information
        #######################################################################

        # Returns the type of the Virtual Network (numeric value)
        def type
            self['TYPE'].to_i
        end

        # Returns the type of the Virtual Network (string value)
        def type_str
            NETWORK_TYPES[type]
        end

        # Returns the state of the Virtual Network (string value)
        def short_type_str
            SHORT_NETWORK_TYPES[type_str]
        end

    private
        def set_publish(published)
            return Error.new('ID not defined') if !@pe_id

            rc = @client.call(VN_METHODS[:publish], @pe_id, published)
            rc = nil if !OpenNebula.is_error?(rc)

            return rc
        end

    end
end
