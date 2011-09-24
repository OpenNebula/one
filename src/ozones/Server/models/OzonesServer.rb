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
                    zone = OpenNebulaZone.new(id)
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
        resource = retrieve_resource(kind, id)

        if OZones.is_error?(resource)
            return [404, resource.to_json]
        else
            return [200, resource.to_json]
        end
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

                mandatory_params = [:vdcadminname, :vdcadminpass,
                                    :zoneid, :name, :hosts]

                mandatory_params.each { |param|
                    if !vdc_data[param]
                        return [400, OZones::Error.new(
                            "Error: Couldn't create resource #{kind}. " +
                            "Mandatory attribute '#{param}' is missing.").to_json]
                    end
                }

                # Check if the referenced zone exists
                zone=OZones::Zones.get(vdc_data[:zoneid])
                if !zone
                    error = OZones::Error.new("Error: Zone " +
                          "#{vdc_data[:zoneid]} not found, cannot create Vdc.")
                    return [404, error.to_json]
                end

                if (!vdc_data[:force] or vdc_data[:force].upcase!="YES") and
                    !host_uniqueness?(zone, vdc_data[:hosts])
                    return [403, OZones::Error.new(
                                "Error: Couldn't create resource #{kind}. " +
                              "Hosts are not unique, and no force option" +
                              " was given.").to_json]
                end

                vdcadminname = vdc_data[:vdcadminname]
                vdcadminpass = vdc_data[:vdcadminpass]
                vdc_data.delete(:zoneid)
                vdc_data.delete(:vdcadminpass)
                vdc_data.delete(:force)

                begin
                    vdc = OZones::Vdc.create(vdc_data)
                rescue Exception => e
                    msg = e.message
                    msg["accessible in OZones::Vdc"] = "supported."
                    return [400, OZones::Error.new(
                            "Error: Couldn't create resource #{kind}." +
                            " #{msg}").to_json]
                end

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
                zone = OZones::Zones.create(zone_data)

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
                vdc_data=Hash.new
                vdc_id  = nil
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
                
                if (!vdc_data[:force] or vdc_data[:force].upcase!="YES") and
                    !host_uniqueness?(zone, vdc_data[:hosts], vdc_id.to_i) 
                    return [403, OZones::Error.new(
                                "Error: Couldn't update resource #{kind}. " +
                              "Hosts are not unique, and no force option" +
                              " was given.").to_json]
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

    # Get hold of a object of a particular kind
    def retrieve_resource(kind, id)
        rc = case kind
            when "vdc"  then 
                OZones::Vdc.get(id)
            when "zone" then 
                OZones::Zones.get(id)
            else
                OZones::Error.new("Error: #{kind} resource not supported")
        end

        if rc
            return rc
        else
            return OZones::Error.new("Error: #{kind} with id #{id} not found")
        end
    end

end
