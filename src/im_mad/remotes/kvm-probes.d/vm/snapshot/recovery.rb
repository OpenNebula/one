#!/usr/bin/env ruby

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
require 'rexml/document'
require 'fileutils'
require 'open3'
require 'base64'

def xml_elem(xml, xpath)
    rexml = REXML::Document.new(xml).root
    rexml.elements[xpath].text.to_s
rescue StandardError
    ''
end

ds_loc = xml_elem(STDIN.read, 'DATASTORE_LOCATION')
ds_loc ||= '/var/lib/one/datastores'
Dir.chdir ds_loc

datastores = Dir.glob('*').select do |f|
    File.directory?(f) && f.match(/^\d+$/)
end

monitor_data = []

datastores.each do |ds|
    # Skip if datastore is not ssh
    mark = "#{ds_loc}/#{ds}/.monitor"
    next unless File.exist? mark

    driver = File.read mark
    driver.chomp!
    next unless driver == 'ssh'

    # for all VMs
    Dir.entries("#{ds_loc}/#{ds}").each do |vm_id|
        vm_dir = "#{ds_loc}/#{ds}/#{vm_id}"
        next if vm_id !~ /^\d+$/
        next unless File.directory?(vm_dir)

        disk_data = []
        # for all disks
        Dir.entries(vm_dir).each do |disk|
            next if disk !~ /^disk.\d+$/
            next unless File.file?("#{vm_dir}/#{disk}.snap/base.1")
            next unless File.file?("#{vm_dir}/vm.xml")
            next unless File.file?("#{vm_dir}/ds.xml")

            disk_id = disk.split('.')[1]

            replica = xml_elem(File.read("#{vm_dir}/ds.xml"),
                               '/DATASTORE/TEMPLATE/REPLICA_HOST')

            freq = xml_elem(File.read("#{vm_dir}/vm.xml"),
                            "/VM/TEMPLATE/DISK[DISK_ID=#{disk_id}]/" <<
                            'RECOVERY_SNAPSHOT_FREQ')

            rs_script = '/var/tmp/one/tm/ssh/recovery_snap_create_live'
            next if freq.empty? || replica.empty? || !File.exist?(rs_script)

            o, _e, s = Open3.capture3("#{rs_script} #{vm_id} " <<
                                      "#{vm_dir}/#{disk} " <<
                                      "#{freq} #{replica}")
            o.chomp!

            if s.exitstatus == 0
                disk_data << \
                    'DISK_RECOVERY_SNAPSHOT = ' \
                    "[ ID=#{disk_id}, TIMESTAMP=\"#{o}\" ]"
            else
                disk_data << \
                    'DISK_RECOVERY_SNAPSHOT = ' \
                    "[ ID=#{disk_id}, MSG=\"ERROR #{o}\" ]"
            end
        end

        next if disk_data.empty?

        enc_data = Base64.strict_encode64(disk_data.join("\n"))
        monitor_data << \
            "VM = [ ID=\"#{vm_id}\", MONITOR=\"#{enc_data}\" ]"
    end
end

puts monitor_data.join("\n")
