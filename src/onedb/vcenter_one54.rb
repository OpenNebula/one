# -------------------------------------------------------------------------- #
# Copyright 2002-2024, OpenNebula Project, OpenNebula Systems                #
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

LOG     = LOG_LOCATION + "/onedb-vcenter-one54.log"
TMP_DIR = "/var/tmp/vcenter_one54"

module One54Vcenter
    VERSION = "5.4.0"

    def check_db_version(ops)
        db_version = read_db_version()

        if ( db_version[:version] != VERSION )

            raise <<-EOT
Version mismatch: vcenter migration is for version #{VERSION}

Current database is version #{db_version[:version]}
EOT
        end
    end

    def migrate_templates(verbose)
        Dir["#{TMP_DIR}/one_migrate_template_*"].each do |template_filename|
            template_id = template_filename.split("_")[-1]
            template_xml = File.read(template_filename)
            @db.run("UPDATE template_pool SET body='#{template_xml}' WHERE oid='#{template_id}'")
            puts "    Template #{template_id} migrated!" if verbose
        end

        return true
    end

    def migrate_vms(verbose)
        Dir["#{TMP_DIR}/one_migrate_vm_*"].each do |vm_filename|
            vm_id = vm_filename.split("_")[-1]
            vm_xml = File.read(vm_filename)

            vm_xml_doc = REXML::Document.new(vm_xml).root

            seq_node  = vm_xml_doc.elements["HISTORY_RECORDS/HISTORY/SEQ"]
            dsid_node = vm_xml_doc.elements["HISTORY_RECORDS/HISTORY/DS_ID"]

            if seq_node && seq_node.has_text? && dsid_node && dsid_node.has_text?
                seq = seq_node.text
                dsid= dsid_node.text
                begin

                h_dataset = @db["SELECT body from history where vid=#{vm_id} and seq=#{seq}"]
                h_body    = h_dataset.map(:body)

                h_xml = REXML::Document.new(h_body[0]).root

                h_ds_node = h_xml.elements["DS_ID"]

                if h_ds_node && h_ds_node.has_text?
                    h_ds_node.text = dsid

                    h_xml.delete_element "TM_MAD"

                    tmmad_elem = REXML::Element.new("TM_MAD")
                    tmmad_elem.text = "vcenter"
                    h_xml.add_element(tmmad_elem)

                    @db.run("UPDATE history SET body='#{h_xml.to_s}' WHERE vid=#{vm_id} and seq=#{seq}")
                end

                rescue
                    puts "VM #{vm_id} cannot set datastore. Manual update needed"
                end
            end

            @db.run("UPDATE vm_pool SET body='#{vm_xml}' WHERE oid='#{vm_id}'")
            puts "    VM #{vm_id} migrated!" if verbose
        end

        return true
    end

    def migrate_hosts(verbose)
        Dir["#{TMP_DIR}/one_migrate_host_*"].each do |host_filename|
            host_id  = host_filename.split("_")[-1]
            host_xml = File.read(host_filename)
            @db.run("UPDATE host_pool SET body='#{host_xml}' WHERE oid='#{host_id}'")
            puts "    Host #{host_id} migrated!" if verbose
        end

        return true
    end

    def migrate_datastores(verbose)
        Dir["#{TMP_DIR}/one_migrate_ds_*"].each do |ds_filename|
            ds_id  = ds_filename.split("_")[-1]
            ds_xml =  File.read(ds_filename)
            @db.run("UPDATE datastore_pool SET body='#{ds_xml}' WHERE oid='#{ds_id}'")
            puts "    Datastore #{ds_id} migrated!" if verbose
        end

        return true
    end

    def migrate_vnets(verbose)
        Dir["#{TMP_DIR}/one_migrate_vnet_*"].each do |vnet_filename|
            vnet_id  = vnet_filename.split("_")[-1]
            vnet_xml = File.read(vnet_filename)
            @db.run("UPDATE network_pool SET body='#{vnet_xml}' WHERE oid='#{vnet_id}'")
            puts "    Network #{vnet_id} migrated!" if verbose
        end

        return true
    end

    def migrate_images(verbose)
        Dir["#{TMP_DIR}/one_migrate_image_*"].each do |image_filename|
            image_id  = image_filename.split("_")[-1]
            image_xml = File.read(image_filename)
            @db.run("UPDATE image_pool SET body='#{image_xml}' WHERE oid='#{image_id}'")
            puts "    Image #{image_id} migrated!" if verbose
        end

        return true
    end

    def migrate_history(verbose)
        Dir["#{TMP_DIR}/one_migrate_history_*"].each do |history_filename|
            vm_id  = history_filename.split("_")[-2]
            seq_id = history_filename.split("_")[-1]
            history_xml = File.read(history_filename)
            @db.run("UPDATE history SET body='#{history_xml}' WHERE vid='#{vm_id}' and seq='#{seq_id}'")
            puts "    History for VM #{vm_id} migrated!" if verbose
        end

        return true
    end
end
