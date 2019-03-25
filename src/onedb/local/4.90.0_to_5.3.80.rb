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


require 'set'
require 'base64'
require 'zlib'
require 'pathname'
require 'yaml'
require 'opennebula'

$: << File.dirname(__FILE__)

include OpenNebula

module Migrator
    def db_version
        "5.3.80"
    end

    def one_version
        "OpenNebula 5.3.80"
    end

    def up
        init_log_time()

        feature_5136()

        feature_4901()

        feature_5005()

        feature_2347()

        bug_3705()

        feature_4809()

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

    ############################################################################
    # Feature 5136. Improve ec2 keys_ids_security
    #
    ############################################################################
    def feature_5136
        ec2_driver_conf = "#{ETC_LOCATION}/ec2_driver.conf.old"
        token = File.read(VAR_LOCATION+'/.one/one_key')
        to_encrypt = {}

        if !File.exist?(ec2_driver_conf)
            STDERR.puts "  > Old EC2 file not found, skipping EC2 host migration"
            return
        end

        begin
            ec2_conf = YAML::load(File.read(ec2_driver_conf))
        rescue Exception => e
            str_error="ec2_driver.conf invalid syntax!"
            raise str_error
        end

        regions = ec2_conf["regions"]

        if !regions
            STDERR.puts "  > Regions not found in EC2 config file, skipping migration"
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

                if xpath(doc, "TEMPLATE/HYPERVISOR").to_s == "ec2"
                    host_name = xpath(doc, "NAME").to_s
                    host_info = ( regions[host_name].nil? ? regions["default"] : regions[host_name] )

                    to_encrypt["EC2_ACCESS"]=host_info["access_key_id"]
                    to_encrypt["EC2_SECRET"]=host_info["secret_access_key"]

                    OpenNebula.encrypt(to_encrypt, token).each { |k, v|
                        delete_element(template, k)
                        template.add_child(doc.create_element(k, v))
                    }

                    capacity = doc.create_element("CAPACITY")
                    host_info["capacity"].each { |k, v|
                        name = k.gsub(".", "_")
                        capacity.add_child(doc.create_element(name.upcase, v))
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

        STDERR.puts "  > You can now delete #{ec2_driver_conf} file"
    end

    ############################################################################
    # Feature 4921. Adds TOTAL_CPU and TOTAL_MEM to HOST/HOST_SHARE to compute
    # MAX_CPU and MAX_MEM when RESERVED_CPU/MEM is updated
    ############################################################################
    def feature_4901
        @db.run "DROP TABLE IF EXISTS old_host_pool;"
        @db.run "ALTER TABLE host_pool RENAME TO old_host_pool;"
        create_table(:host_pool)

        @db.transaction do
            @db.fetch("SELECT * FROM old_host_pool") do |row|
                doc = Nokogiri::XML(row[:body], nil, NOKOGIRI_ENCODING) { |c|
                    c.default_xml.noblanks
                }

                rcpu = xpath(doc, "TEMPLATE/RESERVED_CPU").to_i
                rmem = xpath(doc, "TEMPLATE/RESERVED_MEM").to_i

                total_cpu = xpath(doc, "HOST_SHARE/MAX_CPU").to_i + rcpu
                total_mem = xpath(doc, "HOST_SHARE/MAX_MEM").to_i + rmem

                total_cpu_e = doc.create_element "TOTAL_CPU", total_cpu
                total_mem_e = doc.create_element "TOTAL_MEM", total_mem

                host_share = doc.root.at_xpath("HOST_SHARE")
                host_share.add_child(total_cpu_e)
                host_share.add_child(total_mem_e)

                row[:body] = doc.root.to_s

                @db[:host_pool].insert(row)
            end
        end

        @db.run "DROP TABLE old_host_pool;"
    end

    ############################################################################
    # Feature 5005.
    # Adds UID, GID and REQUEST_ID to history records
    # It also changes the old naming for mads from 4.x to 5.x
    ############################################################################
    def feature_5005
        @db.run "DROP TABLE IF EXISTS old_vm_pool;"
        @db.run "ALTER TABLE vm_pool RENAME TO old_vm_pool;"
        create_table(:vm_pool)

        @db.transaction do
            @db.fetch("SELECT * FROM old_vm_pool") do |row|

                doc = Nokogiri::XML(row[:body], nil, NOKOGIRI_ENCODING) { |c|
                  c.default_xml.noblanks
                }

                doc.root.xpath("HISTORY_RECORDS/HISTORY").each do |h|
                    reason = h.xpath("REASON")
                    reason.unlink if !reason.nil?

                    uid = doc.create_element "UID", -1
                    gid = doc.create_element "GID", -1
                    rid = doc.create_element "REQUEST_ID", -1

                    h.add_child(uid)
                    h.add_child(gid)
                    h.add_child(rid)
                end

                row[:body] = doc.root.to_s

                @db[:vm_pool].insert(row)
            end
        end

        @db.run "DROP TABLE old_vm_pool;"

        @db.run "DROP TABLE IF EXISTS old_history;"
        @db.run "ALTER TABLE history RENAME TO old_history;"
        create_table(:history)

        @db.transaction do
            @db.fetch("SELECT * FROM old_history") do |row|
                doc = Nokogiri::XML(row[:body], nil, NOKOGIRI_ENCODING) { |c|
                    c.default_xml.noblanks
                }

                h = doc.root

                reason = h.xpath("REASON")
                reason.unlink if !reason.nil?

                uid = doc.create_element "UID", -1
                gid = doc.create_element "GID", -1
                rid = doc.create_element "REQUEST_ID", -1

                h.add_child(uid)
                h.add_child(gid)
                h.add_child(rid)

                # This section is unrelated to Feature 5005. It renames
                # attributes in the history with the  nomenclature that was in
                # use before OpenNebula 5.0.
                vm_mad = h.at_xpath("VMMMAD")
                vm_mad.node_name = "VM_MAD" if vm_mad

                tm_mad = h.at_xpath("TMMAD")
                tm_mad.node_name = "TM_MAD" if tm_mad

                vn_mad = h.at_xpath("VNMMAD")
                vn_mad.remove if vn_mad

                row[:body] = doc.root.to_s

                @db[:history].insert(row)
            end
        end

        @db.run "DROP TABLE old_history;"
    end

    def feature_2347
        create_table(:vmgroup_pool)
    end

    ############################################################################
    # Bug 3705
    # Adds DRIVER to CEPH and LVM image datastores
    ############################################################################
    def bug_3705
        @db.run "DROP TABLE IF EXISTS old_datastore_pool;"
        @db.run "ALTER TABLE datastore_pool RENAME TO old_datastore_pool;"
        create_table(:datastore_pool)

        @db.transaction do
            @db.fetch("SELECT * FROM old_datastore_pool") do |row|
                doc = Nokogiri::XML(row[:body], nil, NOKOGIRI_ENCODING) { |c|
                    c.default_xml.noblanks
                }

                type = xpath(doc, 'TYPE').to_i
                tm_mad = xpath(doc, 'TM_MAD')

                if (type == 0) && (["ceph", "fs_lvm"].include?(tm_mad))
                    doc.root.xpath("TEMPLATE/DRIVER").each do |d|
                        d.remove
                    end

                    driver = doc.create_element "DRIVER", "raw"
                    doc.root.at_xpath("TEMPLATE").add_child(driver)

                    row[:body] = doc.root.to_s
                end

                @db[:datastore_pool].insert(row)
            end
        end

        @db.run "DROP TABLE old_datastore_pool;"
    end

    ############################################################################
    # Feature 4809
    # Simplify HA management in OpenNebula
    ############################################################################
    def feature_4809
        create_table(:logdb)

        @db.run "DROP TABLE IF EXISTS old_zone_pool;"
        @db.run "ALTER TABLE zone_pool RENAME TO old_zone_pool;"
        create_table(:zone_pool)

        @db.transaction do
            @db.fetch("SELECT * FROM old_zone_pool") do |row|
                doc = Nokogiri::XML(row[:body], nil, NOKOGIRI_ENCODING) { |c|
                    c.default_xml.noblanks
                }

                server_pool = doc.create_element "SERVER_POOL"
                doc.root.add_child(server_pool)

                row[:body] = doc.root.to_s

                @db[:zone_pool].insert(row)
            end
        end

        @db.run "DROP TABLE old_zone_pool;"
    end
end
