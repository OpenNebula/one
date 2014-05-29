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


require 'opennebula/pool_element'

module OpenNebula
    class VirtualNetwork < PoolElement
        #######################################################################
        # Constants and Class Methods
        #######################################################################

        VN_METHODS = {
            :info       => "vn.info",
            :allocate   => "vn.allocate",
            :delete     => "vn.delete",
            :add_ar     => "vn.add_ar",
            :rm_ar      => "vn.rm_ar",
            :update_ar  => "vn.update_ar",
            :chown      => "vn.chown",
            :chmod      => "vn.chmod",
            :update     => "vn.update",
            :hold       => "vn.hold",
            :release    => "vn.release",
            :rename     => "vn.rename",
            :reserve    => "vn.reserve"
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

        alias_method :info!, :info

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
        # @param new_template [String] New template contents
        # @param append [true, false] True to append new attributes instead of
        #   replace the whole template
        #
        # @return [nil, OpenNebula::Error] nil in case of success, Error
        #   otherwise
        def update(new_template=nil, append=false)
            super(VN_METHODS[:update], new_template, append ? 1 : 0)
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

        # Adds Address Ranges to the VirtualNetwork
        def add_ar(ar_template)
            return Error.new('ID not defined') if !@pe_id

            rc = @client.call(VN_METHODS[:add_ar], @pe_id, ar_template)
            rc = nil if !OpenNebula.is_error?(rc)

            return rc
        end

        # Removes an Address Range from the VirtualNetwork
        def rm_ar(ar_id)
            return Error.new('ID not defined') if !@pe_id

            rc = @client.call(VN_METHODS[:rm_ar], @pe_id, ar_id.to_i)
            rc = nil if !OpenNebula.is_error?(rc)

            return rc
        end

        # Updates Address Ranges from the VirtualNetwork
        def update_ar(ar_template)
            return Error.new('ID not defined') if !@pe_id

            rc = @client.call(VN_METHODS[:update_ar], @pe_id, ar_template)
            rc = nil if !OpenNebula.is_error?(rc)

            return rc
        end

        # Holds a virtual network address
        # @param ip [String] address to hold, if contains ":" a MAC address is assumed
        # @param ar_id [Integer] The address range to hold the lease. If not set
        #        the lease will be held from all possible address ranges
        def hold(ip, ar_id=-1)
            return Error.new('ID not defined') if !@pe_id

            if ip.include?':'
                addr_name = "MAC"
            else
                addr_name = "IP"
            end

            lease_template =  "LEASES = [ #{addr_name} = #{ip}"
            lease_template << ", AR_ID = #{ar_id}" if ar_id != -1
            lease_template << "]"

            rc = @client.call(VN_METHODS[:hold], @pe_id, lease_template)
            rc = nil if !OpenNebula.is_error?(rc)

            return rc
        end

        # Releases an address on hold
        # @param ip [String] IP to release, if contains ":" a MAC address is assumed
        # @param ar_id [Integer] The address range to release the lease. If not
        #        set the lease will be freed from all possible address ranges
        def release(ip, ar_id=-1)
            return Error.new('ID not defined') if !@pe_id

            if ip.include?':'
                addr_name = "MAC"
            else
                addr_name = "IP"
            end

            lease_template =  "LEASES = [ #{addr_name} = #{ip}"
            lease_template << ", AR_ID = #{ar_id}" if ar_id != -1
            lease_template << "]"

            rc = @client.call(VN_METHODS[:release], @pe_id, lease_template)
            rc = nil if !OpenNebula.is_error?(rc)

            return rc
        end

        # Reserve a set of addresses from this virtual network
        # @param name [String] of the reservation
        # @param rsize[String] number of addresses to reserve
        # @param ar_id[String] the ar_id to make the reservation. If set to nil
        #        any address range will be used
        # @param addr [String] the first address in the reservation. If set to
        #        nil the first free address will be used
        def reserve(rname, rsize, ar_id, addr)
            return Error.new('ID not defined') if !@pe_id

            rtmpl =  "NAME = #{rname}\n"
            rtmpl << "SIZE = #{rsize}\n"
            rtmpl << "AR_ID= #{ar_id}\n" if !ar_id.nil?

            if !addr.nil?
                if addr.include?':'
                    addr_name = "MAC"
                else
                    addr_name = "IP"
                end

                rtmpl << "#{addr_name} = #{addr}\n"
            end

            rc = @client.call(VN_METHODS[:reserve], @pe_id, rtmpl)
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

        # Renames this virtual network
        #
        # @param name [String] New name for the virtual network.
        #
        # @return [nil, OpenNebula::Error] nil in case of success, Error
        #   otherwise
        def rename(name)
            return call(VN_METHODS[:rename], @pe_id, name)
        end

        #######################################################################
        # Helpers to get VirtualNetwork information
        #######################################################################

        # Returns the group identifier
        # [return] _Integer_ the element's group ID
        def gid
            self['GID'].to_i
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
