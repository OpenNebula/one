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

require 'OpenNebula'

class OCAInteraction

    # Creates a VDC (user, group, hosts)
    def create_vdc_in_zone(zone, vdc, adminname, adminpass)
        # Create a new client to interact with the zone
        client = OpenNebula::Client.new(zone.onename + ":" + zone.onepass,
                                        zone.endpoint,
                                        false)

        # Create a group in the zone with the VDC name
        group  = OpenNebula::Group.new(OpenNebula::Group.build_xml, client)
        result = group.allocate(vdc.name)
        return result if OpenNebula.is_error?(result)

        # Create the VDC admin user in the Zone
        user   = OpenNebula::User.new(OpenNebula::User.build_xml, client)
        result = user.allocate(adminname, adminpass)
        return rollback(client, group,
                        result, user) if OpenNebula.is_error?(result)

        # Change primary group of the admin user to the VDC group
        result = user.chgrp(group.id)
        return rollback(client, group,
                        result, user) if OpenNebula.is_error?(result)

        # Add ACLs
        aclp  = OpenNebula::AclPool.new client
        rules = vdc.get_vdc_acls_str(user.id, group.id)

        acls_str = ""

        rules.each{ |rule_str|
            acl = OpenNebula::Acl.new(OpenNebula::Acl.build_xml,client)
            rc  = acl.allocate(*OpenNebula::Acl.parse_rule(rule_str))

            if  OpenNebula.is_error?(rc)
                return rollback(client, group, rc, user, acls_str)
            end

            acls_str << acl.id.to_s << ","
        }
        
        return acls_str.chop, group.id
    end

    def delete_vdc_in_zone(id)
        vdc = OZones::Vdc.get(id)
        zone= OZones::Zones.get(vdc.zones_id)

        # Create a new client to interact with the zone
        client = OpenNebula::Client.new(zone.onename + ":" + zone.onepass,
                                        zone.endpoint,
                                        false)

        # Delete the resources from the VDC
        delete_images(vdc.group_id, client)
        delete_templates(vdc.group_id, client)
        delete_vms(vdc.group_id, client)
        delete_vns(vdc.group_id, client)

        # Delete ACLs
        delete_acls(vdc.acls, client)

        # Delete users from a group
        up = OpenNebula::UserPool.new(client)
        up.info
        up.each{|user|
            if user['GID'].to_i == vdc.group_id
                OpenNebula::User.new_with_id(user['ID'], client).delete
            end
        }

        # Delete the group
        rc = OpenNebula::Group.new_with_id(vdc.group_id, client).delete

        if OpenNebula.is_error?(rc)
            return rc
        else
            return nil
        end
    end
    
    def update_vdc_hosts(zone, vdc, host_list)
        # Create a new client to interact with the zone
        client = OpenNebula::Client.new(zone.onename + ":" + zone.onepass,
                                        zone.endpoint,
                                        false)          
        # Delete existing host ACLs
        vdc.get_host_acls.each{|acl_id|
            OpenNebula::Acl.new_with_id(acl_id, client).delete
        }

        # Create new ACLs
        acls_str  = ""
        host_acls = vdc.get_host_acls_str(vdc.group_id, host_list)

        host_acls.each{|rule|
            acl = OpenNebula::Acl.new(OpenNebula::Acl.build_xml,client)    
            rc  = acl.allocate(*OpenNebula::Acl.parse_rule(rule))


            if OpenNebula.is_error?(rc) 
                return rc
            end

            acls_str += acl.id.to_s + ","
        } 

        return acls_str.chop
    end

    # Creates a VDC (user, group, hosts)
    def check_oneadmin(oneadminname, oneadminpass, endpoint)
        # Create a new client to interact with the zone
        client = OpenNebula::Client.new(oneadminname + ":" + oneadminpass,
                                        endpoint,
                                        false)

        hostpool=OpenNebula::HostPool.new(client)
        result = hostpool.info

        return result
    end

    # Deletes resources from failed created VDC
    def rollback(client, group, result, user=nil, acls_str=nil)
        user.delete  if user
        group.delete
        
        delete_acls(acls_str, client)

        return result
    end

    # Deletes images from a group
    def delete_images(groupid, client)
        ip = OpenNebula::ImagePool.new(client)
        ip.info
        ip.each{|image|
            if image['GID'].to_i == groupid
                OpenNebula::Image.new_with_id(image['ID'], client).delete
            end
        }
    end

    # Deletes templates from a group
    def delete_templates(groupid, client)
        tp = OpenNebula::TemplatePool.new(client)
        tp.info
        tp.each{|template|
            if template['GID'].to_i == groupid
                OpenNebula::Image.new_with_id(template['ID'], client).delete
            end
        }
    end

    # Deletes VMs from a group
    def delete_vms(groupid, client)
        vmp = OpenNebula::VirtualMachinePool.new(client)
        vmp.info
        vmp.each{|vm|
            if vm['GID'].to_i == groupid
                OpenNebula::VirtualMachine.new_with_id(vm['ID'], client).delete
            end
        }
    end

    # Deletes VNs from a group
    def delete_vns(groupid, client)
        vnp = OpenNebula::VirtualNetworkPool.new(client)
        vnp.info
        vnp.each{|vn|
            if vn['GID'].to_i == groupid
                OpenNebula::VirtualNetwork.new_with_id(vn['ID'], client).delete
            end
        }
    end

    # Delete ACLs from a group
    def delete_acls(acls_str, client)
        if acls_str != nil && !acls_str.empty?
            acls_str.split(",").each{|acl_id|
                OpenNebula::Acl.new_with_id(acl_id.to_i, client).delete
            }
        end
    end
end

