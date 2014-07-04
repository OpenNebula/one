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

        return true
    end


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