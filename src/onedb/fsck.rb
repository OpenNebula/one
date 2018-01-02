# -------------------------------------------------------------------------- #
# Copyright 2002-2018, OpenNebula Project, OpenNebula Systems                #
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

LOG              = LOG_LOCATION + "/onedb-fsck.log"

require "rexml/document"
include REXML
require 'ipaddr'
require 'set'

require 'nokogiri'

require 'opennebula'

require 'fsck/pool_control'
require 'fsck/user'
require 'fsck/group'

require 'fsck/cluster'
require 'fsck/host'
require 'fsck/datastore'
require 'fsck/network'

require 'fsck/image'
require 'fsck/marketplaceapp'
require 'fsck/marketplace'
require 'fsck/vm'
require 'fsck/cluster_vnc_bitmap'
require 'fsck/history'
require 'fsck/vrouter'
require 'fsck/template'

require 'fsck/quotas'

module OneDBFsck
    VERSION = "5.5.80"
    LOCAL_VERSION = "5.5.80"

    def db_version
        if defined?(@db_version) && @db_version
            @db_version
        else
            @db_version = read_db_version
        end
    end

    def check_db_version()
        # db_version = read_db_version()

        if ( db_version[:version] != VERSION ||
             db_version[:local_version] != LOCAL_VERSION )

            raise <<-EOT
Version mismatch: fsck file is for version
Shared: #{VERSION}, Local: #{LOCAL_VERSION}

Current database is version
Shared: #{db_version[:version]}, Local: #{db_version[:local_version]}
EOT
        end
    end

    def one_version
        "OpenNebula #{VERSION}"
    end

    # def db_version
    #     one_version()
    # end

    VM_BIN      = 0x0000001000000000
    NET_BIN     = 0x0000004000000000
    VROUTER_BIN = 0x0004000000000000
    HOLD        = 0xFFFFFFFF

    TABLES = ["group_pool", "user_pool", "acl", "image_pool", "host_pool",
        "network_pool", "template_pool", "vm_pool", "cluster_pool",
        "datastore_pool", "document_pool", "zone_pool", "secgroup_pool",
        "vdc_pool", "vrouter_pool", "marketplace_pool",
        "marketplaceapp_pool"].freeze

    FEDERATED_TABLES = ["group_pool", "user_pool", "acl", "zone_pool",
        "vdc_pool", "marketplace_pool", "marketplaceapp_pool"].freeze

    def tables
        TABLES
    end

    def federated_tables
        FEDERATED_TABLES
    end

    def nokogiri_doc(body)
        Nokogiri::XML(body, nil, NOKOGIRI_ENCODING) do |c|
            c.default_xml.noblanks
        end
    end

    def add_element(elem, name)
        return elem.add_child(elem.document.create_element(name))
    end

    def add_cdata(elem, name, text)
        # The cleaner doc.create_cdata(txt) is not supported in
        # old versions of nokogiri
        return add_element(elem, name).add_child(
                        Nokogiri::XML::CDATA.new(elem.document(), text))
    end

    ########################################################################
    # Acl
    ########################################################################

    ########################################################################
    # Users
    #
    # USER/GNAME
    ########################################################################

    ########################################################################
    # Datastore
    #
    # DATASTORE/UID
    # DATASTORE/UNAME
    # DATASTORE/GID
    # DATASTORE/GNAME
    # DATASTORE/SYSTEM ??
    ########################################################################

    ########################################################################
    # VM Template
    #
    # VMTEMPLATE/UID
    # VMTEMPLATE/UNAME
    # VMTEMPLATE/GID
    # VMTEMPLATE/GNAME
    ########################################################################

    ########################################################################
    # Documents
    #
    # DOCUMENT/UID
    # DOCUMENT/UNAME
    # DOCUMENT/GID
    # DOCUMENT/GNAME
    ########################################################################

    ########################################################################
    # VM
    #
    # VM/UID
    # VM/UNAME
    # VM/GID
    # VM/GNAME
    #
    # VM/STATE        <--- Check transitioning states?
    # VM/LCM_STATE    <---- Check consistency state/lcm_state ?
    ########################################################################

    ########################################################################
    # Image
    #
    # IMAGE/UID
    # IMAGE/UNAME
    # IMAGE/GID
    # IMAGE/GNAME
    ########################################################################

    ########################################################################
    # VNet
    #
    # VNET/UID
    # VNET/UNAME
    # VNET/GID
    # VNET/GNAME
    ########################################################################


    def counters
        if !defined?(@counters)
            @counters = {}
            @counters[:host]  = {}
            @counters[:image] = {}
            @counters[:vnet]  = {}
            @counters[:vrouter]  = {}
        end

        @counters
    end

    # Initialize all the vrouter counters to 0
    def init_vrouter_counters
        @db.fetch("SELECT oid FROM vrouter_pool") do |row|
            counters[:vrouter][row[:oid]] = {
                :vms   => Set.new
            }
        end
    end

    def fsck
        init_log_time()

        @errors = 0
        @repaired_errors = 0
        @unrepaired_errors = 0

        puts

        db_version = read_db_version()

        ########################################################################
        # pool_control
        ########################################################################

        check_pool_control

        fix_pool_control

        log_time()

        ########################################################################
        # Groups
        #
        # GROUP/USERS/ID
        ########################################################################

        ########################################################################
        # Users
        #
        # USER/GID
        ########################################################################

        check_user
        fix_user

        log_time

        check_group
        fix_group

        log_time

        ########################################################################
        # Clusters
        #
        # CLUSTER/SYSTEM_DS
        # CLUSTER/HOSTS/ID
        # CLUSTER/DATASTORES/ID
        # CLUSTER/VNETS/ID
        ########################################################################
        # Datastore
        #
        # DATASTORE/CLUSTER_ID
        # DATASTORE/CLUSTER
        ########################################################################
        # VNet
        #
        # VNET/CLUSTER_ID
        # VNET/CLUSTER
        ########################################################################
        # Hosts
        #
        # HOST/CLUSTER_ID
        # HOST/CLUSTER
        ########################################################################

        init_cluster

        check_host_cluster
        fix_host_cluster

        log_time

        check_datastore_cluster
        fix_datastore_cluster

        log_time

        check_network_cluster
        fix_network_cluster

        log_time

        check_fix_cluster

        log_time

        check_fix_cluster_relations

        log_time

        ########################################################################
        # Datastore
        #
        # DATASTORE/IMAGES/ID
        ########################################################################
        # Image
        #
        # IMAGE/DATASTORE_ID
        # IMAGE/DATASTORE
        ########################################################################

        init_datastore_counters

        log_time

        check_datastore_image
        fix_datastore_image

        log_time

        check_fix_datastore

        log_time

        ########################################################################
        # VM Counters for host, image and vnet usage
        ########################################################################

        init_host_counters

        log_time

        init_image_counters

        log_time

        init_network_counters

        log_time

        init_vrouter_counters

        log_time

        check_vm
        fix_vm

        log_time

        # VNC

        # DATA: VNC Bitmap

        check_cluster_vnc_bitmap
        fix_cluster_vnc_bitmap

        log_time

        # history

        check_history
        fix_history

        log_time

        ########################################################################
        # Virtual Routers
        #
        # VROUTER/VMS/ID
        ########################################################################

        check_vrouter
        fix_vrouter

        log_time

        ########################################################################
        # DATA: Hosts
        #
        # HOST/HOST_SHARE/MEM_USAGE
        # HOST/HOST_SHARE/CPU_USAGE
        # HOST/HOST_SHARE/RUNNING_VMS
        # HOST/VMS/ID
        ########################################################################

        check_host
        fix_host

        log_time

        ########################################################################
        # DATA: Marketplace
        #
        # MARKETPLACE/MARKETPLACEAPPS/ID
        ########################################################################
        # DATA: App
        #
        # MARKETPLACEAPP/MARKETPLACE_ID
        # MARKETPLACEAPP/MARKETPLACE
        # MARKETPLACEAPP/ORIGIN_ID
        ########################################################################

        check_marketplaceapp

        fix_marketplaceapp

        log_time()

        check_marketplace

        fix_marketplace

        log_time()

        ########################################################################
        # DATA: Image
        #
        # IMAGE/RUNNING_VMS
        # IMAGE/VMS/ID
        #
        # IMAGE/CLONING_OPS
        # IMAGE/CLONES/ID
        # IMAGE/APP_CLONES/ID
        #
        # IMAGE/CLONING_ID
        #
        # IMAGE/STATE
        ########################################################################

        check_image

        fix_image

        log_time

        ########################################################################
        # VNet
        #
        # LEASES
        ########################################################################

        init_network_lease_counters

        check_network
        fix_network

        log_time

        ########################################################################
        # Users
        #
        # USER QUOTAS
        ########################################################################

        check_fix_user_quotas

        log_time

        ########################################################################
        # Groups
        #
        # GROUP QUOTAS
        ########################################################################

        check_fix_group_quotas

        log_time

        ########################################################################
        # VM Templates
        #
        # TEMPLATE/OS/BOOT
        ########################################################################

        check_template
        fix_template

        log_time

        log_total_errors

        return true
    end

    def log_error(message, repaired=true)
        @errors += 1

        if repaired
            @repaired_errors += 1
        else
            @unrepaired_errors += 1
        end

        if !repaired
            message = "[UNREPAIRED] " + message
        end

        log_msg(message)
    end

    def log_msg(message)
        @log_file ||= File.open(LOG, "w")

        puts message

        @log_file.puts(message)
        @log_file.flush
    end

    def log_total_errors()
        puts
        log_msg "Total errors found: #{@errors}"
        log_msg "Total errors repaired: #{@repaired_errors}"
        log_msg "Total errors unrepaired: #{@unrepaired_errors}"

        puts "A copy of this output was stored in #{LOG}"
    end

    def mac_s_to_i(mac)
        return nil if mac.empty?
        return mac.split(":").map {|e|
            e.to_i(16).to_s(16).rjust(2,"0")}.join("").to_i(16)
    end

    def mac_i_to_s(mac)
        mac_s = mac.to_s(16).rjust(12, "0")
        return "#{mac_s[0..1]}:#{mac_s[2..3]}:#{mac_s[4..5]}:"<<
               "#{mac_s[6..7]}:#{mac_s[8..9]}:#{mac_s[10..11]}"
    end

    def ip6_prefix_s_to_i(prefix)
        return nil if prefix.empty?
        return prefix.split(":", 4).map {|e|
            e.to_i(16).to_s(16).rjust(4, "0")}.join("").to_i(16)
    end

    # Copied from AddressRange::set_ip6 in AddressRange.cc
    def mac_to_ip6_suffix(mac_i)
        mac = [
            mac_i & 0x00000000FFFFFFFF,
            (mac_i & 0xFFFFFFFF00000000) >> 32
        ]

        mlow = mac[0]
        eui64 = [
            4261412864 + (mlow & 0x00FFFFFF),
            ((mac[1]+512)<<16) + ((mlow & 0xFF000000)>>16) + 0x000000FF
        ]

        return (eui64[1] << 32) + eui64[0]
    end

    def lease_to_s(lease)
        return lease[:ip].nil? ? lease[:mac].to_s : lease[:ip].to_s
    end

    # Returns the ID of the # disk of a type
    # Params:
    # +type+:: type name of the disk, can be “hd” or “cdrom”
    # +doc+:: Nokogiri::XML::Node describing the VM template
    def get_disk_id(type, index, doc, uid)
        found_i = -1

        doc.root.xpath("TEMPLATE/DISK").each_with_index do |disk, disk_i|
            id = disk.at_xpath("IMAGE_ID")

            if id
                begin
                    image = get_image_from_id(id.content)
                rescue => e
                    template_id = doc.root.at_xpath("ID").content
                    STDERR.puts "Error processing template: #{template_id}"
                    raise e
                end
            else
                image = get_image_from_name(disk, uid)
            end

            next if image.nil?

            if is_image_type_matching?(image, type)
                found_i += 1

                if (found_i == index)
                    return disk_i
                end
            end
        end

        return nil
    end

    # Returns a Nokogiri::XML::Node describing an image
    # Params:
    # +id+:: ID of the image
    def get_image_from_id(id)
        # if IMAGE_ID has a non positive integer (>=0) return nil
        return nil if id !~ /^\d+$/

        begin
            sql_cmd = "SELECT body FROM image_pool WHERE oid='#{id}'"
            row = @db.fetch(sql_cmd).first
        rescue => e
            STDERR.puts "Error executing: #{sql_cmd}"
            raise e
        end

        # No image found, so unable to get image TYPE
        return nil if row.nil?

        image = Nokogiri::XML(row[:body], nil,NOKOGIRI_ENCODING){|c| c.default_xml.noblanks}
        return image
    end

    # Returns a Nokogiri::XML::Node describing an image
    # Params:
    # +disk+:: Nokogiri::XML::Node describing a disk used by a template
    def get_image_from_name(disk, template_uid)
        name = disk.at_xpath("IMAGE") && disk.at_xpath("IMAGE").content

        return nil if name.nil?

        uid   = disk.at_xpath("IMAGE_UID")
        uname = disk.at_xpath("IMAGE_UNAME")

        if uid
            uid = uid.content
        else
            if uname
                uid = get_user_id(uname.content)
            else
                uid = template_uid
            end
        end

        return nil if uid.nil?

        row = @db.fetch("SELECT body FROM image_pool WHERE name=\"#{name}\" AND uid=#{uid}").first

        # No image found, so unable to get image TYPE
        return nil if row.nil?

        image = Nokogiri::XML(row[:body], nil,NOKOGIRI_ENCODING){|c| c.default_xml.noblanks}

        return image
    end

    # Returns the ID of a user name
    # Params:
    # +name+:: name of a user
    def get_user_id(name)
        row = @db.fetch("SELECT uid from user_pool WHERE name=\"#{name}\"").first

        return nil if row.nil?

        return row[:uid]
    end

    # Check if an image type match the type used in template BOOT
    # Params:
    # +image_type+:: doc
    # +wanted_type+:: string type extracted from VM template BOOT
    def is_image_type_matching?(image, wanted_type)
        return false if image.nil? || image.at_xpath("IMAGE/TYPE").nil?

        img_type = OpenNebula::Image::IMAGE_TYPES[image.at_xpath("IMAGE/TYPE").text.to_i]

        if wanted_type == "hd"
            return img_type == "OS" || img_type == "DATABLOCK"
        else
            return img_type == "CDROM"
        end
    end
end
