# -------------------------------------------------------------------------- #
# Copyright 2002-2018, OpenNebula Project, OpenNebula Systems                #
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
        "4.11.80"
    end

    def one_version
        "OpenNebula 4.11.80"
    end

    def up

        init_log_time()

        ########################################################################
        # Showback
        ########################################################################

        @db.run "CREATE TABLE vm_showback (vmid INTEGER, year INTEGER, month INTEGER, body MEDIUMTEXT, PRIMARY KEY(vmid, year, month));"

        log_time()

        ########################################################################
        # Security Groups
        ########################################################################

        oneadmin_uname = nil

        @db.fetch("SELECT name FROM user_pool WHERE oid=0") do |row|
            oneadmin_uname = row[:name]
        end

        if oneadmin_uname == nil
            puts "Error trying to read oneadmin's user name ('SELECT name FROM user_pool WHERE oid=0')"
            return false
        end

        oneadmin_gname = nil

        @db.fetch("SELECT name FROM group_pool WHERE oid=0") do |row|
            oneadmin_gname = row[:name]
        end

        if oneadmin_gname == nil
            puts "Error trying to read oneadmin's group name ('SELECT name FROM group_pool WHERE oid=0')"
            return false
        end

        @db.run "CREATE TABLE secgroup_pool (oid INTEGER PRIMARY KEY, name VARCHAR(128), body MEDIUMTEXT, uid INTEGER, gid INTEGER, owner_u INTEGER, group_u INTEGER, other_u INTEGER, UNIQUE(name,uid));"
        @db.run "INSERT INTO secgroup_pool VALUES(0,'default','<SECURITY_GROUP><ID>0</ID><UID>0</UID><GID>0</GID><UNAME>#{oneadmin_uname}</UNAME><GNAME>#{oneadmin_gname}</GNAME><NAME>default</NAME><PERMISSIONS><OWNER_U>1</OWNER_U><OWNER_M>1</OWNER_M><OWNER_A>1</OWNER_A><GROUP_U>1</GROUP_U><GROUP_M>0</GROUP_M><GROUP_A>0</GROUP_A><OTHER_U>1</OTHER_U><OTHER_M>0</OTHER_M><OTHER_A>0</OTHER_A></PERMISSIONS><VMS></VMS><TEMPLATE><DESCRIPTION><![CDATA[The default security group is added to every network. Use it to add default filter rules for your networks. You may remove this security group from any network by updating its properties.]]></DESCRIPTION><RULE><PROTOCOL><![CDATA[ALL]]></PROTOCOL><RULE_TYPE><![CDATA[OUTBOUND]]></RULE_TYPE></RULE><RULE><PROTOCOL><![CDATA[ALL]]></PROTOCOL><RULE_TYPE><![CDATA[INBOUND]]></RULE_TYPE></RULE></TEMPLATE></SECURITY_GROUP>',0,0,1,1,1);"

        @db.run "INSERT INTO pool_control VALUES('secgroup_pool',99);"


        @db.run "ALTER TABLE network_pool RENAME TO old_network_pool;"
        @db.run "CREATE TABLE network_pool (oid INTEGER PRIMARY KEY, name VARCHAR(128), body MEDIUMTEXT, uid INTEGER, gid INTEGER, owner_u INTEGER, group_u INTEGER, other_u INTEGER, cid INTEGER, pid INTEGER, UNIQUE(name,uid));"

        @db.transaction do
            @db.fetch("SELECT * FROM old_network_pool") do |row|
                doc = Nokogiri::XML(row[:body],nil,NOKOGIRI_ENCODING){|c| c.default_xml.noblanks}

                template = doc.root.at_xpath("TEMPLATE")

                # The cleaner doc.create_cdata(txt) is not supported in
                # old versions of nokogiri
                template.add_child(doc.create_element("SECURITY_GROUPS")).
                        add_child(Nokogiri::XML::CDATA.new(doc,"0"))

                @db[:network_pool].insert(
                    :oid        =>  row[:oid],
                    :name       =>  row[:name],
                    :body       =>  doc.root.to_s,
                    :uid        =>  row[:uid],
                    :gid        =>  row[:gid],
                    :owner_u    =>  row[:owner_u],
                    :group_u    =>  row[:group_u],
                    :other_u    =>  row[:other_u],
                    :cid        =>  row[:cid],
                    :pid        =>  row[:pid])
            end
        end

        @db.run "DROP TABLE old_network_pool;"

        log_time()

        ########################################################################
        # Datastore status
        ########################################################################

        @db.run "ALTER TABLE datastore_pool RENAME TO old_datastore_pool;"
        @db.run "CREATE TABLE datastore_pool (oid INTEGER PRIMARY KEY, name VARCHAR(128), body MEDIUMTEXT, uid INTEGER, gid INTEGER, owner_u INTEGER, group_u INTEGER, other_u INTEGER, cid INTEGER, UNIQUE(name));"

        @db.transaction do
            @db.fetch("SELECT * FROM old_datastore_pool") do |row|
                doc = Nokogiri::XML(row[:body],nil,NOKOGIRI_ENCODING){|c| c.default_xml.noblanks}

                doc.root.add_child(doc.create_element("STATE")).content = "0"

                @db[:datastore_pool].insert(
                    :oid        =>  row[:oid],
                    :name       =>  row[:name],
                    :body       =>  doc.root.to_s,
                    :uid        =>  row[:uid],
                    :gid        =>  row[:gid],
                    :owner_u    =>  row[:owner_u],
                    :group_u    =>  row[:group_u],
                    :other_u    =>  row[:other_u],
                    :cid        =>  row[:cid])
            end
        end

        @db.run "DROP TABLE old_datastore_pool;"

        log_time()

        ########################################################################
        # VM previous status
        ########################################################################

        @db.run "ALTER TABLE vm_pool RENAME TO old_vm_pool;"
        @db.run "CREATE TABLE vm_pool (oid INTEGER PRIMARY KEY, name VARCHAR(128), body MEDIUMTEXT, uid INTEGER, gid INTEGER, last_poll INTEGER, state INTEGER, lcm_state INTEGER, owner_u INTEGER, group_u INTEGER, other_u INTEGER);"

        @db.run "INSERT INTO vm_pool SELECT * FROM old_vm_pool WHERE state = 6;"

        log_time()

        @db.transaction do
        @db.fetch("SELECT * FROM old_vm_pool WHERE state<>6") do |row|
            doc = Nokogiri::XML(row[:body],nil,NOKOGIRI_ENCODING){|c| c.default_xml.noblanks}

            ["STATE", "LCM_STATE"].each do |ename|
                prev_elem = doc.root.at_xpath("PREV_#{ename}")

                if prev_elem.nil?
                    prev_elem = doc.root.add_child(
                                    doc.create_element("PREV_#{ename}"))

                    prev_elem.content = doc.root.at_xpath(ename).text
                end
            end

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

        return true
    end
end
