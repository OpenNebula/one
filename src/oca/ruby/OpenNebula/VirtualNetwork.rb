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
    class VirtualNetwork < PoolElement
        #######################################################################
        # Constants and Class Methods
        #######################################################################


        VN_METHODS = {
            :info       => "vn.info",
            :allocate   => "vn.allocate",
            :publish    => "vn.publish",
            :delete     => "vn.delete",
            :addleases  => "vn.addleases",
            :rmleases   => "vn.rmleases",
            :chown      => "vn.chown",
            :chmod      => "vn.chmod",
            :update     => "vn.update",
            :hold       => "vn.hold",
            :release    => "vn.release"
        }

        VN_TYPES=%w{RANGED FIXED}

        SHORT_VN_TYPES={
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
        # @param description [String] The template of the VirtualNetwork.
        # @param cluster_id [Integer] Id of the cluster
        #
        # @return [Integer, OpenNebula::Error] the new ID in case of
        #   success, error otherwise
        def allocate(description,cluster_id=ClusterPool::NONE_CLUSTER_ID)
            super(VN_METHODS[:allocate], description, cluster_id)
        end

        # Replaces the template contents
        #
        # +new_template+ New template contents
        def update(new_template=nil)
            super(VN_METHODS[:update], new_template)
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

        # Holds a virtual network Lease as used
        # @param ip [String] IP to hold
        def hold(ip)
            return Error.new('ID not defined') if !@pe_id

            lease_template = "LEASES = [ IP = #{ip} ]"

            rc = @client.call(VN_METHODS[:hold], @pe_id, lease_template)
            rc = nil if !OpenNebula.is_error?(rc)

            return rc
        end

        # Releases a virtual network Lease on hold
        # @param ip [String] IP to release
        def release(ip)
            return Error.new('ID not defined') if !@pe_id

            lease_template = "LEASES = [ IP = #{ip} ]"

            rc = @client.call(VN_METHODS[:release], @pe_id, lease_template)
            rc = nil if !OpenNebula.is_error?(rc)

            return rc
        end

        # Changes the owner/group
        #
        # @param uid [Integer] the new owner id. Set to -1 to leave the current one
        # @param gid [Integer] the new group id. Set to -1 to leave the current one
        #
        # @return [nil, OpenNebula::Error] nil in case of success, Error
        #   otherwise
        def chown(uid, gid)
            super(VN_METHODS[:chown], uid, gid)
        end

        # Changes the virtual network permissions.
        #
        # @param octet [String] Permissions octed , e.g. 640
        # @return [nil, OpenNebula::Error] nil in case of success, Error
        #   otherwise
        def chmod_octet(octet)
            super(VN_METHODS[:chmod], octet)
        end

        # Changes the virtual network permissions.
        # Each [Integer] argument must be 1 to allow, 0 deny, -1 do not change
        #
        # @return [nil, OpenNebula::Error] nil in case of success, Error
        #   otherwise
        def chmod(owner_u, owner_m, owner_a, group_u, group_m, group_a, other_u,
                other_m, other_a)
            super(VN_METHODS[:chmod], owner_u, owner_m, owner_a, group_u,
                group_m, group_a, other_u, other_m, other_a)
        end

        #######################################################################
        # Helpers to get VirtualNetwork information
        #######################################################################

        # Returns the group identifier
        # [return] _Integer_ the element's group ID
        def gid
            self['GID'].to_i
        end

        # Returns the type of the Virtual Network (numeric value)
        def type
            self['TYPE'].to_i
        end

        # Returns the type of the Virtual Network (string value)
        def type_str
            VN_TYPES[type]
        end

        # Returns the state of the Virtual Network (string value)
        def short_type_str
            SHORT_VN_TYPES[type_str]
        end

        def public?
            if self['PERMISSIONS/GROUP_U'] == "1" || self['PERMISSIONS/OTHER_U'] == "1"
                true
            else
                false
            end
        end

    private
        def set_publish(published)
            group_u = published ? 1 : 0

            chmod(-1, -1, -1, group_u, -1, -1, -1, -1, -1)
        end

    end
end
