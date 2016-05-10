# -------------------------------------------------------------------------- #
# Copyright 2002-2016, OpenNebula Project, OpenNebula Systems                #
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

require 'nokogiri'

module Migrator
    def db_version
        "4.5.80"
    end

    def one_version
        "OpenNebula 4.5.80"
    end

    def up

        init_log_time()

        @db.run "ALTER TABLE acl RENAME TO old_acl;"
        @db.run "CREATE TABLE acl (oid INT PRIMARY KEY, user BIGINT, resource BIGINT, rights BIGINT, zone BIGINT, UNIQUE(user, resource, rights, zone));"

        @db.transaction do
            @db.fetch("SELECT * FROM old_acl") do |row|
                @db[:acl].insert(
                    :oid        => row[:oid],
                    :user       => row[:user],
                    :resource   => row[:resource],
                    :rights     => row[:rights],
                    :zone       => 4294967296)
            end
        end

        @db.run "DROP TABLE old_acl;"

        log_time()

        # Move USER/QUOTA to user_quotas table

        @db.run "ALTER TABLE user_pool RENAME TO old_user_pool;"
        @db.run "CREATE TABLE user_pool (oid INTEGER PRIMARY KEY, name VARCHAR(128), body MEDIUMTEXT, uid INTEGER, gid INTEGER, owner_u INTEGER, group_u INTEGER, other_u INTEGER, UNIQUE(name));"

        @db.run "CREATE TABLE user_quotas (user_oid INTEGER PRIMARY KEY, body MEDIUMTEXT);"

        @db.transaction do
            @db.fetch("SELECT * FROM old_user_pool") do |row|
                doc = Nokogiri::XML(row[:body],nil,NOKOGIRI_ENCODING){|c| c.default_xml.noblanks}

                quotas_doc = extract_quotas(doc)

                @db[:user_pool].insert(
                    :oid        => row[:oid],
                    :name       => row[:name],
                    :body       => doc.root.to_s,
                    :uid        => row[:uid],
                    :gid        => row[:gid],
                    :owner_u    => row[:owner_u],
                    :group_u    => row[:group_u],
                    :other_u    => row[:other_u])

                @db[:user_quotas].insert(
                    :user_oid   => row[:oid],
                    :body       => quotas_doc.root.to_s)
            end
        end

        @db.run "DROP TABLE old_user_pool;"

        log_time()

        # GROUP/RESOURCE_PROVIDER is not needed

        # Move GROUP/QUOTA to group_quotas table
        # Add GROUP/TEMPLATE

        @db.run "ALTER TABLE group_pool RENAME TO old_group_pool;"
        @db.run "CREATE TABLE group_pool (oid INTEGER PRIMARY KEY, name VARCHAR(128), body MEDIUMTEXT, uid INTEGER, gid INTEGER, owner_u INTEGER, group_u INTEGER, other_u INTEGER, UNIQUE(name));"

        @db.run "CREATE TABLE group_quotas (group_oid INTEGER PRIMARY KEY, body MEDIUMTEXT);"

        @db.transaction do
            @db.fetch("SELECT * FROM old_group_pool") do |row|
                doc = Nokogiri::XML(row[:body],nil,NOKOGIRI_ENCODING){|c| c.default_xml.noblanks}

                quotas_doc = extract_quotas(doc)

                doc.root.add_child(doc.create_element("TEMPLATE"))

                @db[:group_pool].insert(
                    :oid        => row[:oid],
                    :name       => row[:name],
                    :body       => doc.root.to_s,
                    :uid        => row[:uid],
                    :gid        => row[:gid],
                    :owner_u    => row[:owner_u],
                    :group_u    => row[:group_u],
                    :other_u    => row[:other_u])

                @db[:group_quotas].insert(
                    :group_oid  => row[:oid],
                    :body       => quotas_doc.root.to_s)
            end
        end

        @db.run "DROP TABLE old_group_pool;"

        log_time()

        # Copy VNet config variables to the template

        @db.run "ALTER TABLE network_pool RENAME TO old_network_pool;"
        @db.run "CREATE TABLE network_pool (oid INTEGER PRIMARY KEY, name VARCHAR(128), body MEDIUMTEXT, uid INTEGER, gid INTEGER, owner_u INTEGER, group_u INTEGER, other_u INTEGER, cid INTEGER, UNIQUE(name,uid));"

        @db.transaction do
            @db.fetch("SELECT * FROM old_network_pool") do |row|
                doc = Nokogiri::XML(row[:body],nil,NOKOGIRI_ENCODING){|c| c.default_xml.noblanks}

                template = doc.root.at_xpath("TEMPLATE")

                ["PHYDEV", "VLAN_ID", "BRIDGE"].each do |elem_name|
                    elem = doc.root.at_xpath(elem_name)
                    txt  = elem.nil? ? "" : elem.text

                    # The cleaner doc.create_cdata(txt) is not supported in
                    # old versions of nokogiri

                    template.add_child(doc.create_element(elem_name)).
                        add_child(Nokogiri::XML::CDATA.new(doc,txt))
                end

                vlan_text = doc.root.at_xpath("VLAN").text == "0" ? "NO" : "YES"

                template.add_child(doc.create_element("VLAN")).
                    add_child(Nokogiri::XML::CDATA.new(doc,vlan_text))

                @db[:network_pool].insert(
                    :oid        => row[:oid],
                    :name       => row[:name],
                    :body       => doc.root.to_s,
                    :uid        => row[:uid],
                    :gid        => row[:gid],
                    :owner_u    => row[:owner_u],
                    :group_u    => row[:group_u],
                    :other_u    => row[:other_u],
                    :cid        => row[:cid])
            end
        end

        @db.run "DROP TABLE old_network_pool;"

        log_time()

        # Replace deprecated host attributes inside requirements/rank expressions

        @db.run "ALTER TABLE template_pool RENAME TO old_template_pool;"
        @db.run "CREATE TABLE template_pool (oid INTEGER PRIMARY KEY, name VARCHAR(128), body MEDIUMTEXT, uid INTEGER, gid INTEGER, owner_u INTEGER, group_u INTEGER, other_u INTEGER);"

        @db.transaction do
            @db.fetch("SELECT * FROM old_template_pool") do |row|
                doc = Nokogiri::XML(row[:body],nil,NOKOGIRI_ENCODING){|c| c.default_xml.noblanks}

                atts = ["SCHED_REQUIREMENTS", "SCHED_RANK", "REQUIREMENTS", "RANK"]

                atts.each do |att|
                    elem = doc.root.at_xpath("TEMPLATE/#{att}")

                    if !elem.nil?
                        elem.content = elem.text.
                            gsub("TOTALCPU",   "MAX_CPU").
                            gsub("TOTALMEMORY","MAX_MEM").
                            gsub("FREECPU",    "FREE_CPU").
                            gsub("FREEMEMORY", "FREE_MEM").
                            gsub("USEDCPU",    "USED_CPU").
                            gsub("USEDMEMORY", "USED_MEM")
                    end
                end

                @db[:template_pool].insert(
                    :oid        => row[:oid],
                    :name       => row[:name],
                    :body       => doc.root.to_s,
                    :uid        => row[:uid],
                    :gid        => row[:gid],
                    :owner_u    => row[:owner_u],
                    :group_u    => row[:group_u],
                    :other_u    => row[:other_u])
            end
        end

        @db.run "DROP TABLE old_template_pool;"

        log_time()

        # Default ZONE
        @db.run "CREATE TABLE zone_pool (oid INTEGER PRIMARY KEY, name VARCHAR(128), body MEDIUMTEXT, uid INTEGER, gid INTEGER, owner_u INTEGER, group_u INTEGER, other_u INTEGER, UNIQUE(name));"
        @db.run "INSERT INTO zone_pool VALUES(0,'OpenNebula','<ZONE><ID>0</ID><NAME>OpenNebula</NAME><TEMPLATE><ENDPOINT><![CDATA[-]]></ENDPOINT></TEMPLATE></ZONE>',0,0,1,0,0);"

        @db.run "INSERT INTO pool_control VALUES('zone_pool',99);"

        # New versioning table
        @db.run "CREATE TABLE local_db_versioning (oid INTEGER PRIMARY KEY, version VARCHAR(256), timestamp INTEGER, comment VARCHAR(256), is_slave BOOLEAN);"
        @db.run "INSERT INTO local_db_versioning VALUES(0,'#{db_version()}',#{Time.now.to_i},'Database migrated from 4.4.1 to 4.5.80 (OpenNebula 4.5.80) by onedb command.',0);"

        return true
    end

    def extract_quotas(doc)
        ds_quota  = doc.root.at_xpath("DATASTORE_QUOTA")
        net_quota = doc.root.at_xpath("NETWORK_QUOTA")
        vm_quota  = doc.root.at_xpath("VM_QUOTA")
        img_quota = doc.root.at_xpath("IMAGE_QUOTA")

        quotas_doc = Nokogiri::XML("<QUOTAS></QUOTAS>",nil,NOKOGIRI_ENCODING){|c| c.default_xml.noblanks}

        ds_quota  = quotas_doc.create_element("DATASTORE_QUOTA") if ds_quota.nil?
        net_quota = quotas_doc.create_element("NETWORK_QUOTA")   if net_quota.nil?
        vm_quota  = quotas_doc.create_element("VM_QUOTA")        if vm_quota.nil?
        img_quota = quotas_doc.create_element("IMAGE_QUOTA")     if img_quota.nil?

        ds_quota.remove
        net_quota.remove
        vm_quota.remove
        img_quota.remove

        quotas_doc.root.add_child(quotas_doc.create_element("ID")).
            content = doc.root.at_xpath("ID").text

        quotas_doc.root.add_child(ds_quota)
        quotas_doc.root.add_child(net_quota)
        quotas_doc.root.add_child(vm_quota)
        quotas_doc.root.add_child(img_quota)

        return quotas_doc
    end
end
