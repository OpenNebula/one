#!/usr/bin/env ruby

# -------------------------------------------------------------------------- #
# Copyright 2002-2017, OpenNebula Project, OpenNebula Systems                #
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

#!/usr/bin/env ruby

ONE_LOCATION=ENV["ONE_LOCATION"]

if !ONE_LOCATION
    RUBY_LIB_LOCATION="/usr/lib/one/ruby"
    REMOTES_LOCATION="/var/lib/one/remotes/"
else
    RUBY_LIB_LOCATION=ONE_LOCATION+"/lib/ruby"
    REMOTES_LOCATION=ONE_LOCATION+"/var/remotes/"
end

$: << RUBY_LIB_LOCATION
$: << RUBY_LIB_LOCATION+"/cli"
$: << REMOTES_LOCATION+"vmm/vcenter/"

require 'command_parser'
require 'one_helper/onehost_helper'
require 'one_helper/onecluster_helper'
require 'vcenter_driver'
require 'opennebula'

TEMP_DIR="/tmp"

def banner(msg, header=false)
    STDOUT.puts
    STDOUT.puts if !header
    STDOUT.puts "="*80
    STDOUT.puts msg
    STDOUT.puts "="*80
end

################################################################################
# Monkey patch XMLElement with retrieve_xmlelements
################################################################################

class OpenNebula::XMLElement
    def retrieve_xmlelements(xpath_str)
        collection = []
        if OpenNebula::NOKOGIRI
            @xml.xpath(xpath_str).each { |pelem|
                collection << OpenNebula::XMLElement.new(pelem)
            }
        else
            @xml.elements.each(xpath_str) { |pelem|
                collection << OpenNebula::XMLElement.new(pelem)
            }
        end
        collection
    end
end

def get_image_size(ds, img_str)

    ds_name = ds.name
    img_path = File.dirname img_str
    img_name = File.basename img_str

    # Create Search Spec
    spec = RbVmomi::VIM::HostDatastoreBrowserSearchSpec.new

    vmdisk_query = RbVmomi::VIM::VmDiskFileQuery.new
    vmdisk_query.details = RbVmomi::VIM::VmDiskFileQueryFlags(:diskType        => true,
                                                              :capacityKb      => true,
                                                              :hardwareVersion => true,
                                                              :controllerType  => true)

    spec.query   = [vmdisk_query, RbVmomi::VIM::IsoImageFileQuery.new]
    spec.details = RbVmomi::VIM::FileQueryFlags(:fileOwner    => true,
                                                :fileSize     => true,
                                                :fileType     => true,
                                                :modification => true)


    spec.matchPattern = img_name.nil? ? [] : [img_name]

    datastore_path = "[#{ds_name}]"
    datastore_path << " #{img_path}" if !img_path.nil?

    search_params = {'datastorePath' => datastore_path, 'searchSpec'    => spec}

    # Perform search task and return results
    begin
        search_task = ds.browser.SearchDatastoreSubFolders_Task(search_params)

        search_task.wait_for_completion

        size = 0

        # Try to get vmdk capacity as seen by VM
        size = search_task.info.result[0].file[0].capacityKb / 1024 rescue nil

        # Try to get file size
        size = search_task.info.result[0].file[0].fileSize / 1024 / 1024 rescue nil if !size

        raise "Could not get file size or capacity" if size.nil?

        size
    rescue
        raise "Could not find file #{img_path}."
    end
end

def create_cdata_element(item, xml_doc, element_name, element_value)
    item.add_child(xml_doc.create_element(element_name)).add_child(Nokogiri::XML::CDATA.new(xml_doc,element_value))
end

def create_disk(xml_doc, image_name, image_source, image_prefix, image_id,
                disk_index, cluster_id, ds, ds_ref, ds_name, vi_client)

    disk_size = get_image_size(RbVmomi::VIM::Datastore.new(vi_client.vim, ds_ref), image_source)
    device_letters = ('a'..'z').to_a

    # Add new disk attributes
    xml_template   = xml_doc.root.at_xpath("TEMPLATE")
    disk = xml_template.add_child(xml_doc.create_element("DISK"))
    create_cdata_element(disk, xml_doc, "CLONE", "YES")
    create_cdata_element(disk, xml_doc, "CLONE_TARGET", "NONE")
    create_cdata_element(disk, xml_doc, "CLUSTER_ID", "#{cluster_id}")
    create_cdata_element(disk, xml_doc, "DATASTORE", "#{ds_name}")
    create_cdata_element(disk, xml_doc, "DATASTORE_ID", "#{ds["ID"]}")
    create_cdata_element(disk, xml_doc, "DEV_PREFIX", "#{image_prefix}")
    create_cdata_element(disk, xml_doc, "DISK_ID", "#{disk_index}")
    create_cdata_element(disk, xml_doc, "DISK_SNAPSHOT_TOTAL_SIZE", "0")
    create_cdata_element(disk, xml_doc, "DISK_TYPE", "FILE")
    create_cdata_element(disk, xml_doc, "IMAGE", "#{image_name}")
    create_cdata_element(disk, xml_doc, "IMAGE_ID", "#{image_id}")
    create_cdata_element(disk, xml_doc, "IMAGE_STATE", "2")
    create_cdata_element(disk, xml_doc, "LN_TARGET", "NONE")
    create_cdata_element(disk, xml_doc, "OPENNEBULA_MANAGED", "NO")
    create_cdata_element(disk, xml_doc, "ORIGINAL_SIZE", "#{disk_size}")
    create_cdata_element(disk, xml_doc, "READONLY", "NO")
    create_cdata_element(disk, xml_doc, "SAVE", "NO")
    create_cdata_element(disk, xml_doc, "SIZE", "#{disk_size}")
    create_cdata_element(disk, xml_doc, "SOURCE", "#{image_source}")
    create_cdata_element(disk, xml_doc, "TARGET", "#{image_prefix}#{device_letters[disk_index]}")
    create_cdata_element(disk, xml_doc, "TM_MAD", "vcenter")
    create_cdata_element(disk, xml_doc, "TYPE", "FILE")
    create_cdata_element(disk, xml_doc, "VCENTER_ADAPTER_TYPE","#{ds["TEMPLATE/VCENTER_DS_REF"]}")
    create_cdata_element(disk, xml_doc, "VCENTER_DISK_TYPE", "#{ds["TEMPLATE/VCENTER_DS_REF"]}")
    create_cdata_element(disk, xml_doc, "VCENTER_DS_REF", "#{ds["TEMPLATE/VCENTER_DS_REF"]}")
end

def create_nic(xml_doc, network, mac_address, cluster_id, nic_index)
    xml_template   = xml_doc.root.at_xpath("TEMPLATE")
    nic = xml_template.add_child(xml_doc.create_element("NIC"))
    create_cdata_element(nic, xml_doc, "BRIDGE", "#{network["BRIDGE"]}")
    create_cdata_element(nic, xml_doc, "CLUSTER_ID", "#{cluster_id}")
    create_cdata_element(nic, xml_doc, "MAC", "#{mac_address}")
    create_cdata_element(nic, xml_doc, "NETWORK", "#{network["NAME"]}")
    create_cdata_element(nic, xml_doc, "NETWORK_ID", "#{network["ID"]}")
    create_cdata_element(nic, xml_doc, "NIC_ID", "#{nic_index}")
    create_cdata_element(nic, xml_doc, "OPENNEBULA_MANAGED", "NO")
    create_cdata_element(nic, xml_doc, "SECURITY_GROUPS", "0")
    create_cdata_element(nic, xml_doc, "VCENTER_CCR_REF", "#{network["TEMPLATE/VCENTER_CCR_REF"]}")
    create_cdata_element(nic, xml_doc, "VCENTER_INSTANCE_ID", "#{network["TEMPLATE/VCENTER_INSTANCE_ID"]}")
    create_cdata_element(nic, xml_doc, "VCENTER_NET_REF", "#{network["TEMPLATE/VCENTER_NET_REF"]}")
    create_cdata_element(nic, xml_doc, "VCENTER_PORTGROUP_TYPE", "#{network["TEMPLATE/VCENTER_PORTGROUP_TYPE"]}")
    create_cdata_element(nic, xml_doc, "VN_MAD", "dummy")
end

def create_image_ds(ds_name, ds_ref, vcenter_name, vcenter_uuid, ccr_name, ccr_ref, dc_name, host_id, one_client)
    image_ds_name = "#{ds_name}"
    template  = ""
    template  << "NAME=\"#{image_ds_name}\"\n"
    template  << "TM_MAD=vcenter\n"
    template  << "VCENTER_INSTANCE_ID=\"#{vcenter_uuid}\"\n"
    template  << "VCENTER_CCR_REF=\"#{ccr_ref}\"\n"
    template  << "VCENTER_DS_REF=\"#{ds_ref}\"\n"
    template  << "VCENTER_CLUSTER=\"#{ccr_name}\"\n"
    template  << "VCENTER_ONE_HOST_ID=\"#{host_id}\"\n"
    template  << "TYPE=IMAGE_DS\n"
    template  << "DS_MAD=vcenter\n"

    one_ds = OpenNebula::Datastore.new(OpenNebula::Datastore.build_xml, one_client)
    rc = one_ds.allocate(template)
    raise rc.message if OpenNebula.is_error?(rc)

    rc = one_ds.info
    raise rc.message if OpenNebula.is_error?(rc)

    # Wait till the DS is monitored
    loop do
        sleep(2)
        one_ds.info
        break if one_ds["STATE"].to_i == 0 && one_ds["TOTAL_MB"].to_i > 0
    end

    STDOUT.puts "--- New IMAGE datastore #{image_ds_name} created with ID: #{one_ds["ID"]}!\n"

    return one_ds
end

def create_system_ds(ds_name, ds_ref, vcenter_name, vcenter_uuid, ccr_name, ccr_ref, host_id, one_client)
    system_ds_name = "#{ds_name} (SYS)"
    template  = ""
    template  << "NAME=\"#{system_ds_name}\"\n"
    template  << "TM_MAD=vcenter\n"
    template  << "VCENTER_INSTANCE_ID=\"#{vcenter_uuid}\"\n"
    template  << "VCENTER_CCR_REF=\"#{ccr_ref}\"\n"
    template  << "VCENTER_DS_REF=\"#{ds_ref}\"\n"
    template  << "VCENTER_ONE_HOST_ID=\"#{host_id}\"\n"
    template  << "TYPE=SYSTEM_DS\n"

    one_ds = OpenNebula::Datastore.new(OpenNebula::Datastore.build_xml, one_client)
    rc = one_ds.allocate(template)
    raise rc.message if OpenNebula.is_error?(rc)

    one_ds.info
    rc = one_ds.info
    raise rc.message if OpenNebula.is_error?(rc)

    STDOUT.puts "--- New SYSTEM datastore #{system_ds_name} created with ID: #{one_ds["ID"]}!\n"
end

def get_dc(item)
    while !item.instance_of? RbVmomi::VIM::Datacenter
        item = item.parent
        raise "Could not find the parent Datacenter" if !item
    end
    return item
end

def find_image(ipool, ds_name, image_path)
    element = ipool.select do |e|
        e["SOURCE"] == image_path &&
        e["DATASTORE"] == ds_name

    end.first rescue nil

    return element
end

def find_datastore_by_name(dspool, name)
    element = dspool.select do |e|
        e["NAME"] == name
    end.first rescue nil

    return element
end

def find_datastore(dspool, ds_ref, ccr_ref, vcenter_uuid, type)
    element = dspool.select do |e|
        e["TEMPLATE/TYPE"]                == type &&
        e["TEMPLATE/VCENTER_DS_REF"]      == ds_ref &&
        e["TEMPLATE/VCENTER_CCR_REF"]     == ccr_ref &&
        e["TEMPLATE/VCENTER_INSTANCE_ID"] == vcenter_uuid
    end.first rescue nil

    return element
end

def find_network(vnpool, net_ref, ccr_ref, template_ref, vcenter_uuid)
    element = vnpool.select do |e|
        e["TEMPLATE/VCENTER_NET_REF"]      == net_ref &&
        e["TEMPLATE/VCENTER_TEMPLATE_REF"] == template_ref &&
        e["TEMPLATE/VCENTER_CCR_REF"]      == ccr_ref &&
        e["TEMPLATE/VCENTER_INSTANCE_ID"]  == vcenter_uuid &&
        e["TEMPLATE/OPENNEBULA_MANAGED"] == "NO"
    end.first rescue nil

    return element
end

def find_template(tpool, template_id, template_ref, ccr_ref, vcenter_uuid)
    element = tpool.select do |e|
        e["ID"] == template_id &&
        e["TEMPLATE/VCENTER_TEMPLATE_REF"] == template_ref &&
        e["TEMPLATE/VCENTER_CCR_REF"]      == ccr_ref &&
        e["TEMPLATE/VCENTER_INSTANCE_ID"]  == vcenter_uuid
    end.first rescue nil

    return element
end

def vm_unmanaged_discover(devices, xml_doc, template_xml, existing_disks, existing_nics, ccr_name, ccr_ref, vcenter_name, vcenter_uuid, dc_name, ipool, vnpool, dspool, hpool, one_client, vi_client, vm_wild, vm_id, vm_name, vc_templates, vm_ref, vc_vmachines, template_ref)
    unmanaged = {}
    unmanaged[:images] = []
    unmanaged[:networks] = []

    ide_controlled  = []
    sata_controlled = []
    scsi_controlled = []

    disk_index           = 0
    unmanaged_disk_index = 0
    managed_disk_index   = 0
    nic_index            = 0
    managed_nic_index    = 0

    extraconfig   = []

    devices.each do |device|
        rc = vnpool.info
        raise "\n    ERROR! Could not update vnpool. Reason #{rc.message}" if OpenNebula.is_error?(rc)

        rc = ipool.info
        raise "\n    ERROR! Could not update ipool. Reason #{rc.message}" if OpenNebula.is_error?(rc)

        rc = dspool.info
        raise "\n    ERROR! Could not update dspool. Reason #{rc.message}" if OpenNebula.is_error?(rc)

        if device.is_a? RbVmomi::VIM::VirtualIDEController
            ide_controlled += device.device
            next
        end

        if device.is_a? RbVmomi::VIM::VirtualSATAController
            sata_controlled += device.device
            next
        end

        if device.is_a? RbVmomi::VIM::VirtualSCSIController
            scsi_controlled += device.device
            next
        end

        cluster_id = xml_doc.root.xpath("HISTORY_RECORDS/HISTORY[last()]/CID").text

        # If CDROM
        if !(device.class.ancestors.index(RbVmomi::VIM::VirtualCdrom)).nil?
            ds_name       = device.backing.datastore.name
            ds_ref        = device.backing.datastore._ref
            image_path    = device.backing.fileName.sub(/^\[(.*?)\] /, "")

            image = find_image(ipool, ds_name, image_path)

            if image
                # It's a persistent disk if it already exists
                xml_template     = xml_doc.root.at_xpath("TEMPLATE")
                existing_disk    = existing_disks[managed_disk_index]

                # Replace DISK_ID
                existind_disk_id = existing_disk.at_xpath("DISK_ID")
                existind_disk_id.content = disk_index

                disk = xml_template.add_child(existing_disks[managed_disk_index])

                # Add VCENTER_DS_REF
                disk.add_child(xml_doc.create_element("VCENTER_DS_REF")).add_child(Nokogiri::XML::CDATA.new(xml_doc,"#{ds_ref}"))

                STDOUT.puts "--- Added VCENTER_DS_REF=#{ds_ref} to CDROM (IMAGE_ID=#{image["ID"]})"

                # Update indexes
                managed_disk_index = managed_disk_index + 1
                disk_index = disk_index + 1
            end
        end

        # If Virtual Disk
        if !(device.class.ancestors.index(RbVmomi::VIM::VirtualDisk)).nil?
            ds_name       = device.backing.datastore.name
            ds_ref        = device.backing.datastore._ref
            image_type    = "OS"
            image_path    = device.backing.fileName.sub(/^\[(.*?)\] /, "")
            image_prefix  = "hd" if ide_controlled.include?(device.key)
            image_prefix  = "sd" if scsi_controlled.include?(device.key)
            image_prefix  = "sd" if sata_controlled.include?(device.key)
            file_name     = File.basename(image_path).gsub(/\.vmdk$/,"")
            image_name    = "#{file_name} - #{ds_name}"

            #Check if the image already exists
            one_image = find_image(ipool, ds_name, image_path)

            if !one_image
                #Check if the IMAGE DS is there
                ds = find_datastore(dspool, ds_ref, ccr_ref, vcenter_uuid, "IMAGE_DS")

                #Create IMAGE and SYSTEM DS if datastore is not found
                if !ds
                    # Get cluster's host ID
                    hosts = hpool.retrieve_xmlelements("HOST[NAME=\"#{ccr_name}\"]")
                    if hosts.empty?
                        raise "Required IMAGE Datastore #{ds_name} could not be created, cannot find cluster's host ID for #{ccr_name}"
                    end
                    host_id = hosts.first["ID"]

                    ds = create_image_ds(ds_name, ds_ref, vcenter_name, vcenter_uuid, ccr_name, ccr_ref, dc_name, host_id, one_client)

                    create_system_ds(ds_name, ds_ref, vcenter_name, vcenter_uuid, ccr_name, ccr_ref, host_id, one_client)
                end

                ds_id = ds["ID"].to_i

                if vm_wild || !template_xml
                    #Create images for unmanaged disks

                    template = ""
                    template << "NAME=\"#{image_name}\"\n"
                    template << "PATH=\"vcenter://#{image_path}\"\n"
                    template << "TYPE=\"#{image_type}\"\n"
                    template << "PERSISTENT=\"NO\"\n"
                    template << "VCENTER_IMPORTED=\"YES\"\n"
                    template << "DEV_PREFIX=\"#{image_prefix}\"\n"

                    one_image = OpenNebula::Image.new(OpenNebula::Image.build_xml, one_client)
                    rc = one_image.allocate(template, ds_id)
                    raise "\n    ERROR! Could not create image for wild vm. Reason #{rc.message}" if OpenNebula.is_error?(rc)

                    loop do
                        rc = one_image.info
                        raise "\n    ERROR! Could not get image info for wild vm disk. Reason #{rc.message}" if OpenNebula.is_error?(rc)
                        break if one_image["SOURCE"] && !one_image["SOURCE"].empty? #Get out of loop if image is not locked
                        sleep(1)
                    end

                    if one_image["STATE"] == 5
                        raise "\n    ERROR! The image created for wild vm is in ERROR state"
                    end

                    STDOUT.puts "--- Image #{one_image["NAME"]} with ID #{one_image["ID"]} has been created"
                else
                    template_disk = template_xml.xpath("VMTEMPLATE/TEMPLATE/DISK")[unmanaged_disk_index] rescue nil
                    raise "Cannot find unmanaged disk inside template" if !template_disk
                    image_id = template_disk.xpath("IMAGE_ID").text
                    raise "Cannot find image id for unmanaged disk" if image_id.empty?
                    one_image = OpenNebula::Image.new_with_id(image_id, one_client)
                    rc   = one_image.info
                    raise "\n    ERROR! Could not get image info for unmanged disk. Reason #{rc.message}" if OpenNebula.is_error?(rc)
                    STDOUT.puts "--- Image #{one_image["NAME"]} with ID #{one_image["ID"]} already exists"
                end

                # Create unmanaged disk element for vm template
                # Get disk size (capacity)
                image_name   = one_image["NAME"]
                image_source = one_image["SOURCE"]

                # Add new disk attributes
                create_disk(xml_doc, image_name, image_source, image_prefix, image_id,
                            disk_index, cluster_id, ds, ds_ref, ds_name, vi_client)

                STDOUT.puts "--- Added unmanaged disk to xml template (IMAGE_ID=#{one_image["ID"]})"

                reference = {}
                reference[:key]   = "opennebula.disk.#{unmanaged_disk_index}"
                reference[:value] = "#{device.key}"
                extraconfig << reference

                unmanaged_disk_index = unmanaged_disk_index + 1
                disk_index = disk_index + 1
            else

                if one_image["TEMPLATE/VCENTER_IMPORTED"] == "YES"

                    #Check if the IMAGE DS is there
                    ds = find_datastore(dspool, ds_ref, ccr_ref, vcenter_uuid, "IMAGE_DS")

                    #Create IMAGE and SYSTEM DS if datastore is not found
                    if !ds
                        # Get cluster's host ID
                        hosts = hpool.retrieve_xmlelements("HOST[NAME=\"#{ccr_name}\"]")
                        if hosts.empty?
                            raise "Required IMAGE Datastore #{ds_name} could not be created, cannot find cluster's host ID"
                        end
                        host_id = hosts.first["ID"]

                        ds = create_image_ds(ds_name, ds_ref, vcenter_name, vcenter_uuid, ccr_name, ccr_ref, dc_name, host_id, one_client)

                        create_system_ds(ds_name, ds_ref, vcenter_name, vcenter_uuid, ccr_name, ccr_ref, host_id, one_client)
                    end

                    ds_id = ds["ID"].to_i

                    #Create unmanaged disk element for vm template
                    image_id     = one_image["ID"]
                    image_name   = one_image["NAME"]
                    image_source = one_image["SOURCE"]

                    create_disk(xml_doc, image_name, image_source, image_prefix, image_id,
                                disk_index, cluster_id, ds, ds_ref, ds_name, vi_client)

                    STDOUT.puts "--- Added unmanaged disk in wild vm (IMAGE_ID=#{one_image["ID"]})"

                    reference = {}
                    reference[:key]   = "opennebula.disk.#{unmanaged_disk_index}"
                    reference[:value] = "#{device.key}"
                    extraconfig << reference

                    # Update indexes
                    unmanaged_disk_index = unmanaged_disk_index + 1
                    disk_index = disk_index + 1

                else
                    # It's a persistent disk if it already exists
                    xml_template     = xml_doc.root.at_xpath("TEMPLATE")
                    existing_disk    = existing_disks[managed_disk_index]

                    # Replace DISK_ID
                    existing_disk_image_id = existing_disk.xpath("IMAGE_ID").text
                    existing_disk_id = existing_disk.at_xpath("DISK_ID")
                    existing_disk_id.content = disk_index

                    disk = xml_template.add_child(existing_disks[managed_disk_index])

                    # Add VCENTER_DISK_TYPE and VCENTER_ADAPTER_TYPE if found
                    if !existing_disk.xpath("DISK_TYPE").text.empty?
                        disk.add_child(xml_doc.create_element("VCENTER_DISK_TYPE")).add_child(Nokogiri::XML::CDATA.new(xml_doc,"#{existing_disk.xpath("DISK_TYPE").text}"))
                        STDOUT.puts "--- Added VCENTER_DISK_TYPE=#{existing_disk.xpath("DISK_TYPE").text} to existing disk (IMAGE_ID=#{existing_disk_image_id})"
                    end

                    if !existing_disk.xpath("ADAPTER_TYPE").text.empty?
                        disk.add_child(xml_doc.create_element("VCENTER_ADAPTER_TYPE")).add_child(Nokogiri::XML::CDATA.new(xml_doc,"#{existing_disk.xpath("ADAPTER_TYPE").text}"))
                        STDOUT.puts "--- Added VCENTER_ADAPTER_TYPE=#{existing_disk.xpath("ADAPTER_TYPE").text} to existing disk (IMAGE_ID=#{existing_disk_image_id})"
                    end

                    # Add VCENTER_DS_REF
                    disk.add_child(xml_doc.create_element("VCENTER_DS_REF")).add_child(Nokogiri::XML::CDATA.new(xml_doc,"#{ds_ref}"))
                    STDOUT.puts "--- Added VCENTER_DS_REF=#{ds_ref} to existing disk (IMAGE_ID=#{existing_disk_image_id})"

                    # Update indexes
                    managed_disk_index = managed_disk_index + 1
                    disk_index = disk_index + 1
                end
            end
        end

        # If VirtualEthernetCard
        if !device.class.ancestors.index(RbVmomi::VIM::VirtualEthernetCard).nil?
            network_bridge = device.backing.network.name
            network_ref    = device.backing.network._ref
            network_name   = "#{network_bridge} [#{network_ref} - #{vm_ref} - #{vcenter_uuid}]"
            network_type   = device.backing.network.instance_of?(RbVmomi::VIM::DistributedVirtualPortgroup) ? "Distributed Port Group" : "Port Group"

            # Create network if doesn't exist
            network = find_network(vnpool, network_ref, ccr_ref, template_ref, vcenter_uuid)

            if !network
                one_net = ""
                one_net << "NAME=\"#{network_name}\"\n"
                one_net << "BRIDGE=\"#{network_bridge}\"\n"
                one_net << "VN_MAD=\"dummy\"\n"
                one_net << "VCENTER_PORTGROUP_TYPE=\"#{network_type}\"\n"
                one_net << "VCENTER_NET_REF=\"#{network_ref}\"\n"
                one_net << "VCENTER_CCR_REF=\"#{ccr_ref}\"\n"
                one_net << "VCENTER_INSTANCE_ID=\"#{vcenter_uuid}\"\n"
                one_net << "VCENTER_TEMPLATE_REF=\"#{template_ref}\"\n"
                one_net << "OPENNEBULA_MANAGED=\"NO\"\n"
                one_net << "AR=[\n"
                one_net << "TYPE=\"ETHER\",\n"
                one_net << "SIZE=\"255\"\n"
                one_net << "]\n"

                one_vn = OpenNebula::VirtualNetwork.new(OpenNebula::VirtualNetwork.build_xml, one_client)
                rc = one_vn.allocate(one_net)
                raise "\n    ERROR! Could not create vnet for vm #{vm_name}. Reason #{rc.message}" if OpenNebula.is_error?(rc)

                rc = one_vn.info
                raise "\n    ERROR! Could not get network info for vnet #{network_name}. Reason #{rc.message}" if OpenNebula.is_error?(rc)
                network = one_vn
                STDOUT.puts "--- Network #{one_vn["NAME"]} with ID #{one_vn["ID"]} has been created"
            else
                STDOUT.puts "--- Network #{network["NAME"]} with ID #{network["ID"]} already exists"
            end

            existing_macs = []
            existing_nics.xpath("MAC").each do |mac|
                existing_macs << mac.text
            end

            mac_address = device.macAddress
            if !existing_macs.include?(mac_address)
                # Unmanaged nic
                create_nic(xml_doc, network, mac_address, cluster_id, nic_index)

                #Update indexes
                nic_index = nic_index + 1
            else
                # Managed nic
                managed_nic_index = existing_macs.index(mac_address)
                xml_template      = xml_doc.root.at_xpath("TEMPLATE")
                existing_nic      = existing_nics[managed_nic_index]

                # Replace NIC_ID
                existind_nic_id = existing_nic.at_xpath("NIC_ID")
                existind_nic_id.content = nic_index

                # Add existing NIC to XML template
                nic = xml_template.add_child(existing_nics[managed_nic_index])
                create_cdata_element(nic, xml_doc, "VCENTER_NET_REF", "#{network["TEMPLATE/VCENTER_NET_REF"]}")
                create_cdata_element(nic, xml_doc, "VCENTER_CCR_REF", "#{network["TEMPLATE/VCENTER_CCR_REF"]}")
                create_cdata_element(nic, xml_doc, "VCENTER_INSTANCE_ID", "#{network["TEMPLATE/VCENTER_INSTANCE_ID"]}")
                create_cdata_element(nic, xml_doc, "VCENTER_PORTGROUP_TYPE", "#{network["TEMPLATE/VCENTER_PORTGROUP_TYPE"]}")

                #Update indexes
                nic_index = nic_index + 1
            end
        end
    end

    # Reference some nodes
    xml_template = xml_doc.root.at_xpath("TEMPLATE")
    xml_user_template = xml_doc.root.at_xpath("USER_TEMPLATE")
    xml_monitoring = xml_doc.root.at_xpath("MONITORING")
    xml_history = xml_doc.root.at_xpath("HISTORY_RECORDS/HISTORY")

    # Update context disk ID
    if !vm_wild
        xml_template.xpath("CONTEXT/DISK_ID").remove
        xml_context  = xml_template.at_xpath("CONTEXT")
        xml_context.add_child(xml_doc.create_element("DISK_ID")).add_child(Nokogiri::XML::CDATA.new(xml_doc,"#{disk_index}"))
    end

    # Remove PUBLIC_CLOUD as it is no longer used with vcenter
    xml_user_template.xpath("PUBLIC_CLOUD").remove

    # Remove KEEP_DISKS_ON_DONE from USER_TEMPLATE
    xml_user_template.xpath("KEEP_DISKS_ON_DONE").remove

    # Remove VCENTER_DATASTORE and USER_INPUTS/VCENTER_DATASTORE... no longer used
    # If datastore is a system_ds we may have to add SCHED_DS_REQUIREMENTS
    # Also identify the datastore id to update last history records with the new DS_ID

    vcenter_datastore = xml_user_template.xpath("VCENTER_DATASTORE").text
    ds_id = nil
    if !vcenter_datastore.empty?
        # If VCENTER_DATASTORE is a SYSTEM_DS it is a StoragePod then
        # SCHED_DS_REQUIREMENTS must contain ID="DS_ID"
        ds      = find_datastore_by_name(dspool, "#{vcenter_datastore}")
        ds_id   = ds["ID"]
        ds_type = ds["TEMPLATE/TYPE"]
        if ds_type == "SYSTEM_DS"
            sched_ds_req = xml_user_template.xpath("SCHED_DS_REQUIREMENTS")
            if !sched_ds_req.empty?
                xml_user_template.xpath("SCHED_DS_REQUIREMENTS").remove
                requirements = "ID=#{ds_id} & (#{sched_ds_req})"
                xml_user_template.add_child(xml_doc.create_element("SCHED_DS_REQUIREMENTS")).add_child(Nokogiri::XML::CDATA.new(xml_doc,"\"#{requirements}\""))
            else
                # Add a SCHED_DS_REQUIREMENTS to template
                xml_user_template.add_child(xml_doc.create_element("SCHED_DS_REQUIREMENTS")).add_child(Nokogiri::XML::CDATA.new(xml_doc,"\"ID=#{ds_id}\""))
            end
        end

        # New ds should be a system datastore
        ds = find_datastore_by_name(dspool, "#{vcenter_datastore} (SYS)")
        ds_id = ds["ID"]
    else
        if vm_wild
            if !vc_vmachines.key? vm_ref
                raise "Could not find vcenter vm using ref #{vm_ref} in order to assign a datastore"
            else
                ds_ref = vc_vmachines[vm_ref]["datastore"].first._ref rescue nil
                raise "Could not get ds ref in order to assign a datastore in history records" if !ds_ref

                ds = find_datastore(dspool, ds_ref, ccr_ref, vcenter_uuid, "SYSTEM_DS")
                ds_id = ds["ID"]
            end
        else
            if !vc_templates.key? template_ref
                raise "Could not find vcenter template using ref #{template_ref} in order to assign a datastore"
            else
                ds_ref = vc_templates[template_ref]["datastore"].first._ref rescue nil
                raise "Could not get ds ref in order to assign a datastore in history records" if !ds_ref

                ds = find_datastore(dspool, ds_ref, ccr_ref, vcenter_uuid, "SYSTEM_DS")
                ds_id = ds["ID"]
            end
        end
    end

    # Replace attributes in SCHED_DS_REQUIREMENTS
    sched_ds_req = xml_user_template.xpath("SCHED_DS_REQUIREMENTS").text
    if !sched_ds_req.empty? && sched_ds_req.include?("VCENTER_CLUSTER")
        STDOUT.puts("\n    WARNING: Manual intervention required!")
        STDOUT.puts("\n    The SCHED_DS_REQUIREMENTS contains an attribute that is no longer used: VCENTER_CLUSTER\n")
        STDOUT.puts("    Please replace VCENTER_CLUSTER with VCENTER_CCR_REF and change the name of the cluster with the reference from the following list:\n")
        vc_clusters.each do |ref, value|
            STDOUT.puts("    - VCENTER_CCR_REF: #{ref} for VCENTER_CLUSTER: #{value["name"]}")
        end
        STDOUT.puts("    Your current expression is: #{sched_ds_req} ")
        STDOUT.puts("    e.g if it contains VCENTER_CLUSTER=\\\"DemoCluster\\\" it should be changed to VCENTER_CCR_REF=domain-c7")
        STDOUT.print("\n    Insert your new SCHED_DS_REQUIREMENTS expression: ")
        sched_ds_req = STDIN.gets.strip
        xml_user_template.xpath("SCHED_DS_REQUIREMENTS").remove
        xml_user_template.add_child(xml_doc.create_element("SCHED_DS_REQUIREMENTS")).add_child(Nokogiri::XML::CDATA.new(xml_doc,"\"#{sched_ds_req}\""))
    end

    xml_user_template.xpath("VCENTER_DATASTORE").remove
    xml_user_template.xpath("USER_INPUTS/VCENTER_DATASTORE").remove

    # Replace USER_TEMPLATE/RESOURCE_POOL with VCENTER_RESOURCE_POOL
    resource_pool = xml_user_template.xpath("RESOURCE_POOL").text
    if !resource_pool.empty?
        xml_user_template.xpath("RESOURCE_POOL").remove
        vcenter_rp = xml_user_template.xpath("VCENTER_RESOURCE_POOL").text
        if !vcenter_rp.empty?
            xml_user_template.xpath("VCENTER_RESOURCE_POOL").remove
        end
        xml_user_template.add_child(xml_doc.create_element("VCENTER_RESOURCE_POOL")).add_child(Nokogiri::XML::CDATA.new(xml_doc,"#{resource_pool}"))
    end

    # Replace USER_INPUTS/RESOURCE_POOL... no longer used
    user_resource_pool = xml_user_template.xpath("USER_INPUTS/RESOURCE_POOL").text
    if !user_resource_pool.empty?
        xml_user_template.xpath("USER_INPUTS/RESOURCE_POOL").remove
        vcenter_rp = xml_user_template.xpath("USER_INPUTS/VCENTER_RESOURCE_POOL").text
        if !vcenter_rp.empty?
            xml_user_template.xpath("USER_INPUTS/VCENTER_RESOURCE_POOL").remove
        end
        user_inputs = xml_user_template.at_xpath("USER_INPUTS")
        user_inputs.add_child(xml_doc.create_element("VCENTER_RESOURCE_POOL")).add_child(Nokogiri::XML::CDATA.new(xml_doc,"#{user_resource_pool}"))
    end

    # Replace CUSTOMIZATION_SPEC with VCENTER_CUSTOMIZATION_SPEC
    customization_spec = xml_user_template.xpath("CUSTOMIZATION_SPEC").text
    if !customization_spec.empty?
        xml_user_template.xpath("CUSTOMIZATION_SPEC").remove
        xml_user_template.add_child(xml_doc.create_element("VCENTER_CUSTOMIZATION_SPEC")).add_child(Nokogiri::XML::CDATA.new(xml_doc,"#{customization_spec}"))
    end

    # Add VCENTER_CCR_REF and VCENTER_INSTANCE_ID
    vcenter_ccr_ref = xml_user_template.xpath("VCENTER_CCR_REF").text
    if !vcenter_ccr_ref.empty?
        xml_user_template.xpath("VCENTER_CCR_REF").remove
    end
    xml_user_template.add_child(xml_doc.create_element("VCENTER_CCR_REF")).add_child(Nokogiri::XML::CDATA.new(xml_doc,"#{ccr_ref}"))

    vcenter_instance_id = xml_user_template.xpath("VCENTER_INSTANCE_ID").text
    if !vcenter_instance_id.empty?
        xml_user_template.xpath("VCENTER_INSTANCE_ID").remove
    end
    xml_user_template.add_child(xml_doc.create_element("VCENTER_INSTANCE_ID")).add_child(Nokogiri::XML::CDATA.new(xml_doc,"#{vcenter_uuid}"))

    # Add VCENTER_TEMPLATE_REF if VM is not wild
    if !vm_wild
        vcenter_template_ref = xml_user_template.xpath("VCENTER_TEMPLATE_REF").text
        if !vcenter_template_ref.empty?
            xml_user_template.xpath("VCENTER_TEMPLATE_REF").remove
        end
        xml_user_template.add_child(xml_doc.create_element("VCENTER_TEMPLATE_REF")).add_child(Nokogiri::XML::CDATA.new(xml_doc,"#{template_ref}"))
    end

    # Monitoring info attributes
    xml_monitoring.xpath("LAST_MON").remove

    esx_host = xml_monitoring.xpath("ESX_HOST").text
    if !esx_host.empty?
        xml_monitoring.xpath("ESX_HOST").remove
        xml_monitoring.add_child(xml_doc.create_element("VCENTER_ESX_HOST")).add_child(Nokogiri::XML::CDATA.new(xml_doc,"#{esx_host}"))
    end

    guest_state = xml_monitoring.xpath("GUEST_STATE").text
    if !guest_state.empty?
        xml_monitoring.xpath("GUEST_STATE").remove
        xml_monitoring.add_child(xml_doc.create_element("VCENTER_GUEST_STATE")).add_child(Nokogiri::XML::CDATA.new(xml_doc,"#{guest_state}"))
    end

    resource_pool = xml_monitoring.xpath("RESOURCE_POOL").text
    if !guest_state.empty?
        xml_monitoring.xpath("RESOURCE_POOL").remove
        xml_monitoring.add_child(xml_doc.create_element("VCENTER_RP_NAME")).add_child(Nokogiri::XML::CDATA.new(xml_doc,"#{resource_pool}"))
    end

    vmware_running_status = xml_monitoring.xpath("VMWARETOOLS_RUNNING_STATUS").text
    if !vmware_running_status.empty?
        xml_monitoring.xpath("VMWARETOOLS_RUNNING_STATUS").remove
        xml_monitoring.add_child(xml_doc.create_element("VCENTER_VMWARETOOLS_RUNNING_STATUS")).add_child(Nokogiri::XML::CDATA.new(xml_doc,"#{vmware_running_status}"))
    end

    vmware_tools_version = xml_monitoring.xpath("VMWARETOOLS_VERSION").text
    if !vmware_tools_version.empty?
        xml_monitoring.xpath("VMWARETOOLS_VERSION").remove
        xml_monitoring.add_child(xml_doc.create_element("VCENTER_VMWARETOOLS_VERSION")).add_child(Nokogiri::XML::CDATA.new(xml_doc,"#{vmware_tools_version}"))
    end

    vmware_tools_version_status = xml_monitoring.xpath("VMWARETOOLS_VERSION_STATUS").text
    if !vmware_tools_version_status.empty?
        xml_monitoring.xpath("VMWARETOOLS_VERSION_STATUS").remove
        xml_monitoring.add_child(xml_doc.create_element("VCENTER_VMWARETOOLS_VERSION_STATUS")).add_child(Nokogiri::XML::CDATA.new(xml_doc,"#{vmware_tools_version_status}"))
    end

    # History record info attributes
    vmware_tools_version = xml_history.xpath("VMWARETOOLS_VERSION").text
    history_ds_id = xml_history.at_xpath("DS_ID")
    history_ds_id.content = ds_id
    xml_history.xpath("TM_MAD").remove
    xml_history.add_child(xml_doc.create_element("TM_MAD")).add_child(Nokogiri::XML::CDATA.new(xml_doc,"vcenter"))

    # Write template to file
    File.open("#{TEMP_DIR}/one_migrate_vm_#{vm_id}","w"){|f| f.puts(xml_doc.root.to_s.gsub(/>\s*/, ">").gsub(/\s*</, "<"))}
    STDOUT.puts "--- New XML file #{TEMP_DIR}/one_migrate_vm_#{vm_id} for vm #{vm_name} was created and old attributes were removed\n"

    return extraconfig
end

def template_unmanaged_discover(devices, ccr_name, ccr_ref, vcenter_name, vcenter_uuid, dc_name, ipool, vnpool, dspool, hpool, one_client, template_ref, template_name)
    unmanaged = {}
    unmanaged[:images] = []
    unmanaged[:networks] = []

    ide_controlled  = []
    sata_controlled = []
    scsi_controlled = []

    devices.each do |device|
        dspool.info
        ipool.info
        vnpool.info
        if device.is_a? RbVmomi::VIM::VirtualIDEController
            ide_controlled += device.device
            next
        end

        if device.is_a? RbVmomi::VIM::VirtualSATAController
            sata_controlled += device.device
            next
        end

        if device.is_a? RbVmomi::VIM::VirtualSCSIController
            scsi_controlled += device.device
            next
        end

        # If Virtual Disk
        if !(device.class.ancestors.index(RbVmomi::VIM::VirtualDisk)).nil?
            ds_name       = device.backing.datastore.name
            ds_ref        = device.backing.datastore._ref
            image_path    = device.backing.fileName.sub(/^\[(.*?)\] /, "")
            image_type    = "OS"
            image_prefix  = "hd" if ide_controlled.include?(device.key)
            image_prefix  = "sd" if scsi_controlled.include?(device.key)
            image_prefix  = "sd" if sata_controlled.include?(device.key)
            file_name     = File.basename(image_path).gsub(/\.vmdk$/,"")
            image_name    = "#{file_name} - #{ds_name}"

            #Check if the image has already been imported
            image = find_image(ipool, ds_name, image_path)

            #Check if the IMAGE DS is there
            ds = find_datastore(dspool, ds_ref, ccr_ref, vcenter_uuid, "IMAGE_DS")

            #Create IMAGE and SYSTEM DS if datastore is not found
            if ds.nil?
                # Get cluster's host ID
                hosts = hpool.retrieve_xmlelements("HOST[NAME=\"#{ccr_name}\"]")
                if hosts.empty?
                    raise "Required IMAGE Datastore #{ds_name} could not be created, cannot find cluster's host ID"
                end
                host_id = hosts.first["ID"]

                ds = create_image_ds(ds_name, ds_ref, vcenter_name, vcenter_uuid, ccr_name, ccr_ref, dc_name, host_id, one_client)

                create_system_ds(ds_name, ds_ref, vcenter_name, vcenter_uuid, ccr_name, ccr_ref, host_id, one_client)
            end

            if !image
                #Create image
                one_image = ""
                one_image << "NAME=\"#{image_name}\"\n"
                one_image << "PATH=\"vcenter://#{image_path}\"\n"
                one_image << "TYPE=\"#{image_type}\"\n"
                one_image << "PERSISTENT=\"NO\"\n"
                one_image << "VCENTER_IMPORTED=\"YES\"\n"
                one_image << "DEV_PREFIX=\"#{image_prefix}\"\n"

                one_i = OpenNebula::Image.new(OpenNebula::Image.build_xml, one_client)
                rc = one_i.allocate(one_image, ds["ID"].to_i)
                raise "\n    ERROR! Could not create image for template #{template_name}. Reason #{rc.message}" if OpenNebula.is_error?(rc)

                rc = one_i.info
                raise "\n    ERROR! Could not get image info for template #{template_name}. Reason #{rc.message}" if OpenNebula.is_error?(rc)
                STDOUT.puts "--- Image #{one_i["NAME"]} with ID #{one_i["ID"]} has been created"
                unmanaged[:images] << one_i["ID"]
            else
                unmanaged[:images] << image["ID"]
                STDOUT.puts "--- Image #{image["NAME"]} with ID #{image["ID"]} already exists"
            end
        end

        # If VirtualEthernetCard
        if !device.class.ancestors.index(RbVmomi::VIM::VirtualEthernetCard).nil?
            network_bridge = device.backing.network.name
            network_ref    = device.backing.network._ref
            network_name   = "#{network_bridge} [#{network_ref} - #{template_ref} - #{vcenter_uuid}]"
            network_type   = device.backing.network.instance_of?(RbVmomi::VIM::DistributedVirtualPortgroup) ? "Distributed Port Group" : "Port Group"

            network = find_network(vnpool, network_ref, ccr_ref, template_ref, vcenter_uuid)

            if !network
                one_net = ""
                one_net << "NAME=\"#{network_name}\"\n"
                one_net << "BRIDGE=\"#{network_bridge}\"\n"
                one_net << "VN_MAD=\"dummy\"\n"
                one_net << "VCENTER_PORTGROUP_TYPE=\"#{network_type}\"\n"
                one_net << "VCENTER_NET_REF=\"#{network_ref}\"\n"
                one_net << "VCENTER_CCR_REF=\"#{ccr_ref}\"\n"
                one_net << "VCENTER_TEMPLATE_REF=\"#{template_ref}\"\n"
                one_net << "OPENNEBULA_MANAGED=\"NO\"\n"
                one_net << "VCENTER_INSTANCE_ID=\"#{vcenter_uuid}\"\n"
                one_net << "AR=[\n"
                one_net << "TYPE=\"ETHER\",\n"
                one_net << "SIZE=\"255\"\n"
                one_net << "]\n"

                one_vn = OpenNebula::VirtualNetwork.new(OpenNebula::VirtualNetwork.build_xml, one_client)
                rc = one_vn.allocate(one_net)
                raise "\n    ERROR! Could not create vnet for template #{template_name}. Reason #{rc.message}" if OpenNebula.is_error?(rc)

                rc = one_vn.info
                raise "\n    ERROR! Could not get network info for template #{template_name}. Reason #{rc.message}" if OpenNebula.is_error?(rc)
                STDOUT.puts "--- Network #{one_vn["NAME"]} with ID #{one_vn["ID"]} has been created"
                unmanaged[:networks] << one_vn["ID"]
            else
                unmanaged[:networks] << network["ID"]
                STDOUT.puts "--- Network #{network["NAME"]} with ID #{network["ID"]} already exists"
            end
        end
    end

    return unmanaged
end

def retrieve_vcenter_clusters(vi_client)

    view = vi_client.vim.serviceContent.viewManager.CreateContainerView({
            container: vi_client.vim.rootFolder,
            type:      ['ClusterComputeResource'],
            recursive: true
    })

    pc = vi_client.vim.serviceContent.propertyCollector

    filterSpec = RbVmomi::VIM.PropertyFilterSpec(
        :objectSet => [
            :obj => view,
            :skip => true,
            :selectSet => [
            RbVmomi::VIM.TraversalSpec(
                :name => 'traverseEntities',
                :type => 'ContainerView',
                :path => 'view',
                :skip => false
            )
            ]
        ],
        :propSet => [
            { :type => 'ClusterComputeResource', :pathSet => ['name','host'] }
        ]
    )

    result = pc.RetrieveProperties(:specSet => [filterSpec])

    clusters = {}
    result.each do |r|
        clusters[r.obj._ref] = r.to_hash if r.obj.is_a?(RbVmomi::VIM::ClusterComputeResource)
    end

    view.DestroyView # Destroy the view

    return clusters
end

def retrieve_vcenter_datastores(vi_client)

    view = vi_client.vim.serviceContent.viewManager.CreateContainerView({
            container: vi_client.vim.rootFolder,
            type:      ['Datastore','StoragePod'],
            recursive: true
    })

    pc = vi_client.vim.serviceContent.propertyCollector

    filterSpec = RbVmomi::VIM.PropertyFilterSpec(
        :objectSet => [
            :obj => view,
            :skip => true,
            :selectSet => [
            RbVmomi::VIM.TraversalSpec(
                :name => 'traverseEntities',
                :type => 'ContainerView',
                :path => 'view',
                :skip => false
            )
            ]
        ],
        :propSet => [
            { :type => 'Datastore', :pathSet => ['name'] },
            { :type => 'StoragePod', :pathSet => ['name'] }
        ]
    )

    result = pc.RetrieveProperties(:specSet => [filterSpec])

    datastores = {}
    result.each do |r|
        datastores[r.obj._ref] = r.to_hash if r.obj.is_a?(RbVmomi::VIM::Datastore) || r.obj.is_a?(RbVmomi::VIM::StoragePod)
        datastores[r.obj._ref][:ds_type] = r.obj.is_a?(RbVmomi::VIM::Datastore) ? "Datastore" : "StoragePod"
    end

    view.DestroyView # Destroy the view

    return datastores
end

def retrieve_vcenter_networks(vi_client)

    view = vi_client.vim.serviceContent.viewManager.CreateContainerView({
        container: vi_client.vim.rootFolder,
        type:      ['Network','DistributedVirtualPortgroup'],
        recursive: true
    })

    pc = vi_client.vim.serviceContent.propertyCollector

    filterSpec = RbVmomi::VIM.PropertyFilterSpec(
        :objectSet => [
            :obj => view,
            :skip => true,
            :selectSet => [
            RbVmomi::VIM.TraversalSpec(
                :name => 'traverseEntities',
                :type => 'ContainerView',
                :path => 'view',
                :skip => false
            )
            ]
        ],
        :propSet => [
            { :type => 'Network', :pathSet => ['name','host'] },
            { :type => 'DistributedVirtualPortgroup', :pathSet => ['name','host'] }
        ]
    )

    result = pc.RetrieveProperties(:specSet => [filterSpec])

    networks = {}
    result.each do |r|
        networks[r.obj._ref] = r.to_hash if r.obj.is_a?(RbVmomi::VIM::DistributedVirtualPortgroup) || r.obj.is_a?(RbVmomi::VIM::Network)
        networks[r.obj._ref][:network_type] = r.obj.is_a?(RbVmomi::VIM::DistributedVirtualPortgroup) ? "Distributed Port Group" : "Port Group"
    end

    view.DestroyView # Destroy the view

    return networks
end

def retrieve_vcenter_vms(vi_client)

    view = vi_client.vim.serviceContent.viewManager.CreateContainerView({
            container: vi_client.vim.rootFolder,
            type:      ['VirtualMachine'],
            recursive: true
    })

    pc = vi_client.vim.serviceContent.propertyCollector

    filterSpec = RbVmomi::VIM.PropertyFilterSpec(
        :objectSet => [
            :obj => view,
            :skip => true,
            :selectSet => [
            RbVmomi::VIM.TraversalSpec(
                :name => 'traverseEntities',
                :type => 'ContainerView',
                :path => 'view',
                :skip => false
            )
            ]
        ],
        :propSet => [
            { :type => 'VirtualMachine', :pathSet => ['name','config.template','config.uuid','config.hardware.device', 'config.extraConfig', 'datastore'] }
        ]
    )

    result = pc.RetrieveProperties(:specSet => [filterSpec])

    vms = {}
    result.each do |r|
        vms[r.obj._ref] = r.to_hash if r.obj.is_a?(RbVmomi::VIM::VirtualMachine)
    end

    vmachines = {}
    templates = {}

    vms.each do |ref,value|
        if value["config.template"]
            templates[ref] = value
        else
            vmachines[ref] = value
        end
    end

    view.DestroyView # Destroy the view

    return vmachines, templates
end

def select_cluster(vc_clusters, ccr_name, vi_client)
    ccr_ref = nil
    STDOUT.puts("WARNING: Manual intervention required!")
    STDOUT.puts("\nWe could not determine the cluster associated to name #{ccr_name}\n")
    STDOUT.puts
    index = 0
    ccr_refs = []
    vc_clusters.each do |ref, ccr|
        if ccr_name == ccr["name"]
            item = RbVmomi::VIM::ClusterComputeResource.new(vi_client.vim, ref)

            folders = []
            while !item.instance_of? RbVmomi::VIM::Datacenter
                item = item.parent
                folders << item.name if !item.instance_of? RbVmomi::VIM::Datacenter
                if item.nil?
                    raise "Could not find the Datacenter for the host"
                end
            end
            datacenter = item
            location   = folders.reverse.join("/")

            ccr_refs << ref
            STDOUT.puts("##{index+1}: Cluster #{ccr["name"]} in Datacenter #{datacenter.name} Location: #{location}")
            index += 1
        end
    end

    loop do
        STDOUT.print("\nFrom the list above, please pick up one number in order to specify the cluster: ")
        cluster_index = STDIN.gets.strip.to_i
        next if cluster_index == 0 || cluster_index - 1 < 0 || cluster_index - 1 > ccr_refs.size
        ccr_ref  = ccr_refs[cluster_index-1] rescue nil
        break if ccr_ref
    end

    ccr_ref
end

################################################################################
def add_new_host_attrs(vc_clusters, hpool, one_client, vcenter_ids)
    hosts = hpool.retrieve_xmlelements("HOST[VM_MAD=\"vcenter\"]")

    hosts.each do |host|
        begin
            one_host  = OpenNebula::Host.new_with_id(host["ID"], one_client)
            rc   = one_host.info
            raise rc.message if OpenNebula.is_error?(rc)

            vi_client       = VCenterDriver::VIClient.new(host["ID"])
            vcenter_uuid    = vi_client.vim.serviceContent.about.instanceUuid
            vcenter_version = vi_client.vim.serviceContent.about.apiVersion

            ccr_name = host["NAME"]
            ccr_ref  = nil

            clusters_with_name = vc_clusters[vcenter_uuid].select {|ref, ccr| ccr["name"] == ccr_name}

            if clusters_with_name.size == 0
                raise "Host #{ccr_name} could not be updated, cannot find cluster's MOREF"
            end

            if clusters_with_name.size == 1
                vc_clusters[vcenter_uuid].each do |ref, ccr|
                    if ccr["name"] == ccr_name
                        ccr_ref = ref
                        break
                    end
                end
            else
                ccr_ref = select_cluster(vc_clusters[vcenter_uuid], ccr_name, vi_client)
            end

            # Update host's template
            template = ""
            template << "VCENTER_CCR_REF=\"#{ccr_ref}\"\n"
            template << "VCENTER_INSTANCE_ID=\"#{vcenter_uuid}\"\n"
            template << "VCENTER_VERSION=\"#{vcenter_version}\""
            rc = one_host.update(template, true)
            raise "Host #{ccr_name} could not be updated. Reason #{rc.message}" if OpenNebula.is_error?(rc)
            STDOUT.puts "Host #{ccr_name} got new attributes:\n"
            STDOUT.puts "--- VCENTER_CCR_REF=#{ccr_ref}\n"
            STDOUT.puts "--- VCENTER_INSTANCE_ID=#{vcenter_uuid}\n"
            STDOUT.puts "--- VCENTER_VERSION=#{vcenter_version}\n"
            STDOUT.puts

            vcenter_ids[:host] << one_host["ID"]
        rescue Exception => e
            raise e
        ensure
            vi_client.vim.close if vi_client
        end
    end
end

################################################################################
def remove_host_attrs(host_ids, one_client)
    host_ids.each do |host_id|
        # Create XML removing old attributes
        one_host = OpenNebula::Host.new_with_id(host_id, one_client)
        rc   = one_host.info
        raise rc.message if OpenNebula.is_error?(rc)
        xml_doc = Nokogiri::XML(one_host.to_xml, nil, "UTF-8"){|c| c.default_xml.noblanks}
        xml_doc.root.xpath("TEMPLATE/PUBLIC_CLOUD").remove
        xml_doc.root.xpath("TEMPLATE/VCENTER_DATASTORE").remove
        xml_doc.root.xpath("TEMPLATE/RESOURCE_POOL").remove
        STDOUT.puts "--- New XML file #{TEMP_DIR}/one_migrate_host_#{host_id} for host #{one_host["NAME"]} was created and attributes were removed\n"
        File.open("#{TEMP_DIR}/one_migrate_host_#{host_id}","w"){|f| f.puts(xml_doc.root.to_s.gsub(/>\s*/, ">").gsub(/\s*</, "<"))}
    end
end

################################################################################
def add_new_ds_attrs(vc_datastores, vc_clusters, dspool, hpool, one_client, vcenter_ids)

    datastores = dspool.retrieve_xmlelements("DATASTORE[TM_MAD=\"vcenter\"]")

    # Remove previous system datastores created earlier
    datastores.each do |datastore|
        if datastore["TEMPLATE/TYPE"] == "SYSTEM_DS" && datastore["TEMPLATE/VCENTER_CLUSTER"].nil?
            one_ds  = OpenNebula::Datastore.new_with_id(datastore["ID"], one_client)
            one_ds.info
            ds_name = one_ds["NAME"]
            one_ds.delete
            STDOUT.puts("System datastore #{ds_name} has been deleted, it was created in previous script run")
        end
    end

    STDOUT.puts

    # Retrieve datastores once the hay been deleted
    dspool.info
    datastores = dspool.retrieve_xmlelements("DATASTORE[TM_MAD=\"vcenter\"]")

    datastores.each do |datastore|
        begin
            one_ds  = OpenNebula::Datastore.new_with_id(datastore["ID"], one_client)
            rc      = one_ds.info
            raise rc.message if OpenNebula.is_error?(rc)

            ds_name = one_ds["NAME"]

            # Get Datastore's cluster name
            ccr_name = one_ds["TEMPLATE/VCENTER_CLUSTER"]
            next if !ccr_name

            # Get cluster's host from its name and vcenter instance id
            hosts = hpool.retrieve_xmlelements("HOST[NAME=\"#{ccr_name}\"]")
            if hosts.empty?
                raise "Could not find OpenNebula host associated to VCENTER_CLUSTER"
            end
            host_id = hosts.first["ID"]
            ccr_ref = hosts.first["TEMPLATE/VCENTER_CCR_REF"]

            if ccr_ref.nil?
                raise "Datastore #{ds_name} could not be updated, cannot find cluster's MOREF"
            end

            vi_client       = VCenterDriver::VIClient.new(host_id)
            vcenter_uuid    = vi_client.vim.serviceContent.about.instanceUuid
            vcenter_name    = vi_client.host

            datastores_with_name = vc_datastores[vcenter_uuid].select {|ref, ds| ds["name"] == ds_name}
            if datastores_with_name.empty?
                raise "Could not find datastore in vcenter by its name #{ds_name}"
            end

            # Get datastore MOREF from vcenter info
            ds_ref  = nil
            ds_type = nil

            if datastores_with_name.size == 1
                vc_datastores[vcenter_uuid].each do |ref, ds|
                    if ds["name"] == ds_name
                        ds_ref = ref
                        ds_type = ds[:ds_type]
                        break
                    end
                end
            else
                STDOUT.puts("WARNING: Manual intervention required!")
                STDOUT.puts("\nWe could not determine the datastore from its name #{ds_name}\n")
                STDOUT.puts
                index = 0
                ds_refs  = []
                ds_types = []
                vc_datastores[vcenter_uuid].each do |ref, ds|
                    if ds_name == ds["name"]
                        if ds[:ds_type] == "Datastore"
                            item = RbVmomi::VIM::Datastore.new(vi_client.vim, ref)
                        else
                            item = RbVmomi::VIM::StoragePod.new(vi_client.vim, ref)
                        end

                        while !item.instance_of? RbVmomi::VIM::Datacenter
                            item = item.parent
                            if item.nil?
                                raise "Could not find the Datacenter for the datastore"
                            end
                        end
                        datacenter = item

                        ds_refs << ref
                        ds_types << ds[:ds_type]
                        STDOUT.puts("##{index+1}: Datastore #{ds["name"]} in Datacenter #{datacenter.name}")
                        index += 1
                    end
                end

                loop do
                    STDOUT.print("\nFrom the list above, please pick up one number in order to specify the datastore: ")
                    ds_index = STDIN.gets.strip.to_i
                    next if ds_index == 0 || ds_index - 1 < 0 || ds_index - 1 > ds_refs.size
                    ds_ref  = ds_refs[ds_index-1] rescue nil
                    ds_type = ds_types[ds_index-1] rescue nil
                    break if ds_ref
                end
            end

            STDOUT.puts

            if ds_ref.nil?
                raise "Datastore #{ds_name} could not be updated, cannot find datastore's MOREF"
            end

            # Update datastore's template
            template = ""
            template << "VCENTER_DS_REF=\"#{ds_ref}\"\n"
            template << "VCENTER_INSTANCE_ID=\"#{vcenter_uuid}\"\n"
            template << "VCENTER_CCR_REF=\"#{ccr_ref}\"\n"
            template << "VCENTER_ONE_HOST_ID=\"#{host_id}\"\n"
            rc = one_ds.update(template, true)
            raise "Datastore #{ds_name} could not be updated. Reason #{rc.message}" if OpenNebula.is_error?(rc)
            STDOUT.puts "Datastore #{ds_name} got new attributes:\n"
            STDOUT.puts "--- VCENTER_DS_REF=#{ds_ref}\n"
            STDOUT.puts "--- VCENTER_INSTANCE_ID=#{vcenter_uuid}\n"
            STDOUT.puts "--- VCENTER_CCR_REF=#{ccr_ref}\n"
            STDOUT.puts "--- VCENTER_ONE_HOST_ID=#{host_id}\n"
            STDOUT.puts

            # Check if SYSTEM datastore was not created before
            if ds_type == "Datastore"
                # Create SYSTEM_DS associated to the existing IMAGE_DS
                create_system_ds(ds_name, ds_ref, vcenter_name, vcenter_uuid, ccr_name, ccr_ref, host_id, one_client)
            end

            vcenter_ids[:ds] << one_ds["ID"]

        rescue Exception => e
            raise e
        ensure
            vi_client.vim.close if vi_client
        end
    end
end

################################################################################
def remove_ds_attrs(ds_ids, one_client)

    ds_ids.each do |ds_id|
        # Create XML removing old attributes
        one_ds = OpenNebula::Datastore.new_with_id(ds_id, one_client)
        rc   = one_ds.info
        raise rc.message if OpenNebula.is_error?(rc)
        xml_doc = Nokogiri::XML(one_ds.to_xml, nil, "UTF-8"){|c| c.default_xml.noblanks}
        xml_doc.root.xpath("TEMPLATE/VCENTER_CLUSTER").remove
        File.open("#{TEMP_DIR}/one_migrate_ds_#{one_ds["ID"]}","w"){|f| f.puts(xml_doc.root.to_s.gsub(/>\s*/, ">").gsub(/\s*</, "<"))}
        STDOUT.puts "--- New XML file #{TEMP_DIR}/one_migrate_ds_#{one_ds["ID"]} for datastore #{one_ds["NAME"]} was created and attributes were removed\n"
    end
end

################################################################################
def add_new_vnet_attrs(vc_networks, vc_clusters, vnpool, hpool, one_client, vcenter_ids)
    vnets = vnpool.retrieve_xmlelements("VNET[TEMPLATE/VCENTER_TYPE=\"Port Group\" or TEMPLATE/VCENTER_TYPE=\"Distributed Port Group\"]")

    vnets.each do |vnet|
        begin
            one_vnet = OpenNebula::VirtualNetwork.new_with_id(vnet["ID"], one_client)
            rc   = one_vnet.info
            raise rc.message if OpenNebula.is_error?(rc)

            vnet_name    = vnet["NAME"]
            vnet_bridge  = vnet["TEMPLATE/BRIDGE"]
            vnet_pg_type = vnet["TEMPLATE/VCENTER_TYPE"]

            # Try to get cluster associated to this network from imported name
            ccr_name = vnet_name.split(" - ")[-1] rescue nil

            # Let's see if we can find the cluster name from the vnet name
            if ccr_name
                hosts = hpool.retrieve_xmlelements("HOST[NAME=\"#{ccr_name}\"]")
                ccr_name = nil if hosts.empty?
            end

            # If cluster name could not be determined, user action required
            if !ccr_name
                STDOUT.puts("WARNING: Manual intervention required!")
                STDOUT.puts("\nWe could not determine the host associated to vnet: #{vnet_name}\n")
                STDOUT.puts

                ccr_names = []
                hpool.each_with_index do |host, index|
                    STDOUT.puts("##{index+1}: #{host["NAME"]} in #{host["TEMPLATE/VCENTER_HOST"]}")
                    ccr_names << host["NAME"]
                end

                STDOUT.puts("##{ccr_names.size+1}: None of the above.")

                loop do
                    STDOUT.print("\nFrom the list above, please pick up one number in order to specify the cluster: ")
                    cluster_index = STDIN.gets.strip.to_i
                    next if cluster_index == 0 || cluster_index - 1 < 0 || cluster_index - 1 > ccr_names.size+1
                    ccr_name  = ccr_names[cluster_index-1] rescue nil
                    break
                end

                STDOUT.puts
            end

            if !ccr_name
                raise "We could not find the host name associated to vnet #{vnet_name}\n"\
                    "You may have to import the host first using onevcenter tool."
            end

            # Get cluster's ccr from its name and vcenter instance id
            hosts = hpool.retrieve_xmlelements("HOST[NAME=\"#{ccr_name}\"]")

            ccr_ref = hosts.first["TEMPLATE/VCENTER_CCR_REF"]
            if ccr_ref.nil?
                raise "Vnet #{vnet_name} could not be updated, cannot find cluster's MOREF"
            end

            host_id      = hosts.first["ID"]
            vi_client    = VCenterDriver::VIClient.new(host_id)
            vcenter_uuid = vi_client.vim.serviceContent.about.instanceUuid

            # Get vnet MOREF from vcenter info
            vnets_with_name = vc_networks[vcenter_uuid].select {|ref, net| net["name"] == vnet_bridge}
            if vnets_with_name.empty?
                raise "Could not find vnet in vcenter by its name #{vnet_name}"
            end

            vnet_ref  = nil
            if vnets_with_name.size == 1
                vc_networks[vcenter_uuid].each do |ref, net|
                    if net["name"] == vnet_bridge
                        vnet_ref = ref
                        break
                    end
                end
            else
                STDOUT.puts("WARNING: Manual intervention required!")
                STDOUT.puts("\nWe could not determine the virtual network from its name #{vnet_name}\n")
                STDOUT.puts
                index = 0
                vnet_refs  = []
                vc_networks[vcenter_uuid].each do |ref, net|
                    if net["name"] == vnet_bridge
                        item = RbVmomi::VIM::Network.new(vi_client.vim, ref)

                        while !item.instance_of? RbVmomi::VIM::Datacenter
                            item = item.parent
                            if item.nil?
                                raise "Could not find the Datacenter for the datastore"
                            end
                        end
                        datacenter = item

                        vnet_refs << ref
                        STDOUT.puts("##{index+1}: Virtual Network #{vnet_name} in Datacenter #{datacenter.name}")
                        index += 1
                    end
                end

                loop do
                    STDOUT.print("\nFrom the list above, please pick up one number in order to specify the vnet: ")
                    vnet_index = STDIN.gets.strip.to_i
                    next if vnet_index == 0 || vnet_index - 1 < 0 || vnet_index - 1 > vnet_refs.size
                    vnet_ref  = vnet_refs[vnet_index-1] rescue nil
                    break if vnet_ref
                end
            end

            STDOUT.puts

            raise "Vnet #{vnet_name} could not be updated, cannot find vnet's MOREF" if vnet_ref.nil?

            # Update vnet's template
            template = ""
            template << "VCENTER_NET_REF=\"#{vnet_ref}\"\n"
            template << "VCENTER_INSTANCE_ID=\"#{vcenter_uuid}\"\n"
            template << "VCENTER_PORTGROUP_TYPE=\"#{vnet_pg_type}\"\n"
            template << "VCENTER_CCR_REF=\"#{ccr_ref}\"\n"
            rc = one_vnet.update(template, true)
            raise "Vnet #{vnet_name} could not be updated. Reason #{rc.message}" if OpenNebula.is_error?(rc)
            STDOUT.puts "\nVnet #{vnet_name} got new attributes:\n"
            STDOUT.puts "--- VCENTER_NET_REF=#{vnet_ref}\n"
            STDOUT.puts "--- VCENTER_INSTANCE_ID=#{vcenter_uuid}\n"
            STDOUT.puts "--- VCENTER_PORTGROUP_TYPE=#{vnet_pg_type}\n"
            STDOUT.puts "--- VCENTER_CCR_REF=#{ccr_ref}\n"
            STDOUT.puts

            vcenter_ids[:vnet] << one_vnet["ID"]

        rescue Exception => e
            raise e
        ensure
            vi_client.vim.close if vi_client
        end
    end
end

################################################################################
def remove_vnet_attrs(vnet_ids, one_client)
    vnet_ids.each do |vnet_id|
        # Create XML removing old attributes
        one_vnet = OpenNebula::VirtualNetwork.new_with_id(vnet_id, one_client)
        rc   = one_vnet.info
        raise rc.message if OpenNebula.is_error?(rc)
        xml_doc = Nokogiri::XML(one_vnet.to_xml, nil, "UTF-8"){|c| c.default_xml.noblanks}
        xml_doc.root.xpath("TEMPLATE/VCENTER_TYPE").remove
        File.open("#{TEMP_DIR}/one_migrate_vnet_#{vnet_id}","w"){|f| f.puts(xml_doc.root.to_s.gsub(/>\s*/, ">").gsub(/\s*</, "<"))}
        STDOUT.puts "--- New XML file #{TEMP_DIR}/one_migrate_vnet_#{vnet_id} for vnet #{one_vnet["NAME"]} was created and attributes were removed\n"
    end
end

################################################################################
def add_new_image_attrs(ipool, hpool, one_client, vcenter_ids)
    ipool.each do |image|
        image_name = image["NAME"]

        one_image = OpenNebula::Image.new_with_id(image["ID"], one_client)
        rc   = one_image.info
        raise rc.message if OpenNebula.is_error?(rc)

        template = ""
        adapter_type = nil
        disk_type    = nil

        if one_image["TEMPLATE/ADAPTER_TYPE"]
            adapter_type = one_image["TEMPLATE/ADAPTER_TYPE"]
            template << "VCENTER_ADAPTER_TYPE=\"#{adapter_type}\"\n"
        end

        if one_image["TEMPLATE/DISK_TYPE"]
            disk_type = one_image["TEMPLATE/DISK_TYPE"]
            template << "VCENTER_DISK_TYPE=\"#{disk_type}\"\n"
        end

        if !template.empty?
            # Update image's template
            rc = one_image.update(template, true)
            raise "Vnet #{image_name} could not be updated. Reason #{rc.message}" if OpenNebula.is_error?(rc)
            STDOUT.puts "\nImage #{image_name} got new attributes:\n"
            STDOUT.puts "--- VCENTER_DISK_TYPE=#{disk_type}\n"
            STDOUT.puts "--- VCENTER_ADAPTER_TYPE=#{adapter_type}\n"
            STDOUT.puts
        end

        vcenter_ids[:image] << one_image["ID"]
    end
end

################################################################################
def remove_image_attrs(image_ids, one_client)
    image_ids.each do |image_id|
        begin
            one_image = OpenNebula::Image.new_with_id(image_id, one_client)
            rc   = one_image.info
            raise rc.message if OpenNebula.is_error?(rc)

            # Remove old attributes
            xml_doc = Nokogiri::XML(one_image.to_xml, nil, "UTF-8"){|c| c.default_xml.noblanks}
            xml_doc.root.xpath("TEMPLATE/ADAPTER_TYPE").remove
            xml_doc.root.xpath("TEMPLATE/DISK_TYPE").remove

            # Update image's size
            one_ds = OpenNebula::Datastore.new_with_id(one_image["DATASTORE_ID"], one_client)
            rc   = one_ds.info
            raise rc.message if OpenNebula.is_error?(rc)
            image_source = one_image["SOURCE"]
            ds_ref  = one_ds["TEMPLATE/VCENTER_DS_REF"]
            host_id = one_ds["TEMPLATE/VCENTER_ONE_HOST_ID"]
            vi_client = VCenterDriver::VIClient.new(host_id)
            disk_size = get_image_size(RbVmomi::VIM::Datastore.new(vi_client.vim, ds_ref), image_source)
            xml_size  = xml_doc.root.at_xpath("SIZE")
            xml_size.content = disk_size

            File.open("#{TEMP_DIR}/one_migrate_image_#{image_id}","w"){|f| f.puts(xml_doc.root.to_s.gsub(/>\s*/, ">").gsub(/\s*</, "<"))}
            STDOUT.puts "--- New XML file #{TEMP_DIR}/one_migrate_image_#{image_id} for image #{one_image["NAME"]} was created and attributes were removed\n"
        rescue Exception => e
            raise e
        ensure
            vi_client.vim.close if vi_client
        end
    end
end

################################################################################
def add_new_template_attrs(vc_templates, vc_clusters, tpool, ipool, vnpool, dspool, hpool, one_client)
    templates = tpool.retrieve_xmlelements("VMTEMPLATE[TEMPLATE/PUBLIC_CLOUD/TYPE=\"vcenter\"]")

    templates.each do |template|

        begin
            # Refresh pools
            rc = vnpool.info
            raise "\n    ERROR! Could not update vnpool. Reason #{rc.message}" if OpenNebula.is_error?(rc)
            rc = ipool.info
            raise "\n    ERROR! Could not update ipool. Reason #{rc.message}" if OpenNebula.is_error?(rc)
            rc = dspool.info
            raise "\n    ERROR! Could not update dspool. Reason #{rc.message}" if OpenNebula.is_error?(rc)

            ccr_ref = nil
            vcenter_uuid = nil
            host_id = nil
            template_name    = template["NAME"]
            template_ref     = template["TEMPLATE/PUBLIC_CLOUD/VCENTER_REF"]
            template_cluster = template["TEMPLATE/PUBLIC_CLOUD/HOST"]
            template_rp      = template["TEMPLATE/RESOURCE_POOL"]
            template_user_rp = template["TEMPLATE/USER_INPUTS/RESOURCE_POOL"]

            # Check if we can find the host in pool
            if template_cluster
                hosts = hpool.retrieve_xmlelements("HOST[NAME=\"#{template_cluster}\"]")
                if hosts.empty?
                    template_cluster = nil
                else
                    ccr_ref      = hosts.first["TEMPLATE/VCENTER_CCR_REF"]
                    vcenter_uuid = hosts.first["TEMPLATE/VCENTER_INSTANCE_ID"]
                    host_id      = hosts.first["ID"]
                    template_cluster = nil if !ccr_ref || !vcenter_uuid
                end
            end

            if !template_cluster
                STDOUT.puts("WARNING: Manual intervention required!")
                STDOUT.puts("\nWe could not determine the host associated to template #{template_name}\n")
                STDOUT.puts

                ccr_names = []
                hpool.each_with_index do |host, index|
                    STDOUT.puts("##{index+1}: #{host["NAME"]} in #{host["TEMPLATE/VCENTER_HOST"]}")
                    ccr_names << host["NAME"]
                end

                STDOUT.puts("##{ccr_names.size+1}: None of the above.")

                loop do
                    STDOUT.print("\nFrom the list above, please pick up one number in order to specify the cluster: ")
                    cluster_index = STDIN.gets.strip.to_i
                    next if cluster_index == 0 || cluster_index - 1 < 0 || cluster_index - 1 > ccr_names.size+1
                    template_cluster  = ccr_names[cluster_index-1] rescue nil
                    break
                end

                STDOUT.puts

                if !template_cluster
                raise "We could not find the host name associated to template #{template_name}\n"\
                    "You may have to import the host first using onevcenter tool."
                end

                # Get cluster's ccr from its name and vcenter instance id
                hosts = hpool.retrieve_xmlelements("HOST[NAME=\"#{template_cluster}\"]")

                ccr_ref      = hosts.first["TEMPLATE/VCENTER_CCR_REF"]
                vcenter_uuid = hosts.first["TEMPLATE/VCENTER_INSTANCE_ID"]
                host_id      = hosts.first["ID"]

                if ccr_ref.nil? || vcenter_uuid.nil?
                    raise "Template #{template_name} could not be updated, cannot find cluster's MOREF or vcenter uuid"
                end
            end

            if !ccr_ref
                raise "Template #{template_name} could not be updated, cannot find cluster's MOREF"
            end

            vi_client    = VCenterDriver::VIClient.new(host_id)
            vcenter_uuid = vi_client.vim.serviceContent.about.instanceUuid

            if template_ref
                templates_found = vc_templates[vcenter_uuid].select do |ref, value|
                    template_ref == ref
                end

                if templates_found.size != 1
                    template_ref = nil
                end
            end

            if !template_ref
                STDOUT.puts("WARNING: Manual intervention required!")
                STDOUT.puts("\nWe could not determine the reference for template #{template_name}\n")
                STDOUT.puts
                index = 0
                template_refs  = []

                vc_templates[vcenter_uuid].each do |ref, t|
                    item = RbVmomi::VIM::VirtualMachine.new(vi_client.vim, ref)

                    folders = []
                    while !item.instance_of? RbVmomi::VIM::Datacenter
                        item = item.parent
                        folders << item.name if !item.instance_of? RbVmomi::VIM::Datacenter
                        if item.nil?
                            raise "Could not find the Datacenter for the host"
                        end
                    end
                    datacenter = item
                    location   = folders.reverse.join("/")

                    template_refs << ref
                    STDOUT.puts("##{index+1}: Template #{t["name"]} in Datacenter #{datacenter.name} Location: #{location}")
                    index += 1
                end

                STDOUT.puts("##{template_refs.size+1}: None of the above.")

                loop do
                    STDOUT.print("\nFrom the list above, please pick up one number in order to specify the template: ")
                    template_index = STDIN.gets.strip.to_i
                    next if template_index == 0 || template_index - 1 < 0 || template_index - 1 > template_refs.size + 1
                    template_ref  = template_refs[template_index-1] rescue nil
                    break
                end
            end

            STDOUT.puts

            if !template_ref
                raise "Template #{template_name} could not be updated, cannot find template's MOREF"
            end

            # Get template
            one_template = OpenNebula::Template.new_with_id(template["ID"], one_client)
            rc   = one_template.info
            raise rc.message if OpenNebula.is_error?(rc)

            # Find vcenter template in vc_templates
            vc_template  = nil
            vc_template_object = nil
            vc_templates[vcenter_uuid].each do |ref, value|
                if ref == template_ref
                    vc_template = value
                    vc_template_object = RbVmomi::VIM::VirtualMachine.new(vi_client.vim, template_ref)
                    break
                end
            end

            if vc_template.nil?
                raise "Template #{template_name} could not be updated, cannot find vcenter info for this template"
            end

            # Migrate USER_INPUTS/RESOURCE_POOL
            user_inputs = nil
            if template_user_rp
                inputs = template.retrieve_xmlelements("TEMPLATE/USER_INPUTS").first.to_hash["USER_INPUTS"] rescue nil
                if inputs
                    user_inputs = ""
                    user_inputs << "USER_INPUTS=["
                    inputs.each do |key, value|
                        user_inputs << "#{key}=\"#{value}\",\n"
                    end
                    user_inputs << "VCENTER_RESOURCE_POOL=\"#{template_user_rp}\"\n"
                    user_inputs << "]"
                end
            end

            # Update VM template
            template = ""
            template << "VCENTER_TEMPLATE_REF=\"#{template_ref}\"\n"
            template << "VCENTER_INSTANCE_ID=\"#{vcenter_uuid}\"\n"
            template << "VCENTER_CCR_REF=\"#{ccr_ref}\"\n"
            template << "VCENTER_RESOURCE_POOL=\"#{template_rp}\"\n" if template_rp
            template << user_inputs if template_user_rp

            rc = one_template.update(template, true)
            raise "Template #{template_name} could not be updated. Reason #{rc.message}" if OpenNebula.is_error?(rc)
            STDOUT.puts "\nTemplate #{template_name}:"
            STDOUT.puts "--- New attribute VCENTER_TEMPLATE_REF=#{template_ref} added\n"
            STDOUT.puts "--- New attribute VCENTER_INSTANCE_ID=#{vcenter_uuid} added\n"
            STDOUT.puts "--- New attribute VCENTER_CCR_REF=#{ccr_ref} added\n"
            STDOUT.puts "--- New attribute VCENTER_RESOURCE_POOL=#{template_rp} added\n" if template_rp
            STDOUT.puts "--- New attribute USER_INPUTS/VCENTER_RESOURCE_POOL=#{template_user_rp} added\n" if template_user_rp

            # Prepare template for migration
            xml_doc           = Nokogiri::XML(one_template.to_xml, nil, "UTF-8"){|c| c.default_xml.noblanks}
            xml_template      = xml_doc.root.at_xpath("TEMPLATE")
            existing_disks    = xml_doc.root.xpath("TEMPLATE/DISK").remove # Retrieve and remove existing disks
            existing_nics     = xml_doc.root.xpath("TEMPLATE/NIC").remove  # Retrieve and remove existing nics
            template_id       = one_template["ID"]

            # Discover existing disks and/or nics
            dc = get_dc(vc_template_object)
            dc_name = dc.name
            vcenter_name = vi_client.host
            STDOUT.puts "--- Discovering disks and network interfaces inside the template (please be patient)"
            unmanaged = template_unmanaged_discover(vc_template["config.hardware.device"], template_cluster, ccr_ref, vcenter_name, vcenter_uuid, dc_name, ipool, vnpool, dspool, hpool, one_client, template_ref, template_name)

            if !unmanaged[:images].empty?
                STDOUT.puts "--- Referencing images for discovered disks "
                # Create images for unmanaged disks
                unmanaged[:images].each do |image_id|
                    # Add existing disk to xml
                    disk = xml_template.add_child(xml_doc.create_element("DISK"))
                    disk.add_child(xml_doc.create_element("IMAGE_ID")).add_child(Nokogiri::XML::CDATA.new(xml_doc,"#{image_id}"))
                    disk.add_child(xml_doc.create_element("OPENNEBULA_MANAGED")).add_child(Nokogiri::XML::CDATA.new(xml_doc,"NO"))
                end
            else
                STDOUT.puts "--- All required disks are ready to use"
            end

            # Add managed disks after unmanaged disks
            xml_template.add_child(existing_disks)

            if !unmanaged[:networks].empty?
                STDOUT.puts "--- Referencing images for discovered nics "
                # Create networks for unmanaged nics
                unmanaged[:networks].each do |network_id|
                    # Add existing nics to xml
                    nic = xml_template.add_child(xml_doc.create_element("NIC"))
                    nic.add_child(xml_doc.create_element("NETWORK_ID")).add_child(Nokogiri::XML::CDATA.new(xml_doc,"#{network_id}"))
                    nic.add_child(xml_doc.create_element("OPENNEBULA_MANAGED")).add_child(Nokogiri::XML::CDATA.new(xml_doc,"NO"))
                end
            else
                STDOUT.puts "--- All discovered networks are ready to use"
            end

            # Add managed disks after unmanaged disks
            xml_template.add_child(existing_nics)

            # Remove KEEP_DISKS_ON_DONE from TEMPLATE
            xml_template.xpath("KEEP_DISKS_ON_DONE").remove

            # Remove PUBLIC_CLOUD section from TEMPLATE
            xml_template.xpath("PUBLIC_CLOUD").remove

            # Remove RESOURCE_POOL section from TEMPLATE and USER_INPUTS
            xml_template.xpath("RESOURCE_POOL").remove
            xml_template.xpath("USER_INPUTS/RESOURCE_POOL").remove

            # Remove VCENTER_DATASTORE section from TEMPLATE and USER_INPUTS
            vcenter_datastore = xml_template.xpath("VCENTER_DATASTORE").text
            xml_template.xpath("VCENTER_DATASTORE").remove
            xml_template.xpath("USER_INPUTS/VCENTER_DATASTORE").remove

            # Replace CUSTOMIZATION_SPEC with VCENTER_CUSTOMIZATION_SPEC
            customization_spec = xml_template.xpath("CUSTOMIZATION_SPEC").text
            if !customization_spec.empty?
                xml_template.xpath("CUSTOMIZATION_SPEC").remove
                xml_template.add_child(xml_doc.create_element("VCENTER_CUSTOMIZATION_SPEC")).add_child(Nokogiri::XML::CDATA.new(xml_doc,"#{customization_spec}"))
            end

            # If vcenter_datastore is a SYSTEM_DS then it's a storage pod
            ds_id = nil
            if !vcenter_datastore.empty?
                ds = find_datastore_by_name(dspool, "#{vcenter_datastore}")
                ds_id   = ds["ID"]
                ds_type = ds["TEMPLATE/TYPE"]
                if ds_type == "SYSTEM_DS"
                    sched_ds_req = one_template["TEMPLATE/SCHED_DS_REQUIREMENTS"]

                    if !sched_ds_req
                        xml_template.xpath("SCHED_DS_REQUIREMENTS").remove
                        requirements = "ID=#{ds_id} & (#{sched_ds_req})"
                        xml_template.add_child(xml_doc.create_element("SCHED_DS_REQUIREMENTS")).add_child(Nokogiri::XML::CDATA.new(xml_doc,"\"#{requirements}\""))
                    else
                        # Add a SCHED_DS_REQUIREMENTS to template
                        xml_template.add_child(xml_doc.create_element("SCHED_DS_REQUIREMENTS")).add_child(Nokogiri::XML::CDATA.new(xml_doc,"\"ID=#{ds_id}\""))
                    end
                end
            end

            # Replace attributes in SCHED_DS_REQUIREMENTS
            sched_ds_req = one_template["TEMPLATE/SCHED_DS_REQUIREMENTS"]
            if sched_ds_req && sched_ds_req.include?("VCENTER_CLUSTER")
                STDOUT.puts("\n    WARNING: Manual intervention required!")
                STDOUT.puts("\n    The SCHED_DS_REQUIREMENTS contains an attribute that is no longer used: VCENTER_CLUSTER\n")
                STDOUT.puts("    Please replace VCENTER_CLUSTER with VCENTER_ONE_HOST_ID and change the name of the cluster with the host ID from the following list:\n")
                hpool.each do |host|
                    STDOUT.puts("    - VCENTER_ONE_HOST_ID: #{host["ID"]} for VCENTER_CLUSTER: #{host["NAME"]}")
                end
                STDOUT.puts("    Your current expression is: #{sched_ds_req} ")
                STDOUT.puts("    e.g if it contains VCENTER_CLUSTER=\\\"DemoCluster\\\" it should be changed to VCENTER_ONE_HOST_ID=0")
                STDOUT.print("\n    Insert your new SCHED_DS_REQUIREMENTS expression: ")
                sched_ds_req = STDIN.gets.strip
                xml_template.xpath("SCHED_DS_REQUIREMENTS").remove
                xml_template.add_child(xml_doc.create_element("SCHED_DS_REQUIREMENTS")).add_child(Nokogiri::XML::CDATA.new(xml_doc,"\"#{sched_ds_req}\""))
            end

            #Write template to file
            xml_doc = xml_doc.root.to_s.gsub(/>\s*/, ">").gsub(/\s*</, "<")
            File.open("#{TEMP_DIR}/one_migrate_template_#{template_id}","w"){|f| f.puts(xml_doc)}
            STDOUT.puts "--- New XML file #{TEMP_DIR}/one_migrate_template_#{template_id} for template #{template_name} was created and old attributes were removed\n"
            STDOUT.puts
        rescue Exception => e
            raise e
        ensure
            vi_client.vim.close if vi_client
        end
    end
end

################################################################################
def existing_vms_task(vc_vmachines, vc_templates, vc_clusters, vmpool, ipool, tpool, vnpool, dspool, hpool, one_client)
    vms = vmpool.retrieve_xmlelements("VM[USER_TEMPLATE/PUBLIC_CLOUD/TYPE=\"vcenter\"]")

    vms.each do |vm|
        next if !vm["DEPLOY_ID"] # Ignore undeployed vms

        begin

            # Refresh pools
            rc = vnpool.info
            raise "\n    ERROR! Could not update vnpool. Reason #{rc.message}" if OpenNebula.is_error?(rc)
            rc = ipool.info
            raise "\n    ERROR! Could not update ipool. Reason #{rc.message}" if OpenNebula.is_error?(rc)
            rc = dspool.info
            raise "\n    ERROR! Could not update dspool. Reason #{rc.message}" if OpenNebula.is_error?(rc)

            # Find vcenter VM in vc_vmachines
            vm_name = vm["NAME"]
            vm_id   = vm["ID"]

            # Get cluster's MOREF and name
            host_id = vm["HISTORY_RECORDS/HISTORY[last()]/HID"]
            host     = OpenNebula::Host.new_with_id(host_id, one_client)
            rc       = host.info
            raise "\n    ERROR! Could not get image info for wild vm disk. Reason #{rc.message}" if OpenNebula.is_error?(rc)
            ccr_name = host["NAME"]
            ccr_ref  = host["TEMPLATE/VCENTER_CCR_REF"]
            if !ccr_ref
                raise "VM #{vm_name} could not be updated, cannot find cluster's MOREF"
            end

            # Create vi_client
            vi_client    = VCenterDriver::VIClient.new(host_id)
            vcenter_uuid = vi_client.vim.serviceContent.about.instanceUuid
            vcenter_name = vi_client.host

            # Is VM a wild?
            vm_wild = vm["TEMPLATE/IMPORTED"] == "YES"

            vc_vmachine = nil
            vm_ref = nil
            vc_vmachine_object = nil
            machines_found = vc_vmachines[vcenter_uuid].select do |ref, value|
                value["config.uuid"] == vm["DEPLOY_ID"]
            end

            if machines_found.size == 0
                STDOUT.put "VM #{vm_name} could not be migrated we cannot find vcenter info for this VM"
                next
            end

            if machines_found.size > 1
                vm_refs   = []
                vm_values = []
                index = 0
                STDOUT.puts("WARNING: Manual intervention required!")
                STDOUT.puts("\nWe could not determine the reference for VM #{vm_name}\n")
                STDOUT.puts

                vc_vmachines[vcenter_uuid].each do |ref, v|
                    if v["config.uuid"] == vm["DEPLOY_ID"]
                        item = RbVmomi::VIM::VirtualMachine.new(vi_client.vim, ref)
                        while !item.instance_of? RbVmomi::VIM::Datacenter
                            item = item.parent
                            if item.nil?
                                raise "Could not find the Datacenter for the host"
                            end
                        end
                        datacenter = item

                        vm_refs   << ref
                        vm_values << v
                        STDOUT.puts("##{index+1}: VM #{v["name"]} in Datacenter #{datacenter.name}")
                        index += 1
                    end
                end

                loop do
                    STDOUT.print("\nFrom the list above, please pick up one number in order to specify the right VM: ")
                    vm_index = STDIN.gets.strip.to_i
                    next if vm_index == 0 || vm_index - 1 < 0 || vm_index - 1 > vm_refs.size
                    vm_ref  = vm_refs[vm_index-1] rescue nil
                    vc_vmachine = vm_values[vm_index-1] rescue nil
                    vc_vmachine_object = RbVmomi::VIM::VirtualMachine.new(vi_client.vim, vm_ref)
                    break if vm_ref
                end
            else
                vc_vmachines[vcenter_uuid].each do |ref, value|
                    if value["config.uuid"] == vm["DEPLOY_ID"]
                        vc_vmachine = value
                        vc_vmachine_object = RbVmomi::VIM::VirtualMachine.new(vi_client.vim, ref)
                        vm_ref = ref
                        break
                    end
                end
            end

            if vm_wild
                template_ref = vm_ref
            else
                template_ref = vm["USER_TEMPLATE/PUBLIC_CLOUD/VCENTER_REF"]

                if template_ref
                    templates_found = vc_templates[vcenter_uuid].select do |ref, value|
                        template_ref == ref
                    end

                    if templates_found.size != 1
                        template_ref = nil
                    end
                end

                if !template_ref
                    STDOUT.puts("WARNING: Manual intervention required!")
                    STDOUT.puts("\nWe could not determine the template reference associate to VM #{vm_name}\n")
                    STDOUT.puts
                    index = 0
                    template_refs  = []

                    vc_templates[vcenter_uuid].each do |ref, t|
                        item = RbVmomi::VIM::VirtualMachine.new(vi_client.vim, ref)

                        folders = []
                        while !item.instance_of? RbVmomi::VIM::Datacenter
                            item = item.parent
                            folders << item.name if !item.instance_of? RbVmomi::VIM::Datacenter
                            if item.nil?
                                raise "Could not find the Datacenter for the host"
                            end
                        end
                        datacenter = item
                        location   = folders.reverse.join("/")

                        template_refs << ref
                        STDOUT.puts("##{index+1}: Template #{t["name"]} in Datacenter #{datacenter.name} Location: #{location}")
                        index += 1
                    end

                    STDOUT.puts("##{template_refs.size+1}: None of the above.")

                    loop do
                        STDOUT.print("\nFrom the list above, please pick up one number in order to specify the venter template that this VM was based on: ")
                        template_index = STDIN.gets.strip.to_i
                        next if template_index == 0 || template_index - 1 < 0 || template_index - 1 > template_refs.size + 1
                        template_ref  = template_refs[template_index-1] rescue nil
                        break
                    end
                end

                STDOUT.puts
            end

            # Get VM's datacenter name
            dc = get_dc(vc_vmachine_object)
            dc_name = dc.name

            # Get xml template from tmp with unmanaged disks and nics and new attributes
            template_id       = vm["TEMPLATE/TEMPLATE_ID"]
            template_xml      = nil
            if !vm_wild
                template_filename = "#{TEMP_DIR}/one_migrate_template_#{template_id}"
                if File.exist?("#{template_filename}")
                    template_content = File.read(template_filename, "r")
                    template_xml = Nokogiri::XML(template_content, nil, "UTF-8"){|c| c.default_xml.noblanks}
                end
            end

            # Create a Nokogiri XML representing the VM's template
            xml_doc = Nokogiri::XML(vm.to_xml, nil, "UTF-8"){|c| c.default_xml.noblanks}

            # Replace VM's deploy_id uuid with moref
            xml_deploy_id  = xml_doc.root.at_xpath("DEPLOY_ID")
            xml_deploy_id.content = vc_vmachine_object._ref
            STDOUT.puts "VM #{vm_name}:"
            STDOUT.puts "--- DEPLOY_ID has been changed to #{vc_vmachine_object._ref}"

            # Retrieve and remove disks and nics from vm
            existing_disks = xml_doc.root.xpath("TEMPLATE/DISK").remove # Retrieve and remove existing disks
            existing_nics  = xml_doc.root.xpath("TEMPLATE/NIC").remove  # Retrieve and remove existing nics

            # Discover existing disks and/or nics
            extraconfig = vm_unmanaged_discover(vc_vmachine["config.hardware.device"],
                                                xml_doc,
                                                template_xml,
                                                existing_disks,
                                                existing_nics,
                                                ccr_name,
                                                ccr_ref,
                                                vcenter_name,
                                                vcenter_uuid,
                                                dc_name,
                                                ipool,
                                                vnpool,
                                                dspool,
                                                hpool,
                                                one_client,
                                                vi_client,
                                                vm_wild,
                                                vm_id,
                                                vm_name,
                                                vc_templates[vcenter_uuid],
                                                vm_ref,
                                                vc_vmachines[vcenter_uuid],
                                                template_ref)

            # If VM has TOKEN=YES for CONTEXT we must generate a token.txt file from
            # the variable openebula.token or try to extract it from context

            if vm["TEMPLATE/CONTEXT/TOKEN"] == "YES"
                STDOUT.puts
                STDOUT.puts "VM #{vm_name} generating token.txt..."
                onegate_token = vc_vmachine["config.extraConfig"].select{|val| val[:key]=="opennebula.token"}.first.value rescue nil

                # For older versions try to extract if from context inside VM
                if !onegate_token
                    context = vc_vmachine["config.extraConfig"].select{|val| val[:key]=="guestinfo.opennebula.context"}.first.value rescue nil
                    if context
                        onegate_token = Base64.decode64(context).split("\n").select{|line| line.start_with?("ONEGATE_TOKEN")}.first[/ONEGATE_TOKEN='(.*?)'/,1] rescue nil
                    end
                end
                STDOUT.put "--- Could not extract token from vcenter vm or context section" if !onegate_token
                File.open("/var/lib/one/vms/#{vm_id}/token.txt",'w'){|f| f.puts(onegate_token)}
            end

            # Add opennebula.disk elements to vcenter VM so unmanaged disks are referenced
            spec = {}
            spec[:extraConfig]  = extraconfig if !extraconfig.empty?
            vc_vmachine_object.ReconfigVM_Task(:spec => spec).wait_for_completion

            STDOUT.puts
        rescue Exception => e
            raise e
        ensure
            vi_client.vim.close if vi_client
        end
    end
end

################################################################################
# Pre-migrator tool                                                            #
################################################################################

CommandParser::CmdParser.new(ARGV) do
    usage "`onevcenter_migrator` [<options>]"
    description ""
    version OpenNebulaHelper::ONE_VERSION

    helper=OpenNebulaHelper::OneHelper.new

    before_proc do
        helper.set_client(options)
    end

    cmd_options=CommandParser::OPTIONS-[CommandParser::VERBOSE]
    set :option, cmd_options+OpenNebulaHelper::CLIENT_OPTIONS

    option CommandParser::OPTIONS

    main do
        begin
            # Initializa opennebula client
            one_client = OpenNebula::Client.new()
            vcenter_instances = []

            hpool = OpenNebula::HostPool.new(one_client)
            rc = hpool.info
            raise "Error contacting OpenNebula #{rc.message}" if OpenNebula.is_error?(rc)

            vc_clusters = {}
            vc_datastores = {}
            vc_networks = {}
            vc_vmachines = {}
            vc_templates = {}

            STDOUT.puts
            STDOUT.puts "Inventory objects are being retrieved for each vcenter instance to be migrated, please be patient..."
            STDOUT.puts

            hpool.each do |host|
                if host['VM_MAD'] != "vcenter"
                    next
                end

                vi_client = VCenterDriver::VIClient.new(host["ID"])
                vcenter_uuid = vi_client.vim.serviceContent.about.instanceUuid
                if vcenter_instances.include?(vcenter_uuid)
                    vi_client.vim.close
                    next
                end
                vcenter_instances << vcenter_uuid
                # Retrieve vCenter Managed Objects
                vc_clusters[vcenter_uuid]   = retrieve_vcenter_clusters(vi_client)
                vc_datastores[vcenter_uuid] = retrieve_vcenter_datastores(vi_client)
                vc_networks[vcenter_uuid]   = retrieve_vcenter_networks(vi_client)
                vc_vmachines[vcenter_uuid], vc_templates[vcenter_uuid]   = retrieve_vcenter_vms(vi_client)
                STDOUT.puts "--- vcenter #{host["TEMPLATE/VCENTER_HOST"]} has been processed!"
            end

            STDOUT.puts
            STDOUT.puts "All objects have been retrieved, thanks for your patience"

            # Control what objects id have been modified
            vcenter_ids = {}
            vcenter_ids[:host]  = []
            vcenter_ids[:ds]    = []
            vcenter_ids[:vnet]  = []
            vcenter_ids[:image] = []

            banner " Add new attributes to existing hosts", true
            add_new_host_attrs(vc_clusters, hpool, one_client, vcenter_ids)

            dspool = OpenNebula::DatastorePool.new(one_client)
            rc = dspool.info
            raise "Error contacting OpenNebula #{rc.message}" if OpenNebula.is_error?(rc)

            hpool.info #Update host pool to get new attributes
            banner " Add new attributes to existing datastores\n Create SYSTEM datastores...", true
            add_new_ds_attrs(vc_datastores, vc_clusters, dspool, hpool, one_client, vcenter_ids)

            vnpool = OpenNebula::VirtualNetworkPool.new(one_client)
            rc = vnpool.info
            raise "Error contacting OpenNebula #{rc.message}" if OpenNebula.is_error?(rc)

            banner " Add new attributes to existing vnets", true
            add_new_vnet_attrs(vc_networks, vc_clusters, vnpool, hpool, one_client, vcenter_ids)

            ipool = OpenNebula::ImagePool.new(one_client)
            rc = ipool.info
            raise "Error contacting OpenNebula #{rc.message}" if OpenNebula.is_error?(rc)

            banner " Add new attributes to existing images", true
            add_new_image_attrs(ipool, hpool, one_client, vcenter_ids)

            tpool = OpenNebula::TemplatePool.new(one_client)
            rc = tpool.info
            raise "Error contacting OpenNebula #{rc.message}" if OpenNebula.is_error?(rc)

            banner " Add new attributes to existing templates\n Discovering nics and disks inside templates", true
            add_new_template_attrs(vc_templates, vc_clusters, tpool, ipool, vnpool, dspool, hpool, one_client)

            vmpool = OpenNebula::VirtualMachinePool.new(one_client)
            rc = vmpool.info
            raise "Error contacting OpenNebula #{rc.message}" if OpenNebula.is_error?(rc)

            banner " Migrating existing VMs", true
            existing_vms_task(vc_vmachines, vc_templates, vc_clusters, vmpool, ipool, tpool, vnpool, dspool, hpool, one_client)

            if !vcenter_ids[:host].empty?
                banner " Remove old attributes from hosts", true
                remove_host_attrs(vcenter_ids[:host], one_client)
            end

            if !vcenter_ids[:ds].empty?
                banner " Remove old attributes from datastores", true
                remove_ds_attrs(vcenter_ids[:ds], one_client)
            end

            if !vcenter_ids[:vnet].empty?
                banner " Remove old attributes from vnets", true
                remove_vnet_attrs(vcenter_ids[:vnet], one_client)
            end

            if !vcenter_ids[:image].empty?
                banner " Remove old attributes from images", true
                remove_image_attrs(vcenter_ids[:image], one_client)
            end

            puts ""

            exit_code 0
        rescue Exception => e
            STDERR.puts "An error occurred when pre-migrating OpenNebula:\n"\
                        "#{e.message}\"\n#{e.backtrace}"
            exit -1
        end
    end
end
