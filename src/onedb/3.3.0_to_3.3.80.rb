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

require "rexml/document"
include REXML

module Migrator
    def db_version
        "3.3.80"
    end

    def one_version
        "OpenNebula 3.3.80"
    end

    SHORT_VM_STATES=%w{init pend hold actv stop susp done fail}

    SHORT_LCM_STATES=%w{prol boot runn migr save save save migr prol,
                        epil epil shut shut fail clea unkn}

    def up

        header_done = false

        @db.fetch("SELECT oid,name,state,lcm_state FROM vm_pool WHERE ( state <> 1 AND state <> 6 )") do |row|
            if ( !header_done )
                puts "You can't have active VMs. Please shutdown or delete the following VMs:"
                puts
                puts "    ID STAT NAME"

                header_done = true
            end

            if row[:state] != 3
                state_str = SHORT_VM_STATES[row[:state]]
            else
                state_str = SHORT_LCM_STATES[row[:lcm_state]]
            end

            puts "#{'%6.6s' % row[:oid].to_s} #{state_str} #{row[:name]}"
        end

        if ( header_done )
            puts
            return false
        end

        one_location = ENV["ONE_LOCATION"]

        if !one_location
            var_location = "/var/lib/one"
        else
            var_location = one_location + "/var"
        end

        ########################################################################
        # Get oneadmin user and group names
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

        ########################################################################
        # Create the cluster and datastore tables
        ########################################################################

        # New table for Clusters
        @db.run "CREATE TABLE cluster_pool (oid INTEGER PRIMARY KEY, name VARCHAR(128), body TEXT, uid INTEGER, gid INTEGER, owner_u INTEGER, group_u INTEGER, other_u INTEGER, UNIQUE(name));"

        # New table for Datastores
        @db.run "CREATE TABLE datastore_pool (oid INTEGER PRIMARY KEY, name VARCHAR(128), body TEXT, uid INTEGER, gid INTEGER, owner_u INTEGER, group_u INTEGER, other_u INTEGER, UNIQUE(name));"

        # Insert system datastore

        xml = 
        "<DATASTORE>" <<
        "  <ID>0</ID>" <<
        "  <UID>0</UID>" <<
        "  <GID>0</GID>" <<
        "  <UNAME>#{oneadmin_uname}</UNAME>" <<
        "  <GNAME>#{oneadmin_gname}</GNAME>" <<
        "  <NAME>system</NAME>" <<
        "  <PERMISSIONS>" <<
        "    <OWNER_U>1</OWNER_U>" <<
        "    <OWNER_M>1</OWNER_M>" <<
        "    <OWNER_A>0</OWNER_A>" <<
        "    <GROUP_U>1</GROUP_U>" <<
        "    <GROUP_M>0</GROUP_M>" <<
        "    <GROUP_A>0</GROUP_A>" <<
        "    <OTHER_U>0</OTHER_U>" <<
        "    <OTHER_M>0</OTHER_M>" <<
        "    <OTHER_A>0</OTHER_A>" <<
        "  </PERMISSIONS>" <<
        "  <DS_MAD>-</DS_MAD>" <<
        "  <TM_MAD>shared</TM_MAD>" <<
        "  <BASE_PATH>#{var_location}/datastores/0</BASE_PATH>" <<
        "  <CLUSTER_ID>-1</CLUSTER_ID>" <<
        "  <CLUSTER/>" <<
        "  <IMAGES/>" <<
        "  <TEMPLATE>" <<
        "    <DS_MAD><![CDATA[-]]></DS_MAD>" <<
        "    <TM_MAD><![CDATA[shared]]></TM_MAD>" <<
        "  </TEMPLATE>" <<
        "</DATASTORE>"

        @db[:datastore_pool].insert(
            :oid        => 0,
            :name       => 'system',
            :body       => xml,
            :uid        => 0,
            :gid        => 0,
            :owner_u    => 1,
            :group_u    => 1,
            :other_u    => 0)

        # Last oid for cluster_pool and datastore_pool

        @db[:pool_control].insert(
            :tablename  => 'cluster_pool',
            :last_oid   => 99)

        @db[:pool_control].insert(
            :tablename  => 'datastore_pool',
            :last_oid   => 99)

        ########################################################################
        # Add each Host to Cluster -1 (none)
        ########################################################################

        @db.run "ALTER TABLE host_pool RENAME TO old_host_pool;"
        @db.run "CREATE TABLE host_pool (oid INTEGER PRIMARY KEY, name VARCHAR(128), body TEXT, state INTEGER, last_mon_time INTEGER, uid INTEGER, gid INTEGER, owner_u INTEGER, group_u INTEGER, other_u INTEGER, UNIQUE(name));"

        @db.fetch("SELECT * FROM old_host_pool") do |row|
            doc = Document.new(row[:body])

            # Delete TM_MAD elem
            doc.root.delete_element("TM_MAD")

            # Add Cluster elements
            doc.root.add_element("CLUSTER_ID").text = "-1"
            doc.root.add_element("CLUSTER").text    = ""

            @db[:host_pool].insert(
                :oid            => row[:oid],
                :name           => row[:name],
                :body           => doc.root.to_s,
                :state          => row[:state],
                :last_mon_time  => row[:last_mon_time],
                :uid            => row[:uid],
                :gid            => row[:gid],
                :owner_u        => row[:owner_u],
                :group_u        => row[:group_u],
                :other_u        => row[:other_u])
        end

        @db.run "DROP TABLE old_host_pool;"

        ########################################################################
        # Add each VNet to Cluster -1 (none)
        ########################################################################

        @db.run "ALTER TABLE network_pool RENAME TO old_network_pool;"
        @db.run "CREATE TABLE network_pool (oid INTEGER PRIMARY KEY, name VARCHAR(128), body TEXT, uid INTEGER, gid INTEGER, owner_u INTEGER, group_u INTEGER, other_u INTEGER, UNIQUE(name,uid));"

        @db.fetch("SELECT * FROM old_network_pool") do |row|
            doc = Document.new(row[:body])

            # Add Cluster elements
            doc.root.add_element("CLUSTER_ID").text = "-1"
            doc.root.add_element("CLUSTER").text    = ""

            @db[:network_pool].insert(
                :oid        => row[:oid],
                :name       => row[:name],
                :body       => doc.root.to_s,
                :uid        => row[:uid],
                :gid        => row[:gid],
                :owner_u    => row[:owner_u],
                :group_u    => row[:group_u],
                :other_u    => row[:other_u])
        end

        @db.run "DROP TABLE old_network_pool;"

        ########################################################################
        # Add each Image to Datastore 1 (default)
        ########################################################################

        images_element = "<IMAGES>"

        @db.run "ALTER TABLE image_pool RENAME TO old_image_pool;"
        @db.run "CREATE TABLE image_pool (oid INTEGER PRIMARY KEY, name VARCHAR(128), body TEXT, uid INTEGER, gid INTEGER, owner_u INTEGER, group_u INTEGER, other_u INTEGER, UNIQUE(name,uid) );"

        @db.fetch("SELECT * FROM old_image_pool") do |row|
            doc = Document.new(row[:body])

            # Add Cluster elements
            doc.root.add_element("DATASTORE_ID").text = "1"
            doc.root.add_element("DATASTORE").text    = "default"

            images_element << "<ID>#{row[:oid]}</ID>"

            # Update SOURCE
            doc.root.each_element("SOURCE") { |e|
                previous_source = e.text

                if previous_source.nil?
                    next
                end

                hash = previous_source.split('/')[-1]

                if ( hash.length == 32 && hash =~ /^[0-9A-F]+$/i )
                    e.text = "#{var_location}/datastores/1/#{hash}"

                    `ln -s #{previous_source} #{e.text}`
                end
            }

            @db[:image_pool].insert(
                :oid        => row[:oid],
                :name       => row[:name],
                :body       => doc.root.to_s,
                :uid        => row[:uid],
                :gid        => row[:gid],
                :owner_u    => row[:owner_u],
                :group_u    => row[:group_u],
                :other_u    => row[:other_u])
        end

        @db.run "DROP TABLE old_image_pool;"

        images_element << "</IMAGES>"

        # Insert default datastore

        xml =
        "<DATASTORE>" <<
        "  <ID>1</ID>" <<
        "  <UID>0</UID>" <<
        "  <GID>0</GID>" <<
        "  <UNAME>#{oneadmin_uname}</UNAME>" <<
        "  <GNAME>#{oneadmin_gname}</GNAME>" <<
        "  <NAME>default</NAME>" <<
        "  <PERMISSIONS>" <<
        "    <OWNER_U>1</OWNER_U>" <<
        "    <OWNER_M>1</OWNER_M>" <<
        "    <OWNER_A>0</OWNER_A>" <<
        "    <GROUP_U>1</GROUP_U>" <<
        "    <GROUP_M>0</GROUP_M>" <<
        "    <GROUP_A>0</GROUP_A>" <<
        "    <OTHER_U>1</OTHER_U>" <<
        "    <OTHER_M>0</OTHER_M>" <<
        "    <OTHER_A>0</OTHER_A>" <<
        "  </PERMISSIONS>" <<
        "  <DS_MAD>fs</DS_MAD>" <<
        "  <TM_MAD>shared</TM_MAD>" <<
        "  <BASE_PATH>#{var_location}/datastores/1</BASE_PATH>" <<
        "  <CLUSTER_ID>-1</CLUSTER_ID>" <<
        "  <CLUSTER/>" <<
        images_element <<
        "  <TEMPLATE>" <<
        "    <DS_MAD><![CDATA[fs]]></DS_MAD>" <<
        "    <TM_MAD><![CDATA[shared]]></TM_MAD>" <<
        "  </TEMPLATE>" <<
        "</DATASTORE>"

        @db[:datastore_pool].insert(
            :oid        => 1,
            :name       => 'default',
            :body       => xml,
            :uid        => 0,
            :gid        => 0,
            :owner_u    => 1,
            :group_u    => 1,
            :other_u    => 1)

        return true
    end
end
