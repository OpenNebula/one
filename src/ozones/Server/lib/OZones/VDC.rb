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

require 'OzonesServer'

module OZones

    # VDC class represents a virtual datacenter abstraction. It is defined by an
    # ID, NAME, the GROUP backing the VDC, the admin credentials and the VDC
    # resources. VDC resources are stored in JSON document in the DB and used as
    # a hash in the VDC.
    class Vdc < Sequel::Model
        include OpenNebulaJSON::JSONUtils
        extend  OpenNebulaJSON::JSONUtils

        plugin :schema
        plugin :validation_helpers

        set_schema do
            primary_key :ID
            String      :NAME, :unique => true
            Integer     :GROUP_ID
            foreign_key :ZONES_ID, :zones, :key => :ID
            String      :VDCADMINNAME
            Integer     :VDCADMIN_ID
            Integer     :CLUSTER_ID
            String      :RESOURCES, :text => true

        end

        create_table unless table_exists?

        many_to_one :zone, :class => 'OZones::Zones', :key => :ZONES_ID

        def validate
            super
            validates_presence [:NAME, :VDCADMINNAME]
            validates_unique :NAME
        end

        def resources
            rsrc_json = self.RESOURCES

            parser = JSON.parser.new(rsrc_json, {:symbolize_names => true})
            parser.parse
        end

        def resources=(rsrc_hash)
            self.RESOURCES = JSON.generate(rsrc_hash)
        end

        def self.to_hash
            zonePoolHash = Hash.new

            zonePoolHash["VDC_POOL"]        = Hash.new
            zonePoolHash["VDC_POOL"]["VDC"] = Array.new unless self.all.empty?

            self.all.each{ |vdc|
                attrs = vdc.values.clone

                rsrc_json = attrs.delete(:RESOURCES)
                parser    = JSON.parser.new(rsrc_json, {:symbolize_names=>true})
                attrs[:RESOURCES] = parser.parse

                zonePoolHash["VDC_POOL"]["VDC"] << attrs
            }

            return zonePoolHash
        end

        def to_hash
            vdc_attributes = Hash.new

            attrs = @values.clone

            rsrc_json = attrs.delete(:RESOURCES)
            parser    = JSON.parser.new(rsrc_json, {:symbolize_names=>true})
            attrs[:RESOURCES] = parser.parse

            vdc_attributes["VDC"] = attrs

            return vdc_attributes
        end
    end

    ###########################################################################
    #  This class represents a VDC able to interact with its supporting
    #  OpenNebula installation through OCA. Data persistence is provided by a
    #  Vdc class
    ###########################################################################
    class OpenNebulaVdc
        #######################################################################
        # Constants
        #######################################################################
        VDC_ATTRS = [:VDCADMINNAME,
                     :VDCADMINPASS,
                     :NAME,
                     :CLUSTER_ID,
                     :RESOURCES]

        attr_reader :vdc
        attr_reader :zone

        #Creates an OpenNebula VDC, using its ID, vdcid and the associated zone
        def initialize(vdcid, zone = nil)
            if vdcid != -1
                @vdc = Vdc[vdcid]

                if !@vdc
                    raise "VDC with id #{vdcid} not found."
                end

                @zone = OZones::Zones[@vdc.ZONES_ID]
            else
                @zone = zone
            end

            @client = OpenNebula::Client.new("#{@zone.ONENAME}:#{@zone.ONEPASS}",
                                             @zone.ENDPOINT)
        end

        def to_json
            @vdc.to_json
        end

        #######################################################################
        #
        #######################################################################
        def create(vdc_data)
            OzonesServer::logger.debug {"Creating new VDC #{vdc_data}"}

            #Check and prepare VDC data and preserve RESOURCES
            VDC_ATTRS.each { |param|
                if !vdc_data[param]
                    return OZones::Error.new("Error: Couldn't create vdc." \
                            "Mandatory attribute '#{param}' is missing.")
                end
            }

            rsrc    = vdc_data.delete(:RESOURCES)
            vdcpass = vdc_data.delete(:VDCADMINPASS)

            #-------------------------------------------------------------------
            # Create a vdc record & check cluster consistency
            #-------------------------------------------------------------------
            begin


                @vdc = Vdc.new

                @vdc.update(vdc_data)
                @vdc.ZONES_ID = @zone.ID

            rescue => e
                return OpenNebula::Error.new(e.message)
            end

            rc   = resources_in_cluster?(rsrc)

            return rc if OpenNebula.is_error?(rc)

            #-------------------------------------------------------------------
            # Create a group in the zone with the VDC name
            #-------------------------------------------------------------------
            group = OpenNebula::Group.new(OpenNebula::Group.build_xml, @client)
            rc    = group.allocate(@vdc.NAME)

            return rc if OpenNebula.is_error?(rc)

            @vdc.GROUP_ID = group.id

            OzonesServer::logger.debug {"Group #{group.id} created"}

            #-------------------------------------------------------------------
            # Create the VDC admin user in the Zone
            #-------------------------------------------------------------------
            user = OpenNebula::User.new(OpenNebula::User.build_xml, @client)
            rc   = user.allocate(@vdc.VDCADMINNAME, vdcpass)

            return rollback(group, nil, nil, rc) if OpenNebula.is_error?(rc)

            @vdc.VDCADMIN_ID = user.id

            OzonesServer::logger.debug {"VDC admin user #{user.id} created"}

            #-------------------------------------------------------------------
            # Change primary group of the admin user to the VDC group
            #-------------------------------------------------------------------
            rc = user.chgrp(group.id)
            return rollback(group, user, nil, rc) if OpenNebula.is_error?(rc)

            #-------------------------------------------------------------------
            # Add ACLs
            #-------------------------------------------------------------------
            rules = get_acls(rsrc)

            OzonesServer::logger.debug {"Creating ACLs #{rules}..."}

            rc, acl_ids = create_acls(rules)
            return rollback(group, user, acl_ids,rc) if OpenNebula.is_error?(rc)

            OzonesServer::logger.debug {"ACLs #{acl_ids} created"}

            rsrc[:ACLS]    = acl_ids
            @vdc.resources = rsrc
            @vdc.save

            return true
        end

        #######################################################################
        #
        #######################################################################
        def destroy
            #-------------------------------------------------------------------
            # Delete the resources from the VDC
            #-------------------------------------------------------------------
            delete_images
            delete_templates
            delete_vms
            delete_acls

            #-------------------------------------------------------------------
            # Delete users from a group and the group
            #-------------------------------------------------------------------
            up = OpenNebula::UserPool.new(@client)
            up.info

            up.each{|user|
                if user['GID'].to_i == @vdc.GROUP_ID
                    user.delete
                end
            }

            OpenNebula::Group.new_with_id(@vdc.GROUP_ID, @client).delete

            return @vdc.destroy
        end

        #######################################################################
        # Cleans bootstrap operations in a zone
        #######################################################################
        def clean_bootstrap
            delete_acls

            OpenNebula::User.new_with_id(@vdc.VDCADMIN_ID, @client).delete
            OpenNebula::Group.new_with_id(@vdc.GROUP_ID, @client).delete
        end

        #######################################################################
        #
        #######################################################################
        def update(rsrc_hash)
            #-------------------------------------------------------------------
            # Check cluster consistency
            #-------------------------------------------------------------------
            rc   = resources_in_cluster?(rsrc_hash)

            return rc if OpenNebula.is_error?(rc)

            # ------------------------------------------------------------------
            # Delete existing host ACLs
            # ------------------------------------------------------------------
            delete_resource_acls

            acls = @vdc.resources[:ACLS]

            acls.slice!(RESOURCE_ACL_FIRST_ID..-1)

            # ------------------------------------------------------------------
            # Create new ACLs. TODO Rollback ACL creation
            # ------------------------------------------------------------------
            if !rsrc_hash.nil?
                rsrc_acls    = get_resource_acls(rsrc_hash)
                rc, acls_ids = create_acls(rsrc_acls)

                return rc if OpenNebula.is_error?(rc)

                acls.concat(acls_ids)
            end

            rsrc_hash[:ACLS] = acls

            # ------------------------------------------------------------------
            #Update the VDC Record
            # ------------------------------------------------------------------
            begin
                @vdc.resources = rsrc_hash
                @vdc.save(:raise_on_failure => true)
            rescue => e
                return OpenNebula::Error.new(e.message)
            end

            return @vdc.to_json
        end

        private
        #######################################################################
        # Functions to generate ACL Strings
        #######################################################################
        # The ID of the first resource ACL
        RESOURCE_ACL_FIRST_ID = 3

        # This method returns an Array of ACL strings to create them
        # in the target zone
        def get_acls(rsrc_hash)
            rule_str = Array.new

            # Grant permissions to the group
            rule_str << "@#{@vdc.GROUP_ID} VM+IMAGE+TEMPLATE/* CREATE"

            # Grant permissions to the vdc admin
            rule_str << "##{@vdc.VDCADMIN_ID} USER/* CREATE"
            rule_str << "##{@vdc.VDCADMIN_ID} USER/@#{@vdc.GROUP_ID} " \
            "USE+MANAGE+ADMIN"
            rule_str << "##{@vdc.VDCADMIN_ID} VM+IMAGE+TEMPLATE/@#{@vdc.GROUP_ID} " \
            "USE+MANAGE"

            ####################################################################
            #When more rules are added the class constant RESOURCE_ACL_FIRST_ID
            #must be modified
            ####################################################################

            rule_str.concat(get_resource_acls(rsrc_hash))
        end

        def get_resource_acls(rsrc_hash)
            rule_str  = Array.new

            # Grant permissions to use the vdc hosts
            rsrc_hash[:HOSTS].each{ |hostid|
                rule_str << "@#{@vdc.GROUP_ID} HOST/##{hostid} MANAGE"
            }

            # Grant permissions to use the vdc datastores
            rsrc_hash[:DATASTORES].each{ |dsid|
                rule_str << "@#{@vdc.GROUP_ID} DATASTORE/##{dsid} USE"
            }

            # Grant permissions to use the vdc networks
            rsrc_hash[:NETWORKS].each{ |netid|
                rule_str << "@#{@vdc.GROUP_ID} NET/##{netid} USE"
            }

            return rule_str
        end

        #######################################################################
        # Functions to delete resources associated to the VDC
        #######################################################################
        # Deletes ACLs for the resources
        def delete_resource_acls
            delete_acls(RESOURCE_ACL_FIRST_ID)
        end

        # Delete ACLs
        def delete_acls(first = 0)
            rsrc = @vdc.resources

            return if rsrc[:ACLS].nil?

            rsrc[:ACLS][first..-1].each { |acl_id|
                OpenNebula::Acl.new_with_id(acl_id, @client).delete
            }
        end

        # Deletes images
        def delete_images
            ip = OpenNebula::ImagePool.new(@client)
            ip.info

            ip.each{|image|
                image.delete if image['GID'].to_i == @vdc.GROUP_ID
            }
        end

        # Deletes templates
        def delete_templates
            tp = OpenNebula::TemplatePool.new(@client)
            tp.info

            tp.each{|template|
                template.delete if template['GID'].to_i == @vdc.GROUP_ID
            }
        end

        # Deletes VMs
        def delete_vms
            vmp = OpenNebula::VirtualMachinePool.new(@client)
            vmp.info

            vmp.each{|vm|
                vm.delete if vm['GID'].to_i == @vdc.GROUP_ID
            }
        end

        #######################################################################
        # Misc helper functions for the class
        #######################################################################

        # Deletes resources from failed created VDC
        def rollback(group, user, acls, rc)
            group.delete
            user.delete if user

            if acls
                acls.each{|acl_id|
                    OpenNebula::Acl.new_with_id(acl_id, @client).delete
                }
            end

            return rc
        end

        # Creates an acl array of acl strings. Returns true or error and
        # a comma-separated list with the new acl ids
        def create_acls(acls)
            acls_ids = Array.new
            rc       = true

            acls.each{|rule|
                acl = OpenNebula::Acl.new(OpenNebula::Acl.build_xml,@client)
                rc  = acl.allocate(*OpenNebula::Acl.parse_rule(rule))

                break if OpenNebula.is_error?(rc)

                acls_ids << acl.id
            }

            return rc, acls_ids
        end

        #
        #
        #
        def resources_in_cluster?(rsrc_hash)
            cluster = OpenNebula::Cluster.new_with_id(@vdc.CLUSTER_ID, @client)
            rc      = cluster.info

            if OpenNebula.is_error?(rc)
                return OpenNebula::Error.new("Error getting cluster: #{rc.message}")
            end

            if !cluster.contains_datastore?(rsrc_hash[:DATASTORES])
                return OpenNebula::Error.new("Some Datastores are not in cluster")
            end

            if !cluster.contains_host?(rsrc_hash[:HOSTS])
                return OpenNebula::Error.new("Some Hosts are not in cluster")
            end

            if !cluster.contains_vnet?(rsrc_hash[:NETWORKS])
                return OpenNebula::Error.new("Some Networks are not in cluster")
            end

            return true
        end
    end
end
