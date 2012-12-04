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

require 'set'
require "rexml/document"
include REXML

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

        ########################################################################
        # Image
        #
        # IMAGE/CLONING_OPS
        # IMAGE/CLONES/ID
        ########################################################################

        @db.run "CREATE TABLE image_pool_new (oid INTEGER PRIMARY KEY, name VARCHAR(128), body TEXT, uid INTEGER, gid INTEGER, owner_u INTEGER, group_u INTEGER, other_u INTEGER, UNIQUE(name,uid) );"

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

        # Rename table
        @db.run("DROP TABLE image_pool")
        @db.run("ALTER TABLE image_pool_new RENAME TO image_pool")


        ########################################################################
        # Feature #1611: Default quotas
        ########################################################################

        @db.run("CREATE TABLE IF NOT EXISTS system_attributes (name VARCHAR(128) PRIMARY KEY, body TEXT)")
        @db.run("INSERT INTO system_attributes VALUES('DEFAULT_GROUP_QUOTAS','<DEFAULT_GROUP_QUOTAS><DATASTORE_QUOTA></DATASTORE_QUOTA><NETWORK_QUOTA></NETWORK_QUOTA><VM_QUOTA></VM_QUOTA><IMAGE_QUOTA></IMAGE_QUOTA></DEFAULT_GROUP_QUOTAS>');")
        @db.run("INSERT INTO system_attributes VALUES('DEFAULT_USER_QUOTAS','<DEFAULT_USER_QUOTAS><DATASTORE_QUOTA></DATASTORE_QUOTA><NETWORK_QUOTA></NETWORK_QUOTA><VM_QUOTA></VM_QUOTA><IMAGE_QUOTA></IMAGE_QUOTA></DEFAULT_USER_QUOTAS>');")


        @db.run "ALTER TABLE user_pool RENAME TO old_user_pool;"
        @db.run "CREATE TABLE user_pool (oid INTEGER PRIMARY KEY, name VARCHAR(128), body TEXT, uid INTEGER, gid INTEGER, owner_u INTEGER, group_u INTEGER, other_u INTEGER, UNIQUE(name));"

        # oneadmin does not have quotas
        @db.fetch("SELECT * FROM old_user_pool WHERE oid=0") do |row|
            @db[:user_pool].insert(
                :oid        => row[:oid],
                :name       => row[:name],
                :body       => row[:body],
                :uid        => row[:oid],
                :gid        => row[:gid],
                :owner_u    => row[:owner_u],
                :group_u    => row[:group_u],
                :other_u    => row[:other_u])
        end

        @db.fetch("SELECT * FROM old_user_pool WHERE oid>0") do |row|
            doc = Document.new(row[:body])

            set_default_quotas(doc)

            @db[:user_pool].insert(
                :oid        => row[:oid],
                :name       => row[:name],
                :body       => doc.root.to_s,
                :uid        => row[:oid],
                :gid        => row[:gid],
                :owner_u    => row[:owner_u],
                :group_u    => row[:group_u],
                :other_u    => row[:other_u])
        end

        @db.run "DROP TABLE old_user_pool;"


        @db.run "ALTER TABLE group_pool RENAME TO old_group_pool;"
        @db.run "CREATE TABLE group_pool (oid INTEGER PRIMARY KEY, name VARCHAR(128), body TEXT, uid INTEGER, gid INTEGER, owner_u INTEGER, group_u INTEGER, other_u INTEGER, UNIQUE(name));"


        # oneadmin group does not have quotas
        @db.fetch("SELECT * FROM old_group_pool WHERE oid=0") do |row|
            @db[:group_pool].insert(
                :oid        => row[:oid],
                :name       => row[:name],
                :body       => row[:body],
                :uid        => row[:oid],
                :gid        => row[:gid],
                :owner_u    => row[:owner_u],
                :group_u    => row[:group_u],
                :other_u    => row[:other_u])
        end

        @db.fetch("SELECT * FROM old_group_pool WHERE oid>0") do |row|
            doc = Document.new(row[:body])

            set_default_quotas(doc)

            @db[:group_pool].insert(
                :oid        => row[:oid],
                :name       => row[:name],
                :body       => doc.root.to_s,
                :uid        => row[:oid],
                :gid        => row[:gid],
                :owner_u    => row[:owner_u],
                :group_u    => row[:group_u],
                :other_u    => row[:other_u])
        end

        @db.run "DROP TABLE old_group_pool;"


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

        doc.root.each_element("VM_QUOTA/VM/CPU") do |e|
            e.text = "-1" if e.text.to_f == 0
        end

        doc.root.each_element("VM_QUOTA/VM/MEMORY") do |e|
            e.text = "-1" if e.text.to_i == 0
        end

        doc.root.each_element("VM_QUOTA/VM/VMS") do |e|
            e.text = "-1" if e.text.to_i == 0
        end

        # VNet quotas

        doc.root.each_element("NETWORK_QUOTA/NETWORK/LEASES") do |e|
            e.text = "-1" if e.text.to_i == 0
        end

        # Image quotas

        doc.root.each_element("IMAGE_QUOTA/IMAGE/RVMS") do |e|
            e.text = "-1" if e.text.to_i == 0
        end

        # Datastore quotas

        doc.root.each_element("DATASTORE_QUOTA/DATASTORE/IMAGES") do |e|
            e.text = "-1" if e.text.to_i == 0
        end

        doc.root.each_element("DATASTORE_QUOTA/DATASTORE/SIZE") do |e|
            e.text = "-1" if e.text.to_i == 0
        end
    end
end
