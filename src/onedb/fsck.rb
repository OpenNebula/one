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

require "rexml/document"
include REXML
require 'ipaddr'
require 'set'

module OneDBFsck
    VERSION = "4.0.1"

    def db_version
        VERSION
    end

    def one_version
        "OpenNebula #{VERSION}"
    end

    IMAGE_STATES=%w{INIT READY USED DISABLED LOCKED ERROR CLONE DELETE USED_PERS}

    def fsck

        ########################################################################
        # Acl
        ########################################################################

        ########################################################################
        # Users
        #
        # USER/GNAME
        ########################################################################

        ########################################################################
        # Datastore
        #
        # DATASTORE/UID
        # DATASTORE/UNAME
        # DATASTORE/GID
        # DATASTORE/GNAME
        # DATASTORE/SYSTEM ??
        ########################################################################

        ########################################################################
        # VM Template
        #
        # VMTEMPLATE/UID
        # VMTEMPLATE/UNAME
        # VMTEMPLATE/GID
        # VMTEMPLATE/GNAME
        ########################################################################

        ########################################################################
        # Documents
        #
        # DOCUMENT/UID
        # DOCUMENT/UNAME
        # DOCUMENT/GID
        # DOCUMENT/GNAME
        ########################################################################

        ########################################################################
        # VM
        #
        # VM/UID
        # VM/UNAME
        # VM/GID
        # VM/GNAME
        #
        # VM/STATE        <--- Check transitioning states?
        # VM/LCM_STATE    <---- Check consistency state/lcm_state ?
        ########################################################################

        ########################################################################
        # Image
        #
        # IMAGE/UID
        # IMAGE/UNAME
        # IMAGE/GID
        # IMAGE/GNAME
        ########################################################################

        ########################################################################
        # VNet
        #
        # VNET/UID
        # VNET/UNAME
        # VNET/GID
        # VNET/GNAME
        ########################################################################


        @errors = 0
        puts


        ########################################################################
        # pool_control
        ########################################################################

        tables = ["group_pool", "user_pool", "acl", "image_pool", "host_pool",
            "network_pool", "template_pool", "vm_pool", "cluster_pool",
            "datastore_pool", "document_pool"]

        tables.each do |table|
            max_oid = -1

            @db.fetch("SELECT MAX(oid) FROM #{table}") do |row|
                max_oid = row[:"MAX(oid)"].to_i
            end

            # max(oid) will return 0 if there is none,
            # or if the max is actually 0. Check this:
            if ( max_oid == 0 )
                max_oid = -1

                @db.fetch("SELECT oid FROM #{table} WHERE oid=0") do |row|
                    max_oid = 0
                end
            end

            control_oid = -1

            @db.fetch("SELECT last_oid FROM pool_control WHERE tablename='#{table}'") do |row|
                control_oid = row[:last_oid].to_i
            end

            if ( max_oid > control_oid )
                log_error("pool_control for table #{table} has last_oid #{control_oid}, but it is #{max_oid}")

                if control_oid != -1
                    @db.run("UPDATE pool_control SET last_oid=#{max_oid} WHERE tablename='#{table}'")
                else
                    @db[:pool_control].insert(
                        :tablename  => table,
                        :last_oid   => max_oid)
                end
            end
        end


        ########################################################################
        # Groups
        #
        # GROUP/USERS/ID
        ########################################################################

        ########################################################################
        # Users
        #
        # USER/GID
        ########################################################################

        group = {}

        @db.fetch("SELECT oid FROM group_pool") do |row|
            group[row[:oid]] = []
        end

        users_fix = {}

        @db.fetch("SELECT oid,body,gid FROM user_pool") do |row|
            doc = Document.new(row[:body])

            gid = doc.root.get_text('GID').to_s.to_i
            user_gid = gid

            if group[gid].nil?
                log_error("User #{row[:oid]} is in group #{gid}, but it does not exist")

                user_gid = 1

                doc.root.each_element('GID') do |e|
                    e.text = "1"
                end

                doc.root.each_element('GNAME') do |e|
                    e.text = "users"
                end

                users_fix[row[:oid]] = {:body => doc.to_s, :gid => user_gid}
            end

            if gid != row[:gid]
                log_error(
                    "User #{row[:oid]} is in group #{gid}, but the DB "<<
                    "table has GID column #{row[:gid]}")

                users_fix[row[:oid]] = {:body => doc.to_s, :gid => user_gid}
            end

            group[user_gid] << row[:oid]
        end

        users_fix.each do |id, user|
            @db[:user_pool].where(:oid => id).update(
                :body => user[:body],
                :gid => user[:gid])
        end



        @db.run "CREATE TABLE group_pool_new (oid INTEGER PRIMARY KEY, name VARCHAR(128), body MEDIUMTEXT, uid INTEGER, gid INTEGER, owner_u INTEGER, group_u INTEGER, other_u INTEGER, UNIQUE(name));"

        @db.fetch("SELECT * from group_pool") do |row|
            gid = row[:oid]
            doc = Document.new(row[:body])

            users_elem = doc.root.elements.delete("USERS")

            users_new_elem = doc.root.add_element("USERS")

            group[gid].each do |id|
                id_elem = users_elem.elements.delete("ID[.=#{id}]")

                if id_elem.nil?
                    log_error("User #{id} is missing fom Group #{gid} users id list")
                end

                users_new_elem.add_element("ID").text = id.to_s
            end

            users_elem.each_element("ID") do |id_elem|
                log_error("User #{id_elem.text} is in Group #{gid} users id list, but it should not")
            end

            row[:body] = doc.to_s

            # commit
            @db[:group_pool_new].insert(row)
        end

        # Rename table
        @db.run("DROP TABLE group_pool")
        @db.run("ALTER TABLE group_pool_new RENAME TO group_pool")


        ########################################################################
        # Clusters
        #
        # CLUSTER/SYSTEM_DS
        # CLUSTER/HOSTS/ID
        # CLUSTER/DATASTORES/ID
        # CLUSTER/VNETS/ID
        ########################################################################
        # Datastore
        #
        # DATASTORE/CLUSTER_ID
        # DATASTORE/CLUSTER
        ########################################################################
        # VNet
        #
        # VNET/CLUSTER_ID
        # VNET/CLUSTER
        ########################################################################
        # Hosts
        #
        # HOST/CLUSTER_ID
        # HOST/CLUSTER
        ########################################################################

        cluster = {}

        @db.fetch("SELECT oid FROM cluster_pool") do |row|
            cluster[row[:oid]] = {}

            cluster[row[:oid]][:hosts]      = []
            cluster[row[:oid]][:datastores] = []
            cluster[row[:oid]][:vnets]      = []

            cluster[row[:oid]][:system_ds]  = 0
        end

        hosts_fix       = {}
        datastores_fix  = {}
        vnets_fix       = {}

        @db.fetch("SELECT oid,body FROM host_pool") do |row|
            doc = Document.new(row[:body])

            cluster_id = doc.root.get_text('CLUSTER_ID').to_s.to_i

            if cluster_id != -1
                if cluster[cluster_id].nil?
                    log_error("Host #{row[:oid]} is in cluster #{cluster_id}, but it does not exist")

                    doc.root.each_element('CLUSTER_ID') do |e|
                        e.text = "-1"
                    end

                    doc.root.each_element('CLUSTER') do |e|
                        e.text = ""
                    end

                    hosts_fix[row[:oid]] = doc.to_s
                else
                    cluster[cluster_id][:hosts] << row[:oid]
                end
            end
        end

        hosts_fix.each do |id, body|
            @db[:host_pool].where(:oid => id).update(:body => body, :cid => -1)
        end


        @db.fetch("SELECT oid,body FROM datastore_pool") do |row|
            doc = Document.new(row[:body])

            cluster_id = doc.root.get_text('CLUSTER_ID').to_s.to_i

            if cluster_id != -1
                if cluster[cluster_id].nil?
                    log_error("Datastore #{row[:oid]} is in cluster #{cluster_id}, but it does not exist")

                    doc.root.each_element('CLUSTER_ID') do |e|
                        e.text = "-1"
                    end

                    doc.root.each_element('CLUSTER') do |e|
                        e.text = ""
                    end

                    datastores_fix[row[:oid]] = doc.to_s
                else
                    if doc.root.get_text('TYPE').to_s != "1"
                        cluster[cluster_id][:datastores] << row[:oid]
                    else
                        if cluster[cluster_id][:system_ds] == 0
                            cluster[cluster_id][:datastores] << row[:oid]
                            cluster[cluster_id][:system_ds] = row[:oid]
                        else
                            log_error("System Datastore #{row[:oid]} is in Cluster #{cluster_id}, but it already contains System Datastore #{cluster[cluster_id][:system_ds]}")

                            doc.root.each_element('CLUSTER_ID') do |e|
                                e.text = "-1"
                            end

                            doc.root.each_element('CLUSTER') do |e|
                                e.text = ""
                            end

                            datastores_fix[row[:oid]] = doc.to_s
                        end
                    end
                end
            end
        end

        datastores_fix.each do |id, body|
            @db[:datastore_pool].where(:oid => id).update(:body => body, :cid => -1)
        end


        @db.fetch("SELECT oid,body FROM network_pool") do |row|
            doc = Document.new(row[:body])

            cluster_id = doc.root.get_text('CLUSTER_ID').to_s.to_i

            if cluster_id != -1
                if cluster[cluster_id].nil?
                    log_error("VNet #{row[:oid]} is in cluster #{cluster_id}, but it does not exist")

                    doc.root.each_element('CLUSTER_ID') do |e|
                        e.text = "-1"
                    end

                    doc.root.each_element('CLUSTER') do |e|
                        e.text = ""
                    end

                    vnets_fix[row[:oid]] = doc.to_s
                else
                    cluster[cluster_id][:vnets] << row[:oid]
                end
            end
        end

        vnets_fix.each do |id, body|
            @db[:network_pool].where(:oid => id).update(:body => body, :cid => -1)
        end


        @db.run "CREATE TABLE cluster_pool_new (oid INTEGER PRIMARY KEY, name VARCHAR(128), body MEDIUMTEXT, uid INTEGER, gid INTEGER, owner_u INTEGER, group_u INTEGER, other_u INTEGER, UNIQUE(name));"

        @db.fetch("SELECT * from cluster_pool") do |row|
            cluster_id = row[:oid]
            doc = Document.new(row[:body])

            # Hosts
            hosts_elem = doc.root.elements.delete("HOSTS")

            hosts_new_elem = doc.root.add_element("HOSTS")

            cluster[cluster_id][:hosts].each do |id|
                id_elem = hosts_elem.elements.delete("ID[.=#{id}]")

                if id_elem.nil?
                    log_error("Host #{id} is missing fom Cluster #{cluster_id} host id list")
                end

                hosts_new_elem.add_element("ID").text = id.to_s
            end

            hosts_elem.each_element("ID") do |id_elem|
                log_error("Host #{id_elem.text} is in Cluster #{cluster_id} host id list, but it should not")
            end


            # Datastores
            ds_elem = doc.root.elements.delete("DATASTORES")

            ds_new_elem = doc.root.add_element("DATASTORES")

            doc.root.each_element("SYSTEM_DS") do |e|
                system_ds = e.text.to_i

                if system_ds != cluster[cluster_id][:system_ds]
                    log_error("Cluster #{cluster_id} has System Datastore set to #{system_ds}, but it should be #{cluster[cluster_id][:system_ds]}")

                    e.text = cluster[cluster_id][:system_ds].to_s
                end
            end

            cluster[cluster_id][:datastores].each do |id|
                id_elem = ds_elem.elements.delete("ID[.=#{id}]")

                if id_elem.nil?
                    log_error("Datastore #{id} is missing fom Cluster #{cluster_id} datastore id list")
                end

                ds_new_elem.add_element("ID").text = id.to_s
            end

            ds_elem.each_element("ID") do |id_elem|
                log_error("Datastore #{id_elem.text} is in Cluster #{cluster_id} datastore id list, but it should not")
            end


            # VNets
            vnets_elem = doc.root.elements.delete("VNETS")

            vnets_new_elem = doc.root.add_element("VNETS")

            cluster[cluster_id][:vnets].each do |id|
                id_elem = vnets_elem.elements.delete("ID[.=#{id}]")

                if id_elem.nil?
                    log_error("VNet #{id} is missing fom Cluster #{cluster_id} vnet id list")
                end

                vnets_new_elem.add_element("ID").text = id.to_s
            end

            vnets_elem.each_element("ID") do |id_elem|
                log_error("VNet #{id_elem.text} is in Cluster #{cluster_id} vnet id list, but it should not")
            end


            row[:body] = doc.to_s

            # commit
            @db[:cluster_pool_new].insert(row)
        end

        # Rename table
        @db.run("DROP TABLE cluster_pool")
        @db.run("ALTER TABLE cluster_pool_new RENAME TO cluster_pool")


        ########################################################################
        # Datastore
        #
        # DATASTORE/IMAGES/ID
        ########################################################################
        # Image
        #
        # IMAGE/DATASTORE_ID
        # IMAGE/DATASTORE
        ########################################################################

        datastore = {}

        @db.fetch("SELECT oid FROM datastore_pool") do |row|
            datastore[row[:oid]] = []
        end

        images_fix = {}


        @db.fetch("SELECT oid,body FROM image_pool") do |row|
            doc = Document.new(row[:body])

            ds_id = doc.root.get_text('DATASTORE_ID').to_s.to_i

            if ds_id != -1
                if datastore[ds_id].nil?
                    log_error("Image #{row[:oid]} has datastore #{ds_id}, but it does not exist. It will be moved to the Datastore default (1), but it is probably unusable anymore")

                    doc.root.each_element('DATASTORE_ID') do |e|
                        e.text = "1"
                    end

                    doc.root.each_element('DATASTORE') do |e|
                        e.text = "default"
                    end

                    images_fix[row[:oid]] = doc.to_s

                    datastore[1] << row[:oid]
                else
                    datastore[ds_id] << row[:oid]
                end
            end
        end

        images_fix.each do |id, body|
            @db[:image_pool].where(:oid => id).update(:body => body)
        end


        @db.run "CREATE TABLE datastore_pool_new (oid INTEGER PRIMARY KEY, name VARCHAR(128), body MEDIUMTEXT, uid INTEGER, gid INTEGER, owner_u INTEGER, group_u INTEGER, other_u INTEGER, cid INTEGER, UNIQUE(name));"

        @db.fetch("SELECT * from datastore_pool") do |row|
            ds_id = row[:oid]
            doc = Document.new(row[:body])

            images_elem = doc.root.elements.delete("IMAGES")

            images_new_elem = doc.root.add_element("IMAGES")

            datastore[ds_id].each do |id|
                id_elem = images_elem.elements.delete("ID[.=#{id}]")

                if id_elem.nil?
                    log_error("Image #{id} is missing fom Datastore #{ds_id} image id list")
                end

                images_new_elem.add_element("ID").text = id.to_s
            end

            images_elem.each_element("ID") do |id_elem|
                log_error("Image #{id_elem.text} is in Cluster #{ds_id} image id list, but it should not")
            end


            row[:body] = doc.to_s

            # commit
            @db[:datastore_pool_new].insert(row)
        end

        # Rename table
        @db.run("DROP TABLE datastore_pool")
        @db.run("ALTER TABLE datastore_pool_new RENAME TO datastore_pool")

        ########################################################################
        # VM Counters for host, image and vnet usage
        ########################################################################

        counters = {}
        counters[:host]  = {}
        counters[:image] = {}
        counters[:vnet]  = {}

        # Initialize all the host counters to 0
        @db.fetch("SELECT oid FROM host_pool") do |row|
            counters[:host][row[:oid]] = {
                :memory => 0,
                :cpu    => 0,
                :rvms   => Set.new
            }
        end

        # Init image counters
        @db.fetch("SELECT oid,body FROM image_pool") do |row|
            if counters[:image][row[:oid]].nil?
                counters[:image][row[:oid]] = {
                    :vms    => Set.new,
                    :clones => Set.new
                }
            end

            doc = Document.new(row[:body])

            doc.root.each_element("CLONING_ID") do |e|
                img_id = e.text.to_i

                if counters[:image][img_id].nil?
                    counters[:image][img_id] = {
                        :vms    => Set.new,
                        :clones => Set.new
                    }
                end

                counters[:image][img_id][:clones].add(row[:oid])
            end
        end

        # Init vnet counters
        @db.fetch("SELECT oid,body FROM network_pool") do |row|
            doc = Document.new(row[:body])

            counters[:vnet][row[:oid]] = {
                :type           => doc.root.get_text('TYPE').to_s.to_i,
                :total_leases   => 0,
                :leases         => {}
            }
        end

        # Aggregate information of the RUNNING vms
        @db.fetch("SELECT oid,body FROM vm_pool WHERE state<>6") do |row|
            vm_doc = Document.new(row[:body])

            state     = vm_doc.root.get_text('STATE').to_s.to_i
            lcm_state = vm_doc.root.get_text('LCM_STATE').to_s.to_i


            # Images used by this VM
            vm_doc.root.each_element("TEMPLATE/DISK/IMAGE_ID") do |e|
                img_id = e.text.to_i

                if counters[:image][img_id].nil?
                    log_error("VM #{row[:oid]} is using Image #{img_id}, but it does not exist")
                else
                    counters[:image][img_id][:vms].add(row[:oid])
                end
            end

            # VNets used by this VM
            vm_doc.root.each_element("TEMPLATE/NIC") do |e|
                net_id = nil
                e.each_element("NETWORK_ID") do |nid|
                    net_id = nid.text.to_i
                end

                if !net_id.nil?
                    if counters[:vnet][net_id].nil?
                        log_error("VM #{row[:oid]} is using VNet #{net_id}, but it does not exist")
                    else
                        counters[:vnet][net_id][:leases][e.get_text('IP').to_s] =
                            [
                                e.get_text('MAC').to_s,                 # MAC
                                "1",                                    # USED
                                vm_doc.root.get_text('ID').to_s.to_i    # VID
                            ]
                    end
                end
            end

            # Host resources

            # Only states that add to Host resources consumption are
            # ACTIVE, SUSPENDED, POWEROFF
            next if !([3,5,8].include? state)

            # Get memory (integer)
            memory = 0
            vm_doc.root.each_element("TEMPLATE/MEMORY") { |e|
                memory = e.text.to_i
            }

            # Get CPU (float)
            cpu = 0
            vm_doc.root.each_element("TEMPLATE/CPU") { |e|
                cpu = e.text.to_f
            }

            # Get hostid
            hid = -1
            vm_doc.root.each_element("HISTORY_RECORDS/HISTORY[last()]/HID") { |e|
                hid = e.text.to_i
            }

            if counters[:host][hid].nil?
                log_error("VM #{row[:oid]} is using Host #{hid}, but it does not exist")
            else
                counters[:host][hid][:memory] += memory
                counters[:host][hid][:cpu]    += cpu
                counters[:host][hid][:rvms].add(row[:oid])
            end
        end



        ########################################################################
        # Hosts
        #
        # HOST/HOST_SHARE/MEM_USAGE
        # HOST/HOST_SHARE/CPU_USAGE
        # HOST/HOST_SHARE/RUNNING_VMS
        # HOST/VMS/ID
        ########################################################################

        # Create a new empty table where we will store the new calculated values
        @db.run "CREATE TABLE host_pool_new (oid INTEGER PRIMARY KEY, " <<
                "name VARCHAR(128), body MEDIUMTEXT, state INTEGER, " <<
                "last_mon_time INTEGER, uid INTEGER, gid INTEGER, " <<
                "owner_u INTEGER, group_u INTEGER, other_u INTEGER, " <<
                "cid INTEGER, UNIQUE(name));"

        # Calculate the host's xml and write them to host_pool_new
        @db[:host_pool].each do |row|
            host_doc = Document.new(row[:body])

            hid = row[:oid]

            rvms        = counters[:host][hid][:rvms].size
            cpu_usage   = (counters[:host][hid][:cpu]*100).to_i
            mem_usage   = counters[:host][hid][:memory]*1024

            # rewrite running_vms
            host_doc.root.each_element("HOST_SHARE/RUNNING_VMS") {|e|
                if e.text != rvms.to_s
                    log_error("Host #{hid} RUNNING_VMS has #{e.text} \tis\t#{rvms}")
                    e.text = rvms
                end
            }


            # re-do list of VM IDs 
            vms_elem = host_doc.root.elements.delete("VMS")

            vms_new_elem = host_doc.root.add_element("VMS")

            counters[:host][hid][:rvms].each do |id|
                id_elem = vms_elem.elements.delete("ID[.=#{id}]")

                if id_elem.nil?
                    log_error("VM #{id} is missing fom Host #{hid} VM id list")
                end

                vms_new_elem.add_element("ID").text = id.to_s
            end

            vms_elem.each_element("ID") do |id_elem|
                log_error("VM #{id_elem.text} is in Host #{hid} VM id list, but it should not")
            end


            # rewrite cpu
            host_doc.root.each_element("HOST_SHARE/CPU_USAGE") {|e|
                if e.text != cpu_usage.to_s
                    log_error("Host #{hid} CPU_USAGE has #{e.text} \tis\t#{cpu_usage}")
                    e.text = cpu_usage
                end
            }

            # rewrite memory
            host_doc.root.each_element("HOST_SHARE/MEM_USAGE") {|e|
                if e.text != mem_usage.to_s
                    log_error("Host #{hid} MEM_USAGE has #{e.text} \tis\t#{mem_usage}")
                    e.text = mem_usage
                end
            }

            row[:body] = host_doc.to_s

            # commit
            @db[:host_pool_new].insert(row)
        end

        # Rename table
        @db.run("DROP TABLE host_pool")
        @db.run("ALTER TABLE host_pool_new RENAME TO host_pool")


        ########################################################################
        # Image
        #
        # IMAGE/RUNNING_VMS
        # IMAGE/VMS/ID
        #
        # IMAGE/CLONING_OPS
        # IMAGE/CLONES/ID
        #
        # IMAGE/CLONING_ID
        #
        # IMAGE/STATE
        ########################################################################

        # Create a new empty table where we will store the new calculated values
        @db.run "CREATE TABLE image_pool_new (oid INTEGER PRIMARY KEY, name VARCHAR(128), body MEDIUMTEXT, uid INTEGER, gid INTEGER, owner_u INTEGER, group_u INTEGER, other_u INTEGER, UNIQUE(name,uid) );"

        # Calculate the host's xml and write them to host_pool_new
        @db[:image_pool].each do |row|
            doc = Document.new(row[:body])

            oid = row[:oid]

            persistent = ( doc.root.get_text('PERSISTENT').to_s == "1" )
            current_state = doc.root.get_text('STATE').to_s.to_i

            rvms            = counters[:image][oid][:vms].size
            n_cloning_ops   = counters[:image][oid][:clones].size

            # rewrite running_vms
            doc.root.each_element("RUNNING_VMS") {|e|
                if e.text != rvms.to_s
                    log_error("Image #{oid} RUNNING_VMS has #{e.text} \tis\t#{rvms}")
                    e.text = rvms
                end
            }

            # re-do list of VM IDs 
            vms_elem = doc.root.elements.delete("VMS")

            vms_new_elem = doc.root.add_element("VMS")

            counters[:image][oid][:vms].each do |id|
                id_elem = vms_elem.elements.delete("ID[.=#{id}]")

                if id_elem.nil?
                    log_error("VM #{id} is missing fom Image #{oid} VM id list")
                end

                vms_new_elem.add_element("ID").text = id.to_s
            end

            vms_elem.each_element("ID") do |id_elem|
                log_error("VM #{id_elem.text} is in Image #{oid} VM id list, but it should not")
            end


            if ( persistent && rvms > 0 )
                n_cloning_ops = 0
                counters[:image][oid][:clones] = Set.new
            end

            # Check number of clones
            doc.root.each_element("CLONING_OPS") { |e|
                if e.text != n_cloning_ops.to_s
                    log_error("Image #{oid} CLONING_OPS has #{e.text} \tis\t#{n_cloning_ops}")
                    e.text = n_cloning_ops
                end
            }

            # re-do list of Images cloning this one
            clones_elem = doc.root.elements.delete("CLONES")

            clones_new_elem = doc.root.add_element("CLONES")

            counters[:image][oid][:clones].each do |id|
                id_elem = clones_elem.elements.delete("ID[.=#{id}]")

                if id_elem.nil?
                    log_error("Image #{id} is missing fom Image #{oid} CLONES id list")
                end

                clones_new_elem.add_element("ID").text = id.to_s
            end

            clones_elem.each_element("ID") do |id_elem|
                log_error("Image #{id_elem.text} is in Image #{oid} CLONES id list, but it should not")
            end


            # Check state

            state = current_state

            if persistent
                if ( rvms > 0 )
                    state = 8   # USED_PERS
                elsif ( n_cloning_ops > 0 )
                    state = 6   # CLONE
                elsif ( current_state == 8 || current_state == 6 )
                    # rvms == 0 && n_cloning_ops == 0, but image is in state
                    # USED_PERS or CLONE

                    state = 1   # READY
                end
            else
                if ( rvms > 0 || n_cloning_ops > 0 )
                    state = 2   # USED
                elsif ( current_state == 2 )
                    # rvms == 0 && n_cloning_ops == 0, but image is in state
                    # USED

                    state = 1   # READY
                end
            end

            doc.root.each_element("STATE") { |e|
                if e.text != state.to_s
                    log_error("Image #{oid} has STATE #{IMAGE_STATES[e.text.to_i]} \tis\t#{IMAGE_STATES[state]}")
                    e.text = state
                end
            }

            row[:body] = doc.to_s

            # commit
            @db[:image_pool_new].insert(row)
        end

        # Rename table
        @db.run("DROP TABLE image_pool")
        @db.run("ALTER TABLE image_pool_new RENAME TO image_pool")


        ########################################################################
        # VNet
        #
        # LEASES
        ########################################################################

        @db.run "CREATE TABLE leases_new (oid INTEGER, ip BIGINT, body MEDIUMTEXT, PRIMARY KEY(oid,ip));"

        @db[:leases].each do |row|
            doc = Document.new(row[:body])

            used = (doc.root.get_text('USED') == "1")
            vid  = doc.root.get_text('VID').to_s.to_i

            ip_str = IPAddr.new(row[:ip], Socket::AF_INET).to_s

            vnet_structure = counters[:vnet][row[:oid]]

            if vnet_structure.nil?
                log_error("Table leases contains the lease #{ip_str} for VNet #{row[:oid]}, but it does not exit")

                next
            end

            ranged = vnet_structure[:type] == 0

            counter_mac, counter_used, counter_vid =
                vnet_structure[:leases][ip_str]

            vnet_structure[:leases].delete(ip_str)

            insert = true

            if used && (vid != -1) # Lease used by a VM
                if counter_mac.nil?
                    log_error("VNet #{row[:oid]} has used lease #{ip_str} (VM #{vid}) \tbut it is free")

                    if ranged
                        insert = false
                    end

                    doc.root.each_element("USED") { |e|
                        e.text = "0"
                    }

                    doc.root.each_element("VID") {|e|
                        e.text = "-1"
                    }

                    row[:body] = doc.to_s

                elsif vid != counter_vid
                    log_error("VNet #{row[:oid]} has used lease #{ip_str} (VM #{vid}) \tbut it used by VM #{counter_vid}")

                    doc.root.each_element("VID") {|e|
                        e.text = counter_vid.to_s
                    }

                    row[:body] = doc.to_s
                end
            else # Lease is free or on hold (used=1, vid=-1)
                if !counter_mac.nil?
                    if used
                        log_error("VNet #{row[:oid]} has lease on hold #{ip_str} \tbut it is used by VM #{counter_vid}")
                    else
                        log_error("VNet #{row[:oid]} has free lease #{ip_str} \tbut it is used by VM #{counter_vid}")
                    end

                    doc.root.each_element("USED") { |e|
                        e.text = "1"
                    }

                    doc.root.each_element("VID") {|e|
                        e.text = counter_vid.to_s
                    }

                    row[:body] = doc.to_s
                end
            end

            if (doc.root.get_text('USED') == "1")
                vnet_structure[:total_leases] += 1
            end

            # commit
            @db[:leases_new].insert(row) if insert
        end

        # Now insert all the leases left in the hash, i.e. used by a VM in
        # vm_pool, but not in the leases table. This will only happen in
        # ranged networks

        counters[:vnet].each do |net_id,vnet_structure|
            vnet_structure[:leases].each do |ip,array|
                mac,used,vid = array

                ip_i = IPAddr.new(ip, Socket::AF_INET).to_i

                # TODO: MAC_PREFIX is now hardcoded to "02:00"
                body = "<LEASE><IP>#{ip_i}</IP><MAC_PREFIX>512</MAC_PREFIX><MAC_SUFFIX>#{ip_i}</MAC_SUFFIX><USED>#{used}</USED><VID>#{vid}</VID></LEASE>"

                log_error("VNet #{net_id} has free lease #{ip} \tbut it is used by VM #{vid}")

                vnet_structure[:total_leases] += 1

                @db[:leases_new].insert(
                    :oid        => net_id,
                    :ip         => ip_i,
                    :body       => body)
            end
        end


        # Rename table
        @db.run("DROP TABLE leases")
        @db.run("ALTER TABLE leases_new RENAME TO leases")


        ########################################################################
        # VNet
        #
        # VNET/TOTAL_LEASES
        ########################################################################

        # Create a new empty table where we will store the new calculated values
        @db.run "CREATE TABLE network_pool_new (oid INTEGER PRIMARY KEY, name VARCHAR(128), body MEDIUMTEXT, uid INTEGER, gid INTEGER, owner_u INTEGER, group_u INTEGER, other_u INTEGER, cid INTEGER, UNIQUE(name,uid));"

        @db[:network_pool].each do |row|
            doc = Document.new(row[:body])

            oid = row[:oid]

            total_leases = counters[:vnet][oid][:total_leases]

            # rewrite running_vms
            doc.root.each_element("TOTAL_LEASES") {|e|
                if e.text != total_leases.to_s
                    log_error("VNet #{oid} TOTAL_LEASES has #{e.text} \tis\t#{total_leases}")
                    e.text = total_leases
                end
            }

            row[:body] = doc.to_s

            # commit
            @db[:network_pool_new].insert(row)
        end

        # Rename table
        @db.run("DROP TABLE network_pool")
        @db.run("ALTER TABLE network_pool_new RENAME TO network_pool")


        ########################################################################
        # Users
        #
        # USER QUOTAS
        ########################################################################

        @db.run "ALTER TABLE user_pool RENAME TO old_user_pool;"
        @db.run "CREATE TABLE user_pool (oid INTEGER PRIMARY KEY, name VARCHAR(128), body MEDIUMTEXT, uid INTEGER, gid INTEGER, owner_u INTEGER, group_u INTEGER, other_u INTEGER, UNIQUE(name));"

        # oneadmin does not have quotas
        @db.fetch("SELECT * FROM old_user_pool WHERE oid=0") do |row|
            @db[:user_pool].insert(row)
        end

        @db.fetch("SELECT * FROM old_user_pool WHERE oid>0") do |row|
            doc = Document.new(row[:body])

            calculate_quotas(doc, "uid=#{row[:oid]}", "User")

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
        # Groups
        #
        # GROUP QUOTAS
        ########################################################################

        @db.run "ALTER TABLE group_pool RENAME TO old_group_pool;"
        @db.run "CREATE TABLE group_pool (oid INTEGER PRIMARY KEY, name VARCHAR(128), body MEDIUMTEXT, uid INTEGER, gid INTEGER, owner_u INTEGER, group_u INTEGER, other_u INTEGER, UNIQUE(name));"

        # oneadmin group does not have quotas
        @db.fetch("SELECT * FROM old_group_pool WHERE oid=0") do |row|
            @db[:group_pool].insert(row)
        end

        @db.fetch("SELECT * FROM old_group_pool WHERE oid>0") do |row|
            doc = Document.new(row[:body])

            calculate_quotas(doc, "gid=#{row[:oid]}", "Group")

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

        log_total_errors()

        return true
    end

    def log_error(message)
        @errors += 1
        puts message
    end

    def log_total_errors()
        puts
        puts "Total errors found: #{@errors}"
    end



    def calculate_quotas(doc, where_filter, resource)

        oid = doc.root.get_text("ID").to_s.to_i

        # VM quotas
        cpu_used = 0.0
        mem_used = 0
        vms_used = 0

        # VNet quotas
        vnet_usage = {}

        # Image quotas
        img_usage = {}

        @db.fetch("SELECT body FROM vm_pool WHERE #{where_filter} AND state<>6") do |vm_row|
            vmdoc = Document.new(vm_row[:body])

            # VM quotas
            vmdoc.root.each_element("TEMPLATE/CPU") { |e|
                # truncate to 2 decimals
                cpu = (e.text.to_f * 100).to_i / 100.0
                cpu_used += cpu
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

        vm_elem = nil
        doc.root.each_element("VM_QUOTA/VM") { |e| vm_elem = e }

        if vm_elem.nil?
            doc.root.delete_element("VM_QUOTA")

            vm_quota  = doc.root.add_element("VM_QUOTA")
            vm_elem   = vm_quota.add_element("VM")

            vm_elem.add_element("CPU").text         = "0"
            vm_elem.add_element("CPU_USED").text    = "0"

            vm_elem.add_element("MEMORY").text      = "0"
            vm_elem.add_element("MEMORY_USED").text = "0"

            vm_elem.add_element("VMS").text         = "0"
            vm_elem.add_element("VMS_USED").text    = "0"
        end


        vm_elem.each_element("CPU_USED") { |e|

            # Because of bug http://dev.opennebula.org/issues/1567 the element
            # may contain a float number in scientific notation.

            # Check if the float value or the string representation mismatch,
            # but ignoring the precision

            different = ( e.text.to_f != cpu_used ||
                ![sprintf('%.2f', cpu_used), sprintf('%.1f', cpu_used), sprintf('%.0f', cpu_used)].include?(e.text)  )

            cpu_used_str = sprintf('%.2f', cpu_used)

            if different
                log_error("#{resource} #{oid} quotas: CPU_USED has #{e.text} \tis\t#{cpu_used_str}")
                e.text = cpu_used_str
            end
        }

        vm_elem.each_element("MEMORY_USED") { |e|
            if e.text != mem_used.to_s
                log_error("#{resource} #{oid} quotas: MEMORY_USED has #{e.text} \tis\t#{mem_used}")
                e.text = mem_used.to_s
            end
        }

        vm_elem.each_element("VMS_USED") { |e|
            if e.text != vms_used.to_s
                log_error("#{resource} #{oid} quotas: VMS_USED has #{e.text} \tis\t#{vms_used}")
                e.text = vms_used.to_s
            end
        }


        # VNet quotas

        net_quota = nil
        doc.root.each_element("NETWORK_QUOTA") { |e| net_quota = e }

        if net_quota.nil?
            net_quota = doc.root.add_element("NETWORK_QUOTA")
        end

        net_quota.each_element("NETWORK") { |net_elem|
            vnet_id = net_elem.get_text("ID").to_s

            leases_used = vnet_usage.delete(vnet_id)

            leases_used = 0 if leases_used.nil?

            net_elem.each_element("LEASES_USED") { |e|
                if e.text != leases_used.to_s
                    log_error("#{resource} #{oid} quotas: VNet #{vnet_id}\tLEASES_USED has #{e.text} \tis\t#{leases_used}")
                    e.text = leases_used.to_s
                end
            }
        }

        vnet_usage.each { |vnet_id, leases_used|
            log_error("#{resource} #{oid} quotas: VNet #{vnet_id}\tLEASES_USED has 0 \tis\t#{leases_used}")

            new_elem = net_quota.add_element("NETWORK")

            new_elem.add_element("ID").text = vnet_id
            new_elem.add_element("LEASES").text = "0"
            new_elem.add_element("LEASES_USED").text = leases_used.to_s
        }


        # Image quotas

        img_quota = nil
        doc.root.each_element("IMAGE_QUOTA") { |e| img_quota = e }

        if img_quota.nil?
            img_quota = doc.root.add_element("IMAGE_QUOTA")
        end

        img_quota.each_element("IMAGE") { |img_elem|
            img_id = img_elem.get_text("ID").to_s

            rvms = img_usage.delete(img_id)

            rvms = 0 if rvms.nil?

            img_elem.each_element("RVMS_USED") { |e|
                if e.text != rvms.to_s
                    log_error("#{resource} #{oid} quotas: Image #{img_id}\tRVMS has #{e.text} \tis\t#{rvms}")
                    e.text = rvms.to_s
                end
            }
        }

        img_usage.each { |img_id, rvms|
            log_error("#{resource} #{oid} quotas: Image #{img_id}\tRVMS has 0 \tis\t#{rvms}")

            new_elem = img_quota.add_element("IMAGE")

            new_elem.add_element("ID").text = img_id
            new_elem.add_element("RVMS").text = "0"
            new_elem.add_element("RVMS_USED").text = rvms.to_s
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

        ds_quota = nil
        doc.root.each_element("DATASTORE_QUOTA") { |e| ds_quota = e }

        if ds_quota.nil?
            ds_quota = doc.root.add_element("DATASTORE_QUOTA")
        end

        ds_quota.each_element("DATASTORE") { |ds_elem|
            ds_id = ds_elem.get_text("ID").to_s

            images_used,size_used = ds_usage.delete(ds_id)

            images_used = 0 if images_used.nil?
            size_used   = 0 if size_used.nil?

            ds_elem.each_element("IMAGES_USED") { |e|
                if e.text != images_used.to_s
                    log_error("#{resource} #{oid} quotas: Datastore #{ds_id}\tIMAGES_USED has #{e.text} \tis\t#{images_used}")
                    e.text = images_used.to_s
                end
            }

            ds_elem.each_element("SIZE_USED") { |e|
                if e.text != size_used.to_s
                    log_error("#{resource} #{oid} quotas: Datastore #{ds_id}\tSIZE_USED has #{e.text} \tis\t#{size_used}")
                    e.text = size_used.to_s
                end
            }
        }

        ds_usage.each { |ds_id, array|
            images_used,size_used = array

            log_error("#{resource} #{oid} quotas: Datastore #{ds_id}\tIMAGES_USED has 0 \tis\t#{images_used}")
            log_error("#{resource} #{oid} quotas: Datastore #{ds_id}\tSIZE_USED has 0 \tis\t#{size_used}")

            new_elem = ds_quota.add_element("DATASTORE")

            new_elem.add_element("ID").text = ds_id

            new_elem.add_element("IMAGES").text = "0"
            new_elem.add_element("IMAGES_USED").text = images_used.to_s

            new_elem.add_element("SIZE").text = "0"
            new_elem.add_element("SIZE_USED").text = size_used.to_s
        }
    end
end
