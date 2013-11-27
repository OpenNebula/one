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

TM_MAD_CONF = {
    "dummy" => {
        :ln_target    => "NONE",
        :clone_target => "SYSTEM"
    },
    "lvm" => {
        :ln_target    => "NONE",
        :clone_target => "SELF"
    },
    "shared" => {
        :ln_target    => "NONE",
        :clone_target => "SYSTEM"
    },
    "shared_lvm" => {
        :ln_target    => "SYSTEM",
        :clone_target => "SYSTEM"
    },
    "qcow2" => {
        :ln_target    => "NONE",
        :clone_target => "SYSTEM"
    },
    "ssh" => {
        :ln_target    => "SYSTEM",
        :clone_target => "SYSTEM"
    },
    "vmfs" => {
        :ln_target    => "NONE",
        :clone_target => "SYSTEM"
    },
    "iscsi" => {
        :ln_target    => "NONE",
        :clone_target => "SELF"
    },
    "ceph" => {
        :ln_target    => "NONE",
        :clone_target => "SELF"
    }
}

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
        # Bug #2330 & Feature #1678
        ########################################################################

        @db.run "ALTER TABLE datastore_pool RENAME TO old_datastore_pool;"
        @db.run "CREATE TABLE datastore_pool (oid INTEGER PRIMARY KEY, name VARCHAR(128), body MEDIUMTEXT, uid INTEGER, gid INTEGER, owner_u INTEGER, group_u INTEGER, other_u INTEGER, cid INTEGER, UNIQUE(name));"

        #tm_mads = {}

        @db.fetch("SELECT * FROM old_datastore_pool") do |row|
            doc = REXML::Document.new(row[:body])

            doc.root.each_element("TEMPLATE/HOST") do |e|
                e.name = "BRIDGE_LIST"
            end

            tm_mad = ""
            doc.root.each_element("TM_MAD"){ |e| tm_mad = e.text }

            type = 0
            doc.root.each_element("TYPE"){ |e| type = e.text.to_i }

            if (type == 1) # System DS
                doc.root.each_element("TEMPLATE") do |e|
                    e.add_element("SHARED").text =
                        (tm_mad == "ssh" ? "NO" : "YES")
                end
            else
                #tm_mads[row[:oid].to_i] = tm_mad

                conf = TM_MAD_CONF[tm_mad]

                if conf.nil?
                    puts
                    puts "ATTENTION: manual intervention required".red
                    puts <<-END
The Datastore ##{row[:oid]} #{row[:name]} is using the
custom TM MAD '#{tm_mad}'. You will need to define new
configuration parameters in oned.conf for this driver, see
http://opennebula.org/documentation:rel4.4:upgrade
                    END
                else
                    doc.root.each_element("TEMPLATE") do |e|
                        e.add_element("LN_TARGET").text = conf[:ln_target]
                        e.add_element("CLONE_TARGET").text = conf[:clone_target]
                    end
                end
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

        ########################################################################
        # Feature #2392
        ########################################################################

        @db.run "ALTER TABLE vm_pool RENAME TO old_vm_pool;"
        @db.run "CREATE TABLE vm_pool (oid INTEGER PRIMARY KEY, name VARCHAR(128), body MEDIUMTEXT, uid INTEGER, gid INTEGER, last_poll INTEGER, state INTEGER, lcm_state INTEGER, owner_u INTEGER, group_u INTEGER, other_u INTEGER);"

        @db.fetch("SELECT * FROM old_vm_pool") do |row|
            doc = REXML::Document.new(row[:body])

            doc.root.each_element("HISTORY_RECORDS/HISTORY") do |e|
                update_history(e)
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

        @db.run "DROP TABLE old_vm_pool;"

        @db.run "ALTER TABLE history RENAME TO old_history;"
        @db.run "CREATE TABLE history (vid INTEGER, seq INTEGER, body MEDIUMTEXT, stime INTEGER, etime INTEGER,PRIMARY KEY(vid,seq));"

        @db.fetch("SELECT * FROM old_history") do |row|
            doc = REXML::Document.new(row[:body])

            doc.root.each_element("/HISTORY") do |e|
                update_history(e)
            end

            @db[:history].insert(
                :vid    => row[:vid],
                :seq    => row[:seq],
                :body   => doc.root.to_s,
                :stime  => row[:stime],
                :etime  => row[:etime])
        end

        @db.run "DROP TABLE old_history;"

        ########################################################################
        # Feature #1678
        ########################################################################

        @db.run "ALTER TABLE host_pool RENAME TO old_host_pool;"
        @db.run "CREATE TABLE host_pool (oid INTEGER PRIMARY KEY, name VARCHAR(128), body MEDIUMTEXT, state INTEGER, last_mon_time INTEGER, uid INTEGER, gid INTEGER, owner_u INTEGER, group_u INTEGER, other_u INTEGER, cid INTEGER, UNIQUE(name));"

        @db.fetch("SELECT * FROM old_host_pool") do |row|
            doc = REXML::Document.new(row[:body])

            doc.root.each_element("HOST_SHARE") do |e|
                e.add_element("DATASTORES")
            end

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
                :other_u        => row[:other_u],
                :cid            => row[:cid])
        end

        @db.run "DROP TABLE old_host_pool;"

        # TODO:
        # For Feature #1678, VMs have new disk elements:
        # VM/DISK/CLONE_TARGET
        # VM/DISK/LN_TARGET
        # VM/DISK/SIZE
        #
        # These elements are only used to schedule new deployments, so if we
        # don't add them it will only affect automatic deployment of VMs
        # recreated (onevm delete --recreate). Manual deployments will still
        # work without problems.

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
                        vol_used += size_elem.text.to_i
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
            vm_elem.add_element("VOLATILE_SIZE_USED").text = vol_used.to_s
        end
    end

    def update_history(history_elem)
        hid = nil

        history_elem.each_element("HID") do |e|
            hid = e.text
        end

        new_elem = history_elem.add_element("CID")
        new_elem.text = "-1" # Cluster None

        if hid.nil?
            return
        end

        @db.fetch("SELECT cid FROM host_pool WHERE oid = #{hid}") do |row|
            new_elem.text = row[:cid].to_s
        end
    end

end
