# -------------------------------------------------------------------------- #
# Copyright 2002-2013, OpenNebula Project (OpenNebula.org), C12G Labs        #
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

require 'rexml/document'

module Migrator
    def db_version
        "4.3.80"
    end

    def one_version
        "OpenNebula 4.3.80"
    end

    def up

        ########################################################################
        # Feature #1742 & #1612
        ########################################################################

        @db.run "ALTER TABLE user_pool RENAME TO old_user_pool;"
        @db.run "CREATE TABLE user_pool (oid INTEGER PRIMARY KEY, name VARCHAR(128), body MEDIUMTEXT, uid INTEGER, gid INTEGER, owner_u INTEGER, group_u INTEGER, other_u INTEGER, UNIQUE(name));"

        @db.fetch("SELECT * FROM old_user_pool") do |row|
            doc = REXML::Document.new(row[:body])

            doc.root.add_element("GROUPS").add_element("ID").text = row[:gid].to_s

            # oneadmin does not have quotas
            if row[:oid] != 0
                redo_vm_quotas(doc, "uid=#{row[:oid]}")
            end

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

        ########################################################################
        # Feature #1612
        ########################################################################

        @db.run "ALTER TABLE group_pool RENAME TO old_group_pool;"
        @db.run "CREATE TABLE group_pool (oid INTEGER PRIMARY KEY, name VARCHAR(128), body MEDIUMTEXT, uid INTEGER, gid INTEGER, owner_u INTEGER, group_u INTEGER, other_u INTEGER, UNIQUE(name));"

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
            doc = REXML::Document.new(row[:body])

            redo_vm_quotas(doc, "gid=#{row[:oid]}")

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
        # Bug #2330
        ########################################################################

        @db.run "ALTER TABLE datastore_pool RENAME TO old_datastore_pool;"
        @db.run "CREATE TABLE datastore_pool (oid INTEGER PRIMARY KEY, name VARCHAR(128), body MEDIUMTEXT, uid INTEGER, gid INTEGER, owner_u INTEGER, group_u INTEGER, other_u INTEGER, cid INTEGER, UNIQUE(name));"

        @db.fetch("SELECT * FROM old_datastore_pool") do |row|
            doc = REXML::Document.new(row[:body])

            doc.root.each_element("TEMPLATE/HOST") do |e|
                e.name = "BRIDGE_LIST"
            end

            @db[:datastore_pool].insert(
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

        @db.run "DROP TABLE old_datastore_pool;"

        return true
    end

    def redo_vm_quotas(doc, where_filter)
        cpu_limit = "-1"
        mem_limit = "-1"
        vms_limit = "-1"
        vol_limit = "-1"

        doc.root.each_element("VM_QUOTA/VM/CPU") { |e|
            cpu_limit = e.text
        }

        doc.root.each_element("VM_QUOTA/VM/MEMORY") { |e|
            mem_limit = e.text
        }

        doc.root.each_element("VM_QUOTA/VM/VMS") { |e|
            vms_limit = e.text
        }

        doc.root.delete_element("VM_QUOTA")
        vm_quota  = doc.root.add_element("VM_QUOTA")

        # VM quotas
        cpu_used = 0
        mem_used = 0
        vms_used = 0
        vol_used = 0

        @db.fetch("SELECT body FROM vm_pool WHERE #{where_filter} AND state<>6") do |vm_row|
            vmdoc = REXML::Document.new(vm_row[:body])

            # VM quotas
            vmdoc.root.each_element("TEMPLATE/CPU") { |e|
                cpu_used += e.text.to_f
            }

            vmdoc.root.each_element("TEMPLATE/MEMORY") { |e|
                mem_used += e.text.to_i
            }

            vmdoc.root.each_element("TEMPLATE/DISK") { |e|
                type = ""

                e.each_element("TYPE") { |t_elem|
                    type = t_elem.text.upcase
                }

                if ( type == "SWAP" || type == "FS")
                    e.each_element("SIZE") { |size_elem|
                        vol_used += size_elem.text.to_f
                    }
                end
            }

            vms_used += 1
        end

        if (vms_used != 0 ||
            cpu_limit != "-1" || mem_limit != "-1" || vms_limit != "-1" || vol_limit != "-1" )

            # VM quotas
            vm_elem = vm_quota.add_element("VM")

            vm_elem.add_element("CPU").text = cpu_limit
            vm_elem.add_element("CPU_USED").text = sprintf('%.2f', cpu_used)

            vm_elem.add_element("MEMORY").text = mem_limit
            vm_elem.add_element("MEMORY_USED").text = mem_used.to_s

            vm_elem.add_element("VMS").text = vms_limit
            vm_elem.add_element("VMS_USED").text = vms_used.to_s

            vm_elem.add_element("VOLATILE_SIZE").text = vol_limit
            vm_elem.add_element("VOLATILE_SIZE_USED").text = sprintf('%.2f', vol_used)
        end
    end

end
