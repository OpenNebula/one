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

require 'OCAInteraction'
require 'JSONUtils'


class OzonesServer
    include OpenNebulaJSON::JSONUtils

    def initialize
        @ocaInt = OCAInteraction.new
    end

    ############################################################################
    # Retrieve resources
    ############################################################################
    def get_pool(kind)
        pool = case kind
            when "vdc"      then OZones::Vdc
            when "zone"     then OZones::Zones
            else
                error = OZones::Error.new(
                                        "Error: #{kind} resource not supported")
                return [404, error.to_json]
        end

        return [200, pool.to_json]
    end

    # Gets an aggreageted pool for a zone or vdc
    # ie All the hosts in all the Zones
    def get_aggregated_pool(kind, aggkind)
        aggpool = case kind
            when "zone"     then
                case aggkind
                    when "host"                    then OZones::AggregatedHosts.new
                    when "image"                   then OZones::AggregatedImages.new
                    when "user"                    then OZones::AggregatedUsers.new
                    when "vm"                      then OZones::AggregatedVirtualMachines.new
                    when "vn","vnet"               then OZones::AggregatedVirtualNetworks.new
                    when "template","vmtemplate"   then OZones::AggregatedTemplates.new
                end
            else
                error = OZones::Error.new(
                  "Error: #{aggkind} aggregated pool for #{kind} not supported")
                return [404, error.to_json]
        end

        return [200, aggpool.to_json]
    end

    # Gets an aggreageted pool for a zone or vdc in json
    # ie All the hosts in all the Zones
    def get_full_resource(kind, id, aggkind)
        resource = retrieve_resource(kind, id)

        if OZones.is_error?(resource)
            return [404, resource.to_json]
        end

        # TODO build the vdc retrieval

        if kind == "zone"
            client   = OpenNebula::Client.new(
                             resource.onename + ":" + resource.onepass,
                             resource.endpoint,
                             false)

            simple_pool = case aggkind
                when "host"                     then OpenNebulaJSON::HostPoolJSON.new(client)
                when "image"                    then OpenNebulaJSON::ImagePoolJSON.new(client)
                when "user"                     then OpenNebulaJSON::UserPoolJSON.new(client)
                when "vm"                       then OpenNebulaJSON::VirtualMachinePoolJSON.new(client)
                when "vn","vnet"                then OpenNebulaJSON::VirtualNetworkPoolJSON.new(client)
                when "template","vmtemplate"    then OpenNebulaJSON::TemplatePoolJSON.new(client)
                else
                    error = OZones::Error.new(
                      "Error: #{aggkind} aggregated pool for #{kind} #{id} not supported")
                    return [404, error.to_json]
            end

            simple_pool.info

            return [200, simple_pool.to_json]
        end
    end

    # Get a json representation resource with local (DB) info
    def get_resource(kind, id)
        resource = retrieve_resource(kind, id)
        if OZones.is_error?(resource)
            return [404, resource.to_json]
        else
            return [200, resource.to_json]
        end
    end

    # Get hold of a object of a particular kind
    def retrieve_resource(kind, id)
        resource = case kind
            when "vdc"  then OZones::Vdc.get(id)
            when "zone" then OZones::Zones.get(id)
            else
                return OZones::Error.new(
                                        "Error: #{kind} resource not supported")
        end

        if resource
            return resource
        else
            return OZones::Error.new(
                              "Error: Resource #{kind} with id #{id} not found")
        end
    end


    ############################################################################
    # Create resources
    ############################################################################
    # Creates a resource of a kind, and updates the Proxy Rules
    def create_resource(kind, data, body, pr)

        if body.size > 0
            result = parse_json(body,kind)
            data = result if !OpenNebula.is_error?(result)
        end

        resource = case kind
            when "vdc"  then
                vdc_data=Hash.new
                data.each{|key,value|
                    vdc_data[key.downcase.to_sym]=value if key!="pool"
                }

                # Check parameters
                if !vdc_data[:vdcadminname] || !vdc_data[:vdcadminpass] ||
                   !vdc_data[:zoneid] || !vdc_data[:name] || !vdc_data[:hosts]
                    return [400, OZones::Error.new(
                                "Error: Couldn't create resource #{kind}. " +
                              "Not enough information on the template").to_json]
                end

                # Check if the referenced zone exists
                zone=OZones::Zones.get(vdc_data[:zoneid])
                if !zone
                    error = OZones::Error.new("Error: Zone " +
                          "#{vdc_data[:zoneid]} not found, cannot create Vdc.")
                    return [404, error.to_json]
                end
                
                if (!defined? vdc_data[:force] or 
                    (defined? vdc_data[:force] and vdc_data[:force]!="yes")) and
                    !host_uniqueness?(zone, vdc_data[:hosts]) 
                    return [403, OZones::Error.new(
                                "Error: Couldn't create resource #{kind}. " +
                              "Hosts are not unique, and no force option " + 
                              " were given.").to_json]                   
                end

                vdcadminname = vdc_data[:vdcadminname]
                vdcadminpass = vdc_data[:vdcadminpass]
                vdc_data.delete(:zoneid)
                vdc_data.delete(:vdcadminpass)

                vdc = OZones::Vdc.create(vdc_data)

                zone.vdcs << vdc
                zone.save

                if zone.saved? and vdc.saved?
                    vdcadminpass = Digest::SHA1.hexdigest(vdcadminpass)
                    rc = @ocaInt.create_vdc_in_zone(zone,
                                                    vdc,
                                                    vdcadminname,
                                                    vdcadminpass)
                    if OpenNebula.is_error?(rc)
                        vdc.destroy
                        return [400, OZones::Error.new(
                             "Error: Couldn't create #{kind}. Reason: " +
                             rc.message).to_json]
                    else
                        vdc.acls     = rc[0]
                        vdc.group_id = rc[1]
                        vdc.save

                        pr.update # Rewrite proxy conf file
                        return [200, vdc.to_json]
                    end
                else
                    return [400, OZones::Error.new(
                            "Error: Couldn't create resource #{kind}." +
                            " Maybe duplicated name?").to_json]
                end

            when "zone" then
                zone_data=Hash.new
                data.each{|key,value|
                    zone_data[key.downcase.to_sym]=value if key!="pool"
                }

                # Check parameters
                if !zone_data[:onename] || !zone_data[:onepass] ||
                   !zone_data[:endpoint] || !zone_data[:name]
                    return [400, OZones::Error.new(
                              "Error: Couldn't create resource #{kind}. " +
                              "Not enough information on the template").to_json]
                end

                # Digest and check credentials
                zone_data[:onepass] =
                                  Digest::SHA1.hexdigest(zone_data[:onepass])

                rc = @ocaInt.check_oneadmin(zone_data[:onename],
                                            zone_data[:onepass],
                                            zone_data[:endpoint])

                if OpenNebula.is_error?(rc)
                    return [400, OZones::Error.new(
                            "Error: Couldn't create resource #{kind}. Reason: "+
                            rc.message).to_json]
                end

                # Create the zone
                zone = OZones::Zones.create(zone_data)
                rc = zone.save

                if rc
                    pr.update # Rewrite proxy conf file
                    return [200, zone.to_json]
                else
                    return [400, OZones::Error.new(
                    "Error: Couldn't create resource #{kind.upcase}." +
                    " Maybe duplicated name?").to_json]
                end
            else
                error = OZones::Error.new(
                                 "Error: #{kind.upcase} resource not supported")
                return [404, error.to_json]
            end
    end
    
    ############################################################################
    # Update resources
    ############################################################################
    # Updates a resource of a kind, and updates the Proxy Rules if needed
    def update_resource(kind, data, body, pr)

        if body.size > 0
            result = parse_json(body,kind)
            data = result if !OpenNebula.is_error?(result)
        end

        puts data

        resource = case kind
            when "vdc"  then
                vdc_data=Hash.new
                vdc_id  = nil
                data.each{|key,value|
                    vdc_data[key.downcase.to_sym]=value if key!="id"
                    vdc_id = value if key=="id"
                }

                   puts vdc_data

                # Check parameters
                if !vdc_data[:hosts] || !vdc_id 
                    return [400, OZones::Error.new(
                                "Error: Couldn't update resource #{kind}. " +
                              "Need ID and HOSTS to update.").to_json]
                end

                # Check if the referenced Vdc exists
                vdc=OZones::Vdc.get(vdc_id)
                if !vdc
                    error = OZones::Error.new("Error: Vdc " +
                          "#{vdc_id} not found, cannot update Vdc.")
                    return [404, error.to_json]
                end
                
                # Get the zone where the Vdc belongs
                zone=OZones::Zones.get(vdc.zones.id)
                if !zone
                    error = OZones::Error.new("Error: Zone " +
                          "#{vdc.zones.id} not found, cannot update Vdc.")
                    return [404, error.to_json]
                end
                
                if (!defined? vdc_data[:force] or 
                    (defined? vdc_data[:force] and vdc_data[:force]!="yes")) and
                    !host_uniqueness?(zone, vdc_data[:hosts]) 
                    return [403, OZones::Error.new(
                                "Error: Couldn't update resource #{kind}. " +
                              "Hosts are not unique, and no force option " + 
                              " were given.").to_json]                   
                end
                
                rc = @ocaInt.update_vdc_hosts(zone, vdc, vdc_data[:hosts])
                                              
                if !OpenNebula.is_error?(rc)
                    vdc.hosts = vdc_data[:hosts]
                    vdc.get_host_acls!(rc)

                    vdc.save
                    
                    if vdc.saved? 
                        return [200, vdc.to_json]
                    else
                        return [500, OZones::Error.new(
                            "Error: Couldn't update resource #{kind}.").to_json]
                    end

                else
                    return [500, OZones::Error.new(
                    "Error: Couldn't update resource #{kind.upcase}." +
                    " Failed to update ACLs").to_json]
                end
            else
                error = OZones::Error.new(
                         "Error: #{kind.upcase} resource update not supported")
                return [404, error.to_json]
            end
    end

    ############################################################################
    # Delete resources
    ############################################################################
    # Deletes a resource of a kind, and updates the Proxy Rules
    def delete_resource(kind, id, pr)
        resource = retrieve_resource(kind, id)
        if OZones.is_error?(resource)
            return [404, resource.to_json]
        end

        if kind == "vdc"
            rc = @ocaInt.delete_vdc_in_zone(id)
            if OpenNebula.is_error?(rc)
               return [500, OZones::Error.new(
               "Error: Couldn't delete resources from VDC with id #{id}, " +
               "aborting VDC deletion. Reason:" + rc.message).to_json]
            end
        end

        if !resource.destroy
            return [500, OZones::Error.new(
               "Error: Couldn't delete resource #{kind} with id #{id}").to_json]
        else
            pr.update # Rewrite proxy conf file
            return [200, OZones.str_to_json(
                         "Resource #{kind} with id #{id} successfully deleted")]
        end
    end

    ############################################################################
    # Helper functions
    ##########################################################################
    
    # Check if hosts are already include in any Vdc of the zone
    def host_uniqueness?(zone, host_list)
        all_hosts = ""
        zone.vdcs.all.each{|vdc| all_hosts += vdc.hosts}
        all_hosts = all_hosts.split(",").compact.reject{|host| host.empty?}
        
        host_list.split(",").each{|host|
            return false if all_hosts.include?(host)
        }
        return true
    end


end
