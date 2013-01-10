# -------------------------------------------------------------------------- #
# Copyright 2002-2013, OpenNebula Project Leads (OpenNebula.org)             #
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
        "3.6.1"
    end

    def one_version
        "OpenNebula 3.6.1"
    end

    def up
        ########################################################################
        # Bug #1335: Add suspended VMs resoureces to Host usage
        ########################################################################
        @db.fetch("SELECT * FROM vm_pool WHERE state = 5") do |row|

            vm_doc = Document.new(row[:body])

            memory = 0
            vm_doc.root.each_element("TEMPLATE/MEMORY") { |e|
                memory = e.text.to_i
            }

            cpu = 0
            vm_doc.root.each_element("TEMPLATE/CPU") { |e|
                cpu = e.text.to_f
            }

            hid = -1
            vm_doc.root.each_element("HISTORY_RECORDS/HISTORY[last()]/HID") { |e|
                hid = e.text.to_i
            }


            host_row = nil
            @db.fetch("SELECT * FROM host_pool WHERE oid = #{hid}") do |hrow|
                host_row = hrow
            end

            host_doc = Document.new(host_row[:body])

            host_doc.root.each_element("HOST_SHARE/MEM_USAGE") { |e|
                mem_usage = e.text.to_i
                e.text = (mem_usage + (memory * 1024)).to_s
            }

            host_doc.root.each_element("HOST_SHARE/CPU_USAGE") { |e|
                cpu_usage = e.text.to_i
                e.text = (cpu_usage + (cpu * 100)).to_s
            }

            host_doc.root.each_element("HOST_SHARE/RUNNING_VMS") { |e|
                e.text = (e.text.to_i + 1).to_s
            }

            @db.run("DELETE FROM host_pool WHERE oid = #{host_row[:oid]}")

            @db[:host_pool].insert(
                :oid            => host_row[:oid],
                :name           => host_row[:name],
                :body           => host_doc.root.to_s,
                :state          => host_row[:state],
                :last_mon_time  => host_row[:last_mon_time],
                :uid            => host_row[:uid],
                :gid            => host_row[:gid],
                :owner_u        => host_row[:owner_u],
                :group_u        => host_row[:group_u],
                :other_u        => host_row[:other_u])
        end

        ########################################################################
        # Bugs #1347 & #1363: re-calculate CPU & MEM quotas
        ########################################################################

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

            redo_vm_quotas(doc, "uid=#{row[:oid]}")

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

        return true
    end

    def redo_vm_quotas(doc, where_filter)
        cpu_limit = "0"
        mem_limit = "0"
        vms_limit = "0"

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

        @db.fetch("SELECT body FROM vm_pool WHERE #{where_filter} AND state<>6") do |vm_row|
            vmdoc = Document.new(vm_row[:body])

            # VM quotas
            vmdoc.root.each_element("TEMPLATE/CPU") { |e|
                cpu_used += e.text.to_f
            }

            vmdoc.root.each_element("TEMPLATE/MEMORY") { |e|
                mem_used += e.text.to_i
            }

            vms_used += 1
        end

        # VM quotas
        vm_elem = vm_quota.add_element("VM")

        vm_elem.add_element("CPU").text = cpu_limit
        vm_elem.add_element("CPU_USED").text = sprintf('%.2f', cpu_used)

        vm_elem.add_element("MEMORY").text = mem_limit
        vm_elem.add_element("MEMORY_USED").text = mem_used.to_s

        vm_elem.add_element("VMS").text = vms_limit
        vm_elem.add_element("VMS_USED").text = vms_used.to_s
    end
end
