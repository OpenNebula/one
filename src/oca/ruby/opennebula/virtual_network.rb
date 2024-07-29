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

require 'opennebula/lockable_ext'
require 'opennebula/pool_element'
require 'ipaddr'

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
            :reserve    => "vn.reserve",
            :free_ar    => "vn.free_ar",
            :lock       => "vn.lock",
            :unlock     => "vn.unlock",
            :recover    => "vn.recover"
        }

        VN_STATES=%w{INIT READY LOCK_CREATE LOCK_DELETE DONE ERROR UPDATE_FAILURE}

        SHORT_VN_STATES={
            "INIT"          => "init",
            "READY"         => "rdy",
            "LOCK_CREATE"   => "lock",
            "LOCK_DELETE"   => "lock",
            "DONE"          => "done",
            "ERROR"         => "err",
            "UPDATE_FAILURE"=> "fail"
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
            LockableExt.make_lockable(self, VN_METHODS)

            super(xml,client)
        end

        #######################################################################
        # XML-RPC Methods for the Virtual Network Object
        #######################################################################

        # Retrieves the information of the given VirtualNetwork.
        def info(decrypt = false)
            super(VN_METHODS[:info], 'VNET', decrypt)
        end

        alias_method :info!, :info

        # Allocates a new VirtualNetwork in OpenNebula
        #
        # @param description [String] The template of the VirtualNetwork.
        # @param cluster_id [Integer] Id of the cluster, -1 to use default
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

        # Simulates old addleases call
        # @deprecated use {#add_ar}
        def addleases(ip, mac=nil)
            self.info

            ar_id = self.retrieve_elements("AR_POOL/AR[IP='#{ip}' and SIZE='1']/AR_ID")

            if !ar_id.nil?
                return Error.new("IP Address Range found with IP #{ip}")
            end

            template = 'AR = [ '
            template << 'TYPE = "IP4"'
            template << ', IP = "' << ip << '"' if ip
            template << ', MAC = "' << mac << '"' if mac
            template << ', SIZE = 1 ]'

            add_ar(template)
        end

        # Removes an Address Range from the VirtualNetwork
        def rm_ar(ar_id, force = false)
            return Error.new('ID not defined') if !@pe_id

            rc = @client.call(VN_METHODS[:rm_ar], @pe_id, ar_id.to_i, force)
            rc = nil if !OpenNebula.is_error?(rc)

            return rc
        end

        # Simulates old rmleases call
        # @deprecated use #{rm_ar}
        def rmleases(ip)
            self.info

            ar_id = self.retrieve_elements("AR_POOL/AR[IP='#{ip}' and SIZE='1']/AR_ID")

            if !ar_id
                Error.new("No single IP Address Range found with IP #{ip}")
            elsif ar_id.size > 1
                Error.new("More than one Address Range found with IP #{ip} use rmar")
            else
                rm_ar(ar_id[0])
            end
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

            addr_name = address_type(ip)

            return addr_name if OpenNebula.is_error?(addr_name)

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

            addr_name = address_type(ip)

            return addr_name if OpenNebula.is_error?(addr_name)

            lease_template =  "LEASES = [ #{addr_name} = #{ip}"
            lease_template << ", AR_ID = #{ar_id}" if ar_id != -1
            lease_template << "]"

            rc = @client.call(VN_METHODS[:release], @pe_id, lease_template)
            rc = nil if !OpenNebula.is_error?(rc)

            return rc
        end

        # Reserve a set of addresses from this virtual network
        # @param rname [String] of the reservation
        # @param rsize[String] number of addresses to reserve
        # @param ar_id[String] the ar_id to make the reservation. If set to nil
        #        any address range will be used
        # @param addr [String] the first address in the reservation. If set to
        #        nil the first free address will be used
        # @param vnet [String] ID of the VNET to add the reservation to. If not
        #        set a new VNET will be created.
        # @return [Integer, OpenNebula::Error] The reservation vnet id on
        #        success, Error otherwise
        def reserve(rname, rsize, ar_id, addr, vnet)
            return Error.new('ID not defined') if !@pe_id

            rtmpl =  "SIZE       = #{rsize}\n"
            rtmpl << "NAME       = \"#{rname}\"\n" if !rname.nil?
            rtmpl << "AR_ID      = #{ar_id}\n" if !ar_id.nil?
            rtmpl << "NETWORK_ID = #{vnet}\n"  if !vnet.nil?

            if !addr.nil?
                addr_name = address_type(addr)

                return addr_name if OpenNebula.is_error?(addr_name)

                rtmpl << "#{addr_name} = #{addr}\n"
            end

            return @client.call(VN_METHODS[:reserve], @pe_id, rtmpl)
        end

        def reserve_with_extra(extra)
            return Error.new('ID not defined') unless @pe_id

            @client.call(VN_METHODS[:reserve], @pe_id, extra)
        end

        # Removes an Address Range from the VirtualNetwork
        def free(ar_id)
            return Error.new('ID not defined') if !@pe_id

            rc = @client.call(VN_METHODS[:free_ar], @pe_id, ar_id.to_i)
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

        # Recovers an stuck Virtual Network
        #
        # @param result [Integer] Recover with failure (0), success (1),
        # delete (2), retry (3)
        # @return [nil, OpenNebula::Error] nil in case of success, Error
        #   otherwise
        def recover(result)
            return call(VN_METHODS[:recover], @pe_id, result)
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

        # Returns an array with the numeric virtual router ids
        def vrouter_ids
            array = Array.new

            self.each("VROUTERS/ID") do |id|
                array << id.text.to_i
            end

            return array
        end

        # Returns the state of the Virtual Network (numeric value)
        def state
            self['STATE'].to_i
        end

        # Returns the state of the Virtual Network (string value)
        def state_str
            VN_STATES[state]
        end

        # Returns the state of the Virtual Network (string value)
        def short_state_str
            SHORT_VN_STATES[state_str]
        end

        # Returns three arrays with the numeric VM IDs for VMs updated,
        # outdated (include updating) and error
        def vm_ids
            updated = Array.new

            self.each('UPDATED_VMS/ID') do |id|
                updated << id.text.to_i
            end

            outdated = Array.new

            self.each('OUTDATED_VMS/ID') do |id|
                outdated << id.text.to_i
            end

            self.each('UPDATING_VMS/ID') do |id|
                outdated << id.text.to_i
            end

            error = Array.new

            self.each('ERROR_VMS/ID') do |id|
                error << id.text.to_i
            end

            [updated, outdated, error]
        end

    private
        def set_publish(published)
            group_u = published ? 1 : 0

            chmod(-1, -1, -1, group_u, -1, -1, -1, -1, -1)
        end

        # Returns the OpenNebula name of the address to use it in LEASE
        # attributes. MAC, IP or IP6 is returned for MAC addresses in colon
        # notation, ipv4 and ipv6 respectively
        def address_type(addr)
            begin
                ipaddr = IPAddr.new addr

                if ipaddr.ipv4?
                    return "IP"
                elsif ipaddr.ipv6?
                    return "IP6"
                else
                    return Error.new('Unknown IP type')
                end
            rescue
                if /^(\h{2}:){5}\h{2}$/ =~ addr
                    return "MAC"
                else
                    return Error.new('Unknown address type')
                end
            end
        end
    end
end
