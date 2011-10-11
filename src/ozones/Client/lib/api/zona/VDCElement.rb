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

module Zona

    class VDC < OZonesElement

        VDC_KIND = "vdc"

        def self.build_json(pe_id=nil)
            if pe_id
                json = "{\"VDC\":{\"id\":#{pe_id}}}"
            else
                json = '{"VDC":{}}'
            end
            JSONElement.build_json(json,"VDC")
        end

        def initialize(hash, client)
            super(hash, client)
        end
        
        def info
            super(VDC_KIND,"VDC")
        end

        def allocate_hash(template)
            super(VDC_KIND,template)
        end

        def allocate(template)
            super(VDC_KIND,template)
        end

        def delete
            super(VDC_KIND)
        end

        def addhosts(hosts_array,options={})
            return Error.new('VDC not info-ed') if !@json_hash
            
            # array of hosts, integers
            hosts = self["hosts"].split(',').collect!{|x| x.to_i}
            hosts.concat(hosts_array).uniq!
            
            new_hosts = hosts.join(',')
            template = {:id => @pe_id, :hosts => new_hosts}
            template[:force] = "yes" if options[:force]

            template = {:vdc => template}

            rc = @client.put_resource(VDC_KIND,@pe_id,template.to_json)
            return rc if OZonesClient.is_error?(rc)
            nil
        end

        def delhosts(hosts_array)
            return Error.new('VDC not info-ed') if !@json_hash

            hosts = self["hosts"].split(',').collect!{|x| x.to_i}

            new_hosts = (hosts - hosts_array).join(',')
            template = {:vdc => {:id => @pe_id, :hosts => new_hosts}}

            rc = @client.put_resource(VDC_KIND,@pe_id,template.to_json)
            return rc if OZonesClient.is_error?(rc)
            nil
        end

        alias :addhost :addhosts
        alias :delhost :delhosts

    end
end
