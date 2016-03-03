# -------------------------------------------------------------------------- #
# Copyright 2002-2015, OpenNebula Project, OpenNebula Systems                #
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

if !ONE_LOCATION
    LOG_LOCATION = "/var/log/one"
else
    LOG_LOCATION = ONE_LOCATION + "/var"
end

LOG              = LOG_LOCATION + "/onedb-import.log"

require "nokogiri"
require 'opennebula'

include OpenNebula

module OneDBImportSlave
    VERSION = "4.11.80"
    LOCAL_VERSION = "4.13.85"

    def check_db_version(master_db_version, slave_db_version)
        if ( master_db_version[:version] != VERSION ||
             master_db_version[:local_version] != LOCAL_VERSION )

            raise <<-EOT
Version mismatch: import slave file is for version
Shared: #{VERSION}, Local: #{LOCAL_VERSION}

Current master database is version
Shared: #{master_db_version[:version]}, Local: #{master_db_version[:local_version]}
EOT
        elsif ( slave_db_version[:version] != VERSION ||
                slave_db_version[:local_version] != LOCAL_VERSION )

            raise <<-EOT
Version mismatch: import slave file is for version
Shared: #{VERSION}, Local: #{LOCAL_VERSION}

Current slave database is version
Shared: #{master_db_version[:version]}, Local: #{master_db_version[:local_version]}
EOT
        elsif master_db_version[:is_slave]
            raise "Master database is an OpenNebula federation slave"
        end
    end

    def one_version
        "OpenNebula #{VERSION}"
    end

    def import_slave(slave_backend, merge_users, merge_groups, merge_vdcs, zone_id)

        users       = Hash.new
        user_names  = Hash.new
        groups      = Hash.new
        vdcs        = Hash.new

        @slave_db = slave_backend.db

        ########################################################################
        # Zone for the slave
        ########################################################################

        if zone_id == 0
            log("Zone ID 0 can only be used by a Master OpenNebula.")
            log_finish()

            return false
        end

        found = false

        @db.fetch("SELECT oid, name FROM zone_pool WHERE oid = #{zone_id}") do |row|
            found = true

            log("The Slave OpenNebula will be imported to the Master OpenNebula as Zone ##{row[:oid]}, #{row[:name]}.")
        end

        if !found
            log("Zone with ID #{zone_id} could not be found in the Master OpenNebula database.")
            log_finish()

            return false
        end

        ########################################################################
        # pool_control
        ########################################################################

        last_user_oid   = last_oid("user_pool")
        last_group_oid  = last_oid("group_pool")
        last_vdc_oid    = last_oid("vdc_pool")
        last_acl_oid    = last_oid("acl")

        ########################################################################
        # Calculate new IDs and names for users, groups, and vdcs
        ########################################################################

        log(<<-EOT
Users will be moved from the slave DB to the master DB. They will need
a new ID and name.
Old Slave ID name  =>  New Master ID name

EOT
            )
        @slave_db.fetch("SELECT oid, name FROM user_pool") do |row|
            found = false
            new_oid = -1

            master_oid = nil
            master_name = nil

            @db.fetch("SELECT oid, name FROM user_pool "<<
                      "WHERE name = '#{row[:name]}'") do |row_master|

                found = true

                if (merge_users)
                    master_oid = row_master[:oid]
                    master_name = row_master[:name]
                end
            end

            merged = false

            if found
                if merge_users
                    new_oid  = master_oid
                    new_name = master_name
                    merged   = true
                else
                    new_oid  = last_user_oid += 1

                    i = 1

                    begin
                        found = false

                        new_name = "#{row[:name]}-#{i}"
                        i += 1

                        @db.fetch("SELECT oid, name FROM user_pool "<<
                                "WHERE name = '#{new_name}'") do |row_master|
                            found = true
                        end

                    end while found
                end
            else
                new_oid  = last_user_oid += 1
                new_name = row[:name]
            end

            log("%4s %-16s  =>  %4s %-16s" % [row[:oid], row[:name], new_oid, new_name])

            users[row[:oid]] =
                {:oid => new_oid,:name => new_name, :merged => merged}

            user_names[row[:name]] =
                {:oid => new_oid,:name => new_name, :merged => merged}
        end

        log("")
        log(<<-EOT
Groups will be moved from the slave DB to the master DB. They will need
a new ID and name.
Old Slave ID name  =>  New Master ID name

EOT
            )

        @slave_db.fetch("SELECT oid, name FROM group_pool") do |row|
            found = false
            new_oid = -1

            master_oid = nil
            master_name = nil

            @db.fetch("SELECT oid, name FROM group_pool "<<
                      "WHERE name = '#{row[:name]}'") do |row_master|

                found = true

                if (merge_groups)
                    master_oid = row_master[:oid]
                    master_name = row_master[:name]
                end
            end

            merged = false

            if found
                if merge_groups
                    new_oid  = master_oid
                    new_name = master_name
                    merged   = true
                else
                    new_oid  = last_group_oid += 1

                    i = 1

                    begin
                        found = false

                        new_name = "#{row[:name]}-#{i}"
                        i += 1

                        @db.fetch("SELECT oid, name FROM group_pool "<<
                                "WHERE name = '#{new_name}'") do |row_master|
                            found = true
                        end

                    end while found
                end
            else
                new_oid  = last_group_oid += 1
                new_name = row[:name]
            end

            log("%4s %-16s  =>  %4s %-16s" % [row[:oid], row[:name], new_oid, new_name])

            groups[row[:oid]] =
                {:oid => new_oid, :name => new_name, :merged => merged}
        end

        log("")
        log(<<-EOT
VDCs will be moved from the slave DB to the master DB. They will need
a new ID and name.
Old Slave ID name  =>  New Master ID name

EOT
            )

        @slave_db.fetch("SELECT oid, name FROM vdc_pool") do |row|
            found = false
            new_oid = -1

            master_oid = nil
            master_name = nil

            @db.fetch("SELECT oid, name FROM vdc_pool "<<
                      "WHERE name = '#{row[:name]}'") do |row_master|

                found = true

                if (merge_vdcs)
                    master_oid = row_master[:oid]
                    master_name = row_master[:name]
                end
            end

            merged = false

            if found
                if merge_vdcs
                    new_oid  = master_oid
                    new_name = master_name
                    merged   = true
                else
                    new_oid  = last_vdc_oid += 1

                    i = 1

                    begin
                        found = false

                        new_name = "#{row[:name]}-#{i}"
                        i += 1

                        @db.fetch("SELECT oid, name FROM vdc_pool "<<
                                "WHERE name = '#{new_name}'") do |row_master|
                            found = true
                        end

                    end while found
                end
            else
                new_oid  = last_vdc_oid += 1
                new_name = row[:name]
            end

            log("%4s %-16s  =>  %4s %-16s" % [row[:oid], row[:name], new_oid, new_name])

            vdcs[row[:oid]] =
                {:oid => new_oid, :name => new_name, :merged => merged}
        end

        log("")

        ########################################################################
        # Change ownership IDs and names for resources
        ########################################################################

        @slave_db.run "ALTER TABLE document_pool RENAME TO old_document_pool;"
        @slave_db.run "CREATE TABLE document_pool (oid INTEGER PRIMARY KEY, name VARCHAR(128), body MEDIUMTEXT, type INTEGER, uid INTEGER, gid INTEGER, owner_u INTEGER, group_u INTEGER, other_u INTEGER);"

        @slave_db.run "ALTER TABLE image_pool RENAME TO old_image_pool;"
        @slave_db.run "CREATE TABLE image_pool (oid INTEGER PRIMARY KEY, name VARCHAR(128), body MEDIUMTEXT, uid INTEGER, gid INTEGER, owner_u INTEGER, group_u INTEGER, other_u INTEGER, UNIQUE(name,uid) );"

        @slave_db.run "ALTER TABLE network_pool RENAME TO old_network_pool;"
        @slave_db.run "CREATE TABLE network_pool (oid INTEGER PRIMARY KEY, name VARCHAR(128), body MEDIUMTEXT, uid INTEGER, gid INTEGER, owner_u INTEGER, group_u INTEGER, other_u INTEGER, cid INTEGER, pid INTEGER, UNIQUE(name,uid));"

        @slave_db.run "ALTER TABLE template_pool RENAME TO old_template_pool;"
        @slave_db.run "CREATE TABLE template_pool (oid INTEGER PRIMARY KEY, name VARCHAR(128), body MEDIUMTEXT, uid INTEGER, gid INTEGER, owner_u INTEGER, group_u INTEGER, other_u INTEGER);"

        @slave_db.run "ALTER TABLE vm_pool RENAME TO old_vm_pool;"
        @slave_db.run "CREATE TABLE vm_pool (oid INTEGER PRIMARY KEY, name VARCHAR(128), body MEDIUMTEXT, uid INTEGER, gid INTEGER, last_poll INTEGER, state INTEGER, lcm_state INTEGER, owner_u INTEGER, group_u INTEGER, other_u INTEGER);"

        @slave_db.run "ALTER TABLE secgroup_pool RENAME TO old_secgroup_pool;"
        @slave_db.run "CREATE TABLE secgroup_pool (oid INTEGER PRIMARY KEY, name VARCHAR(128), body MEDIUMTEXT, uid INTEGER, gid INTEGER, owner_u INTEGER, group_u INTEGER, other_u INTEGER, UNIQUE(name,uid));"

        @slave_db.run "ALTER TABLE vrouter_pool RENAME TO old_vrouter_pool;"
        @slave_db.run "CREATE TABLE vrouter_pool (oid INTEGER PRIMARY KEY, name VARCHAR(128), body MEDIUMTEXT, uid INTEGER, gid INTEGER, owner_u INTEGER, group_u INTEGER, other_u INTEGER);"

        @slave_db.run "ALTER TABLE group_quotas RENAME TO old_group_quotas;"
        @slave_db.run "CREATE TABLE group_quotas (group_oid INTEGER PRIMARY KEY, body MEDIUMTEXT);"

        @slave_db.run "ALTER TABLE user_quotas RENAME TO old_user_quotas;"
        @slave_db.run "CREATE TABLE user_quotas (user_oid INTEGER PRIMARY KEY, body MEDIUMTEXT);"


        @slave_db.transaction do
            process_new_ownership(@slave_db, users, user_names, groups)
        end

        ########################################################################
        # Move Users from slave to master DB, merge if neccessary
        ########################################################################

        @db.transaction do
            @slave_db.fetch("SELECT * FROM user_pool") do |row|
                new_user = users[row[:oid]]
                new_group = groups[row[:gid]]

                if (new_group.nil?)
                    new_group = groups[1]
                    log("Group ##{row[:gid]} should exist, but it was not found. Run fsck to fix. User ##{new_user[:oid]} (#{new_user[:name]}) will be assigned to group ##{new_group[:oid]}, #{new_group[:name]}")
                end

                slave_doc = Nokogiri::XML(row[:body],nil,NOKOGIRI_ENCODING){|c| c.default_xml.noblanks}

                if new_user[:merged]
                    # Merge user objects, giving priority to the contents
                    # in master.
                    # primary group     => use master's
                    # secondary groups  => merge
                    # password          => use master's
                    # auth driver       => use master's

                    master_doc = nil

                    @db.fetch("SELECT body from user_pool "<<
                              "WHERE oid=#{new_user[:oid]}") do |master_row|
                        master_doc = Nokogiri::XML(master_row[:body],nil,NOKOGIRI_ENCODING){|c| c.default_xml.noblanks}
                    end

                    # Merge secondary groups
                    slave_groups_elem  = slave_doc.root.at_xpath("GROUPS")
                    master_groups_elem = master_doc.root.at_xpath("GROUPS")

                    slave_groups_elem.xpath("ID").each do |id|
                        group = groups[id.text.to_i]

                        if !group.nil?
                            group_id = group[:oid]

                            if master_groups_elem.at_xpath("ID [.=#{group_id}]").nil?
                                master_groups_elem.add_child(
                                    master_doc.create_element("ID")).content = group_id
                            end
                        end
                    end

                    slave_template  = slave_doc.root.at_xpath("TEMPLATE")
                    master_template = master_doc.root.at_xpath("TEMPLATE")

                    # Avoid duplicated template attributes, removing
                    # them from the slave template
                    master_template.children.each do |e|
                        if slave_template.at_xpath(e.name)
                            slave_template.at_xpath(e.name).remove
                        end
                    end

                    # Add slave template attributes to master template
                    master_template << slave_template.children

                    @db[:user_pool].where(:oid => new_user[:oid]).update(
                        :body => master_doc.root.to_s)
                else
                    # New ID and Name
                    slave_doc.root.at_xpath("ID").content    = new_user[:oid]
                    slave_doc.root.at_xpath("NAME").content  = new_user[:name]

                    # New Group IDs
                    slave_doc.root.at_xpath("GID").content    = new_group[:oid]
                    slave_doc.root.at_xpath("GNAME").content  = new_group[:name]

                    groups_elem = slave_doc.root.at_xpath("GROUPS")
                    groups_elem.remove

                    new_elem = slave_doc.create_element("GROUPS")

                    groups_elem.xpath("ID").each do |id|
                        group = groups[id.text.to_i]

                        if !group.nil?
                            new_elem.add_child(slave_doc.create_element("ID")).
                                content = group[:oid]
                        end
                    end

                    slave_doc.root.add_child(new_elem)

                    @db[:user_pool].insert(
                        :oid        => new_user[:oid],
                        :name       => new_user[:name],
                        :body       => slave_doc.root.to_s,
                        :uid        => new_user[:oid],
                        :gid        => new_group[:oid],
                        :owner_u    => row[:owner_u],
                        :group_u    => row[:group_u],
                        :other_u    => row[:other_u])
                end
            end
        end

        ########################################################################
        # Move Groups from slave to master DB, merge if neccessary
        ########################################################################

        @db.transaction do
            @slave_db.fetch("SELECT * FROM group_pool") do |row|
                new_group = groups[row[:gid]]

                slave_doc = Nokogiri::XML(row[:body],nil,NOKOGIRI_ENCODING){|c| c.default_xml.noblanks}

                if new_group[:merged]
                    master_doc = nil

                    @db.fetch("SELECT body from group_pool "<<
                              "WHERE oid=#{new_group[:oid]}") do |master_row|
                        master_doc = Nokogiri::XML(master_row[:body],nil,NOKOGIRI_ENCODING){|c| c.default_xml.noblanks}
                    end

                    slave_users_elem  = slave_doc.root.at_xpath("USERS")
                    master_users_elem = master_doc.root.at_xpath("USERS")

                    slave_users_elem.xpath("ID").each do |id|
                        user = users[id.text.to_i]

                        if !user.nil?
                            user_id = user[:oid]

                            if master_users_elem.at_xpath("ID [.=#{user_id}]").nil?
                                master_users_elem.add_child(
                                    master_doc.create_element("ID")).content = user_id
                            end
                        end
                    end

                    slave_admins_elem  = slave_doc.root.at_xpath("ADMINS")
                    master_admins_elem = master_doc.root.at_xpath("ADMINS")

                    slave_admins_elem.xpath("ID").each do |id|
                        user = users[id.text.to_i]

                        if !user.nil?
                            user_id = user[:oid]

                            if master_admins_elem.at_xpath("ID [.=#{user_id}]").nil?
                                master_admins_elem.add_child(
                                    master_doc.create_element("ID")).content = user_id
                            end
                        end
                    end

                    slave_template  = slave_doc.root.at_xpath("TEMPLATE")
                    master_template = master_doc.root.at_xpath("TEMPLATE")

                    # Avoid duplicated template attributes, removing
                    # them from the slave template
                    master_template.children.each do |e|
                        if slave_template.at_xpath(e.name)
                            slave_template.at_xpath(e.name).remove
                        end
                    end

                    # Add slave template attributes to master template
                    master_template << slave_template.children

                    # Merge resource providers
                    slave_doc.root.xpath("RESOURCE_PROVIDER").each do |elem|
                        # Zone ID must be 0, will be changed to the target ID
                        elem.at_xpath("ZONE_ID").content = zone_id

                        master_doc.root << elem
                    end

                    @db[:group_pool].where(:oid => new_group[:oid]).update(
                        :body => master_doc.root.to_s)
                else
                    slave_doc.root.at_xpath("ID").content    = new_group[:oid]
                    slave_doc.root.at_xpath("NAME").content  = new_group[:name]

                    users_elem = slave_doc.root.at_xpath("USERS")
                    users_elem.remove

                    new_users_elem = slave_doc.create_element("USERS")

                    users_elem.xpath("ID").each do |id|
                        user = users[id.text.to_i]

                        if !user.nil?
                            new_users_elem.add_child(slave_doc.create_element("ID")).
                                content = user[:oid]
                        end
                    end

                    slave_doc.root.add_child(new_users_elem)

                    admins_elem = slave_doc.root.at_xpath("ADMINS")
                    admins_elem.remove

                    new_admins_elem = slave_doc.create_element("ADMINS")

                    admins_elem.xpath("ID").each do |id|
                        user = users[id.text.to_i]

                        if !user.nil?
                            new_admins_elem.add_child(slave_doc.create_element("ID")).
                                content = user[:oid]
                        end
                    end

                    slave_doc.root.add_child(new_admins_elem)

                    # Update resource providers
                    slave_doc.root.xpath("RESOURCE_PROVIDER").each do |elem|
                        # Zone ID must be 0, will be changed to the target ID
                        elem.at_xpath("ZONE_ID").content = zone_id
                    end

                    @db[:group_pool].insert(
                        :oid        => new_group[:oid],
                        :name       => new_group[:name],
                        :body       => slave_doc.root.to_s,
                        :uid        => row[:uid],
                        :gid        => new_group[:oid],
                        :owner_u    => row[:owner_u],
                        :group_u    => row[:group_u],
                        :other_u    => row[:other_u])
                end
            end
        end

        ########################################################################
        # Change User ID in quotas
        ########################################################################

        @slave_db.transaction do
            @slave_db.fetch("SELECT * FROM old_user_quotas") do |row|
                user = users[row[:user_oid]]

                if user.nil?
                    log("Quota entry for user ##{row[:user_oid]} found, but user does not exist anymore. Will be discarded.")
                else
                    new_user_id = user[:oid]

                    doc = Nokogiri::XML(row[:body],nil,NOKOGIRI_ENCODING){|c| c.default_xml.noblanks}

                    doc.root.at_xpath("ID").content = new_user_id

                    @slave_db[:user_quotas].insert(
                        :user_oid   => new_user_id,
                        :body       => doc.root.to_s)
                end
            end
        end

        ########################################################################
        # Change Group ID in quotas
        ########################################################################

        @slave_db.transaction do
            @slave_db.fetch("SELECT * FROM old_group_quotas") do |row|
                group = groups[row[:group_oid]]

                if group.nil?
                    log("Quota entry for group ##{row[:group_oid]} found, but group does not exist anymore. Will be discarded.")
                else
                    new_group_id = group[:oid]

                    doc = Nokogiri::XML(row[:body],nil,NOKOGIRI_ENCODING){|c| c.default_xml.noblanks}

                    doc.root.at_xpath("ID").content = new_group_id

                    @slave_db[:group_quotas].insert(
                        :group_oid  => new_group_id,
                        :body       => doc.root.to_s)
                end
            end
        end

        ########################################################################
        # Move VDCs from slave to master DB, merge if neccessary
        ########################################################################

        @db.transaction do
            @slave_db.fetch("SELECT * FROM vdc_pool") do |row|
                new_vdc = vdcs[row[:oid]]

                slave_doc = Nokogiri::XML(row[:body],nil,NOKOGIRI_ENCODING){|c| c.default_xml.noblanks}

                if new_vdc[:merged]
                    master_doc = nil

                    @db.fetch("SELECT body from vdc_pool "<<
                              "WHERE oid=#{new_vdc[:oid]}") do |master_row|
                        master_doc = Nokogiri::XML(master_row[:body],nil,NOKOGIRI_ENCODING){|c| c.default_xml.noblanks}
                    end

                    slave_groups_elem  = slave_doc.root.at_xpath("GROUPS")
                    master_groups_elem = master_doc.root.at_xpath("GROUPS")

                    slave_groups_elem.xpath("ID").each do |id|
                        group = groups[id.text.to_i]

                        if !group.nil?
                            group_id = group[:oid]

                            if master_groups_elem.at_xpath("ID [.=#{group_id}]").nil?
                                master_groups_elem.add_child(
                                    master_doc.create_element("ID")).content = group_id
                            end
                        end
                    end

                    slave_template  = slave_doc.root.at_xpath("TEMPLATE")
                    master_template = master_doc.root.at_xpath("TEMPLATE")

                    # Avoid duplicated template attributes, removing
                    # them from the slave template
                    master_template.children.each do |e|
                        if slave_template.at_xpath(e.name)
                            slave_template.at_xpath(e.name).remove
                        end
                    end

                    # Add slave template attributes to master template
                    master_template << slave_template.children

                    # Merge resources
                    ["CLUSTER", "HOST", "VNET", "DATASTORE"].each do |resource|
                        slave_doc.root.xpath("#{resource}S/#{resource}").each do |elem|
                            # Zone ID must be 0, will be changed to the target ID
                            elem.at_xpath("ZONE_ID").content = zone_id

                            master_doc.root.at_xpath("#{resource}S") << elem
                        end
                    end

                    @db[:vdc_pool].where(:oid => new_vdc[:oid]).update(
                        :body => master_doc.root.to_s)
                else
                    slave_doc.root.at_xpath("ID").content    = new_vdc[:oid]
                    slave_doc.root.at_xpath("NAME").content  = new_vdc[:name]

                    groups_elem = slave_doc.root.at_xpath("GROUPS")
                    groups_elem.remove

                    new_elem = slave_doc.create_element("GROUPS")

                    groups_elem.xpath("ID").each do |id|
                        group = groups[id.text.to_i]

                        if !group.nil?
                            new_elem.add_child(slave_doc.create_element("ID")).
                                content = group[:oid]
                        end
                    end

                    slave_doc.root.add_child(new_elem)

                    # Merge resources
                    ["CLUSTER", "HOST", "VNET", "DATASTORE"].each do |resource|
                        slave_doc.root.xpath("#{resource}S/#{resource}").each do |elem|
                            # Zone ID must be 0, will be changed to the target ID
                            elem.at_xpath("ZONE_ID").content = zone_id
                        end
                    end

                    @db[:vdc_pool].insert(
                        :oid        => new_vdc[:oid],
                        :name       => new_vdc[:name],
                        :body       => slave_doc.root.to_s,
                        :uid        => row[:uid],
                        :gid        => row[:gid],
                        :owner_u    => row[:owner_u],
                        :group_u    => row[:group_u],
                        :other_u    => row[:other_u])
                end
            end
        end

        ########################################################################
        # Move ACL Rules from slave to master DB
        ########################################################################

        @db.transaction do
            @slave_db.fetch("SELECT * FROM acl") do |row|
                new_user     = row[:user]
                new_resource = row[:resource]
                new_zone     = row[:zone]

                insert = true

                if ( (row[:user] & Acl::USERS["UID"]) == Acl::USERS["UID"] )

                    uid = (row[:user] & 0xFFFFFFFF)

                    if (users[uid].nil?)
                        insert = false
                        error_str = "User ##{uid} does not exist"
                    else
                        new_user = (Acl::USERS["UID"] | users[uid][:oid])
                    end

                elsif ( (row[:user] & Acl::USERS["GID"]) == Acl::USERS["GID"] )

                    gid = (row[:user] & 0xFFFFFFFF)

                    if (groups[gid].nil?)
                        insert = false
                        error_str = "Group ##{gid} does not exist"
                    else
                        new_user = (Acl::USERS["GID"] | groups[gid][:oid])
                    end

                end

                if ( (row[:resource] & Acl::USERS["GID"]) == Acl::USERS["GID"] )

                    gid = (row[:resource] & 0xFFFFFFFF)

                    if (groups[gid].nil?)
                        insert = false
                        error_str = "Group ##{gid} does not exist"
                    else
                        new_resource =
                        ((row[:resource] & 0xFFFFFFFF00000000) | groups[gid][:oid])
                    end

                elsif ( (row[:resource] & Acl::RESOURCES["GROUP"]) == Acl::RESOURCES["GROUP"] &&
                        (row[:resource] & Acl::USERS["UID"]) == Acl::USERS["UID"] )

                    gid = (row[:resource] & 0xFFFFFFFF)

                    if (groups[gid].nil?)
                        insert = false
                        error_str = "Group ##{gid} does not exist"
                    else
                        new_resource =
                        ((row[:resource] & 0xFFFFFFFF00000000) | groups[gid][:oid])
                    end

                elsif ( (row[:resource] & Acl::RESOURCES["USER"]) == Acl::RESOURCES["USER"] &&
                        (row[:resource] & Acl::USERS["UID"]) == Acl::USERS["UID"] )

                    uid = (row[:resource] & 0xFFFFFFFF)

                    if (users[uid].nil?)
                        insert = false
                        error_str = "User ##{uid} does not exist"
                    else
                        new_resource =
                        ((row[:resource] & 0xFFFFFFFF00000000) | users[uid][:oid])
                    end

                end

                if ( (row[:resource] & Acl::RESOURCES["ZONE"]) == Acl::RESOURCES["ZONE"] &&
                     (row[:resource] & Acl::USERS["UID"]) == Acl::USERS["UID"] )

                    zid = (row[:resource] & 0xFFFFFFFF)

                    if (zid != 0)
                        insert = false
                        error_str = "Zone ##{zid} is unknown for the slave"
                    else
                        new_resource = (Acl::USERS["UID"] | zone_id)
                    end
                end

                if ( (row[:zone] & Acl::USERS["UID"]) == Acl::USERS["UID"] )
                    zid = (row[:zone] & 0xFFFFFFFF)

                    if (zid != 0)
                        insert = false
                        error_str = "Zone ##{zid} is unknown for the slave"
                    else
                        new_zone = (Acl::USERS["UID"] | zone_id)
                    end
                end

                # Avoid duplicated ACL rules
                @db.fetch("SELECT oid FROM acl WHERE "<<
                    "user = #{new_user} AND resource = #{new_resource} "<<
                    "AND rights = #{row[:rights]} AND "<<
                    "zone = #{new_zone}") do |acl_row|

                    insert = false
                    error_str = "the same Rule exists with ID ##{acl_row[:oid]}"
                end


                if (insert)
                    last_acl_oid += 1

                    log("Slave DB ACL Rule ##{row[:oid]} imported with ID ##{last_acl_oid}")

                    @db[:acl].insert(
                        :oid        => last_acl_oid,
                        :user       => new_user,
                        :resource   => new_resource,
                        :rights     => row[:rights],
                        :zone       => new_zone)
                else
                    log("Slave DB ACL Rule ##{row[:oid]} will not be "<<
                        "imported to the master DB, " << error_str)
                end
            end
        end

        ########################################################################
        # Cleanup shared tables form slave DB
        ########################################################################

        @slave_db.run "DROP TABLE old_document_pool;"
        @slave_db.run "DROP TABLE old_image_pool;"
        @slave_db.run "DROP TABLE old_network_pool;"
        @slave_db.run "DROP TABLE old_template_pool;"
        @slave_db.run "DROP TABLE old_vm_pool;"
        @slave_db.run "DROP TABLE old_secgroup_pool;"
        @slave_db.run "DROP TABLE old_vrouter_pool;"

        @slave_db.run "DROP TABLE old_group_quotas;"
        @slave_db.run "DROP TABLE old_user_quotas;"

        @slave_db.run "DROP TABLE user_pool;"
        @slave_db.run "DROP TABLE group_pool;"
        @slave_db.run "DROP TABLE vdc_pool;"
        @slave_db.run "DROP TABLE zone_pool;"
        @slave_db.run "DROP TABLE db_versioning;"
        @slave_db.run "DROP TABLE acl;"

        @db.run "UPDATE pool_control SET last_oid = #{last_user_oid} WHERE tablename = 'user_pool';"
        @db.run "UPDATE pool_control SET last_oid = #{last_group_oid} WHERE tablename = 'group_pool';"
        @db.run "UPDATE pool_control SET last_oid = #{last_acl_oid} WHERE tablename = 'acl';"

        log_finish()

        return true
    end


    ############################################################################
    ############################################################################

    def log(message)
        @log_file ||= File.open(LOG, "w")

        puts message

        @log_file.puts(message)
        @log_file.flush
    end

    def log_finish()
        puts
        puts "A copy of this output was stored in #{LOG}"
    end

    def last_oid(table)
        last_oid = -1

        @db.fetch("SELECT last_oid FROM pool_control WHERE tablename='#{table}'") do |row|
            last_oid = row[:last_oid].to_i
        end

        return last_oid
    end


    def process_new_ownership(db, users, user_names, groups)

        db.fetch("SELECT * FROM old_template_pool") do |row|
            new_user = users[row[:uid]]
            new_group = groups[row[:gid]]

            if (new_user.nil?)
                new_user = users[0]
                log("User ##{row[:uid]} does not exist anymore. Template ##{row[:oid]} will be assigned to user ##{new_user[:oid]}, #{new_user[:name]}")
            end

            if (new_group.nil?)
                new_group = groups[0]
                log("Group ##{row[:gid]} does not exist anymore. Template ##{row[:oid]} will be assigned to group ##{new_group[:oid]}, #{new_group[:name]}")
            end

            doc = Nokogiri::XML(row[:body],nil,NOKOGIRI_ENCODING){|c| c.default_xml.noblanks}

            doc.root.at_xpath("UID").content    = new_user[:oid]
            doc.root.at_xpath("UNAME").content  = new_user[:name]

            doc.root.at_xpath("GID").content    = new_group[:oid]
            doc.root.at_xpath("GNAME").content  = new_group[:name]

            doc.root.xpath("TEMPLATE/DISK/IMAGE_UID").each do |img|
                uid = img.text.to_i

                if (!users[uid].nil?)
                    img.content = users[uid][:oid]
                end
            end

            doc.root.xpath("TEMPLATE/DISK/IMAGE_UNAME").each do |img|
                uname = img.text

                if (!user_names[uname].nil?)
                    img.content = user_names[uname][:name]
                end
            end

            doc.root.xpath("TEMPLATE/NIC/NETWORK_UID").each do |net|
                uid = net.text.to_i

                if (!users[uid].nil?)
                    net.content = users[uid][:oid]
                end
            end

            doc.root.xpath("TEMPLATE/NIC/NETWORK_UNAME").each do |net|
                uname = net.text

                if (!user_names[uname].nil?)
                    net.content = user_names[uname][:name]
                end
            end

            db[:template_pool].insert(
                :oid        => row[:oid],
                :name       => row[:name],
                :body       => doc.root.to_s,
                :uid        => new_user[:oid],
                :gid        => new_group[:oid],
                :owner_u    => row[:owner_u],
                :group_u    => row[:group_u],
                :other_u    => row[:other_u])
        end

        db.fetch("SELECT * FROM old_image_pool") do |row|
            new_user = users[row[:uid]]
            new_group = groups[row[:gid]]

            if (new_user.nil?)
                new_user = users[0]
                log("User ##{row[:uid]} does not exist anymore. Image ##{row[:oid]} will be assigned to user ##{new_user[:oid]}, #{new_user[:name]}")
            end

            if (new_group.nil?)
                new_group = groups[0]
                log("Group ##{row[:gid]} does not exist anymore. Image ##{row[:oid]} will be assigned to group ##{new_group[:oid]}, #{new_group[:name]}")
            end

            doc = Nokogiri::XML(row[:body],nil,NOKOGIRI_ENCODING){|c| c.default_xml.noblanks}

            doc.root.at_xpath("UID").content    = new_user[:oid]
            doc.root.at_xpath("UNAME").content  = new_user[:name]

            doc.root.at_xpath("GID").content    = new_group[:oid]
            doc.root.at_xpath("GNAME").content  = new_group[:name]

            db[:image_pool].insert(
                :oid        => row[:oid],
                :name       => row[:name],
                :body       => doc.root.to_s,
                :uid        => new_user[:oid],
                :gid        => new_group[:oid],
                :owner_u    => row[:owner_u],
                :group_u    => row[:group_u],
                :other_u    => row[:other_u])
        end

        db.fetch("SELECT * FROM old_document_pool") do |row|
            new_user = users[row[:uid]]
            new_group = groups[row[:gid]]

            if (new_user.nil?)
                new_user = users[0]
                log("User ##{row[:uid]} does not exist anymore. Document ##{row[:oid]} will be assigned to user ##{new_user[:oid]}, #{new_user[:name]}")
            end

            if (new_group.nil?)
                new_group = groups[0]
                log("Group ##{row[:gid]} does not exist anymore. Document ##{row[:oid]} will be assigned to group ##{new_group[:oid]}, #{new_group[:name]}")
            end

            doc = Nokogiri::XML(row[:body],nil,NOKOGIRI_ENCODING){|c| c.default_xml.noblanks}

            doc.root.at_xpath("UID").content    = new_user[:oid]
            doc.root.at_xpath("UNAME").content  = new_user[:name]

            doc.root.at_xpath("GID").content    = new_group[:oid]
            doc.root.at_xpath("GNAME").content  = new_group[:name]

            db[:document_pool].insert(
                :oid        => row[:oid],
                :name       => row[:name],
                :body       => doc.root.to_s,
                :type       => row[:type],
                :uid        => new_user[:oid],
                :gid        => new_group[:oid],
                :owner_u    => row[:owner_u],
                :group_u    => row[:group_u],
                :other_u    => row[:other_u])
        end

        db.fetch("SELECT * FROM old_network_pool") do |row|
            new_user = users[row[:uid]]
            new_group = groups[row[:gid]]

            if (new_user.nil?)
                new_user = users[0]
                log("User ##{row[:uid]} does not exist anymore. Network ##{row[:oid]} will be assigned to user ##{new_user[:oid]}, #{new_user[:name]}")
            end

            if (new_group.nil?)
                new_group = groups[0]
                log("Group ##{row[:gid]} does not exist anymore. Network ##{row[:oid]} will be assigned to group ##{new_group[:oid]}, #{new_group[:name]}")
            end

            doc = Nokogiri::XML(row[:body],nil,NOKOGIRI_ENCODING){|c| c.default_xml.noblanks}

            doc.root.at_xpath("UID").content    = new_user[:oid]
            doc.root.at_xpath("UNAME").content  = new_user[:name]

            doc.root.at_xpath("GID").content    = new_group[:oid]
            doc.root.at_xpath("GNAME").content  = new_group[:name]

            db[:network_pool].insert(
                :oid        => row[:oid],
                :name       => row[:name],
                :body       => doc.root.to_s,
                :uid        => new_user[:oid],
                :gid        => new_group[:oid],
                :owner_u    => row[:owner_u],
                :group_u    => row[:group_u],
                :other_u    => row[:other_u],
                :cid        => row[:cid],
                :pid        => row[:pid])
        end

        db.fetch("SELECT * FROM old_vm_pool") do |row|
            new_user = users[row[:uid]]
            new_group = groups[row[:gid]]

            if (new_user.nil?)
                new_user = users[0]
                log("User ##{row[:uid]} does not exist anymore. VM ##{row[:oid]} will be assigned to user ##{new_user[:oid]}, #{new_user[:name]}")
            end

            if (new_group.nil?)
                new_group = groups[0]
                log("Group ##{row[:gid]} does not exist anymore. VM ##{row[:oid]} will be assigned to group ##{new_group[:oid]}, #{new_group[:name]}")
            end

            doc = Nokogiri::XML(row[:body],nil,NOKOGIRI_ENCODING){|c| c.default_xml.noblanks}

            doc.root.at_xpath("UID").content    = new_user[:oid]
            doc.root.at_xpath("UNAME").content  = new_user[:name]

            doc.root.at_xpath("GID").content    = new_group[:oid]
            doc.root.at_xpath("GNAME").content  = new_group[:name]

            db[:vm_pool].insert(
                :oid        => row[:oid],
                :name       => row[:name],
                :body       => doc.root.to_s,
                :uid        => new_user[:oid],
                :gid        => new_group[:oid],
                :last_poll  => row[:last_poll],
                :state      => row[:state],
                :lcm_state  => row[:lcm_state],
                :owner_u    => row[:owner_u],
                :group_u    => row[:group_u],
                :other_u    => row[:other_u])
        end

        db.fetch("SELECT * FROM old_secgroup_pool") do |row|
            new_user = users[row[:uid]]
            new_group = groups[row[:gid]]

            if (new_user.nil?)
                new_user = users[0]
                log("User ##{row[:uid]} does not exist anymore. Security Group ##{row[:oid]} will be assigned to user ##{new_user[:oid]}, #{new_user[:name]}")
            end

            if (new_group.nil?)
                new_group = groups[0]
                log("Group ##{row[:gid]} does not exist anymore. Security Group ##{row[:oid]} will be assigned to group ##{new_group[:oid]}, #{new_group[:name]}")
            end

            doc = Nokogiri::XML(row[:body],nil,NOKOGIRI_ENCODING){|c| c.default_xml.noblanks}

            doc.root.at_xpath("UID").content    = new_user[:oid]
            doc.root.at_xpath("UNAME").content  = new_user[:name]

            doc.root.at_xpath("GID").content    = new_group[:oid]
            doc.root.at_xpath("GNAME").content  = new_group[:name]

            db[:secgroup_pool].insert(
                :oid        => row[:oid],
                :name       => row[:name],
                :body       => doc.root.to_s,
                :uid        => new_user[:oid],
                :gid        => new_group[:oid],
                :owner_u    => row[:owner_u],
                :group_u    => row[:group_u],
                :other_u    => row[:other_u])
        end

        db.fetch("SELECT * FROM old_vrouter_pool") do |row|
            new_user = users[row[:uid]]
            new_group = groups[row[:gid]]

            if (new_user.nil?)
                new_user = users[0]
                log("User ##{row[:uid]} does not exist anymore. Virtual Router ##{row[:oid]} will be assigned to user ##{new_user[:oid]}, #{new_user[:name]}")
            end

            if (new_group.nil?)
                new_group = groups[0]
                log("Group ##{row[:gid]} does not exist anymore. Virtual Router ##{row[:oid]} will be assigned to group ##{new_group[:oid]}, #{new_group[:name]}")
            end

            doc = Nokogiri::XML(row[:body],nil,NOKOGIRI_ENCODING){|c| c.default_xml.noblanks}

            doc.root.at_xpath("UID").content    = new_user[:oid]
            doc.root.at_xpath("UNAME").content  = new_user[:name]

            doc.root.at_xpath("GID").content    = new_group[:oid]
            doc.root.at_xpath("GNAME").content  = new_group[:name]

            db[:vrouter_pool].insert(
                :oid        => row[:oid],
                :name       => row[:name],
                :body       => doc.root.to_s,
                :uid        => new_user[:oid],
                :gid        => new_group[:oid],
                :owner_u    => row[:owner_u],
                :group_u    => row[:group_u],
                :other_u    => row[:other_u])
        end

    end
end
