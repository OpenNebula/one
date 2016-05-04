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

require "rexml/document"
include REXML

module Migrator
    def db_version
        "3.5.80"
    end

    def one_version
        "OpenNebula 3.5.80"
    end

    def up

        oneadmin_row = nil
        @db.fetch("SELECT * FROM user_pool WHERE oid = 0") do |row|
            oneadmin_row = row
        end

        if oneadmin_row[:gid] != 0

            puts  "    > Oneadmin user will be moved to the oneadmin group"

            # Change user group

            doc = Document.new(oneadmin_row[:body])

            doc.root.each_element("GID") { |e|
                e.text = "0"
            }

            doc.root.each_element("GNAME") { |e|
                e.text = "oneadmin"
            }

            @db[:user_pool].filter(:oid=>0).delete

            @db[:user_pool].insert(
                :oid        => oneadmin_row[:oid],
                :name       => oneadmin_row[:name],
                :body       => doc.root.to_s,
                :uid        => oneadmin_row[:oid],
                :gid        => 0,
                :owner_u    => oneadmin_row[:owner_u],
                :group_u    => oneadmin_row[:group_u],
                :other_u    => oneadmin_row[:other_u])

            # Remove oneadmin's id from previous group

            group_row = nil

            @db.fetch("SELECT * FROM group_pool WHERE oid = #{oneadmin_row[:gid]}") do |row|
                group_row = row
            end

            doc = Document.new(group_row[:body])

            doc.root.delete_element("USERS/ID[.=0]")

            @db[:group_pool].filter(:oid=>group_row[:oid]).delete

            @db[:group_pool].insert(
                :oid        => group_row[:oid],
                :name       => group_row[:name],
                :body       => doc.root.to_s,
                :uid        => group_row[:oid],
                :gid        => group_row[:gid],
                :owner_u    => group_row[:owner_u],
                :group_u    => group_row[:group_u],
                :other_u    => group_row[:other_u])

            # Add oneadmin's id to oneadmin group

            @db.fetch("SELECT * FROM group_pool WHERE oid = 0") do |row|
                group_row = row
            end

            doc = Document.new(group_row[:body])

            doc.root.get_elements("USERS")[0].add_element("ID").text = "0"

            @db[:group_pool].filter(:oid=>group_row[:oid]).delete

            @db[:group_pool].insert(
                :oid        => group_row[:oid],
                :name       => group_row[:name],
                :body       => doc.root.to_s,
                :uid        => group_row[:oid],
                :gid        => group_row[:gid],
                :owner_u    => group_row[:owner_u],
                :group_u    => group_row[:group_u],
                :other_u    => group_row[:other_u])
        end


        @db.run "ALTER TABLE datastore_pool RENAME TO old_datastore_pool;"
        @db.run "CREATE TABLE datastore_pool (oid INTEGER PRIMARY KEY, name VARCHAR(128), body TEXT, uid INTEGER, gid INTEGER, owner_u INTEGER, group_u INTEGER, other_u INTEGER, UNIQUE(name));"

        @db.fetch("SELECT * FROM old_datastore_pool") do |row|
            doc = Document.new(row[:body])

            doc.root.add_element("DISK_TYPE").text = "0"

            @db[:datastore_pool].insert(
                :oid        => row[:oid],
                :name       => row[:name],
                :body       => doc.root.to_s,
                :uid        => row[:uid],
                :gid        => row[:gid],
                :owner_u    => row[:owner_u],
                :group_u    => row[:group_u],
                :other_u    => row[:other_u])
        end

        @db.run "DROP TABLE old_datastore_pool;"


        @db.run "ALTER TABLE image_pool RENAME TO old_image_pool;"
        @db.run "CREATE TABLE image_pool (oid INTEGER PRIMARY KEY, name VARCHAR(128), body TEXT, uid INTEGER, gid INTEGER, owner_u INTEGER, group_u INTEGER, other_u INTEGER, UNIQUE(name,uid) );"

        @db.fetch("SELECT * FROM old_image_pool") do |row|
            doc = Document.new(row[:body])

            doc.root.add_element("DISK_TYPE").text = "0"
            doc.root.add_element("CLONING_ID").text = "-1"
            doc.root.add_element("CLONING_OPS").text = "0"

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


        @db.run "ALTER TABLE vm_pool RENAME TO old_vm_pool;"
        @db.run "CREATE TABLE vm_pool (oid INTEGER PRIMARY KEY, name VARCHAR(128), body TEXT, uid INTEGER, gid INTEGER, last_poll INTEGER, state INTEGER, lcm_state INTEGER, owner_u INTEGER, group_u INTEGER, other_u INTEGER);"

        @db.fetch("SELECT * FROM old_vm_pool") do |row|
            doc = Document.new(row[:body])

            doc.root.add_element("RESCHED").text = "0"

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
        @db.run "CREATE TABLE history (vid INTEGER, seq INTEGER, body TEXT, stime INTEGER, etime INTEGER, PRIMARY KEY(vid,seq));"

        @db.fetch("SELECT * FROM old_history") do |row|
            doc = Document.new(row[:body])

            doc.root.add_element("OID").text = row[:vid].to_s

            stime = "0"
            doc.root.each_element("STIME") { |e|
                stime = e.text
            }

            etime = "0"
            doc.root.each_element("ETIME") { |e|
                etime = e.text
            }

            @db.fetch("SELECT body FROM vm_pool WHERE oid = #{row[:vid]}") do |vm_row|
                vm_doc = Document.new(vm_row[:body])

                vm_doc.root.delete_element( '/VM/HISTORY_RECORDS/HISTORY' )

                ["MEMORY", "CPU", "NET_TX", "NET_RX"].each { |elem_name|
                    vm_doc.root.each_element(elem_name) { |e|
                        e.text = "0"
                    }
                }

                doc.root.add_element( vm_doc )
            end

            @db[:history].insert(
                :vid        => row[:vid],
                :seq        => row[:seq],
                :body       => doc.root.to_s,
                :stime      => stime,
                :etime      => etime)
        end

        @db.run "DROP TABLE old_history;"


        @db.run "ALTER TABLE user_pool RENAME TO old_user_pool;"
        @db.run "CREATE TABLE user_pool (oid INTEGER PRIMARY KEY, name VARCHAR(128), body TEXT, uid INTEGER, gid INTEGER, owner_u INTEGER, group_u INTEGER, other_u INTEGER, UNIQUE(name));"

        # oneadmin does not have quotas
        @db.fetch("SELECT * FROM old_user_pool WHERE oid=0") do |row|
            doc = Document.new(row[:body])

            ds_quota = doc.root.add_element("DATASTORE_QUOTA")
            net_quota = doc.root.add_element("NETWORK_QUOTA")
            vm_quota  = doc.root.add_element("VM_QUOTA")
            img_quota = doc.root.add_element("IMAGE_QUOTA")

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

        @db.fetch("SELECT * FROM old_user_pool WHERE oid>0") do |row|
            doc = Document.new(row[:body])

            calculate_quotas(doc, "uid=#{row[:oid]}")

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
            doc = Document.new(row[:body])

            ds_quota = doc.root.add_element("DATASTORE_QUOTA")
            net_quota = doc.root.add_element("NETWORK_QUOTA")
            vm_quota  = doc.root.add_element("VM_QUOTA")
            img_quota = doc.root.add_element("IMAGE_QUOTA")

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

        @db.fetch("SELECT * FROM old_group_pool WHERE oid>0") do |row|
            doc = Document.new(row[:body])

            calculate_quotas(doc, "gid=#{row[:oid]}")

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


        @db.run "CREATE TABLE document_pool (oid INTEGER PRIMARY KEY, name VARCHAR(128), body TEXT, type INTEGER, uid INTEGER, gid INTEGER, owner_u INTEGER, group_u INTEGER, other_u INTEGER);"

        @db.run "CREATE TABLE host_monitoring (hid INTEGER, last_mon_time INTEGER, body TEXT, PRIMARY KEY(hid, last_mon_time));"
        @db.run "CREATE TABLE vm_monitoring (vmid INTEGER, last_poll INTEGER, body TEXT, PRIMARY KEY(vmid, last_poll));"

        return true
    end

    def calculate_quotas(doc, where_filter)
                    ds_quota  = doc.root.add_element("DATASTORE_QUOTA")
            net_quota = doc.root.add_element("NETWORK_QUOTA")
            vm_quota  = doc.root.add_element("VM_QUOTA")
            img_quota = doc.root.add_element("IMAGE_QUOTA")

            # VM quotas
            cpu_used = 0
            mem_used = 0
            vms_used = 0

            # VNet quotas
            vnet_usage = {}

            # Image quotas
            img_usage = {}

            @db.fetch("SELECT body FROM vm_pool WHERE #{where_filter} AND state!=6") do |vm_row|
                vmdoc = Document.new(vm_row[:body])

                # VM quotas
                vmdoc.root.each_element("TEMPLATE/CPU") { |e|
                    cpu_used += e.text.to_i
                }

                vmdoc.root.each_element("TEMPLATE/MEMORY") { |e|
                    mem_used += e.text.to_i
                }

                vms_used += 1

                # VNet quotas
                vmdoc.root.each_element("TEMPLATE/NIC/NETWORK_ID") { |e|
                    vnet_usage[e.text] = 0 if vnet_usage[e.text].nil?
                    vnet_usage[e.text] += 1
                }

                # Image quotas
                vmdoc.root.each_element("TEMPLATE/DISK/IMAGE_ID") { |e|
                    img_usage[e.text] = 0 if img_usage[e.text].nil?
                    img_usage[e.text] += 1
                }
            end

            # VM quotas
            vm_elem = vm_quota.add_element("VM")

            vm_elem.add_element("CPU").text = "0"
            vm_elem.add_element("CPU_USED").text = cpu_used.to_s

            vm_elem.add_element("MEMORY").text = "0"
            vm_elem.add_element("MEMORY_USED").text = mem_used.to_s

            vm_elem.add_element("VMS").text = "0"
            vm_elem.add_element("VMS_USED").text = vms_used.to_s

            # VNet quotas
            vnet_usage.each { |vnet_id, usage|
                new_elem = net_quota.add_element("NETWORK")

                new_elem.add_element("ID").text = vnet_id
                new_elem.add_element("LEASES").text = "0"
                new_elem.add_element("LEASES_USED").text = usage.to_s
            }

            # Image quotas
            img_usage.each { |img_id, usage|
                new_elem = img_quota.add_element("IMAGE")

                new_elem.add_element("ID").text = img_id
                new_elem.add_element("RVMS").text = "0"
                new_elem.add_element("RVMS_USED").text = usage.to_s
            }

            # Datastore quotas
            ds_usage = {}

            @db.fetch("SELECT body FROM image_pool WHERE #{where_filter}") do |img_row|
                img_doc = Document.new(img_row[:body])

                img_doc.root.each_element("DATASTORE_ID") { |e|
                    ds_usage[e.text] = [0,0] if ds_usage[e.text].nil?
                    ds_usage[e.text][0] += 1

                    img_doc.root.each_element("SIZE") { |size|
                        ds_usage[e.text][1] += size.text.to_i
                    }
                }
            end

            ds_usage.each { |ds_id, usage|
                new_elem = ds_quota.add_element("DATASTORE")

                new_elem.add_element("ID").text = ds_id
                new_elem.add_element("IMAGES").text = "0"
                new_elem.add_element("IMAGES_USED").text = usage[0].to_s
                new_elem.add_element("SIZE").text = "0"
                new_elem.add_element("SIZE_USED").text = usage[1].to_s
            }

    end
end
