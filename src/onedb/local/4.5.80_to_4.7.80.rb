# -------------------------------------------------------------------------- #
# Copyright 2002-2014, OpenNebula Project (OpenNebula.org), C12G Labs        #
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

require 'nokogiri'
require 'ipaddr'

module Migrator
    def db_version
        "4.7.80"
    end

    def one_version
        "OpenNebula 4.7.80"
    end

    def up

        init_log_time()

        @db.run "ALTER TABLE user_quotas RENAME TO old_user_quotas;"
        @db.run "CREATE TABLE user_quotas (user_oid INTEGER PRIMARY KEY, body MEDIUMTEXT);"

        @db.transaction do
            # oneadmin does not have quotas
            @db.fetch("SELECT * FROM old_user_quotas WHERE user_oid=0") do |row|
                @db[:user_quotas].insert(row)
            end

            @db.fetch("SELECT * FROM old_user_quotas WHERE user_oid>0") do |row|
                doc = Nokogiri::XML(row[:body]){|c| c.default_xml.noblanks}

                redo_quota_limits(doc)

                @db[:user_quotas].insert(
                    :user_oid   => row[:user_oid],
                    :body       => doc.root.to_s)
            end
        end

        @db.run "DROP TABLE old_user_quotas;"

        log_time()

        @db.run "ALTER TABLE group_quotas RENAME TO old_group_quotas;"
        @db.run "CREATE TABLE group_quotas (group_oid INTEGER PRIMARY KEY, body MEDIUMTEXT);"

        @db.transaction do
            # oneadmin does not have quotas
            @db.fetch("SELECT * FROM old_group_quotas WHERE group_oid=0") do |row|
                @db[:group_quotas].insert(row)
            end

            @db.fetch("SELECT * FROM old_group_quotas WHERE group_oid>0") do |row|
                doc = Nokogiri::XML(row[:body]){|c| c.default_xml.noblanks}

                redo_quota_limits(doc)

                @db[:group_quotas].insert(
                    :group_oid  => row[:group_oid],
                    :body       => doc.root.to_s)
            end
        end

        @db.run "DROP TABLE old_group_quotas;"

        log_time()

        default_user_quotas = nil
        default_group_quotas = nil

        @db.fetch("SELECT * FROM system_attributes WHERE name = 'DEFAULT_USER_QUOTAS'") do |row|
            default_user_quotas = Nokogiri::XML(row[:body]){|c| c.default_xml.noblanks}

            redo_quota_limits(default_user_quotas)
        end

        @db.fetch("SELECT * FROM system_attributes WHERE name = 'DEFAULT_GROUP_QUOTAS'") do |row|
            default_group_quotas = Nokogiri::XML(row[:body]){|c| c.default_xml.noblanks}

            redo_quota_limits(default_group_quotas)
        end

        @db[:system_attributes].where(:name => "DEFAULT_USER_QUOTAS").update(
            :body => default_user_quotas.root.to_s)

        @db[:system_attributes].where(:name => "DEFAULT_GROUP_QUOTAS").update(
            :body => default_group_quotas.root.to_s)

        log_time()

        ########################################################################
        # Networks
        ########################################################################

        @db.run "ALTER TABLE network_pool RENAME TO old_network_pool;"
        @db.run "CREATE TABLE network_pool (oid INTEGER PRIMARY KEY, name VARCHAR(128), body MEDIUMTEXT, uid INTEGER, gid INTEGER, owner_u INTEGER, group_u INTEGER, other_u INTEGER, cid INTEGER, UNIQUE(name,uid));"

        @db.fetch("SELECT * FROM old_network_pool") do |row|
            doc = Nokogiri::XML(row[:body]){|c| c.default_xml.noblanks}

            ranged = doc.root.at_xpath("TYPE").text == "0"
            doc.root.at_xpath("TYPE").remove

            global_prefix = doc.root.at_xpath("GLOBAL_PREFIX").text
            site_prefix = doc.root.at_xpath("SITE_PREFIX").text

            doc.root.at_xpath("GLOBAL_PREFIX").remove
            doc.root.at_xpath("SITE_PREFIX").remove

            doc.root.add_child(doc.create_element("PARENT_NETWORK_ID"))
            ar_pool = doc.root.add_child(doc.create_element("AR_POOL"))

            doc.root.at_xpath("TOTAL_LEASES").name = "USED_LEASES"

            type = "IP4"

            if(global_prefix != "" || site_prefix != "")
                force_e = doc.root.at_xpath("TEMPLATE/CONTEXT_FORCE_IPV4")

                if !force_e.nil? && force_e.text.upcase == "YES"
                    type = "IP4_6"
                else
                    type = "IP6"
                end
            end

            if ranged
                ip_start_s = doc.root.at_xpath("RANGE/IP_START").text
                ip_end_s   = doc.root.at_xpath("RANGE/IP_END").text

                doc.root.at_xpath("RANGE").remove

                ip_start = IPAddr.new(ip_start_s, Socket::AF_INET)
                ip_end   = IPAddr.new(ip_end_s, Socket::AF_INET)

                size = ip_end.to_i - ip_start.to_i + 1

                # TODO: hardcoded mac prefix
                mac = mac_to_s(0x200, ip_start.to_i)

                ar = add_element(ar_pool, "AR")
                add_cdata(ar, "AR_ID",  "0")
                add_cdata(ar, "MAC",    mac)
                add_cdata(ar, "SIZE",   size.to_s)
                add_cdata(ar, "TYPE",   type)

                if type == "IP4" || type == "IP4_6"
                    add_cdata(ar, "IP", ip_start_s)
                end

                if type == "IP6" || type == "IP4_6"
                    if global_prefix != ""
                        add_cdata(ar, "GLOBAL_PREFIX", global_prefix)
                    end

                    if site_prefix != ""
                        add_cdata(ar, "ULA_PREFIX", site_prefix)
                    end
                end

                allocated_str = ""

                @db.fetch("SELECT body FROM leases WHERE oid=#{row[:oid]}") do |lease_row|
                    lease = Nokogiri::XML(lease_row[:body]){|c| c.default_xml.noblanks}

                    # TODO: MAC_PREFIX?

                    # For ranged, all leases are used
                    # For ranged, IP == MAC_SUFFIX
                    ip  = lease.root.at_xpath("IP").text
                    vid = lease.root.at_xpath("VID").text.to_i

                    index = ip.to_i - ip_start.to_i

                    binary_magic = 0x0000001000000000 | (vid & 0xFFFFFFFF)

                    allocated_str << " #{index} #{binary_magic}"
                end

                add_cdata(ar, "ALLOCATED",  allocated_str)
            else
                ar_id = 0

                @db.fetch("SELECT body FROM leases WHERE oid=#{row[:oid]}") do |lease_row|
                    lease = Nokogiri::XML(lease_row[:body]){|c| c.default_xml.noblanks}

                    # For fixed, IP != MAC_SUFFIX

                    ip    = lease.root.at_xpath("IP").text
                    mac_p = lease.root.at_xpath("MAC_PREFIX").text
                    mac_s = lease.root.at_xpath("MAC_SUFFIX").text
                    used  = lease.root.at_xpath("USED").text
                    vid   = lease.root.at_xpath("VID").text.to_i

                    mac = mac_to_s(mac_p, mac_s)

                    allocated_str = ""

                    if used == "1"
                        binary_magic = 0x0000001000000000 | (vid & 0xFFFFFFFF)
                        allocated_str << " 0 #{binary_magic}"
                    end

                    ar = add_element(ar_pool, "AR")

                    add_cdata(ar, "AR_ID",      ar_id.to_s)
                    add_cdata(ar, "MAC",        mac)
                    add_cdata(ar, "SIZE",       "1")
                    add_cdata(ar, "TYPE",       type)
                    add_cdata(ar, "ALLOCATED",  allocated_str)

                    if type == "IP4" || type == "IP4_6"
                        add_cdata(ar, "IP", ip_to_s(ip))
                    end

                    if type == "IP6" || type == "IP4_6"
                        if global_prefix != ""
                            add_cdata(ar, "GLOBAL_PREFIX", global_prefix)
                        end

                        if site_prefix != ""
                            add_cdata(ar, "ULA_PREFIX", site_prefix)
                        end
                    end

                    ar_id += 1
                end
            end

            @db[:network_pool].insert(
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

        @db.run "DROP TABLE old_network_pool;"
        @db.run "DROP TABLE leases;"

        log_time()

        return true
    end

    ############################################################################

    def add_element(elem, name)
        return elem.add_child(elem.document.create_element(name))
    end

    def add_cdata(elem, name, text)
        # The cleaner doc.create_cdata(txt) is not supported in
        # old versions of nokogiri
        return add_element(elem, name).add_child(
                        Nokogiri::XML::CDATA.new(elem.document(), text))
    end

    def mac_to_s(prefix, suffix)
        hex_p = prefix.to_i.to_s(16).rjust(4, "0")
        hex_s = suffix.to_i.to_s(16).rjust(8, "0")

        mac = hex_p.insert(2,":").insert(5,":") <<
              hex_s.insert(2,":").insert(5,":").insert(8,":")
    end

    def ip_to_s(ip)
        hex = ip.to_i.to_s(16).rjust(8, "0")
        return "#{hex[0..1].hex}.#{hex[2..3].hex}.#{hex[4..5].hex}.#{hex[6..7].hex}"
    end

    ############################################################################

    def redo_quota_limits(doc)
        # VM quotas

        vm_elem = nil
        doc.root.xpath("VM_QUOTA/VM").each { |e| vm_elem = e }

        if !vm_elem.nil?
            ["CPU", "MEMORY", "VMS", "VOLATILE_SIZE"].each do |q_name|
                vm_elem.xpath(q_name).each do |e|
                    if e.text.to_i == 0
                        e.content = "-2"
                    end
                end
            end
        end

        # VNet quotas

        net_quota = nil
        doc.root.xpath("NETWORK_QUOTA").each { |e| net_quota = e }

        if !net_quota.nil?
            net_quota.xpath("NETWORK").each do |net_elem|
                net_elem.xpath("LEASES").each do |e|
                    if e.text.to_i == 0
                        e.content = "-2"
                    end
                end
            end
        end

        # Image quotas

        img_quota = nil
        doc.root.xpath("IMAGE_QUOTA").each { |e| img_quota = e }

        if !img_quota.nil?
            img_quota.xpath("IMAGE").each do |img_elem|
                img_elem.xpath("RVMS").each do |e|
                    if e.text.to_i == 0
                        e.content = "-2"
                    end
                end
            end
        end

        # Datastore quotas

        ds_quota = nil
        doc.root.xpath("DATASTORE_QUOTA").each { |e| ds_quota = e }

        if !ds_quota.nil?
            ds_quota.xpath("DATASTORE").each do |ds_elem|
                ["IMAGES", "SIZE"].each do |q_name|
                    ds_elem.xpath(q_name).each do |e|
                        if e.text.to_i == 0
                            e.content = "-2"
                        end
                    end
                end
            end
        end
    end
end