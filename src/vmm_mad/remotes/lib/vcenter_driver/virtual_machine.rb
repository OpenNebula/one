module VCenterDriver
require 'digest'
class VirtualMachineFolder
    attr_accessor :item, :items

    def initialize(item)
        @item = item
        @items = {}
    end

    ########################################################################
    # Builds a hash with Datastore-Ref / Datastore to be used as a cache
    # @return [Hash] in the form
    #   { ds_ref [Symbol] => Datastore object }
    ########################################################################
    def fetch!
        VIClient.get_entities(@item, "VirtualMachine").each do |item|
            item_name = item._ref
            @items[item_name.to_sym] = VirtualMachine.new(item)
        end
    end

    def fetch_templates!
        VIClient.get_entities(@item, "VirtualMachine").each do |item|
            if item.config.template
                item_name = item._ref
                @items[item_name.to_sym] = Template.new(item)
            end
        end
    end

    ########################################################################
    # Returns a Datastore. Uses the cache if available.
    # @param ref [Symbol] the vcenter ref
    # @return Datastore
    ########################################################################
    def get(ref)
        if !@items[ref.to_sym]
            rbvmomi_dc = RbVmomi::VIM::Datastore.new(@item._connection, ref)
            @items[ref.to_sym] = Datastore.new(rbvmomi_dc)
        end

        @items[ref.to_sym]
    end
end # class VirtualMachineFolder

class Template

    attr_accessor :item

    include Memoize

    def initialize(item=nil, vi_client=nil)
        @item = item
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
        end
    end

    def wild?
        self.class == VCenterDriver::VirtualMachine
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
        rescue Exception => e
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
            rescue Exception => e
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
            rescue Exception => e
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
    # @param type [object] contains the type of the object(:object) and identificator(:id)
    # @return error, template_disks
    ########################################################################
    def import_vcenter_disks(vc_uuid, dpool, ipool, type,  sunstone=false)
        disk_info = ""
        error = ""
        sunstone_disk_info = []

        begin
            lock #Lock import operation, to avoid concurrent creation of images

            ##ccr_ref = self["runtime.host.parent._ref"]
            dc = get_dc
            dc_ref = dc.item._ref

            #Get disks and info required
            vc_disks = get_vcenter_disks

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

                opts = {:persistent => wild? ? "YES":"NO"}
                image_import = VCenterDriver::Datastore.get_image_import_template(disk, ipool, type, datastore_found["ID"], opts)
                #Image is already in the datastore
                if image_import[:one]
                    # This is the disk info
                    disk_tmp = ""
                    disk_tmp << "DISK=[\n"
                    disk_tmp << "IMAGE_ID=\"#{image_import[:one]["ID"]}\",\n"
                    disk_tmp << "OPENNEBULA_MANAGED=\"NO\"\n"
                    disk_tmp << "]\n"
                    if sunstone
                        sunstone_disk = {}
                        sunstone_disk[:type] = "EXISTING_DISK"
                        sunstone_disk[:image_tmpl] = disk_tmp
                        sunstone_disk_info << sunstone_disk
                    else
                        disk_info << disk_tmp
                    end

                elsif !image_import[:template].empty?

                    if sunstone
                        sunstone_disk = {}
                        sunstone_disk[:type] = "NEW_DISK"
                        sunstone_disk[:image_tmpl] = image_import[:template]
                        sunstone_disk[:ds_id] = datastore_found['ID'].to_i
                        sunstone_disk_info << sunstone_disk
                    else
                        # Then the image is created as it's not in the datastore
                        one_i = VCenterDriver::VIHelper.new_one_item(OpenNebula::Image)
                        allocated_images << one_i
                        rc = one_i.allocate(image_import[:template], datastore_found['ID'].to_i)

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
                    end
                end
            end

        rescue Exception => e
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

        return error, sunstone_disk_info, allocated_images if sunstone

        return error, disk_info, allocated_images if !sunstone

    end

    def import_vcenter_nics(vc_uuid, npool, hpool, vcenter_instance_name,
                            template_ref, wild, sunstone=false, vm_name=nil, vm_id=nil, dc_name=nil)
        nic_info = ""
        error = ""
        sunstone_nic_info = []

        begin
            lock #Lock import operation, to avoid concurrent creation of networks

            if !dc_name
                dc = get_dc
                dc_name = dc.item.name
                dc_ref  = dc.item._ref
            end

            ccr_ref  = self["runtime.host.parent._ref"]
            ccr_name = self["runtime.host.parent.name"]

            #Get disks and info required
            vc_nics = get_vcenter_nics

            # Track allocated networks for rollback
            allocated_networks = []

            # Track port groups duplicated in this VM
            duplicated_networks = []

            vc_nics.each do |nic|
                # Check if the network already exists
                network_found = VCenterDriver::VIHelper.find_by_ref(OpenNebula::VirtualNetworkPool,
                                                                "TEMPLATE/VCENTER_NET_REF",
                                                                 nic[:net_ref],
                                                                 vc_uuid,
                                                                 npool)

                #Network is already in OpenNebula
                if network_found

                    # Create the new size 1 AR
                    ar_tmp = ""
                    ar_tmp << "AR=[\n"
                    ar_tmp << "TYPE=\"ETHER\",\n"
                    if wild && nic[:mac]
                        ar_tmp << "MAC=\"#{nic[:mac]}\",\n"
                        ar_tmp << "SIZE=\"1\"\n"
                    else
                        ar_tmp << "SIZE=\"255\"\n"
                    end
                    ar_tmp << "]\n"
                    network_found.add_ar(ar_tmp)

                    # This is the existing nic info
                    nic_tmp = ""
                    nic_tmp << "NIC=[\n"
                    nic_tmp << "NETWORK_ID=\"#{network_found["ID"]}\",\n"
                    nic_tmp << "MAC=\"#{nic[:mac]}\",\n" if wild && nic[:mac]
                    nic_tmp << "OPENNEBULA_MANAGED=\"NO\"\n"
                    nic_tmp << "]\n"

                    if sunstone
                        sunstone_nic = {}
                        sunstone_nic[:type] = "EXISTING_NIC"
                        sunstone_nic[:network_tmpl] = nic_tmp
                        sunstone_nic_info << sunstone_nic
                    else
                        nic_info << nic_tmp
                    end
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

                    # We have to know if we're importing nics from a wild vm
                    # or from a template
                    if wild
                        unmanaged = "wild"
                        ar_size   = 1
                    else
                        unmanaged = "template"
                        ar_size   = 255
                    end

                    import_opts = {
                        :network_name=>          nic[:net_name],
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
                        :vm_or_template_name=>   vm_name,
                        :template_id=>           vm_id
                    }

                    # Prepare the Virtual Network template
                    one_vnet = VCenterDriver::Network.to_one_template(import_opts)

                    # By default add an ethernet range to network size 255
                    ar_str = ""
                    ar_str << "AR=[\n"
                    ar_str << "TYPE=\"ETHER\",\n"
                    ar_str << "MAC=\"#{nic[:mac]}\",\n" if wild && nic[:mac]
                    ar_str << "SIZE=\"#{ar_size}\"\n"
                    ar_str << "]\n"
                    one_vnet[:one] << ar_str
                    config[:one_object] = one_vnet[:one]

                    cluster_id = VCenterDriver::VIHelper.get_cluster_id(config[:one_ids])
                    if sunstone
                        if !duplicated_networks.include?(nic[:net_name])
                            sunstone_nic = {}
                            sunstone_nic[:type] = "NEW_NIC"
                            sunstone_nic[:network_name] = nic[:net_name]
                            sunstone_nic[:network_tmpl] = one_vnet[:one]
                            sunstone_nic[:one_cluster_id] = cluster_id.to_i
                            sunstone_nic_info << sunstone_nic
                            duplicated_networks << nic[:net_name]
                        else
                            sunstone_nic = {}
                            sunstone_nic[:type] = "DUPLICATED_NIC"
                            sunstone_nic[:network_name] = nic[:net_name]
                            sunstone_nic_info << sunstone_nic
                        end
                    else
                        one_vn = VCenterDriver::Network.create_one_network(config)
                        allocated_networks << one_vn
                        VCenterDriver::VIHelper.clean_ref_hash()

                        # Add info for One template
                        one_vn.info
                        nic_info << "NIC=[\n"
                        nic_info << "NETWORK_ID=\"#{one_vn["ID"]}\",\n"
                        nic_info << "OPENNEBULA_MANAGED=\"NO\"\n"
                        nic_info << "]\n"

                        # Refresh npool
                        npool.info_all
                    end

                end
            end

        rescue Exception => e
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

        return error, nic_info, allocated_networks if !sunstone

        return error, sunstone_nic_info, allocated_networks if sunstone
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

        @item["config.hardware.device"].each do |device|
            disk = {}

            if device.is_a? RbVmomi::VIM::VirtualIDEController
                ide_controlled.concat(device.device)
            end

            if device.is_a? RbVmomi::VIM::VirtualSATAController
                sata_controlled.concat(device.device)
            end

            if device.is_a? RbVmomi::VIM::VirtualSCSIController
                scsi_controlled.concat(device.device)
            end

            if is_disk_or_iso?(device)
                disk[:device]    = device
                disk[:datastore] = device.backing.datastore
                disk[:path]      = device.backing.fileName
                disk[:path_wo_ds]= disk[:path].sub(/^\[(.*?)\] /, "")
                disk[:type]      = is_disk?(device) ? "OS" : "CDROM"
                disk[:key]       = device.key
                disk[:prefix]    = "hd" if ide_controlled.include?(device.key)
                disk[:prefix]    = "sd" if scsi_controlled.include?(device.key)
                disk[:prefix]    = "sd" if sata_controlled.include?(device.key)
                disks << disk
            end
        end

        return disks
    end

    def get_vcenter_nics
        nics = []
        @item["config.hardware.device"].each do |device|
            nic     = {}
            network = nil
            if is_nic?(device)

                # Let's find out if it is a standard or distributed network
                # If distributed, it needs to be instantitaed from the ref
                if device.backing.is_a? RbVmomi::VIM::VirtualEthernetCardDistributedVirtualPortBackingInfo
                    if device.backing.port.portKey.match(/^[a-z]+-\d+$/)
                        ref = device.backing.port.portKey
                    elsif device.backing.port.portgroupKey.match(/^[a-z]+-\d+$/)
                        ref = device.backing.port.portgroupKey
                    else
                        raise "Cannot get hold of Network for device #{device}"
                    end

                    network = RbVmomi::VIM::Network.new(@vi_client.vim, ref)
                else
                    network = device.backing.network
                end
                nic[:refs] = network.host.map do |h|
                    h.parent._ref if h.parent
                end

                nic[:mac]       = device.macAddress rescue nil
                nic[:net_name]  = network.name
                nic[:net_ref]   = network._ref
                nic[:pg_type]   = VCenterDriver::Network.get_network_type(device)

                nics << nic
            end
        end
        return nics
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

    #  Checks if a RbVmomi::VIM::VirtualDevice is a network interface
    def is_nic?(device)
        !device.class.ancestors.index(RbVmomi::VIM::VirtualEthernetCard).nil?
    end

    # @return RbVmomi::VIM::ResourcePool, first resource pool in cluster
    def get_rp
        self['runtime.host.parent.resourcePool']
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
        str << "IMPORT_STATE =\"#{@state}\"\n"

        # Get DS information
        str << "VCENTER_DS_REF = \"#{@vm_info["datastore"].first._ref}\"\n"

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
            sha256            = Digest::SHA256.new
            full_name         = "#{template_name} - #{template_ccr_name} [#{vcenter_instance_name} - #{dc_name}]_#{location}"
            template_hash     = sha256.hexdigest(full_name)[0..11]
            template_name     = template_name.tr("\u007F", "")
            template_ccr_name = template_ccr_name.tr("\u007F", "")
            import_name       = "#{template_name} - #{template_ccr_name} #{template_hash}"

            # Prepare the Hash that will be used by importers to display
            # the object being imported
            one_tmp = {}
            one_tmp[:name]                  = import_name
            one_tmp[:template_name]         = template_name
            one_tmp[:sunstone_template_name]= "#{template_name} [ Cluster: #{template_ccr_name} - Template location: #{location} ]"
            one_tmp[:template_hash]         = template_hash
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
        rescue Exception => e
            return nil
        end
    end

    # TODO check with uuid
    def self.new_from_ref(ref, vi_client)
        self.new(RbVmomi::VIM::VirtualMachine.new(vi_client.vim, ref), vi_client)
    end

end

class VirtualMachine < Template
    VM_PREFIX_DEFAULT = "one-$i-"

    POLL_ATTRIBUTE    = OpenNebula::VirtualMachine::Driver::POLL_ATTRIBUTE
    VM_STATE          = OpenNebula::VirtualMachine::Driver::VM_STATE

    VM_SHUTDOWN_TIMEOUT = 600 #10 minutes til poweroff hard

    attr_accessor :item, :vm_id

    attr_accessor :vm_info

    include Memoize

    def initialize(vi_client, ref, one_id)
        if (ref)
            @item = RbVmomi::VIM::VirtualMachine.new(vi_client.vim, ref)
        end

        @vi_client = vi_client
        @vm_id = one_id
        @locking = true
        @vm_info = nil
    end

    ############################################################################
    ############################################################################

    # Attributes that must be defined when the VM does not exist in vCenter
    attr_accessor :vi_client

    # these have their own getter (if they aren't set, we can set them
    # dynamically)
    attr_writer :one_item
    attr_writer :host
    attr_writer :target_ds_ref

    ############################################################################
    ############################################################################

    # The OpenNebula VM
    # @return OpenNebula::VirtualMachine or XMLElement
    def one_item
        if !@one_item
            if @vm_id != -1
                @one_item = VIHelper.one_item(OpenNebula::VirtualMachine, @vm_id)
            else
                raise "VCenterDriver::Virtualmachine: OpenNebula ID is mandatory for this vm!"
            end
        end

        @one_item
    end

    # The OpenNebula host
    # @return OpenNebula::Host or XMLElement
    def host
        if @host.nil?
            if one_item.nil?
                raise "'one_item' must be previously set to be able to " <<
                      "access the OpenNebula host."
            end

            host_id = one_item["HISTORY_RECORDS/HISTORY[last()]/HID"]
            raise "No valid host_id found." if host_id.nil?

            @host = VIHelper.one_item(OpenNebula::Host, host_id)
        end

        @host
    end

    # Target Datastore VMware reference getter
    # @return
    def target_ds_ref
        if @target_ds_ref.nil?
            if one_item.nil?
                raise "'one_item' must be previously set to be able to " <<
                      "access the target Datastore."
            end

            target_ds_id = one_item["HISTORY_RECORDS/HISTORY[last()]/DS_ID"]
            raise "No valid target_ds_id found." if target_ds_id.nil?

            target_ds = VCenterDriver::VIHelper.one_item(OpenNebula::Datastore,
                                                         target_ds_id)

            @target_ds_ref = target_ds['TEMPLATE/VCENTER_DS_REF']
        end

        @target_ds_ref
    end

    # Cached cluster
    # @return ClusterComputeResource
    def cluster
        if @cluster.nil?
            ccr_ref = host['TEMPLATE/VCENTER_CCR_REF']
            @cluster = ClusterComputeResource.new_from_ref(ccr_ref, vi_client)
        end

        @cluster
    end

    ############################################################################
    ############################################################################

    # @return Boolean whether the VM exists in vCenter
    def is_new?
        !get_vm_id
    end

    # @return Boolean wheter the vm exists in opennebubla
    def one_exist?
        !@vm_id.nil? && @vm_id != -1
    end

    # @return String the vm_id stored in vCenter
    def get_vm_id(vm_pool = nil)
        if defined?(@vm_id) && @vm_id
            return @vm_id
        end

        vm_ref = self['_ref']
        return nil if !vm_ref

        vc_uuid = get_vcenter_instance_uuid

        one_vm = VCenterDriver::VIHelper.find_by_ref(OpenNebula::VirtualMachinePool,
                                                     "DEPLOY_ID",
                                                     vm_ref,
                                                     vc_uuid,
                                                     vm_pool)
        return nil if !one_vm

        @vm_id = one_vm["ID"]
        return @vm_id
    end

    def get_vcenter_instance_uuid
        @vi_client.vim.serviceContent.about.instanceUuid
    end

    def get_unmanaged_keys
        unmanaged_keys = {}
        @item.config.extraConfig.each do |val|
             if val[:key].include?("opennebula.disk")
                 unmanaged_keys[val[:key]] = val[:value]
             end
        end
        return unmanaged_keys
    end

    ############################################################################
    # Getters
    ############################################################################

    # @return RbVmomi::VIM::ResourcePool
    def get_rp

        req_rp = one_item['VCENTER_RESOURCE_POOL'] ||
                 one_item['USER_TEMPLATE/VCENTER_RESOURCE_POOL']

        #Get ref for req_rp
        rp_list    = cluster.get_resource_pool_list
        req_rp_ref = rp_list.select { |rp| rp[:name] == req_rp }.first[:ref] rescue nil

        if vi_client.rp_confined?
            if req_rp_ref && req_rp_ref != vi_client.rp._ref
                raise "Available resource pool [#{vi_client.rp.name}] in host"\
                      " does not match requested resource pool"\
                      " [#{req_rp}]"
            end

            return vi_client.rp
        else
            if req_rp_ref
                rps = cluster.resource_pools.select{|r| r._ref == req_rp_ref }

                if rps.empty?
                    raise "No matching resource pool found (#{req_rp})."
                else
                    return rps.first
                end
            else
                return cluster['resourcePool']
            end
        end
    end

    # @return RbVmomi::VIM::Datastore or nil
    def get_ds
        ##req_ds = one_item['USER_TEMPLATE/VCENTER_DS_REF']
        current_ds_id  = one_item["HISTORY_RECORDS/HISTORY[last()]/DS_ID"]
        current_ds     = VCenterDriver::VIHelper.one_item(OpenNebula::Datastore, current_ds_id)
        current_ds_ref = current_ds['TEMPLATE/VCENTER_DS_REF']

        if current_ds_ref
            dc = cluster.get_dc

            ds_folder = dc.datastore_folder
            ds = ds_folder.get(current_ds_ref)
            ds_item = ds.item rescue nil

            return ds_item
        else
            return nil
        end
    end

    # StorageResouceManager reference
    def get_sm
        self['_connection.serviceContent.storageResourceManager']
    end

    # @return Customization or nil
    def get_customization
        xpath = "USER_TEMPLATE/VCENTER_CUSTOMIZATION_SPEC"
        customization_spec = one_item[xpath]

        if customization_spec.nil?
            return nil
        end

        begin
            custom_spec = vi_client.vim
                            .serviceContent
                            .customizationSpecManager
                            .GetCustomizationSpec(:name => customization_spec)

            if custom_spec && (spec = custom_spec.spec)
                return spec
            else
                raise "Error getting customization spec"
            end
        rescue
            raise "Customization spec '#{customization_spec}' not found"
        end
    end

    # @return VCenterDriver::Datastore datastore where the disk will live under
    def get_effective_ds(disk)
        if disk["PERSISTENT"] == "YES"
            ds_ref = disk["VCENTER_DS_REF"]
        else
            ds_ref = target_ds_ref

            if ds_ref.nil?
                raise "target_ds_ref must be defined on this object."
            end
        end

        VCenterDriver::Storage.new_from_ref(ds_ref, vi_client)
    end

    # @return String vcenter name
    def get_vcenter_name
        vm_prefix = host['TEMPLATE/VM_PREFIX']
        vm_prefix = VM_PREFIX_DEFAULT if vm_prefix.nil? || vm_prefix.empty?
        vm_prefix.gsub!("$i", one_item['ID'])

        vm_prefix + one_item['NAME']
    end

    ############################################################################
    # Create and reconfigure VM related methods
    ############################################################################

    # This function creates a new VM from the @one_item XML and returns the
    # VMware ref
    # @param one_item OpenNebula::VirtualMachine
    # @param vi_client VCenterDriver::VIClient
    # @return String vmware ref
   def clone_vm(drv_action, vi_client)

        @vi_client = vi_client

        vcenter_name = get_vcenter_name

        vc_template_ref = drv_action['USER_TEMPLATE/VCENTER_TEMPLATE_REF']
        vc_template = RbVmomi::VIM::VirtualMachine(vi_client.vim, vc_template_ref)

        ds = get_ds

        # Default disk move type (Full Clone)
        disk_move_type = :moveAllDiskBackingsAndDisallowSharing

        if ds.instance_of? RbVmomi::VIM::Datastore
            use_linked_clones = drv_action['USER_TEMPLATE/VCENTER_LINKED_CLONES']
            if use_linked_clones && use_linked_clones.downcase == 'yes'
                # Check if all disks in template has delta disks
                disks = vc_template.config
                                .hardware.device.grep(RbVmomi::VIM::VirtualDisk)

                disks_no_delta = disks.select { |d| d.backing.parent == nil }

                # Can use linked clones if all disks have delta disks
                if (disks_no_delta.size == 0)
                    disk_move_type = :moveChildMostDiskBacking
                end
            end
        end

        spec_hash = spec_hash_clone(disk_move_type)

        clone_spec = RbVmomi::VIM.VirtualMachineCloneSpec(spec_hash)

        # Specify vm folder in vSpere's VM and Templates view F#4823
        vcenter_vm_folder = nil
        vcenter_vm_folder = drv_action["USER_TEMPLATE/VCENTER_VM_FOLDER"]
        vcenter_vm_folder_object = nil
        dc = cluster.get_dc
        if !!vcenter_vm_folder && !vcenter_vm_folder.empty?
            vcenter_vm_folder_object = dc.item.find_folder(vcenter_vm_folder)
        end
        vcenter_vm_folder_object = vc_template.parent if vcenter_vm_folder_object.nil?

        if ds.instance_of? RbVmomi::VIM::StoragePod
            # VM is cloned using Storage Resource Manager for StoragePods
            begin
                vm = storagepod_clonevm_task(vc_template, vcenter_name,
                                             clone_spec, ds, vcenter_vm_folder_object, dc)
            rescue Exception => e
                raise "Cannot clone VM Template to StoragePod: #{e.message}"
            end
        else
            vm = nil
            begin
                vm = vc_template.CloneVM_Task(
                    :folder => vcenter_vm_folder_object,
                    :name   => vcenter_name,
                    :spec   => clone_spec).wait_for_completion
            rescue Exception => e
                if !e.message.start_with?('DuplicateName')
                    raise "Cannot clone VM Template: #{e.message}\n#{e.backtrace}"
                end

                vm_folder = dc.vm_folder
                vm_folder.fetch!
                vm = vm_folder.items
                        .select{|k,v| v.item.name == vcenter_name}
                        .values.first.item rescue nil

                if vm
                    # Detach all persistent disks to avoid accidental destruction
                    detach_persistent_disks(vm)

                    vm.Destroy_Task.wait_for_completion
                    vm = vc_template.CloneVM_Task(
                        :folder => vcenter_vm_folder_object,
                        :name   => vcenter_name,
                        :spec   => clone_spec).wait_for_completion
                else
                    raise "Cannot clone VM Template"
                end
            end
        end
        # @item is populated
        @item = vm

        return self['_ref']
    end


    def storagepod_clonevm_task(vc_template, vcenter_name, clone_spec, storpod, vcenter_vm_folder_object, dc)

        storage_manager = vc_template
                            ._connection.serviceContent.storageResourceManager

        storage_spec = RbVmomi::VIM.StoragePlacementSpec(
            type: 'clone',
            cloneName: vcenter_name,
            folder: vcenter_vm_folder_object,
            podSelectionSpec: RbVmomi::VIM.StorageDrsPodSelectionSpec(storagePod: storpod),
            vm: vc_template,
            cloneSpec: clone_spec
        )

        # Query a storage placement recommendation
        result = storage_manager
                    .RecommendDatastores(storageSpec: storage_spec) rescue nil

        raise "Could not get placement specification for StoragePod" if result.nil?

        if !result.respond_to?(:recommendations) || result.recommendations.size == 0
            raise "Could not get placement specification for StoragePod"
        end

        # Get recommendation key to be applied
        key = result.recommendations.first.key ||= ''
        raise "Missing Datastore recommendation for StoragePod" if key.empty?

        begin
            apply_sr = storage_manager
                            .ApplyStorageDrsRecommendation_Task(key: [key])
                            .wait_for_completion
            return apply_sr.vm
        rescue Exception => e
            if !e.message.start_with?('DuplicateName')
                raise "Cannot clone VM Template: #{e.message}\n#{e.backtrace}"
            end

            # The VM already exists, try to find the vm
            vm_folder = dc.vm_folder
            vm_folder.fetch!
            vm = vm_folder.items
                    .select{|k,v| v.item.name == vcenter_name}
                    .values.first.item rescue nil

            if vm

                begin
                    # Detach all persistent disks to avoid accidental destruction
                    detach_persistent_disks(vm)

                    # Destroy the VM with any disks still attached to it
                    vm.Destroy_Task.wait_for_completion

                    # Query a storage placement recommendation
                    result = storage_manager.RecommendDatastores(storageSpec: storage_spec) rescue nil

                    raise "Could not get placement specification for StoragePod" if result.nil?

                    if !result.respond_to?(:recommendations) || result.recommendations.size == 0
                        raise "Could not get placement specification for StoragePod"
                    end

                    # Get recommendation key to be applied
                    key = result.recommendations.first.key ||= ''
                    raise "Missing Datastore recommendation for StoragePod" if key.empty?

                    apply_sr = storage_manager
                            .ApplyStorageDrsRecommendation_Task(key: [key])
                            .wait_for_completion
                    return apply_sr.vm
                rescue Exception => e
                   raise "Failure applying recommendation while cloning VM: #{e.message}"
                end
            end
        end
    end

    # @return clone parameters spec hash
    def spec_hash_clone(disk_move_type)
        # Relocate spec
        relocate_spec_params = {}

        relocate_spec_params[:pool] = get_rp
        relocate_spec_params[:diskMoveType] = disk_move_type

        ds = get_ds

        relocate_spec_params[:datastore] = ds if ds.instance_of? RbVmomi::VIM::Datastore

        relocate_spec = RbVmomi::VIM.VirtualMachineRelocateSpec(
                                                         relocate_spec_params)

        # Running flag - prevents spurious poweroff states in the VM
        running_flag = [{ :key => "opennebula.vm.running", :value => "no"}]

        running_flag_spec = RbVmomi::VIM.VirtualMachineConfigSpec(
            { :extraConfig => running_flag }
        )

        clone_parameters = {
            :location => relocate_spec,
            :powerOn  => false,
            :template => false,
            :config   => running_flag_spec
        }

        cs = get_customization
        clone_parameters[:customization] = cs if cs

        clone_parameters
    end

    def reference_unmanaged_devices(template_ref)

        extraconfig   = []
        device_change = []

        # Get unmanaged disks in OpenNebula's VM template
        xpath = "TEMPLATE/DISK[OPENNEBULA_MANAGED=\"NO\" or OPENNEBULA_MANAGED=\"no\"]"
        unmanaged_disks = one_item.retrieve_xmlelements(xpath)

        if !unmanaged_disks.empty?

            # Get vcenter VM disks to know real path of cloned disk
            vcenter_disks = get_vcenter_disks

            # Create an array with the paths of the disks in vcenter template
            template = VCenterDriver::Template.new_from_ref(template_ref, vi_client)
            template_disks = template.get_vcenter_disks
            template_disks_vector = []
            template_disks.each do |d|
                template_disks_vector << d[:path_wo_ds]
            end

            # Try to find index of disks in template disks
            unmanaged_disks.each do |unmanaged_disk|
                unmanaged_disk_source = VCenterDriver::FileHelper.unescape_path(unmanaged_disk["SOURCE"])
                index = template_disks_vector.index(unmanaged_disk_source)
                if index
                    reference = {}
                    reference[:key]   = "opennebula.disk.#{unmanaged_disk["DISK_ID"]}"
                    reference[:value] = "#{vcenter_disks[index][:key]}"
                    extraconfig << reference
                end
            end
        end

        # Add info for existing nics in template in vm xml
        xpath = "TEMPLATE/NIC[OPENNEBULA_MANAGED=\"NO\" or OPENNEBULA_MANAGED=\"no\"]"
        unmanaged_nics = one_item.retrieve_xmlelements(xpath)

        begin
            if !unmanaged_nics.empty?
                index = 0
                self["config.hardware.device"].each_with_index do |device|
                    if is_nic?(device)
                        # Edit capacity setting new size in KB
                        device.macAddress = unmanaged_nics[index]["MAC"]
                        device_change << { :device => device, :operation => :edit }
                        index += 1
                    end
                end
            end
        rescue Exception => e
            raise "There is a problem with your vm NICS, make sure that they are working properly. Error: #{e.message}"
        end

        # Save in extraconfig the key for unmanaged disks
        if !extraconfig.empty? || !device_change.empty?
            spec = {}
            spec[:extraConfig]  = extraconfig if !extraconfig.empty?
            spec[:deviceChange] = device_change if !device_change.empty?
            @item.ReconfigVM_Task(:spec => spec).wait_for_completion
        end
    end

    def resize_unmanaged_disks
        resize_hash = {}
        disks = []

        unmanaged_keys = get_unmanaged_keys
        vc_disks = get_vcenter_disks

        # Look for unmanaged disks with original size changed
        xpath = "TEMPLATE/DISK[(OPENNEBULA_MANAGED=\"NO\" or OPENNEBULA_MANAGED=\"no\") and boolean(ORIGINAL_SIZE) and ORIGINAL_SIZE != SIZE]"
        unmanaged_resized_disks = one_item.retrieve_xmlelements(xpath)

        return if unmanaged_resized_disks.empty?

        # Cannot resize linked cloned disks
        if one_item["USER_TEMPLATE/VCENTER_LINKED_CLONES"] &&
           one_item["USER_TEMPLATE/VCENTER_LINKED_CLONES"] == "YES"
            raise "Linked cloned disks cannot be resized."
        end

        unmanaged_resized_disks.each do |disk|
            vc_disks.each do |vcenter_disk|
                if unmanaged_keys.key?("opennebula.disk.#{disk["DISK_ID"]}")
                    device_key = unmanaged_keys["opennebula.disk.#{disk["DISK_ID"]}"].to_i

                    if device_key == vcenter_disk[:key].to_i

                        break if disk["SIZE"].to_i <= disk["ORIGINAL_SIZE"].to_i

                        # Edit capacity setting new size in KB
                        d = vcenter_disk[:device]
                        d.capacityInKB = disk["SIZE"].to_i * 1024
                        disks <<   { :device => d, :operation => :edit }
                        break
                    end
                end
            end
        end

        if !disks.empty?
            resize_hash[:deviceChange] = disks
            @item.ReconfigVM_Task(:spec => resize_hash).wait_for_completion
        end
    end

    def create_storagedrs_disks(device_change_spod, device_change_spod_ids)

        sm = get_sm
        disk_locator = []
        extra_config = []

        device_change_spod.each do |device_spec|
            disk_locator << RbVmomi::VIM.PodDiskLocator(diskId: device_spec[:device].key)
        end

        spec = {}
        spec[:deviceChange] = device_change_spod

        # Disk locator is required for AddDisk
        vmpod_hash = {}
        vmpod_hash[:storagePod] = get_ds
        vmpod_hash[:disk] = disk_locator
        vmpod_config = RbVmomi::VIM::VmPodConfigForPlacement(vmpod_hash)

        # The storage pod selection requires initialize
        spod_hash = {}
        spod_hash[:initialVmConfig] = [ vmpod_config ]
        spod_select = RbVmomi::VIM::StorageDrsPodSelectionSpec(spod_hash)
        storage_spec = RbVmomi::VIM.StoragePlacementSpec(
            type: :reconfigure,
            podSelectionSpec: spod_select,
            vm: self['_ref'],
            configSpec: spec
        )

        # Query a storage placement recommendation
        result = sm.RecommendDatastores(storageSpec: storage_spec) rescue nil

        raise "Could not get placement specification for StoragePod" if result.nil?

        if !result.respond_to?(:recommendations) || result.recommendations.size == 0
            raise "Could not get placement specification for StoragePod"
        end

        # Get recommendation key to be applied
        key = result.recommendations.first.key ||= ''
        raise "Missing Datastore recommendation for StoragePod" if key.empty?

        # Apply recommendation
        sm.ApplyStorageDrsRecommendation_Task(key: [key]).wait_for_completion

        # Set references in opennebula.disk elements
        device_change_spod.each do |device_spec|
            unit_number    = device_spec[:device].unitNumber
            controller_key = device_spec[:device].controllerKey
            key            = get_vcenter_disk_key(unit_number, controller_key)
            disk_id        = device_change_spod_ids["#{controller_key}-#{unit_number}"]
            reference      = {}
            reference[:key]   = "opennebula.disk.#{disk_id}"
            reference[:value] = key.to_s
            extra_config << reference
        end

        extra_config
    end


    def reconfigure
        extraconfig   = []
        device_change = []

        # Unmanaged keys
        unmanaged_keys = get_unmanaged_keys

        # Get disk devices in vm
        vc_disks = get_vcenter_disks

        # Get an array with disk paths in OpenNebula's vm template
        disks_in_onevm_vector = disks_in_onevm(unmanaged_keys, vc_disks)

        # As the original template may have been modified in OpenNebula
        # but not in vcenter, we must detach disks that are in vcenter
        # but not in OpenNebula's vm template
        if is_new?
            device_change, extra_config = device_detach_disks(disks_in_onevm_vector, unmanaged_keys, vc_disks)
            if !device_change.empty?
                spec_hash = {}
                spec_hash[:deviceChange] = device_change if !device_change.empty?
                spec_hash[:extraConfig] = extra_config  if !extra_config.empty?

                # Reconfigure for disks detached from original template
                spec = RbVmomi::VIM.VirtualMachineConfigSpec(spec_hash)
                @item.ReconfigVM_Task(:spec => spec).wait_for_completion

                # Get disk devices in vm again after reconfigure
                vc_disks = get_vcenter_disks
            end
        end

        # Now reconfigure disks, nics and extraconfig for the VM
        device_change = []

        # get token and context
        extraconfig += extraconfig_context

        # vnc configuration (for config_array hash)
        extraconfig += extraconfig_vnc

        # Set CPU, memory and extraconfig
        num_cpus = one_item["TEMPLATE/VCPU"] || 1

        spec_hash = {
            :numCPUs      => num_cpus.to_i,
            :memoryMB     => one_item["TEMPLATE/MEMORY"],
            :extraConfig  => extraconfig
        }

        # device_change hash (nics)
        device_change += device_change_nics

        # Now attach disks that are in OpenNebula's template but not in vcenter
        # e.g those that has been attached in poweroff
        device_change_ds, device_change_spod, device_change_spod_ids = device_attach_disks(disks_in_onevm_vector, vc_disks)
        device_change += device_change_ds

        # Create volatile disks in StorageDRS if any
        if !device_change_spod.empty?
            spec_hash[:extraConfig] = create_storagedrs_disks(device_change_spod, device_change_spod_ids)
        end

        # Common reconfigure task
        spec_hash[:deviceChange] = device_change
        spec = RbVmomi::VIM.VirtualMachineConfigSpec(spec_hash)
        @item.ReconfigVM_Task(:spec => spec).wait_for_completion
    end

    def extraconfig_context
        context_text = "# Context variables generated by OpenNebula\n"
        one_item.each('TEMPLATE/CONTEXT/*') do |context_element|
            # next if !context_element.text
            context_text += context_element.name + "='" +
                            context_element.text.gsub("'", "\\'") + "'\n"
        end

        # token
        token = File.read(File.join(VAR_LOCATION,
                        'vms',
                        one_item['ID'],
                        'token.txt')).chomp rescue nil

        context_text += "ONEGATE_TOKEN='#{token}'\n" if token

        # context_text
        [
            { :key => "guestinfo.opennebula.context",
              :value => Base64.encode64(context_text) }
        ]
    end

    def extraconfig_vnc
        if one_item["TEMPLATE/GRAPHICS"]
            vnc_port   = one_item["TEMPLATE/GRAPHICS/PORT"]
            vnc_listen = one_item["TEMPLATE/GRAPHICS/LISTEN"] || "0.0.0.0"
            vnc_keymap = one_item["TEMPLATE/GRAPHICS/KEYMAP"]

            conf = [ {:key => "remotedisplay.vnc.enabled",:value => "TRUE"},
                    {:key => "remotedisplay.vnc.port",   :value => vnc_port},
                    {:key => "remotedisplay.vnc.ip",     :value => vnc_listen}]

            conf += [{:key => "remotedisplay.vnc.keymap",
                            :value => vnc_keymap}] if vnc_keymap

            conf
        else
            conf = []
        end
    end

    def device_change_nics
        # Final list of changes to be applied in vCenter
        device_change = []

        # Hash of interfaces from the OpenNebula xml
        nics_in_template = {}
        xpath = "TEMPLATE/NIC"
        one_item.each(xpath) { |nic|
            nics_in_template[nic["MAC"]] = nic
        }

        # Check nics in VM
        self["config.hardware.device"].each do |dv|
            if is_nic?(dv)
                if nics_in_template.key?(dv.macAddress)
                    # Remove nic that is already in the XML to avoid duplicate
                    nics_in_template.delete(dv.macAddress)
                else
                    # B4897 - It was detached in poweroff, remove it from VM
                    device_change << {
                        :operation => :remove,
                        :device    => dv
                    }
                end
            end
        end

        # Attach new nics (nics_in_template now contains only the interfaces
        # not present in the VM in vCenter)
        nics_in_template.each do |key, nic|
            device_change << calculate_add_nic_spec(nic)
        end

        return device_change
    end

    # Regenerate context when devices are hot plugged (reconfigure)
    def regenerate_context
        spec_hash = { :extraConfig  => extraconfig_context }
        spec = RbVmomi::VIM.VirtualMachineConfigSpec(spec_hash)

        begin
            @item.ReconfigVM_Task(:spec => spec).wait_for_completion
        rescue Exception => e
            raise "Cannot create snapshot for VM: #{e.message}\n#{e.backtrace}"
        end
    end

    # Returns an array of actions to be included in :deviceChange
    def calculate_add_nic_spec(nic)

        mac       = nic["MAC"]
        pg_name   = nic["BRIDGE"]
        model     = nic["VCENTER_NET_MODEL"] || VCenterDriver::VIHelper.get_default("VM/TEMPLATE/NIC/MODEL")
        vnet_ref  = nic["VCENTER_NET_REF"]
        backing   = nil

        limit_in  = nic["INBOUND_PEAK_BW"] || VCenterDriver::VIHelper.get_default("VM/TEMPLATE/NIC/INBOUND_PEAK_BW")
        limit_out = nic["OUTBOUND_PEAK_BW"] || VCenterDriver::VIHelper.get_default("VM/TEMPLATE/NIC/OUTBOUND_PEAK_BW")
        limit     = nil

        if limit_in && limit_out
            limit=([limit_in.to_i, limit_out.to_i].min / 1024) * 8
        end

        rsrv_in  = nic["INBOUND_AVG_BW"] || VCenterDriver::VIHelper.get_default("VM/TEMPLATE/NIC/INBOUND_AVG_BW")
        rsrv_out = nic["OUTBOUND_AVG_BW"] || VCenterDriver::VIHelper.get_default("VM/TEMPLATE/NIC/OUTBOUND_AVG_BW")
        rsrv     = nil

        if rsrv_in || rsrv_out
            rsrv=([rsrv_in.to_i, rsrv_out.to_i].min / 1024) * 8
        end

        network = self["runtime.host"].network.select do |n|
            n._ref == vnet_ref || n.name == pg_name
        end

        network = network.first

        card_num = 1 # start in one, we want the next avaliable id

        @item["config.hardware.device"].each do |dv|
            card_num += 1 if is_nic?(dv)
        end

        nic_card = case model
                        when "virtuale1000", "e1000"
                            RbVmomi::VIM::VirtualE1000
                        when "virtuale1000e", "e1000e"
                            RbVmomi::VIM::VirtualE1000e
                        when "virtualpcnet32", "pcnet32"
                            RbVmomi::VIM::VirtualPCNet32
                        when "virtualsriovethernetcard", "sriovethernetcard"
                            RbVmomi::VIM::VirtualSriovEthernetCard
                        when "virtualvmxnetm", "vmxnetm"
                            RbVmomi::VIM::VirtualVmxnetm
                        when "virtualvmxnet2", "vmnet2"
                            RbVmomi::VIM::VirtualVmxnet2
                        when "virtualvmxnet3", "vmxnet3"
                            RbVmomi::VIM::VirtualVmxnet3
                        else # If none matches, use VirtualE1000
                            RbVmomi::VIM::VirtualE1000
                   end

        if network.class == RbVmomi::VIM::Network
            backing = RbVmomi::VIM.VirtualEthernetCardNetworkBackingInfo(
                        :deviceName => pg_name,
                        :network    => network)
        else
            port    = RbVmomi::VIM::DistributedVirtualSwitchPortConnection(
                        :switchUuid =>
                                network.config.distributedVirtualSwitch.uuid,
                        :portgroupKey => network.key)
            backing =
              RbVmomi::VIM.VirtualEthernetCardDistributedVirtualPortBackingInfo(
                 :port => port)
        end

        card_spec = {
            :key => 0,
            :deviceInfo => {
                :label => "net" + card_num.to_s,
                :summary => pg_name
            },
            :backing     => backing,
            :addressType => mac ? 'manual' : 'generated',
            :macAddress  => mac
        }

        if (limit || rsrv) && (limit > 0)
            ra_spec = {}
            rsrv = limit if rsrv > limit
            ra_spec[:limit] = limit if limit
            ra_spec[:reservation] = rsrv if rsrv
            ra_spec[:share] =  RbVmomi::VIM.SharesInfo({
                    :level => RbVmomi::VIM.SharesLevel("normal"),
                    :shares => 0
                })
            card_spec[:resourceAllocation] =
               RbVmomi::VIM.VirtualEthernetCardResourceAllocation(ra_spec)
        end

        {
            :operation => :add,
            :device    => nic_card.new(card_spec)
        }
    end

     # Returns an array of actions to be included in :deviceChange
    def calculate_add_nic_spec_autogenerate_mac(nic)

        pg_name   = nic["BRIDGE"]
        model     = nic["VCENTER_NET_MODEL"] || VCenterDriver::VIHelper.get_default("VM/TEMPLATE/NIC/MODEL")
        vnet_ref  = nic["VCENTER_NET_REF"]
        backing   = nil

        limit_in  = nic["INBOUND_PEAK_BW"] || VCenterDriver::VIHelper.get_default("VM/TEMPLATE/NIC/INBOUND_PEAK_BW")
        limit_out = nic["OUTBOUND_PEAK_BW"] || VCenterDriver::VIHelper.get_default("VM/TEMPLATE/NIC/OUTBOUND_PEAK_BW")
        limit     = nil

        if limit_in && limit_out
            limit=([limit_in.to_i, limit_out.to_i].min / 1024) * 8
        end

        rsrv_in  = nic["INBOUND_AVG_BW"] || VCenterDriver::VIHelper.get_default("VM/TEMPLATE/NIC/INBOUND_AVG_BW")
        rsrv_out = nic["OUTBOUND_AVG_BW"] || VCenterDriver::VIHelper.get_default("VM/TEMPLATE/NIC/OUTBOUND_AVG_BW")
        rsrv     = nil

        if rsrv_in || rsrv_out
            rsrv=([rsrv_in.to_i, rsrv_out.to_i].min / 1024) * 8
        end

        network = self["runtime.host"].network.select do |n|
            n._ref == vnet_ref || n.name == pg_name
        end

        network = network.first

        card_num = 1 # start in one, we want the next avaliable id

        @item["config.hardware.device"].each do |dv|
            card_num += 1 if is_nic?(dv)
        end

        nic_card = case model
                        when "virtuale1000", "e1000"
                            RbVmomi::VIM::VirtualE1000
                        when "virtuale1000e", "e1000e"
                            RbVmomi::VIM::VirtualE1000e
                        when "virtualpcnet32", "pcnet32"
                            RbVmomi::VIM::VirtualPCNet32
                        when "virtualsriovethernetcard", "sriovethernetcard"
                            RbVmomi::VIM::VirtualSriovEthernetCard
                        when "virtualvmxnetm", "vmxnetm"
                            RbVmomi::VIM::VirtualVmxnetm
                        when "virtualvmxnet2", "vmnet2"
                            RbVmomi::VIM::VirtualVmxnet2
                        when "virtualvmxnet3", "vmxnet3"
                            RbVmomi::VIM::VirtualVmxnet3
                        else # If none matches, use VirtualE1000
                            RbVmomi::VIM::VirtualE1000
                   end

        if network.class == RbVmomi::VIM::Network
            backing = RbVmomi::VIM.VirtualEthernetCardNetworkBackingInfo(
                        :deviceName => pg_name,
                        :network    => network)
        else
            port    = RbVmomi::VIM::DistributedVirtualSwitchPortConnection(
                        :switchUuid =>
                                network.config.distributedVirtualSwitch.uuid,
                        :portgroupKey => network.key)
            backing =
              RbVmomi::VIM.VirtualEthernetCardDistributedVirtualPortBackingInfo(
                 :port => port)
        end

        card_spec = {
            :key => 0,
            :deviceInfo => {
                :label => "net" + card_num.to_s,
                :summary => pg_name
            },
            :backing     => backing,
            :addressType => 'generated'
        }

        if (limit || rsrv) && (limit > 0)
            ra_spec = {}
            rsrv = limit if rsrv > limit
            ra_spec[:limit] = limit if limit
            ra_spec[:reservation] = rsrv if rsrv
            ra_spec[:share] =  RbVmomi::VIM.SharesInfo({
                    :level => RbVmomi::VIM.SharesLevel("normal"),
                    :shares => 0
                })
            card_spec[:resourceAllocation] =
               RbVmomi::VIM.VirtualEthernetCardResourceAllocation(ra_spec)
        end

        {
            :operation => :add,
            :device    => nic_card.new(card_spec)
        }
    end

    # Add NIC to VM
    def attach_nic
        spec_hash = {}
        nic = nil

        # Extract nic from driver action
        nic = one_item.retrieve_xmlelements("TEMPLATE/NIC[ATTACH='YES']").first

        begin
            # A new NIC requires a vcenter spec
            attach_nic_array = []
            attach_nic_array << calculate_add_nic_spec(nic)
            spec_hash[:deviceChange] = attach_nic_array if !attach_nic_array.empty?

            # Reconfigure VM
            spec = RbVmomi::VIM.VirtualMachineConfigSpec(spec_hash)

            @item.ReconfigVM_Task(:spec => spec).wait_for_completion
        rescue Exception => e
            raise "Cannot attach NIC to VM: #{e.message}\n#{e.backtrace.join("\n")}"
        end

    end

    # Detach NIC from VM
    def detach_nic
        spec_hash = {}
        nic = nil

        # Extract nic from driver action
        nic = one_item.retrieve_xmlelements("TEMPLATE/NIC[ATTACH='YES']").first
        mac = nic["MAC"]

        # Get VM nic element if it has a device with that mac
        nic_device = @item["config.hardware.device"].find do |device|
            is_nic?(device) && (device.macAddress ==  mac)
        end rescue nil

        return if nic_device.nil? #Silently ignore if nic is not found

        # Remove NIC from VM in the ReconfigVM_Task
        spec_hash[:deviceChange] = [
                :operation => :remove,
                :device => nic_device ]

        begin
            @item.ReconfigVM_Task(:spec => spec_hash).wait_for_completion
        rescue Exception => e
            raise "Cannot detach NIC from VM: #{e.message}\n#{e.backtrace.join("\n")}"
        end
    end

    # Detach all nics useful when removing pg and sw so they're not in use
    def detach_all_nics
        spec_hash = {}
        device_change = []

        @item["config.hardware.device"].each do |device|
            if is_nic?(device)
                device_change << {:operation => :remove, :device => device}
            end
        end

        # Remove NIC from VM in the ReconfigVM_Task
        spec_hash[:deviceChange] = device_change

        begin
            @item.ReconfigVM_Task(:spec => spec_hash).wait_for_completion
        rescue Exception => e
            raise "Cannot detach all NICs from VM: #{e.message}\n#{e.backtrace}"
        end
    end

    def get_device_filename_and_ds_from_key(key, vc_disks)
        device = vc_disks.select{ |d| d[:key].to_i == key.to_i}.first rescue nil
        return device
    end

    def disks_in_onevm(unmanaged_keys, vc_disks)
        onevm_disks_vector = []

        disks = one_item.retrieve_xmlelements("TEMPLATE/DISK")
        disks.each do |disk|
            if unmanaged_keys.key?("opennebula.disk.#{disk["DISK_ID"]}")
                device_key = unmanaged_keys["opennebula.disk.#{disk["DISK_ID"]}"].to_i
                disk_hash = get_device_filename_and_ds_from_key(device_key, vc_disks)

                if disk_hash
                    onevm_disks_vector << disk_hash[:path_wo_ds]
                end
            else
                img_name_escaped = VCenterDriver::FileHelper.get_img_name(
                                    disk,
                                    one_item['ID'],
                                    self['name'],
                                    instantiated_as_persistent?)
                img_name = VCenterDriver::FileHelper.unescape_path(img_name_escaped)
                onevm_disks_vector << img_name
            end
        end

        return onevm_disks_vector
    end

    def device_attach_disks(onevm_disks_vector, vc_disks)

        disks = one_item.retrieve_xmlelements("TEMPLATE/DISK")

        vc_disks.each do |d|
            index = onevm_disks_vector.index(d[:path_wo_ds])
            if index
                disks.delete_at(index)
                onevm_disks_vector.delete_at(index)
            end
        end

        return [],[],{} if disks.empty?

        attach_disk_array = []
        attach_spod_array = []
        attach_spod_disk_info = {}

        position = 0
        disks.each do |disk|
            storpod = disk["VCENTER_DS_REF"].start_with?('group-')
            if storpod
                spec = calculate_add_disk_spec(disk, position)
                attach_spod_array << spec
                unit_ctrl = "#{spec[:device].controllerKey}-#{spec[:device].unitNumber}"
                attach_spod_disk_info[unit_ctrl] = disk["DISK_ID"]
            else
                attach_disk_array << calculate_add_disk_spec(disk, position)
            end

            position += 1
        end

        return attach_disk_array, attach_spod_array, attach_spod_disk_info
    end

    def device_detach_disks(onevm_disks_vector, unmanaged_keys, vc_disks)
        detach_disk_array = []
        extra_config      = []

        ipool = VCenterDriver::VIHelper.one_pool(OpenNebula::ImagePool)
        if ipool.respond_to?(:message)
            raise "Could not get OpenNebula ImagePool: #{ipool.message}"
        end

        vc_disks.each do |d|
            if !onevm_disks_vector.index(d[:path_wo_ds])

                # If disk to be detached is not persistent detach and destroy it
                source = VCenterDriver::FileHelper.escape_path(d[:path_wo_ds])
                persistent = VCenterDriver::VIHelper.find_persistent_image_by_source(source, ipool)

                if !persistent
                    detach_disk_array << {
                        :fileOperation => :destroy,
                        :operation => :remove,
                        :device    => d[:device]
                    }
                end

                # Remove reference opennebula.disk if exist
                unmanaged_keys.each do |key, value|
                    if value.to_i == d[:key].to_i
                        reference = {}
                        reference[:key]   = key
                        reference[:value] = ""
                        extra_config << reference
                        break
                    end
                end
            end
        end

        return detach_disk_array, extra_config
    end

    # Attach DISK to VM (hotplug)
    def attach_disk
        # TODO position? and disk size for volatile?

        spec_hash = {}
        disk = nil
        device_change = []

        # Extract unmanaged_keys
        unmanaged_keys = get_unmanaged_keys
        vc_disks = get_vcenter_disks

        # Extract disk from driver action
        disk = one_item.retrieve_xmlelements("TEMPLATE/DISK[ATTACH='YES']").first

        # Check if we're dealing with a StoragePod SYSTEM ds
        storpod = disk["VCENTER_DS_REF"].start_with?('group-')

        # Check if disk being attached is already connected to the VM
        raise "DISK is already connected to VM" if disk_attached_to_vm(disk, unmanaged_keys, vc_disks)

        # Generate vCenter spec and reconfigure VM
        device_change << calculate_add_disk_spec(disk)
        raise "Could not generate DISK spec" if device_change.empty?

        spec_hash[:deviceChange] = device_change
        spec = RbVmomi::VIM.VirtualMachineConfigSpec(spec_hash)

        begin
            if storpod
                #Ask for StorageDRS recommendation to reconfigure VM (AddDisk)
                sm = get_sm

                # Disk id is -1 as I don't know what disk id is going to be set
                disk_locator = [ RbVmomi::VIM.PodDiskLocator(diskId: -1) ]

                # Disk locator is required for AddDisk
                vmpod_hash = {}
                vmpod_hash[:storagePod] = get_ds
                vmpod_hash[:disk] = disk_locator
                vmpod_config = RbVmomi::VIM::VmPodConfigForPlacement(vmpod_hash)

                # The storage pod selection requires initialize
                spod_hash = {}
                spod_hash[:initialVmConfig] = [ vmpod_config ]
                spod_select = RbVmomi::VIM::StorageDrsPodSelectionSpec(spod_hash)
                storage_spec = RbVmomi::VIM.StoragePlacementSpec(
                    type: :reconfigure,
                    podSelectionSpec: spod_select,
                    vm: self['_ref'],
                    configSpec: spec
                )

                # Query a storage placement recommendation
                result = sm.RecommendDatastores(storageSpec: storage_spec) rescue nil

                raise "Could not get placement specification for StoragePod" if result.nil?

                if !result.respond_to?(:recommendations) || result.recommendations.size == 0
                    raise "Could not get placement specification for StoragePod"
                end

                # Get recommendation key to be applied
                key = result.recommendations.first.key ||= ''
                raise "Missing Datastore recommendation for StoragePod" if key.empty?

                # Apply recommendation
                sm.ApplyStorageDrsRecommendation_Task(key: [key]).wait_for_completion

                # Add the key for the volatile disk to the unmanaged opennebula.disk.id variables
                unit_number    = spec_hash[:deviceChange][0][:device].unitNumber
                controller_key = spec_hash[:deviceChange][0][:device].controllerKey
                key = get_vcenter_disk_key(unit_number, controller_key)
                spec_hash = {}
                reference = {}
                reference[:key]   = "opennebula.disk.#{disk["DISK_ID"]}"
                reference[:value] = key.to_s
                spec_hash[:extraConfig] = [ reference ]
                @item.ReconfigVM_Task(:spec => spec_hash).wait_for_completion
            else
                @item.ReconfigVM_Task(:spec => spec).wait_for_completion
            end
        rescue Exception => e
            raise "Cannot attach DISK to VM: #{e.message}\n#{e.backtrace.join("\n")}"
        end
    end

    # Detach persistent disks to avoid incidental destruction
    def detach_persistent_disks(vm)
        spec_hash = {}
        spec_hash[:deviceChange] = []
        ipool = VCenterDriver::VIHelper.one_pool(OpenNebula::ImagePool)
        if ipool.respond_to?(:message)
            raise "Could not get OpenNebula ImagePool: #{ipool.message}"
        end

        vm.config.hardware.device.each do |disk|
            if is_disk_or_cdrom?(disk)
                # Let's try to find if disks is persistent
                source_unescaped = disk.backing.fileName.sub(/^\[(.*?)\] /, "")
                source = VCenterDriver::FileHelper.escape_path(source_unescaped)

                persistent = VCenterDriver::VIHelper.find_persistent_image_by_source(source, ipool)

                if persistent
                    spec_hash[:deviceChange] << {
                        :operation => :remove,
                        :device => disk
                    }
                end
            end

        end

        return nil if spec_hash[:deviceChange].empty?

        begin
            vm.ReconfigVM_Task(:spec => spec_hash).wait_for_completion
        rescue Exception => e
            raise "Cannot detach all DISKs from VM: #{e.message}\n#{e.backtrace}"
        end
    end


    # Detach DISK from VM
    def detach_disk(disk)
        spec_hash = {}
        img_path = ""
        ds_ref = nil

        # Extract unmanaged disk keys
        unmanaged_keys = get_unmanaged_keys
        vc_disks = get_vcenter_disks

        # Get vcenter device to be detached and remove if found
        device = disk_attached_to_vm(disk, unmanaged_keys, vc_disks)

        if device
            img_path << device[:path_wo_ds]

            if unmanaged_keys.key?("opennebula.disk.#{disk["DISK_ID"]}")
                reference = {}
                reference[:key]   = "opennebula.disk.#{disk["DISK_ID"]}"
                reference[:value] = ""
                spec_hash[:extraConfig] = [ reference ]
            end

            ds_ref = device[:datastore]._ref

            # Generate vCenter spec and reconfigure VM
            spec_hash[:deviceChange] = [{
                :operation => :remove,
                :device => device[:device]
            }]

            begin
                @item.ReconfigVM_Task(:spec => spec_hash).wait_for_completion
            rescue Exception => e
                raise "Cannot detach DISK from VM: #{e.message}\n#{e.backtrace}"
            end
        end

        return ds_ref, img_path
    end

    # Get vcenter device representing DISK object (hotplug)
    def disk_attached_to_vm(disk, unmanaged_keys, vc_disks)
        img_name = ""
        device_found = nil
        disk_id = disk["DISK_ID"]
        unmanaged_key = unmanaged_keys["opennebula.disk.#{disk_id}"]

        img_name_escaped = VCenterDriver::FileHelper.get_img_name(
                                disk,
                                one_item['ID'],
                                self['name'],
                                instantiated_as_persistent?)

        img_name = VCenterDriver::FileHelper.unescape_path(img_name_escaped)

        vc_disks.each do |d|
            key_matches  = (unmanaged_key && d[:key] == unmanaged_key.to_i)
            path_matches = (d[:path_wo_ds] == img_name)

            if key_matches || path_matches
                device_found = d
                break
            end
        end

        return device_found
    end

    def calculate_add_disk_spec(disk, position=0)
        img_name_escaped = VCenterDriver::FileHelper.get_img_name(
                                disk,
                                one_item['ID'],
                                self['name'],
                                instantiated_as_persistent?)

        img_name = VCenterDriver::FileHelper.unescape_path(img_name_escaped)

        type     = disk["TYPE"]
        size_kb  = disk["SIZE"].to_i * 1024

        if type == "CDROM"
            # CDROM drive will be found in the IMAGE DS
            ds_ref   = disk["VCENTER_DS_REF"]
            ds       = VCenterDriver::Storage.new_from_ref(ds_ref, @vi_client)
            ds_name  = ds['name']

            # CDROM can only be added when the VM is in poweroff state
            vmdk_backing = RbVmomi::VIM::VirtualCdromIsoBackingInfo(
                :datastore => ds.item,
                :fileName  => "[#{ds_name}] #{img_name}"
            )

            if @item["summary.runtime.powerState"] != "poweredOff"
                raise "The CDROM image can only be added as an IDE device "\
                      "when the VM is in the powered off state"
            end

            controller, unit_number = find_free_ide_controller(position)

            device = RbVmomi::VIM::VirtualCdrom(
                :backing       => vmdk_backing,
                :key           => -1,
                :controllerKey => controller.key,
                :unitNumber    => unit_number,

                :connectable => RbVmomi::VIM::VirtualDeviceConnectInfo(
                    :startConnected    => true,
                    :connected         => true,
                    :allowGuestControl => true
                )
            )

            return {
                :operation => :add,
                :device => device
            }

        else
            # TYPE is regular disk (not CDROM)

            controller, unit_number = find_free_controller(position)

            storpod = disk["VCENTER_DS_REF"].start_with?('group-')
            if storpod
                vmdk_backing = RbVmomi::VIM::VirtualDiskFlatVer2BackingInfo(
                  :diskMode  => 'persistent',
                  :fileName  => ""
                )
            else
                ds           = get_effective_ds(disk)
                ds_name      = ds['name']
                vmdk_backing = RbVmomi::VIM::VirtualDiskFlatVer2BackingInfo(
                  :datastore => ds.item,
                  :diskMode  => 'persistent',
                  :fileName  => "[#{ds_name}] #{img_name}"
                )
            end

            device = RbVmomi::VIM::VirtualDisk(
              :backing       => vmdk_backing,
              :capacityInKB  => size_kb,
              :controllerKey => controller.key,
              :key           => (-1 - position),
              :unitNumber    => unit_number
            )

            config = {
               :operation => :add,
               :device    => device
            }

            # For StorageDRS vCenter must create the file
            config[:fileOperation] = :create if storpod

            return config
        end
    end

    def resize_unmanaged_disk(disk, new_size)

        resize_hash = {}
        disks       = []
        found       = false

        unmanaged_keys = get_unmanaged_keys
        vc_disks = get_vcenter_disks

        vc_disks.each do |vcenter_disk|
            if unmanaged_keys.key?("opennebula.disk.#{disk["DISK_ID"]}")
                device_key = unmanaged_keys["opennebula.disk.#{disk["DISK_ID"]}"].to_i

                if device_key == vcenter_disk[:key].to_i

                    if disk["SIZE"].to_i <= disk["ORIGINAL_SIZE"].to_i
                        raise "Disk size cannot be shrinked."
                    end

                    # Edit capacity setting new size in KB
                    d = vcenter_disk[:device]
                    d.capacityInKB = disk["SIZE"].to_i * 1024
                    disks <<   { :device => d, :operation => :edit }

                    found = true
                    break
                end
            end
        end

        raise "Unmanaged disk could not be found to apply resize operation." if !found

        if !disks.empty?
            resize_hash[:deviceChange] = disks
            @item.ReconfigVM_Task(:spec => resize_hash).wait_for_completion
        else
            raise "Device was not found after attaching it to VM in poweroff."
        end
    end

    def resize_managed_disk(disk, new_size)

        resize_hash = {}

        unmanaged_keys = get_unmanaged_keys
        vc_disks       = get_vcenter_disks

        # Get vcenter device to be detached and remove if found
        device         = disk_attached_to_vm(disk, unmanaged_keys, vc_disks)

        # If the disk is being attached in poweroff, reconfigure the VM
        if !device
            spec_hash     = {}
            device_change = []

            # Get an array with disk paths in OpenNebula's vm template
            disks_in_onevm_vector = disks_in_onevm(unmanaged_keys, vc_disks)

            device_change_ds, device_change_spod, device_change_spod_ids = device_attach_disks(disks_in_onevm_vector, vc_disks)
            device_change += device_change_ds

            # Create volatile disks in StorageDRS if any
            if !device_change_spod.empty?
                spec_hash[:extraConfig] = create_storagedrs_disks(device_change_spod, device_change_spod_ids)
            end

            # Common reconfigure task
            spec_hash[:deviceChange] = device_change
            spec = RbVmomi::VIM.VirtualMachineConfigSpec(spec_hash)
            @item.ReconfigVM_Task(:spec => spec).wait_for_completion

            # Check again if device has now been attached
            unmanaged_keys = get_unmanaged_keys
            vc_disks       = get_vcenter_disks
            device         = disk_attached_to_vm(disk, unmanaged_keys, vc_disks)

            if !device
                raise "Device was not found after attaching it to VM in poweroff."
            end
        end

        # Resize disk now that we know that it's part of the VM
        if device
            vcenter_disk = device[:device]
            vcenter_disk.capacityInKB = new_size.to_i * 1024
            resize_hash[:deviceChange] = [{
                :operation => :edit,
                :device => vcenter_disk
            }]

            @item.ReconfigVM_Task(:spec => resize_hash).wait_for_completion
        end
    end

    def has_snapshots?
        self['rootSnapshot'] && !self['rootSnapshot'].empty?
    end

    def instantiated_as_persistent?
        begin
            !!one_item["TEMPLATE/CLONING_TEMPLATE_ID"]
        rescue
            return false #one_item may not be retrieved if deploy_id hasn't been set
        end
    end

    def find_free_ide_controller(position=0)

        free_ide_controllers = []
        ide_schema           = {}

        used_numbers      = []
        available_numbers = []

        @item["config.hardware.device"].each do |dev|
            if dev.is_a? RbVmomi::VIM::VirtualIDEController
                if ide_schema[dev.key].nil?
                    ide_schema[dev.key] = {}
                end

                ide_schema[dev.key][:device] = dev
            end

            next if dev.class != RbVmomi::VIM::VirtualCdrom
            used_numbers << dev.unitNumber
        end

        2.times do |ide_id|
            available_numbers << ide_id if used_numbers.grep(ide_id).length <= 0
        end

        ide_schema.keys.each do |controller|
            free_ide_controllers << ide_schema[controller][:device].deviceInfo.label
        end

        if free_ide_controllers.empty?
            raise "There are no free IDE controllers to connect this CDROM device"
        end

        available_controller_label = free_ide_controllers[0]

        controller = nil

        @item['config.hardware.device'].each do |device|
            if device.deviceInfo.label == available_controller_label
                controller = device
                break
            end
        end

        new_unit_number = available_numbers.sort[position]

        return controller, new_unit_number
    end

    def find_free_controller(position=0)
        free_scsi_controllers = []
        scsi_schema           = {}

        used_numbers      = []
        available_numbers = []

        @item["config.hardware.device"].each do |dev|
            if dev.is_a? RbVmomi::VIM::VirtualSCSIController
                if scsi_schema[dev.key].nil?
                    scsi_schema[dev.key] = {}
                end

                used_numbers << dev.scsiCtlrUnitNumber
                scsi_schema[dev.key][:device] = dev
            end

            next if dev.class != RbVmomi::VIM::VirtualDisk
            used_numbers << dev.unitNumber
        end

        15.times do |scsi_id|
            available_numbers << scsi_id if used_numbers.grep(scsi_id).length <= 0
        end

        scsi_schema.keys.each do |controller|
            free_scsi_controllers << scsi_schema[controller][:device].deviceInfo.label
        end

        if free_scsi_controllers.length > 0
            available_controller_label = free_scsi_controllers[0]
        else
            add_new_scsi(scsi_schema)
            return find_free_controller
        end

        controller = nil

        @item['config.hardware.device'].each do |device|
            if device.deviceInfo.label == available_controller_label
                controller = device
                break
            end
        end

        new_unit_number = available_numbers.sort[position]

        return controller, new_unit_number
    end

    def add_new_scsi(scsi_schema)
        controller = nil

        if scsi_schema.keys.length >= 4
            raise "Cannot add a new controller, maximum is 4."
        end

        scsi_key    = 0
        scsi_number = 0

        if scsi_schema.keys.length > 0 && scsi_schema.keys.length < 4
            scsi_key    = scsi_schema.keys.sort[-1] + 1
            scsi_number = scsi_schema[scsi_schema.keys.sort[-1]][:device].busNumber + 1
        end

        controller_device = RbVmomi::VIM::VirtualLsiLogicController(
            :key       => scsi_key,
            :busNumber => scsi_number,
            :sharedBus => :noSharing
        )

        device_config_spec = RbVmomi::VIM::VirtualDeviceConfigSpec(
            :device    => controller_device,
            :operation => :add
        )

        vm_config_spec = RbVmomi::VIM::VirtualMachineConfigSpec(
            :deviceChange => [device_config_spec]
        )

        @item.ReconfigVM_Task(:spec => vm_config_spec).wait_for_completion

        @item["config.hardware.device"].each do |device|
            if device.class == RbVmomi::VIM::VirtualLsiLogicController &&
                device.key == scsi_key

                controller = device.deviceInfo.label
            end
        end

        return controller
    end

    # Create a snapshot for the VM
    def create_snapshot(snap_id, snap_name)
        snapshot_hash = {
            :name        => snap_id,
            :description => "OpenNebula Snapshot: #{snap_name}",
            :memory      => true,
            :quiesce     => true
        }

        vcenter_version = @vi_client.vim.serviceContent.about.apiVersion rescue nil

        if vcenter_version != "5.5"
            begin
                @item.CreateSnapshot_Task(snapshot_hash).wait_for_completion
            rescue Exception => e
                raise "Cannot create snapshot for VM: #{e.message}\n#{e.backtrace.join("\n")}"
            end
        else
            # B#5045 - If vcenter is 5.5 the snapshot may take longer than
            # 15 minutes and it does not report that it has finished using
            # wait_for_completion so we use an active wait instead with a
            # timeout of 1440 minutes = 24 hours
            @item.CreateSnapshot_Task(snapshot_hash)

            snapshot_created  = false
            elapsed_minutes   = 0

            until snapshot_created || elapsed_minutes == 1440
                if !!@item['snapshot']
                    current_snapshot = @item['snapshot.currentSnapshot'] rescue nil
                    snapshot_found = find_snapshot_in_list(@item['snapshot.rootSnapshotList'], snap_id)
                    snapshot_created = !!snapshot_found && !!current_snapshot && current_snapshot._ref == snapshot_found._ref
                end
                sleep(60)
                elapsed_minutes += 1
            end
        end

        return snap_id
    end

    # Revert to a VM snapshot
    def revert_snapshot(snap_id)

        snapshot_list = self["snapshot.rootSnapshotList"]
        snapshot = find_snapshot_in_list(snapshot_list, snap_id)

        return nil if !snapshot

        begin
            revert_snapshot_hash = { :_this => snapshot }
            snapshot.RevertToSnapshot_Task(revert_snapshot_hash).wait_for_completion
        rescue Exception => e
            raise "Cannot revert snapshot of VM: #{e.message}\n#{e.backtrace.join("\n")}"
        end
    end

    # Delete VM snapshot
    def delete_snapshot(snap_id)

        snapshot_list = self["snapshot.rootSnapshotList"]
        snapshot = find_snapshot_in_list(snapshot_list, snap_id)

        return nil if !snapshot

        begin
            delete_snapshot_hash = {
                :_this => snapshot,
                :removeChildren => false
            }
            snapshot.RemoveSnapshot_Task(delete_snapshot_hash).wait_for_completion
        rescue Exception => e
            raise "Cannot delete snapshot of VM: #{e.message}\n#{e.backtrace.join("\n")}"
        end
    end

    def find_snapshot_in_list(list, snap_id)
        list.each do |i|
            if i.name == snap_id.to_s
                return i.snapshot
            elsif !i.childSnapshotList.empty?
                snap = find_snapshot_in_list(i.childSnapshotList, snap_id)
                return snap if snap
            end
        end rescue nil

        nil
    end

    def migrate(config = {})
        raise "You need at least 1 parameter" if config.size == 0

        begin
            # retrieve host from DRS
            resourcepool = config[:cluster].resourcePool

            @item.MigrateVM_Task(:pool=> resourcepool, :priority => "defaultPriority").wait_for_completion
        rescue Exception => e
            raise "Cannot migrate VM #{e.message}\n#{e.backtrace.join("\n")}"
        end
    end

    ############################################################################
    # actions
    ############################################################################

    def shutdown
        begin
            @item.ShutdownGuest
            # Check if VM has been powered off
            (0..VM_SHUTDOWN_TIMEOUT).each do
                break if @item.runtime.powerState == "poweredOff"
                sleep 1
            end
        rescue
            # Ignore ShutdownGuest exceptions, maybe VM hasn't openvm tools
        end

        # If VM hasn't been powered off, do it now
        if @item.runtime.powerState != "poweredOff"
            poweroff_hard
        end
    end

    def destroy
        @item.Destroy_Task.wait_for_completion
    end

    def mark_as_template
        @item.MarkAsTemplate
    end

    def reset
        @item.ResetVM_Task.wait_for_completion
    end

    def suspend
        @item.SuspendVM_Task.wait_for_completion
    end

    def reboot
        @item.RebootGuest
    end

    def poweron
        ## If need in the future, you can power on VMs from datacenter
        ## dc = get_dc
        ## dc.power_on_vm(@item)
        @item.PowerOnVM_Task.wait_for_completion
    end

    def is_powered_on?
        return @item.runtime.powerState == "poweredOn"
    end

    def poweroff_hard
        @item.PowerOffVM_Task.wait_for_completion
    end

    def remove_all_snapshots
        @item.RemoveAllSnapshots_Task.wait_for_completion
    end

    def set_running(state)
        value = state ? "yes" : "no"

        config_array = [
            { :key => "opennebula.vm.running", :value => value }
        ]
        spec = RbVmomi::VIM.VirtualMachineConfigSpec(
            { :extraConfig => config_array }
        )

        @item.ReconfigVM_Task(:spec => spec).wait_for_completion
    end

    ############################################################################
    # monitoring
    ############################################################################

    # monitor function used when VMM poll action is called
    def monitor_poll_vm
        reset_monitor

        @state = state_to_c(self["summary.runtime.powerState"])

        if @state != VM_STATE[:active]
            reset_monitor
            return
        end

        cpuMhz = self["runtime.host.summary.hardware.cpuMhz"].to_f

        @monitor[:used_memory] = self["summary.quickStats.hostMemoryUsage"] * 1024

        used_cpu = self["summary.quickStats.overallCpuUsage"].to_f / cpuMhz
        used_cpu = (used_cpu * 100).to_s
        @monitor[:used_cpu]  = sprintf('%.2f', used_cpu).to_s

        # Check for negative values
        @monitor[:used_memory] = 0 if @monitor[:used_memory].to_i < 0
        @monitor[:used_cpu]    = 0 if @monitor[:used_cpu].to_i < 0

        guest_ip_addresses = []
        self["guest.net"].each do |net|
            net.ipConfig.ipAddress.each do |ip|
                guest_ip_addresses << ip.ipAddress
            end if net.ipConfig && net.ipConfig.ipAddress
        end if self["guest.net"]

        @guest_ip_addresses = guest_ip_addresses.join(',')

        pm = self['_connection'].serviceInstance.content.perfManager

        provider = pm.provider_summary(@item)

        refresh_rate = provider.refreshRate

        if get_vm_id
            stats = {}

            if (one_item["MONITORING/LAST_MON"] && one_item["MONITORING/LAST_MON"].to_i != 0 )
                #Real time data stores max 1 hour. 1 minute has 3 samples
                interval = (Time.now.to_i - one_item["MONITORING/LAST_MON"].to_i)

                #If last poll was more than hour ago get 3 minutes,
                #else calculate how many samples since last poll
                samples =  interval > 3600 ? 9 : (interval / refresh_rate) + 1
                max_samples = samples > 0 ? samples : 1

                stats = pm.retrieve_stats(
                    [@item],
                    ['net.transmitted','net.bytesRx','net.bytesTx','net.received',
                    'virtualDisk.numberReadAveraged','virtualDisk.numberWriteAveraged',
                    'virtualDisk.read','virtualDisk.write'],
                    {interval:refresh_rate, max_samples: max_samples}
                ) rescue {}
            else
                # First poll, get at least latest 3 minutes = 9 samples
                stats = pm.retrieve_stats(
                    [@item],
                    ['net.transmitted','net.bytesRx','net.bytesTx','net.received',
                    'virtualDisk.numberReadAveraged','virtualDisk.numberWriteAveraged',
                    'virtualDisk.read','virtualDisk.write'],
                    {interval:refresh_rate, max_samples: 9}
                ) rescue {}
            end

            if !stats.empty? && !stats.first[1][:metrics].empty?
                metrics = stats.first[1][:metrics]

                nettx_kbpersec = 0
                if metrics['net.transmitted']
                    metrics['net.transmitted'].each { |sample|
                        nettx_kbpersec += sample if sample > 0
                    }
                end

                netrx_kbpersec = 0
                if metrics['net.bytesRx']
                    metrics['net.bytesRx'].each { |sample|
                        netrx_kbpersec += sample if sample > 0
                    }
                end

                read_kbpersec = 0
                if metrics['virtualDisk.read']
                    metrics['virtualDisk.read'].each { |sample|
                        read_kbpersec += sample if sample > 0
                    }
                end

                read_iops = 0
                if metrics['virtualDisk.numberReadAveraged']
                    metrics['virtualDisk.numberReadAveraged'].each { |sample|
                        read_iops += sample if sample > 0
                    }
                end

                write_kbpersec = 0
                if metrics['virtualDisk.write']
                    metrics['virtualDisk.write'].each { |sample|
                        write_kbpersec += sample if sample > 0
                    }
                end

                write_iops = 0
                if metrics['virtualDisk.numberWriteAveraged']
                    metrics['virtualDisk.numberWriteAveraged'].each { |sample|
                        write_iops += sample if sample > 0
                    }
                end
            else
                nettx_kbpersec = 0
                netrx_kbpersec = 0
                read_kbpersec  = 0
                read_iops      = 0
                write_kbpersec = 0
                write_iops     = 0
            end

            # Accumulate values if present
            previous_nettx = @one_item && @one_item["MONITORING/NETTX"] ? @one_item["MONITORING/NETTX"].to_i : 0
            previous_netrx = @one_item && @one_item["MONITORING/NETRX"] ? @one_item["MONITORING/NETRX"].to_i : 0
            previous_diskrdiops = @one_item && @one_item["MONITORING/DISKRDIOPS"] ? @one_item["MONITORING/DISKRDIOPS"].to_i : 0
            previous_diskwriops = @one_item && @one_item["MONITORING/DISKWRIOPS"] ? @one_item["MONITORING/DISKWRIOPS"].to_i : 0
            previous_diskrdbytes = @one_item && @one_item["MONITORING/DISKRDBYTES"] ? @one_item["MONITORING/DISKRDBYTES"].to_i : 0
            previous_diskwrbytes = @one_item && @one_item["MONITORING/DISKWRBYTES"] ? @one_item["MONITORING/DISKWRBYTES"].to_i : 0

            @monitor[:nettx] = previous_nettx + (nettx_kbpersec * 1024 * refresh_rate).to_i
            @monitor[:netrx] = previous_netrx + (netrx_kbpersec * 1024 * refresh_rate).to_i

            @monitor[:diskrdiops]  = previous_diskrdiops + read_iops
            @monitor[:diskwriops]  = previous_diskwriops + write_iops
            @monitor[:diskrdbytes] = previous_diskrdbytes + (read_kbpersec * 1024 * refresh_rate).to_i
            @monitor[:diskwrbytes] = previous_diskwrbytes + (write_kbpersec * 1024 * refresh_rate).to_i
        end
    end

    # monitor function used when poll action is called for all vms
    def monitor(stats)

        reset_monitor

        refresh_rate = 20 #20 seconds between samples (realtime)

        @state = state_to_c(@vm_info["summary.runtime.powerState"])

        return if @state != VM_STATE[:active]

        cpuMhz =  @vm_info[:esx_host_cpu]

        @monitor[:used_memory] = @vm_info["summary.quickStats.hostMemoryUsage"].to_i * 1024

        used_cpu = @vm_info["summary.quickStats.overallCpuUsage"].to_f / cpuMhz
        used_cpu = (used_cpu * 100).to_s
        @monitor[:used_cpu]  = sprintf('%.2f', used_cpu).to_s

        # Check for negative values
        @monitor[:used_memory] = 0 if @monitor[:used_memory].to_i < 0
        @monitor[:used_cpu]    = 0 if @monitor[:used_cpu].to_i < 0

        guest_ip_addresses = []
        @vm_info["guest.net"].each do |net|
            net.ipConfig.ipAddress.each do |ip|
                guest_ip_addresses << ip.ipAddress
            end if net.ipConfig && net.ipConfig.ipAddress
        end if self["guest.net"]

        @guest_ip_addresses = guest_ip_addresses.join(',')

        if stats.key?(@item)
            metrics = stats[@item][:metrics]

            nettx_kbpersec = 0
            if metrics['net.transmitted']
                metrics['net.transmitted'].each { |sample|
                    nettx_kbpersec += sample if sample > 0
                }
            end

            netrx_kbpersec = 0
            if metrics['net.bytesRx']
                metrics['net.bytesRx'].each { |sample|
                    netrx_kbpersec += sample if sample > 0
                }
            end

            read_kbpersec = 0
            if metrics['virtualDisk.read']
                metrics['virtualDisk.read'].each { |sample|
                    read_kbpersec += sample if sample > 0
                }
            end

            read_iops = 0
            if metrics['virtualDisk.numberReadAveraged']
                metrics['virtualDisk.numberReadAveraged'].each { |sample|
                    read_iops += sample if sample > 0
                }
            end

            write_kbpersec = 0
            if metrics['virtualDisk.write']
                metrics['virtualDisk.write'].each { |sample|
                    write_kbpersec += sample if sample > 0
                }
            end

            write_iops = 0
            if metrics['virtualDisk.numberWriteAveraged']
                metrics['virtualDisk.numberWriteAveraged'].each { |sample|
                    write_iops += sample if sample > 0
                }
            end
        else
            nettx_kbpersec = 0
            netrx_kbpersec = 0
            read_kbpersec  = 0
            read_iops      = 0
            write_kbpersec = 0
            write_iops     = 0
        end

        # Accumulate values if present
        previous_nettx = @one_item && @one_item["MONITORING/NETTX"] ? @one_item["MONITORING/NETTX"].to_i : 0
        previous_netrx = @one_item && @one_item["MONITORING/NETRX"] ? @one_item["MONITORING/NETRX"].to_i : 0
        previous_diskrdiops = @one_item && @one_item["MONITORING/DISKRDIOPS"] ? @one_item["MONITORING/DISKRDIOPS"].to_i : 0
        previous_diskwriops = @one_item && @one_item["MONITORING/DISKWRIOPS"] ? @one_item["MONITORING/DISKWRIOPS"].to_i : 0
        previous_diskrdbytes = @one_item && @one_item["MONITORING/DISKRDBYTES"] ? @one_item["MONITORING/DISKRDBYTES"].to_i : 0
        previous_diskwrbytes = @one_item && @one_item["MONITORING/DISKWRBYTES"] ? @one_item["MONITORING/DISKWRBYTES"].to_i : 0

        @monitor[:nettx] = previous_nettx + (nettx_kbpersec * 1024 * refresh_rate).to_i
        @monitor[:netrx] = previous_netrx + (netrx_kbpersec * 1024 * refresh_rate).to_i

        @monitor[:diskrdiops]  = previous_diskrdiops + read_iops
        @monitor[:diskwriops]  = previous_diskwriops + write_iops
        @monitor[:diskrdbytes] = previous_diskrdbytes + (read_kbpersec * 1024 * refresh_rate).to_i
        @monitor[:diskwrbytes] = previous_diskwrbytes + (write_kbpersec * 1024 * refresh_rate).to_i
    end



    #  Generates a OpenNebula IM Driver valid string with the monitor info
    def info
        return 'STATE=d' if @state == 'd'

        guest_ip = @vm_info ? @vm_info["guest.ipAddress"] : self["guest.ipAddress"]

        used_cpu    = @monitor[:used_cpu]
        used_memory = @monitor[:used_memory]
        netrx       = @monitor[:netrx]
        nettx       = @monitor[:nettx]
        diskrdbytes = @monitor[:diskrdbytes]
        diskwrbytes = @monitor[:diskwrbytes]
        diskrdiops  = @monitor[:diskrdiops]
        diskwriops  = @monitor[:diskwriops]

        esx_host      = @vm_info ? @vm_info[:esx_host_name].to_s : self["runtime.host.name"].to_s
        guest_state   = @vm_info ? @vm_info["guest.guestState"].to_s : self["guest.guestState"].to_s
        vmware_tools  = @vm_info ? @vm_info["guest.toolsRunningStatus"].to_s : self["guest.toolsRunningStatus"].to_s
        vmtools_ver   = @vm_info ? @vm_info["guest.toolsVersion"].to_s :  self["guest.toolsVersion"].to_s
        vmtools_verst = @vm_info ? @vm_info["guest.toolsVersionStatus2"].to_s : vmtools_verst = self["guest.toolsVersionStatus2"].to_s

        if @vm_info
            rp_name   = @vm_info[:rp_list].select { |item| item[:ref] == @vm_info["resourcePool"]._ref}.first[:name] rescue ""
            rp_name   = "Resources" if rp_name.empty?
        else
            rp_name   = self["resourcePool"].name
        end

        str_info = ""

        str_info = "GUEST_IP=" << guest_ip.to_s << " " if guest_ip

        if @guest_ip_addresses && !@guest_ip_addresses.empty?
            str_info << "GUEST_IP_ADDRESSES=\"" << @guest_ip_addresses.to_s << "\" "
        end

        str_info << "#{POLL_ATTRIBUTE[:state]}="  << @state               << " "
        str_info << "#{POLL_ATTRIBUTE[:cpu]}="    << used_cpu.to_s        << " "
        str_info << "#{POLL_ATTRIBUTE[:memory]}=" << used_memory.to_s     << " "
        str_info << "#{POLL_ATTRIBUTE[:netrx]}="  << netrx.to_s           << " "
        str_info << "#{POLL_ATTRIBUTE[:nettx]}="  << nettx.to_s           << " "

        str_info << "DISKRDBYTES=" << diskrdbytes.to_s << " "
        str_info << "DISKWRBYTES=" << diskwrbytes.to_s << " "
        str_info << "DISKRDIOPS="  << diskrdiops.to_s  << " "
        str_info << "DISKWRIOPS="  << diskwriops.to_s  << " "

        str_info << "VCENTER_ESX_HOST=\""                 << esx_host        << "\" "
        str_info << "VCENTER_GUEST_STATE="                << guest_state     << " "
        str_info << "VCENTER_VMWARETOOLS_RUNNING_STATUS=" << vmware_tools    << " "
        str_info << "VCENTER_VMWARETOOLS_VERSION="        << vmtools_ver     << " "
        str_info << "VCENTER_VMWARETOOLS_VERSION_STATUS=" << vmtools_verst   << " "
        str_info << "VCENTER_RP_NAME=\""                  << rp_name << "\" "
    end

    def reset_monitor
        @monitor = {
            :used_cpu    => 0,
            :used_memory => 0,
            :netrx       => 0,
            :nettx       => 0,
            :diskrdbytes => 0,
            :diskwrbytes => 0,
            :diskrdiops  => 0,
            :diskwriops  => 0
        }
    end

    # Converts the VI string state to OpenNebula state convention
    # Guest states are:
    # - poweredOff   The virtual machine is currently powered off.
    # - poweredOn    The virtual machine is currently powered on.
    # - suspended    The virtual machine is currently suspended.
    def state_to_c(state)
        case state
            when 'poweredOn'
                VM_STATE[:active]
            when 'suspended'
                VM_STATE[:paused]
            when 'poweredOff'
                VM_STATE[:deleted]
            else
                VM_STATE[:unknown]
        end
    end

    # STATIC MEMBERS AND CONSTRUCTORS
    ###############################################################################################

    def self.get_vm(opts = {})
        # try to retrieve machine from name
        if (opts[:name])
                matches = opts[:name].match(/^one-(\d*)(-(.*))?$/)
                if matches
                    id = matches[1]
                    one_vm = VCenterDriver::VIHelper.one_item(OpenNebula::VirtualMachine, id)
                end
        end

        if one_vm.nil?
            one_vm = VCenterDriver::VIHelper.find_by_ref(OpenNebula::VirtualMachinePool,
                                                         "DEPLOY_ID",
                                                         opts[:ref],
                                                         opts[:vc_uuid],
                                                         opts[:pool])
        end

        return one_vm
    end

    # Try to build the vcenterdriver virtualmachine without
    # any opennebula id or object, this constructor can find
    # inside the opennebula pool until match
    #
    # @param vi_client [vi_client] the vcenterdriver client that allows the connection
    # @param ref [String] vcenter ref to the vm
    # @param opts [Hash] object with pairs that could contain multiple option
    #        :vc_uuid: give the vcenter uuid directly
    #        :name:    the vcenter vm name for extract the opennebula id
    #
    # @return [vcenterdriver::vm] the virtual machine
    def self.new_from_ref(vi_client, ref, name, opts = {})
        unless opts[:vc_uuid]
            opts[:vc_uuid] = vi_client.vim.serviceContent.about.instanceUuid
        end

        opts[:name] = name
        opts[:ref]  = ref

        one_vm = VCenterDriver::VirtualMachine.get_vm(opts)

        self.new_one(vi_client, ref, one_vm)
    end

    # build a vcenterdriver virtual machine from a template
    # this function is used to instantiate vcenter vms
    #
    # @param vi_client [vi_client] the vcenterdriver client that allows the connection
    # @param drv_action [xmleleent] driver_action that contains the info
    # @param id [int] the if of the opennebula virtual machine
    #
    # @return [vcenterdriver::vm] the virtual machine
    def self.new_from_clone(vi_client, drv_action, id )
        spawn = self.new(vi_client, nil, id).tap do |vm|
            vm.clone_vm(drv_action)
        end

        return spawn
    end

    # build a vcenterdriver virtual machine
    # with the opennebula object linked
    #
    # @param vi_client [vi_client] the vcenterdriver client that allows the connection
    # @param ref [String] vcenter ref to the vm
    # @param one_item [one::vm] xmlelement of opennebula
    #
    # @return [vcenterdriver::vm] the virtual machine
    def self.new_one(vi_client, ref, one_item)
        id = one_item["ID"] || one_item["VM/ID"] rescue -1

        self.new(vi_client, ref, id).tap do |vm|
            vm.one_item = one_item
        end
    end

    # build a vcenterdriver virtual machine
    # without opennebula object link, use id = -1 instead
    #
    # @param vi_client [vi_client] the vcenterdriver client that allows the connection
    # @param ref [String] vcenter ref to the vm
    #
    # @return [vcenterdriver::vm] the virtual machine
    def self.new_without_id(vi_client, ref)
        self.new(vi_client, ref, -1)
    end

    ###############################################################################################
end # class VirtualMachine

end # module VCenterDriver
