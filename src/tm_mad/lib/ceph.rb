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
require_relative 'datastore'

module TransferManager

    # Ceph utils
    class Ceph

        # Ceph disks
        class Disk

            attr_reader :id, :vmid, :source, :clone, :rbd_image, :rbd_cmd

            # @param vmid [Integer]
            # @param disk_xml [String, REXML::Document, REXML::Element]
            # @return [Disk]
            def initialize(vmid, disk_xml)
                disk_xml = REXML::Document.new(disk_xml) if disk_xml.is_a?(String)

                @id     = disk_xml.elements['DISK_ID'].text.to_i
                @vmid   = vmid
                @source = disk_xml.elements['SOURCE'].text
                @clone  = disk_xml.elements['CLONE'].text == 'YES'

                @rbd_image =
                    if @clone
                        "#{@source}-#{@vmid}-#{@id}"
                    else
                        @source
                    end

                @rbd_cmd = 'rbd'
                @rbd_cmd += Ceph.xml_opt(disk_xml, 'CEPH_USER', '--id')
                @rbd_cmd += Ceph.xml_opt(disk_xml, 'CEPH_KEY', '--keyfile')
                @rbd_cmd += Ceph.xml_opt(disk_xml, 'CEPH_CONF', '--conf')
            end

            # @return [String] Shell definitions for functionality related to this disk
            def shdefs
                <<~SCRIPT
                    rbd_rm_image() {
                        image="$1"

                        snapshots="$(#{@rbd_cmd} snap ls "$image" 2>/dev/null| awk 'NR > 1 {print $2}')"
                        for snapshot in $snapshots; do
                            rbd_rm_snapshot "$image@$snapshot"
                        done
                        #{@rbd_cmd} rm "$image"
                    }

                    rbd_rm_snapshot() {
                        snapshot="$1"

                        children="$(#{@rbd_cmd} children "$snapshot" 2>/dev/null)"

                        for child in $children; do
                            rbd_rm_image "$child"
                        done

                        #{@rbd_cmd} snap unprotect "$snapshot"
                        #{@rbd_cmd} snap rm "$snapshot"
                    }
                SCRIPT
            end

            ####################################################################
            ## CLASS METHODS

            # @param vm_xml [String, REXML::Document, REXML::Element]
            # @return [Array(Disk)] indexed VM disks (disk id = position in array)
            def self.from_vm(vm_xml)
                vm_xml  = REXML::Document.new(vm_xml) if vm_xml.is_a?(String)
                vm      = vm_xml.root
                vmid    = vm.elements['VMID'].text

                indexed_disks = []
                vm.elements.each('DISK[TYPE="RBD"]') do |d|
                    disk = new(vmid, d)
                    indexed_disks[disk.id] = disk
                end

                indexed_disks
            end

        end

        def self.xml_opt(disk_xml, name, opt)
            opt_val = disk_xml.elements[name].text
            " #{opt} #{opt_val}" unless opt_val.empty?
        rescue StandardError
            ''
        end

    end

end
