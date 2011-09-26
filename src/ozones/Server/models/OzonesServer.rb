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
    # Get methods for the Zones and VDC interface
    ############################################################################
    def get_pool(kind)
        rc = 200

        pool = case kind
            when "vdc"  then
                OZones::Vdc
            when "zone" then 
                OZones::Zones
            else
                rc = 400
                OZones::Error.new("Error: #{kind} resource not supported")
        end

        return [rc, pool.to_json]
    end

    # Gets an aggreageted pool for a zone or vdc
    # ie All the hosts in all the Zones
    def get_aggregated_pool(kind, aggkind)
        case kind
            when "zone" then
                OZones::OpenNebulaZone::all_pools_to_json(aggkind)
            else
                error = OZones::Error.new("Error: Aggregated view not " \
                            "supported for #{kind}")

                [404, error.to_json]
        end
    end

    # Gets an aggreageted pool for a zone or vdc in json
    # ie All the hosts in all the Zones
    def get_full_resource(kind, id, aggkind)
        case kind
            when "zone"
                begin
                    zone = OZones::OpenNebulaZone.new(id)
                    rc   = zone.pool_to_json(aggkind)
                rescue => e
                    return [404, OZones::Error.new(e.message).to_json]
                end
            else
                error = OZones::Error.new("Error: #{kind} resource view " \
                            "not supported")
                rc = [ 404, error.to_json ]
        end

        return rc
    end

    # Get a json representation resource with local (DB) info
    def get_resource(kind, id)
        rc  = 200    
        res = case kind
            when "vdc"  then 
                OZones::Vdc.get(id)
            when "zone" then 
                OZones::Zones.get(id)
            else
                rc = 404
                OZones::Error.new("Error: #{kind} resource not supported")
        end

        return [rc, res.to_json]
    end

    ############################################################################
    # Create resources
    ############################################################################
    # Creates a resource of a kind, and updates the Proxy Rules
    def create_resource(kind, data, body, pr)

        if body.size > 0
            result = parse_json(body,kind)
            data   = result if !OpenNebula.is_error?(result)
        end

        resource = case kind
            when "vdc"  then
                vdc_data = Hash.new
                data.each{|key,value|
                    vdc_data[key.downcase.to_sym]=value if key!="pool"
                }
               
                #Get the Zone that will host the VDC. And check resouces
                zoneid = vdc_data.delete(:zoneid)
                force  = vdc_data.delete(:force)

                if !zoneid
                    return [400, OZones::Error.new("Error: Couldn't create " \
                        "vdc. Mandatory attribute zoneid missing.").to_json]
                end

                zone = OZones::Zones.get(zoneid)
                if !zone
                    return [404, OZones::Error.new("Error: Couldn't create " \
                        "vdc. Zone #{zoneid} not found.").to_json]
                end

                if (!force or force.upcase!="YES") and 
                    !host_uniqueness?(zone, vdc_data[:hosts])

                    return [403, OZones::Error.new( "Error: Couldn't create " \
                        "Hosts are not unique, use force to override").to_json]
                end

                # Create de VDC
                vdc = OZones::OpenNebulaVdc.new(-1,zone)
                rc  = vdc.create(vdc_data)

                if OpenNebula.is_error?(rc)
                    return [400, OZones::Error.new("Error: Couldn't create " \
                        "vdc. Reason: #{rc.message}").to_json]
                end

                #Update the zone and save the vdc
                zone.raise_on_save_failure = true
                zone.vdcs << vdc.vdc

                begin 
                    zone.save
                rescue => e
                    #TODO Rollback VDC creation?
                    return [400, OZones::Error.new("Error: Couldn't create " \
                        "vdc. Zone could not be saved: #{e.message}").to_json]
                end

                pr.update # Rewrite proxy conf file
                return [200, vdc.to_json]

            when "zone" then
                zone = OZones::Zones.create(data)

                if OZones.is_error?(zone)
                    return [400, zone.to_json]
                end

                pr.update
                return [200, zone.to_json]
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
                vdc_data = Hash.new
                vdc_id   = nil
                data.each{|key,value|
                    vdc_data[key.downcase.to_sym]=value if key!="id"
                    vdc_id = value if key=="id"
                }

                # Check parameters
                if !vdc_data[:hosts] || !vdc_id 
                    return [400, OZones::Error.new(
                                "Error: Couldn't update resource #{kind}. " +
                              "Need ID and HOSTS to update.").to_json]
                end

                # Check if the referenced Vdc exists
                begin
                    vdc=OZones::OpenNebulaVdc.new(vdc_id, zone)
                rescue
                    return [404, OZones::Error.new("Error: Vdc " \ 
                          "#{vdc_id} not found, cannot update Vdc.").to_json]

                end
                
                if (!vdc_data[:force] or vdc_data[:force].upcase!="YES") and
                    !host_uniqueness?(zone, vdc_data[:hosts], vdc_id.to_i) 
                    return [403, OZones::Error.new(
                                "Error: Couldn't update resource #{kind}. " +
                              "Hosts are not unique, and no force option" +
                              " was given.").to_json]
                end
                
                rc = vdc.update(vdc_data[:hosts])
                                              
                if !OpenNebula.is_error?(rc)
                        return [200, rc]
                else
                    return [500, OZones::Error.new(
                    "Error: Couldn't update resource #{kind.upcase}." \
                    " Reason: #{rc.message}").to_json]
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
        case kind
            when "vdc" then
                begin
                    vdc = OZones::OpenNebulaVdc.new(id)
                    rc  = vdc.destroy
                rescue => e
                    return [404, OZones::Error.new("Error: Can not delete " \
                        "vdc. Reason: #{e.message}").to_json]
                end
            when "zone" then
                zone = OZones::Zones.get(id)

                if zone
                    rc = zone.destroy
                else
                    return [404, OZones::Error.new("Error: Can not delete " \
                        "zone. Reason: zone #{id} not found").to_json]
                end
            else
                return [404, OZones::Error.new("Error: #{kind} resource " \
                        "not supported").to_json]
        end

        if !rc
            return [500, OZones::Error.new(
               "Error: Couldn't delete resource #{kind} with id #{id}").to_json]
        else
            pr.update # Rewrite proxy conf file
            return [200, OZones.str_to_json(
                         "Resource #{kind} with id #{id} successfully deleted")]
        end
    end

    ############################################################################
    # Misc Helper Functions
    ############################################################################
    private
    
    # Check if hosts are already include in any Vdc of the zone
    def host_uniqueness?(zone, host_list, vdc_id = -1)
        all_hosts = ""
        zone.vdcs.all.each{|vdc|
            if vdc.hosts != nil and !vdc.hosts.empty? and vdc.id != vdc_id
                all_hosts << ',' << vdc.hosts
            end
        }

        all_hosts = all_hosts.split(',')

        host_list.split(",").each{|host|
            return false if all_hosts.include?(host)
        }

        return true
    end
end
