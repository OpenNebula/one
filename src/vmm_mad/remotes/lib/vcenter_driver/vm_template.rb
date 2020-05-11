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
require 'ipaddr'

module VCenterDriver

class Template

    attr_accessor :item

    include Memoize

    def initialize(item=nil, vi_client=nil)
        @item = item
        check_item(@item, nil) if (@item)
        @vi_client = vi_client
        @locking = true
    end

    # Locking function. Similar to flock
    def lock
        if @locking
           @locking_file = File.open("/tmp/vcenter-importer-lock","w")
           @locking_file.flock(File::LOCK_EX)
        end
    end

    # Unlock driver execution mutex
    def unlock
        if @locking
            @locking_file.close
            if File.exist?("/tmp/vcenter-importer-lock")
                File.delete("/tmp/vcenter-importer-lock")
            end
        end
    end

    def vm?
        self.class == VCenterDriver::VirtualMachine
    end

    def online?
        raise "vcenter item not found!" unless @item

        !@item["guest.net"].empty?
    end

    def get_dc
        item = @item

        trace = []
        while item && !item.instance_of?(RbVmomi::VIM::Datacenter)
            rp = item.resourcePool rescue nil
            if rp && rp.instance_of?(RbVmomi::VIM::VirtualApp)
                trace << "rp:" + item.to_s
                item = rp.parent rescue nil
            else
                trace << item.to_s
                item = item.parent rescue nil
            end
        end

        if item.nil?
            trace = "[" + trace.join(", ") + "]"
            raise "Could not find the parent Datacenter. Trace: #{trace}"
        end

        Datacenter.new(item)
    end

    def delete_template
        @item.Destroy_Task.wait_for_completion
    end

    def get_vcenter_instance_uuid
        @vi_client.vim.serviceContent.about.instanceUuid rescue nil
    end

    def create_template_copy(template_name)
        error = nil
        template_ref = nil

        template_name = "one-#{self['name']}" if template_name.empty?

        relocate_spec_params = {}
        relocate_spec_params[:pool] = get_rp
        relocate_spec = RbVmomi::VIM.VirtualMachineRelocateSpec(relocate_spec_params)

        clone_spec = RbVmomi::VIM.VirtualMachineCloneSpec({
            :location => relocate_spec,
            :powerOn  => false,
            :template => false
        })

        template = nil
        begin
            template = @item.CloneVM_Task(:folder => @item.parent,
                                          :name   => template_name,
                                          :spec   => clone_spec).wait_for_completion
            template_ref = template._ref
        rescue StandardError => e
            if !e.message.start_with?('DuplicateName')
                error = "Could not create the template clone. Reason: #{e.message}"
                return error, nil
            end

            dc = get_dc
            vm_folder = dc.vm_folder
            vm_folder.fetch!
            vm = vm_folder.items
                    .select{|k,v| v.item.name == template_name}
                    .values.first.item rescue nil

            if vm
                begin
                    vm.Destroy_Task.wait_for_completion
                    template = @item.CloneVM_Task(:folder => @item.parent,
                                                  :name   => template_name,
                                                  :spec   => clone_spec).wait_for_completion
                    template_ref = template._ref
                rescue
                    error = "Could not delete the existing template, please remove it manually from vCenter. Reason: #{e.message}"
                end
            else
                error = "Could not create the template clone. Reason: #{e.message}"
            end
        end

        return error, template_ref
    end

    # Linked Clone over existing template
    def create_delta_disks

        begin
            disks = @item['config.hardware.device'].grep(RbVmomi::VIM::VirtualDisk)
            disk_without_snapshots = disks.select { |x| x.backing.parent.nil? }
        rescue
            error = "Cannot extract existing disks on template."
            use_linked_clones = false
            return error, use_linked_clones
        end

        if !disk_without_snapshots.empty?

            begin
                if self['config.template']
                    @item.MarkAsVirtualMachine(:pool => get_rp, :host => self['runtime.host'])
                end
            rescue StandardError => e
                @item.MarkAsTemplate()
                error = "Cannot mark the template as a VirtualMachine. Not using linked clones. Reason: #{e.message}/#{e.backtrace}"
                use_linked_clones = false
                return error, use_linked_clones
            end

            begin
                spec = {}
                spec[:deviceChange] = []

                disk_without_snapshots.each do |disk|
                    remove_disk_spec = { :operation => :remove, :device => disk }
                    spec[:deviceChange] << remove_disk_spec

                    add_disk_spec = { :operation => :add,
                                    :fileOperation => :create,
                                    :device => disk.dup.tap { |x|
                                            x.backing = x.backing.dup
                                            x.backing.fileName = "[#{disk.backing.datastore.name}]"
                                            x.backing.parent = disk.backing
                                    }
                    }
                    spec[:deviceChange] << add_disk_spec
                end

                @item.ReconfigVM_Task(:spec => spec).wait_for_completion if !spec[:deviceChange].empty?
            rescue StandardError => e
                error = "Cannot create the delta disks on top of the template. Reason: #{e.message}."
                use_linked_clones = false
                return error, use_linked_clones
            end

            begin
                @item.MarkAsTemplate()
            rescue
                error = "Cannot mark the VirtualMachine as a template. Not using linked clones."
                use_linked_clones = false
                return error, use_linked_clones
            end

            error = nil
            use_linked_clones = true
            return error, use_linked_clones
        else
            # Template already has delta disks
            error = nil
            use_linked_clones = true
            return error, use_linked_clones
        end
    end

    ########################################################################
    # Import vcenter disks
    # @param type [object] contains the type of the object(:object) and identifier(:id)
    # @return error, template_disks
    ########################################################################
    def import_vcenter_disks(vc_uuid, dpool, ipool, type)
        disk_info = ""
        error = ""
        images = []

        begin
            lock #Lock import operation, to avoid concurrent creation of images

            ##ccr_ref = self["runtime.host.parent._ref"]
            dc = get_dc
            dc_ref = dc.item._ref

            #Get disks and info required
            vc_disks = get_vcenter_disks
            vc_disks.sort_by! {|d| d[:device].unitNumber}

            # Track allocated images
            allocated_images = []

            vc_disks.each do |disk|
                ds_ref = nil
                begin
                    ds_ref = disk[:datastore]._ref
                rescue
                    raise "The ISO #{disk[:path_wo_ds].name} cannot be found because the datastore was removed or deleted"
                end
                datastore_found = VCenterDriver::Storage.get_one_image_ds_by_ref_and_dc(ds_ref,
                                                                                        dc_ref,
                                                                                        vc_uuid,
                                                                                        dpool)
                if datastore_found.nil?
                    error = "\n    ERROR: datastore #{disk[:datastore].name}: has to be imported first as an image datastore!\n"

                    #Rollback delete disk images
                    allocated_images.each do |i|
                        i.delete
                    end

                    break
                end

                opts = {:persistent => vm? ? "YES":"NO"}
                image_import, image_name = VCenterDriver::Datastore.get_image_import_template(disk, ipool, type, datastore_found["ID"], opts, images)
                #Image is already in the datastore
                if image_import[:one]
                    # This is the disk info
                    disk_tmp = ""
                    disk_tmp << "DISK=[\n"
                    disk_tmp << "IMAGE_ID=\"#{image_import[:one]["ID"]}\",\n"
                    disk_tmp << "OPENNEBULA_MANAGED=\"NO\"\n"
                    disk_tmp << "]\n"
                    disk_info << disk_tmp

                elsif !image_import[:template].empty?

                    # Then the image is created as it's not in the datastore
                    one_i = VCenterDriver::VIHelper.new_one_item(OpenNebula::Image)
                    allocated_images << one_i
                    rc = one_i.allocate(image_import[:template], datastore_found['ID'].to_i, false)

                    if OpenNebula.is_error?(rc)
                        error = "    Error creating disk from template: #{rc.message}\n"
                        break
                    end

                    # Monitor image, we need READY state
                    one_i.info
                    start_time = Time.now

                    while one_i.state_str != "READY" and Time.now - start_time < 300
                        sleep 1
                        one_i.info
                    end


                    #Add info for One template
                    one_i.info
                    disk_info << "DISK=[\n"
                    disk_info << "IMAGE_ID=\"#{one_i["ID"]}\",\n"
                    disk_info << "OPENNEBULA_MANAGED=\"NO\"\n"
                    disk_info << "]\n"

                    images.push(image_name)
                end
            end

        rescue StandardError => e
            error = "\n    There was an error trying to create an image for disk in vcenter template. Reason: #{e.message}\n#{e.backtrace}"
        ensure
            unlock
            if !error.empty? && allocated_images
                #Rollback delete disk images
                allocated_images.each do |i|
                    i.delete
                end
            end
        end

        return error, disk_info, allocated_images
    end

    def create_ar(nic, with_id = false)
        ar_tmp = ""
        if nic[:mac] && nic[:ipv4] && nic[:ipv6]
            ar_tmp << "AR=[\n"
            ar_tmp << "AR_ID=0,\n" if with_id
            ar_tmp << "TYPE=\"IP4_6_STATIC\",\n"
            ar_tmp << "IP=\"#{nic[:ipv4]}\",\n"
            ar_tmp << "MAC=\"#{nic[:mac]}\",\n"
            ar_tmp << "IP6=\"#{nic[:ipv6]}\",\n"
            ar_tmp << "PREFIX_LENGTH=\"64\",\n"
            ar_tmp << "SIZE=\"1\"\n"
            ar_tmp << "]\n"
        elsif nic[:mac] && nic[:ipv6]
            ar_tmp << "AR=[\n"
            ar_tmp << "AR_ID=0,\n" if with_id
            ar_tmp << "TYPE=\"IP6_STATIC\",\n"
            ar_tmp << "MAC=\"#{nic[:mac]}\",\n"
            ar_tmp << "IP6=\"#{nic[:ipv6]}\",\n"
            ar_tmp << "PREFIX_LENGTH=\"64\",\n"
            ar_tmp << "SIZE=\"1\"\n"
            ar_tmp << "]\n"
        elsif nic[:mac] && nic[:ipv4]
            ar_tmp << "AR=[\n"
            ar_tmp << "AR_ID=0,\n" if with_id
            ar_tmp << "TYPE=\"IP4\",\n"
            ar_tmp << "IP=\"#{nic[:ipv4]}\",\n"
            ar_tmp << "MAC=\"#{nic[:mac]}\",\n"
            ar_tmp << "SIZE=\"1\"\n"
            ar_tmp << "]\n"
        else
            ar_tmp << "AR=[\n"
            ar_tmp << "AR_ID=0,\n" if with_id
            ar_tmp << "TYPE=\"ETHER\",\n"
            ar_tmp << "MAC=\"#{nic[:mac]}\",\n"
            ar_tmp << "SIZE=\"1\"\n"
            ar_tmp << "]\n"
        end
        ar_tmp
    end

    def save_ar_ids(network_found, nic, ar_ids, start_ids = false)
        if start_ids
            value = []
            arsNew = network_found.to_hash["VNET"]["AR_POOL"]["AR"]
            arsNew = [arsNew] if arsNew.class.to_s.eql? "Hash"
            last_id = 0
            if ar_ids.has_key?(nic[:net_ref])
                ref = nic[:net_ref]
                value = ar_ids[ref.to_s]
                value.insert(value.length, last_id.to_s)
                ar_ids.store(nic[:net_ref], value)
            else
                value.insert(value.length , last_id.to_s)
                ar_ids.store(nic[:net_ref], value)
            end
        else
            value = []
            arsNew = network_found.to_hash["VNET"]["AR_POOL"]["AR"]
            arsNew = [arsNew] if arsNew.class.to_s.eql? "Hash"
            last_id = arsNew.last["AR_ID"]
            if ar_ids.has_key?(nic[:net_ref])
                ref = nic[:net_ref]
                value = ar_ids[ref.to_s]
                value.insert(value.length, last_id)
                ar_ids.store(nic[:net_ref], value)
            else
                value.insert(value.length , last_id)
                ar_ids.store(nic[:net_ref], value)
            end
        end
        last_id
    end

    def find_ips_in_network(network, vm_object, nic)
        ipv4 = ipv6 = ""
        return if !vm_object.is_a?(VCenterDriver::VirtualMachine)
        network.info

        # Iterate over Retrieve vCenter VM NICs
        unless vm_object.item.guest.net.empty?
            vm_object.item.guest.net.each do |net|
                mac = net.macAddress
                if nic[:mac] == mac
                    next unless net.ipConfig
                    next if net.ipConfig.ipAddress.empty?
                    net.ipConfig.ipAddress.each do |ip_config|
                        ip = IPAddr.new(ip_config.ipAddress)
                        ar_array = network.to_hash['VNET']['AR_POOL']['AR']
                        ar_array = [ar_array] if ar_array.is_a?(Hash)
                        ipv4, ipv6 = find_ip_in_ar(ip, ar_array) if ar_array
                        break if ipv4 !="" or ipv6 != ""
                    end
                    break
                end
            end
        end
        return ipv4, ipv6
    end

    def find_ip_in_ar(ip, ar_array)
        ipv4 = ipv6 = ""
        ar_array.each do |ar|
            if ar.key?('IP') && ar.key?('IP_END')
                start_ip = IPAddr.new(ar['IP'])
                end_ip = IPAddr.new(ar['IP_END'])
                if ip.family == start_ip.family &&
                   ip.family == end_ip.family
                    if ip > start_ip && ip < end_ip
                        ipv4 = ip.to_s if ip.ipv4?
                        ipv6 = ip.to_s if ip.ipv6?
                    end
                end
            end
        end
        return ipv4, ipv6
    end

    # Get vSwitch of Standard PortGroup
    # If there is differents vSwitches returns the first.
    def vSwitch(vc_pg)
        vswitch = []
        vc_hosts = vc_pg.host
        vc_hosts.each do |vc_host|
            host_pgs = vc_host.configManager.networkSystem.networkInfo.portgroup
            host_pgs.each do |pg|
                if vc_pg.name == pg.spec.name
                    vswitch << pg.spec.vswitchName
                end
            end
        end
        vswitch.uniq!
        vswitch << 'Invalid configuration' if vswitch.length > 1
        vswitch.join(" / ")
    end

    def import_vcenter_nics(vc_uuid, npool, hpool, vcenter_instance_name,
                            template_ref, vm_object, vm_id=nil, dc_name=nil)
        nic_info = ''
        error = ''
        ar_ids = {}
        begin
            lock # Lock import operation, to avoid concurrent creation of networks

            if !dc_name
                dc = get_dc
                dc_name = dc.item.name
                dc_ref  = dc.item._ref
            end

            ccr_ref  = self["runtime.host.parent._ref"]
            ccr_name = self["runtime.host.parent.name"]

            # Get nics and info required
            vc_nics = vcenter_nics_hash

            # Track allocated networks for rollback
            allocated_networks = []

            # Track port groups duplicated in this VM
            duplicated_networks = []

            vc_nics.each do |nic|
                # Check if the network already exists
                network_found = VCenterDriver::VIHelper.find_by_ref(OpenNebula::VirtualNetworkPool,
                                                                'TEMPLATE/VCENTER_NET_REF',
                                                                 nic[:net_ref],
                                                                 vc_uuid,
                                                                 npool)
                # Network is already in OpenNebula
                if network_found
                    nic_tmp = "NIC=[\n"
                    nic_tmp << "NETWORK_ID=\"#{network_found["ID"]}\",\n"

                    if vm?
                        ipv4, ipv6 = find_ips_in_network(network_found, vm_object, nic)
                        ar_tmp = create_ar(nic)
                        network_found.add_ar(ar_tmp)
                        network_found.info
                        last_id = save_ar_ids(network_found, nic, ar_ids)

                        # This is the existing nic info
                        nic_tmp << "AR_ID=\"#{last_id}\",\n"
                        nic_tmp << "MAC=\"#{nic[:mac]}\",\n" if nic[:mac] and ipv4.empty? and ipv6.empty?
                        nic_tmp << "IP=\"#{ipv4}\"," if !ipv4.empty?
                        nic_tmp << "IP=\"#{ipv6}\"," if !ipv6.empty?
                        nic_tmp << "VCENTER_ADDITIONALS_IP4=\"#{nic[:ipv4_additionals]}\",\n" if nic[:ipv4_additionals]
                        nic_tmp << "VCENTER_IP6=\"#{nic[:ipv6]}\",\n" if nic[:ipv6]
                        nic_tmp << "IP6_GLOBAL=\"#{nic[:ipv6_global]}\",\n" if nic[:ipv6_global]
                        nic_tmp << "IP6_ULA=\"#{nic[:ipv6_ula]}\",\n" if nic[:ipv6_ula]
                        nic_tmp << "VCENTER_ADDITIONALS_IP6=\"#{nic[:ipv6_additionals]}\",\n" if nic[:ipv6_additionals]
                    end

                    nic_tmp << "OPENNEBULA_MANAGED=\"NO\"\n"
                    nic_tmp << "]\n"

                    nic_info << nic_tmp

                # Network not found
                else
                    config = {}
                    config[:refs] = nic[:refs]

                    # Then the network has to be created as it's not in OpenNebula
                    one_vn = VCenterDriver::VIHelper.new_one_item(OpenNebula::VirtualNetwork)

                    # Let's get the OpenNebula hosts ids associated to the clusters references
                    config[:one_ids] = nic[:refs].map do |ref|
                        VCenterDriver::VIHelper.find_by_ref(OpenNebula::HostPool,
                                                            "TEMPLATE/VCENTER_CCR_REF",
                                                            ref,
                                                            vc_uuid,
                                                            hpool)["CLUSTER_ID"] rescue -1
                    end

                    if vm?
                        unmanaged = "wild"
                    else
                        unmanaged = "template"
                    end

                    case nic[:pg_type]
                    # Distributed PortGroups
                    when VCenterDriver::Network::NETWORK_TYPE_DPG
                        config[:sw_name] = nic[:network].config.distributedVirtualSwitch.name
                        # For DistributedVirtualPortgroups there is networks and uplinks
                        config[:uplink] = false
                    # NSX-V PortGroups
                    when VCenterDriver::Network::NETWORK_TYPE_NSXV
                        config[:sw_name] = nic[:network].config.distributedVirtualSwitch.name
                        # For NSX-V ( is the same as DistributedVirtualPortgroups )
                        # there is networks and uplinks
                        config[:uplink] = false
                    # Standard PortGroups
                    when VCenterDriver::Network::NETWORK_TYPE_PG
                        # There is no uplinks for standard portgroups, so all Standard
                        # PortGroups are networks and no uplinks
                        config[:uplink] = false
                        config[:sw_name] = vSwitch(nic[:network])
                    # NSX-T PortGroups
                    when VCenterDriver::Network::NETWORK_TYPE_NSXT
                        config[:sw_name] = \
                        nic[:network].summary.opaqueNetworkType
                        # There is no uplinks for NSX-T networks, so all NSX-T networks
                        # are networks and no uplinks
                        config[:uplink] = false
                    else
                        raise "Unknown network type: #{nic[:pg_type]}"
                    end

                    import_opts = {
                        :network_name=>          nic[:net_name],
                        :sw_name=>               config[:sw_name],
                        :network_ref=>           nic[:net_ref],
                        :network_type=>          nic[:pg_type],
                        :ccr_ref=>               ccr_ref,
                        :ccr_name=>              ccr_name,
                        :vcenter_uuid=>          vc_uuid,
                        :vcenter_instance_name=> vcenter_instance_name,
                        :dc_name=>               dc_name,
                        :unmanaged=>             unmanaged,
                        :template_ref=>          template_ref,
                        :dc_ref=>                dc_ref,
                        :template_id=>           vm_id
                    }

                    # Prepare the Virtual Network template
                    one_vnet = VCenterDriver::Network.to_one_template(import_opts)

                    # always has to be created because of templates when they are instantiated
                    ar_tmp = ""
                    ar_tmp << "AR=[\n"
                    ar_tmp << "TYPE=\"ETHER\",\n"
                    ar_tmp << "SIZE=255\n"
                    ar_tmp << "]\n"

                    if vm?
                        ar_tmp << create_ar(nic, true)
                    end

                    one_vnet[:one] << ar_tmp
                    config[:one_object] = one_vnet[:one]
                    cluster_id = VCenterDriver::VIHelper.get_cluster_id(config[:one_ids])

                    one_vn = VCenterDriver::Network.create_one_network(config)
                    allocated_networks << one_vn
                    VCenterDriver::VIHelper.clean_ref_hash()
                    one_vn.info

                    nic_tmp = "NIC=[\n"
                    nic_tmp << "NETWORK_ID=\"#{one_vn.id}\",\n"

                    if vm?
                        last_id = save_ar_ids(one_vn, nic, ar_ids)
                        nic_tmp << "AR_ID=\"#{last_id}\",\n"
                        nic_tmp << "MAC=\"#{nic[:mac]}\",\n" if nic[:mac]
                        nic_tmp << "VCENTER_ADDITIONALS_IP4=\"#{nic[:ipv4_additionals]}\",\n" if nic[:ipv4_additionals]
                        nic_tmp << "VCENTER_IP6=\"#{nic[:ipv6]}\",\n" if nic[:ipv6]
                        nic_tmp << "IP6_GLOBAL=\"#{nic[:ipv6_global]}\",\n" if nic[:ipv6_global]
                        nic_tmp << "IP6_ULA=\"#{nic[:ipv6_ula]}\",\n" if nic[:ipv6_ula]
                        nic_tmp << "VCENTER_ADDITIONALS_IP6=\"#{nic[:ipv6_additionals]}\",\n" if nic[:ipv6_additionals]
                    end

                    nic_tmp << "OPENNEBULA_MANAGED=\"NO\"\n"
                    nic_tmp << "]\n"
                    nic_info << nic_tmp

                    # Refresh npool
                    npool.info_all
                end
            end
        rescue StandardError => e
            error = "\n    There was an error trying to create a virtual network to repesent a vCenter network for a VM or VM Template. Reason: #{e.message}"
        ensure
            unlock
            #Rollback, delete virtual networks
            if !error.empty? && allocated_networks
                allocated_networks.each do |n|
                    n.delete
                end
            end
        end

        return error, nic_info, ar_ids, allocated_networks
    end

    def get_vcenter_disk_key(unit_number, controller_key)

        key = nil

        @item["config.hardware.device"].each do |device|
            disk = {}

            if is_disk_or_iso?(device)
                disk[:device]    = device
                if device.controllerKey == controller_key &&
                   device.unitNumber == unit_number

                   key = device.key
                   break
                end
            end
        end

        return key
    end

    def get_vcenter_disks

        disks = []
        ide_controlled  = []
        sata_controlled = []
        scsi_controlled = []
        controller      = {}

        @item["config.hardware.device"].each do |device|
            disk = {}

            if device.is_a? RbVmomi::VIM::VirtualIDEController
                ide_controlled.concat(device.device)
                controller[device.key] = "ide#{device.busNumber}"
            end

            if device.is_a? RbVmomi::VIM::VirtualSATAController
                sata_controlled.concat(device.device)
                controller[device.key] = "sata#{device.busNumber}"
            end

            if device.is_a? RbVmomi::VIM::VirtualSCSIController
                scsi_controlled.concat(device.device)
                controller[device.key] = "scsi#{device.busNumber}"
            end

            if is_disk_or_iso?(device)
                disk[:device]    = device

                raise "datastore not found for VM's device" unless device.backing.datastore
                disk[:datastore] = device.backing.datastore
                disk[:path]      = device.backing.fileName
                disk[:path_wo_ds]= disk[:path].sub(/^\[(.*?)\] /, "")
                disk[:type]      = is_disk?(device) ? "OS" : "CDROM"
                disk[:key]       = device.key
                disk[:prefix]    = "hd" if ide_controlled.include?(device.key)
                disk[:prefix]    = "sd" if scsi_controlled.include?(device.key)
                disk[:prefix]    = "sd" if sata_controlled.include?(device.key)
                disk[:tag]       = "#{controller[device.controllerKey]}:#{device.unitNumber}"

                disks << disk
            end
        end

        return disks
    end

    def get_vcenter_nics
        nics = []
        @item.config.hardware.device.each do |device|
            nics << device if is_nic?(device)
        end

        nics
    end

    def identify_network(identifier, network)
        if network.class == RbVmomi::VIM::DistributedVirtualPortgroup
            if identifier == network.key
                return network
            else
                return nil
            end
        end

        if network.class == RbVmomi::VIM::Network
            if identifier == network
                return network
            else
                return nil
            end
        end

        if network.class == RbVmomi::VIM::OpaqueNetwork
            if identifier == network.summary.opaqueNetworkId
                return network
            else
                return nil
            end
        end
    end

    def retrieve_from_device(device)
        deviceNetwork = nil
        deviceNetworkId = nil
        # First search network corresponding this device
        # Distributed Networks and NSX-V Networks
        if device.backing[:port] != nil
            deviceNetworkId = device.backing.port.portgroupKey
        # Standard Networks
        elsif device.backing[:network] != nil
            deviceNetworkId = device.backing[:network]
        # NSX-T Opaque Networks
        elsif device.backing[:opaqueNetworkId] != nil
            deviceNetworkId = device.backing[:opaqueNetworkId]
        end

        # Check if networkId exists
        if deviceNetworkId == nil
            raise "Invalid or not supported network #{device.backing}"
        end

        # Matching between device and network objects
        @item.network.each do |net|
            deviceNetwork = identify_network(deviceNetworkId, net)
            break unless deviceNetwork.nil?
        end

        # Check network matching
        if deviceNetwork.nil?
            raise "\"#{device.deviceInfo.label}\" not match any known network"
        end

        res = {}

        res[:refs] = deviceNetwork.host.map do |h|
            h.parent._ref if h.parent
        end

        res[:net_name]  = deviceNetwork.name
        res[:net_ref]   = deviceNetwork._ref
        res[:pg_type]   = VCenterDriver::Network.get_network_type(deviceNetwork)
        res[:network]   = deviceNetwork

        res
    end

    def vcenter_nics_hash
        parse_live = ->(inets_raw) {
            h = nil
            begin
                h = inets_raw.to_h
            rescue NoMethodError
                h = {}
                inets_raw.each do |nic_dev|
                    h[nic_dev[0]] = nic_dev[1]
                end
            end

            return h
        }

        nics = []
        inets_raw = nil
        inets = {}

        @item['config.hardware.device'].each do |device|
            next unless is_nic?(device)

            nic = retrieve_from_device(device)
            nic[:mac] = device.macAddress rescue nil
            if vm?
                if online?
                    inets_raw ||= @item['guest.net'].map.with_index {|x, _| [x.macAddress, x]}
                    inets = parse_live.call(inets_raw) if inets.empty?

                    if !inets[nic[:mac]].nil?
                        ipAddresses = inets[nic[:mac]].ipConfig.ipAddress rescue nil
                    end

                    if !ipAddresses.nil? && !ipAddresses.empty?
                        nic[:ipv4], nic[:ipv4_additionals] = nil
                        nic[:ipv6], nic[:ipv6_ula], nic[:ipv6_global], nic[:ipv6_additionals] = nil
                        fill_nic(ipAddresses, nic)
                    end
                end
            end
            nics << nic
        end

        return nics
    end

    def fill_nic(ipAddresses, nic)
        for i in 0...ipAddresses.length
            ip = ipAddresses[i].ipAddress
            if ip =~ Resolv::IPv4::Regex
                if nic[:ipv4]
                    if nic[:ipv4_additionals]
                        nic[:ipv4_additionals] += ',' + ip
                    else
                        nic[:ipv4_additionals] = ip
                    end
                else
                    nic[:ipv4] = ip
                end
            elsif ipAddresses[i].ipAddress =~ Resolv::IPv6::Regex
                if get_ipv6_prefix(ip, 3) == '2000'
                    if nic[:ipv6_global]
                        if nic[:ipv6_additionals]
                            nic[:ipv6_additionals] += ',' + ip
                        else
                            nic[:ipv6_additionals] = ip
                        end
                    else
                        nic[:ipv6_global] = ip
                    end
                elsif get_ipv6_prefix(ip, 10) == 'fe80'
                    nic[:ipv6] = ip
                elsif get_ipv6_prefix(ip, 7) == 'fc00'
                    if nic[:ipv6_ula]
                        if nic[:ipv6_additionals]
                            nic[:ipv6_additionals] += ',' + ip
                        else
                            nic[:ipv6_additionals] = ip
                        end
                    else
                        nic[:ipv6_ula] = ip
                    end
                end
            end
        end
    end

    def get_ipv6_prefix(ipv6, prefix_length)

        ipSlice = ipv6.split(":").map{ |elem| elem.hex }.map{ |elem|

            int, dec = elem.divmod(1)
            bin = "#{int.to_s(2)}"

            while dec > 0
                int, dec = (dec * 2).divmod(1)
                bin << int.to_s
            end

            elem = bin
        }.map{ |elem| elem.rjust(16, '0') }

        ipChain = ipSlice.join
        prefix = ipChain[0, prefix_length]

        cont = 0
        limit = prefix.length
        index = 0
        slices = []

        while cont < limit
            slices[index] = prefix.slice(cont, 4)
            slices[index] = slices[index].ljust(4, '0')
            index +=1
            cont+=4
        end

        finalPrefix = slices.map{|elem| "%0x" % elem.to_i(2) }.join.ljust(4, '0')
        return finalPrefix
    end

    #  Checks if a RbVmomi::VIM::VirtualDevice is a disk or a cdrom
    def is_disk_or_cdrom?(device)
        is_disk  = !(device.class.ancestors.index(RbVmomi::VIM::VirtualDisk)).nil?
        is_cdrom = !(device.class.ancestors.index(RbVmomi::VIM::VirtualCdrom)).nil?
        is_disk || is_cdrom
    end

    #  Checks if a RbVmomi::VIM::VirtualDevice is a disk or an iso file
    def is_disk_or_iso?(device)
        is_disk  = !(device.class.ancestors.index(RbVmomi::VIM::VirtualDisk)).nil?
        is_iso = device.backing.is_a? RbVmomi::VIM::VirtualCdromIsoBackingInfo
        is_disk || is_iso
    end

    #  Checks if a RbVmomi::VIM::VirtualDevice is a disk
    def is_disk?(device)
        !(device.class.ancestors.index(RbVmomi::VIM::VirtualDisk)).nil?
    end

    def is_cdrom?(device)
        device.backing.is_a? RbVmomi::VIM::VirtualCdromIsoBackingInfo
    end

    #  Checks if a RbVmomi::VIM::VirtualDevice is a network interface
    def is_nic?(device)
        !device.class.ancestors.index(RbVmomi::VIM::VirtualEthernetCard).nil?
    end

    # @return RbVmomi::VIM::ResourcePool, first resource pool in cluster
    def get_rp
        self['runtime.host.parent.resourcePool']
    end

    def get_esx_name
        self['runtime.host.name']
    end

    def vm_to_one(vm_name)
        str = "NAME   = \"#{vm_name}\"\n"\
              "CPU    = \"#{@vm_info["config.hardware.numCPU"]}\"\n"\
              "vCPU   = \"#{@vm_info["config.hardware.numCPU"]}\"\n"\
              "MEMORY = \"#{@vm_info["config.hardware.memoryMB"]}\"\n"\
              "HYPERVISOR = \"vcenter\"\n"\
              "CONTEXT = [\n"\
              "    NETWORK = \"YES\",\n"\
              "    SSH_PUBLIC_KEY = \"$USER[SSH_PUBLIC_KEY]\"\n"\
              "]\n"\
              "VCENTER_INSTANCE_ID =\"#{@vm_info[:vc_uuid]}\"\n"\
              "VCENTER_CCR_REF =\"#{@vm_info[:cluster_ref]}\"\n"

        str << "IMPORT_VM_ID =\"#{self["_ref"]}\"\n"
        @state = 'POWEROFF' if @state == 'd'
        str << "IMPORT_STATE =\"#{@state}\"\n"

         # Get DS information
        if !@vm_info["datastore"].nil?
           !@vm_info["datastore"].last.nil? &&
           !@vm_info["datastore"].last._ref.nil?
            ds_ref = vm_template_ds_ref
            str << "VCENTER_DS_REF = \"#{ds_ref}\"\n"
       end

        vnc_port = nil
        keymap = VCenterDriver::VIHelper.get_default("VM/TEMPLATE/GRAPHICS/KEYMAP")

        @vm_info["config.extraConfig"].select do |xtra|
            if xtra[:key].downcase=="remotedisplay.vnc.port"
                vnc_port = xtra[:value]
            end

            if xtra[:key].downcase=="remotedisplay.vnc.keymap"
                keymap = xtra[:value]
            end
        end

        if !@vm_info["config.extraConfig"].empty?
            str << "GRAPHICS = [\n"\
                   "  TYPE     =\"vnc\",\n"
            str << "  PORT     =\"#{vnc_port}\",\n" if vnc_port
            str << "  KEYMAP   =\"#{keymap}\",\n" if keymap
            str << "  LISTEN   =\"0.0.0.0\"\n"
            str << "]\n"
        end

        if !@vm_info["config.annotation"] || @vm_info["config.annotation"].empty?
            str << "DESCRIPTION = \"vCenter Template imported by OpenNebula" \
                " from Cluster #{@vm_info["cluster_name"]}\"\n"
        else
            notes = @vm_info["config.annotation"].gsub("\\", "\\\\").gsub("\"", "\\\"")
            str << "DESCRIPTION = \"#{notes}\"\n"
        end

        case @vm_info["guest.guestFullName"]
            when /CentOS/i
                str << "LOGO=images/logos/centos.png\n"
            when /Debian/i
                str << "LOGO=images/logos/debian.png\n"
            when /Red Hat/i
                str << "LOGO=images/logos/redhat.png\n"
            when /Ubuntu/i
                str << "LOGO=images/logos/ubuntu.png\n"
            when /Windows XP/i
                str << "LOGO=images/logos/windowsxp.png\n"
            when /Windows/i
                str << "LOGO=images/logos/windows8.png\n"
            when /Linux/i
                str << "LOGO=images/logos/linux.png\n"
        end

        return str
    end

    #Gets MOREF from Datastore used by the VM. It validates
    #the selected DS is not only used to host swap.
    def vm_template_ds_ref
        begin
            ds_ref = nil
            if @vm_info["datastore"].length > 1
                swap_path = ""
                @vm_info["config.extraConfig"].each do |element|
                    if element.key == "sched.swap.derivedName"
                        swap_path = element.value
                    end
                end
                @vm_info["datastore"].each do |datastore|
                    path = datastore.summary.url.sub(/ds:\/\/\/*/, "")
                    if !swap_path.include?(path) && !datastore._ref.nil?
                        ds_ref = datastore._ref
                        break
                    end
                end
            elsif @vm_info["datastore"].length == 1
                if !@vm_info["datastore"].first._ref.nil?
                    ds_ref = @vm_info["datastore"].first._ref
                end
            end

	        return ds_ref
        rescue StandardError => e
            error = "Could not find DATASTORE for this VM. Reason: #{e.message}"

	        return error
        end
    end


    def self.template_to_one(template, vc_uuid, ccr_ref, ccr_name, import_name, host_id)

        num_cpu, memory, annotation, guest_fullname = template.item.collect("config.hardware.numCPU","config.hardware.memoryMB","config.annotation","guest.guestFullName")

        str = "NAME   = \"#{import_name}\"\n"\
              "CPU    = \"#{num_cpu}\"\n"\
              "vCPU   = \"#{num_cpu}\"\n"\
              "MEMORY = \"#{memory}\"\n"\
              "HYPERVISOR = \"vcenter\"\n"\
              "CONTEXT = [\n"\
              "    NETWORK = \"YES\",\n"\
              "    SSH_PUBLIC_KEY = \"$USER[SSH_PUBLIC_KEY]\"\n"\
              "]\n"\
              "VCENTER_INSTANCE_ID =\"#{vc_uuid}\"\n"

        str << "VCENTER_TEMPLATE_REF =\"#{template["_ref"]}\"\n"
        str << "VCENTER_CCR_REF =\"#{ccr_ref}\"\n"

        str << "GRAPHICS = [\n"\
               "  TYPE     =\"vnc\",\n"
        str << "  LISTEN   =\"0.0.0.0\"\n"
        str << "]\n"

        if annotation.nil? || annotation.empty?
            str << "DESCRIPTION = \"vCenter Template imported by OpenNebula" \
                " from Cluster #{ccr_name}\"\n"
        else
            notes = annotation.gsub("\\", "\\\\").gsub("\"", "\\\"")
            str << "DESCRIPTION = \"#{notes}\"\n"
        end

        case guest_fullname
            when /CentOS/i
                str << "LOGO=images/logos/centos.png\n"
            when /Debian/i
                str << "LOGO=images/logos/debian.png\n"
            when /Red Hat/i
                str << "LOGO=images/logos/redhat.png\n"
            when /Ubuntu/i
                str << "LOGO=images/logos/ubuntu.png\n"
            when /Windows XP/i
                str << "LOGO=images/logos/windowsxp.png\n"
            when /Windows/i
                str << "LOGO=images/logos/windows8.png\n"
            when /Linux/i
                str << "LOGO=images/logos/linux.png\n"
        end

        return str
    end

    def self.get_xml_template(template, vcenter_uuid, vi_client, vcenter_instance_name=nil, dc_name=nil, rp_cache={})
        begin
            template_ref      = template['_ref']
            template_name     = template["name"]
            template_ccr      = template['runtime.host.parent']
            template_ccr_ref  = template_ccr._ref
            template_ccr_name = template_ccr.name

            # Set vcenter instance name
            vcenter_instance_name = vi_client.vim.host if !vcenter_instance_name

            # Get datacenter info
            if !dc_name
                dc = get_dc
                dc_name = dc.item.name
            end

            #Get resource pools and generate a list
            if !rp_cache[template_ccr_name]
                tmp_cluster = VCenterDriver::ClusterComputeResource.new_from_ref(template_ccr_ref, vi_client)
                rp_list = tmp_cluster.get_resource_pool_list
                rp = ""
                if !rp_list.empty?
                    rp_name_list = []
                    rp_list.each do |rp_hash|
                        rp_name_list << rp_hash[:name]
                    end
                    rp =  "O|list|Which resource pool you want this VM to run in? "
                    rp << "|#{rp_name_list.join(",")}" #List of RP
                    rp << "|#{rp_name_list.first}" #Default RP
                end
                rp_cache[template_ccr_name] = {}
                rp_cache[template_ccr_name][:rp] = rp
                rp_cache[template_ccr_name][:rp_list] = rp_list
            end
            rp      = rp_cache[template_ccr_name][:rp]
            rp_list = rp_cache[template_ccr_name][:rp_list]


            # Determine the location path for the template
            vcenter_template = VCenterDriver::VirtualMachine.new_without_id(vi_client, template_ref)
            item = vcenter_template.item
            folders = []
            while !item.instance_of? RbVmomi::VIM::Datacenter
                item = item.parent
                if !item.instance_of? RbVmomi::VIM::Datacenter
                    folders << item.name if item.name != "vm"
                end
                raise "Could not find the templates parent location" if item.nil?
            end
            location = folders.reverse.join("/")
            location = "/" if location.empty?

            # Generate a crypto hash for the template name and take the first 12 chars
            import_name = VCenterDriver::VIHelper.one_name(OpenNebula::TemplatePool, template_name, template_ref+vcenter_uuid)

            template_name     = template_name.tr("\u007F", "")
            template_ccr_name = template_ccr_name.tr("\u007F", "")

            # Prepare the Hash that will be used by importers to display
            # the object being imported
            one_tmp = {}
            one_tmp[:name]                  = import_name
            one_tmp[:ref]                   = template_ref
            one_tmp[:dc_name]               = dc_name
            one_tmp[:template_name]         = template_name
            one_tmp[:sunstone_template_name]= "#{template_name} [ Cluster: #{template_ccr_name} - Template location: #{location} ]"
            one_tmp[:template_location]     = location
            one_tmp[:vcenter_ccr_ref]       = template_ccr_ref
            one_tmp[:vcenter_ref]           = template_ref
            one_tmp[:vcenter_instance_uuid] = vcenter_uuid
            one_tmp[:cluster_name]          = template_ccr_name
            one_tmp[:rp]                    = rp
            one_tmp[:rp_list]               = rp_list
            one_tmp[:template]              = template
            one_tmp[:import_disks_and_nics] = true # By default we import disks and nics


            # Get the host ID of the OpenNebula host which represents the vCenter Cluster
            host_id = nil
            one_host = VCenterDriver::VIHelper.find_by_ref(OpenNebula::HostPool,
                                                           "TEMPLATE/VCENTER_CCR_REF",
                                                           template_ccr_ref,
                                                           vcenter_uuid)
            host_id    = one_host["ID"]
            cluster_id = one_host["CLUSTER_ID"]
            raise "Could not find the host's ID associated to template being imported" if !host_id

            # Get the OpenNebula's template hash
            one_tmp[:one] = template_to_one(template, vcenter_uuid, template_ccr_ref, template_ccr_name, import_name, host_id)
            return one_tmp
        rescue StandardError => e
            return nil
        end
    end

    # TODO check with uuid
    def self.new_from_ref(ref, vi_client)
        self.new(RbVmomi::VIM::VirtualMachine.new(vi_client.vim, ref), vi_client)
    end

end

class VmImporter < VCenterDriver::VcImporter

    def initialize(one_client, vi_client)
        super(one_client, vi_client)
        @one_class = OpenNebula::Template

        @defaults = {
            linked_clone: '0',
            copy: '0',
            name: '',
            folder: '',
            resourcepool: [],
            type: ''
        }

    end

    def get_list(args = {})
        dc_folder = VCenterDriver::DatacenterFolder.new(@vi_client)

        # Get OpenNebula's templates pool
        tpool = VCenterDriver::VIHelper.one_pool(OpenNebula::TemplatePool, false)
        if tpool.respond_to?(:message)
            raise "Could not get OpenNebula TemplatePool: #{tpool.message}"
        end

        @list = dc_folder.get_unimported_templates(@vi_client, tpool)
    end


    def rp_opts(type, rps)
        str = ""

        return str if (type == "default") || rps.empty?


        if (type == "fixed")
            str << "VCENTER_RESOURCE_POOL=\"#{rps}\"\n"
        else
            default = rps.first
            rps_str = rps.join(',')

            str << "USER_INPUTS=["
            str << "VCENTER_RESOURCE_POOL=\"M|list|resource pool list|#{rps_str}|#{default}\""
            str << "]"
        end

        return str
    end

    def import(selected)
        opts = @info[selected[:ref]][:opts]
        working_template = selected

        vcenter = selected[:vcenter]
        vc_uuid = selected[:vcenter_instance_uuid]
        dc      = selected[:dc_name]

        linked_clone     = opts[:linked_clone] == '1'
        copy             = opts[:copy] == '1'
        deploy_in_folder = !opts[:folder].empty?

        res = {id: [], name: selected[:name]}
        dpool, ipool, npool, hpool = create_pools

        template = VCenterDriver::Template.new_from_ref(selected[:vcenter_ref], @vi_client)
        # Linked clones and copy preparation
        if linked_clone
            if copy # reached this point we need to delete the template if something go wrong
                error, template_copy_ref = selected[:template].create_template_copy(opts[:name])
                raise "There is a problem creating creating your copy: #{error}" unless template_copy_ref

                template = VCenterDriver::Template.new_from_ref(template_copy_ref, @vi_client)
                @rollback << Raction.new(template, :delete_template)

                one_template = VCenterDriver::Template.get_xml_template(template, vc_uuid, @vi_client, vcenter, dc)
                raise "There is a problem obtaining info from your template's copy" unless one_template
                working_template = one_template
            end

            lc_error, use_lc = template.create_delta_disks
            raise "Something was wront with create delta disk operation" if lc_error
            working_template[:one] << "\nVCENTER_LINKED_CLONES=\"YES\"\n" if use_lc
        end

        working_template[:one] << "VCENTER_VM_FOLDER=\"#{opts[:folder]}\"\n" if deploy_in_folder

        working_template[:one] << "VCENTER_TEMPLATE_NAME=\"#{selected[:name]}\"\n"

        create(working_template[:one]) do |one_object, id|
            res[:id] << id

            type = {:object => "template", :id => id}
            error, template_disks, allocated_images = template.import_vcenter_disks(vc_uuid, dpool, ipool, type)

            if allocated_images
                #rollback stack
                allocated_images.reverse.each do |i|
                    @rollback.unshift(Raction.new(i, :delete))
                end
            end
            raise error if !error.empty?

            working_template[:one] << template_disks

            template_moref = template_copy_ref ? template_copy_ref : selected[:vcenter_ref]

			error, template_nics, ar_ids, allocated_nets = template.import_vcenter_nics(vc_uuid,
                                                                            npool,
                                                                            hpool,
                                                                            vcenter,
                                                                            template_moref,
                                                                            nil,
                                                                            id,
                                                                            dc)

            if allocated_nets
                #rollback stack
                allocated_nets.reverse.each do |n|
                    @rollback.unshift(Raction.new(n, :delete))
                end
            end
            raise error if !error.empty?

            working_template[:one] << template_nics
            working_template[:one] << rp_opts(opts[:type], opts[:resourcepool])

            one_object.update(working_template[:one])
        end

        return res
    end

    def attr
        "TEMPLATE/VCENTER_TEMPLATE_REF"
    end
end

end
