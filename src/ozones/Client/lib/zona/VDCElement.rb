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


module Zona

    # This class describes a single VDC element. It can be used to
    # allocate, delete, add hosts, remove hosts and retrieve full information
    # for a VDC.
    class VDC < OZonesElement

        # String describing the kind of this resource
        # Should become part of the requests to server: get /vdc/...
        VDC_KIND = "vdc"

        # Builds minimal JSON description for a VDC
        # @param [Integer] pe_id VDC's ID
        # @return [Hash,Zona::Error] Hash description of the object, or Error
        def self.build_json(pe_id=nil)
            if pe_id
                json = "{\"VDC\":{\"ID\":#{pe_id}}}"
            else
                json = '{"VDC":{}}'
            end
            OZonesJSON.build_json(json,:VDC)
        end

        # Initializes a VDC object instance
        # @param [Hash] hash VDC description
        # @param [Zona::Client] client OZones Client
        # @return [String] Element's name or nil
        def initialize(hash, client)
            super(hash, client)
        end

        # Retrieves details about this object and fills in
        # the information hash
        # @return [Zona::Error] nil or Error
        def info
            super(VDC_KIND,:VDC)
        end

        # Allocates a new element from a hash description
        # @param [Hash] template element description
        # @return [Zona::Error] nil or Error
        def allocate_hash(template)
            super(VDC_KIND,template)
        end

        # Allocates a new element from a JSON description
        # @param [String] template element description
        # @return [Zona::Error] nil or Error
        def allocate(template)
            super(VDC_KIND,template)
        end

        # Deletes current element
        # @return [Zona::Error] nil or Error
        def delete
            super(VDC_KIND)
        end


        # Adds hosts to a VDC. The specified hosts are added to the VDC's
        # current ones.
        # @param [Array<#to_i>] hosts_array array of hosts IDs
        # in the zone to be added
        # @param [Hash] options a hash of options
        # @option options [Boolean] :force allows hosts to add hosts
        # which already belong to other VDCs
        # @return [Zona::Error] nil or Error
        def addhosts(hosts_array,options={})
            return Error.new('VDC not info-ed') if !@json_hash

            # array of hosts, integers
            hosts = self[:HOSTS].split(',').collect!{|x| x.to_i}
            hosts.concat(hosts_array).uniq!

            new_hosts = hosts.join(',')
            template = {:ID => @pe_id, :HOSTS => new_hosts}
            template[:FORCE] = "YES" if options[:FORCE]

            template = {:VDC => template}

            rc = @client.put_resource(VDC_KIND,@pe_id,template.to_json)
            return rc if Zona.is_error?(rc)
            nil
        end

        # Delete hosts from a VDC. The specified hosts are removed from the VDC.
        # @param [Array<#to_i>] hosts_array array of the VDC's hosts IDs
        # to be removed. If a host is not in the VDC, then it is ignored.
        # @return [Zona::Error] nil or Error
        def delhosts(hosts_array)
            return Error.new('VDC not info-ed') if !@json_hash

            hosts = self[:HOSTS].split(',').collect!{|x| x.to_i}

            new_hosts = (hosts - hosts_array).join(',')
            template = {:VDC => {:ID => @pe_id, :HOSTS => new_hosts}}

            rc = @client.put_resource(VDC_KIND,@pe_id,template.to_json)
            return rc if Zona.is_error?(rc)
            nil
        end

        alias :addhost :addhosts
        alias :delhost :delhosts

    end
end
