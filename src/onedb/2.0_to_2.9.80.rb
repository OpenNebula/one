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

module Migrator
    def db_version
        "2.9.80"
    end

    def one_version
        "OpenNebula 2.9.80"
    end

    def up
        ########################################################################
        # Users
        ########################################################################

        # 2.2 Schema
        # CREATE TABLE user_pool (oid INTEGER PRIMARY KEY, user_name VARCHAR(256), password TEXT,enabled INTEGER, UNIQUE(user_name));

        # Move table user_pool
        @db.run "ALTER TABLE user_pool RENAME TO old_user_pool;"

        # Create new user_pool
        @db.run "CREATE TABLE user_pool (oid INTEGER PRIMARY KEY, name VARCHAR(256), body TEXT, UNIQUE(name));"

        user_group_ids = ""

        # Read each entry in the old user_pool, and insert into new user_pool
        @db.fetch("SELECT * FROM old_user_pool") do |row|
            oid  = row[:oid]

            if( oid == 0 )
                gid = 0
                groupname = "oneadmin"
            else
                gid = 1
                groupname = "users"
                user_group_ids += "<ID>#{oid}</ID>"
            end

            name = row[:user_name]

            body = "<USER><ID>#{oid}</ID><GID>#{gid}</GID><GNAME>#{groupname}</GNAME><NAME>#{name}</NAME><PASSWORD>#{row[:password]}</PASSWORD><ENABLED>#{row[:enabled]}</ENABLED></USER>"

            @db[:user_pool].insert(
                :oid        => oid,
                :name       => name,
                :body       => body)
        end

        # Delete old user_pool
        @db.run "DROP TABLE old_user_pool"

        ########################################################################
        # Hosts
        ########################################################################

        # 2.2 Schema
        # CREATE TABLE host_pool (oid INTEGER PRIMARY KEY,host_name VARCHAR(256), state INTEGER,im_mad VARCHAR(128),vm_mad VARCHAR(128),tm_mad VARCHAR(128),last_mon_time INTEGER, cluster VARCHAR(128), template TEXT, UNIQUE(host_name));
        # CREATE TABLE host_shares(hid INTEGER PRIMARY KEY,disk_usage INTEGER, mem_usage INTEGER, cpu_usage INTEGER,max_disk  INTEGER,  max_mem   INTEGER, max_cpu   INTEGER,free_disk INTEGER,  free_mem  INTEGER, free_cpu  INTEGER,used_disk INTEGER,  used_mem  INTEGER, used_cpu  INTEGER,running_vms INTEGER);

        # Move table
        @db.run "ALTER TABLE host_pool RENAME TO old_host_pool;"

        # Create new table
        @db.run "CREATE TABLE host_pool (oid INTEGER PRIMARY KEY, name VARCHAR(256), body TEXT, state INTEGER, last_mon_time INTEGER, UNIQUE(name));"

        # Read each entry in the old table, and insert into new table
        @db.fetch("SELECT * FROM old_host_pool") do |row|
            oid             = row[:oid]
            name            = row[:host_name]
            state           = row[:state]
            last_mon_time   = row[:last_mon_time]

            # There is one host share for each host
            host_share = ""
            @db.fetch("SELECT * FROM host_shares WHERE hid=#{oid}") do |share|
                host_share = "<HOST_SHARE><DISK_USAGE>#{share[:disk_usage]}</DISK_USAGE><MEM_USAGE>#{share[:mem_usage]}</MEM_USAGE><CPU_USAGE>#{share[:cpu_usage]}</CPU_USAGE><MAX_DISK>#{share[:max_disk]}</MAX_DISK><MAX_MEM>#{share[:max_mem]}</MAX_MEM><MAX_CPU>#{share[:max_cpu]}</MAX_CPU><FREE_DISK>#{share[:free_disk]}</FREE_DISK><FREE_MEM>#{share[:free_mem]}</FREE_MEM><FREE_CPU>#{share[:free_cpu]}</FREE_CPU><USED_DISK>#{share[:used_disk]}</USED_DISK><USED_MEM>#{share[:used_mem]}</USED_MEM><USED_CPU>#{share[:used_cpu]}</USED_CPU><RUNNING_VMS>#{share[:running_vms]}</RUNNING_VMS></HOST_SHARE>"
            end

            # OpenNebula 2.X stored the cluster name, in 3.0 the cluster pool
            # disappears. The cluster name is added to the Host template, this
            # way the old VMs with REQUIREMENTS will keep working

            template_doc = REXML::Document.new( row[:template] )
            cluster_elem = template_doc.root.add_element("CLUSTER")
            cluster_elem.text = REXML::CData.new( row[:cluster] )

            body = "<HOST><ID>#{oid}</ID><NAME>#{name}</NAME><STATE>#{state}</STATE><IM_MAD>#{row[:im_mad]}</IM_MAD><VM_MAD>#{row[:vm_mad]}</VM_MAD><TM_MAD>#{row[:tm_mad]}</TM_MAD><LAST_MON_TIME>#{last_mon_time}</LAST_MON_TIME>#{host_share}#{ template_doc.to_s }</HOST>"

            @db[:host_pool].insert(
                :oid            => oid,
                :name           => name,
                :body           => body,
                :state          => state,
                :last_mon_time  => last_mon_time)
        end

        # Delete old table
        @db.run "DROP TABLE old_host_pool"
        @db.run "DROP TABLE host_shares"

        ########################################################################
        # Clusters
        ########################################################################

        # Clusters do not exist any more
        @db.run "DROP TABLE cluster_pool"

        ########################################################################
        # Images
        ########################################################################

        # 2.2 Schema
        # CREATE TABLE image_pool (oid INTEGER PRIMARY KEY, uid INTEGER, name VARCHAR(128), type INTEGER, public INTEGER, persistent INTEGER, regtime INTEGER, source TEXT, state INTEGER, running_vms INTEGER, template TEXT, UNIQUE(name) );

        # Move table
        @db.run "ALTER TABLE image_pool RENAME TO old_image_pool;"

        # Create new table
        @db.run "CREATE TABLE image_pool (oid INTEGER PRIMARY KEY, name VARCHAR(256), body TEXT, uid INTEGER, gid INTEGER, public INTEGER, UNIQUE(name,uid) );"

        # Read each entry in the old table, and insert into new table
        @db.fetch("SELECT * FROM old_image_pool") do |row|
            oid    = row[:oid]
            name   = row[:name]
            uid    = row[:uid]
            gid    = (uid == 0) ? 0 : 1
            group  = (uid == 0) ? "oneadmin" : "users"
            public = row[:public]

            # In OpenNebula 2.0 Image States go from 0 to 3, in 3.0 go
            # from 0 to 5, but the meaning is the same for states 0 to 3
            body = "<IMAGE><ID>#{oid}</ID><UID>#{row[:uid]}</UID><GID>#{gid}</GID><UNAME>#{get_username(row[:uid])}</UNAME><GNAME>#{group}</GNAME><NAME>#{name}</NAME><TYPE>#{row[:type]}</TYPE><PUBLIC>#{public}</PUBLIC><PERSISTENT>#{row[:persistent]}</PERSISTENT><REGTIME>#{row[:regtime]}</REGTIME><SOURCE>#{row[:source]}</SOURCE><STATE>#{row[:state]}</STATE><RUNNING_VMS>#{row[:running_vms]}</RUNNING_VMS>#{row[:template]}</IMAGE>"

            @db[:image_pool].insert(
                :oid        => oid,
                :name       => name,
                :body       => body,
                :uid        => uid,
                :gid        => gid,
                :public     => public)
        end

        # Delete old table
        @db.run "DROP TABLE old_image_pool"

        ########################################################################
        # VMs
        ########################################################################

        # 2.2 Schema
        # CREATE TABLE vm_pool (oid INTEGER PRIMARY KEY,uid INTEGER,name TEXT,last_poll INTEGER, state INTEGER,lcm_state INTEGER,stime INTEGER,etime INTEGER,deploy_id TEXT,memory INTEGER,cpu INTEGER,net_tx INTEGER,net_rx INTEGER, last_seq INTEGER, template TEXT);
        # CREATE TABLE history (vid INTEGER,seq INTEGER,host_name TEXT,vm_dir TEXT,hid INTEGER,vm_mad TEXT,tm_mad TEXT,stime INTEGER,etime INTEGER,pstime INTEGER,petime INTEGER,rstime INTEGER,retime INTEGER,estime INTEGER,eetime INTEGER,reason INTEGER,PRIMARY KEY(vid,seq));

        # Move tables
        @db.run "ALTER TABLE vm_pool RENAME TO old_vm_pool;"
        @db.run "ALTER TABLE history RENAME TO old_history;"

        # Create new tables
        @db.run "CREATE TABLE vm_pool (oid INTEGER PRIMARY KEY, name TEXT, body TEXT, uid INTEGER, gid INTEGER, last_poll INTEGER, state INTEGER, lcm_state INTEGER);"
        @db.run "CREATE TABLE history (vid INTEGER, seq INTEGER, body TEXT, PRIMARY KEY(vid,seq));"


        # Read each entry in the old history table, and insert into new table
        @db.fetch("SELECT * FROM old_history") do |row|
            vid = row[:vid]
            seq = row[:seq]

            body = "<HISTORY><SEQ>#{seq}</SEQ><HOSTNAME>#{row[:host_name]}</HOSTNAME><VM_DIR>#{row[:vm_dir]}</VM_DIR><HID>#{row[:hid]}</HID><STIME>#{row[:stime]}</STIME><ETIME>#{row[:etime]}</ETIME><VMMMAD>#{row[:vm_mad]}</VMMMAD><TMMAD>#{row[:tm_mad]}</TMMAD><PSTIME>#{row[:pstime]}</PSTIME><PETIME>#{row[:petime]}</PETIME><RSTIME>#{row[:rstime]}</RSTIME><RETIME>#{row[:retime]}</RETIME><ESTIME>#{row[:estime]}</ESTIME><EETIME>#{row[:eetime]}</EETIME><REASON>#{row[:reason]}</REASON></HISTORY>"

            @db[:history].insert(
                :vid        => vid,
                :seq        => seq,
                :body       => body)
        end


        # Read each entry in the old vm table, and insert into new table
        @db.fetch("SELECT * FROM old_vm_pool") do |row|
            oid       = row[:oid]
            name      = row[:name]
            uid       = row[:uid]
            gid       = (uid == 0) ? 0 : 1
            group     = (uid == 0) ? "oneadmin" : "users"
            last_poll = row[:last_poll]
            state     = row[:state]
            lcm_state = row[:lcm_state]

            # If the VM has History items, the last one is included in the XML
            history = ""
            @db.fetch("SELECT body FROM history WHERE vid=#{oid} AND seq=(SELECT MAX(seq) FROM history WHERE vid=#{oid})") do |history_row|
                history = history_row[:body]
            end

            if ( history != "" )
                history = "<HISTORY_RECORDS>#{history}</HISTORY_RECORDS>"
            end

            body = "<VM><ID>#{oid}</ID><UID>#{uid}</UID><GID>#{gid}</GID><UNAME>#{get_username(uid)}</UNAME><GNAME>#{group}</GNAME><NAME>#{name}</NAME><LAST_POLL>#{last_poll}</LAST_POLL><STATE>#{state}</STATE><LCM_STATE>#{lcm_state}</LCM_STATE><STIME>#{row[:stime]}</STIME><ETIME>#{row[:etime]}</ETIME><DEPLOY_ID>#{row[:deploy_id]}</DEPLOY_ID><MEMORY>#{row[:memory]}</MEMORY><CPU>#{row[:cpu]}</CPU><NET_TX>#{row[:net_tx]}</NET_TX><NET_RX>#{row[:net_rx]}</NET_RX>#{row[:template]}#{history}</VM>"

            @db[:vm_pool].insert(
                :oid        => oid,
                :name       => name,
                :body       => body,
                :uid        => uid,
                :gid        => gid,
                :last_poll  => last_poll,
                :state      => state,
                :lcm_state  => lcm_state)
        end


        # Delete old tables
        @db.run "DROP TABLE old_vm_pool"
        @db.run "DROP TABLE old_history"


        ########################################################################
        # Virtual Networks
        ########################################################################

        # 2.2 Schema
        # CREATE TABLE network_pool (oid INTEGER PRIMARY KEY, uid INTEGER, name VARCHAR(256), type INTEGER, bridge TEXT, public INTEGER, template TEXT, UNIQUE(name));
        # CREATE TABLE leases (oid INTEGER, ip BIGINT, mac_prefix BIGINT, mac_suffix BIGINT,vid INTEGER, used INTEGER, PRIMARY KEY(oid,ip));

        # Move tables
        @db.run "ALTER TABLE network_pool RENAME TO old_network_pool;"
        @db.run "ALTER TABLE leases RENAME TO old_leases;"

        # Create new tables
        @db.run "CREATE TABLE network_pool (oid INTEGER PRIMARY KEY, name VARCHAR(128), body TEXT, uid INTEGER, gid INTEGER, public INTEGER, UNIQUE(name,uid));"
        @db.run "CREATE TABLE leases (oid INTEGER, ip BIGINT, body TEXT, PRIMARY KEY(oid,ip));"

        # Read each entry in the old table, and insert into new table
        @db.fetch("SELECT * FROM old_network_pool") do |row|
            oid    = row[:oid]
            name   = row[:name]
            uid    = row[:uid]
            gid    = (uid == 0) ? 0 : 1
            group  = (uid == 0) ? "oneadmin" : "users"
            public = row[:public]

            total_leases = 0
            @db.fetch("SELECT COUNT(ip) FROM old_leases WHERE (oid=#{oid} AND used=1)") do |r|
                total_leases = r[:"COUNT(ip)"]
            end


            # <TOTAL_LEASES> is stored in the DB, but it is not used to rebuild
            # the VirtualNetwork object, and it is generated each time the
            # network is listed. So setting it to 0 is safe
            body = "<VNET><ID>#{oid}</ID><UID>#{uid}</UID><GID>#{gid}</GID><UNAME>#{get_username(uid)}</UNAME><GNAME>#{group}</GNAME><NAME>#{name}</NAME><TYPE>#{row[:type]}</TYPE><BRIDGE>#{row[:bridge]}</BRIDGE><PUBLIC>#{public}</PUBLIC><TOTAL_LEASES>#{total_leases}</TOTAL_LEASES>#{row[:template]}</VNET>"

            @db[:network_pool].insert(
                :oid        => oid,
                :name       => name,
                :body       => body,
                :uid        => uid,
                :gid        => gid,
                :public     => public)
        end

        # Read each entry in the old table, and insert into new table
        @db.fetch("SELECT * FROM old_leases") do |row|
            oid = row[:oid]
            ip  = row[:ip]

            body = "<LEASE><IP>#{ip}</IP><MAC_PREFIX>#{row[:mac_prefix]}</MAC_PREFIX><MAC_SUFFIX>#{row[:mac_suffix]}</MAC_SUFFIX><USED>#{row[:used]}</USED><VID>#{row[:vid]}</VID></LEASE>"

            @db[:leases].insert(
                :oid        => oid,
                :ip         => ip,
                :body       => body)
        end

        # Delete old tables
        @db.run "DROP TABLE old_network_pool"
        @db.run "DROP TABLE old_leases"


        ########################################################################
        # New tables in DB version 1
        ########################################################################

        @db.run "CREATE TABLE db_versioning (oid INTEGER PRIMARY KEY, version VARCHAR(256), timestamp INTEGER, comment VARCHAR(256));"
        @db.run "CREATE TABLE template_pool (oid INTEGER PRIMARY KEY, name VARCHAR(256), body TEXT, uid INTEGER, gid INTEGER, public INTEGER);"
        @db.run "CREATE TABLE acl (oid INT PRIMARY KEY, user BIGINT, resource BIGINT, rights BIGINT);"

        # The group pool has two default ones
        @db.run "CREATE TABLE group_pool (oid INTEGER PRIMARY KEY, name VARCHAR(256), body TEXT, UNIQUE(name));"
        @db.run "INSERT INTO group_pool VALUES(0,'oneadmin','<GROUP><ID>0</ID><NAME>oneadmin</NAME><USERS><ID>0</ID></USERS></GROUP>');"
        @db.run "INSERT INTO group_pool VALUES(1,'users','<GROUP><ID>1</ID><NAME>users</NAME><USERS>#{user_group_ids}</USERS></GROUP>');"

        # New pool_control table contains the last_oid used, must be rebuilt
        @db.run "CREATE TABLE pool_control (tablename VARCHAR(32) PRIMARY KEY, last_oid BIGINT UNSIGNED)"

        for table in ["user_pool", "host_pool", "image_pool", "vm_pool", "network_pool"] do
            @db.fetch("SELECT MAX(oid) FROM #{table}") do |row|
                if( row[:"MAX(oid)"] != nil )
                    @db.run "INSERT INTO pool_control (tablename, last_oid) VALUES ('#{table}', #{row[:"MAX(oid)"]});"
                end
            end
        end

        # First 100 group Ids are reserved for system groups.
        # Regular ones start from ID 100
        @db.run "INSERT INTO pool_control (tablename, last_oid) VALUES ('group_pool', 99);"

        return true
    end

    def get_username(uid)
        username = ""

        @db.fetch("SELECT name FROM user_pool WHERE oid=#{uid}") do |user|
            username = user[:name]
        end

        return username
    end
end
