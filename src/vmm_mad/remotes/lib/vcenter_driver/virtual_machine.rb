module VCenterDriver

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
                @items[item_name.to_sym] = VirtualMachine.new(item)
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

class VirtualMachine
    VM_PREFIX_DEFAULT = "one-$i-"

    POLL_ATTRIBUTE    = OpenNebula::VirtualMachine::Driver::POLL_ATTRIBUTE
    VM_STATE          = OpenNebula::VirtualMachine::Driver::VM_STATE

    VM_SHUTDOWN_TIMEOUT = 600 #10 minutes til poweroff hard

    attr_accessor :item

    include Memoize

    def initialize(item=nil, vi_client=nil)
        @item = item
        @vi_client = vi_client
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
        if @one_item.nil?
            vm_id = get_vm_id

            raise "Unable to find vm_id." if vm_id.nil?

            @one_item = VIHelper.one_item(OpenNebula::VirtualMachine, vm_id)
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

    # @return String the vm_id stored in vCenter
    def get_vm_id
        vm_id = self['config.extraConfig'].select do |o|
            o.key == "opennebula.vm.id"
        end.first.value rescue nil
    end

    ############################################################################
    # Getters
    ############################################################################

    # @return RbVmomi::VIM::ResourcePool
    def get_rp
        req_rp = one_item['USER_TEMPLATE/VCENTER_RP_REF']

        if vi_client.rp_confined?
            if req_rp && req_rp != vi_client.rp
                raise "Available resource pool in host [#{vi_client.rp}]"\
                      " does not match requested resource pool"\
                      " [#{req_rp}]"
            end

            return vi_client.rp
        else
            if req_rp
                rps = cluster.resource_pools.select{|r| r._ref == req_rp }

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
        req_ds = one_item['USER_TEMPLATE/VCENTER_DS_REF']

        if req_ds
            dc = cluster.get_dc

            ds_folder = dc.datastore_folder
            ds = ds_folder.get(req_ds)
            ds_item = ds.item rescue nil

            return ds_item
        else
            return nil
        end
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
                            .GetCustomizationSpec(:name => customization.text)

            if custom_spec && (spec = custom_spec.spec)
                return spec
            else
                raise "Error getting customization spec"
            end
        rescue
            raise "Customization spec '#{customization.text}' not found"
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

        VCenterDriver::Datastore.new_from_ref(ds_ref, vi_client)
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
    def clone_vm(one_item, vi_client)
        @one_item = one_item
        @vi_client = vi_client

        vcenter_name = get_vcenter_name

        vc_template_ref = one_item['USER_TEMPLATE/VCENTER_TEMPLATE_REF']
        vc_template = RbVmomi::VIM::VirtualMachine(vi_client.vim, vc_template_ref)

        ds = get_ds

        # Default disk move type (Full Clone)
        disk_move_type = :moveAllDiskBackingsAndDisallowSharing

        if ds.instance_of? RbVmomi::VIM::Datastore
            use_linked_clones = one_item['USER_TEMPLATE/VCENTER_LINKED_CLONES']
            if use_linked_clones && use_linked_clones.downcase == "yes"
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

        if ds.instance_of? RbVmomi::VIM::StoragePod
            # VM is cloned using Storage Resource Manager for StoragePods
            begin
                vm = storagepod_clonevm_task(vc_template, vcenter_name,
                                             clone_spec, ds)
            rescue Exception => e
                raise "Cannot clone VM Template to StoragePod: #{e.message}"
            end
        else
            vm = nil
            begin
                vm = vc_template.CloneVM_Task(
                    :folder => vc_template.parent,
                    :name   => vcenter_name,
                    :spec   => clone_spec).wait_for_completion
            rescue Exception => e
                if !e.message.start_with?('DuplicateName')
                    raise "Cannot clone VM Template: #{e.message}\n#{e.backtrace}"
                end

                vm_folder = cluster.get_dc.vm_folder
                vm_folder.fetch!
                vm = vm_folder.items
                        .select{|k,v| v.item.name == vcenter_name}
                        .values.first.item rescue nil

                if vm
                    vm.Destroy_Task.wait_for_completion
                    vm = vc_template.CloneVM_Task(
                        :folder => vc_template.parent,
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


    def storagepod_clonevm_task(vc_template, vcenter_name, clone_spec, storpod)

        storage_manager = vc_template
                            ._connection.serviceContent.storageResourceManager

        storage_spec = RbVmomi::VIM.StoragePlacementSpec(
            type: 'clone',
            cloneName: vcenter_name,
            folder: vc_template.parent,
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
            raise "Failure applying recommendation: #{e.message}"
        end
    end

    # @return clone parameters spec hash
    def spec_hash_clone(disk_move_type)
        # Relocate spec
        relocate_spec_params = {}

        relocate_spec_params[:pool] = get_rp
        relocate_spec_params[:diskMoveType] = disk_move_type

        ds = get_ds

        relocate_spec_params[:datastore] = ds if ds.instance_of? Datastore

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

    def reference_imported_disks
        # Add info for existing disks in template in vm xml
        xpath = "TEMPLATE/DISK[OPENNEBULA_MANAGED=\"NO\"]"
        non_managed_disks = one_item.retrieve_xmlelements(xpath)

        return if non_managed_disks.empty?

        # Update VM's one_item so it can use the recent attributes
        vcenter_disks = get_vcenter_disks
        vcenter_disks.each_with_index do |disk, index|
            if !!non_managed_disks[index]
                rc = one_item.update("VCENTER_TEMPLATE_DISK_#{non_managed_disks[index]["DISK_ID"]} = \"#{disk[:path]}\"", true)
                raise "Could not update VCENTER_TEMPLATE_DISK elements" if OpenNebula.is_error?(rc)
                rc = one_item.update("VCENTER_TEMPLATE_DS_DISK_#{non_managed_disks[index]["DISK_ID"]} = \"#{disk[:datastore]._ref}\"", true)
                raise "Could not update VCENTER_TEMPLATE_DS_DISK elements" if OpenNebula.is_error?(rc)
            end
        end
        one_item.info
    end

    def reference_imported_nics
        mac_change_hash = {}
        nics = []

        # Add info for existing disks in template in vm xml
        xpath = "TEMPLATE/NIC[OPENNEBULA_MANAGED=\"NO\"]"
        unmanaged_nics = one_item.retrieve_xmlelements(xpath)

        return if unmanaged_nics.empty?

        # Update vcenter VM's mac addresses with the one in OpenNebula's XML
        index = 0
        @item["config.hardware.device"].each_with_index do |device|
            if is_nic?(device)
                # Edit capacity setting new size in KB
                device.macAddress = unmanaged_nics[index]["MAC"]
                nics << { :device => device, :operation => :edit }
                index += 1
            end
        end

        if !nics.empty?
            mac_change_hash[:deviceChange] = nics
            @item.ReconfigVM_Task(:spec => mac_change_hash).wait_for_completion
        end
    end

    def resize_imported_disks
        resize_hash = {}
        disks = []

        # Look for unmanaged disks with original size changed
        xpath = "TEMPLATE/DISK[OPENNEBULA_MANAGED=\"NO\" and boolean(ORIGINAL_SIZE)]"
        unmanaged_resized_disks = one_item.retrieve_xmlelements(xpath)

        return if unmanaged_resized_disks.empty?

        @item["config.hardware.device"].each do |d|
            if is_disk_or_cdrom?(d)
                unmanaged_resized_disks.each do |disk|
                    backing = d.backing

                    while backing.respond_to?(:parent)
                        break if backing.parent.nil?
                        backing = backing.parent
                    end

                    if backing.respond_to?(:fileName)
                        img_name = one_item["USER_TEMPLATE/VCENTER_TEMPLATE_DISK_#{disk["DISK_ID"]}"]
                        if img_name && backing.fileName == img_name &&
                           disk["SIZE"].to_i > disk["ORIGINAL_SIZE"].to_i

                            # Edit capacity setting new size in KB
                            d.capacityInKB = disk["SIZE"].to_i * 1024
                            disks <<   { :device => d, :operation => :edit }
                            break
                        end
                    end
                end
            end
        end

        if !disks.empty?
            resize_hash[:deviceChange] = disks
            @item.ReconfigVM_Task(:spec => resize_hash).wait_for_completion
        end
    end


    def reconfigure
        extraconfig   = []
        device_change = []

        # get vmid
        extraconfig += extraconfig_vmid

        # get token and context
        extraconfig += extraconfig_context

        # vnc configuration (for config_array hash)
        extraconfig += extraconfig_vnc

        # device_change hash (nics)
        device_change += device_change_nics

        # device_change hash (disks)
        device_change += device_change_disks

        num_cpus = one_item["TEMPLATE/VCPU"] || 1

        spec_hash = {
            :numCPUs      => num_cpus.to_i,
            :memoryMB     => one_item["TEMPLATE/MEMORY"],
            :extraConfig  => extraconfig
        }

        spec_hash[:deviceChange] = device_change if !device_change.empty?

        spec = RbVmomi::VIM.VirtualMachineConfigSpec(spec_hash)

        @item.ReconfigVM_Task(:spec => spec).wait_for_completion
    end

    def extraconfig_vmid
        [
            { :key => "opennebula.vm.id", :value => one_item['ID'] }
        ]
    end

    def extraconfig_context
        # TODO: migrator to 5.4 (create token.sh)
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
        vnc_port   = one_item["TEMPLATE/GRAPHICS/PORT"]
        vnc_listen = one_item["TEMPLATE/GRAPHICS/LISTEN"] || "0.0.0.0"
        vnc_keymap = one_item["TEMPLATE/GRAPHICS/KEYMAP"]

        conf = [ {:key => "remotedisplay.vnc.enabled",:value => "TRUE"},
                 {:key => "remotedisplay.vnc.port",   :value => vnc_port},
                 {:key => "remotedisplay.vnc.ip",     :value => vnc_listen}]

        conf += [{:key => "remotedisplay.vnc.keymap",
                          :value => vnc_keymap}] if vnc_keymap

        conf
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
        @item["config.hardware.device"].each do |dv|
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

        #TODO include VCENTER_NET_MODEL usage it should be in one_item
        mac       = nic["MAC"]
        bridge    = nic["BRIDGE"]
        model     = nic["VCENTER_NET_MODEL"]
        vnet_ref  = nic["VCENTER_NET_REF"]
        backing   = nil

        limit_in  = nic["INBOUND_PEAK_BW"]
        limit_out = nic["OUTBOUND_PEAK_BW"]
        limit     = nil

        if limit_in && limit_out
            limit=([limit_in.to_i, limit_out.to_i].min / 1024) * 8
        end

        rsrv_in  = nic["INBOUND_AVG_BW"]
        rsrv_out = nic["OUTBOUND_AVG_BW"]
        rsrv     = nil

        if rsrv_in || rsrv_out
            rsrv=([rsrv_in.to_i, rsrv_out.to_i].min / 1024) * 8
        end

        network = self["runtime.host.network"].select do |n|
            n._ref == vnet_ref
        end

        if network.empty?
            raise "Network #{bridge} not found in host #{self['runtime.host.name']}"
        else
            network = network.first
        end

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
                        :deviceName => bridge,
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
                :summary => bridge
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

    # Add NIC to VM
    def attach_nic
        spec_hash = {}
        nic = nil

        # Extract nic from driver action
        nic = one_item.retrieve_xmlelements("TEMPLATE/NIC[ATTACH='YES']").first

        # A new NIC requires a vcenter spec
        attach_nic_array = []
        attach_nic_array << calculate_add_nic_spec(nic)
        spec_hash[:deviceChange] = attach_nic_array if !attach_nic_array.empty?

        # Reconfigure VM
        spec = RbVmomi::VIM.VirtualMachineConfigSpec(spec_hash)

        begin
            @item.ReconfigVM_Task(:spec => spec).wait_for_completion
        rescue Exception => e
            raise "Cannot attach NIC to VM: #{e.message}\n#{e.backtrace}"
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

        raise "Could not find NIC with mac address #{mac}" if nic_device.nil?

        # Remove NIC from VM in the ReconfigVM_Task
        spec_hash[:deviceChange] = [
                :operation => :remove,
                :device => nic_device ]

        begin
            @item.ReconfigVM_Task(:spec => spec_hash).wait_for_completion
        rescue Exception => e
            raise "Cannot detach NIC from VM: #{e.message}\n#{e.backtrace}"
        end

    end

    #  Checks if a RbVmomi::VIM::VirtualDevice is a network interface
    def is_nic?(device)
        !device.class.ancestors.index(RbVmomi::VIM::VirtualEthernetCard).nil?
    end

    def device_change_disks
        disks = []
        one_item.each("TEMPLATE/DISK") { |disk| disks << disk if !disk["OPENNEBULA_MANAGED"] }

        if !is_new?
            @item["config.hardware.device"].each do |d|
                if is_disk_or_cdrom?(d)
                    disks.each do |disk|
                        backing = d.backing

                        while backing.respond_to?(:parent)
                            break if backing.parent.nil?
                            backing = backing.parent
                        end

                        if backing.respond_to?(:fileName)
                            # Check if we are dealing with the unmanaged disks present in the template when cloned
                            if disk["OPENNEBULA_MANAGED"] && disk["OPENNEBULA_MANAGED"] == "NO"
                                img_name = one_item["USER_TEMPLATE/VCENTER_TEMPLATE_DISK_#{disk["DISK_ID"]}"]
                                if img_name && backing.fileName == img_name
                                    disks.delete(disk)
                                    break
                                end
                            end

                            # Alright let's see if we can find other devices only with the expected image name
                            img_name  = VCenterDriver::FileHelper.get_img_name(disk, one_item['ID'], self['name'])
                            ds        = get_effective_ds(disk)
                            ds_name   = ds['name']
                            if backing.fileName == "[#{ds_name}] #{img_name}"
                                disks.delete(disk)
                                break
                            end
                        end
                    end
                end
            end
        end

        return [] if disks.empty?

        position = 0
        attach_disk_array = []
        disks.each do |disk|
            attach_disk_array << calculate_add_disk_spec(disk, position)
            position += 1
        end

        attach_disk_array
    end

    # Attach DISK to VM (hotplug)
    def attach_disk
        # TODO position? and disk size for volatile?

        spec_hash = {}
        disk = nil
        device_change = []

        # Extract disk from driver action
        disk = one_item.retrieve_xmlelements("TEMPLATE/DISK[ATTACH='YES']").first

        # Check if disk being attached is already connected to the VM
        raise "DISK is already connected to VM" if disk_attached_to_vm(disk)

        # Generate vCenter spec and reconfigure VM
        device_change << calculate_add_disk_spec(disk)
        raise "Could not generate DISK spec" if device_change.empty?

        spec_hash[:deviceChange] = device_change
        spec = RbVmomi::VIM.VirtualMachineConfigSpec(spec_hash)

        begin
            @item.ReconfigVM_Task(:spec => spec).wait_for_completion
        rescue Exception => e
            raise "Cannot attach DISK to VM: #{e.message}\n#{e.backtrace}"
        end
    end

    # Detach DISK from VM
    def detach_disk(disk)
        spec_hash = {}
        img_path = ""
        ds_ref = nil

        # Get vcenter device to be detached and remove if found
        device = disk_attached_to_vm(disk)
        if device
            img_path << device.backing.fileName.sub(/^\[(.*?)\] /, "")
            ds_ref = device.backing.datastore._ref
            # Generate vCenter spec and reconfigure VM
            spec_hash[:deviceChange] = [{
                :operation => :remove,
                :device => device
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
    def disk_attached_to_vm(disk)
        img_name = ""
        device_found = nil
        @item["config.hardware.device"].each do |d|
            if is_disk_or_cdrom?(d)
                backing = d.backing

                # Backing may be a delta disk (snapshots)
                while backing.respond_to?(:parent)
                    break if backing.parent.nil?
                    backing = backing.parent
                end

                if backing.respond_to?(:fileName)
                    # Check if we are dealing with the unmanaged disks present in the template when cloned
                    if disk["OPENNEBULA_MANAGED"] && disk["OPENNEBULA_MANAGED"] == "NO"
                        img_name = one_item["USER_TEMPLATE/VCENTER_TEMPLATE_DISK_#{disk["DISK_ID"]}"]
                        if img_name && backing.fileName == img_name
                            device_found = d
                            break
                        end
                    else
                        # Alright let's see if we can find other devices only with the expected image name
                        img_name  = VCenterDriver::FileHelper.get_img_name(disk, one_item['ID'], self['name'])
                        ds        = get_effective_ds(disk)
                        ds_name   = ds['name']
                        if backing.fileName == "[#{ds_name}] #{img_name}"
                            device_found = d
                            break
                        end
                    end
                end
            end
        end

        return device_found
    end

    def calculate_add_disk_spec(disk, position=0)
        img_name = VCenterDriver::FileHelper.get_img_name(disk, one_item['ID'], self['name'])
        ds       = get_effective_ds(disk)

        ds_name  = ds['name']
        type     = disk["TYPE"]

        # TODO: size_kb = 0 ??
        size_kb = 0

        controller, new_number = find_free_controller(position)

        if type == "CDROM"
            vmdk_backing = RbVmomi::VIM::VirtualCdromIsoBackingInfo(
                :datastore => ds.item,
                :fileName  => "[#{ds_name}] #{img_name}"
            )

            cd = self['config.hardware.device'].select  do |hw|
                hw.class == RbVmomi::VIM::VirtualCdrom
            end.first

            # If no CDROM drive present, we need to add it
            if !cd
                controller, _ = find_free_controller

                device = RbVmomi::VIM::VirtualCdrom(
                    :backing       => vmdk_backing,
                    :key           => -1,
                    :controllerKey => 15000,
                    :unitNumber    => 0,

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
                device = RbVmomi::VIM::VirtualCdrom(
                    backing: vmdk_backing,
                    key: cd.key,
                    controllerKey: cd.controllerKey,
                    connectable: RbVmomi::VIM::VirtualDeviceConnectInfo(
                        startConnected: true,
                        connected: true,
                        allowGuestControl: true
                    )
                )

                return {
                   :operation => :edit,
                   :device    => device
                }
            end
        else
            # TYPE is regular disk (not CDROM)
            vmdk_backing = RbVmomi::VIM::VirtualDiskFlatVer2BackingInfo(
                  :datastore => ds.item,
                  :diskMode  => 'persistent',
                  :fileName  => "[#{ds_name}] #{img_name}"
            )

            device = RbVmomi::VIM::VirtualDisk(
              :backing       => vmdk_backing,
              :capacityInKB  => size_kb,
              :controllerKey => controller.key,
              :key           => -1,
              :unitNumber    => new_number
            )

            {
               :operation => :add,
               :device    => device
            }
        end
    end

    def has_snapshots?
        self['rootSnapshot'] && !self['rootSnapshot'].empty?
    end

    def get_vcenter_disks
        disks = []
        @item["config.hardware.device"].each do |device|
            disk = {}
            if is_disk_or_iso?(device)
                disk[:device]    = device
                disk[:datastore] = device.backing.datastore
                disk[:path]      = device.backing.fileName
                disk[:type]      = is_disk?(device) ? "OS" : "CDROM"
                disks << disk
            end
        end
        return disks
    end

    def get_vcenter_nics
        nics = []
        @item["config.hardware.device"].each do |device|
            nic = {}
            if is_nic?(device)
                nic[:net_name]  = device.backing.network.name
                nic[:net_ref]   = device.backing.network._ref
                nic[:pg_type]   = VCenterDriver::Network.get_network_type(device)
                nics << nic
            end
        end
        return nics
    end

    def import_vcenter_disks(vc_uuid, dpool, ipool)
        disk_info = ""
        error = ""

        ccr_ref = self["runtime.host.parent._ref"]

        #Get disks and info required
        vc_disks = get_vcenter_disks

        # Track allocated images
        allocated_images = []

        vc_disks.each do |disk|

            datastore_found = VCenterDriver::Storage.get_one_image_ds_by_ref_and_ccr(disk[:datastore]._ref,
                                                                                     ccr_ref,
                                                                                     vc_uuid,
                                                                                     dpool)
            if datastore_found.nil?
                error = "    Error datastore #{disk[:datastore].name}: has to be imported first as an image datastore!\n"

                #Rollback delete disk images
                allocated_images.each do |i|
                    i.delete
                end

                break
            end

            image_import = VCenterDriver::Datastore.get_image_import_template(disk[:datastore].name,
                                                                                disk[:path],
                                                                                disk[:type], ipool)
            #Image is already in the datastore
            if image_import[:one]
                one_image = image_import[:one]
                # We must update XML so the OPENNEBULA_MANAGED=NO is set
                rc = one_image.update("OPENNEBULA_MANAGED = \"NO\"", true)
                if OpenNebula.is_error?(rc)
                    error = "Could not update VCENTER_TEMPLATE_DISK elements"
                    break
                end

                # This is the disk info
                disk_info << "DISK=[\n"
                disk_info << "IMAGE=\"#{one_image["NAME"]}\"\n"
                disk_info << "]\n"
            elsif !image_import[:template].empty?
                # Then the image is created as it's not in the datastore
                one_i = VCenterDriver::VIHelper.new_one_item(OpenNebula::Image)

                allocated_images << one_i

                rc = one_i.allocate(image_import[:template], datastore_found['ID'].to_i)

                if ::OpenNebula.is_error?(rc)
                    error = "    Error creating disk from template: #{rc.message}. Cannot import the template\n"

                    #Rollback delete disk images
                    allocated_images.each do |i|
                        i.delete
                    end

                    break
                end

                #Add info for One template
                one_i.info
                disk_info << "DISK=[\n"
                disk_info << "IMAGE=\"#{one_i["NAME"]}\",\n"
                disk_info << "IMAGE_UNAME=\"#{one_i["UNAME"]}\"\n"
                disk_info << "]\n"
            end
        end

        return error, disk_info
    end

    def import_vcenter_nics(vc_uuid, npool)
        nic_info = ""
        error = ""

        ccr_ref  = self["runtime.host.parent._ref"]
        ccr_name = self["runtime.host.parent.name"]

        #Get disks and info required
        vc_nics = get_vcenter_nics

        # Track allocated networks
        allocated_networks = []

        vc_nics.each do |nic|

            network_found = VCenterDriver::Network.get_one_vnet_ds_by_ref_and_ccr(nic[:net_ref],
                                                                                  ccr_ref,
                                                                                  vc_uuid,
                                                                                  npool)
            #Network is already in the datastore
            if network_found
                # This is the existing nic info
                nic_info << "NIC=[\n"
                nic_info << "NETWORK=\"#{network_found["NAME"]}\",\n"
                nic_info << "OPENNEBULA_MANAGED=\"NO\"\n"
                nic_info << "]\n"
            else
                # Then the network has to be created as it's not in OpenNebula
                one_vn = VCenterDriver::VIHelper.new_one_item(OpenNebula::VirtualNetwork)

                allocated_networks << one_vn

                vlan_id = "" # TODO VLAN ID management
                one_vnet = VCenterDriver::Network.to_one_template(nic[:net_name],
                                                                  nic[:net_ref],
                                                                  nic[:pg_type],
                                                                  vlan_id,
                                                                  ccr_ref,
                                                                  ccr_name,
                                                                  vc_uuid)

                # By default add an ethernet range to network size 255
                ar_str = ""
                ar_str << "AR=[\n"
                ar_str << "TYPE=\"ETHER\",\n"
                ar_str << "SIZE=\"255\"\n"
                ar_str << "]\n"
                one_vnet[:one] << ar_str

                rc = one_vn.allocate(one_vnet[:one])

                if ::OpenNebula.is_error?(rc)
                    error = "    Error creating virtual network from template: #{rc.message}. Cannot import the template\n"

                    #Rollback, delete virtual networks
                    allocated_networks.each do |n|
                        n.delete
                    end

                    break
                end

                #Add info for One template
                one_vn.info
                nic_info << "NIC=[\n"
                nic_info << "NETWORK=\"#{one_vn["NAME"]}\",\n"
                nic_info << "OPENNEBULA_MANAGED=\"NO\"\n"
                nic_info << "]\n"
            end
        end

        return error, nic_info
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

    def find_free_controller(position=0)
        free_scsi_controllers = []
        scsi_schema           = {}

        used_numbers      = []
        available_numbers = []

        @item["config.hardware.device"].each do |dev|
            if dev.is_a? RbVmomi::VIM::VirtualSCSIController
                if scsi_schema[dev.controllerKey].nil?
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
            :description => snap_name,
            :memory      => true,
            :quiesce     => true
        }

        begin
            @item.CreateSnapshot_Task(snapshot_hash).wait_for_completion
        rescue Exception => e
            raise "Cannot create snapshot for VM: #{e.message}\n#{e.backtrace}"
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
            raise "Cannot revert snapshot of VM: #{e.message}\n#{e.backtrace}"
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
            raise "Cannot delete snapshot of VM: #{e.message}\n#{e.backtrace}"
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
        @item.RebootGuest.wait_for_completion
    end

    def poweron
        @item.PowerOnVM_Task.wait_for_completion
    end

    def poweroff_hard
        @item.PowerOffVM_Task.wait_for_completion
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

    def to_one(template=false)
        cluster  = self["runtime.host.parent.name"]
        ccr_ref  = self["runtime.host.parent._ref"]
        vc_uuid  = self["_connection.serviceContent.about.instanceUuid"]

        # Get info of the host where the VM/template is located
        host_id = nil
        one_host = VCenterDriver::VIHelper.find_by_ref(OpenNebula::HostPool,
                                                       "TEMPLATE/VCENTER_CCR_REF",
                                                       ccr_ref,
                                                       vc_uuid)
        host_id = one_host["ID"] if one_host

        str = "NAME   = \"#{self["name"]} - #{cluster}\"\n"\
              "CPU    = \"#{@item["config.hardware.numCPU"]}\"\n"\
              "vCPU   = \"#{@item["config.hardware.numCPU"]}\"\n"\
              "MEMORY = \"#{@item["config.hardware.memoryMB"]}\"\n"\
              "HYPERVISOR = \"vcenter\"\n"\
              "SCHED_REQUIREMENTS=\"ID=\\\"#{host_id}\\\"\"\n"\
              "CONTEXT = [\n"\
              "    NETWORK = \"YES\",\n"\
              "    SSH_PUBLIC_KEY = \"$USER[SSH_PUBLIC_KEY]\"\n"\
              "]\n"\
              "VCENTER_INSTANCE_ID =\"#{vc_uuid}\"\n"

        if !template
            str << "IMPORT_VM_ID =\"#{self["_ref"]}\"\n"
            str << "IMPORT_STATE =\"#{@state}\"\n"
        end

        if template
            str << "VCENTER_TEMPLATE_REF =\"#{self['_ref']}\"\n"
            str << "VCENTER_CCR_REF =\"#{ccr_ref}\"\n"
        end

        vnc_port = nil
        keymap = nil

        if !template
            @item["config.extraConfig"].select do |xtra|

                if xtra[:key].downcase=="remotedisplay.vnc.port"
                    vnc_port = xtra[:value]
                end

                if xtra[:key].downcase=="remotedisplay.vnc.keymap"
                    keymap = xtra[:value]
                end
            end
        end

        if @item["config.extraConfig"].size > 0
            str << "GRAPHICS = [\n"\
                   "  TYPE     =\"vnc\",\n"
            str << "  PORT     =\"#{vnc_port}\",\n" if vnc_port
            str << "  KEYMAP   =\"#{keymap}\",\n" if keymap
            str << "  LISTEN   =\"0.0.0.0\"\n"
            str << "]\n"
        end

        if @item["config.annotation"].nil? || @item["config.annotation"].empty?
            str << "DESCRIPTION = \"vCenter Template imported by OpenNebula" \
                " from Cluster #{cluster}\"\n"
        else
            notes = @item["config.annotation"].gsub("\\", "\\\\").gsub("\"", "\\\"")
            str << "DESCRIPTION = \"#{notes}\"\n"
        end

        case self["guest.guestFullName"]
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

    def to_one_template(template, ds, ds_list, default_ds,
                        rp, rp_list, vcenter_uuid)

        template_name = template['name']
        template_ref  = template['_ref']
        template_ccr  = template['runtime.host.parent']
        cluster_name  = template['runtime.host.parent.name']

        one_tmp = {}
        one_tmp[:name]                  = "#{template_name} - #{cluster_name}"
        one_tmp[:template_name]         = template_name
        one_tmp[:vcenter_ccr_ref]       = template_ccr._ref
        one_tmp[:one]                   = to_one(true)
        one_tmp[:vcenter_ref]           = template_ref
        one_tmp[:vcenter_instance_uuid] = vcenter_uuid
        one_tmp[:cluster_name]          = cluster_name
        one_tmp[:ds]                    = ds
        one_tmp[:ds_list]               = ds_list
        one_tmp[:default_ds]            = default_ds
        one_tmp[:rp]                    = rp
        one_tmp[:rp_list]               = rp_list
        one_tmp[:template]              = template
        return one_tmp
    end

    def monitor
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

        ########################################################################
        # PerfManager metrics
        ########################################################################
        pm = self['_connection'].serviceInstance.content.perfManager

        provider = pm.provider_summary(@item)

        refresh_rate = provider.refreshRate

        if !get_vm_id
            @nettx       = 0
            @netrx       = 0
            @diskrdbytes = 0
            @diskwrbytes = 0
            @diskrdiops  = 0
            @diskwriops  = 0
        else
            stats = []

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
                )
            else
                # First poll, get at least latest 3 minutes = 9 samples
                stats = pm.retrieve_stats(
                    [@item],
                    ['net.transmitted','net.bytesRx','net.bytesTx','net.received',
                    'virtualDisk.numberReadAveraged','virtualDisk.numberWriteAveraged',
                    'virtualDisk.read','virtualDisk.write'],
                    {interval:refresh_rate, max_samples: 9}
                )
            end

            if stats.empty? || stats.first[1][:metrics].empty?
                @nettx = 0
                @netrx = 0
                @diskrdbytes = 0
                @diskwrbytes = 0
                @diskrdiops = 0
                @diskwriops = 0
            else
                metrics = stats.first[1][:metrics]

                nettx_kbpersec = 0
                if metrics['net.transmitted']
                    metrics['net.transmitted'].each { |sample|
                        nettx_kbpersec += sample
                    }
                end

                netrx_kbpersec = 0
                if metrics['net.bytesRx']
                    metrics['net.bytesRx'].each { |sample|
                        netrx_kbpersec += sample
                    }
                end

                read_kbpersec = 0
                if metrics['virtualDisk.read']
                    metrics['virtualDisk.read'].each { |sample|
                        read_kbpersec += sample
                    }
                end

                read_iops = 0
                if metrics['virtualDisk.numberReadAveraged']
                    metrics['virtualDisk.numberReadAveraged'].each { |sample|
                        read_iops += sample
                    }
                end

                write_kbpersec = 0
                if metrics['virtualDisk.write']
                    metrics['virtualDisk.write'].each { |sample|
                        write_kbpersec += sample
                    }
                end

                write_iops = 0
                if metrics['virtualDisk.numberWriteAveraged']
                    metrics['virtualDisk.numberWriteAveraged'].each { |sample|
                        write_iops += sample
                    }
                end

                @nettx = (nettx_kbpersec * 1024 * refresh_rate).to_i
                @netrx = (netrx_kbpersec * 1024 * refresh_rate).to_i

                @diskrdiops = read_iops
                @diskwriops = write_iops
                @diskrdbytes = (read_kbpersec * 1024 * refresh_rate).to_i
                @diskwrbytes = (write_kbpersec * 1024 * refresh_rate).to_i
                @diskwrbytes = (write_kbpersec * 1024 * refresh_rate).to_i
            end
        end
    end

    #  Generates a OpenNebula IM Driver valid string with the monitor info
    def info
        return 'STATE=d' if @state == 'd'

        guest_ip = self["guest.ipAddress"]

        used_cpu    = @monitor[:used_cpu]
        used_memory = @monitor[:used_memory]
        netrx       = @monitor[:netrx]
        nettx       = @monitor[:nettx]
        diskrdbytes = @monitor[:diskrdbytes]
        diskwrbytes = @monitor[:diskwrbytes]
        diskrdiops  = @monitor[:diskrdiops]
        diskwriops  = @monitor[:diskwriops]

        esx_host      = self["runtime.host.name"].to_s
        guest_state   = self["guest.guestState"].to_s
        vmware_tools  = self["guest.toolsRunningStatus"].to_s
        vmtools_ver   = self["guest.toolsVersion"].to_s
        vmtools_verst = self["guest.toolsVersionStatus2"].to_s

        str_info = ""

        str_info = "GUEST_IP=" << guest_ip.to_s << " " if guest_ip

        if @guest_ip_addresses && !@guest_ip_addresses.empty?
            str_info << "GUEST_IP_ADDRESSES=\"" << @guest_ip_addresses.to_s << "\" "
        end

        str_info << "LAST_MON=" << Time.now.to_i.to_s << " "

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
        str_info << "VCENTER_RP_REF=\""                   << self["resourcePool"]._ref << "\" "
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

    # TODO check with uuid
    def self.new_from_ref(ref, vi_client)
        self.new(RbVmomi::VIM::VirtualMachine.new(vi_client.vim, ref), vi_client)
    end

end # class VirtualMachine

end # module VCenterDriver
