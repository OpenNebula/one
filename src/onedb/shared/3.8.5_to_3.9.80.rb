# -------------------------------------------------------------------------- #
# Copyright 2002-2015, OpenNebula Project (OpenNebula.org), C12G Labs        #
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

require 'set'
require "rexml/document"
include REXML

require 'nokogiri'

class String
    def red
        colorize(31)
    end

private

    def colorize(color_code)
        "\e[#{color_code}m#{self}\e[0m"
    end
end

module Migrator
    def db_version
        "3.9.80"
    end

    def one_version
        "OpenNebula 3.9.80"
    end

    def up

        init_log_time()

        ########################################################################
        # Add Cloning Image ID collection to Images
        ########################################################################

        counters = {}
        counters[:image] = {}

        # Init image counters
        @db.fetch("SELECT oid,body FROM image_pool") do |row|
            if counters[:image][row[:oid]].nil?
                counters[:image][row[:oid]] = {
                    :clones => Set.new
                }
            end

            doc = Document.new(row[:body])

            doc.root.each_element("CLONING_ID") do |e|
                img_id = e.text.to_i

                if counters[:image][img_id].nil?
                    counters[:image][img_id] = {
                        :clones => Set.new
                    }
                end

                counters[:image][img_id][:clones].add(row[:oid])
            end
        end

        log_time()

        ########################################################################
        # Image
        #
        # IMAGE/CLONING_OPS
        # IMAGE/CLONES/ID
        ########################################################################

        @db.run "CREATE TABLE image_pool_new (oid INTEGER PRIMARY KEY, name VARCHAR(128), body MEDIUMTEXT, uid INTEGER, gid INTEGER, owner_u INTEGER, group_u INTEGER, other_u INTEGER, UNIQUE(name,uid) );"

        @db.transaction do
            @db[:image_pool].each do |row|
                doc = Document.new(row[:body])

                oid = row[:oid]

                n_cloning_ops = counters[:image][oid][:clones].size

                # Rewrite number of clones
                doc.root.each_element("CLONING_OPS") { |e|
                    if e.text != n_cloning_ops.to_s
                        warn("Image #{oid} CLONING_OPS has #{e.text} \tis\t#{n_cloning_ops}")
                        e.text = n_cloning_ops
                    end
                }

                # re-do list of Images cloning this one
                clones_new_elem = doc.root.add_element("CLONES")

                counters[:image][oid][:clones].each do |id|
                    clones_new_elem.add_element("ID").text = id.to_s
                end

                row[:body] = doc.to_s

                # commit
                @db[:image_pool_new].insert(row)
            end
        end

        # Rename table
        @db.run("DROP TABLE image_pool")
        @db.run("ALTER TABLE image_pool_new RENAME TO image_pool")

        log_time()

        ########################################################################
        # Feature #1565: New cid column in host, ds and vnet tables
        ########################################################################

        @db.run "ALTER TABLE host_pool RENAME TO old_host_pool;"
        @db.run "CREATE TABLE host_pool (oid INTEGER PRIMARY KEY, name VARCHAR(128), body MEDIUMTEXT, state INTEGER, last_mon_time INTEGER, uid INTEGER, gid INTEGER, owner_u INTEGER, group_u INTEGER, other_u INTEGER, cid INTEGER, UNIQUE(name));"

        @db.transaction do
            @db.fetch("SELECT * FROM old_host_pool") do |row|
                doc = Document.new(row[:body])

                cluster_id = doc.root.get_text('CLUSTER_ID').to_s

                @db[:host_pool].insert(
                    :oid            => row[:oid],
                    :name           => row[:name],
                    :body           => row[:body],
                    :state          => row[:state],
                    :last_mon_time  => row[:last_mon_time],
                    :uid            => row[:uid],
                    :gid            => row[:gid],
                    :owner_u        => row[:owner_u],
                    :group_u        => row[:group_u],
                    :other_u        => row[:other_u],
                    :cid            => cluster_id)
            end
        end

        @db.run "DROP TABLE old_host_pool;"

        log_time()

        ########################################################################
        # Feature #1565: New cid column
        # Feature #471: IPv6 addresses
        ########################################################################

        @db.run "ALTER TABLE network_pool RENAME TO old_network_pool;"
        @db.run "CREATE TABLE network_pool (oid INTEGER PRIMARY KEY, name VARCHAR(128), body MEDIUMTEXT, uid INTEGER, gid INTEGER, owner_u INTEGER, group_u INTEGER, other_u INTEGER, cid INTEGER, UNIQUE(name,uid));"

        @db.transaction do
            @db.fetch("SELECT * FROM old_network_pool") do |row|
                doc = Document.new(row[:body])

                cluster_id = doc.root.get_text('CLUSTER_ID').to_s

                doc.root.add_element("GLOBAL_PREFIX")
                doc.root.add_element("SITE_PREFIX")

                @db[:network_pool].insert(
                    :oid            => row[:oid],
                    :name           => row[:name],
                    :body           => doc.root.to_s,
                    :uid            => row[:uid],
                    :gid            => row[:gid],
                    :owner_u        => row[:owner_u],
                    :group_u        => row[:group_u],
                    :other_u        => row[:other_u],
                    :cid            => cluster_id)
            end
        end

        @db.run "DROP TABLE old_network_pool;"

        log_time()

        ########################################################################
        # Feature #1617
        # New datastore, 2 "files"
        # DATASTORE/SYSTEM is now DATASTORE/TYPE
        #
        # Feature #1565: New cid column in host, ds and vnet tables
        ########################################################################

        @db.run "ALTER TABLE datastore_pool RENAME TO old_datastore_pool;"
        @db.run "CREATE TABLE datastore_pool (oid INTEGER PRIMARY KEY, name VARCHAR(128), body MEDIUMTEXT, uid INTEGER, gid INTEGER, owner_u INTEGER, group_u INTEGER, other_u INTEGER, cid INTEGER, UNIQUE(name));"

        @db.transaction do
            @db.fetch("SELECT * FROM old_datastore_pool") do |row|
                doc = Document.new(row[:body])

                type = "0"  # IMAGE_DS

                system_elem = doc.root.delete_element("SYSTEM")

                if ( !system_elem.nil? && system_elem.text == "1" )
                    type = "1"  # SYSTEM_DS
                end

                doc.root.add_element("TYPE").text = type

                doc.root.each_element("TEMPLATE") do |e|
                    e.delete_element("SYSTEM")
                    e.add_element("TYPE").text = type == "0" ? "IMAGE_DS" : "SYSTEM_DS"
                end

                cluster_id = doc.root.get_text('CLUSTER_ID').to_s

                @db[:datastore_pool].insert(
                    :oid        => row[:oid],
                    :name       => row[:name],
                    :body       => doc.root.to_s,
                    :uid        => row[:uid],
                    :gid        => row[:gid],
                    :owner_u    => row[:owner_u],
                    :group_u    => row[:group_u],
                    :other_u    => row[:other_u],
                    :cid        => cluster_id)
            end
        end

        @db.run "DROP TABLE old_datastore_pool;"

        log_time()

        user_0_name = "oneadmin"

        @db.fetch("SELECT name FROM user_pool WHERE oid=0") do |row|
            user_0_name = row[:name]
        end

        group_0_name = "oneadmin"

        @db.fetch("SELECT name FROM group_pool WHERE oid=0") do |row|
            group_0_name = row[:name]
        end

        base_path = "/var/lib/one/datastores/2"

        @db.fetch("SELECT body FROM datastore_pool WHERE oid=0") do |row|
            doc = Document.new(row[:body])

            doc.root.each_element("BASE_PATH") do |e|
                base_path = e.text
                base_path[-1] = "2"
            end
        end

        @db.run "INSERT INTO datastore_pool VALUES(2,'files','<DATASTORE><ID>2</ID><UID>0</UID><GID>0</GID><UNAME>#{user_0_name}</UNAME><GNAME>#{group_0_name}</GNAME><NAME>files</NAME><PERMISSIONS><OWNER_U>1</OWNER_U><OWNER_M>1</OWNER_M><OWNER_A>0</OWNER_A><GROUP_U>1</GROUP_U><GROUP_M>0</GROUP_M><GROUP_A>0</GROUP_A><OTHER_U>1</OTHER_U><OTHER_M>0</OTHER_M><OTHER_A>0</OTHER_A></PERMISSIONS><DS_MAD>fs</DS_MAD><TM_MAD>ssh</TM_MAD><BASE_PATH>#{base_path}</BASE_PATH><TYPE>2</TYPE><DISK_TYPE>0</DISK_TYPE><CLUSTER_ID>-1</CLUSTER_ID><CLUSTER></CLUSTER><IMAGES></IMAGES><TEMPLATE><DS_MAD><![CDATA[fs]]></DS_MAD><TM_MAD><![CDATA[ssh]]></TM_MAD><TYPE><![CDATA[FILE_DS]]></TYPE></TEMPLATE></DATASTORE>',0,0,1,1,1,-1);"

        log_time()

        ########################################################################
        # Feature #1611: Default quotas
        ########################################################################

        @db.run("CREATE TABLE IF NOT EXISTS system_attributes (name VARCHAR(128) PRIMARY KEY, body MEDIUMTEXT)")
        @db.run("INSERT INTO system_attributes VALUES('DEFAULT_GROUP_QUOTAS','<DEFAULT_GROUP_QUOTAS><DATASTORE_QUOTA></DATASTORE_QUOTA><NETWORK_QUOTA></NETWORK_QUOTA><VM_QUOTA></VM_QUOTA><IMAGE_QUOTA></IMAGE_QUOTA></DEFAULT_GROUP_QUOTAS>');")
        @db.run("INSERT INTO system_attributes VALUES('DEFAULT_USER_QUOTAS','<DEFAULT_USER_QUOTAS><DATASTORE_QUOTA></DATASTORE_QUOTA><NETWORK_QUOTA></NETWORK_QUOTA><VM_QUOTA></VM_QUOTA><IMAGE_QUOTA></IMAGE_QUOTA></DEFAULT_USER_QUOTAS>');")


        @db.run "ALTER TABLE user_pool RENAME TO old_user_pool;"
        @db.run "CREATE TABLE user_pool (oid INTEGER PRIMARY KEY, name VARCHAR(128), body MEDIUMTEXT, uid INTEGER, gid INTEGER, owner_u INTEGER, group_u INTEGER, other_u INTEGER, UNIQUE(name));"

        @db.transaction do
            # oneadmin does not have quotas
            @db.fetch("SELECT * FROM old_user_pool WHERE oid=0") do |row|
                @db[:user_pool].insert(
                    :oid        => row[:oid],
                    :name       => row[:name],
                    :body       => row[:body],
                    :uid        => row[:uid],
                    :gid        => row[:gid],
                    :owner_u    => row[:owner_u],
                    :group_u    => row[:group_u],
                    :other_u    => row[:other_u])
            end

            @db.fetch("SELECT * FROM old_user_pool WHERE oid>0") do |row|
                doc = Nokogiri::XML(row[:body]){|c| c.default_xml.noblanks}

                set_default_quotas(doc)

                @db[:user_pool].insert(
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

        @db.run "DROP TABLE old_user_pool;"

        log_time()

        @db.run "ALTER TABLE group_pool RENAME TO old_group_pool;"
        @db.run "CREATE TABLE group_pool (oid INTEGER PRIMARY KEY, name VARCHAR(128), body MEDIUMTEXT, uid INTEGER, gid INTEGER, owner_u INTEGER, group_u INTEGER, other_u INTEGER, UNIQUE(name));"

        @db.transaction do
            # oneadmin group does not have quotas
            @db.fetch("SELECT * FROM old_group_pool WHERE oid=0") do |row|
                @db[:group_pool].insert(
                    :oid        => row[:oid],
                    :name       => row[:name],
                    :body       => row[:body],
                    :uid        => row[:uid],
                    :gid        => row[:gid],
                    :owner_u    => row[:owner_u],
                    :group_u    => row[:group_u],
                    :other_u    => row[:other_u])
            end

            @db.fetch("SELECT * FROM old_group_pool WHERE oid>0") do |row|
                doc = Nokogiri::XML(row[:body]){|c| c.default_xml.noblanks}

                set_default_quotas(doc)

                @db[:group_pool].insert(
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

        @db.run "DROP TABLE old_group_pool;"

        log_time()

        ########################################################################
        # Bug #1694: SYSTEM_DS is now set with the method adddatastore
        ########################################################################

        @db.run "ALTER TABLE cluster_pool RENAME TO old_cluster_pool;"
        @db.run "CREATE TABLE cluster_pool (oid INTEGER PRIMARY KEY, name VARCHAR(128), body MEDIUMTEXT, uid INTEGER, gid INTEGER, owner_u INTEGER, group_u INTEGER, other_u INTEGER, UNIQUE(name));"

        @db.transaction do
            @db.fetch("SELECT * FROM old_cluster_pool") do |row|
                doc = Document.new(row[:body])

                system_ds = 0

                doc.root.each_element("TEMPLATE") do |e|
                    elem = e.delete_element("SYSTEM_DS")

                    if !elem.nil?
                        system_ds = elem.text.to_i
                    end
                end

                if system_ds != 0
                    updated_body = nil

                    @db.fetch("SELECT body FROM datastore_pool WHERE oid=#{system_ds}") do |ds_row|
                        ds_doc = Document.new(ds_row[:body])

                        type = "0"  # IMAGE_DS

                        ds_doc.root.each_element("TYPE") do |e|
                            type = e.text
                        end

                        if type != "1"
                            puts "    > Cluster #{row[:oid]} has the "<<
                            "System Datastore set to Datastore #{system_ds}, "<<
                            "but its type is not SYSTEM_DS. The System Datastore "<<
                            "for this Cluster will be set to 0"

                            system_ds = 0
                        else
                            cluster_id = "-1"

                            ds_doc.root.each_element("CLUSTER_ID") do |e|
                                cluster_id = e.text
                            end

                            if row[:oid] != cluster_id.to_i
                                puts "    > Cluster #{row[:oid]} has the "<<
                                "System Datastore set to Datastore #{system_ds}, "<<
                                "but it is not part of the Cluster. It will be added now."

                                ds_doc.root.each_element("CLUSTER_ID") do |e|
                                    e.text = row[:oid]
                                end

                                ds_doc.root.each_element("CLUSTER") do |e|
                                    e.text = row[:name]
                                end

                                updated_body = ds_doc.root.to_s
                            end
                        end
                    end

                    if !updated_body.nil?
                        @db[:datastore_pool].where(:oid => system_ds).update(
                            :body => updated_body)
                    end
                end

                doc.root.add_element("SYSTEM_DS").text = system_ds.to_s

                @db[:cluster_pool].insert(
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

        @db.run "DROP TABLE old_cluster_pool;"

        log_time()

        ########################################################################
        # Feature #1556: New elem USER_TEMPLATE
        #
        # Feature #1483: Move scheduling attributes
        #   /VM/TEMPLATE/REQUIREMENTS -> USER_TEMPLATE/SCHED_REQUIREMENTS
        #   /VM/TEMPLATE/RANK -> USER_TEMPLATE/SCHED_RANK
        ########################################################################

        @db.run "ALTER TABLE vm_pool RENAME TO old_vm_pool;"
        @db.run "CREATE TABLE vm_pool (oid INTEGER PRIMARY KEY, name VARCHAR(128), body MEDIUMTEXT, uid INTEGER, gid INTEGER, last_poll INTEGER, state INTEGER, lcm_state INTEGER, owner_u INTEGER, group_u INTEGER, other_u INTEGER);"

        @db.transaction do
            @db.fetch("SELECT * FROM old_vm_pool") do |row|

                doc = Nokogiri::XML(row[:body]){|c| c.default_xml.noblanks}
                user_template = doc.create_element("USER_TEMPLATE")

                e = doc.root.at_xpath("TEMPLATE")
                elem = e.at_xpath("REQUIREMENTS")

                if !elem.nil?
                    new_elem = doc.create_element("SCHED_REQUIREMENTS")
                    new_elem.content = elem.text
                    elem.remove

                    user_template.add_child(new_elem)
                end

                elem = e.at_xpath("RANK")

                if !elem.nil?
                    new_elem = doc.create_element("SCHED_RANK")
                    new_elem.content = elem.text
                    elem.remove

                    user_template.add_child(new_elem)
                end

                doc.root << user_template

                @db[:vm_pool].insert(
                    :oid        => row[:oid],
                    :name       => row[:name],
                    :body       => doc.root.to_s,
                    :uid        => row[:uid],
                    :gid        => row[:gid],
                    :last_poll  => row[:last_poll],
                    :state      => row[:state],
                    :lcm_state  => row[:lcm_state],
                    :owner_u    => row[:owner_u],
                    :group_u    => row[:group_u],
                    :other_u    => row[:other_u])
            end
        end

        @db.run "DROP TABLE old_vm_pool;"

        log_time()

        ########################################################################
        # Feature #1483: Move scheduling attributes
        #   /VMTEMPLATE/TEMPLATE/REQUIREMENTS -> /VMTEMPLATE/TEMPLATE/SCHED_REQUIREMENTS
        #   /VMTEMPLATE/TEMPLATE/RANK -> /VMTEMPLATE/TEMPLATE/SCHED_RANK
        ########################################################################

        @db.run "ALTER TABLE template_pool RENAME TO old_template_pool;"
        @db.run "CREATE TABLE template_pool (oid INTEGER PRIMARY KEY, name VARCHAR(128), body MEDIUMTEXT, uid INTEGER, gid INTEGER, owner_u INTEGER, group_u INTEGER, other_u INTEGER);"

        @db.transaction do
            @db.fetch("SELECT * FROM old_template_pool") do |row|

                doc = Nokogiri::XML(row[:body]){|c| c.default_xml.noblanks}

                template = doc.root.at_xpath("TEMPLATE")

                elem = template.at_xpath("REQUIREMENTS")

                if !elem.nil?
                    new_elem = doc.create_element("SCHED_REQUIREMENTS")
                    new_elem.content = elem.text
                    elem.remove

                    template.add_child(new_elem)
                end

                elem = template.at_xpath("RANK")

                if !elem.nil?
                    new_elem = doc.create_element("SCHED_RANK")
                    new_elem.content = elem.text
                    elem.remove

                    template.add_child(new_elem)
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

        ########################################################################
        # Feature #1691 Add new attribute NIC/NIC_ID
        ########################################################################

        @db.run "ALTER TABLE vm_pool RENAME TO old_vm_pool;"
        @db.run "CREATE TABLE vm_pool (oid INTEGER PRIMARY KEY, name VARCHAR(128), body MEDIUMTEXT, uid INTEGER, gid INTEGER, last_poll INTEGER, state INTEGER, lcm_state INTEGER, owner_u INTEGER, group_u INTEGER, other_u INTEGER);"

        @db.transaction do
            @db.fetch("SELECT * FROM old_vm_pool") do |row|
                if ( row[:state] != 6 )     # DONE
                    doc = Nokogiri::XML(row[:body]){|c| c.default_xml.noblanks}

                    nic_id = 0

                    doc.root.xpath("TEMPLATE/NIC").each { |e|
                        e.xpath("NIC_ID").each {|n| n.remove}
                        e.add_child(doc.create_element("NIC_ID")).content =
                            (nic_id).to_s

                        nic_id += 1
                    }

                    row[:body] = doc.root.to_s
                end

                @db[:vm_pool].insert(
                    :oid        => row[:oid],
                    :name       => row[:name],
                    :body       => row[:body],
                    :uid        => row[:uid],
                    :gid        => row[:gid],
                    :last_poll  => row[:last_poll],
                    :state      => row[:state],
                    :lcm_state  => row[:lcm_state],
                    :owner_u    => row[:owner_u],
                    :group_u    => row[:group_u],
                    :other_u    => row[:other_u])
            end
        end

        @db.run "DROP TABLE old_vm_pool;"

        log_time()

        ########################################################################
        #
        # Banner for the new /var/lib/one/vms directory
        #
        ########################################################################

        puts
        puts "ATTENTION: manual intervention required".red
        puts <<-END.gsub(/^ {8}/, '')
        Virtual Machine deployment files have been moved from /var/lib/one to
        /var/lib/one/vms. You need to move these files manually:

            $ mv /var/lib/one/[0-9]* /var/lib/one/vms

        END

        return true
    end


    def set_default_quotas(doc)

        # VM quotas

        doc.root.xpath("VM_QUOTA/VM/CPU").each do |e|
            e.content = "-1" if e.text.to_f == 0
        end

        doc.root.xpath("VM_QUOTA/VM/MEMORY").each do |e|
            e.content = "-1" if e.text.to_i == 0
        end

        doc.root.xpath("VM_QUOTA/VM/VMS").each do |e|
            e.content = "-1" if e.text.to_i == 0
        end

        # VNet quotas

        doc.root.xpath("NETWORK_QUOTA/NETWORK/LEASES").each do |e|
            e.content = "-1" if e.text.to_i == 0
        end

        # Image quotas

        doc.root.xpath("IMAGE_QUOTA/IMAGE/RVMS").each do |e|
            e.content = "-1" if e.text.to_i == 0
        end

        # Datastore quotas

        doc.root.xpath("DATASTORE_QUOTA/DATASTORE/IMAGES").each do |e|
            e.content = "-1" if e.text.to_i == 0
        end

        doc.root.xpath("DATASTORE_QUOTA/DATASTORE/SIZE").each do |e|
            e.content = "-1" if e.text.to_i == 0
        end
    end
end
