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

ONE_LOCATION = ENV['ONE_LOCATION']

if !ONE_LOCATION
    RUBY_LIB_LOCATION = '/usr/lib/one/ruby'
    GEMS_LOCATION     = '/usr/share/one/gems'
    REMOTES_LOCATION  = '/var/lib/one/remotes/'
else
    RUBY_LIB_LOCATION = ONE_LOCATION + '/lib/ruby'
    GEMS_LOCATION     = ONE_LOCATION + '/share/gems'
    REMOTES_LOCATION  = ONE_LOCATION + '/var/remotes/'
end

# %%RUBYGEMS_SETUP_BEGIN%%
if File.directory?(GEMS_LOCATION)
    real_gems_path = File.realpath(GEMS_LOCATION)
    if !defined?(Gem) || Gem.path != [real_gems_path]
        $LOAD_PATH.reject! {|l| l =~ /vendor_ruby/ }

        # Suppress warnings from Rubygems
        # https://github.com/OpenNebula/one/issues/5379
        begin
            verb = $VERBOSE
            $VERBOSE = nil
            require 'rubygems'
            Gem.use_paths(real_gems_path)
        ensure
            $VERBOSE = verb
        end
    end
end
# %%RUBYGEMS_SETUP_END%%

$LOAD_PATH << RUBY_LIB_LOCATION
$LOAD_PATH << RUBY_LIB_LOCATION + '/cli'
$LOAD_PATH << REMOTES_LOCATION + 'vmm/vcenter/'

require 'fileutils'

require 'command_parser'
require 'one_helper/onehost_helper'
require 'one_helper/onecluster_helper'
require 'vcenter_driver'
require 'opennebula'
require 'digest/md5'

TEMP_DIR="/var/tmp/vcenter_one54"

FileUtils.mkdir_p TEMP_DIR

def banner(msg, header=false, extended=nil)
    STDOUT.puts
    STDOUT.puts if !header
    STDOUT.puts "="*80
    STDOUT.puts msg
    STDOUT.puts "-"*80 if extended
    STDOUT.puts extended if extended
    STDOUT.puts "="*80
end

def logo_banner(msg, header=false)

    STDOUT.puts
    STDOUT.puts if !header
    STDOUT.puts "="*80
    STDOUT.puts " / _ \\ _ __   ___ _ __ | \\ | | ___| |__  _   _| | __ _"
    STDOUT.puts "| | | | '_ \\ / _ \\ '_ \\|  \\| |/ _ \\ '_ \\| | | | |/ _` |"
    STDOUT.puts "| |_| | |_) |  __/ | | | |\\  |  __/ |_) | |_| | | (_| |"
    STDOUT.puts " \\___/| .__/ \\___|_| |_|_| \\_|\\___|_.__/ \\__,_|_|\\__,_|"
    STDOUT.puts "      |_|"
    STDOUT.puts "-"*80
    STDOUT.puts msg
    STDOUT.puts "="*80
end

def get_md5(string)
    md5 = Digest::MD5.new
    md5.update(string.to_s)
    md5.hexdigest[0..4]
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

def get_image_size(ds, img_str_escaped)
    ds_name = ds.name

    img_str = img_str_escaped.gsub("%20", " ")

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
    rescue Exception => e
        raise "Could not find file #{img_path}.\n{e.message}"
    end

    raise "Could not get file size or capacity" if size.nil?
    size
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
    create_cdata_element(disk, xml_doc, "CLONE_TARGET", "SYSTEM")
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

def create_nic(xml_doc, network, mac_address, cluster_id, nic_index, ar_id = nil)
    xml_template   = xml_doc.root.at_xpath("TEMPLATE")
    nic = xml_template.add_child(xml_doc.create_element("NIC"))
    create_cdata_element(nic, xml_doc, "BRIDGE", "#{network["BRIDGE"]}")
    create_cdata_element(nic, xml_doc, "CLUSTER_ID", "#{cluster_id}")
    create_cdata_element(nic, xml_doc, "MAC", "#{mac_address}")
    create_cdata_element(nic, xml_doc, "NETWORK", "#{network["NAME"]}")
    create_cdata_element(nic, xml_doc, "NETWORK_ID", "#{network["ID"]}")
    create_cdata_element(nic, xml_doc, "NIC_ID", "#{nic_index}")
    create_cdata_element(nic, xml_doc, "AR_ID", "#{ar_id}") if ar_id
    create_cdata_element(nic, xml_doc, "OPENNEBULA_MANAGED", "NO")
    create_cdata_element(nic, xml_doc, "SECURITY_GROUPS", "0")
    create_cdata_element(nic, xml_doc, "VCENTER_CCR_REF", "#{network["TEMPLATE/VCENTER_CCR_REF"]}")
    create_cdata_element(nic, xml_doc, "VCENTER_INSTANCE_ID", "#{network["TEMPLATE/VCENTER_INSTANCE_ID"]}")
    create_cdata_element(nic, xml_doc, "VCENTER_NET_REF", "#{network["TEMPLATE/VCENTER_NET_REF"]}")
    create_cdata_element(nic, xml_doc, "VCENTER_PORTGROUP_TYPE", "#{network["TEMPLATE/VCENTER_PORTGROUP_TYPE"]}")
    create_cdata_element(nic, xml_doc, "VN_MAD", "dummy")
end

def create_image_ds(ds_name, ds_ref, vcenter_name, vcenter_uuid, ccr_name, dc_name, dc_ref, one_client, vcenter_user, vcenter_pass, vcenter_host, cluster_id=nil)
    image_ds_name = "#{ds_name}"
    template  = ""
    template  << "NAME=\"#{image_ds_name}\"\n"
    template  << "TM_MAD=vcenter\n"
    template  << "VCENTER_INSTANCE_ID=\"#{vcenter_uuid}\"\n"
    template  << "VCENTER_DS_REF=\"#{ds_ref}\"\n"
    template  << "VCENTER_DC_REF=\"#{dc_ref}\"\n"
    template  << "VCENTER_DS_NAME=\"#{ds_name}\"\n"
    template  << "VCENTER_DC_NAME=\"#{dc_name}\"\n"
    template  << "VCENTER_CLUSTER=\"#{ccr_name}\"\n"
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

def create_system_ds(ds_name, ds_ref, vcenter_name, vcenter_uuid, dc_name, dc_ref, one_client, vcenter_host, vcenter_user, vcenter_pass, cluster_id=nil)
    system_ds_name = "#{ds_name} (SYS)"
    template  = ""
    template  << "NAME=\"#{system_ds_name}\"\n"
    template  << "TM_MAD=vcenter\n"
    template  << "VCENTER_INSTANCE_ID=\"#{vcenter_uuid}\"\n"
    template  << "VCENTER_DC_REF=\"#{dc_ref}\"\n"
    template  << "VCENTER_DC_NAME=\"#{dc_name}\"\n"
    template  << "VCENTER_DS_REF=\"#{ds_ref}\"\n"
    template  << "VCENTER_DS_NAME=\"#{ds_name}\"\n"
    template  << "VCENTER_USER=\"#{vcenter_user}\"\n" if vcenter_user
    template  << "VCENTER_PASSWORD=\"#{vcenter_pass}\"\n" if vcenter_pass
    template  << "VCENTER_HOST=\"#{vcenter_host}\"\n" if vcenter_host
    template  << "TYPE=SYSTEM_DS\n"

    one_ds = OpenNebula::Datastore.new(OpenNebula::Datastore.build_xml, one_client)
    if cluster_id
        rc = one_ds.allocate(template, cluster_id.to_i)
    else
        rc = one_ds.allocate(template)
    end
    raise rc.message if OpenNebula.is_error?(rc)

    one_ds.info
    rc = one_ds.info
    raise rc.message if OpenNebula.is_error?(rc)

    STDOUT.puts "Datastore \e[96m#{ds_name}\e[39m is now also a SYSTEM datastore with ID: #{one_ds["ID"]}\n"
    one_ds
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

def find_cluster_by_name(cpool, name)
    element = cpool.select do |e|
        e["NAME"] == name
    end.first rescue nil

    return element
end

def find_datastore(dspool, ds_ref, dc_ref, vcenter_uuid, type)
    element = dspool.select do |e|
        e["TEMPLATE/TYPE"]                == type &&
        e["TEMPLATE/VCENTER_DS_REF"]      == ds_ref &&
        e["TEMPLATE/VCENTER_DC_REF"]      == dc_ref &&
        e["TEMPLATE/VCENTER_INSTANCE_ID"] == vcenter_uuid
    end.first rescue nil

    return element
end

def find_network(vnpool, net_ref, ccr_ref, template_ref, vcenter_uuid)
    element = vnpool.select do |e|
        e["TEMPLATE/VCENTER_NET_REF"]      == net_ref &&
        e["TEMPLATE/VCENTER_INSTANCE_ID"]  == vcenter_uuid &&
        e["TEMPLATE/OPENNEBULA_MANAGED"]   != "NO"
    end.first rescue nil

    return element
end

def find_network_by_name(vnpool, name)
    element = vnpool.select do |e|
        e["NAME"] == name
    end.first rescue nil

    return element
end

def find_network_by_bridge(vnpool, name)
    element = vnpool.select do |e|
        e["BRIDGE"] == name
    end.first rescue nil

    return element
end

def find_network_ar(vnet, mac)
    mac_int = mac.delete(":").to_i(16)
    vnet.retrieve_xmlelements("AR_POOL/AR").each do |ar|
        ar_id = ar["AR_ID"]
        mac_start = ar["MAC"]
        size = ar["SIZE"].to_i

        mac_start_int = mac_start.delete(":").to_i(16)
        mac_end_int = mac_start_int + size

        return ar_id if mac_int >= mac_start_int && mac_int < mac_end_int
    end

    false
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

def vm_unmanaged_discover(devices, xml_doc, template_xml,
                          existing_disks, existing_nics, ccr_name, ccr_ref,
                          vcenter_name, vcenter_uuid, vcenter_user, vcenter_pass, vcenter_host,
                          dc_name, dc_ref, ipool, vnpool, dspool, hpool,
                          one_client, vi_client, vm_wild, vm_id, vm_name, vc_templates,
                          vm_ref, vc_vmachines, template_ref, one_clusters, vcenter_ids)
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

    # Get cluster's host ID
    hosts = hpool.retrieve_xmlelements("HOST[NAME=\"#{ccr_name}\"]")
    if hosts.empty?
        raise "Cannot find cluster's host ID associated with this template."
    end
    host_id = hosts.first["ID"]

    if !one_clusters.key?(host_id)
        raise "Could not find the OpenNebula cluster ID that is going to be associated to images and networks found in the template."
    end

    cluster_id = one_clusters[host_id]

    devices.each do |device|
        rc = vnpool.info_all
        raise "\n    ERROR! Could not update vnpool. Reason #{rc.message}" if OpenNebula.is_error?(rc)

        rc = ipool.info_all
        raise "\n    ERROR! Could not update ipool. Reason #{rc.message}" if OpenNebula.is_error?(rc)

        rc = dspool.info
        raise "\n    ERROR! Could not update dspool. Reason #{rc.message}" if OpenNebula.is_error?(rc)

        if defined?(RbVmomi::VIM::VirtualIDEController) &&
           device.is_a?(RbVmomi::VIM::VirtualIDEController)
            ide_controlled += device.device
            next
        end

        if defined?(RbVmomi::VIM::VirtualSATAController) &&
           device.is_a?(RbVmomi::VIM::VirtualSATAController)
            sata_controlled += device.device
            next
        end

        if defined?(RbVmomi::VIM::VirtualSCSIController) &&
           device.is_a?(RbVmomi::VIM::VirtualSCSIController)
            scsi_controlled += device.device
            next
        end

        #cluster_id = xml_doc.root.xpath("HISTORY_RECORDS/HISTORY[last()]/CID").text

        # If CDROM
        if !(device.class.ancestors.index(RbVmomi::VIM::VirtualCdrom)).nil?
            device_backing_datastore = device.backing.datastore rescue nil
            if device_backing_datastore
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

            md5        = get_md5("#{ds_name}#{image_path}")
            image_name = "#{file_name} - #{ds_name} - #{md5}"

            image_path_escaped = image_path.gsub(" ", "%20")

            #Check if the image already exists
            one_image = find_image(ipool, ds_name, image_path_escaped)

            if !one_image
                #Check if the IMAGE DS is there
                ds = find_datastore(dspool, ds_ref, dc_ref, vcenter_uuid, "IMAGE_DS")

                #Create IMAGE and SYSTEM DS if datastore is not found
                if !ds
                    ds = create_image_ds(ds_name, ds_ref, vcenter_name, vcenter_uuid, ccr_name, dc_name, dc_ref, one_client, vcenter_user, vcenter_pass, vcenter_host, cluster_id)

                    create_system_ds(ds_name, ds_ref, vcenter_name, vcenter_uuid, dc_name, dc_ref, one_client, vcenter_user, vcenter_pass, vcenter_host, cluster_id)
                end

                ds_id = ds["ID"].to_i

                if vm_wild || !template_xml
                    #Create images for unmanaged disks

                    image_size = get_image_size(RbVmomi::VIM::Datastore.new(vi_client.vim, ds_ref), image_path_escaped)

                    template = ""
                    template << "NAME=\"#{image_name}\"\n"
                    template << "SOURCE=\"#{image_path_escaped}\"\n"
                    template << "TYPE=\"#{image_type}\"\n"
                    template << "PERSISTENT=\"NO\"\n"
                    template << "VCENTER_IMPORTED=\"YES\"\n"
                    template << "DEV_PREFIX=\"#{image_prefix}\"\n"
                    template << "SIZE=\"#{image_size}\"\n"

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

                    vcenter_ids[:image] << one_image["ID"]

                    STDOUT.puts "--- Image #{one_image["NAME"]} with ID #{one_image["ID"]} has been created"
                else
                    template_disk = template_xml.xpath("VMTEMPLATE/TEMPLATE/DISK")[unmanaged_disk_index] rescue nil
                    raise "Cannot find unmanaged disk inside template" if !template_disk

                    image_id = template_disk.xpath("IMAGE_ID").text
                    raise "Cannot find image id for unmanaged disk" if image_id.empty?

                    one_image = OpenNebula::Image.new_with_id(image_id, one_client)
                    rc = one_image.info
                    raise "\n    ERROR! Could not get image info for unmanaged disk. image_id '#{image_id}'. Reason #{rc.message}" if OpenNebula.is_error?(rc)

                    ds_id = one_image['DATASTORE_ID']
                    ds = OpenNebula::Datastore.new_with_id(ds_id, one_client)
                    rc = ds.info
                    raise "\n    ERROR! Could not get ds info. Reason #{rc.message}" if OpenNebula.is_error?(rc)

                    ds_ref = ds["TEMPLATE/VCENTER_DS_REF"]
                    ds_name = ds["NAME"]

                    STDOUT.puts "--- Image #{one_image["NAME"]} with ID #{one_image["ID"]} already exists"
                end

                # Create unmanaged disk element for vm template
                # Get disk size (capacity)
                image_name   = one_image["NAME"]
                image_source = one_image["SOURCE"]
                image_id     = one_image["ID"]

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
                    ds = find_datastore(dspool, ds_ref, dc_ref, vcenter_uuid, "IMAGE_DS")

                    #Create IMAGE and SYSTEM DS if datastore is not found
                    if !ds
                        ds = create_image_ds(ds_name, ds_ref, vcenter_name, vcenter_uuid, ccr_name, dc_name, dc_ref, one_client, vcenter_user, vcenter_pass, vcenter_host, cluster_id)

                        create_system_ds(ds_name, ds_ref, vcenter_name, vcenter_uuid, dc_name, dc_ref, one_client, vcenter_user, vcenter_pass, vcenter_host, cluster_id)
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
                    xml_template  = xml_doc.root.at_xpath("TEMPLATE")
                    existing_disk = existing_disks[managed_disk_index]

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


             # Let's find out if it is a standard or distributed network
             # If distributed, it needs to be instantitaed from the ref
             if device.backing.is_a? RbVmomi::VIM::VirtualEthernetCardDistributedVirtualPortBackingInfo
                 if device.backing.port.portKey.match(/^[a-z]+-\d+$/)
                     dist_ref = device.backing.port.portKey
                 elsif device.backing.port.portgroupKey.match(/^[a-z]+-\d+$/)
                     dist_ref = device.backing.port.portgroupKey
                 else
                     raise "Cannot get hold of Network for device #{device}"
                 end
                 dist_network   = RbVmomi::VIM::Network.new(vi_client.vim, dist_ref)

                 network_ref    = dist_network._ref
                 network_bridge = dist_network.name
                 network_type   = "Distributed Port Group"
             else
                 network_bridge = device.backing.network.name
                 network_ref    = device.backing.network._ref
                 network_type   = "Port Group"
             end

            network_name   = "#{network_bridge} [#{vcenter_name}]"

            # Create network if doesn't exist
            if vm_wild
                #network = find_network_by_name(vnpool, network_name)
                network = find_network_by_bridge(vnpool, network_bridge)
            else
                network = find_network(vnpool, network_ref, ccr_ref, template_ref, vcenter_uuid)
            end

            mac_address = device.macAddress rescue nil
            ar_id = nil

            # network not found
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

                if vm_wild
                    ar_size = 1
                    one_net << "OPENNEBULA_MANAGED=\"NO\"\n"
                    one_net << "VCENTER_FROM_WILD=\"#{vm_id}\"\n"
                else
                    ar_size = 255
                end

                one_net << "AR=[\n"

                if vm_wild && mac_address
                    one_net << "MAC=\"#{mac_address}\",\n"
                end

                one_net << "TYPE=\"ETHER\",\n"
                one_net << "SIZE=\"#{ar_size}\"\n"

                one_net << "]\n"

                one_vn = OpenNebula::VirtualNetwork.new(OpenNebula::VirtualNetwork.build_xml, one_client)
                rc = one_vn.allocate(one_net, cluster_id.to_i)
                raise "\n    ERROR! Could not create vnet for vm #{vm_name}. Reason #{rc.message}" if OpenNebula.is_error?(rc)

                rc = one_vn.info
                raise "\n    ERROR! Could not get network info for vnet #{network_name}. Reason #{rc.message}" if OpenNebula.is_error?(rc)
                network = one_vn
                STDOUT.puts "--- Network #{one_vn["NAME"]} with ID #{one_vn["ID"]} has been created"
            # network found:
            else

                STDOUT.puts "--- Network #{network["NAME"]} with ID #{network["ID"]} already exists"

                ar_id = find_network_ar(network, mac_address)

                if !ar_id
                    one_ar = "AR = [\n"
                    one_ar << %Q(  MAC="#{mac_address}",\n)
                    one_ar << %Q(  TYPE="ETHER",\n")
                    one_ar << %Q(  SIZE="1"\n)
                    one_ar << "]\n"

                    rc = network.add_ar(one_ar)

                    if OpenNebula.is_error?(rc)
                        STDERR.puts "ERROR! Could not create AR for VM #{vm_name}, VNET #{network["ID"]}, " <<
                            "message: #{rc.message}"
                    else
                        network.info
                        ar_id = find_network_ar(network, mac_address)
                    end
                end
            end

            existing_macs = []
            existing_nics.xpath("MAC").each do |mac|
                existing_macs << mac.text
            end

            if !existing_macs.include?(mac_address)
                # Unmanaged nic
                create_nic(xml_doc, network, mac_address, cluster_id, nic_index, ar_id)

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

    # Remove SCHED_DS_REQUIREMENTS
    xml_user_template.xpath("SCHED_DS_REQUIREMENTS").remove

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
                vc_system_ds = vc_vmachines[vm_ref]["datastore"].first rescue nil
                raise "Could not find Datastore associated with the VM" if vc_system_ds.nil?

                ds_ref = vc_system_ds._ref

                ds = find_datastore(dspool, ds_ref, dc_ref, vcenter_uuid, "SYSTEM_DS")
                if !ds
                    ds_name = vc_system_ds.name
                    ds = create_system_ds(ds_name, ds_ref, vcenter_name, vcenter_uuid, dc_name, dc_ref, one_client, vcenter_user, vcenter_pass, vcenter_host, cluster_id)
                end
                ds_id = ds["ID"]
            end
        else
            if !vc_templates.key? template_ref
                raise "Could not find vcenter template using ref #{template_ref} in order to assign a datastore"
            else
                ds_ref = vc_templates[template_ref]["datastore"].first._ref rescue nil
                raise "Could not get ds ref in order to assign a datastore in history records" if !ds_ref

                ds = find_datastore(dspool, ds_ref, dc_ref, vcenter_uuid, "SYSTEM_DS")
                ds_id = ds["ID"]
            end
        end
    end

    # Remove some attributes
    xml_user_template.xpath("VCENTER_DATASTORE").remove
    xml_user_template.xpath("USER_INPUTS/VCENTER_DATASTORE").remove
    xml_user_template.xpath("SCHED_REQUIREMENTS").remove

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
    STDOUT.puts
    STDOUT.puts "--- New XML file #{TEMP_DIR}/one_migrate_vm_#{vm_id} for vm \e[96m#{vm_name}\e[39m \e[92mwas created and attributes were removed\e[39m\n"

    return extraconfig
end

def template_unmanaged_discover(devices, ccr_name, ccr_ref,
                                vcenter_name, vcenter_uuid,
                                vcenter_user, vcenter_pass, vcenter_host,
                                dc_name, dc_ref, ipool, vnpool, dspool, hpool,
                                one_client,
                                template_ref, template_name, template_id,
                                one_clusters, vcenter_ids, vi_client)
    unmanaged = {}
    unmanaged[:images] = []
    unmanaged[:networks] = []

    ide_controlled  = []
    sata_controlled = []
    scsi_controlled = []

    # Get cluster's host ID
    hosts = hpool.retrieve_xmlelements("HOST[NAME=\"#{ccr_name}\"]")
    if hosts.empty?
        raise "Cannot find cluster's host ID associated with this template."
    end
    host_id = hosts.first["ID"]

    if !one_clusters.key?(host_id)
        raise "Could not find the OpenNebula cluster ID that is going to be associated to images and networks found in the template."
    end

    cluster_id = one_clusters[host_id]

    # Loop through devices
    devices.each do |device|
        rc = vnpool.info_all
        raise "\n    ERROR! Could not update vnpool. Reason #{rc.message}" if OpenNebula.is_error?(rc)

        rc = ipool.info_all
        raise "\n    ERROR! Could not update ipool. Reason #{rc.message}" if OpenNebula.is_error?(rc)

        rc = dspool.info
        raise "\n    ERROR! Could not update dspool. Reason #{rc.message}" if OpenNebula.is_error?(rc)

        if defined?(RbVmomi::VIM::VirtualIDEController) &&
           device.is_a?(RbVmomi::VIM::VirtualIDEController)
            ide_controlled += device.device
            next
        end

        if defined?(RbVmomi::VIM::VirtualSATAController) &&
           device.is_a?(RbVmomi::VIM::VirtualSATAController)
            sata_controlled += device.device
            next
        end

        if defined?(RbVmomi::VIM::VirtualSCSIController) &&
            device.is_a?(RbVmomi::VIM::VirtualSCSIController)
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
            image_name    = "#{file_name} - #{ds_name} [Template #{template_id}]"

            image_path_escaped = image_path.gsub(" ", "%20")

            #Check if the image has already been imported
            image = find_image(ipool, ds_name, image_path_escaped)

            #Check if the IMAGE DS is there
            ds = find_datastore(dspool, ds_ref, dc_ref, vcenter_uuid, "IMAGE_DS")

            #Create IMAGE and SYSTEM DS if datastore is not found
            if ds.nil?
                ds = create_image_ds(ds_name, ds_ref, vcenter_name, vcenter_uuid, ccr_name, dc_name, dc_ref, one_client, vcenter_user, vcenter_pass, vcenter_host, cluster_id)

                create_system_ds(ds_name, ds_ref, vcenter_name, vcenter_uuid, dc_name, dc_ref, one_client, vcenter_user, vcenter_pass, vcenter_host, cluster_id)
            end

            if !image

                image_size = get_image_size(RbVmomi::VIM::Datastore.new(vi_client.vim, ds_ref), image_path_escaped)

                template_pool = OpenNebula::TemplatePool.new(one_client)
                template_pool.info(-1, template_id.to_i, template_id.to_i)

                #get owner
                uid_image = template_pool["/VMTEMPLATE_POOL/VMTEMPLATE/UID"]
                gid_image = template_pool["/VMTEMPLATE_POOL/VMTEMPLATE/GID"]

		        #get permissions
                owu_image = template_pool["/VMTEMPLATE_POOL/VMTEMPLATE/PERMISSIONS/OWNER_U"]
                owm_image = template_pool["/VMTEMPLATE_POOL/VMTEMPLATE/PERMISSIONS/OWNER_M"]
                owa_image = template_pool["/VMTEMPLATE_POOL/VMTEMPLATE/PERMISSIONS/OWNER_A"]
                gu_image = template_pool["/VMTEMPLATE_POOL/VMTEMPLATE/PERMISSIONS/GROUP_U"]
                gm_image = template_pool["/VMTEMPLATE_POOL/VMTEMPLATE/PERMISSIONS/GROUP_M"]
                ga_image = template_pool["/VMTEMPLATE_POOL/VMTEMPLATE/PERMISSIONS/GROUP_A"]
                ou_image = template_pool["/VMTEMPLATE_POOL/VMTEMPLATE/PERMISSIONS/OTHER_U"]
                om_image = template_pool["/VMTEMPLATE_POOL/VMTEMPLATE/PERMISSIONS/OTHER_M"]
                oa_image = template_pool["/VMTEMPLATE_POOL/VMTEMPLATE/PERMISSIONS/OTHER_A"]

                #Create image
                one_image = ""
                one_image << "NAME=\"#{image_name}\"\n"
                one_image << "SOURCE=\"#{image_path_escaped}\"\n"
                one_image << "TYPE=\"#{image_type}\"\n"
                one_image << "PERSISTENT=\"NO\"\n"
                one_image << "VCENTER_IMPORTED=\"YES\"\n"
                one_image << "DEV_PREFIX=\"#{image_prefix}\"\n"
                one_image << "SIZE=\"#{image_size}\"\n"

                one_i = OpenNebula::Image.new(OpenNebula::Image.build_xml, one_client)
                rc = one_i.allocate(one_image, ds["ID"].to_i)
                raise "\n    ERROR! Could not create image for template #{template_name}. Reason #{rc.message}" if OpenNebula.is_error?(rc)

                rc = one_i.chown(uid_image.to_i, gid_image.to_i)
                raise "\n    ERROR! Could not set the owner for image #{image_name}. Reason #{rc.message}" if OpenNebula.is_error?(rc)

                rc = one_i.chmod(owu_image.to_i, owm_image.to_i, owa_image.to_i, gu_image.to_i, gm_image.to_i, ga_image.to_i, ou_image.to_i, om_image.to_i, oa_image.to_i)
                raise "\n    ERROR! Could not set the permissions for image #{image_name}. Reason #{rc.message}" if OpenNebula.is_error?(rc)

                rc = one_i.info
                raise "\n    ERROR! Could not get image info for template #{template_name}. Reason #{rc.message}" if OpenNebula.is_error?(rc)
                STDOUT.puts "--- Image #{one_i["NAME"]} with ID #{one_i["ID"]} has been created"
                unmanaged[:images] << one_i["ID"]

                vcenter_ids[:image] << one_i["ID"]
            else
                unmanaged[:images] << image["ID"]
                STDOUT.puts "--- Image #{image["NAME"]} with ID #{image["ID"]} already exists"
            end
        end

        # If VirtualEthernetCard
        if !device.class.ancestors.index(RbVmomi::VIM::VirtualEthernetCard).nil?


             # Let's find out if it is a standard or distributed network
             # If distributed, it needs to be instantitaed from the ref
             if device.backing.is_a? RbVmomi::VIM::VirtualEthernetCardDistributedVirtualPortBackingInfo
                 if device.backing.port.portKey.match(/^[a-z]+-\d+$/)
                     dist_ref = device.backing.port.portKey
                 elsif device.backing.port.portgroupKey.match(/^[a-z]+-\d+$/)
                     dist_ref = device.backing.port.portgroupKey
                 else
                     raise "Cannot get hold of Network for device #{device}"
                 end
                 dist_network   = RbVmomi::VIM::Network.new(vi_client.vim, dist_ref)

                 network_ref    = dist_network._ref
                 network_bridge = dist_network.name
                 network_type   = "Distributed Port Group"
             else
                 network_bridge = device.backing.network.name
                 network_ref    = device.backing.network._ref
                 network_type   = "Port Group"
             end

            network_name   = "#{network_bridge} [#{template_name} - Template #{template_id}]"
            network        = find_network(vnpool, network_ref, ccr_ref, template_ref, vcenter_uuid)

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
                one_net << "AR=[\n"
                one_net << "TYPE=\"ETHER\",\n"
                one_net << "SIZE=\"255\"\n"
                one_net << "]\n"

                one_vn = OpenNebula::VirtualNetwork.new(OpenNebula::VirtualNetwork.build_xml, one_client)
                rc = one_vn.allocate(one_net, cluster_id.to_i)
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
    STDOUT.puts("\n\e[93mWARNING: Manual intervention required!\e[39m")
    STDOUT.puts("\nWhich vCenter cluster is represented by OpenNebula \e[96mhost #{ccr_name}?\e[39m\n")
    STDOUT.puts
    index = 0
    ccr_refs = []
    vc_clusters.each do |ref, ccr|
        if ccr_name == ccr["name"]
            item = RbVmomi::VIM::ClusterComputeResource.new(vi_client.vim, ref)

            folders = []
            while !item.instance_of? RbVmomi::VIM::Datacenter
                item = item.parent
                if !item.instance_of?(RbVmomi::VIM::Datacenter)
                    if item.name != "host"
                        folders << item.name
                    else
                        folders << ""
                    end
                end
                if item.nil?
                    raise "Could not find the Datacenter for the host"
                end
            end
            datacenter = item
            location   = folders.reverse.join("/")
            location = "/" if location.empty?

            ccr_refs << ref
            STDOUT.puts("#{index+1}: #{ccr["name"]} found in #{datacenter.name} datacenter at #{location}")
            index += 1
        end
    end

    loop do
        STDOUT.print("\nFrom the list above, please \e[95mpick a number\e[39m in order to specify the cluster: ")
        cluster_index = STDIN.gets.strip.to_i
        next if cluster_index == 0 || cluster_index - 1 < 0 || cluster_index - 1 > ccr_refs.size
        ccr_ref  = ccr_refs[cluster_index-1] rescue nil
        break if ccr_ref
    end

    STDOUT.puts
    STDOUT.puts("-" * 80)

    ccr_ref
end

################################################################################
def add_new_host_attrs(vc_clusters, hpool, one_client, vcenter_ids)

    # Get all hosts from pool with VM_MAD=vcenter
    hosts = hpool.retrieve_xmlelements("HOST[VM_MAD=\"vcenter\"]")

    hosts.each do |host|
        begin
            # Get OpenNebula host and prepare variables
            one_host        = OpenNebula::Host.new_with_id(host["ID"], one_client) 
            rc              = one_host.info
            raise rc.message if OpenNebula.is_error?(rc)
            ccr_name = host["NAME"]
            ccr_ref  = nil
            vi_client       = VCenterDriver::VIClient.new(host["ID"]) rescue next
            vcenter_uuid    = vi_client.vim.serviceContent.about.instanceUuid
            vcenter_version = vi_client.vim.serviceContent.about.apiVersion

            # We try to obtain the Host's moref from vCenter objects
            clusters_with_name = vc_clusters[vcenter_uuid].select {|ref, ccr| ccr["name"] == ccr_name}

            # If we cannot obtain the moref we raise an exception
            if clusters_with_name.size == 0
                raise "Host #{ccr_name} could not be updated, cannot find cluster's MOREF"
            end

            # If only one moref is found we assign the ref, if many results are
            # found the administrator must select if from a list
            if clusters_with_name.size == 1
                ccr_ref = clusters_with_name.keys.first
            else
                ccr_ref = select_cluster(vc_clusters[vcenter_uuid], ccr_name, vi_client)
            end

            # The host's template is updated with the new attributes
            template = ""
            template << "VCENTER_CCR_REF=\"#{ccr_ref}\"\n"
            template << "VCENTER_INSTANCE_ID=\"#{vcenter_uuid}\"\n"
            template << "VCENTER_VERSION=\"#{vcenter_version}\""
            rc = one_host.update(template, true)
            raise "Host #{ccr_name} could not be updated. Reason #{rc.message}" if OpenNebula.is_error?(rc)
            STDOUT.puts "\nHost \e[96m#{ccr_name}\e[39m got new attributes:\n"
            STDOUT.puts
            STDOUT.puts "--- VCENTER_CCR_REF=#{ccr_ref}\n"
            STDOUT.puts "--- VCENTER_INSTANCE_ID=#{vcenter_uuid}\n"
            STDOUT.puts "--- VCENTER_VERSION=#{vcenter_version}\n"
            STDOUT.puts
            STDOUT.puts "-" * 80
            STDOUT.puts

            # We track what hosts have been modified so we can create
            # XML templates later
            vcenter_ids[:host] << one_host["ID"]

        rescue Exception => e
            raise e
        ensure
            vi_client.vim.close if vi_client
        end
    end
end

################################################################################
def create_new_clusters(vc_clusters, hpool, cpool, one_client)

    clusters = {}

    # Delete existing files from a previous script launch
    ##if File.exist?("#{TEMP_DIR}/one_migrate_clusters_ids")
    ##    File.delete("#{TEMP_DIR}/one_migrate_clusters_ids")
    ##end

    # Get all hosts from pool with VN_MAD="vcenter"
    hosts = hpool.retrieve_xmlelements("HOST[VM_MAD=\"vcenter\"]")

    hosts.each do |host|
        begin

            # Get OpenNebula host and assign variables
            one_host  = OpenNebula::Host.new_with_id(host["ID"], one_client)
            rc   = one_host.info
            raise rc.message if OpenNebula.is_error?(rc)
            vi_client       = VCenterDriver::VIClient.new(host["ID"]) rescue next
            vcenter_uuid    = vi_client.vim.serviceContent.about.instanceUuid
            ccr_name = host["NAME"]

            # Check if we find the moref for the vCenter cluster
            clusters_with_name = vc_clusters[vcenter_uuid].select {|ref, ccr| ccr["name"] == ccr_name}

            if clusters_with_name.size == 0
                raise "Host #{ccr_name} could not be updated, cannot find cluster's MOREF"
            end

            # Check if host is assigned to a non default cluster
            if host["CLUSTER_ID"] == "0"

                # Check if there's an OpenNebula cluster with the host's name
                one_cluster = find_cluster_by_name(cpool, ccr_name)
                if !one_cluster

                    # If the cluster doesn't exits we create a new cluster
                    one_cluster = OpenNebula::Cluster.new(OpenNebula::Cluster.build_xml, one_client)
                    rc = one_cluster.allocate(ccr_name)
                    if OpenNebula.is_error?(rc)
                        STDOUT.puts "    Error creating OpenNebula cluster you should create a cluster by hand with name #{ccr_name} before you upgrade OpenNebula: #{rc.message}\n"
                        next
                    end
                    # We inform that the Cluster has been created
                    STDOUT.puts "OpenNebula Cluster named #{ccr_name} \e[92mhas been created.\e[39m"
                    STDOUT.puts

                    # Fetch the cluster info
                    rc = one_cluster.info
                    if OpenNebula.is_error?(rc)
                        STDOUT.puts "    Error Getting information from cluster '#{ccr_name}'. Reason: #{rc.message}\n"
                        next
                    end
                else
                    STDOUT.puts "OpenNebula Cluster #{ccr_name} \e[92malready exists.\e[39m"
                    STDOUT.puts
                end

                # Write what cluster ID will be associated to what host ID: host_id:cluster_id
                ##File.open("#{TEMP_DIR}/one_migrate_clusters_ids","a"){|f| f.puts("#{host["ID"]}:#{one_cluster["ID"]}")}

                # Store in memory the same information
                clusters[host["ID"]] = one_cluster["ID"]

            else
                # Write existing cluster ID
                STDOUT.puts "OpenNebula Cluster #{host["CLUSTER_ID"]} \e[92malready contains Host #{ccr_name}.\e[39m"
                ##File.open("#{TEMP_DIR}/one_migrate_clusters_ids","a"){|f| f.puts("#{host["ID"]}:#{host["CLUSTER_ID"]}")}

                clusters[host["ID"]] = host["CLUSTER_ID"]
            end

        rescue Exception => e
            raise e
        ensure
            vi_client.vim.close if vi_client
        end
    end

    return clusters
end

################################################################################
def prepare_host_xml_templates(host_ids, one_clusters, one_client)
    host_ids.each do |host_id|
        # Create XML removing old attributes
        one_host = OpenNebula::Host.new_with_id(host_id, one_client)
        raise rc.message if OpenNebula.is_error?(one_host)
        rc   = one_host.info
        raise rc.message if OpenNebula.is_error?(rc)

        # Let's see in which OpenNebula cluster we have to group this host
        if !one_clusters.key?(host_id)
            raise "Could not find the OpenNebula cluster ID that is going to be associated to host ID: #{host_id}"
        end
        cluster_id = one_clusters[host_id]

        one_cluster = OpenNebula::Cluster.new_with_id(cluster_id, one_client)
        raise rc.message if OpenNebula.is_error?(one_cluster)
        rc   = one_cluster.info
        raise rc.message if OpenNebula.is_error?(rc)

        # We remove old attributes
        xml_doc = Nokogiri::XML(one_host.to_xml, nil, "UTF-8"){|c| c.default_xml.noblanks}
        xml_doc.root.xpath("TEMPLATE/PUBLIC_CLOUD").remove
        xml_doc.root.xpath("TEMPLATE/VCENTER_DATASTORE").remove
        xml_doc.root.xpath("TEMPLATE/RESOURCE_POOL").remove

        # We have to assign the host to the right cluster
        xml_cluster_id  = xml_doc.root.at_xpath("CLUSTER_ID")
        xml_cluster_id.content = cluster_id
        xml_cluster  = xml_doc.root.at_xpath("CLUSTER")
        xml_cluster.content = one_cluster["NAME"]

        STDOUT.puts
        STDOUT.puts "New XML file #{TEMP_DIR}/one_migrate_host_#{host_id} for host \e[96m#{one_host["NAME"]}\e[39m \e[92mwas created and attributes were removed\e[39m\n"
        File.open("#{TEMP_DIR}/one_migrate_host_#{host_id}","w"){|f| f.puts(xml_doc.root.to_s.gsub(/>\s*/, ">").gsub(/\s*</, "<"))}
    end
end

################################################################################
def inspect_datastores(vc_datastores, vc_clusters, one_clusters, dspool, hpool, one_client, vcenter_ids)

    # Retrive datastores with TM_MAD="vcenter"
    datastores = dspool.retrieve_xmlelements("DATASTORE[TM_MAD=\"vcenter\"]")

    # Remove previous system datastores created earlier by this script to
    # avoid conflicts. Only those without VCENTER_CLUSTER attribute are removed
    datastores.each do |datastore|
        if datastore["TEMPLATE/TYPE"] == "SYSTEM_DS" && datastore["TEMPLATE/VCENTER_CLUSTER"].nil?
            one_ds  = OpenNebula::Datastore.new_with_id(datastore["ID"], one_client)
            one_ds.delete
        end
    end

    STDOUT.puts

    # Refresh dspool and retrieve datastores again
    rc = dspool.info
    raise "Datastore pool info could not be retrieved. Reason #{rc.message}" if OpenNebula.is_error?(rc)

    # Inspect existing vcenter datastores
    datastores = dspool.retrieve_xmlelements("DATASTORE[TM_MAD=\"vcenter\"]")
    datastores.each do |datastore|
        begin
            # Get OpenNebula datastore and retrieve variables
            ds_id   = datastore["ID"]
            one_ds  = OpenNebula::Datastore.new_with_id(datastore["ID"], one_client)
            rc      = one_ds.info
            raise rc.message if OpenNebula.is_error?(rc)
            ds_name = one_ds["NAME"]
            ccr_name = one_ds["TEMPLATE/VCENTER_CLUSTER"]
            next if !ccr_name # If VCENTER_CLUSTER doesn't exist it's not usable

            # Get cluster's host from its name stored in VCENTER_CLUSTER
            hosts = hpool.retrieve_xmlelements("HOST[NAME=\"#{ccr_name}\"]")
            if hosts.empty?
                STDERR.puts "Could not find OpenNebula host associated to VCENTER_CLUSTER #{ccr_name}. Not updating datastore #{ds_name}."
                next
            end

            # Check if host already has the ccr moref
            ccr_ref = hosts.first["TEMPLATE/VCENTER_CCR_REF"]
            if ccr_ref.nil?
                raise "Datastore #{ds_name} could not be updated, cannot find cluster's MOREF"
            end

            # Get OpenNebula host's id and create a Rbvmomi connection
            host_id = hosts.first["ID"]
            vi_client       = VCenterDriver::VIClient.new(host_id) rescue next
            vcenter_uuid    = vi_client.vim.serviceContent.about.instanceUuid
            vcenter_name    = vi_client.host

            # Datastores require now vcenter credentials
            vcenter_user = hosts.first["TEMPLATE/VCENTER_USER"]
            vcenter_pass = hosts.first["TEMPLATE/VCENTER_PASSWORD"]
            vcenter_host = hosts.first["TEMPLATE/VCENTER_HOST"]

            # Check if we can find the datastore in objects retrieved from vCenter
            datastores_with_name = vc_datastores[vcenter_uuid].select {|ref, ds| ds["name"] == ds_name}
            if datastores_with_name.empty?
                raise "Could not find datastore in vcenter by its name #{ds_name}"
            end

            ds_ref  = nil
            ds_type = nil
            dc_ref  = nil
            dc_name = nil

            # If we find only one vCenter datastore for that name we assign it
            # otherwise the administrator should select one from the list
            # We need to extract the datacenter ref and name as they are now
            # required attributes.
            if datastores_with_name.size == 1
                vc_datastores[vcenter_uuid].each do |ref, ds|
                    if ds["name"] == ds_name
                        ds_ref = ref
                        ds_type = ds[:ds_type]

                        item = nil
                        # Check if Datastore is a StoragePod
                        if ds[:ds_type] == "Datastore"
                            item = RbVmomi::VIM::Datastore.new(vi_client.vim, ref)
                        else
                            item = RbVmomi::VIM::StoragePod.new(vi_client.vim, ref)
                        end

                        # We try to get the datacenter object where this datastore is located
                        while !item.instance_of? RbVmomi::VIM::Datacenter
                            item = item.parent
                            if item.nil?
                                raise "Could not find the Datacenter for the datastore"
                            end
                        end
                        dc_ref  = item._ref
                        dc_name = item.name
                        break
                    end
                end
            else
                # Select the datastore from a list of possible matches
                STDOUT.puts("\n\e[93mWARNING: Manual intervention required!\e[39m")
                STDOUT.puts("\nWhich vCenter datastore is represented by OpenNebula \e[96mdatastore #{ds_name}?\n\e[39m")
                STDOUT.puts
                index = 0
                ds_info  = []
                vc_datastores[vcenter_uuid].each do |ref, ds|
                    if ds_name == ds["name"]
                        # Discriminate if it's a datastore or a Storage Pod
                        if ds[:ds_type] == "Datastore"
                            item = RbVmomi::VIM::Datastore.new(vi_client.vim, ref)
                        else
                            item = RbVmomi::VIM::StoragePod.new(vi_client.vim, ref)
                        end
                        # We need the datacenter
                        while !item.instance_of? RbVmomi::VIM::Datacenter
                            item = item.parent
                            if item.nil?
                                raise "Could not find the Datacenter for the datastore"
                            end
                        end
                        datacenter = item

                        # Prepare a hash with the information we need
                        info = {}
                        info[:ref]     = ref
                        info[:ds_type] = ds[:ds_type]
                        info[:dc_name] = datacenter.name
                        info[:dc_ref] = datacenter._ref
                        ds_info << info
                        STDOUT.puts("#{index+1}: Datastore #{ds["name"]} in #{datacenter.name}")
                        index += 1
                    end
                end

                # Loop until the admin user chooses the right datastore
                loop do
                    STDOUT.print("\nFrom the list above, please \e[95mpick one number\e[39m in order to specify the datastore: ")
                    ds_index = STDIN.gets.strip.to_i
                    next if ds_index == 0 || ds_index - 1 < 0 || ds_index - 1 > ds_info.size
                    ds_ref  = ds_info[ds_index-1][:ref] rescue nil
                    ds_type = ds_info[ds_index-1][:ds_type] rescue nil
                    dc_name = ds_info[ds_index-1][:dc_name] rescue nil
                    dc_ref  = ds_info[ds_index-1][:dc_ref] rescue nil
                    break if ds_ref
                end

                STDOUT.puts
                STDOUT.puts("-" * 80)
                STDOUT.puts
            end

            # Raise and exception if we cannot find the datastore's moref
            if ds_ref.nil?
                raise "Datastore #{ds_name} could not be updated, cannot find datastore's MOREF"
            end

            # Prepare new datastore attributes
            template = ""
            template << "VCENTER_DS_REF=\"#{ds_ref}\"\n"
            template << "VCENTER_DS_NAME=\"#{ds_name}\"\n"
            template << "VCENTER_DC_REF=\"#{dc_ref}\"\n"
            template << "VCENTER_DC_NAME=\"#{dc_name}\"\n"
            template << "VCENTER_HOST=\"#{vcenter_host}\"\n"
            template << "VCENTER_USER=\"#{vcenter_user}\"\n"
            template << "VCENTER_PASSWORD=\"#{vcenter_pass}\"\n"
            template << "VCENTER_INSTANCE_ID=\"#{vcenter_uuid}\"\n"

            # Update the template
            rc = one_ds.update(template, true)
            raise "Datastore #{ds_name} could not be updated. Reason #{rc.message}" if OpenNebula.is_error?(rc)

            # Inform what attributes have been added
            STDOUT.puts "Datastore \e[96m#{ds_name}\e[39m got new attributes:\n"
            STDOUT.puts
            STDOUT.puts "--- VCENTER_DS_REF=\"#{ds_ref}\"\n"
            STDOUT.puts "--- VCENTER_DS_NAME=\"#{ds_name}\"\n"
            STDOUT.puts "--- VCENTER_DC_REF=\"#{dc_ref}\"\n"
            STDOUT.puts "--- VCENTER_DC_NAME=\"#{dc_name}\"\n"
            STDOUT.puts "--- VCENTER_HOST=\"#{vcenter_host}\"\n"
            STDOUT.puts "--- VCENTER_USER=\"#{vcenter_user}\"\n"
            STDOUT.puts "--- VCENTER_PASSWORD=\"#{vcenter_pass}\"\n"
            STDOUT.puts "--- VCENTER_INSTANCE_ID=\"#{vcenter_uuid}\"\n"

            STDOUT.puts

            # Update datastore information
            rc = one_ds.info
            raise "Datastore info #{ds_name} could not be retrieved. Reason #{rc.message}" if OpenNebula.is_error?(rc)

            # Let's see in which OpenNebula cluster we have to group this datastore
            if !one_clusters.key?(host_id)
                raise "Could not find the OpenNebula cluster ID that is going to be associated to host ID: #{host_id}"
            end
            cluster_id = one_clusters[host_id]

            # Add IMAGE datastore to OpenNebula cluster if it hasn't been assigned previously
            cluster_ids = one_ds.retrieve_xmlelements("CLUSTERS")
            found_cluster_ids = cluster_ids.select { |cluster| cluster["ID"] == cluster_id }
            if found_cluster_ids.empty?
                one_cluster  = OpenNebula::Cluster.new_with_id(cluster_id, one_client)
                rc = one_cluster.adddatastore(ds_id.to_i)
                if OpenNebula.is_error?(rc)
                    raise "Datastore #{ds_name} could not be assigned to cluster ID: #{cluster_id} you should assign this datastore to that cluster by hand once this script finishes. Reason #{rc.message}"
                else
                    STDOUT.puts "Datastore \e[96m#{ds_name}\e[39m has been assigned to cluster ID: #{cluster_id}."
                    STDOUT.puts
                end
            end

            # Check if SYSTEM datastore was not created before
            # and create SYSTEM_DS associated to the existing IMAGE_DS and add it
            # to the right OpenNebula cluster
            if ds_type == "Datastore"
                create_system_ds(ds_name, ds_ref, vcenter_name, vcenter_uuid, dc_name, dc_ref, one_client, vcenter_host, vcenter_user, vcenter_pass, cluster_id)
            end

            STDOUT.puts
            STDOUT.puts "-" * 80
            STDOUT.puts

            # We track what datastores have been modified so we can create
            # XML templates later
            vcenter_ids[:ds] << one_ds["ID"]

        rescue Exception => e
            raise e
        ensure
            vi_client.vim.close if vi_client
        end
    end
end

################################################################################
def prepare_ds_xml_templates(ds_ids, one_client)

    ds_ids.each do |ds_id|
        # Create XML removing old attributes
        one_ds = OpenNebula::Datastore.new_with_id(ds_id, one_client)
        rc   = one_ds.info
        raise rc.message if OpenNebula.is_error?(rc)
        xml_doc = Nokogiri::XML(one_ds.to_xml, nil, "UTF-8"){|c| c.default_xml.noblanks}
        xml_doc.root.xpath("TEMPLATE/VCENTER_CLUSTER").remove

        # Replace CLONE_TARGET from NONE to SYSTEM
        xml_template = xml_doc.root.at_xpath("TEMPLATE")
        clone_target = xml_template.xpath("CLONE_TARGET").text
        if !clone_target.empty?
            xml_template.xpath("CLONE_TARGET").remove
            xml_template.add_child(xml_doc.create_element("CLONE_TARGET")).add_child(Nokogiri::XML::CDATA.new(xml_doc,"SYSTEM"))
        end

        File.open("#{TEMP_DIR}/one_migrate_ds_#{one_ds["ID"]}","w"){|f| f.puts(xml_doc.root.to_s.gsub(/>\s*/, ">").gsub(/\s*</, "<"))}
        STDOUT.puts
        STDOUT.puts "New XML file #{TEMP_DIR}/one_migrate_ds_#{one_ds["ID"]} for datastore \e[96m#{one_ds["NAME"]}\e[39m \e[92mwas created and attributes were removed\e[39m\n"
    end
end

################################################################################
def inspect_networks(vc_networks, vc_clusters, one_clusters, vnpool, hpool, one_client, vcenter_ids)

    # Retrive virtual networks that have the VCENTER_TYPE attribute
    vnets = vnpool.retrieve_xmlelements("VNET[TEMPLATE/VCENTER_TYPE=\"Port Group\" or TEMPLATE/VCENTER_TYPE=\"Distributed Port Group\"]")

    # For each port group...
    vnets.each do |vnet|

        begin
            # Get OpenNebula's virtual network and retrieve some variables
            one_vnet = OpenNebula::VirtualNetwork.new_with_id(vnet["ID"], one_client)
            rc   = one_vnet.info
            raise rc.message if OpenNebula.is_error?(rc)
            vnet_id      = vnet["ID"]
            vnet_name    = vnet["NAME"]
            vnet_bridge  = vnet["TEMPLATE/BRIDGE"]
            vnet_pg_type = vnet["TEMPLATE/VCENTER_TYPE"]

            # Try to get cluster associated to this network from imported name
            # OpenNebula creates a vnet name with portgroup name - cluster name
            ccr_name = vnet_name.split(" - ")[-1] rescue nil

            # Let's see if we can find the cluster name from the vnet name
            if ccr_name
                hosts = hpool.retrieve_xmlelements("HOST[NAME=\"#{ccr_name}\"]")
                ccr_name = nil if hosts.empty?
            end

            # If cluster name could not be determined, user action required
            # The administrator must choose what cluster is associate with the vnet
            if !ccr_name
                STDOUT.puts("\n\e[93mWARNING: Manual intervention required!\e[39m")
                STDOUT.puts("\nWhich vCenter cluster is associated with OpenNebula \e[96mvnet #{vnet_name}?\n\e[39m")

                ccr_names = []
                hpool.each_with_index do |host, index|
                    STDOUT.puts("#{index+1}: #{host["NAME"]} in #{host["TEMPLATE/VCENTER_HOST"]}")
                    ccr_names << host["NAME"]
                end

                STDOUT.puts("#{ccr_names.size+1}: None of the above.")

                loop do
                    STDOUT.print("\nFrom the list above, please pick one number in order to specify the cluster: ")
                    cluster_index = STDIN.gets.strip.to_i
                    next if cluster_index == 0 || cluster_index - 1 < 0 || cluster_index - 1 > ccr_names.size+1
                    ccr_name  = ccr_names[cluster_index-1] rescue nil
                    break
                end

                STDOUT.puts
                STDOUT.puts("-" * 80)
                STDOUT.puts
            end

            # If we could not determine what cluster name is associated to the network
            # raise an exception.
            if !ccr_name
                raise "We could not find the host name associated to vnet #{vnet_name}\n"\
                      "You may have to import the vCenter cluster using the onevcenter tool."
            end

            # Get cluster's ccr ref and host id from its name
            hosts = hpool.retrieve_xmlelements("HOST[NAME=\"#{ccr_name}\"]")
            ccr_ref = hosts.first["TEMPLATE/VCENTER_CCR_REF"]
            if ccr_ref.nil?
                raise "Vnet #{vnet_name} could not be updated, cannot find cluster's MOREF"
            end
            host_id      = hosts.first["ID"]
            vi_client    = VCenterDriver::VIClient.new(host_id)
            vcenter_uuid = vi_client.vim.serviceContent.about.instanceUuid

            # Get vnet MOREF from vcenter info and the port group's name
            vnets_with_name = vc_networks[vcenter_uuid].select {|ref, net| net["name"] == vnet_bridge}
            if vnets_with_name.empty?
                raise "Could not find vnet in vcenter by its name #{vnet_name}"
            end

            # Check how many refs we've found for that port group name
            vnet_ref  = nil

            if vnets_with_name.size == 1
                vnet_ref = vnets_with_name.keys.first
            else
                # If there are many possible morefs the admin must select one from a list
                STDOUT.puts("\n\e[93mWARNING: Manual intervention required!\e[39m")
                STDOUT.puts("\nWhich vCenter port group is represented by OpenNebula \e[96mvnet #{vnet_name}?\e[39m\n")
                STDOUT.puts
                index = 0
                vnet_refs  = []
                vc_networks[vcenter_uuid].each do |ref, net|
                    if net["name"] == vnet_bridge
                        item = RbVmomi::VIM::Network.new(vi_client.vim, ref)

                        # We need the datatacenter info associated to the port group
                        while !item.instance_of? RbVmomi::VIM::Datacenter
                            item = item.parent
                            if item.nil?
                                raise "Could not find the Datacenter for the datastore"
                            end
                        end
                        datacenter = item

                        vnet_refs << ref
                        STDOUT.puts("#{index+1}: Virtual Network #{vnet_name} in #{datacenter.name}")
                        index += 1
                    end
                end

                # Loop until the administrator selects a vnet
                loop do
                    STDOUT.print("\nFrom the list above, please \e[95mpick one number\e[39m in order to specify the vnet: ")
                    vnet_index = STDIN.gets.strip.to_i
                    next if vnet_index == 0 || vnet_index - 1 < 0 || vnet_index - 1 > vnet_refs.size
                    vnet_ref  = vnet_refs[vnet_index-1] rescue nil
                    break if vnet_ref
                end

                STDOUT.puts
                STDOUT.puts("-" * 80)
            end

            STDOUT.puts

            raise "Vnet #{vnet_name} could not be updated, cannot find vnet's MOREF" if vnet_ref.nil?

            # Prepare vnet's template attributes
            template = ""
            template << "VCENTER_NET_REF=\"#{vnet_ref}\"\n"
            template << "VCENTER_INSTANCE_ID=\"#{vcenter_uuid}\"\n"
            template << "VCENTER_PORTGROUP_TYPE=\"#{vnet_pg_type}\"\n"
            template << "VCENTER_CCR_REF=\"#{ccr_ref}\"\n"

            # Try to update the vnet template
            rc = one_vnet.update(template, true)
            raise "Vnet #{vnet_name} could not be updated. Reason #{rc.message}" if OpenNebula.is_error?(rc)

            # Inform what attributes have been added
            STDOUT.puts "\nVnet \e[96m#{vnet_name}\e[39m got new attributes:\n"
            STDOUT.puts "--- VCENTER_NET_REF=#{vnet_ref}\n"
            STDOUT.puts "--- VCENTER_INSTANCE_ID=#{vcenter_uuid}\n"
            STDOUT.puts "--- VCENTER_PORTGROUP_TYPE=#{vnet_pg_type}\n"
            STDOUT.puts "--- VCENTER_CCR_REF=#{ccr_ref}\n"
            STDOUT.puts

            # Let's see in which OpenNebula cluster we have to group this vnet
            if !one_clusters.key?(host_id)
                raise "Could not find the OpenNebula cluster ID that is going to be associated to host ID: #{host_id}"
            end

            # Add vnet to OpenNebula cluster
            # Check if the vnet is already assigned to the right cluster
            cluster_id        = one_clusters[host_id]
            cluster_ids       = one_vnet.retrieve_xmlelements("CLUSTERS")
            found_cluster_ids = cluster_ids.select { |cluster| cluster["ID"] == cluster_id }

            if found_cluster_ids.empty?
                one_cluster  = OpenNebula::Cluster.new_with_id(cluster_id, one_client)
                rc = one_cluster.addvnet(vnet_id.to_i)
                if OpenNebula.is_error?(rc)
                    raise "Network #{vnet_name} could not be assigned to cluster ID: #{cluster_id} you should assign this virtual network to that cluster by hand once this script finishes. Reason #{rc.message}"
                else
                    STDOUT.puts "Vnet \e[96m#{vnet_name}\e[39m has been assigned to cluster ID: #{cluster_id}."
                end
            end

            STDOUT.puts
            STDOUT.puts "-" * 80
            STDOUT.puts

            # We track what vcenter_ids have been modified so we can create
            # XML templates later
            vcenter_ids[:vnet] << one_vnet["ID"]

        rescue Exception => e
            raise e
        ensure
            vi_client.vim.close if vi_client
        end
    end
end

################################################################################
def prepare_vnet_xml_templates(vnet_ids, one_client)
    vnet_ids.each do |vnet_id|
        # Create XML removing old attributes
        one_vnet = OpenNebula::VirtualNetwork.new_with_id(vnet_id, one_client)
        rc   = one_vnet.info
        raise rc.message if OpenNebula.is_error?(rc)
        xml_doc = Nokogiri::XML(one_vnet.to_xml, nil, "UTF-8"){|c| c.default_xml.noblanks}
        xml_doc.root.xpath("TEMPLATE/VCENTER_TYPE").remove
        xml_doc.root.xpath("AR_POOL/AR/USED_LEASES").remove

        xml_doc.search('.//MAC_END').remove
        xml_doc.search('.//LEASES').remove
        xml_doc.search('.//IP_END').remove
        xml_doc.search('.//IP6_ULA').remove
        xml_doc.search('.//IP6_ULA_END').remove
        xml_doc.search('.//IP6_GLOBAL').remove
        xml_doc.search('.//IP6_GLOBAL_END').remove


        File.open("#{TEMP_DIR}/one_migrate_vnet_#{vnet_id}","w"){|f| f.puts(xml_doc.root.to_s.gsub(/>\s*/, ">").gsub(/\s*</, "<"))}
        STDOUT.puts
        STDOUT.puts "New XML file #{TEMP_DIR}/one_migrate_vnet_#{vnet_id} for vnet \e[96m#{one_vnet["NAME"]}\e[39m \e[92mwas created and attributes were removed\e[39m\n"
    end
end

################################################################################
def add_new_image_attrs(ipool, one_client, vcenter_ids)

    # Retrieve images with VCENTER_IMPORTED="YES"
    imported_images = ipool.retrieve_xmlelements("IMAGE[TEMPLATE/VCENTER_IMPORTED=\"YES\"]")

    # Remove previous imported images so we regenerate them again
    imported_images.each do |image|
        one_image  = OpenNebula::Image.new_with_id(image["ID"], one_client)
        one_image.delete

        loop do
            rc = one_image.info
            break if OpenNebula.is_error?(rc)
        end
    end

    STDOUT.puts

    # Refresh pool
    rc = ipool.info_all
    raise "Error contacting OpenNebula #{rc.message}" if OpenNebula.is_error?(rc)

    # Loop through existing images
    ipool.each do |image|
        # Initialize some variables
        image_name = image["NAME"]
        template = ""
        adapter_type = nil
        disk_type    = nil

        # Get images
        one_image = OpenNebula::Image.new_with_id(image["ID"], one_client)
        rc   = one_image.info
        raise rc.message if OpenNebula.is_error?(rc)

        # Create VCENTER_ADAPTER_TYPE attribute
        adapter_type = one_image["TEMPLATE/ADAPTER_TYPE"]
        template << "VCENTER_ADAPTER_TYPE=\"#{adapter_type}\"\n" if adapter_type

        # Check if DISK_TYPE is one of those used by vcenter as this attribute
        # is shared with KVM images
        disk_type = one_image["TEMPLATE/DISK_TYPE"]
        disk_types = ["delta","eagerZeroedThick","flatMonolithic",
                      "preallocated","raw","rdm","rdmp","seSparse",
                      "sparse2Gb","sparseMonolithic","thick","thick2Gb","thin"]
        if disk_type && disk_types.include?(disk_type)
            template << "VCENTER_DISK_TYPE=\"#{disk_type}\"\n"
        end

        # Update image's template
        if !template.empty?
            rc = one_image.update(template, true)
            raise "Image #{image_name} could not be updated. Reason #{rc.message}" if OpenNebula.is_error?(rc)

            # Inform about what attributes have been added
            STDOUT.puts "\nImage \e[96m#{image_name}\e[39m got new attributes:\n"
            STDOUT.puts
            STDOUT.puts "--- VCENTER_DISK_TYPE=#{disk_type}\n"
            STDOUT.puts "--- VCENTER_ADAPTER_TYPE=#{adapter_type}\n"
            STDOUT.puts

            STDOUT.puts
            STDOUT.puts "-" * 80
            STDOUT.puts

            # We track what vcenter_ids have been modified so we can create
            # XML templates later
            vcenter_ids[:image] << one_image["ID"]
        end
    end
end

################################################################################
def prepare_image_xml_templates(image_ids, hpool, one_client)
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

            if image_source.nil? || image_source.empty?
                next
            end

            ds_ref  = one_ds["TEMPLATE/VCENTER_DS_REF"]

            # Get Datastore's cluster name
            ccr_name = one_ds["TEMPLATE/VCENTER_CLUSTER"]
            next if !ccr_name

            # Get cluster's host from its name
            hosts = hpool.retrieve_xmlelements("HOST[NAME=\"#{ccr_name}\"]")
            if hosts.empty?
                raise "Could not find OpenNebula host associated to VCENTER_CLUSTER"
            end
            host_id = hosts.first["ID"]

            vi_client = VCenterDriver::VIClient.new(host_id)
            disk_size = get_image_size(RbVmomi::VIM::Datastore.new(vi_client.vim, ds_ref), image_source) rescue nil

            if disk_size.nil?
                STDOUT.puts "Skip image #{one_image['ID']}. Not found in vCenter"
                next
            end

            xml_size  = xml_doc.root.at_xpath("SIZE")
            xml_size.content = disk_size

            File.open("#{TEMP_DIR}/one_migrate_image_#{image_id}","w"){|f| f.puts(xml_doc.root.to_s.gsub(/>\s*/, ">").gsub(/\s*</, "<"))}

            STDOUT.puts
            STDOUT.puts "New XML file #{TEMP_DIR}/one_migrate_image_#{image_id} for image \e[96m#{one_image["NAME"]}\e[39m \e[92mwas created and attributes were removed\e[39m\n"

        rescue Exception => e
            raise e
        ensure
            vi_client.vim.close if vi_client
        end
    end
end

################################################################################
def inspect_templates(vc_templates, vc_clusters, one_clusters, tpool, ipool, vnpool, dspool, hpool, one_client, vcenter_ids)
    # Retrieve all OpenNebula templates associated with PUBLIC_CLOUD=vcenter
    templates = tpool.retrieve_xmlelements("VMTEMPLATE[TEMPLATE/PUBLIC_CLOUD/TYPE=\"vcenter\"]")

    selected_templates = {}
    templates.each do |template|
        begin
            # Refresh pools
            rc = vnpool.info_all
            raise "\n    ERROR! Could not update vnpool. Reason #{rc.message}" if OpenNebula.is_error?(rc)
            rc = ipool.info_all
            raise "\n    ERROR! Could not update ipool. Reason #{rc.message}" if OpenNebula.is_error?(rc)
            rc = dspool.info
            raise "\n    ERROR! Could not update dspool. Reason #{rc.message}" if OpenNebula.is_error?(rc)

            # Get some variables
            ccr_ref      = nil
            vcenter_uuid = nil
            host_id      = nil

            template_name    = template["NAME"]
            template_uuid    = template["TEMPLATE/PUBLIC_CLOUD/VM_TEMPLATE"]
            template_ref     = template["TEMPLATE/PUBLIC_CLOUD/VCENTER_REF"]
            template_cluster = template["TEMPLATE/PUBLIC_CLOUD/HOST"]
            template_rp      = template["TEMPLATE/RESOURCE_POOL"]
            template_user_rp = template["TEMPLATE/USER_INPUTS/RESOURCE_POOL"]

            # Check if we can find what vCenter cluster is associated with the
            # Template
            if template_cluster
                # Does a host with the template host name exist?
                hosts = hpool.retrieve_xmlelements("HOST[NAME=\"#{template_cluster}\"]")
                if hosts.empty?
                    template_cluster = nil
                else
                    # Check if we can get the morefs from the OpenNebula host
                    ccr_ref      = hosts.first["TEMPLATE/VCENTER_CCR_REF"]
                    vcenter_uuid = hosts.first["TEMPLATE/VCENTER_INSTANCE_ID"]
                    host_id      = hosts.first["ID"]
                    vcenter_user = hosts.first["TEMPLATE/VCENTER_USER"]
                    vcenter_pass = hosts.first["TEMPLATE/VCENTER_PASSWORD"]
                    vcenter_host = hosts.first["TEMPLATE/VCENTER_HOST"]

                    template_cluster = nil if !ccr_ref || !vcenter_uuid
                end
            end

            # As we don't know which vCenter cluster is associated with the template
            # The administrator must select one from a list
            if !template_cluster
                hpool_vcenter = hpool.select{|h| h["VM_MAD"] == "vcenter"}

                if hpool_vcenter.count == 1
                    template_cluster = hpool_vcenter.first["NAME"]
                else
                    STDOUT.puts("\n\e[93mWARNING: Manual intervention required!\e[39m")
                    STDOUT.puts("\nWhich vCenter cluster is associated with OpenNebula \e[96mtemplate #{template_name}?\n\e[39m")
                    STDOUT.puts

                    ccr_names = []
                    hpool_vcenter.each_with_index do |host, index|
                        STDOUT.puts("#{index+1}: #{host["NAME"]} in #{host["TEMPLATE/VCENTER_HOST"]}")
                        ccr_names << host["NAME"]
                    end

                    STDOUT.puts("#{ccr_names.size+1}: None of the above.")

                    loop do
                        STDOUT.print("\nFrom the list above, please \e[95mpick one number\e[39m in order to specify the cluster: ")
                        cluster_index = STDIN.gets.strip.to_i
                        next if cluster_index == 0 || cluster_index - 1 < 0 || cluster_index > ccr_names.size+1
                        template_cluster  = ccr_names[cluster_index-1] rescue nil
                        break
                    end

                    STDOUT.puts
                    STDOUT.puts "-" * 80
                    STDOUT.puts
                end

                if !template_cluster
                    raise "We could not find the host name associated to template #{template_name}\n"\
                          "You may have to import the OpenNebula host first using onevcenter tool."
                end

                # Get host attributes from the name of the cluster associated
                # to the template
                hosts = hpool.retrieve_xmlelements("HOST[NAME=\"#{template_cluster}\"]")

                ccr_ref      = hosts.first["TEMPLATE/VCENTER_CCR_REF"]
                vcenter_uuid = hosts.first["TEMPLATE/VCENTER_INSTANCE_ID"]
                host_id      = hosts.first["ID"]
                vcenter_user = hosts.first["TEMPLATE/VCENTER_USER"]
                vcenter_pass = hosts.first["TEMPLATE/VCENTER_PASSWORD"]
                vcenter_host = hosts.first["TEMPLATE/VCENTER_HOST"]
            end

            if ccr_ref.nil? || vcenter_uuid.nil?
                raise "Template #{template_name} could not be updated, cannot find cluster's MOREF: '#{ccr_ref}'" \
                      ", or vcenter uuid: '#{vcenter_uuid}'. "
            end

            # Create Rbvmomi connection
            vi_client    = VCenterDriver::VIClient.new(host_id)
            vcenter_uuid = vi_client.vim.serviceContent.about.instanceUuid

            # We try to check if the template's moref found inside the XML template
            # is found in the templates retrieved from vcenter only once
            if template_ref

                templates_found = vc_templates[vcenter_uuid].select do |ref, value|
                    template_ref == ref
                end

                if templates_found.size != 1
                    template_ref = nil
                end
            end

            # Try to get moref using the templates uuid. Note that that uuid
            # is not unique
            templates_same_uuid = {}
            if !template_ref && template_uuid
                templates_found = 0
                vc_templates[vcenter_uuid].each do |ref, value|
                    if value["config.uuid"] == template_uuid
                        templates_found += 1
                        templates_same_uuid[ref] = value
                        if templates_found > 1
                            template_ref = nil
                        else
                            template_ref = ref
                        end
                    end
                end
            end

            # If we could not found the template moref the administrator has to help us
            if !template_ref
                STDOUT.puts("\n\e[93mWARNING: Manual intervention required!\e[39m")
                STDOUT.puts("\nWhich vCenter template is associated with OpenNebula \e[96mtemplate #{template_name}?\n\e[39m")
                STDOUT.puts
                index = 0
                template_refs  = []

                if templates_same_uuid.length > 1
                    # Choose only between those that have the same UUID
                    templates_list = templates_same_uuid
                else
                    templates_list = vc_templates[vcenter_uuid]
                end

                templates_list.each do |ref, t|
                    item = RbVmomi::VIM::VirtualMachine.new(vi_client.vim, ref)

                    folders = []
                    while !item.instance_of? RbVmomi::VIM::Datacenter
                        item = item.parent
                        if !item.instance_of?(RbVmomi::VIM::Datacenter)
                            if item.name != "vm"
                                folders << item.name
                            else
                                folders << ""
                            end
                        end
                        if item.nil?
                            raise "Could not find the Datacenter for the template"
                        end
                    end
                    datacenter = item
                    location   = folders.reverse.join("/")
                    location = "/" if location.empty?

                    template_refs << ref
                    STDOUT.puts("#{index+1}: Template #{t["name"]} in #{datacenter.name} Location: #{location}")
                    index += 1
                end

                STDOUT.puts("#{template_refs.size+1}: None of the above.")

                STDOUT.puts
                STDOUT.puts "Template: #{template_name}"
                STDOUT.puts
                STDOUT.puts "Previously selected templates:"
                selected_templates.each do |k,v|
                    STDOUT.puts("#{k}: #{v}")
                end
                STDOUT.puts

                loop do
                    STDOUT.print("\nFrom the list above, please \e[95mpick a number\e[39m in order to specify the template: ")
                    template_index = STDIN.gets.strip.to_i

                    if template_index == template_refs.size + 1
                        # selected None of the above
                        break
                    end

                    # selection out of bounds
                    next if template_index <= 0 || template_index > template_refs.size + 1

                    template_ref = template_refs[template_index-1] rescue nil
                    selected_templates[template_index] = templates_list[template_ref]["name"]

                    break
                end

                STDOUT.puts
                STDOUT.puts "-" * 80
            end

            # Get OpenNebulas's template
            one_template = OpenNebula::Template.new_with_id(template["ID"], one_client)
            STDOUT.puts

            if !template_ref
                STDOUT.print "Could not upgrade this template. Not found in vCenter. Do you want to remove it? (y/n) "
                loop do
                    option = STDIN.gets.strip
                    case option
                    when "y"
                        # delete
                        rc = one_template.delete
                        raise "Template #{template["ID"]}: '#{template["NAME"]}' could not be deleted. Reason #{rc.message}" if OpenNebula.is_error?(rc)

                        STDOUT.puts("\nTemplate #{template["ID"]}: '#{template["NAME"]}' has been \e[93mdeleted\e[39m.")
                        break
                    when "n"
                        STDOUT.puts("\nTemplate #{template["ID"]}: '#{template["NAME"]}' is \e[93mbroken\e[39m. Please inspect it manually after the upgrade.")
                        STDOUT.puts("\nPress any key to continue.\n")
                        STDIN.gets
                        break
                    end
                end
                next
            end

            rc  = one_template.info
            raise "Could not get info for template #{template["ID"]}. Reason: #{rc.message}" if OpenNebula.is_error?(rc)

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

            # Migrate USER_INPUTS/RESOURCE_POOL to USER_INPUTS/VCENTER_RESOURCE_POOL
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

            # Prepare VM template with new attributes
            template = ""
            template << "VCENTER_TEMPLATE_REF=\"#{template_ref}\"\n"
            template << "VCENTER_INSTANCE_ID=\"#{vcenter_uuid}\"\n"
            template << "VCENTER_CCR_REF=\"#{ccr_ref}\"\n"
            template << "VCENTER_RESOURCE_POOL=\"#{template_rp}\"\n" if template_rp
            template << user_inputs if template_user_rp

            # Try to update VM template
            rc = one_template.update(template, true)
            raise "Template #{template_name} could not be updated. Reason #{rc.message}" if OpenNebula.is_error?(rc)

            # Inform what attributes have been added
            STDOUT.puts "\nTemplate \e[96m#{template_name}:\e[39m"
            STDOUT.puts "--- New attribute VCENTER_TEMPLATE_REF=#{template_ref} added\n"
            STDOUT.puts "--- New attribute VCENTER_INSTANCE_ID=#{vcenter_uuid} added\n"
            STDOUT.puts "--- New attribute VCENTER_CCR_REF=#{ccr_ref} added\n"
            STDOUT.puts "--- New attribute VCENTER_RESOURCE_POOL=#{template_rp} added\n" if template_rp
            STDOUT.puts "--- New attribute USER_INPUTS/VCENTER_RESOURCE_POOL=#{template_user_rp} added\n" if template_user_rp

            one_template.info

            # Prepare template for migration
            xml_doc           = Nokogiri::XML(one_template.to_xml, nil, "UTF-8"){|c| c.default_xml.noblanks}
            xml_template      = xml_doc.root.at_xpath("TEMPLATE")
            # Retrieve and remove existing disks
            existing_disks    = xml_doc.root.xpath("TEMPLATE/DISK").remove
            # Retrieve and remove existing nics
            existing_nics     = xml_doc.root.xpath("TEMPLATE/NIC").remove
            template_id       = one_template["ID"]

            # Discover existing disks and/or nics. Note that datastores will
            # be created if the images require them.
            dc = get_dc(vc_template_object)
            dc_name = dc.name
            dc_ref  = dc._ref
            vcenter_name = vi_client.host
            STDOUT.puts "--- Discovering disks and network interfaces inside the template (please be patient)"
            unmanaged = template_unmanaged_discover(vc_template["config.hardware.device"],
                                                    template_cluster,
                                                    ccr_ref,
                                                    vcenter_name,
                                                    vcenter_uuid,
                                                    vcenter_user,
                                                    vcenter_pass,
                                                    vcenter_host,
                                                    dc_name,
                                                    dc_ref,
                                                    ipool,
                                                    vnpool,
                                                    dspool,
                                                    hpool,
                                                    one_client,
                                                    template_ref,
                                                    vc_template["name"],
                                                    template_id,
                                                    one_clusters,
                                                    vcenter_ids,
                                                    vi_client)

            if !unmanaged[:images].empty?
                STDOUT.puts "--- Adding DISK elements for discovered disks to new XML"
                # Create images for unmanaged disks
                unmanaged[:images].each do |image_id|
                    # Add existing disk to xml
                    disk = xml_template.add_child(xml_doc.create_element("DISK"))
                    disk.add_child(xml_doc.create_element("IMAGE_ID")).add_child(Nokogiri::XML::CDATA.new(xml_doc,"#{image_id}"))
                    disk.add_child(xml_doc.create_element("OPENNEBULA_MANAGED")).add_child(Nokogiri::XML::CDATA.new(xml_doc,"NO"))
                end
            end

            # Add managed disks after unmanaged disks
            xml_template.add_child(existing_disks)

            if !unmanaged[:networks].empty?
                STDOUT.puts "--- Adding NIC elements for discovered nics to new XML"
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

            # Remove SCHED_REQUIREMENTS from TEMPLATE
            xml_template.xpath("SCHED_REQUIREMENTS").remove

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

            # Remove SCHED_DS_REQUIREMENTS, OpenNebula will choose datastores
            # using the clusters associated to datastores
            xml_template.xpath("SCHED_DS_REQUIREMENTS").remove

            # If vcenter_datastore is a SYSTEM_DS then it's a storage pod
            # Let's create a SCHED_DS_REQUIREMENTS to force using that datastore
            ds_id = nil
            begin
                if !vcenter_datastore.empty?
                    ds = find_datastore_by_name(dspool, "#{vcenter_datastore}")
                    ds_id   = ds["ID"]
                    ds_type = ds["TEMPLATE/TYPE"]
                    if ds_type == "SYSTEM_DS"
                        sched_ds_req = one_template["TEMPLATE/SCHED_DS_REQUIREMENTS"]

                        if sched_ds_req
                            xml_template.xpath("SCHED_DS_REQUIREMENTS").remove
                            requirements = "ID=#{ds_id} & (#{sched_ds_req})"
                            xml_template.add_child(xml_doc.create_element("SCHED_DS_REQUIREMENTS")).add_child(Nokogiri::XML::CDATA.new(xml_doc,"\"#{requirements}\""))
                        else
                            # Add a SCHED_DS_REQUIREMENTS to template
                            xml_template.add_child(xml_doc.create_element("SCHED_DS_REQUIREMENTS")).add_child(Nokogiri::XML::CDATA.new(xml_doc,"\"ID=#{ds_id}\""))
                        end
                    end
                end
            rescue Exception => e
                STDOUT.puts
                if vcenter_datastore and !ds
                    STDOUT.puts "vCenter datastore #{vcenter_datastore} cannot be found"
                end
                STDOUT.puts "Could not add SCHED_DS_REQUIREMENTS to VM Template #{template["NAME"]}. Please add it manually if needed. Reason: #{e.message}"
            end

            #Write new XML template to file
            xml_doc = xml_doc.root.to_s.gsub(/>\s*/, ">").gsub(/\s*</, "<")
            File.open("#{TEMP_DIR}/one_migrate_template_#{template_id}","w"){|f| f.puts(xml_doc)}
            STDOUT.puts "--- New XML file #{TEMP_DIR}/one_migrate_template_#{template_id} for template \e[96m#{template_name}\e[39m \e[92mwas created and attributes were removed\e[39m\n"
            STDOUT.puts
            STDOUT.puts "-" * 80
            STDOUT.puts

        rescue Exception => e
            STDOUT.puts
            STDOUT.puts "VM Template \"#{template_name}\" couldn't be imported. Please consider removing the VM Template and importing it again with OpenNebula 5.4.x. Reason: #{e.message}"
            if template_id
                File.delete("#{TEMP_DIR}/one_migrate_template_#{template_id}") rescue nil
            end
        ensure
            vi_client.vim.close if vi_client
        end
    end
end

################################################################################
def inspect_vms(vc_vmachines, vc_templates, vc_clusters, one_clusters, vmpool, ipool, tpool, vnpool, dspool, hpool, one_client, vcenter_ids)
    # Retrieve vCenter deployed or importer VMs
    vms = vmpool.retrieve_xmlelements("VM[USER_TEMPLATE/PUBLIC_CLOUD/TYPE=\"vcenter\"]")

    selected_templates = {}
    vms.each do |vm|
        next if !vm["DEPLOY_ID"] # Ignore undeployed vms

        begin
            # Refresh pools
            rc = vnpool.info_all
            raise "\n    ERROR! Could not update vnpool. Reason #{rc.message}" if OpenNebula.is_error?(rc)

            rc = ipool.info_all
            raise "\n    ERROR! Could not update ipool. Reason #{rc.message}" if OpenNebula.is_error?(rc)

            rc = dspool.info
            raise "\n    ERROR! Could not update dspool. Reason #{rc.message}" if OpenNebula.is_error?(rc)

            # Find vcenter VM in vc_vmachines
            vm_name = vm["NAME"]
            vm_id   = vm["ID"]

            # Get cluster's MOREF and name
            host_id      = vm["HISTORY_RECORDS/HISTORY[last()]/HID"]
            host         = OpenNebula::Host.new_with_id(host_id, one_client)
            rc           = host.info
            raise "\n    ERROR! Could not get host info for wild vm disk. Reason #{rc.message}" if OpenNebula.is_error?(rc)
            ccr_name     = host["NAME"]
            ccr_ref      = host["TEMPLATE/VCENTER_CCR_REF"]
            vcenter_user = host["TEMPLATE/VCENTER_USER"]
            vcenter_pass = host["TEMPLATE/VCENTER_PASSWORD"]
            vcenter_host = host["TEMPLATE/VCENTER_HOST"]
            if !ccr_ref
                raise "VM #{vm_name} could not be updated, cannot find cluster's MOREF"
            end

            # Create vi_client
            vi_client    = VCenterDriver::VIClient.new(host_id)
            vcenter_uuid = vi_client.vim.serviceContent.about.instanceUuid
            vcenter_name = vi_client.host

            # Is VM a wild?
            vm_wild = vm["TEMPLATE/IMPORTED"] == "YES"

            # Try to find the vCenter object comparing its uuid with the DEPLOY_ID
            vc_vmachine        = nil
            vm_ref             = nil
            vc_vmachine_object = nil

            machines_found = vc_vmachines[vcenter_uuid].select do |ref, value|
                value["config.uuid"] == vm["DEPLOY_ID"]
            end

            if machines_found.size == 0
                STDOUT.puts "VM \e[96m#{vm_name}\e[39m could not be migrated, \e[91mcannot find this VM in objects retrieved\e[39m,\n"\
                            "maybe it was deleted in vCenter but not in OpenNebula?"
                STDOUT.puts
                STDOUT.puts "-" * 80
                STDOUT.puts
                next
            end

            if machines_found.size > 1
                # We have several vCenter objects with the same UUID the admin
                # must help us to know which VM is the one we're looking for
                vm_refs   = []
                vm_values = []
                index     = 0
                STDOUT.puts("\n\e[93mWARNING: Manual intervention required!\e[39m")
                STDOUT.puts("\nWhich vCenter VM is represented by OpenNebula \e[96mVM #{vm_name}?\e[39m\n")
                STDOUT.puts

                vc_vmachines[vcenter_uuid].each do |ref, v|
                    if v["config.uuid"] == vm["DEPLOY_ID"]
                        item = RbVmomi::VIM::VirtualMachine.new(vi_client.vim, ref)
                        while !item.instance_of? RbVmomi::VIM::Datacenter
                            item = item.parent
                            if item.nil?
                                raise "Could not find the Datacenter associated to this VM"
                            end
                        end
                        datacenter = item

                        vm_refs   << ref
                        vm_values << v
                        STDOUT.puts("#{index+1}: VM #{v["name"]} in #{datacenter.name}")
                        index += 1
                    end
                end

                loop do
                    STDOUT.print("\nFrom the list above, please \e[95mpick up one number\e[39m in order to specify the right VM: ")
                    vm_index = STDIN.gets.strip.to_i
                    next if vm_index == 0 || vm_index - 1 < 0 || vm_index > vm_refs.size
                    vm_ref  = vm_refs[vm_index-1] rescue nil
                    vc_vmachine = vm_values[vm_index-1] rescue nil
                    vc_vmachine_object = RbVmomi::VIM::VirtualMachine.new(vi_client.vim, vm_ref)
                    break if vm_ref
                end

                STDOUT.puts
                STDOUT.puts "-" * 80
                STDOUT.puts

            else
                # We have only found one VM where the DEPLOY_ID matches the config.uuid
                vc_vmachines[vcenter_uuid].each do |ref, value|
                    if value["config.uuid"] == vm["DEPLOY_ID"]
                        vc_vmachine = value
                        vc_vmachine_object = RbVmomi::VIM::VirtualMachine.new(vi_client.vim, ref)
                        vm_ref = ref
                        break
                    end
                end
            end

            # We have to discriminate between Wild vms and VMs deployed by OpenNebula
            if vm_wild
                template_ref = vm_ref # The template ref is the VM's moref
            else
                # If the VM was deployed by OpenNebula the ref or uuid are in the USER_TEMPLATE
                template_ref  = vm["USER_TEMPLATE/PUBLIC_CLOUD/VCENTER_REF"]
                template_uuid = vm["USER_TEMPLATE/PUBLIC_CLOUD/VM_TEMPLATE"]

                # We try to check if the template's moref found inside the XML template
                # is found in the templates retrieved from vcenter only once
                if template_ref

                    templates_found = vc_templates[vcenter_uuid].select do |ref, value|
                        template_ref == ref
                    end

                    if templates_found.size != 1
                        template_ref = nil
                    end
                end

                # Try to get moref using the templates uuid note that that uuid
                # is not unique
                templates_same_uuid = {}
                if !template_ref && template_uuid
                    templates_found = 0
                    vc_templates[vcenter_uuid].each do |ref, value|
                        if value["config.uuid"] == template_uuid
                            templates_found += 1
                            templates_same_uuid[ref] = value
                            if templates_found > 1
                                template_ref = nil
                            else
                                template_ref = ref
                            end
                        end
                    end
                end

                if !template_ref
                    STDOUT.puts("\n\e[93mWARNING: Manual intervention required!\e[39m")
                    STDOUT.puts("\nWhich vCenter template is associated with OpenNebula \e[96mVM #{vm_name}?\e[39m\n")
                    STDOUT.puts

                    index = 0
                    template_refs  = []

                    if templates_same_uuid.length > 1
                        # Choose only between those that have the same UUID
                        templates_list = templates_same_uuid
                    else
                        templates_list = vc_templates[vcenter_uuid]
                    end

                    templates_list.each do |ref, t|
                        item = RbVmomi::VIM::VirtualMachine.new(vi_client.vim, ref)

                        folders = []
                        while !item.instance_of? RbVmomi::VIM::Datacenter
                            item = item.parent
                            if !item.instance_of?(RbVmomi::VIM::Datacenter)
                                if item.name != "vm"
                                    folders << item.name
                                else
                                    folders << ""
                                end
                            end
                            if item.nil?
                                raise "Could not find the Datacenter for the template"
                            end
                        end
                        datacenter = item
                        location   = folders.reverse.join("/")
                        location = "/" if location.empty?


                        template_refs << ref
                        STDOUT.puts("#{index+1}: Template #{t["name"]} in Datacenter #{datacenter.name} Location: #{location}")
                        index += 1
                    end

                    STDOUT.puts("#{template_refs.size+1}: None of the above.")

                    STDOUT.puts
                    STDOUT.puts "VirtualMachine: #{vm_name}"
                    STDOUT.puts
                    STDOUT.puts "Previously selected templates:"
                    selected_templates.each do |k,v|
                        STDOUT.puts("#{k}: #{v}")
                    end
                    STDOUT.puts

                    loop do
                        STDOUT.print("\nFrom the list above, please \e[95mpick up one number\e[39m in order to specify the venter template that this VM was based on: ")
                        template_index = STDIN.gets.strip.to_i

                        if template_index == template_refs.size + 1
                            # selected None of the above
                            break
                        end

                        # selection out of bounds
                        next if template_index <= 0 || template_index > template_refs.size + 1

                        template_ref = template_refs[template_index-1] rescue nil
                        selected_templates[template_index] = templates_list[template_ref]["name"]

                        break
                    end
                end

                STDOUT.puts
                STDOUT.puts "-" * 80
                STDOUT.puts
            end

            if !template_ref
                # This VM doesn't have an associated template any more. Let's
                # treat it as a wild VM
                vm_wild = true
                template_ref = vm_ref
            end

            # Get VM's datacenter name
            dc = get_dc(vc_vmachine_object)
            dc_name = dc.name
            dc_ref  = dc._ref

            # Get xml template from tmp with unmanaged disks and nics and new attributes
            template_id  = vm["TEMPLATE/TEMPLATE_ID"]
            template_xml = nil

            if !vm_wild
                template_filename = "#{TEMP_DIR}/one_migrate_template_#{template_id}"
                if File.exist?("#{template_filename}")
                    template_xml = File.open(template_filename) { |f| Nokogiri::XML(f, nil, "UTF-8"){|c| c.default_xml.noblanks} }
                end
            end

            # Create a Nokogiri XML representing the VM's template
            xml_doc = Nokogiri::XML(vm.to_xml, nil, "UTF-8"){|c| c.default_xml.noblanks}

            # Replace VM's deploy_id uuid with moref
            xml_deploy_id  = xml_doc.root.at_xpath("DEPLOY_ID")
            xml_deploy_id.content = vc_vmachine_object._ref

            # Inform about the changes
            STDOUT.puts "VM \e[96m#{vm_name}\e[39m:"
            STDOUT.puts
            STDOUT.puts "--- DEPLOY_ID has been changed to #{vc_vmachine_object._ref}"

            # Retrieve and remove disks and nics from vm
            existing_disks = xml_doc.root.xpath("TEMPLATE/DISK").remove # Retrieve and remove existing disks
            existing_nics  = xml_doc.root.xpath("TEMPLATE/NIC").remove  # Retrieve and remove existing nics

            # Discover existing disks and/or nics
            # It will return an extraconfig for VM reconfigure
            extraconfig = vm_unmanaged_discover(vc_vmachine["config.hardware.device"],
                                                xml_doc,
                                                template_xml,
                                                existing_disks,
                                                existing_nics,
                                                ccr_name,
                                                ccr_ref,
                                                vcenter_name,
                                                vcenter_uuid,
                                                vcenter_user,
                                                vcenter_pass,
                                                vcenter_host,
                                                dc_name,
                                                dc_ref,
                                                ipool,
                                                vnpool,
                                                dspool,
                                                hpool,
                                                one_client,
                                                vi_client,
                                                vm_wild,
                                                vm_id,
                                                vc_vmachine["name"],
                                                vc_templates[vcenter_uuid],
                                                vm_ref,
                                                vc_vmachines[vcenter_uuid],
                                                template_ref,
                                                one_clusters,
                                                vcenter_ids)

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
            STDOUT.puts "-" * 80
            STDOUT.puts
        rescue Exception => e
            STDOUT.puts
            STDOUT.puts "VM \"#{vm["NAME"]}\" couldn't be migrated. It may require manual intervention. Reason: #{e.message}"
        ensure
            vi_client.vim.close if vi_client
        end
    end
end

################################################################################
# Pre-migrator tool                                                            #
################################################################################

CommandParser::CmdParser.new(ARGV) do
    usage "`vcenter_one54_pre` [<options>]"
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
            msg = "  vCenter pre-migrator tool for OpenNebula 5.4 - Version: 1.1.8"
            logo_banner(msg)

            # Initialize opennebula client
            one_client = OpenNebula::Client.new()
            vcenter_instances = []

            hpool = OpenNebula::HostPool.new(one_client)
            rc = hpool.info

            raise "Error contacting OpenNebula #{rc.message}" if OpenNebula.is_error?(rc)

            cpool = OpenNebula::ClusterPool.new(one_client)
            rc = cpool.info
            raise "Error contacting OpenNebula #{rc.message}" if OpenNebula.is_error?(rc)

            vc_clusters   = {}
            vc_datastores = {}
            vc_networks   = {}
            vc_vmachines  = {}
            vc_templates  = {}

            banner " PHASE 0 - Before running the script please read the following notes", true

            STDOUT.puts
            STDOUT.puts("- Please check that you have set PERSISTENT_ONLY=\"NO\" and REQUIRED_ATTRS=\"\"\n"\
                        "  in you DS_MAD_CONF vcenter inside the /etc/one/oned.conf and that you have\n"\
                        "  restarted your OpenNebula services to apply the new configuration before\n"\
                        "  launching the script.")
            STDOUT.puts
            STDOUT.puts("- Edit the file \e[92m/var/lib/one/remotes/datastore/vcenter/rm\e[39m and replace the\n"\
                        "  following lines:\n\n"\
                        "  \e[96mvi_client.delete_virtual_disk(img_src,\n"\
                        "                                ds_name)\e[39m \n\n"\
                        "  with the following lines:\n\n"\
                        "  \e[96mif drv_action[\"/DS_DRIVER_ACTION_DATA/IMAGE/TEMPLATE/VCENTER_IMPORTED\"] != \"YES\"\n"\
                        "       vi_client.delete_virtual_disk(img_src,ds_name) \n"\
                        "  end\e[39m \n\n"\
                        "  in order to avoid that you accidentally remove a virtual hard disk from a template \n"\
                        "  or wild VM when you delete an image.")
            STDOUT.puts
            STDOUT.puts("- Note that this script may take some time to perform complex tasks so \e[96mplease be patient.\e[39m")
            STDOUT.puts
            STDOUT.puts("- Although this scripts will do its best to be fully automated there may be situations\n"\
                        "  where a manual intervention is needed, in that case a \e[93mWARNING\e[39m will be shown.")
            STDOUT.puts
            STDOUT.puts("- The virtual networks that represent port groups found inside existing templates\n"\
                        "  will have an Ethernet address range with 255 MACs in the pool. You may want to\n"\
                        "  change or increase this address range after the pre-migrator tool finishes.")
            STDOUT.puts
            STDOUT.puts("- It's advisable to disable the Sunstone user interface before launching this script\n"\
                        "  in order to avoid that OpenNebula objects created by users while\n"\
                        "  the script is running are not pre-migrated by the tool.")
            STDOUT.puts
            STDOUT.puts("- This script can be executed as many times as you wish. It will update previous\n"\
                        "  results and XML template will be always overwritten.")
            STDOUT.puts
            STDOUT.puts("\e[93mDon't forget to restart OpenNebula if you have made changes!\e[39m")

            STDOUT.print("\nDo you want to continue? ([y]/n): ")

            exit! if STDIN.gets.strip.downcase == 'n'

            banner " PHASE 1 - Retrieve objects from vCenter instances", true

            STDOUT.puts
            STDOUT.puts "Inventory objects are being retrieved, \e[96mplease be patient...\e[39m"
            STDOUT.puts

            # For each vCenter host we:
            # - Create a rbvmomi connection
            # - Generate views for clusters, datastores, networks and VMs

            hpool.each do |host|
                next if host['VM_MAD'] != "vcenter"

                vi_client = VCenterDriver::VIClient.new(host["ID"]) rescue next
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
                vc_vmachines[vcenter_uuid], vc_templates[vcenter_uuid] = retrieve_vcenter_vms(vi_client)

                STDOUT.puts "--- #{host["TEMPLATE/VCENTER_HOST"]} \e[92mobjects have been retrieved\e[39m"
            end

            STDOUT.puts
            STDOUT.puts "All vCenter objects have been retrieved, thanks for your patience."

            # Control what objects id have been modified
            vcenter_ids = {}
            vcenter_ids[:host]  = []
            vcenter_ids[:ds]    = []
            vcenter_ids[:vnet]  = []
            vcenter_ids[:image] = []

            banner " PHASE 2 - Add new attributes to existing hosts", true
            add_new_host_attrs(vc_clusters, hpool, one_client, vcenter_ids)

            banner " PHASE 3 - Create OpenNebula clusters if needed", true
            STDOUT.puts

            one_clusters = create_new_clusters(vc_clusters, hpool, cpool, one_client)

            dspool = OpenNebula::DatastorePool.new(one_client)
            rc = dspool.info
            raise "Error contacting OpenNebula #{rc.message}" if OpenNebula.is_error?(rc)

            rc = hpool.info # Update host pool to get new attributes
            raise "Error contacting OpenNebula #{rc.message}" if OpenNebula.is_error?(rc)

            rc = cpool.info # Update cluster pool to get new clusters
            raise "Error contacting OpenNebula #{rc.message}" if OpenNebula.is_error?(rc)

            extended_message = " - Add new attributes to datastores\n"\
                               " - Create SYSTEM datastores if needed\n"\
                               " - Assign datastores to OpenNebula Clusters"

            banner " PHASE 4 - Inspect existing datatores ", true, extended_message

            inspect_datastores(vc_datastores, vc_clusters, one_clusters, dspool, hpool, one_client, vcenter_ids)

            rc = dspool.info # Refresh datastore pool
            raise "Error contacting OpenNebula #{rc.message}" if OpenNebula.is_error?(rc)

            vnpool = OpenNebula::VirtualNetworkPool.new(one_client)
            rc = vnpool.info_all
            raise "Error contacting OpenNebula #{rc.message}" if OpenNebula.is_error?(rc)

            extended_message = " - Add new attributes to vnets\n"\
                               " - Assign vnets to OpenNebula Clusters"
            banner " PHASE 5 - Add new attributes to existing vnets", true, extended_message
            inspect_networks(vc_networks, vc_clusters, one_clusters, vnpool, hpool, one_client, vcenter_ids)

            ipool = OpenNebula::ImagePool.new(one_client)
            rc = ipool.info_all
            raise "Error contacting OpenNebula #{rc.message}" if OpenNebula.is_error?(rc)

            banner " PHASE 6 - Add new attributes to existing images", true
            add_new_image_attrs(ipool, one_client, vcenter_ids)

            rc = ipool.info_all
            raise "Error contacting OpenNebula #{rc.message}" if OpenNebula.is_error?(rc)

            tpool = OpenNebula::TemplatePool.new(one_client)
            rc = tpool.info_all
            raise "Error contacting OpenNebula #{rc.message}" if OpenNebula.is_error?(rc)

            extended_message = " - Add new attributes to existing templates\n"\
                               " - Discover nics and disks inside templates\n"\
                               " - Import datastores where discovered virtual disks are found if needed.\n"\
                               " - Create images for discovered virtual hard disks\n"\
                               " - Create vnets for discovered port groups\n"\
                               " - Prepare XML VM templates removing old or deprecated attributes\n"

            banner " PHASE 7 - Inspect existing VM templates", true, extended_message

            inspect_templates(vc_templates, vc_clusters, one_clusters, tpool, ipool, vnpool, dspool, hpool, one_client, vcenter_ids)

            vmpool = OpenNebula::VirtualMachinePool.new(one_client)
            rc = vmpool.info_all
            raise "Error contacting OpenNebula #{rc.message}" if OpenNebula.is_error?(rc)

            extended_message = " - Add new attributes to existing VMs\n"\
                               " - Discover nics and disks inside VMs\n"\
                               " - Import datastores where discovered virtual disks are found if needed.\n"\
                               " - Create images for discovered virtual hard disks\n"\
                               " - Create vnets for discovered port groups\n"\
                               " - Prepare XML VM templates removing old or deprecated attributes\n"\
                               " - Reconfigure vCenter VM to add unmanaged disks and nics references\n"\
                               " - DEPLOY_ID will get VM's managed object reference\n"

            banner " PHASE 8 - Inspect existing VMs", true, extended_message
            STDOUT.puts
            inspect_vms(vc_vmachines, vc_templates, vc_clusters, one_clusters, vmpool, ipool, tpool, vnpool, dspool, hpool, one_client, vcenter_ids)

            if !vcenter_ids[:host].empty?
                banner " PHASE  9 - Prepare XML templates for hosts without deprecated attributes", true
                prepare_host_xml_templates(vcenter_ids[:host], one_clusters, one_client)
            end

            if !vcenter_ids[:ds].empty?
                banner " PHASE 10 - Prepare XML templates for datastores without deprecated attributes", true
                prepare_ds_xml_templates(vcenter_ids[:ds], one_client)
            end

            if !vcenter_ids[:vnet].empty?
                banner " PHASE 11 - Prepare XML templates for vnets without deprecated attributes", true
                prepare_vnet_xml_templates(vcenter_ids[:vnet], one_client)
            end

            if !vcenter_ids[:image].empty?
                banner " PHASE 12 - Prepare XML templates for images without deprecated attributes", true
                prepare_image_xml_templates(vcenter_ids[:image], hpool, one_client)
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
