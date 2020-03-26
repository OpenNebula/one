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
require 'vcenter_driver'

$LOAD_PATH << File.dirname(__FILE__)

include OpenNebula

module Migrator

    def db_version
        '5.7.80'
    end

    def one_version
        'OpenNebula 5.7.80'
    end

    def up
        feature_2944
        bug_2687 # MUST be run before 2489, which generates short body
        feature_2253
        feature_2489_2671
        feature_826
        feature_2966
        true
    end

    private

    def feature_2944
        vclient =->(hid){
            row = @db.fetch("SELECT * FROM host_pool WHERE oid = #{hid}").first
            raise "Host #{hid} not found in the OpenNebula DB" if !row[:body]
            xml = row[:body]

            doc = nokogiri_doc(xml, 'host_pool').root.at_xpath('/HOST/TEMPLATE')

            rp = doc.xpath("VCENTER_RESOURCE_POOL").first
            rp = rp.text if rp

            token    = File.read(VAR_LOCATION+'/.one/one_key')
            password = doc.xpath("VCENTER_PASSWORD").first.text
            password = VCenterDriver::VIClient::decrypt(password, token)

            connection = {
                :host     => doc.xpath("VCENTER_HOST").first.text,
                :user     => doc.xpath("VCENTER_USER").first.text,
                :rp       => rp,
                :ccr      => doc.xpath("VCENTER_CCR_REF").first.text,
                :password => password
            }

            VCenterDriver::VIClient.new(connection)
        }

        @db.fetch('SELECT * FROM vm_pool') do |row|
            begin
                doc = nokogiri_doc(row[:body], 'vm_pool')

                one_vm = OpenNebula::XMLElement.new(doc.root.at_xpath('/VM'))

                next unless one_vm["USER_TEMPLATE/HYPERVISOR"] == 'vcenter'

                vmid      = one_vm['ID']
                hid       = one_vm['HISTORY_RECORDS/HISTORY/HID[last()]']
                vmref     = one_vm['DEPLOY_ID']

                next if !vmref || one_vm['STATE'] == '6'

                vi_client = vclient.call(hid)

                puts
                puts "one Machine #{vmid} vCenter ref: #{vmref}"
                vm = VCenterDriver::VirtualMachine.new(vi_client, vmref, vmid).tap do |i|
                    i.one_item = one_vm
                end

                extraconfig = []
                vm.disks_each(:managed?) do |disk|
                    begin
                        k    = "opennebula.mdisk.#{disk.id}"
                        v    = "#{disk.key}"
                    rescue StandardError => e
                        puts "  disk:#{disk.id}"
                        puts "   #{e.message} (No action needed)"
                        next
                    end

                    extraconfig << {key: k, value: v}
                    puts "  write #{k} : #{v}"
                end

                spec = RbVmomi::VIM.VirtualMachineConfigSpec(
                    { :extraConfig => extraconfig }
                )
                vm.item.ReconfigVM_Task(:spec => spec).wait_for_completion
            rescue StandardError => e
                if e.message.include? 'reference does not exist'
                    STDERR.puts "  This machine does not exist in vCenter"
                else
                    STDERR.puts "Couldn't process VM #{vmid}." if vmid
                    STDERR.puts e.message
                end
            end
        end
    end

    def feature_2253
        @db.run 'DROP TABLE IF EXISTS old_network_pool;'
        @db.run 'ALTER TABLE network_pool RENAME TO old_network_pool;'
        create_table(:network_pool)

        @db.transaction do
            # update virtual networks
            @db.fetch('SELECT * FROM old_network_pool') do |row|
                doc = nokogiri_doc(row[:body], 'old_network_pool')

                if doc.root.at_xpath('BRIDGE_TYPE').to_s.empty?
                    vn_mad = doc.root.at_xpath('/VNET/VN_MAD').text

                    bridge_type = doc.create_element('BRIDGE_TYPE')
                    bridge_type.add_child(bridge_type_by_vn_mad(vn_mad))
                    doc.root.at_xpath('/VNET').add_child(bridge_type)
                    row[:body] = doc.root.to_s
                end

                @db[:network_pool].insert(row)
            end
        end

        @db.run 'DROP TABLE old_network_pool;'

        @db.run 'DROP TABLE IF EXISTS old_vm_pool;'
        @db.run 'ALTER TABLE vm_pool RENAME TO old_vm_pool;'

        create_table(:vm_pool)

        @db.transaction do
            # updates VM's nics
            @db.fetch('SELECT * FROM old_vm_pool') do |row|
                doc = nokogiri_doc(row[:body], 'old_vm_pool')

                if !doc.root.at_xpath('TEMPLATE/NIC').to_s.empty?
                    doc.root.xpath('//NIC').map do |nic|
                        next unless nic.xpath('BRIDGE_TYPE').to_s.empty?

                        vn_mad = nic.xpath('VN_MAD').text

                        bridge_type = doc.create_element('BRIDGE_TYPE')
                        bridge_type.add_child(bridge_type_by_vn_mad(vn_mad))
                        nic.add_child(bridge_type)
                    end

                    row[:body] = doc.root.to_s
                end

                @db[:vm_pool].insert(row)
            end
        end

        @db.run 'DROP TABLE old_vm_pool;'
    end

    def feature_2489_2671
        @db.run 'DROP TABLE IF EXISTS old_vm_pool;'
        @db.run 'ALTER TABLE vm_pool RENAME TO old_vm_pool;'

        create_table(:vm_pool)

        @db.transaction do
            @db.fetch('SELECT * FROM old_vm_pool') do |row|
                doc = nokogiri_doc(row[:body], 'old_vm_pool')

                row[:short_body] = gen_short_body(doc)
                row[:search_token] = gen_search_body(doc)

                @db[:vm_pool].insert(row)
            end
        end

        @db.run 'DROP TABLE old_vm_pool;'
    end

    def bridge_type_by_vn_mad(vn_mad)
        case vn_mad
        when 'vcenter'
            return 'vcenter_port_groups'
        when 'ovswitch', 'ovswitch_vxlan'
            return 'openvswitch'
        else
            return 'linux'
        end
    end

    def gen_search_body(body)

        search_body = "UNAME=" + escape_token(body.root.xpath('UNAME').text) + "\n" +
                      "GNAME=" + escape_token(body.root.xpath('GNAME').text) + "\n" +
                      "NAME=" + escape_token(body.root.xpath('NAME').text) + "\n" +
                      "LAST_POLL=" + escape_token(body.root.xpath('LAST_POLL').text) + "\n" +
                      "PREV_STATE=" + escape_token(body.root.xpath('PREV_STATE').text) + "\n" +
                      "PREV_LCM_STATE=" + escape_token(body.root.xpath('PREV_LCM_STATE').text) + "\n" +
                      "RESCHED=" + escape_token(body.root.xpath('RESCHED').text) + "\n" +
                      "STIME=" + escape_token(body.root.xpath('STIME').text) + "\n" +
                      "ETIME=" + escape_token(body.root.xpath('ETIME').text) + "\n" +
                      "DEPLOY_ID=" + escape_token(body.root.xpath('DEPLOY_ID').text) + "\n"

        body.root.xpath("//TEMPLATE/*").each do |node|
            search_body += to_token(node)
        end

        node = Nokogiri::XML(body.root.xpath("//HISTORY_RECORDS/HISTORY[last()]").to_s)

        if !node.root.nil?
            search_body += history_to_token(node)
        end

        return search_body
    end

    def to_token(node)
        search_body = ""
        if node.children.size > 1
            node.children.each do |child|
                search_body += to_token(child)
            end
        elsif
            search_body += node.name + "=" + escape_token(node.children.text) + "\n"
        end

        return search_body
    end

    def history_to_token(hr)
        hr_token = "HOSTNAME=" + escape_token(hr.xpath("//HOSTNAME").text) + "\n" +
                   "HID=" + hr.xpath("//HID").text + "\n" +
                   "CID=" + hr.xpath("//CID").text + "\n" +
                   "DS_ID=" + hr.xpath("//DS_ID").text + "\n"
    end

    def escape_token(str)
        str_scaped = ""

        str.split("").each do |c|
            case c
            when '-', '_', '.', ':'
                str_scaped += '_'
            else
                str_scaped += c
            end
        end

        return str_scaped
    end

    def gen_short_body(body)
        short_body = Nokogiri::XML::Builder.new(:encoding => 'UTF-8') do |xml|
            xml.VM{
                xml.ID body.root.xpath('ID').text
                xml.UID body.root.xpath('UID').text
                xml.GID body.root.xpath('GID').text
                xml.UNAME body.root.xpath('UNAME').text
                xml.GNAME body.root.xpath('GNAME').text
                xml.NAME body.root.xpath('NAME').text
                xml.LAST_POLL body.root.xpath('LAST_POLL').text
                xml.STATE body.root.xpath('STATE').text
                xml.LCM_STATE body.root.xpath('LCM_STATE').text
                xml.RESCHED body.root.xpath('RESCHED').text
                xml.STIME body.root.xpath('STIME').text
                xml.ETIME body.root.xpath('ETIME').text
                xml.DEPLOY_ID body.root.xpath('DEPLOY_ID').text

                xml.LOCK {
                    xml.LOCKED body.root.xpath('LOCK/LOCKED').text unless body.root.xpath('LOCK/LOCKED').text.empty?
                } unless body.root.xpath('LOCK').text.empty?

                xml.TEMPLATE {
                    xml.AUTOMATIC_REQUIREMENTS body.root.xpath('TEMPLATE/AUTOMATIC_REQUIREMENTS').text
                    xml.AUTOMATIC_DS_REQUIREMENTS body.root.xpath('TEMPLATE/AUTOMATIC_DS_REQUIREMENTS').text unless body.root.xpath('TEMPLATE/AUTOMATIC_DS_REQUIREMENTS').text.empty?
                    xml.CPU body.root.xpath('TEMPLATE/CPU').text

                    body.root.xpath('TEMPLATE//DISK').each do |disk|
                        xml.DISK {
                            xml.DATASTORE disk.xpath('DATASTORE').text unless disk.xpath('DATASTORE').text.empty?
                            xml.DATASTORE_ID disk.xpath('DATASTORE_ID').text unless disk.xpath('DATASTORE_ID').text.empty?
                            xml.DISK_ID disk.xpath('DISK_ID').text unless disk.xpath('DISK_ID').text.empty?
                            xml.IMAGE disk.xpath('IMAGE').text unless disk.xpath('IMAGE').text.empty?
                            xml.IMAGE_ID disk.xpath('IMAGE_ID').text unless disk.xpath('IMAGE_ID').text.empty?
                            xml.SIZE disk.xpath('SIZE').text unless disk.xpath('SIZE').text.empty?
                            xml.TARGET disk.xpath('TARGET').text unless disk.xpath('TARGET').text.empty?
                            xml.TYPE disk.xpath('TYPE').text unless disk.xpath('TYPE').text.empty?
                            xml.CLONE disk.xpath('CLONE').text unless disk.xpath('CLONE').text.empty?
                            xml.CLONE_TARGET disk.xpath('CLONE_TARGET').text unless disk.xpath('CLONE_TARGET').text.empty?
                            xml.LN_TARGET disk.xpath('LN_TARGET').text unless disk.xpath('LN_TARGET').text.empty?
                            xml.DISK_SNAPSHOT_TOTAL_SIZE disk.xpath('DISK_SNAPSHOT_TOTAL_SIZE').text unless disk.xpath('DISK_SNAPSHOT_TOTAL_SIZE').text.empty?
                        }
                    end

                    xml.GRAPHICS {
                        xml.LISTEN body.root.xpath('TEMPLATE/GRAPHICS/LISTEN').text unless body.root.xpath('TEMPLATE/GRAPHICS/LISTEN').text.empty?
                        xml.PASSWD body.root.xpath('TEMPLATE/GRAPHICS/PASSWD').text unless body.root.xpath('TTEMPLATE/GRAPHICS/PASSWD').text.empty?
                        xml.PORT body.root.xpath('TEMPLATE/GRAPHICS/PORT').text unless body.root.xpath('TEMPLATE/GRAPHICS/PORT').text.empty?
                        xml.RANDOM_PASSWD body.root.xpath('TEMPLATE/GRAPHICS/RANDOM_PASSWD').text unless body.root.xpath('TEMPLATE/GRAPHICS/RANDOM_PASSWD').text.empty?
                        xml.TYPE body.root.xpath('TEMPLATE/GRAPHICS/TYPE').text unless body.root.xpath('TEMPLATE/GRAPHICS/TYPE').text.empty?
                    } unless body.root.xpath('TEMPLATE/GRAPHICS').text.empty?

                    xml.MEMORY body.root.xpath('TEMPLATE/MEMORY').text unless body.root.xpath('TEMPLATE/MEMORY').text.empty?

                    body.root.xpath("TEMPLATE//NIC").each do |nic|
                        xml.NIC {
                            xml.IP nic.xpath('IP').text unless nic.xpath('IP').text.empty?
                            xml.IP6 nic.xpath('IP6').text unless nic.xpath('IP6').text.empty?
                            xml.IP6_ULA nic.xpath('IP6_ULA').text unless nic.xpath('IP6_ULA').text.empty?
                            xml.IP6_LINK nic.xpath('IP6_LINK').text unless nic.xpath('IP6_LINK').text.empty?
                            xml.IP6_GLOBAL nic.xpath('IP6_GLOBAL').text unless nic.xpath('IP6_GLOBAL').text.empty?
                            xml.MAC nic.xpath('MAC').text unless nic.xpath('MAC').text.empty?
                            xml.NETWORK nic.xpath('NETWORK').text unless nic.xpath('NETWORK').text.empty?
                            xml.NETWORK_ID nic.xpath('NETWORK_ID').text unless nic.xpath('NETWORK_ID').text.empty?
                            xml.NIC_ID nic.xpath('NIC_ID').text unless nic.xpath('NIC_ID').text.empty?
                            xml.SECURITY_GROUPS nic.xpath('SECURITY_GROUPS').text unless nic.xpath('SECURITY_GROUPS').text.empty?
                        }
                    end
                }

                xml.MONITORING {
                    xml.CPU body.root.xpath('MONITORING/CPU').text unless body.root.xpath('MONITORING/CPU').text.empty?
                    xml.MEMORY body.root.xpath('MONITORING/MEMORY').text unless body.root.xpath('MONITORING/MEMORY').text.empty?
                    xml.STATE body.root.xpath('MONITORING/STATE').text unless body.root.xpath('MONITORING/STATE').text.empty?
                }

                xml.USER_TEMPLATE {
                    xml.LABELS body.root.xpath('USER_TEMPLATE/LABELS').text unless body.root.xpath('USER_TEMPLATE/LABELS').text.empty?
                    xml.SCHED_RANK body.root.xpath('USER_TEMPLATE/SCHED_RANK').text unless body.root.xpath('USER_TEMPLATE/SCHED_RANK').text.empty?
                    xml.RANK body.root.xpath('USER_TEMPLATE/RANK').text unless body.root.xpath('USER_TEMPLATE/RANK').text.empty?
                    xml.SCHED_DS_RANK body.root.xpath('USER_TEMPLATE/SCHED_DS_RANK').text unless body.root.xpath('USER_TEMPLATE/SCHED_DS_RANK').text.empty?
                    xml.PUBLIC_CLOUD body.root.xpath('USER_TEMPLATE/PUBLIC_CLOUD').text unless body.root.xpath('USER_TEMPLATE/PUBLIC_CLOUD').text.empty?
                    xml.EC2 body.root.xpath('USER_TEMPLATE/EC2').text unless body.root.xpath('USER_TEMPLATE/EC2').text.empty?
                    xml.SCHED_REQUIREMENTS body.root.xpath('USER_TEMPLATE/SCHED_REQUIREMENTS').text unless body.root.xpath('USER_TEMPLATE/SCHED_REQUIREMENTS').text.empty?
                    xml.SCHED_DS_REQUIREMENTS body.root.xpath('USER_TEMPLATE/SCHED_DS_REQUIREMENTS').text unless body.root.xpath('USER_TEMPLATE/SCHED_DS_REQUIREMENTS').text.empty?
                    xml.SCHED_MESSAGE body.root.xpath('USER_TEMPLATE/SCHED_MESSAGE').text unless body.root.xpath('USER_TEMPLATE/SCHED_MESSAGE').text.empty?
                    xml.USER_PRIORITY body.root.xpath('USER_TEMPLATE/USER_PRIORITY').text unless body.root.xpath('USER_TEMPLATE/USER_PRIORITY').text.empty?
                }

                xml.HISTORY_RECORDS {
                    body.root.xpath('HISTORY_RECORDS//HISTORY').last do |hr|
                        xml.HISTORY {
                            xml.OID hr.xpath('OID').text
                            xml.SEQ hr.xpath('SEQ').text
                            xml.HOSTNAME hr.xpath('HOSTNAME').text
                            xml.HID hr.xpath('HID').text
                            xml.CID hr.xpath('CID').text
                            xml.DS_ID hr.xpath('DS_ID').text
                            xml.ACTION hr.xpath('ACTION').text
                        }
                    end
                }
            }
        end

        Nokogiri::XML(short_body.to_xml).root.to_s
    end

    def feature_826
        create_table(:vn_template_pool)
    end

    def bug_2687
        @db.run "DROP TABLE IF EXISTS old_image_pool;"
        @db.run "ALTER TABLE image_pool RENAME TO old_image_pool;"

        create_table(:image_pool)

        @db.transaction do
            @db.fetch("SELECT * FROM old_image_pool") do |row|
                doc = nokogiri_doc(row[:body], 'old_image_pool')

                next_snapshot = doc.at_xpath("//SNAPSHOTS/NEXT_SNAPSHOT")

                unless next_snapshot
                    max = doc.xpath("//SNAPSHOTS/SNAPSHOT/ID").max

                    if max
                        next_snapshot = max.text.to_i + 1
                    else
                        next_snapshot = 0
                    end

                    sxml = doc.xpath("//SNAPSHOTS")

                    if sxml
                        ns = doc.create_element("NEXT_SNAPSHOT")
                        ns.content = next_snapshot
                        sxml = sxml.first.add_child(ns)
                    end
                end

                row[:body] = doc.root.to_s

                @db[:image_pool].insert(row)
            end
        end

        @db.run "DROP TABLE old_image_pool;"

        @db.run "DROP TABLE IF EXISTS old_vm_pool;"
        @db.run "ALTER TABLE vm_pool RENAME TO old_vm_pool;"

        create_table(:vm_pool)

        @db.transaction do
            @db.fetch("SELECT * FROM old_vm_pool") do |row|
                doc = nokogiri_doc(row[:body], 'old_vm_pool')

                # evaluate each disk snapshot individually
                doc.xpath("//SNAPSHOTS").each do |disk|
                    next_snapshot = disk.at_xpath("NEXT_SNAPSHOT")

                    next if next_snapshot

                    max = disk.xpath("SNAPSHOT/ID").max

                    if max
                        next_snapshot = max.text.to_i + 1
                    else
                        next_snapshot = 0
                    end

                    ns = doc.create_element("NEXT_SNAPSHOT")
                    ns.content = next_snapshot
                    disk.add_child(ns)
                end

                row[:body] = doc.root.to_s

                @db[:vm_pool].insert(row)
            end
        end

        @db.run "DROP TABLE old_vm_pool;"
    end

    def feature_2966
        @db.run "ALTER TABLE logdb ADD applied BOOLEAN DEFAULT 1;"
        @db.run "UPDATE logdb SET applied = 0 WHERE timestamp = 0;"

        if @db.adapter_scheme == :sqlite
            @db.run "DROP INDEX IF EXISTS timestamp_idx"
        else
            begin
                @db.run "ALTER TABLE logdb DROP INDEX timestamp_idx;"
            rescue Sequel::DatabaseError
            end
            @db.run "ALTER TABLE logdb ALTER COLUMN applied DROP DEFAULT"
        end
    end
end
