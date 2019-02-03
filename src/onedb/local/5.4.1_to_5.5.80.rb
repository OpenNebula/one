# -------------------------------------------------------------------------- #
# Copyright 2002-2019, OpenNebula Project, OpenNebula Systems                #
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

require 'yaml'
require 'opennebula'

include OpenNebula

module Migrator
    def db_version
        "5.5.80"
    end

    def one_version
        "OpenNebula 5.5.80"
    end

    def up
        init_log_time()

        feature_5189()

        feature_1709()

        feature_1377()

        bug_2189()

        log_time()

        return true
    end

    private

    def xpath(doc, sxpath)
        element = doc.root.at_xpath(sxpath)
        if !element.nil?
            element.text
        else
            ""
        end
    end

    def delete_element(doc, element)
        doc.search("//#{element}").each do |node|
            node.remove
        end
    end

    def feature_1377()
        @db.run "DROP TABLE IF EXISTS old_document_pool;"
        @db.run "ALTER TABLE document_pool RENAME TO old_document_pool;"

        create_table(:document_pool)

        @db.transaction do
            @db.fetch("SELECT * FROM old_document_pool") do |row|
                doc = Nokogiri::XML(row[:body],nil,NOKOGIRI_ENCODING) { |c| 
                    c.default_xml.noblanks
                }

                delete_element(doc, "LOCK")

                @db[:document_pool].insert(
                    :oid        => row[:oid],
                    :name       => row[:name],
                    :body       => doc.root.to_s,
                    :type       => row[:type],
                    :uid        => row[:uid],
                    :gid        => row[:gid],
                    :owner_u    => row[:owner_u],
                    :group_u    => row[:group_u],
                    :other_u    => row[:other_u]
                )
            end
        end

      @db.run "DROP TABLE old_document_pool;"
    end

    def feature_1709()
        indexes = @db.indexes(:vm_pool)

        @db.alter_table(:vm_pool) do
            add_index :state, name: :state_idx if !indexes[:state_idx]
        end
    end

    def feature_5189()
        az_driver_conf = "#{ETC_LOCATION}/az_driver.conf.old"
        token = File.read(VAR_LOCATION+'/.one/one_key')
        to_encrypt = {}

        if !File.exist?(az_driver_conf)
            STDERR.puts "  > Old Az file not found, skipping Az host migration"
            return
        end

        begin
            az_conf = YAML::load(File.read(az_driver_conf))
        rescue Exception => e
            str_error="az_driver.conf invalid syntax!"
            raise str_error
        end

        regions = az_conf["regions"]

        if !regions
            STDERR.puts "  > Regions not found in Az config file, " << 
                "skipping migration"
            return
        end

        @db.run "DROP TABLE IF EXISTS old_host_pool;"
        @db.run "ALTER TABLE host_pool RENAME TO old_host_pool;"
        create_table(:host_pool)

        @db.transaction do
            @db.fetch("SELECT * FROM old_host_pool") do |row|
                doc = Nokogiri::XML(row[:body], nil, NOKOGIRI_ENCODING) { |c|
                    c.default_xml.noblanks
                }

                template = doc.root.at_xpath("TEMPLATE")

                if xpath(doc, "TEMPLATE/HYPERVISOR").to_s == "AZURE"
                    host_name = xpath(doc, "NAME").to_s
                    host_info = ( regions[host_name].nil? ? regions["default"] : regions[host_name] )

                    to_encrypt["AZ_ID"]=host_info["subscription_id"]
                    to_encrypt["AZ_CERT"] = File.read(host_info["pem_management_cert"])

                    OpenNebula.encrypt(to_encrypt, token).each { |k, v|
                        delete_element(template, k)
                        template.add_child(doc.create_element(k, v))
                    }

                    capacity = doc.create_element("CAPACITY")
                    host_info["capacity"].each { |k, v|
                        capacity.add_child(doc.create_element(k.upcase, v))
                    }

                    delete_element(template, "CAPACITY")
                    template.add_child(capacity)

                    delete_element(template, "REGION_NAME")
                    template.add_child(doc.create_element "REGION_NAME", host_info["region_name"])
                end

                row[:body] = doc.root.to_s
                @db[:host_pool].insert(row)
            end
        end
        @db.run "DROP TABLE old_host_pool;"

        STDERR.puts "  > You can now delete #{az_driver_conf} file"
    end

    def bug_2189()
        @db.run "DROP TABLE IF EXISTS old_image_pool;"
        @db.run "ALTER TABLE image_pool RENAME TO old_image_pool;"

        create_table(:image_pool)

        @db.transaction do
            @db.fetch("SELECT * FROM old_image_pool") do |row|
                doc = Nokogiri::XML(row[:body],nil,NOKOGIRI_ENCODING){
                    |c| c.default_xml.noblanks
                }

                max = doc.xpath("//SNAPSHOTS/SNAPSHOT/ID").max

                if max
                    next_snapshot = max.text.to_i + 1
                else
                    next_snapshot = 0
                end

                sxml = doc.xpath("//SNAPSHOTS")

                if !sxml
                    ns = doc.create_element("NEXT_SNAPSHOT")

                    ns.content = next_snapshot

                    sxml = sxml.first.add_child(ns)
                end

                @db[:image_pool].insert(
                    :oid      => row[:oid],
                    :name     => row[:name],
                    :body     => doc.root.to_s,
                    :uid      => row[:uid],
                    :gid      => row[:gid],
                    :owner_u  => row[:owner_u],
                    :group_u  => row[:group_u],
                    :other_u  => row[:other_u])
            end
        end

        @db.run "DROP TABLE old_image_pool;"

        @db.run "DROP TABLE IF EXISTS old_vm_pool;"
        @db.run "ALTER TABLE vm_pool RENAME TO old_vm_pool;"

        create_table(:vm_pool)

        @db.transaction do
            @db.fetch("SELECT * FROM old_vm_pool") do |row|
                doc = Nokogiri::XML(row[:body],nil,NOKOGIRI_ENCODING){ |c| 
                    c.default_xml.noblanks
                }

                max = doc.xpath("//SNAPSHOTS/SNAPSHOT/ID").max

                if max
                    next_snapshot = max.text.to_i + 1
                else
                    next_snapshot = 0
                end

                sxml = doc.xpath("//SNAPSHOTS")

                if !sxml
                    ns = doc.create_element("NEXT_SNAPSHOT")

                    ns.content = next_snapshot

                    sxml = sxml.first.add_child(ns)
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
        end

        @db.run "DROP TABLE old_vm_pool;"
    end
end
