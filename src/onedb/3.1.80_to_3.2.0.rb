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
        "3.2.0"
    end

    def one_version
        "OpenNebula 3.2.0"
    end

    HOST_RIGHTS =
    {
        0x1      => 0x8,    # "CREATE"        => "CREATE"
        0x2      => 0x4,    # "DELETE"        => "ADMIN"
        0x4      => 0x2,    # "USE"           => "MANAGE"
        0x8      => 0x4,    # "MANAGE"        => "ADMIN"
        0x10     => 0x1     # "INFO"          => "USE"
#       0x20                  "INFO_POOL"
#       0x40                  "INFO_POOL_MINE"
#       0x80                  "INSTANTIATE"
#       0x100                 "CHOWN"
#       0x200                 "DEPLOY"
#       0x400                 "CHAUTH"
    }

    USER_GROUP_RIGHTS =
    {
        0x1      => 0x8,    # "CREATE"        => "CREATE"
        0x2      => 0x4,    # "DELETE"        => "ADMIN"
        0x4      => 0x1,    # "USE"           => "USE"
        0x8      => 0x2,    # "MANAGE"        => "MANAGE"
        0x10     => 0x1,    # "INFO"          => "USE"
#       0x20                  "INFO_POOL"
#       0x40                  "INFO_POOL_MINE"
        0x80     => 0x1,    # "INSTANTIATE"   => "USE"
        0x100    => 0x2,    # "CHOWN"         => "MANAGE"
        0x200    => 0x4,    # "DEPLOY"        => "ADMIN"
        0x400    => 0x4     # "CHAUTH"        => "ADMIN"
    }

    RIGHTS =
    {
        0x1      => 0x8,    # "CREATE"        => "CREATE"
        0x2      => 0x2,    # "DELETE"        => "MANAGE"
        0x4      => 0x1,    # "USE"           => "USE"
        0x8      => 0x2,    # "MANAGE"        => "MANAGE"
        0x10     => 0x1,    # "INFO"          => "USE"
#       0x20                  "INFO_POOL"
#       0x40                  "INFO_POOL_MINE"
        0x80     => 0x1,    # "INSTANTIATE"   => "USE"
        0x100    => 0x2,    # "CHOWN"         => "MANAGE"
        0x200    => 0x4,    # "DEPLOY"        => "ADMIN"
        0x400    => 0x4     # "CHAUTH"        => "ADMIN"
    }


    def up

        ########################################################################
        # Update ACL Rules
        ########################################################################

        @db.run "ALTER TABLE acl RENAME TO old_acl;"
        @db.run "CREATE TABLE acl (oid INT PRIMARY KEY, user BIGINT, resource BIGINT, rights BIGINT);"

        @db.fetch("SELECT * FROM old_acl") do |row|

            rights = row[:rights].to_i
            new_rights = 0

            rights_hash = nil

            if ( row[:resource] & 0x2000000000 != 0 ) # Resource contains HOST
                rights_hash = HOST_RIGHTS
            elsif ( row[:resource] & 0x0000050000000000 != 0 ) # Resource contains USER or GROUP
                rights_hash = USER_GROUP_RIGHTS
            else
                rights_hash = RIGHTS
            end

            rights_hash.each { |k,v|
                if ( rights & k != 0 )
                    new_rights = new_rights | v
                end
            }

            if ( new_rights != 0 )
                @db[:acl].insert(
                    :oid        => row[:oid],
                    :user       => row[:user],
                    :resource   => row[:resource],
                    :rights     => new_rights.to_s)
            else
                puts  "    > ACL Rule ##{row[:oid]} will be deleted because it\n" <<
                      "      only contained deprecated rights INFO_POOL or INFO_POOL_MINE"
            end
        end

        @db.run "DROP TABLE old_acl;"


        ########################################################################
        # Add new permission attributes to resources
        ########################################################################

        @db.run "ALTER TABLE group_pool RENAME TO old_group_pool;"
        @db.run "CREATE TABLE group_pool (oid INTEGER PRIMARY KEY, name VARCHAR(128), body TEXT, uid INTEGER, gid INTEGER, owner_u INTEGER, group_u INTEGER, other_u INTEGER, UNIQUE(name));"

        @db.fetch("SELECT * FROM old_group_pool") do |row|
            @db[:group_pool].insert(
                :oid        => row[:oid],
                :name       => row[:name],
                :body       => row[:body],
                :uid        => "0",
                :gid        => row[:oid],
                :owner_u    => "1",
                :group_u    => "1",
                :other_u    => "0")
        end

        @db.run "DROP TABLE old_group_pool;"


        @db.run "ALTER TABLE host_pool RENAME TO old_host_pool;"
        @db.run "CREATE TABLE host_pool (oid INTEGER PRIMARY KEY, name VARCHAR(128), body TEXT, state INTEGER, last_mon_time INTEGER, uid INTEGER, gid INTEGER, owner_u INTEGER, group_u INTEGER, other_u INTEGER, UNIQUE(name));"

        @db.fetch("SELECT * FROM old_host_pool") do |row|
            @db[:host_pool].insert(
                :oid            => row[:oid],
                :name           => row[:name],
                :body           => row[:body],
                :state          => row[:state],
                :last_mon_time  => row[:last_mon_time],
                :uid            => "0",
                :gid            => row[:oid],
                :owner_u        => "1",
                :group_u        => "0",
                :other_u        => "0")
        end

        @db.run "DROP TABLE old_host_pool;"


        @db.run "ALTER TABLE user_pool RENAME TO old_user_pool;"
        @db.run "CREATE TABLE IF NOT EXISTS user_pool (oid INTEGER PRIMARY KEY, name VARCHAR(128), body TEXT, uid INTEGER, gid INTEGER, owner_u INTEGER, group_u INTEGER, other_u INTEGER, UNIQUE(name));"

        @db.fetch("SELECT * FROM old_user_pool") do |row|
            doc = Document.new(row[:body])

            gid = "1"
            doc.root.each_element("GID") { |e|
                gid = e.text
            }

            @db[:user_pool].insert(
                :oid        => row[:oid],
                :name       => row[:name],
                :body       => row[:body],
                :uid        => row[:oid],
                :gid        => gid,
                :owner_u    => "1",
                :group_u    => "0",
                :other_u    => "0")
        end

        @db.run "DROP TABLE old_user_pool;"


        @db.run "ALTER TABLE image_pool RENAME TO old_image_pool;"
        @db.run "CREATE TABLE image_pool (oid INTEGER PRIMARY KEY, name VARCHAR(128), body TEXT, uid INTEGER, gid INTEGER, owner_u INTEGER, group_u INTEGER, other_u INTEGER, UNIQUE(name,uid) );"

        @db.fetch("SELECT * FROM old_image_pool") do |row|
            doc = Document.new(row[:body])

            # Delete PUBLIC elem
            pub_elem     = doc.root.delete_element("PUBLIC")
            public_value = pub_elem.text

            add_permissions(doc, public_value)

            @db[:image_pool].insert(
                :oid        => row[:oid],
                :name       => row[:name],
                :body       => doc.root.to_s,
                :uid        => row[:uid],
                :gid        => row[:gid],
                :owner_u    => "1",
                :group_u    => public_value,
                :other_u    => "0")
        end

        @db.run "DROP TABLE old_image_pool;"


        @db.run "ALTER TABLE vm_pool RENAME TO old_vm_pool;"
        @db.run "CREATE TABLE vm_pool (oid INTEGER PRIMARY KEY, name VARCHAR(128), body TEXT, uid INTEGER, gid INTEGER, last_poll INTEGER, state INTEGER, lcm_state INTEGER, owner_u INTEGER, group_u INTEGER, other_u INTEGER);"

        @db.fetch("SELECT * FROM old_vm_pool") do |row|
            doc = Document.new(row[:body])

            # There is no PUBLIC elem
            public_value = "0"

            add_permissions(doc, public_value)

            @db[:vm_pool].insert(
                :oid        => row[:oid],
                :name       => row[:name],
                :body       => doc.root.to_s,
                :uid        => row[:uid],
                :gid        => row[:gid],
                :last_poll  => row[:last_poll],
                :state      => row[:state],
                :lcm_state  => row[:lcm_state],
                :owner_u    => "1",
                :group_u    => public_value,
                :other_u    => "0")
        end

        @db.run "DROP TABLE old_vm_pool;"


        @db.run "ALTER TABLE network_pool RENAME TO old_network_pool;"
        @db.run "CREATE TABLE network_pool (oid INTEGER PRIMARY KEY, name VARCHAR(128), body TEXT, uid INTEGER, gid INTEGER, owner_u INTEGER, group_u INTEGER, other_u INTEGER, UNIQUE(name,uid));"

        @db.fetch("SELECT * FROM old_network_pool") do |row|
            doc = Document.new(row[:body])

            # Delete PUBLIC elem
            pub_elem     = doc.root.delete_element("PUBLIC")
            public_value = pub_elem.text

            add_permissions(doc, public_value)

            @db[:network_pool].insert(
                :oid        => row[:oid],
                :name       => row[:name],
                :body       => doc.root.to_s,
                :uid        => row[:uid],
                :gid        => row[:gid],
                :owner_u    => "1",
                :group_u    => public_value,
                :other_u    => "0")
        end

        @db.run "DROP TABLE old_network_pool;"


        @db.run "ALTER TABLE template_pool RENAME TO old_template_pool;"
        @db.run "CREATE TABLE template_pool (oid INTEGER PRIMARY KEY, name VARCHAR(128), body TEXT, uid INTEGER, gid INTEGER, owner_u INTEGER, group_u INTEGER, other_u INTEGER);"

        @db.fetch("SELECT * FROM old_template_pool") do |row|
            doc = Document.new(row[:body])

            # Delete PUBLIC elem
            pub_elem     = doc.root.delete_element("PUBLIC")
            public_value = pub_elem.text

            add_permissions(doc, public_value)

            @db[:template_pool].insert(
                :oid        => row[:oid],
                :name       => row[:name],
                :body       => doc.root.to_s,
                :uid        => row[:uid],
                :gid        => row[:gid],
                :owner_u    => "1",
                :group_u    => public_value,
                :other_u    => "0")
        end

        @db.run "DROP TABLE old_template_pool;"


        return true
    end

    def add_permissions(doc, public_value)
        perm_elem = doc.root.add_element("PERMISSIONS")

        perm_elem.add_element("OWNER_U").text = "1"
        perm_elem.add_element("OWNER_M").text = "1"
        perm_elem.add_element("OWNER_A").text = "0"

        perm_elem.add_element("GROUP_U").text = public_value
        perm_elem.add_element("GROUP_M").text = "0"
        perm_elem.add_element("GROUP_A").text = "0"

        perm_elem.add_element("OTHER_U").text = "0"
        perm_elem.add_element("OTHER_M").text = "0"
        perm_elem.add_element("OTHER_A").text = "0"
    end
end
