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

            host_id = one_item["HISTORY_RECORDS/HISTORY/HID"]
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
        req_rp = one_item['USER_TEMPLATE/RESOURCE_POOL']

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

            # TODO: add storage pods

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
    # Crate and reconfigure VM related methods
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

        clone_spec = RbVmomi::VIM.VirtualMachineCloneSpec(spec_hash_clone)

        ds = get_ds

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
    def spec_hash_clone
        # Relocate spec
        relocate_spec_params = {}

        relocate_spec_params[:pool] = get_rp

        ds = get_ds

        if ds.instance_of? Datastore
            relocate_spec_params[:datastore] = ds
            relocate_spec_params[:diskMoveType] = :moveChildMostDiskBacking
        end

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
            { :key => "guestinfo.opennebula.context", :value => context_text }
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

        # List of interfaces from the OpenNebula template
        nics = []
        one_item.each("TEMPLATE/NIC") { |nic| nics << nic }

        # Remove detached nics in poweroff
        if !is_new?
            # To be included in device_change
            detach_nic_array = []

            # Get MACs from NICs inside VM template
            one_mac_addresses = []
            nics.each do |nic|
                one_mac_addresses << nic["MAC"]
            end rescue nil

            # B4897 - Get mac of NICs that were hot-plugged from vCenter
            #  extraConfig
            # Get opennebula.hotplugged_nics attribute from the vCenter object
            hotplugged_nics = []
            extraconfig_nics = self["config.extraConfig"].select do |val|
                val[:key] == "opennebula.hotplugged_nics"
            end

            if extraconfig_nics && !extraconfig_nics.empty?
                hotplugged_nics = extraconfig_nics[0][:value].to_s.split(";")
            end

            self["config.hardware.device"].each do |dv|
                if is_nic?(dv)
                    # nics array will contain the list of nics to be attached
                    nics.each do |nic|
                        if nic["MAC"] == dv.macAddress
                            nics.delete(nic)
                        end
                    end

                    # if the nic is in the list opennebula.hotplugged_nics and
                    #  not in the list of the OpenNebula NICs we can remove it.
                    # B4897 - Remove detached NICs from vCenter that were unplugged
                    #  in POWEROFF
                    if !one_mac_addresses.include?(dv.macAddress) &&
                        hotplugged_nics.include?(dv.macAddress)

                        detach_nic_array << {
                            :operation => :remove,
                            :device    => dv
                        }

                        hotplugged_nics.delete(dv.macAddress)
                        config_array << {
                            :key    => 'opennebula.hotplugged_nics',
                            :value  => hotplugged_nics.join(";")
                        }
                    end
                end
            end

            device_change += detach_nic_array
        end

        return [] if nics.empty?

        # Attach new nics (nics now contains only the interfaces not present
        # in the VM in vCenter)
        attach_nic_array = []
        nics.each do |nic|
            attach_nic_array << calculate_add_nic_spec(nic)
        end

        attach_nic_array
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

        #TODO include VCENTER_NET_REF usage it should be in one_item
        mac     = nic["MAC"]
        bridge  = nic["BRIDGE"]
        model   = nic["MODEL"]
        backing = nil

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
            n.name == bridge
        end

        if network.empty?
            raise "Network #{bridge} not found in host #{self['runtime.host.name']}"
        else
            network = network.first
        end

        card_num = 1 # start in one, we want the next avaliable id

        self["config.hardware.device"].each do |dv|
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
    def attach_nic(nic)

        spec_hash = {}

        # A new NIC requires a vcenter spec
        attach_nic_array = []
        attach_nic_array << calculate_add_nic_spec(nic)
        spec_hash[:deviceChange] = attach_nic_array if !attach_nic_array.empty?

        # Get mac addresses plugged to the VM B#4897
        hotplugged_nics = self["config.extraConfig"].select do |val|
            val[:key] == "opennebula.hotplugged_nics"
        end.first[:value].to_s.split(";") rescue nil

        # Include MAC in opennebula.hotplugged_nics variable
        if hotplugged_nics && !hotplugged_nics.empty?
            if !hotplugged_nics.include?(nic["MAC"])
                hotplugged_nics << nic["MAC"]
            end
        else
            hotplugged_nics = []
            hotplugged_nics << nic["MAC"]
        end

        spec_hash[:extraConfig] = [{
            :key=>"opennebula.hotplugged_nics",
            :value=>hotplugged_nics.join(";")}]

        # Reconfigure VM
        spec = RbVmomi::VIM.VirtualMachineConfigSpec(spec_hash)

        begin
            @item.ReconfigVM_Task(:spec => spec).wait_for_completion
        rescue Exception => e
            raise "Cannot attach NIC to VM: #{e.message}\n#{e.backtrace}"
        end

    end

    # Detach NIC from VM
    def detach_nic(nic)

        spec_hash = {}

        mac = nic["MAC"]

        # Get VM nic element if it has a device with that mac
        nic_device = self["config.hardware.device"].find do |device|
                is_nic?(device) && (device.macAddress ==  mac)
        end rescue nil

        raise "Could not find NIC with mac address #{mac}" if nic_device.nil?

        # Get mac addresses plugged to the VM B#4897
        hotplugged_nics = self["config.extraConfig"].select do |val|
            val[:key] == "opennebula.hotplugged_nics"
        end.first[:value].to_s.split(";") rescue nil

        # Remove MAC from opennebula.hotplugged_nics variable if included
        if hotplugged_nics &&
            !hotplugged_nics.empty? && hotplugged_nics.include?(mac)

            hotplugged_nics.delete(mac)

            spec_hash[:extraConfig] = [{
                :key=>"opennebula.hotplugged_nics",
                :value=>hotplugged_nics.join(";")}]
        end

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
        one_item.each("TEMPLATE/DISK") { |disk| disks << disk }

        if !is_new?
            self["config.hardware.device"].each do |d|
                if is_disk_or_cdrom?(d)
                    disks.each do |disk|
                        img_name  = VCenterDriver::FileHelper.get_img_name(disk, one_item['ID'])
                        ds        = get_effective_ds(disk)
                        ds_name   = ds['name']

                        if d.backing.respond_to?(:fileName) &&
                           "[#{ds_name}] #{img_name}" == d.backing.fileName

                            disks.delete(disk)
                        end
                    end
                end
            end
        end

        return [] if disks.nil?

        position = 0
        attach_disk_array = []
        disks.each do |disk|
            attach_disk_array << calculate_add_disk_spec(disk)
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

    # Detach DISK from VM (hotplug)
    def detach_disk(disk)
        spec_hash = {}

        # Check if disk being detached is connected to the VM
        device = disk_attached_to_vm(disk)
        raise "DISK is not connected to VM" if device.nil?

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

    # Detach all DISKs from VM (terminate action)
    def detach_all_disks
        spec_hash = {}
        spec_hash[:deviceChange] = []

        self["config.hardware.device"].each do |disk|
            if is_disk_or_cdrom?(disk)
                spec_hash[:deviceChange] << {
                    :operation => :remove,
                    :device => disk
                }
            end
        end

        return nil if spec_hash[:deviceChange].empty?

        begin
            @item.ReconfigVM_Task(:spec => spec_hash).wait_for_completion
        rescue Exception => e
            raise "Cannot detach all DISKs from VM: #{e.message}\n#{e.backtrace}"
        end
    end

    # Get vcenter device representing DISK object (hotplug)
    def disk_attached_to_vm(disk)
        img_name  = VCenterDriver::FileHelper.get_img_name(disk, one_item['ID'])
        ds        = get_effective_ds(disk)
        ds_name   = ds['name']

        device = self["config.hardware.device"].select do |d|
            is_disk_or_cdrom?(d) &&
            d.backing.respond_to?(:fileName) &&
            d.backing.fileName == "[#{ds_name}] #{img_name}"
        end rescue nil

        return nil if device.empty?

        return device.first
    end

    def calculate_add_disk_spec(disk, position=0)
        img_name = VCenterDriver::FileHelper.get_img_name(disk, one_item['ID'])
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

    #  Checks if a RbVmomi::VIM::VirtualDevice is a disk
    def is_disk_or_cdrom?(device)
        is_disk  = !(device.class.ancestors.index(RbVmomi::VIM::VirtualDisk)).nil?
        is_cdrom = !(device.class.ancestors.index(RbVmomi::VIM::VirtualCdrom)).nil?
        is_disk || is_cdrom
    end

    def find_free_controller(position=0)
        free_scsi_controllers = []
        available_controller  = nil
        scsi_schema           = {}

        used_numbers      = []
        available_numbers = []

        self["config.hardware.device"].each do |dev|
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

        self['config.hardware.device'].each do |device|
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

        if scsi_schema.keys.length == 0
            scsi_key    = 0
            scsi_number = 0
        else scsi_schema.keys.length < 4
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

        self["config.hardware.device"].each do |device|
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
                snap = find_snapshot(i.childSnapshotList, snap_id)
                return snap if snap
            end
        end rescue nil

        nil
    end

    ############################################################################
    # actions
    ############################################################################

    def shutdown
        # Ignore ShutdownGuest exceptions, maybe VM hasn't openvm tools
        @item.ShutdownGuest rescue nil

        # Check if VM has been powered off
        (0..VM_SHUTDOWN_TIMEOUT).each do
            break if @item.runtime.powerState == "poweredOff"
            sleep 1
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

    # @param ccr_host Hash that holds the relationship between the vcenter's ref
    # and the host in OpenNebula
    def to_one(ccr_host)
        cluster = self["runtime.host.parent.name"]

        ccr     = self["runtime.host.parent._ref"]
        host_id = ccr_host[ccr]

        str = "NAME   = \"#{self["name"]} - #{cluster}\"\n"\
              "CPU    = \"#{self["config.hardware.numCPU"]}\"\n"\
              "vCPU   = \"#{self["config.hardware.numCPU"]}\"\n"\
              "MEMORY = \"#{self["config.hardware.memoryMB"]}\"\n"\
              "HYPERVISOR = \"vcenter\"\n"\
              "IMPORT_VM_ID =\"#{self["config.uuid"]}\"\n"\
              "IMPORT_STATE =\"#{@state}\"\n"\
              "SCHED_REQUIREMENTS=\"ID=\\\"#{host_id}\\\"\"\n"\
              "CONTEXT = [\n"\
              "    NETWORK = \"YES\",\n"\
              "    SSH_PUBLIC_KEY = \"$USER[SSH_PUBLIC_KEY]\"\n"\
              "]\n"

        vnc_port = nil
        keymap = nil
        self["config.extraConfig"].select do |xtra|

            if xtra[:key].downcase=="remotedisplay.vnc.port"
                vnc_port = xtra[:value]
            end

            if xtra[:key].downcase=="remotedisplay.vnc.keymap"
                keymap = xtra[:value]
            end
        end

        if self["config.extraConfig"].size > 0
            str << "GRAPHICS = [\n"\
                   "  TYPE     =\"vnc\",\n"\
                   "  LISTEN   =\"0.0.0.0\",\n"
            str << "  PORT     =\"#{vnc_port}\",\n" if vnc_port
            str << "  KEYMAP   =\"#{keymap}\"\n" if keymap
            str << "]\n"
        end

        if self["config.annotation"].nil? || self["config.annotation"].empty?
            str << "DESCRIPTION = \"vCenter Template imported by OpenNebula" \
                " from Cluster #{cluster}\"\n"
        else
            notes = self["config.annotation"].gsub("\\", "\\\\").gsub("\"", "\\\"")
            str << "DESCRIPTION = \"#{notes}\"\n"
        end

        case self["guest.guestFullName"]
            when /CentOS/i
                str << "LOGO=images/logos/centos.png"
            when /Debian/i
                str << "LOGO=images/logos/debian.png"
            when /Red Hat/i
                str << "LOGO=images/logos/redhat.png"
            when /Ubuntu/i
                str << "LOGO=images/logos/ubuntu.png"
            when /Windows XP/i
                str << "LOGO=images/logos/windowsxp.png"
            when /Windows/i
                str << "LOGO=images/logos/windows8.png"
            when /Linux/i
                str << "LOGO=images/logos/linux.png"
        end

        return str
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
        vmtools_verst = self["guest.toolsVersionStatus"].to_s

        str_info = ""

        str_info = "GUEST_IP=" << guest_ip.to_s << " " if guest_ip

        if @guest_ip_addresses && !@guest_ip_addresses.empty?
            str_info << "GUEST_IP_ADDRESSES=\\\"" << @guest_ip_addresses.to_s << "\\\" "
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

        str_info << "ESX_HOST=\\\""               << esx_host        << "\\\" "
        str_info << "GUEST_STATE="                << guest_state     << " "
        str_info << "VMWARETOOLS_RUNNING_STATUS=" << vmware_tools    << " "
        str_info << "VMWARETOOLS_VERSION="        << vmtools_ver     << " "
        str_info << "VMWARETOOLS_VERSION_STATUS=" << vmtools_verst   << " "
        str_info << "RESOURCE_POOL=\\\""          << self["resourcePool.name"] << "\\\" "
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
