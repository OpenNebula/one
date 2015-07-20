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

if !ONE_LOCATION
    LOG_LOCATION = "/var/log/one"
else
    LOG_LOCATION = ONE_LOCATION + "/var"
end

LOG              = LOG_LOCATION + "/onedb-fsck.log"

require "rexml/document"
include REXML
require 'ipaddr'
require 'set'

require 'nokogiri'

module OneDBFsck
    VERSION = "4.11.80"
    LOCAL_VERSION = "4.13.80"

    def check_db_version()
        db_version = read_db_version()

        if ( db_version[:version] != VERSION ||
             db_version[:local_version] != LOCAL_VERSION )

            raise <<-EOT
Version mismatch: fsck file is for version
Shared: #{VERSION}, Local: #{LOCAL_VERSION}

Current database is version
Shared: #{db_version[:version]}, Local: #{db_version[:local_version]}
EOT
        end
    end

    def one_version
        "OpenNebula #{VERSION}"
    end

    def db_version
        one_version()
    end

    IMAGE_STATES=%w{INIT READY USED DISABLED LOCKED ERROR CLONE DELETE USED_PERS}

    VM_BIN  = 0x0000001000000000
    NET_BIN = 0x0000004000000000
    HOLD    = 0xFFFFFFFF

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

        init_log_time()

        @errors = 0
        puts

        db_version = read_db_version()

        ########################################################################
        # pool_control
        ########################################################################

        tables = ["group_pool", "user_pool", "acl", "image_pool", "host_pool",
            "network_pool", "template_pool", "vm_pool", "cluster_pool",
            "datastore_pool", "document_pool", "zone_pool", "secgroup_pool",
            "vdc_pool"]

        federated_tables = ["group_pool", "user_pool", "acl", "zone_pool", "vdc_pool"]

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
                    if db_version[:is_slave] && federated_tables.include?(table)
                        log_error("^ Needs to be fixed in the master OpenNebula")
                    else
                        @db.run("UPDATE pool_control SET last_oid=#{max_oid} WHERE tablename='#{table}'")
                    end
                else
                    @db[:pool_control].insert(
                        :tablename  => table,
                        :last_oid   => max_oid)
                end
            end
        end

        log_time()

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
            doc = Nokogiri::XML(row[:body],nil,NOKOGIRI_ENCODING){|c| c.default_xml.noblanks}

            gid = doc.root.at_xpath('GID').text.to_i
            user_gid = gid
            user_gids = Set.new

            if group[gid].nil?
                log_error("User #{row[:oid]} has primary group #{gid}, but it does not exist")

                user_gid = 1

                doc.root.xpath('GID').each do |e|
                    e.content = "1"
                end

                doc.root.xpath('GNAME').each do |e|
                    e.content = "users"
                end

                doc.root.xpath("GROUPS").each { |e|
                    e.xpath("ID[.=#{gid}]").each{|x| x.remove}

                    e.add_child(doc.create_element("ID")).content = user_gid.to_s
                }

                users_fix[row[:oid]] = {:body => doc.root.to_s, :gid => user_gid}
            end

            doc.root.xpath("GROUPS/ID").each { |e|
                user_gids.add e.text.to_i
            }

            if !user_gids.include?(user_gid)
                log_error("User #{row[:oid]} does not have his primary group #{user_gid} in the list of secondary groups")

                doc.root.xpath("GROUPS").each { |e|
                    e.add_child(doc.create_element("ID")).content = user_gid.to_s
                }

                user_gids.add user_gid.to_i

                users_fix[row[:oid]] = {:body => doc.root.to_s, :gid => user_gid}
            end

            user_gids.each do |secondary_gid|
                if group[secondary_gid].nil?
                    log_error("User #{row[:oid]} has secondary group #{secondary_gid}, but it does not exist")

                    doc.root.xpath("GROUPS").each { |e|
                        e.xpath("ID[.=#{secondary_gid}]").each{|x| x.remove}
                    }

                    users_fix[row[:oid]] = {:body => doc.root.to_s, :gid => user_gid}
                else
                    group[secondary_gid] << row[:oid]
                end
            end

            if gid != row[:gid]
                log_error(
                    "User #{row[:oid]} is in group #{gid}, but the DB "<<
                    "table has GID column #{row[:gid]}")

                users_fix[row[:oid]] = {:body => doc.root.to_s, :gid => user_gid}
            end
        end

        if !db_version[:is_slave]
            @db.transaction do
                users_fix.each do |id, user|
                    @db[:user_pool].where(:oid => id).update(
                        :body => user[:body],
                        :gid => user[:gid])
                end
            end
        elsif !users_fix.empty?
            log_error("^ User errors need to be fixed in the master OpenNebula")
        end

        log_time()

        if !db_version[:is_slave]
            @db.run "CREATE TABLE group_pool_new (oid INTEGER PRIMARY KEY, name VARCHAR(128), body MEDIUMTEXT, uid INTEGER, gid INTEGER, owner_u INTEGER, group_u INTEGER, other_u INTEGER, UNIQUE(name));"
        end

        @db.transaction do
            @db.fetch("SELECT * from group_pool") do |row|
                gid = row[:oid]
                doc = Nokogiri::XML(row[:body],nil,NOKOGIRI_ENCODING){|c| c.default_xml.noblanks}

                users_elem = doc.root.at_xpath("USERS")
                users_elem.remove if !users_elem.nil?

                users_new_elem = doc.create_element("USERS")
                doc.root.add_child(users_new_elem)

                error_found = false

                group[gid].each do |id|
                    id_elem = users_elem.at_xpath("ID[.=#{id}]")

                    if id_elem.nil?
                        log_error("User #{id} is missing from Group #{gid} users id list")
                        error_found = true
                    else
                        id_elem.remove
                    end

                    users_new_elem.add_child(doc.create_element("ID")).content = id.to_s
                end

                users_elem.xpath("ID").each do |id_elem|
                    log_error("User #{id_elem.text} is in Group #{gid} users id list, but it should not")
                    error_found = true
                end

                row[:body] = doc.root.to_s

                if !db_version[:is_slave]
                    # commit
                    @db[:group_pool_new].insert(row)
                elsif error_found
                    log_error("^ Group errors need to be fixed in the master OpenNebula")
                end
            end
        end

        if !db_version[:is_slave]
            # Rename table
            @db.run("DROP TABLE group_pool")
            @db.run("ALTER TABLE group_pool_new RENAME TO group_pool")
        end

        log_time()

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

        @db.fetch("SELECT oid, name FROM cluster_pool") do |row|
            cluster[row[:oid]] = {}

            cluster[row[:oid]][:name]       = row[:name]

            cluster[row[:oid]][:hosts]      = []
            cluster[row[:oid]][:datastores] = []
            cluster[row[:oid]][:vnets]      = []
        end

        hosts_fix       = {}
        datastores_fix  = {}
        vnets_fix       = {}

        @db.transaction do
            @db.fetch("SELECT oid,body,cid FROM host_pool") do |row|
                doc = Document.new(row[:body])

                cluster_id = doc.root.get_text('CLUSTER_ID').to_s.to_i
                cluster_name = doc.root.get_text('CLUSTER')

                if cluster_id != row[:cid]
                    log_error("Host #{row[:oid]} is in cluster #{cluster_id}, but cid column has cluster #{row[:cid]}")
                    hosts_fix[row[:oid]] = {:body => row[:body], :cid => cluster_id}
                end

                if cluster_id != -1
                    cluster_entry = cluster[cluster_id]

                    if cluster_entry.nil?
                        log_error("Host #{row[:oid]} is in cluster #{cluster_id}, but it does not exist")

                        doc.root.each_element('CLUSTER_ID') do |e|
                            e.text = "-1"
                        end

                        doc.root.each_element('CLUSTER') do |e|
                            e.text = ""
                        end

                        hosts_fix[row[:oid]] = {:body => doc.root.to_s, :cid => -1}
                    else
                        if cluster_name != cluster_entry[:name]
                            log_error("Host #{row[:oid]} has a wrong name for cluster #{cluster_id}, #{cluster_name}. It will be changed to #{cluster_entry[:name]}")

                            doc.root.each_element('CLUSTER') do |e|
                                e.text = cluster_entry[:name]
                            end

                            hosts_fix[row[:oid]] = {:body => doc.root.to_s, :cid => cluster_id}
                        end

                        cluster_entry[:hosts] << row[:oid]
                    end
                end
            end

            hosts_fix.each do |id, entry|
                @db[:host_pool].where(:oid => id).update(:body => entry[:body], :cid => entry[:cid])
            end

            log_time()

            @db.fetch("SELECT oid,body,cid FROM datastore_pool") do |row|
                doc = Document.new(row[:body])

                cluster_id = doc.root.get_text('CLUSTER_ID').to_s.to_i
                cluster_name = doc.root.get_text('CLUSTER')

                if cluster_id != row[:cid]
                    log_error("Datastore #{row[:oid]} is in cluster #{cluster_id}, but cid column has cluster #{row[:cid]}")
                    hosts_fix[row[:oid]] = {:body => row[:body], :cid => cluster_id}
                end

                if cluster_id != -1
                    cluster_entry = cluster[cluster_id]

                    if cluster_entry.nil?
                        log_error("Datastore #{row[:oid]} is in cluster #{cluster_id}, but it does not exist")

                        doc.root.each_element('CLUSTER_ID') do |e|
                            e.text = "-1"
                        end

                        doc.root.each_element('CLUSTER') do |e|
                            e.text = ""
                        end

                        datastores_fix[row[:oid]] = {:body => doc.root.to_s, :cid => -1}
                    else
                        cluster_entry[:datastores] << row[:oid]

                        if cluster_name != cluster_entry[:name]
                            log_error("Datastore #{row[:oid]} has a wrong name for cluster #{cluster_id}, #{cluster_name}. It will be changed to #{cluster_entry[:name]}")

                            doc.root.each_element('CLUSTER') do |e|
                                e.text = cluster_entry[:name]
                            end

                            datastores_fix[row[:oid]] = {:body => doc.root.to_s, :cid => cluster_id}
                        end
                    end
                end
            end

            datastores_fix.each do |id, entry|
                @db[:datastore_pool].where(:oid => id).update(:body => entry[:body], :cid => entry[:cid])
            end

            log_time()

            @db.fetch("SELECT oid,body,cid FROM network_pool") do |row|
                doc = Document.new(row[:body])

                cluster_id = doc.root.get_text('CLUSTER_ID').to_s.to_i
                cluster_name = doc.root.get_text('CLUSTER')

                if cluster_id != row[:cid]
                    log_error("VNet #{row[:oid]} is in cluster #{cluster_id}, but cid column has cluster #{row[:cid]}")
                    hosts_fix[row[:oid]] = {:body => row[:body], :cid => cluster_id}
                end

                if cluster_id != -1
                    cluster_entry = cluster[cluster_id]

                    if cluster_entry.nil?
                        log_error("VNet #{row[:oid]} is in cluster #{cluster_id}, but it does not exist")

                        doc.root.each_element('CLUSTER_ID') do |e|
                            e.text = "-1"
                        end

                        doc.root.each_element('CLUSTER') do |e|
                            e.text = ""
                        end

                        vnets_fix[row[:oid]] = {:body => doc.root.to_s, :cid => -1}
                    else
                        if cluster_name != cluster_entry[:name]
                            log_error("VNet #{row[:oid]} has a wrong name for cluster #{cluster_id}, #{cluster_name}. It will be changed to #{cluster_entry[:name]}")

                            doc.root.each_element('CLUSTER') do |e|
                                e.text = cluster_entry[:name]
                            end

                            vnets_fix[row[:oid]] = {:body => doc.root.to_s, :cid => -1}
                        end

                        cluster_entry[:vnets] << row[:oid]
                    end
                end
            end

            vnets_fix.each do |id, entry|
                @db[:network_pool].where(:oid => id).update(:body => entry[:body], :cid => entry[:cid])
            end
        end

        log_time()

        @db.run "CREATE TABLE cluster_pool_new (oid INTEGER PRIMARY KEY, name VARCHAR(128), body MEDIUMTEXT, uid INTEGER, gid INTEGER, owner_u INTEGER, group_u INTEGER, other_u INTEGER, UNIQUE(name));"

        @db.transaction do
            @db.fetch("SELECT * from cluster_pool") do |row|
                cluster_id = row[:oid]
                doc = Document.new(row[:body])

                # Hosts
                hosts_elem = doc.root.elements.delete("HOSTS")

                hosts_new_elem = doc.root.add_element("HOSTS")

                cluster[cluster_id][:hosts].each do |id|
                    id_elem = hosts_elem.elements.delete("ID[.=#{id}]")

                    if id_elem.nil?
                        log_error("Host #{id} is missing from Cluster #{cluster_id} host id list")
                    end

                    hosts_new_elem.add_element("ID").text = id.to_s
                end

                hosts_elem.each_element("ID") do |id_elem|
                    log_error("Host #{id_elem.text} is in Cluster #{cluster_id} host id list, but it should not")
                end


                # Datastores
                ds_elem = doc.root.elements.delete("DATASTORES")

                ds_new_elem = doc.root.add_element("DATASTORES")

                cluster[cluster_id][:datastores].each do |id|
                    id_elem = ds_elem.elements.delete("ID[.=#{id}]")

                    if id_elem.nil?
                        log_error("Datastore #{id} is missing from Cluster #{cluster_id} datastore id list")
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
                        log_error("VNet #{id} is missing from Cluster #{cluster_id} vnet id list")
                    end

                    vnets_new_elem.add_element("ID").text = id.to_s
                end

                vnets_elem.each_element("ID") do |id_elem|
                    log_error("VNet #{id_elem.text} is in Cluster #{cluster_id} vnet id list, but it should not")
                end


                row[:body] = doc.root.to_s

                # commit
                @db[:cluster_pool_new].insert(row)
            end
        end

        log_time()

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

        @db.fetch("SELECT oid, name FROM datastore_pool") do |row|
            datastore[row[:oid]] = {:name => row[:name], :images => []}
        end

        images_fix = {}

        @db.fetch("SELECT oid,body FROM image_pool") do |row|
            doc = Document.new(row[:body])

            ds_id = doc.root.get_text('DATASTORE_ID').to_s.to_i
            ds_name = doc.root.get_text('DATASTORE')

            if ds_id != -1
                ds_entry = datastore[ds_id]

                if ds_entry.nil?
                    log_error("Image #{row[:oid]} has datastore #{ds_id}, but it does not exist. The image is probably unusable, and needs to be deleted manually:\n"<<
                        "  * The image contents should be deleted manually:\n"<<
                        "    #{doc.root.get_text('SOURCE')}\n"<<
                        "  * The DB entry can be then deleted with the command:\n"<<
                        "    DELETE FROM image_pool WHERE oid=#{row[:oid]};\n"<<
                        "  * Run fsck again.\n")
                else
                    if ds_name != ds_entry[:name]
                        log_error("Image #{row[:oid]} has a wrong name for datastore #{ds_id}, #{ds_name}. It will be changed to #{ds_entry[:name]}")

                        doc.root.each_element('DATASTORE') do |e|
                            e.text = ds_entry[:name]
                        end

                        images_fix[row[:oid]] = doc.root.to_s
                    end

                    ds_entry[:images] << row[:oid]
                end
            end
        end

        @db.transaction do
            images_fix.each do |id, body|
                @db[:image_pool].where(:oid => id).update(:body => body)
            end
        end

        log_time()

        @db.run "CREATE TABLE datastore_pool_new (oid INTEGER PRIMARY KEY, name VARCHAR(128), body MEDIUMTEXT, uid INTEGER, gid INTEGER, owner_u INTEGER, group_u INTEGER, other_u INTEGER, cid INTEGER, UNIQUE(name));"

        @db.transaction do
            @db.fetch("SELECT * from datastore_pool") do |row|
                ds_id = row[:oid]
                doc = Document.new(row[:body])

                images_elem = doc.root.elements.delete("IMAGES")

                images_new_elem = doc.root.add_element("IMAGES")

                datastore[ds_id][:images].each do |id|
                    id_elem = images_elem.elements.delete("ID[.=#{id}]")

                    if id_elem.nil?
                        log_error(
                            "Image #{id} is missing from Datastore #{ds_id} "<<
                            "image id list")
                    end

                    images_new_elem.add_element("ID").text = id.to_s
                end

                images_elem.each_element("ID") do |id_elem|
                    log_error(
                        "Image #{id_elem.text} is in Cluster #{ds_id} "<<
                        "image id list, but it should not")
                end


                row[:body] = doc.root.to_s

                # commit
                @db[:datastore_pool_new].insert(row)
            end
        end

        # Rename table
        @db.run("DROP TABLE datastore_pool")
        @db.run("ALTER TABLE datastore_pool_new RENAME TO datastore_pool")

        log_time()

        ########################################################################
        # VM Counters for host, image and vnet usage
        ########################################################################

        counters = {}
        counters[:host]  = {}
        counters[:image] = {}
        counters[:vnet]  = {}

        # Initialize all the host counters to 0
        @db.fetch("SELECT oid, name FROM host_pool") do |row|
            counters[:host][row[:oid]] = {
                :name   => row[:name],
                :memory => 0,
                :cpu    => 0,
                :rvms   => Set.new
            }
        end

        log_time()

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

        log_time()

        # Init vnet counters
        @db.fetch("SELECT oid,body FROM network_pool") do |row|
            doc = Nokogiri::XML(row[:body],nil,NOKOGIRI_ENCODING){|c| c.default_xml.noblanks}

            ar_leases = {}

            doc.root.xpath("AR_POOL/AR/AR_ID").each do |ar_id|
                ar_leases[ar_id.text.to_i] = {}
            end

            counters[:vnet][row[:oid]] = {
                :ar_leases      => ar_leases,
                :no_ar_leases   => {}
            }
        end

        log_time()

        vms_fix = {}

        # Aggregate information of the RUNNING vms
        @db.fetch("SELECT oid,body FROM vm_pool WHERE state<>6") do |row|
            vm_doc = Nokogiri::XML(row[:body],nil,NOKOGIRI_ENCODING){|c| c.default_xml.noblanks}

            state     = vm_doc.root.at_xpath('STATE').text.to_i
            lcm_state = vm_doc.root.at_xpath('LCM_STATE').text.to_i

            # Images used by this VM
            vm_doc.root.xpath("TEMPLATE/DISK/IMAGE_ID").each do |e|
                img_id = e.text.to_i

                if counters[:image][img_id].nil?
                    log_error("VM #{row[:oid]} is using Image #{img_id}, but "<<
                        "it does not exist")
                else
                    counters[:image][img_id][:vms].add(row[:oid])
                end
            end

            # VNets used by this VM
            vm_doc.root.xpath("TEMPLATE/NIC").each do |nic|
                net_id = nil
                nic.xpath("NETWORK_ID").each do |nid|
                    net_id = nid.text.to_i
                end

                if !net_id.nil?
                    if counters[:vnet][net_id].nil?
                        log_error("VM #{row[:oid]} is using VNet #{net_id}, "<<
                            "but it does not exist")
                    else
                        mac = nic.at_xpath("MAC").nil? ? nil : nic.at_xpath("MAC").text

                        ar_id_e = nic.at_xpath('AR_ID')

                        if ar_id_e.nil?
                            if !counters[:vnet][net_id][:no_ar_leases][mac_s_to_i(mac)].nil?
                                log_error("VNet has more than one VM with the same MAC address (#{mac}). "<<
                                    "FSCK can't handle this, and consistency is not guaranteed")
                            end

                            counters[:vnet][net_id][:no_ar_leases][mac_s_to_i(mac)] = {
                                :ip         => nic.at_xpath("IP").nil? ? nil : nic.at_xpath("IP").text,
                                :ip6_global => nic.at_xpath("IP6_GLOBAL").nil? ? nil : nic.at_xpath("IP6_GLOBAL").text,
                                :ip6_link   => nic.at_xpath("IP6_LINK").nil? ? nil : nic.at_xpath("IP6_LINK").text,
                                :ip6_ula    => nic.at_xpath("IP6_ULA").nil? ? nil : nic.at_xpath("IP6_ULA").text,
                                :mac        => mac,
                                :vm         => row[:oid],
                                :vnet       => nil
                            }
                        else
                            ar_id = ar_id_e.text.to_i

                            if counters[:vnet][net_id][:ar_leases][ar_id].nil?
                                log_error("VM #{row[:oid]} is using VNet #{net_id}, AR #{ar_id}, "<<
                                    "but the AR does not exist")
                            else
                                counters[:vnet][net_id][:ar_leases][ar_id][mac_s_to_i(mac)] = {
                                    :ip         => nic.at_xpath("IP").nil? ? nil : nic.at_xpath("IP").text,
                                    :ip6_global => nic.at_xpath("IP6_GLOBAL").nil? ? nil : nic.at_xpath("IP6_GLOBAL").text,
                                    :ip6_link   => nic.at_xpath("IP6_LINK").nil? ? nil : nic.at_xpath("IP6_LINK").text,
                                    :ip6_ula    => nic.at_xpath("IP6_ULA").nil? ? nil : nic.at_xpath("IP6_ULA").text,
                                    :mac        => mac,
                                    :vm         => row[:oid],
                                    :vnet       => nil
                                }
                            end
                        end
                    end
                end
            end

            # Host resources

            # Only states that add to Host resources consumption are
            # ACTIVE, SUSPENDED, POWEROFF
            next if !([3,5,8].include? state)

            # Get memory (integer)
            memory = vm_doc.root.at_xpath("TEMPLATE/MEMORY").text.to_i

            # Get CPU (float)
            cpu = vm_doc.root.at_xpath("TEMPLATE/CPU").text.to_f

            # Get hostid, hostname
            hid = -1
            vm_doc.root.xpath("HISTORY_RECORDS/HISTORY[last()]/HID").each { |e|
                hid = e.text.to_i
            }

            hostname = ""
            vm_doc.root.xpath("HISTORY_RECORDS/HISTORY[last()]/HOSTNAME").each { |e|
                hostname = e.text
            }

            counters_host = counters[:host][hid]

            if counters_host.nil?
                log_error("VM #{row[:oid]} is using Host #{hid}, "<<
                    "but it does not exist")
            else
                if counters_host[:name] != hostname
                    log_error("VM #{row[:oid]} has a wrong hostname for "<<
                        "Host #{hid}, #{hostname}. It will be changed to "<<
                        "#{counters_host[:name]}")

                    vm_doc.root.xpath(
                        "HISTORY_RECORDS/HISTORY[last()]/HOSTNAME").each { |e|
                        e.content = counters_host[:name]
                    }

                    vms_fix[row[:oid]] = vm_doc.root.to_s
                end

                counters_host[:memory] += memory
                counters_host[:cpu]    += cpu
                counters_host[:rvms].add(row[:oid])
            end
        end

        @db.transaction do
            vms_fix.each do |id, body|
                @db[:vm_pool].where(:oid => id).update(:body => body)
            end
        end

        log_time()

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
        @db.transaction do
            @db[:host_pool].each do |row|
                host_doc = Document.new(row[:body])

                hid = row[:oid]

                counters_host = counters[:host][hid]

                rvms        = counters_host[:rvms].size
                cpu_usage   = (counters_host[:cpu]*100).to_i
                mem_usage   = counters_host[:memory]*1024

                # rewrite running_vms
                host_doc.root.each_element("HOST_SHARE/RUNNING_VMS") {|e|
                    if e.text != rvms.to_s
                        log_error(
                            "Host #{hid} RUNNING_VMS has #{e.text} \tis\t#{rvms}")
                        e.text = rvms
                    end
                }


                # re-do list of VM IDs
                vms_elem = host_doc.root.elements.delete("VMS")

                vms_new_elem = host_doc.root.add_element("VMS")

                counters_host[:rvms].each do |id|
                    id_elem = vms_elem.elements.delete("ID[.=#{id}]")

                    if id_elem.nil?
                        log_error(
                            "VM #{id} is missing from Host #{hid} VM id list")
                    end

                    vms_new_elem.add_element("ID").text = id.to_s
                end

                vms_elem.each_element("ID") do |id_elem|
                    log_error(
                        "VM #{id_elem.text} is in Host #{hid} VM id list, "<<
                        "but it should not")
                end


                # rewrite cpu
                host_doc.root.each_element("HOST_SHARE/CPU_USAGE") {|e|
                    if e.text != cpu_usage.to_s
                        log_error(
                            "Host #{hid} CPU_USAGE has #{e.text} "<<
                            "\tis\t#{cpu_usage}")
                        e.text = cpu_usage
                    end
                }

                # rewrite memory
                host_doc.root.each_element("HOST_SHARE/MEM_USAGE") {|e|
                    if e.text != mem_usage.to_s
                        log_error("Host #{hid} MEM_USAGE has #{e.text} "<<
                            "\tis\t#{mem_usage}")
                        e.text = mem_usage
                    end
                }

                row[:body] = host_doc.root.to_s

                # commit
                @db[:host_pool_new].insert(row)
            end
        end

        # Rename table
        @db.run("DROP TABLE host_pool")
        @db.run("ALTER TABLE host_pool_new RENAME TO host_pool")

        log_time()

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

        @db.transaction do
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
                        log_error("VM #{id} is missing from Image #{oid} VM id list")
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
                        log_error("Image #{id} is missing from Image #{oid} CLONES id list")
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

                row[:body] = doc.root.to_s

                # commit
                @db[:image_pool_new].insert(row)
            end
        end

        # Rename table
        @db.run("DROP TABLE image_pool")
        @db.run("ALTER TABLE image_pool_new RENAME TO image_pool")

        log_time()

        ########################################################################
        # VNet
        #
        # LEASES
        ########################################################################

        @db.fetch("SELECT oid,body,pid FROM network_pool WHERE pid<>-1") do |row|
            doc = Nokogiri::XML(row[:body],nil,NOKOGIRI_ENCODING){|c| c.default_xml.noblanks}

            parent_vnet = doc.root.at_xpath("PARENT_NETWORK_ID").text.to_i

            if (row[:pid] != parent_vnet)
                # TODO
            end

            doc.root.xpath("AR_POOL/AR").each do |ar|
                parent_ar_e = ar.at_xpath("PARENT_NETWORK_AR_ID")
                if !(parent_ar_e.nil? || parent_ar_e.text == "")

                    parent_ar = parent_ar_e.text.to_i

                    if counters[:vnet][parent_vnet][:ar_leases][parent_ar].nil?
                        log_error(
                            "VNet #{row[:oid]} is using parent "<<
                            "VNet #{parent_vnet}, AR #{parent_ar}, "<<
                            "but the AR does not exist")
                    end

                    # MAC
                    first_mac = mac_s_to_i(ar.at_xpath("MAC").text)

                    # IP
                    first_ip = nil
                    if (!ar.at_xpath("IP").nil?)
                        first_ip = IPAddr.new(ar.at_xpath("IP").text, Socket::AF_INET)
                    end

                    # IP6
                    global_prefix = nil
                    if !ar.at_xpath("GLOBAL_PREFIX").nil?
                        global_prefix = ip6_prefix_s_to_i(
                                    ar.at_xpath("GLOBAL_PREFIX").text)
                    end

                    ula_prefix = nil
                    if !ar.at_xpath("ULA_PREFIX").nil?
                        ula_prefix = ip6_prefix_s_to_i(
                                    ar.at_xpath("ULA_PREFIX").text)
                    end

                    link_prefix = nil
                    type = ar.at_xpath("TYPE").text
                    if ( type == "IP6" || type == "IP4_6" )
                        link_prefix = 0xfe80000000000000
                    end

                    # Parent vnet has a lease for each address of this reservation
                    ar.at_xpath("SIZE").text.to_i.times do |index|

                        lease = {
                            :ip         => nil,
                            :ip6_global => nil,
                            :ip6_link   => nil,
                            :ip6_ula    => nil,
                            :mac        => nil,
                            :vm         => nil,
                            :vnet       => row[:oid]
                        }

                        #MAC
                        mac = (first_mac & 0xFFFF00000000) +
                              (((first_mac & 0xFFFFFFFF) + index) % 0x100000000)
                        lease[:mac] = mac_i_to_s(mac)

                        # IP
                        if (!first_ip.nil?)
                            lease[:ip] = IPAddr.new(first_ip.to_i + index,
                                                    Socket::AF_INET).to_s
                        end

                        # IP6
                        ip6_suffix = mac_to_ip6_suffix(mac)

                        if (!global_prefix.nil?)
                            lease[:ip6_global] = IPAddr.new(
                                (global_prefix << 64) | ip6_suffix,
                                Socket::AF_INET6 ).to_s
                        end

                        if (!ula_prefix.nil?)
                            lease[:ip6_ula] = IPAddr.new(
                                (ula_prefix << 64) | ip6_suffix,
                                Socket::AF_INET6 ).to_s
                        end

                        if (!link_prefix.nil?)
                            lease[:ip6_link] = IPAddr.new(
                                (link_prefix << 64) | ip6_suffix,
                                Socket::AF_INET6 ).to_s
                        end

                        counters[:vnet][parent_vnet][
                            :ar_leases][parent_ar][mac] = lease
                    end
                end
            end
        end


        # Create a new empty table where we will store the new calculated values
        @db.run "CREATE TABLE network_pool_new (oid INTEGER PRIMARY KEY, name VARCHAR(128), body MEDIUMTEXT, uid INTEGER, gid INTEGER, owner_u INTEGER, group_u INTEGER, other_u INTEGER, cid INTEGER, pid INTEGER, UNIQUE(name,uid));"

        @db.transaction do
        @db[:network_pool].each do |row|
            doc = Nokogiri::XML(row[:body],nil,NOKOGIRI_ENCODING){|c| c.default_xml.noblanks}
            oid = row[:oid]

            used_leases = doc.root.at_xpath("USED_LEASES").text.to_i
            new_used_leases = 0

            counter_no_ar = counters[:vnet][row[:oid]][:no_ar_leases]

            counters[:vnet][row[:oid]][:ar_leases].each do |ar_id, counter_ar|
                net_ar = doc.root.at_xpath("AR_POOL/AR[AR_ID=#{ar_id}]")

                if (net_ar.nil?)
                    # TODO shouldn't happen?
                end

                # MAC
                first_mac = mac_s_to_i(net_ar.at_xpath("MAC").text)

                # IP
                first_ip = nil
                if !net_ar.at_xpath("IP").nil?
                    first_ip = IPAddr.new(net_ar.at_xpath("IP").text, Socket::AF_INET)
                end

                # IP6
                global_prefix = nil
                if !net_ar.at_xpath("GLOBAL_PREFIX").nil?
                    global_prefix = ip6_prefix_s_to_i(
                                net_ar.at_xpath("GLOBAL_PREFIX").text)
                end

                ula_prefix = nil
                if !net_ar.at_xpath("ULA_PREFIX").nil?
                    ula_prefix = ip6_prefix_s_to_i(
                                net_ar.at_xpath("ULA_PREFIX").text)
                end

                link_prefix = nil
                type = net_ar.at_xpath("TYPE").text
                if ( type == "IP6" || type == "IP4_6" )
                    link_prefix = 0xfe80000000000000
                end

                # Allocated leases
                allocated_e = net_ar.at_xpath("ALLOCATED")

                allocated = allocated_e.nil? ? "" : allocated_e.text

                leases = allocated.scan(/(\d+) (\d+)/)

                new_leases = []

                leases.each do |lease_str|
                    index = lease_str[0].to_i
                    binary_magic = lease_str[1].to_i

                    lease = {
                        :ip         => nil,
                        :ip6_global => nil,
                        :ip6_link   => nil,
                        :ip6_ula    => nil,
                        :mac        => nil,
                        :vm         => nil,
                        :vnet       => nil
                    }

                    # MAC
                    mac = (first_mac & 0xFFFF00000000) +
                          (((first_mac & 0xFFFFFFFF) + index) % 0x100000000)

                    lease[:mac] = mac_i_to_s(mac)

                    # IP
                    if (!first_ip.nil?)
                        lease[:ip] = IPAddr.new(first_ip.to_i + index,
                                                Socket::AF_INET).to_s
                    end

                    # IP6
                    ip6_suffix = mac_to_ip6_suffix(mac)

                    if (!global_prefix.nil?)
                        lease[:ip6_global] = IPAddr.new(
                            (global_prefix << 64) | ip6_suffix,
                            Socket::AF_INET6 ).to_s
                    end

                    if (!ula_prefix.nil?)
                        lease[:ip6_ula] = IPAddr.new(
                            (ula_prefix << 64) | ip6_suffix,
                            Socket::AF_INET6 ).to_s
                    end

                    if (!link_prefix.nil?)
                        lease[:ip6_link] = IPAddr.new(
                            (link_prefix << 64) | ip6_suffix,
                            Socket::AF_INET6 ).to_s
                    end

                    # OID
                    lease_oid = binary_magic & 0x00000000FFFFFFFF
                    lease_obj = ""

                    if (binary_magic & VM_BIN != 0)
                        lease[:vm] = lease_oid
                        lease_obj = "VM"
                    else # binary_magic & NET_BIN != 0
                        lease[:vnet] = lease_oid
                        lease_obj = "VNet"
                    end

                    counter_lease = counter_ar[mac]
                    counter_ar.delete(mac)

                    if counter_lease.nil?
                        counter_lease = counter_no_ar[mac]
                        counter_no_ar.delete(mac)
                    end

                    if counter_lease.nil?
                        if(lease[:vm] != HOLD)
                            log_error(
                            "VNet #{oid} AR #{ar_id} has leased #{lease_to_s(lease)} "<<
                            "to #{lease_obj} #{lease_oid}, but it is actually free")
                        else
                            new_leases << lease_str
                        end
                    else
                        if counter_lease != lease

                            # Things that can be fixed
                            if (counter_lease[:vm] != lease[:vm] ||
                                counter_lease[:vnet] != lease[:vnet])

                                new_lease_obj = ""
                                new_lease_oid = 0
                                new_binary_magic = 0

                                if !counter_lease[:vm].nil?
                                    new_lease_obj = "VM"
                                    new_lease_oid = counter_lease[:vm].to_i

                                    new_binary_magic = (VM_BIN |
                                        (new_lease_oid & 0xFFFFFFFF))
                                else
                                    new_lease_obj = "VNet"
                                    new_lease_oid = counter_lease[:vnet].to_i

                                    new_binary_magic = (NET_BIN |
                                        (new_lease_oid & 0xFFFFFFFF))
                                end

                                if (lease[:vm] == HOLD)
                                    log_error(
                                        "VNet #{oid} AR #{ar_id} has lease "<<
                                        "#{lease_to_s(lease)} on hold, but it is "<<
                                        "actually used by "<<
                                        "#{new_lease_obj} #{new_lease_oid}")
                                else
                                    log_error(
                                        "VNet #{oid} AR #{ar_id} has leased #{lease_to_s(lease)} "<<
                                        "to #{lease_obj} #{lease_oid}, but it is "<<
                                        "actually used by "<<
                                        "#{new_lease_obj} #{new_lease_oid}")
                                end

                                lease_str[1] = new_binary_magic.to_s
                            end

                            # Things that can't be fixed

                            [:ip, :ip6_global, :ip6_link, :ip6_ula].each do |key|
                                if (counter_lease[key] != lease[key])
                                    log_error(
                                    "VNet #{oid} AR #{ar_id} has a wrong "<<
                                    "lease for "<<
                                    "#{lease_obj} #{lease_oid}. #{key.to_s.upcase} "<<
                                    "does not match: "<<
                                    "#{counter_lease[key]} != #{lease[key]}. "<<
                                    "This can't be fixed")
                                end
                            end
                        end

                        new_leases << lease_str
                    end
                end

                counter_ar.each do |mac, counter_lease|
                    index = ((mac & 0xFFFFFFFF) - (first_mac & 0xFFFFFFFF) ) % 0x100000000

                    new_lease_obj = ""
                    new_lease_oid = 0
                    new_binary_magic = 0

                    if !counter_lease[:vm].nil?
                        new_lease_obj = "VM"
                        new_lease_oid = counter_lease[:vm].to_i

                        new_binary_magic = (VM_BIN |
                            (new_lease_oid & 0xFFFFFFFF))
                    else
                        new_lease_obj = "VNet"
                        new_lease_oid = counter_lease[:vnet].to_i

                        new_binary_magic = (NET_BIN |
                            (new_lease_oid & 0xFFFFFFFF))
                    end

                    log_error("VNet #{oid} AR #{ar_id} does not have a lease "<<
                        "for #{mac_i_to_s(mac)}, but it is in use by "<<
                        "#{new_lease_obj} #{new_lease_oid}")

                    new_leases << [index.to_s, new_binary_magic.to_s]
                end

                new_used_leases += new_leases.size

                if new_leases.size > 0
                    allocated_e.content = " #{new_leases.join(" ")}"
                else
                    allocated_e.remove if !allocated_e.nil?
                end
            end

            if (new_used_leases != used_leases)
                log_error("VNet #{oid} has #{used_leases} used leases, "<<
                "but it is actually #{new_used_leases}")

                doc.root.at_xpath("USED_LEASES").content =
                                                new_used_leases.to_s
            end

            counter_no_ar.each do |mac, counter_lease|
                log_error("VM #{counter_lease[:vm]} has a lease from "<<
                    "VNet #{oid}, but it could not be matched to any AR")
            end

            row[:body] = doc.root.to_s

            # commit
            @db[:network_pool_new].insert(row)
        end
        end

        # Rename table
        @db.run("DROP TABLE network_pool")
        @db.run("ALTER TABLE network_pool_new RENAME TO network_pool")

        log_time()


        ########################################################################
        # Users
        #
        # USER QUOTAS
        ########################################################################

        # This block is not needed for now
=begin
        @db.transaction do
            @db.fetch("SELECT oid FROM user_pool") do |row|
                found = false

                @db.fetch("SELECT user_oid FROM user_quotas WHERE user_oid=#{row[:oid]}") do |q_row|
                    found = true
                end

                if !found
                    log_error("User #{row[:oid]} does not have a quotas entry")

                    @db.run "INSERT INTO user_quotas VALUES(#{row[:oid]},'<QUOTAS><ID>#{row[:oid]}</ID><DATASTORE_QUOTA></DATASTORE_QUOTA><NETWORK_QUOTA></NETWORK_QUOTA><VM_QUOTA></VM_QUOTA><IMAGE_QUOTA></IMAGE_QUOTA></QUOTAS>');"
                end
            end
        end
=end
        @db.run "ALTER TABLE user_quotas RENAME TO old_user_quotas;"
        @db.run "CREATE TABLE user_quotas (user_oid INTEGER PRIMARY KEY, body MEDIUMTEXT);"

        @db.transaction do
            # oneadmin does not have quotas
            @db.fetch("SELECT * FROM old_user_quotas WHERE user_oid=0") do |row|
                @db[:user_quotas].insert(row)
            end

            @db.fetch("SELECT * FROM old_user_quotas WHERE user_oid>0") do |row|
                doc = Nokogiri::XML(row[:body],nil,NOKOGIRI_ENCODING){|c| c.default_xml.noblanks}

                calculate_quotas(doc, "uid=#{row[:user_oid]}", "User")

                @db[:user_quotas].insert(
                    :user_oid   => row[:user_oid],
                    :body       => doc.root.to_s)
            end
        end

        @db.run "DROP TABLE old_user_quotas;"

        log_time()

        ########################################################################
        # Groups
        #
        # GROUP QUOTAS
        ########################################################################

        # This block is not needed for now
=begin
        @db.transaction do
            @db.fetch("SELECT oid FROM group_pool") do |row|
                found = false

                @db.fetch("SELECT group_oid FROM group_quotas WHERE group_oid=#{row[:oid]}") do |q_row|
                    found = true
                end

                if !found
                    log_error("Group #{row[:oid]} does not have a quotas entry")

                    @db.run "INSERT INTO group_quotas VALUES(#{row[:oid]},'<QUOTAS><ID>#{row[:oid]}</ID><DATASTORE_QUOTA></DATASTORE_QUOTA><NETWORK_QUOTA></NETWORK_QUOTA><VM_QUOTA></VM_QUOTA><IMAGE_QUOTA></IMAGE_QUOTA></QUOTAS>');"
                end
            end
        end
=end
        @db.run "ALTER TABLE group_quotas RENAME TO old_group_quotas;"
        @db.run "CREATE TABLE group_quotas (group_oid INTEGER PRIMARY KEY, body MEDIUMTEXT);"

        @db.transaction do
            # oneadmin does not have quotas
            @db.fetch("SELECT * FROM old_group_quotas WHERE group_oid=0") do |row|
                @db[:group_quotas].insert(row)
            end

            @db.fetch("SELECT * FROM old_group_quotas WHERE group_oid>0") do |row|
                doc = Nokogiri::XML(row[:body],nil,NOKOGIRI_ENCODING){|c| c.default_xml.noblanks}

                calculate_quotas(doc, "gid=#{row[:group_oid]}", "Group")

                @db[:group_quotas].insert(
                    :group_oid   => row[:group_oid],
                    :body       => doc.root.to_s)
            end
        end

        @db.run "DROP TABLE old_group_quotas;"

        log_time()

        log_total_errors()

        return true
    end

    def log_error(message)
        @errors += 1

        log_msg(message)
    end

    def log_msg(message)
        @log_file ||= File.open(LOG, "w")

        puts message

        @log_file.puts(message)
        @log_file.flush
    end

    def log_total_errors()
        puts
        log_msg "Total errors found: #{@errors}"
        puts "A copy of this output was stored in #{LOG}"
    end



    def calculate_quotas(doc, where_filter, resource)

        oid = doc.root.at_xpath("ID").text.to_i

        # VM quotas
        cpu_used = 0
        mem_used = 0
        vms_used = 0
        vol_used = 0

        # VNet quotas
        vnet_usage = {}

        # Image quotas
        img_usage = {}

        @db.fetch("SELECT body FROM vm_pool WHERE #{where_filter} AND state<>6") do |vm_row|
            vmdoc = Nokogiri::XML(vm_row[:body],nil,NOKOGIRI_ENCODING){|c| c.default_xml.noblanks}

            # VM quotas
            vmdoc.root.xpath("TEMPLATE/CPU").each { |e|
                # truncate to 2 decimals
                cpu = (e.text.to_f * 100).to_i
                cpu_used += cpu
            }

            vmdoc.root.xpath("TEMPLATE/MEMORY").each { |e|
                mem_used += e.text.to_i
            }

            vmdoc.root.xpath("TEMPLATE/DISK").each { |e|
                type = ""

                e.xpath("TYPE").each { |t_elem|
                    type = t_elem.text.upcase
                }

                if ( type == "SWAP" || type == "FS")
                    e.xpath("SIZE").each { |size_elem|
                        vol_used += size_elem.text.to_i
                    }
                end
            }

            vms_used += 1

            # VNet quotas
            vmdoc.root.xpath("TEMPLATE/NIC/NETWORK_ID").each { |e|
                vnet_usage[e.text] = 0 if vnet_usage[e.text].nil?
                vnet_usage[e.text] += 1
            }

            # Image quotas
            vmdoc.root.xpath("TEMPLATE/DISK/IMAGE_ID").each { |e|
                img_usage[e.text] = 0 if img_usage[e.text].nil?
                img_usage[e.text] += 1
            }
        end


        # VM quotas

        vm_elem = nil
        doc.root.xpath("VM_QUOTA/VM").each { |e| vm_elem = e }

        if vm_elem.nil?
            doc.root.xpath("VM_QUOTA").each { |e| e.remove }

            vm_quota  = doc.root.add_child(doc.create_element("VM_QUOTA"))
            vm_elem   = vm_quota.add_child(doc.create_element("VM"))

            vm_elem.add_child(doc.create_element("CPU")).content         = "-1"
            vm_elem.add_child(doc.create_element("CPU_USED")).content    = "0"

            vm_elem.add_child(doc.create_element("MEMORY")).content      = "-1"
            vm_elem.add_child(doc.create_element("MEMORY_USED")).content = "0"

            vm_elem.add_child(doc.create_element("VMS")).content         = "-1"
            vm_elem.add_child(doc.create_element("VMS_USED")).content    = "0"

            vm_elem.add_child(doc.create_element("VOLATILE_SIZE")).content       = "-1"
            vm_elem.add_child(doc.create_element("VOLATILE_SIZE_USED")).content  = "0"
        end


        vm_elem.xpath("CPU_USED").each { |e|

            # Because of bug http://dev.opennebula.org/issues/1567 the element
            # may contain a float number in scientific notation.

            # Check if the float value or the string representation mismatch,
            # but ignoring the precision

            cpu_used = (cpu_used / 100.0)

            different = ( e.text.to_f != cpu_used ||
                ![sprintf('%.2f', cpu_used), sprintf('%.1f', cpu_used), sprintf('%.0f', cpu_used)].include?(e.text)  )

            cpu_used_str = sprintf('%.2f', cpu_used)

            if different
                log_error("#{resource} #{oid} quotas: CPU_USED has #{e.text} \tis\t#{cpu_used_str}")
                e.content = cpu_used_str
            end
        }

        vm_elem.xpath("MEMORY_USED").each { |e|
            if e.text != mem_used.to_s
                log_error("#{resource} #{oid} quotas: MEMORY_USED has #{e.text} \tis\t#{mem_used}")
                e.content = mem_used.to_s
            end
        }

        vm_elem.xpath("VMS_USED").each { |e|
            if e.text != vms_used.to_s
                log_error("#{resource} #{oid} quotas: VMS_USED has #{e.text} \tis\t#{vms_used}")
                e.content = vms_used.to_s
            end
        }

        vm_elem.xpath("VOLATILE_SIZE_USED").each { |e|
            if e.text != vol_used.to_s
                log_error("#{resource} #{oid} quotas: VOLATILE_SIZE_USED has #{e.text} \tis\t#{vol_used}")
                e.content = vol_used.to_s
            end
        }

        # VNet quotas

        net_quota = nil
        doc.root.xpath("NETWORK_QUOTA").each { |e| net_quota = e }

        if net_quota.nil?
            net_quota = doc.root.add_child(doc.create_element("NETWORK_QUOTA"))
        end

        net_quota.xpath("NETWORK").each { |net_elem|
            vnet_id = net_elem.at_xpath("ID").text

            leases_used = vnet_usage.delete(vnet_id)

            leases_used = 0 if leases_used.nil?

            net_elem.xpath("LEASES_USED").each { |e|
                if e.text != leases_used.to_s
                    log_error("#{resource} #{oid} quotas: VNet #{vnet_id}\tLEASES_USED has #{e.text} \tis\t#{leases_used}")
                    e.content = leases_used.to_s
                end
            }
        }

        vnet_usage.each { |vnet_id, leases_used|
            log_error("#{resource} #{oid} quotas: VNet #{vnet_id}\tLEASES_USED has 0 \tis\t#{leases_used}")

            new_elem = net_quota.add_child(doc.create_element("NETWORK"))

            new_elem.add_child(doc.create_element("ID")).content = vnet_id
            new_elem.add_child(doc.create_element("LEASES")).content = "-1"
            new_elem.add_child(doc.create_element("LEASES_USED")).content = leases_used.to_s
        }


        # Image quotas

        img_quota = nil
        doc.root.xpath("IMAGE_QUOTA").each { |e| img_quota = e }

        if img_quota.nil?
            img_quota = doc.root.add_child(doc.create_element("IMAGE_QUOTA"))
        end

        img_quota.xpath("IMAGE").each { |img_elem|
            img_id = img_elem.at_xpath("ID").text

            rvms = img_usage.delete(img_id)

            rvms = 0 if rvms.nil?

            img_elem.xpath("RVMS_USED").each { |e|
                if e.text != rvms.to_s
                    log_error("#{resource} #{oid} quotas: Image #{img_id}\tRVMS has #{e.text} \tis\t#{rvms}")
                    e.content = rvms.to_s
                end
            }
        }

        img_usage.each { |img_id, rvms|
            log_error("#{resource} #{oid} quotas: Image #{img_id}\tRVMS has 0 \tis\t#{rvms}")

            new_elem = img_quota.add_child(doc.create_element("IMAGE"))

            new_elem.add_child(doc.create_element("ID")).content = img_id
            new_elem.add_child(doc.create_element("RVMS")).content = "-1"
            new_elem.add_child(doc.create_element("RVMS_USED")).content = rvms.to_s
        }

        # Datastore quotas
        ds_usage = {}

        @db.fetch("SELECT body FROM image_pool WHERE #{where_filter}") do |img_row|
            img_doc = Nokogiri::XML(img_row[:body],nil,NOKOGIRI_ENCODING){|c| c.default_xml.noblanks}

            img_doc.root.xpath("DATASTORE_ID").each { |e|
                ds_usage[e.text] = [0,0] if ds_usage[e.text].nil?
                ds_usage[e.text][0] += 1

                img_doc.root.xpath("SIZE").each { |size|
                    ds_usage[e.text][1] += size.text.to_i
                }

                img_doc.root.xpath("SNAPSHOTS/SNAPSHOT/SIZE").each { |size|
                    ds_usage[e.text][1] += size.text.to_i
                }
            }
        end

        ds_quota = nil
        doc.root.xpath("DATASTORE_QUOTA").each { |e| ds_quota = e }

        if ds_quota.nil?
            ds_quota = doc.root.add_child(doc.create_element("DATASTORE_QUOTA"))
        end

        ds_quota.xpath("DATASTORE").each { |ds_elem|
            ds_id = ds_elem.at_xpath("ID").text

            images_used,size_used = ds_usage.delete(ds_id)

            images_used = 0 if images_used.nil?
            size_used   = 0 if size_used.nil?

            ds_elem.xpath("IMAGES_USED").each { |e|
                if e.text != images_used.to_s
                    log_error("#{resource} #{oid} quotas: Datastore #{ds_id}\tIMAGES_USED has #{e.text} \tis\t#{images_used}")
                    e.content = images_used.to_s
                end
            }

            ds_elem.xpath("SIZE_USED").each { |e|
                if e.text != size_used.to_s
                    log_error("#{resource} #{oid} quotas: Datastore #{ds_id}\tSIZE_USED has #{e.text} \tis\t#{size_used}")
                    e.content = size_used.to_s
                end
            }
        }

        ds_usage.each { |ds_id, array|
            images_used,size_used = array

            log_error("#{resource} #{oid} quotas: Datastore #{ds_id}\tIMAGES_USED has 0 \tis\t#{images_used}")
            log_error("#{resource} #{oid} quotas: Datastore #{ds_id}\tSIZE_USED has 0 \tis\t#{size_used}")

            new_elem = ds_quota.add_child(doc.create_element("DATASTORE"))

            new_elem.add_child(doc.create_element("ID")).content = ds_id

            new_elem.add_child(doc.create_element("IMAGES")).content = "-1"
            new_elem.add_child(doc.create_element("IMAGES_USED")).content = images_used.to_s

            new_elem.add_child(doc.create_element("SIZE")).content = "-1"
            new_elem.add_child(doc.create_element("SIZE_USED")).content = size_used.to_s
        }
    end

    def mac_s_to_i(mac)
        return mac.split(":").map {|e|
            e.to_i(16).to_s(16).rjust(2,"0")}.join("").to_i(16)
    end

    def mac_i_to_s(mac)
        mac_s = mac.to_s(16).rjust(12, "0")
        return "#{mac_s[0..1]}:#{mac_s[2..3]}:#{mac_s[4..5]}:"<<
               "#{mac_s[6..7]}:#{mac_s[8..9]}:#{mac_s[10..11]}"
    end

    def ip6_prefix_s_to_i(prefix)
        return prefix.split(":", 4).map {|e|
            e.to_i(16).to_s(16).rjust(4, "0")}.join("").to_i(16)
    end

    # Copied from AddressRange::set_ip6 in AddressRange.cc
    def mac_to_ip6_suffix(mac_i)
        mac = [
            mac_i & 0x00000000FFFFFFFF,
            (mac_i & 0xFFFFFFFF00000000) >> 32
        ]

        mlow = mac[0]
        eui64 = [
            4261412864 + (mlow & 0x00FFFFFF),
            ((mac[1]+512)<<16) + ((mlow & 0xFF000000)>>16) + 0x000000FF
        ]

        return (eui64[1] << 32) + eui64[0]
    end

    def lease_to_s(lease)
        return lease[:ip].nil? ? lease[:mac].to_s : lease[:ip].to_s
    end

end
