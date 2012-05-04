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

require 'CloudServer'
require 'JSONUtils'

class OzonesServer < CloudServer
    include OpenNebulaJSON::JSONUtils

    def initialize(cipher, config, logger)
        super(config, logger)
        #Set cipher for Zone classes
        OZones::Zones.cipher = cipher
    end

    ############################################################################
    # Get methods for the Zones and VDC interface
    ############################################################################
    # Gets all VDCs
    def get_vdcs
        return 200, OZones::Vdc.to_json
    end

    # Gets a VDC
    def get_vdc(id)
        vdc = OZones::Vdc[id]

        if vdc
            return [200, vdc.to_json]
        else
            return [404,
                    OZones::Error.new("Error:VDC with id #{id} not found").to_json]
        end
    end

    #Gets all Zones
    def get_zones
        return 200, OZones::Zones.to_json
    end

    #Gets a zone
    def get_zone(id)
        zone = OZones::Zones[id]

        if zone
            return [200, zone.to_json]
        else
            return [404,
                    OZones::Error.new("Error:Zone with id #{id} not found").to_json]
        end
    end

    # Gets an aggreageted view of a pool for all zones
    def get_zones_pool(pool)
        OZones::OpenNebulaZone::all_pools_to_json(pool)
    end

    # Gets a pool view of a given zone
    def get_zone_pool(id, pool)
        begin
            zone = OZones::OpenNebulaZone.new(id)
            return zone.pool_to_json(pool)
        rescue => e
            return [404, OZones::Error.new(e.message).to_json]
        end
    end

    ############################################################################
    # Create resources
    ############################################################################
    def create_vdc (body,pr)
        #Setup POST data
        vdc_data = parse_json_sym(body,:VDC)

        if OpenNebula.is_error?(vdc_data)
            return [400, OZones::Error.new("Error: Couldn't update vdc. " \
                                           "Reason: #{data.message}.").to_json]
        end

        #-----------------------------------------------------------------------
        #Get the Zone that will host the VDC. And check resouces
        #-----------------------------------------------------------------------
        zoneid = vdc_data.delete(:ZONE_ID)
        force  = vdc_data.delete(:FORCE)

        if !zoneid
            return [400, OZones::Error.new("Error: Couldn't create vdc. " \
                                "Mandatory attribute zoneid missing.").to_json]
        end

        zone = OZones::Zones[zoneid]
        if !zone
            return [404, OZones::Error.new("Error: Couldn't create vdc. " \
                                    "Zone #{zoneid} not found.").to_json]
        end

        if (!force or force.upcase != "YES") and !host_unique?(zone, vdc_data)
            return [403, OZones::Error.new("Error: Couldn't create vdc. " \
                         "Hosts are not unique, use force to override").to_json]
        end

        #-----------------------------------------------------------------------
        # Create de VDC
        #-----------------------------------------------------------------------
        vdc = OZones::OpenNebulaVdc.new(-1,zone)
        rc  = vdc.create(vdc_data)

        if OpenNebula.is_error?(rc)
            return [400, OZones::Error.new("Error: Couldn't create vdc. " \
                                           "Reason: #{rc.message}").to_json]
        end

        #-----------------------------------------------------------------------
        #Update the zone and save the vdc
        #-----------------------------------------------------------------------
        zone.vdcs << vdc.vdc

        begin
            zone.save(:raise_on_failture => true)
        rescue => e
            #vdc.clean_bootstrap
            logger.error {"create_vdc: #{e.resource.errors.inspect}"}

            return [400, OZones::Error.new("Error: Couldn't create " \
                          "vdc. Zone could not be saved: #{e.message}").to_json]
        end

        pr.update # Rewrite proxy conf file
        return [200, vdc.to_json]
    end

    def create_zone(body, pr)
        #Setup POST data
        data = parse_json_sym(body,:ZONE)

        if OpenNebula.is_error?(data)
            return [400, OZones::Error.new("Error: Couldn't update vdc. " \
                                           "Reason: #{data.message}.").to_json]
        end

        zone = OZones::Zones.create(data)

        if OZones.is_error?(zone)
            return [400, zone.to_json]
        end

        pr.update
        return [200, zone.to_json]
    end

    ############################################################################
    # Update resources
    ############################################################################
    def update_vdc(vdc_id, body)
        #Setup PUT data
        vdc_data = parse_json_sym(body,:VDC)

        if OpenNebula.is_error?(vdc_data)
            return [400, OZones::Error.new("Error: Couldn't update vdc. " \
                                           "Reason: #{data.message}.").to_json]
        end        
        
        #-----------------------------------------------------------------------
        # Check parameters & VDC
        #-----------------------------------------------------------------------
        if !vdc_data[:RESOURCES]
            return [400, OZones::Error.new("Error: Couldn't update vdc. " \
                                           "Missing RESOURCES.").to_json]
        end

        begin
            vdc  = OZones::OpenNebulaVdc.new(vdc_id)
        rescue => e
            return [404, OZones::Error.new("Error: Couldn't update vdc. " \
                                           "#{e.message}").to_json]
        end

        vdc_data[:CLUSTER_ID] = vdc.vdc.CLUSTER_ID
        vdc_data[:ID]         = vdc.vdc.ID

        force = vdc_data.delete(:FORCE)

        if (!force or force.upcase!="YES") and !host_unique?(vdc.zone, vdc_data)
            return [403, OZones::Error.new("Error: Couldn't update vdc. " \
                      "Hosts are not unique, use force to override").to_json]
        end

        rc = vdc.update(vdc_data[:RESOURCES])

        if !OpenNebula.is_error?(rc)
            return [200, rc]
        else
            return [500, OZones::Error.new("Error: Couldn't update vdc. " \
                                           " Reason: #{rc.message}").to_json]
        end
    end

    ############################################################################
    # Delete resources
    ############################################################################
    def delete_vdc(id, pr)
        begin
            vdc = OZones::OpenNebulaVdc.new(id)
            rc  = vdc.destroy
        rescue => e
            return [404, OZones::Error.new("Error: Cannot delete vdc. " \
                                           "Reason: #{e.message}").to_json]
        end

        if !rc
            return [500, OZones::Error.new("Error: Couldn't delete " \
                                           "vdc #{id}").to_json]
        else
            pr.update # Rewrite proxy conf file
            return [200, OZones.str_to_json("Vdc #{id} successfully deleted")]
        end
    end

    def delete_zone(id, pr)
        zone = OZones::Zones[id]

        if zone
            rc = zone.destroy
        else
            return [404, OZones::Error.new("Error: Cannot delete " \
                                "zone. Reason: zone #{id} not found").to_json]
        end

        if !rc
            return [500, OZones::Error.new("Error: Couldn't delete " \
                                           "zone #{id}").to_json]
        else
            pr.update # Rewrite proxy conf file
            return [200, OZones.str_to_json("Zone #{id} successfully deleted")]
        end
    end

    ############################################################################
    # Misc Helper Functions
    ############################################################################
    private

    # Check if hosts are already include in any Vdc of the zone
    def host_unique?(zone, vdc_data)

        hosts = vdc_data[:RESOURCES][:HOSTS]
        c_id  = vdc_data[:CLUSTER_ID]

        return true if hosts.empty?

        all_hosts = Array.new

        zone.vdcs(:CLUSTER_ID =>c_id).each{ |vdc|
            rsrc = vdc.resources 

            if !rsrc[:HOSTS].empty? and vdc.ID != vdc_data[:ID]
                all_hosts.concat(rsrc[:HOSTS])
            end
        }

        hosts.each{|hid|
            return false if all_hosts.include?(hid)
        }

        return true
    end
end
