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
module VCenterDriver

    ONE_LOCATION = ENV['ONE_LOCATION'] unless defined?(ONE_LOCATION)

    if !ONE_LOCATION
        unless defined?(RUBY_LIB_LOCATION)
            RUBY_LIB_LOCATION = '/usr/lib/one/ruby'
        end
        unless defined?(GEMS_LOCATION)
            GEMS_LOCATION = '/usr/share/one/gems'
        end
    else
        unless defined?(RUBY_LIB_LOCATION)
            RUBY_LIB_LOCATION = ONE_LOCATION + '/lib/ruby'
        end
        unless defined?(GEMS_LOCATION)
            GEMS_LOCATION = ONE_LOCATION + '/share/gems'
        end
    end

# rubocop: disable all
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
# rubocop: enable all

    $LOAD_PATH << RUBY_LIB_LOCATION

    require 'vm_device'
    require 'vm_helper'
    require 'vm_monitor'

    ############################################################################
    # Class VirtualMachine
    ############################################################################
    class VirtualMachine < VCenterDriver::Template

        # Supported access to VirtualMachineDevice classes:
        # Example:
        #           Disk
        #           VirtualMachineDevice::Disk
        #           VCenterDriver::VirtualMachine::Disk
        include VirtualMachineDevice
        include VirtualMachineHelper
        include VirtualMachineMonitor

        ########################################################################
        # Virtual Machine main Class
        ########################################################################

        VM_PREFIX_DEFAULT = 'one-$i-'

        POLL_ATTRIBUTE =
            OpenNebula::VirtualMachine::Driver::POLL_ATTRIBUTE
        VM_STATE =
            OpenNebula::VirtualMachine::Driver::VM_STATE

        DNET_CARD =
            RbVmomi::VIM::VirtualEthernetCardDistributedVirtualPortBackingInfo
        NET_CARD =
            RbVmomi::VIM::VirtualEthernetCardNetworkBackingInfo
        OPAQUE_CARD =
            RbVmomi::VIM::VirtualEthernetCardOpaqueNetworkBackingInfo

        VM_SHUTDOWN_TIMEOUT = 600 # 10 minutes til poweroff hard

        attr_accessor :item, :vm_id

        attr_accessor :vm_info

        include Memoize

        def initialize(vi_client, ref, one_id)
            if ref
                ref = VCenterDriver::VIHelper.get_deploy_id(ref)
                @item = RbVmomi::VIM::VirtualMachine.new(vi_client.vim, ref)
                check_item(@item, RbVmomi::VIM::VirtualMachine)
            end

            super(@item, vi_client)

            @vi_client = vi_client
            @vm_id     = one_id
            @locking   = true
            @vm_info   = nil
            @disks     = {}
            @nics = { :macs => {} }
        end

        ########################################################################
        ########################################################################

        # Attributes that must be defined when the VM does not exist in vCenter
        attr_accessor :vi_client

        # these have their own getter (if they aren't set, we can set them
        # dynamically)
        attr_writer :one_item
        attr_writer :host
        attr_writer :target_ds_ref

        ########################################################################
        ########################################################################

        # The OpenNebula VM
        # @return OpenNebula::VirtualMachine or XMLElement
        def one_item
            unless @one_item

                if @vm_id == -1
                    raise 'VCenterDriver::Virtualmachine: '\
                          'OpenNebula ID is mandatory for this vm!'
                end

                @one_item =
                    VIHelper
                    .one_item(
                        OpenNebula::VirtualMachine,
                        @vm_id
                    )
            end

            @one_item
        end

        # set the vmware item directly to the vm
        def item_update(item)
            @item = item
        end

        def disk_real_path(disk, disk_id)
            volatile = disk['TYPE'] == 'fs'

            if volatile
                dir = disk['VCENTER_DS_VOLATILE_DIR'] || 'one-volatile'
                img_path = "#{dir}/#{@vm_id}/one-#{@vm_id}-#{disk_id}.vmdk"
            else
                source = disk['SOURCE'].gsub('%20', ' ')
                folder = File.dirname(source)
                ext    = File.extname(source)
                file   = File.basename(source, ext)

                img_path = "#{folder}/#{file}-#{@vm_id}-#{disk_id}#{ext}"
            end

            img_path
        end

        # The OpenNebula host
        # @return OpenNebula::Host or XMLElement
        def host
            if @host.nil?
                if one_item.nil?
                    raise "'one_item' must be previously set to be able to " <<
                          'access the OpenNebula host.'
                end

                host_id = one_item['HISTORY_RECORDS/HISTORY[last()]/HID']
                raise 'No valid host_id found.' if host_id.nil?

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
                          'access the target Datastore.'
                end

                target_ds_id = one_item['HISTORY_RECORDS/HISTORY[last()]/DS_ID']
                raise 'No valid target_ds_id found.' if target_ds_id.nil?

                target_ds =
                    VCenterDriver::VIHelper
                    .one_item(
                        OpenNebula::Datastore,
                        target_ds_id
                    )

                @target_ds_ref = target_ds['TEMPLATE/VCENTER_DS_REF']
            end

            @target_ds_ref
        end

        # Get a recommendation from a provided storagepod
        # Returns the recommended datastore reference
        def recommended_ds(ds_ref)
            # Fail if datastore is not a storage pod
            unless ds_ref.start_with?('group-')
                raise 'Cannot recommend from a non storagepod reference'
            end

            # Retrieve information needed to create storage_spec hash
            storage_manager =
                vi_client
                .vim
                .serviceContent
                .storageResourceManager
            vcenter_name = vc_name
            vc_template =
                RbVmomi::VIM::VirtualMachine
                .new(
                    vi_client.vim,
                    get_template_ref
                )
            dc = cluster.datacenter
            vcenter_vm_folder_object = vcenter_folder(vcenter_folder_ref,
                                                      vc_template, dc)
            storpod = get_ds(ds_ref)
            disk_move_type = calculate_disk_move_type(storpod, vc_template,
                                                      linked_clones)
            spec_hash = spec_hash_clone(disk_move_type)
            clone_spec = RbVmomi::VIM.VirtualMachineCloneSpec(spec_hash)

            # Create hash needed to get the recommendation
            storage_spec = RbVmomi::VIM.StoragePlacementSpec(
                :type => 'clone',
                :cloneName => vcenter_name,
                :folder => vcenter_vm_folder_object,
                :podSelectionSpec =>
                    RbVmomi::VIM
                        .StorageDrsPodSelectionSpec(
                            :storagePod => storpod
                        ),
                :vm => vc_template,
                :cloneSpec => clone_spec
            )

            # Query a storage placement recommendation
            result = storage_manager
                     .RecommendDatastores(
                         :storageSpec => storage_spec
                     ) rescue nil
            if result.nil?
                raise 'Could not get placement specification for StoragePod'
            end

            if !result.respond_to?(:recommendations) ||
                result.recommendations.empty?
                raise 'Could not get placement specification for StoragePod'
            end

            # Return recommended DS reference
            result.recommendations.first.action.first.destination._ref
        end

        # Cached cluster
        # @return ClusterComputeResource
        def cluster
            if @cluster.nil?
                ccr_ref = host['TEMPLATE/VCENTER_CCR_REF']
                @cluster = ClusterComputeResource.new_from_ref(ccr_ref,
                                                               vi_client)
            end

            @cluster
        end

        ########################################################################
        ########################################################################

        # @return Boolean whether the VM exists in vCenter
        def new?
            one_item['DEPLOY_ID'].empty?
        end

        def wild?
            !(one_item['TEMPLATE/IMPORTED'] &&
                one_item['TEMPLATE/IMPORTED'] == 'YES').nil?
        end

        # @return Boolean wheter the vm exists in OpenNebula
        def one_exist?
            !@vm_id.nil? && @vm_id != -1
        end

        # @return String the vm_id stored in vCenter
        def get_vm_id(vm_pool = nil)
            if defined?(@vm_id) && @vm_id
                return @vm_id
            end

            vm_ref = self['_ref']
            return unless vm_ref

            vc_uuid = vcenter_instance_uuid

            one_vm =
                VCenterDriver::VIHelper
                .find_by_ref(
                    OpenNebula::VirtualMachinePool,
                    'DEPLOY_ID',
                    vm_ref,
                    vc_uuid,
                    vm_pool
                )
            return unless one_vm

            @vm_id = one_vm['ID']
            @vm_id
        end

        def vcenter_instance_uuid
            @vi_client.vim.serviceContent.about.instanceUuid
        end

        def disk_keys
            unmanaged_keys = {}
            @item.config.extraConfig.each do |val|
                u = val[:key].include?('opennebula.disk')
                m = val[:key].include?('opennebula.mdisk')
                unmanaged_keys[val[:key]] = val[:value] if u || m
            end

            unmanaged_keys
        end

        ########################################################################
        # Getters
        ########################################################################

        # @return RbVmomi::VIM::ResourcePool
        def resource_pool
            req_rp = one_item['VCENTER_RESOURCE_POOL'] ||
                    one_item['USER_TEMPLATE/VCENTER_RESOURCE_POOL']

            # Get ref for req_rp
            rp_list    = cluster.get_resource_pool_list
            req_rp_ref = rp_list.select do |rp|
                             rp[:name].downcase == req_rp.downcase
                         end.first[:ref] rescue nil

            if vi_client.rp_confined?
                if req_rp_ref && req_rp_ref != vi_client.rp._ref
                    raise 'Available resource pool '\
                          "[#{vi_client.rp.name}] in host"\
                          ' does not match requested resource pool'\
                          " [#{req_rp}]"
                end

                vi_client.rp
            else
                if req_rp_ref
                    rps = cluster.resource_pools.select do |r|
                        r._ref == req_rp_ref
                    end

                    if rps.empty?
                        raise "No matching resource pool found (#{req_rp})."
                    end

                    rps.first
                else
                    cluster['resourcePool']
                end
            end
        end

        # @return RbVmomi::VIM::Datastore or nil
        def get_ds(current_ds_ref = nil)
            if !current_ds_ref
                current_ds_id =
                    one_item[
                        'HISTORY_RECORDS/HISTORY[last()]/DS_ID'
                    ]
                current_ds = VCenterDriver::VIHelper.one_item(
                    OpenNebula::Datastore, current_ds_id
                )
                current_ds_ref = current_ds['TEMPLATE/VCENTER_DS_REF']
            end

            if current_ds_ref
                dc = cluster.datacenter

                ds_folder = dc.datastore_folder
                ds = ds_folder.get(current_ds_ref)
                ds.item rescue nil

            else
                nil
            end
        end

        # StorageResouceManager reference
        def storagemanager
            self['_connection.serviceContent.storageResourceManager']
        end

        # @return Customization or nil
        def customization_spec
            xpath = 'USER_TEMPLATE/VCENTER_CUSTOMIZATION_SPEC'
            customization_spec = one_item[xpath]

            if customization_spec.nil?
                return
            end

            begin
                custom_spec = vi_client
                              .vim
                              .serviceContent
                              .customizationSpecManager
                              .GetCustomizationSpec(
                                  :name => customization_spec
                              )

                unless custom_spec && (spec = custom_spec.spec)
                    raise 'Error getting customization spec'
                end

                spec
            rescue StandardError
                raise "Customization spec '#{customization_spec}' not found"
            end
        end

        # @return VCenterDriver::Datastore datastore
        # where the disk will live under
        def get_effective_ds(disk)
            if disk['PERSISTENT'] == 'YES'
                ds_ref = disk['VCENTER_DS_REF']
            else
                ds_ref = target_ds_ref

                if ds_ref.nil?
                    raise 'target_ds_ref must be defined on this object.'
                end
            end

            VCenterDriver::Storage.new_from_ref(ds_ref, vi_client)
        end

        # @return String vcenter name
        def vc_name
            vm_prefix = host['TEMPLATE/VM_PREFIX']
            vm_prefix = VM_PREFIX_DEFAULT if vm_prefix.nil?

            if !one_item['USER_TEMPLATE/VM_PREFIX'].nil?
                vm_prefix = one_item['USER_TEMPLATE/VM_PREFIX']
            end
            vm_prefix.gsub!('$i', one_item['ID'])

            vm_suffix = ''
            if !one_item['USER_TEMPLATE/VM_SUFFIX'].nil?
                vm_suffix = one_item['USER_TEMPLATE/VM_SUFFIX']
            end
            vm_suffix.gsub!('$i', one_item['ID'])

            vm_prefix + one_item['NAME'] + vm_suffix
        end

        # @return vCenter Tags
        def vcenter_tags
            one_item.info if one_item.instance_of?(OpenNebula::VirtualMachine)
            one_item.retrieve_xmlelements('USER_TEMPLATE/VCENTER_TAG')
        end

        # @return if has vCenter Tags
        def vcenter_tags?
            !vcenter_tags.empty?
        end

        # @return if has cpuHotAddEnabled
        def cpu_hot_add_enabled?
            one_item.info if one_item.instance_of?(
                OpenNebula::VirtualMachine
            )

            if one_item['USER_TEMPLATE/HOT_RESIZE/CPU_HOT_ADD_ENABLED'].nil?
                return false
            end

            one_item[
                'USER_TEMPLATE/HOT_RESIZE/CPU_HOT_ADD_ENABLED'
            ] == 'YES'
        end

        # @return if has memoryHotAddEnabled
        def memory_hot_add_enabled?
            one_item.info if one_item.instance_of?(
                OpenNebula::VirtualMachine
            )

            if one_item['USER_TEMPLATE/HOT_RESIZE/MEMORY_HOT_ADD_ENABLED'].nil?
                return false
            end

            one_item[
                'USER_TEMPLATE/HOT_RESIZE/MEMORY_HOT_ADD_ENABLED'
            ] == 'YES'
        end

        ########################################################################
        # Create and reconfigure VM related methods
        ########################################################################

        # This function permit get a folder by name if exist
        # or create it if not exist
        def find_or_create_folder(folder_root, name)
            folder_root.childEntity.each do |child|
                if child.instance_of?(RbVmomi::VIM::Folder) &&
                    child.name == name
                    return child
                end
            end

            folder_root.CreateFolder(:name => name)
        end

        # This function creates a new VM from the
        # driver_action XML and returns the
        # VMware ref
        # @param drv_action XML representing the deploy action
        # @return String vmware ref
        def clone_vm(drv_action)
            vcenter_name = vc_name

            dc = cluster.datacenter

            vcenter_vm_folder = drv_action['USER_TEMPLATE/VCENTER_VM_FOLDER']

            if !vcenter_vm_folder.nil? && !vcenter_vm_folder.empty?
                vcenter_vm_folder =
                    vcenter_folder_name(vcenter_vm_folder, drv_action)

                vcenter_vm_folder_object =
                    dc.item.find_folder(vcenter_vm_folder)

                if vcenter_vm_folder_object.nil?
                    begin
                        dc.item.vmFolder.CreateFolder(
                            :name => vcenter_vm_folder
                        )
                    rescue StandardError => e
                        error_message = e.message
                        if VCenterDriver::CONFIG[:debug_information]
                            error_message += ' ' + e.backtrace
                        end
                        raise 'Cannot create Folder in vCenter:'\
                              "#{error_message}"
                    end
                end
            end

            vcenter_vm_folder = drv_action['USER_TEMPLATE/VCENTER_VM_FOLDER']

            if !vcenter_vm_folder.nil? && !vcenter_vm_folder.empty?
                vcenter_vm_folder =
                    vcenter_folder_name(vcenter_vm_folder, drv_action)

                vcenter_vm_folder_object =
                    dc.item.find_folder(vcenter_vm_folder)

                if vcenter_vm_folder_object.nil?
                    begin
                        vcenter_vm_folder_list = vcenter_vm_folder.split('/')
                        folder_root = dc.item.vmFolder

                        vcenter_vm_folder_list.each do |folder_name|
                            folder_root = find_or_create_folder(
                                folder_root,
                                folder_name
                            )
                        end
                    rescue StandardError => e
                        error_message = e.message
                        if VCenterDriver::CONFIG[:debug_information]
                            error_message += ' ' + e.backtrace
                        end

                        raise 'Cannot create Folder in vCenter: '\
                              "#{error_message}"
                    end
                end
            end

            vc_template_ref = drv_action['USER_TEMPLATE/VCENTER_TEMPLATE_REF']
            vc_template = RbVmomi::VIM::VirtualMachine(@vi_client.vim,
                                                       vc_template_ref)

            ds = get_ds

            asking_for_linked_clones =
                drv_action[
                    'USER_TEMPLATE/VCENTER_LINKED_CLONES'
                ]
            disk_move_type = calculate_disk_move_type(ds,
                                                      vc_template,
                                                      asking_for_linked_clones)

            spec_hash = spec_hash_clone(disk_move_type)

            clone_spec = RbVmomi::VIM.VirtualMachineCloneSpec(spec_hash)

            vcenter_vm_folder_object =
                vcenter_folder(
                    vcenter_vm_folder,
                    vc_template,
                    dc
                )

            if ds.instance_of? RbVmomi::VIM::StoragePod
                # VM is cloned using Storage Resource Manager for StoragePods
                begin
                    opts = {
                        :vc_template => vc_template,
                        :vcenter_name => vcenter_name,
                        :clone_spec => clone_spec,
                        :storpod => ds,
                        :vcenter_vm_folder_object => vcenter_vm_folder_object,
                        :dc => dc
                    }

                    vm = storagepod_clonevm_task(opts)
                rescue StandardError => e
                    error =
                        "Cannot clone VM Template to StoragePod: #{e.message}."

                    if VCenterDriver::CONFIG[:debug_information]
                        error += "\n\n#{e.backtrace}"
                    end

                    raise error
                end
            else
                vm = nil
                begin
                    vm = vc_template.CloneVM_Task(
                        :folder => vcenter_vm_folder_object,
                        :name   => vcenter_name,
                        :spec   => clone_spec
                    ).wait_for_completion
                rescue StandardError => e
                    if !e.message.start_with?('DuplicateName')
                        raise "Cannot clone VM Template: #{e.message}"
                    end

                    vm_folder = dc.vm_folder
                    vm_folder.fetch!
                    vm = vm_folder.items
                                  .select {|_k, v| v.item.name == vcenter_name }
                                  .values.first.item rescue nil

                    raise "Cannot clone VM Template: #{e.message}" unless vm

                    # Detach all persistent disks to
                    # avoid accidental destruction
                    detach_persistent_disks(vm)

                    vm.Destroy_Task.wait_for_completion
                    vm = vc_template.CloneVM_Task(
                        :folder => vcenter_vm_folder_object,
                        :name   => vcenter_name,
                        :spec   => clone_spec
                    ).wait_for_completion
                end
            end

            # @item is populated
            @item = vm

            reference_unmanaged_devices(vc_template_ref)

            self['_ref']
        end

        # This function clone a VM Template to StoragePod
        # @param opts HASH with all parameters need it to clone
        # opts = {
        #   :vc_template => vc_template,
        #   :vcenter_name => vcenter_name,
        #   :clone_spec => clone_spec,
        #   :storpod => ds,
        #   :vcenter_vm_folder_object => vcenter_vm_folder_object,
        #   :dc => dc
        # }
        # @return vm (VirtualMachine)
        def storagepod_clonevm_task(opts)
            vc_template = opts[:vc_template]
            vcenter_name = opts[:vcenter_name]
            clone_spec = opts[:clone_spec]
            storpod = opts[:storpod]
            vcenter_vm_folder_object = opts[:vcenter_vm_folder_object]
            dc = opts[:dc]

            storage_manager =
                vc_template
                ._connection
                .serviceContent
                .storageResourceManager

            storage_spec = RbVmomi::VIM.StoragePlacementSpec(
                :type => 'clone',
                :cloneName => vcenter_name,
                :folder => vcenter_vm_folder_object,
                :podSelectionSpec =>
                    RbVmomi::VIM
                        .StorageDrsPodSelectionSpec(
                            :storagePod => storpod
                        ),
                :vm => vc_template,
                :cloneSpec => clone_spec
            )

            # Query a storage placement recommendation
            result = storage_manager
                     .RecommendDatastores(
                         :storageSpec => storage_spec
                     ) rescue nil

            if result.nil?
                raise 'Could not get placement specification for StoragePod'
            end

            if !result
               .respond_to?(
                   :recommendations
               ) || result.recommendations.empty?
                raise 'Could not get placement specification for StoragePod'
            end

            # Get recommendation key to be applied
            key = result.recommendations.first.key ||= ''
            if key.empty?
                raise 'Missing Datastore recommendation for StoragePod'
            end

            begin
                apply_sr = storage_manager
                           .ApplyStorageDrsRecommendation_Task(:key => [key])
                           .wait_for_completion
                apply_sr.vm
            rescue StandardError => e
                if !e.message.start_with?('DuplicateName')
                    raise 'Cannot clone VM Template: '\
                          "#{e.message}\n#{e.backtrace}"
                end

                # The VM already exists, try to find the vm
                vm_folder = dc.vm_folder
                vm_folder.fetch!
                vm = vm_folder.items
                              .select {|_k, v| v.item.name == vcenter_name }
                              .values.first.item rescue nil

                if vm

                    begin
                        # Detach all persistent disks to
                        # avoid accidental destruction
                        detach_persistent_disks(vm)

                        # Destroy the VM with any disks still attached to it
                        vm.Destroy_Task.wait_for_completion

                        # Query a storage placement recommendation
                        result =
                            storage_manager
                            .RecommendDatastores(
                                :storageSpec => storage_spec
                            ) rescue nil

                        if result.nil?
                            raise 'Could not get placement specification '\
                                  'for StoragePod'
                        end

                        if !result
                           .respond_to?(
                               :recommendations
                           ) ||
                            result
                           .recommendations.empty?
                            raise 'Could not get placement '\
                                  'specification for StoragePod'
                        end

                        # Get recommendation key to be applied
                        key = result.recommendations.first.key ||= ''
                        if key.empty?
                            raise 'Missing Datastore recommendation '\
                                  ' for StoragePod'
                        end

                        apply_sr =
                            storage_manager
                            .ApplyStorageDrsRecommendation_Task(
                                :key => [key]
                            )
                            .wait_for_completion
                        apply_sr.vm
                    rescue StandardError => e
                        raise 'Failure applying recommendation while '\
                              "cloning VM: #{e.message}"
                    end
                end
            end
        end

        # Calculates how to move disk backinggs from the
        # vCenter VM Template moref
        def calculate_disk_move_type(ds, vc_template, use_linked_clones)
            # Default disk move type (Full Clone)
            disk_move_type = :moveAllDiskBackingsAndDisallowSharing

            if ds.instance_of?(RbVmomi::VIM::Datastore) &&
                use_linked_clones &&
                use_linked_clones.downcase == 'yes'

                # Check if all disks in template has delta disks
                disks = vc_template.config
                                   .hardware
                                   .device
                                   .grep(RbVmomi::VIM::VirtualDisk)

                disks_no_delta = disks.select do |d|
                    d.backing.parent.nil?
                end

                # Can use linked clones if all disks have delta disks
                if disks_no_delta.empty?
                    disk_move_type = :moveChildMostDiskBacking
                end
            end

            disk_move_type
        end

        # @return String vcenter folder name
        def vcenter_folder_name(vm_folder_name, drv_action)
            uname = drv_action['UNAME']
            gname = drv_action['GNAME']

            vm_folder_name.gsub!('$uname', uname)
            vm_folder_name.gsub!('$gname', gname)

            vm_folder_name
        end

        # Get vcenter folder object from the reference
        # If folder is not found, the folder of the
        # vCenter VM Template is returned
        def vcenter_folder(vcenter_vm_folder, vc_template, dc)
            vcenter_vm_folder_object = nil

            if !vcenter_vm_folder.nil? && !vcenter_vm_folder.empty?
                vcenter_vm_folder_object =
                    dc
                    .item
                    .find_folder(
                        vcenter_vm_folder
                    )
            end

            vcenter_vm_folder_object =
                vc_template
                .parent if vcenter_vm_folder_object.nil?
            vcenter_vm_folder_object
        end

        # @return clone parameters spec hash
        def spec_hash_clone(disk_move_type)
            # Relocate spec
            relocate_spec_params = {}

            relocate_spec_params[:pool] = resource_pool
            relocate_spec_params[:diskMoveType] = disk_move_type

            ds = get_ds

            relocate_spec_params[:datastore] =
                ds if ds.instance_of? RbVmomi::VIM::Datastore

            relocate_spec = RbVmomi::VIM.VirtualMachineRelocateSpec(
                relocate_spec_params
            )

            # Running flag - prevents spurious poweroff states in the VM
            running_flag = [{ :key => 'opennebula.vm.running', :value => 'no' }]

            running_flag_spec = RbVmomi::VIM.VirtualMachineConfigSpec(
                { :extraConfig => running_flag }
            )

            clone_parameters = {
                :location => relocate_spec,
                :powerOn  => false,
                :template => false,
                :config   => running_flag_spec
            }

            cs = customization_spec
            clone_parameters[:customization] = cs if cs

            clone_parameters
        end

        ########################################################################
        # VirtualMachine Resource model methods
        ########################################################################

        #
        # gets the representation of the nics
        #
        # @return [Hash(String => self.Nic)
        def nics
            if !@nics[:macs].empty?
                return @nics.reject {|k| k == :macs }
            end

            info_nics
        end

        # gets the representation of the disks
        #
        # @return [Hash(String => self.Disk)
        def disks
            return @disks unless @disks.empty?

            info_disks
        end

        # iterate over the nics model
        #
        # @param condition[Symbol] selects nics that matches certain condition
        # see Self.Nic|Resource class to see some methods: :exits?, :one?...
        #
        # @return yield the nic
        def nics_each(condition)
            res = []
            nics.each do |_id, nic|
                next unless nic.method(condition).call

                yield nic if block_given?

                res << nic
            end

            res
        end

        # iterate over the disks model
        #
        # @param condition[Symbol] selects disks that matches certain condition
        # see Self.Disk|Resource class to see some methods: :exits?, :one?...
        #
        # @return yield the disk
        def disks_each(condition)
            res = []
            disks.each do |_id, disk|
                next unless disk.method(condition).call

                yield disk if block_given?

                res << disk
            end

            res
        end

        def disks_synced?
            disks_each(:unsynced?) { return false }

            true
        end

        def template_ref_get
            one_item['USER_TEMPLATE/VCENTER_TEMPLATE_REF']
        end

        def vcenter_folder_ref
            one_item['USER_TEMPLATE/VCENTER_VM_FOLDER']
        end

        # Queries to OpenNebula the machine disks xml representation
        def one_disks_list
            one_item.info if one_item.instance_of?(OpenNebula::VirtualMachine)
            one_item.retrieve_xmlelements('TEMPLATE/DISK')
        end

        # Queries to OpenNebula the machine nics xml representation
        def one_nics_get
            one_item.info if one_item.instance_of?(OpenNebula::VirtualMachine)
            one_item.retrieve_xmlelements('TEMPLATE/NIC')
        end

        def linked_clones
            one_item['USER_TEMPLATE/VCENTER_LINKED_CLONES']
        end

        # perform a query to vCenter asking for the OpenNebula disk
        #
        # @param one_disk [XMLelement]  The OpenNebula object
        #                 representation of the disk
        # @param keys [Hash (String => String)] Hashmap with
        #             the unmanaged keys
        # @param vc_disks [Array (vcenter_disks)] Array of
        #                 the machine real disks
        # See vcenter_disks_get method
        #
        # @return [vCenter_disk] the proper disk
        def query_disk(one_disk, keys, vc_disks)
            index     = one_disk['DISK_ID']
            unmanaged = "opennebula.disk.#{index}"
            managed   = "opennebula.mdisk.#{index}"

            if keys[managed]
                key  = keys[managed].to_i
            elsif keys[unmanaged]
                key  = keys[unmanaged].to_i
            end

            if key
                query = vc_disks.select {|dev| key == dev[:key] }
            else
                if snapshots?
                    error = 'Disk metadata not present and snapshots exist. ' \
                            'Please remove imported VM with "onevm recover ' \
                            '--delete-db".'
                    raise error
                end

                # Try to find the disk using the path known by OpenNebula
                source_path = one_disk['SOURCE']
                calculated_path = disk_real_path(one_disk, index)
                query = vc_disks.select do |dev|
                    source_path == dev[:path_wo_ds] ||
                    calculated_path == dev[:path_wo_ds]
                end
            end

            return if query.size != 1

            query.first
        end

        # perform a query to vCenter asking for the OpenNebula nic
        #
        # @param vc_disks [String] The mac of the nic
        # @param vc_disks [Array (vcenter_nic)] Array of the machine real nics
        #
        # @return [vCenter_nic] the proper nic
        def query_nic(mac, vc_nics)
            nic = vc_nics.select {|dev| dev.macAddress == mac }.first

            vc_nics.delete(nic) if nic
        end

        # Refresh VcenterDriver machine nics model, does not perform
        # any sync operation!
        #
        # @return [Hash ("String" => self.Nic)] Model representation of nics
        def info_nics
            keep_mac_on_imported = false
            keep_mac_on_imported = CONFIG[:keep_mac_on_imported] \
                                     unless CONFIG[:keep_mac_on_imported].nil?

            @nics = { :macs => {} }

            vc_nics  = vcenter_nics_list
            one_nics = one_nics_get

            one_nics.each do |one_nic|
                index = one_nic['NIC_ID']
                if keep_mac_on_imported && one_nic['MAC_IMPORTED']
                    mac = one_nic['MAC_IMPORTED']
                else
                    mac = one_nic['MAC']
                end
                vc_dev = query_nic(mac, vc_nics)

                if vc_dev
                    @nics[index]      = Nic.new(index.to_i, one_nic, vc_dev)
                    @nics[:macs][mac] = index
                else
                    @nics[index]      = Nic.one_nic(index.to_i, one_nic)
                end
            end

            vc_nics.each do |d|
                backing = d.backing

                case backing.class.to_s
                when NET_CARD.to_s
                    key = backing.network._ref
                when DNET_CARD.to_s
                    key = backing.port.portgroupKey
                when OPAQUE_CARD.to_s
                    # Select only Opaque Networks
                    opaque_networks = @item.network.select do |net|
                        net.class == RbVmomi::VIM::OpaqueNetwork
                    end
                    opaque_network = opaque_networks.find do |opn|
                        backing.opaqueNetworkId == opn.summary.opaqueNetworkId
                    end
                    key = opaque_network._ref
                else
                    raise "Unsupported network card type: #{backing.class}"
                end

                @nics["#{key}#{d.key}"] = Nic.vc_nic(d)
            end

            @nics.reject {|k| k == :macs }
        end

        # Refresh VcenterDriver machine disks model, does not perform any
        # sync operation!
        #
        # @return [Hash ("String" => self.Disk)] Model representation of disks
        def info_disks
            @disks = {}

            keys = disk_keys
            vc_disks  = vcenter_disks_get
            one_disks = one_disks_list

            one_disks.each do |one_disk|
                index = one_disk['DISK_ID']

                disk = query_disk(one_disk, keys, vc_disks)

                vc_dev = vc_disks.delete(disk) if disk

                if vc_dev
                    @disks[index] = Disk.new(index.to_i, one_disk, vc_dev)
                else
                    @disks[index] = Disk.one_disk(index.to_i, one_disk)
                end
            end

            vc_disks.each {|d| @disks[d[:path_wo_ds]] = Disk.vc_disk(d) }

            @disks
        end

        # Queries for a certain nic
        #
        # @param index [String| Integer] the id of the nic or the mac
        # @param opts [hash (symbol=>boolean)]
        #   :sync : allow you to ignore local class memory
        def nic(index, opts = {})
            index = index.to_s
            is_mac = index.match(/^([0-9A-Fa-f]{2}[:-]){5}([0-9A-Fa-f]{2})$/)

            if is_mac
                mac = index
                index = @nics[:macs][mac]
            end

            return @nics[index] if @nics[index] && opts[:sync].nil?

            if is_mac
                one_nic =
                    one_item
                    .retrieve_xmlelements(
                        "TEMPLATE/NIC[MAC='#{mac}']"
                    ).first rescue nil
                index = one_nic['NIC_ID'] if one_nic
            else
                one_nic =
                    one_item
                    .retrieve_xmlelements(
                        "TEMPLATE/NIC[NIC_ID='#{index}']"
                    ).first rescue nil
                mac     = one_nic['MAC'] if one_nic
            end

            raise "nic #{index} not found" unless one_nic

            vc_nics = vcenter_nics_list
            vc_nic  = query_nic(mac, vc_nics)

            if vc_nic
                Nic.new(index.to_i, one_nic, vc_nic)
            else
                Nic.one_nic(index.to_i, one_nic)
            end
        end

        # Queries for a certain disk
        #
        # @param index [String | Integer] the id of the disk
        # @param opts [hash (symbol=>boolean)]
        #   :sync : allow you to ignore local class memory
        def disk(index, opts = {})
            index = index.to_s

            return @disks[index] if @disks[index] && opts[:sync].nil?

            one_disk =
                one_item
                .retrieve_xmlelements(
                    "TEMPLATE/DISK[DISK_ID='#{index}']"
                ).first rescue nil

            raise "disk #{index} not found" unless one_disk

            opts[:keys].nil? ? keys = disk_keys : keys = opts[:keys]
            if opts[:disks].nil?
                vc_disks = vcenter_disks_get
            else
                vc_disks = opts[:disks]
            end
            vc_disk = query_disk(one_disk, keys, vc_disks)

            if vc_disk
                Disk.new(index.to_i, one_disk, vc_disk)
            else
                Disk.one_disk(index.to_i, one_disk)
            end
        end

        # Matches disks from the vCenter VM Template (or VM if it is coming
        # from a Wild VM) with the disks represented in OpenNebula VM
        # data model (ie, the XML)
        def reference_unmanaged_devices(template_ref, execute = true)
            device_change = []
            spec          = {}

            # Get unmanaged disks in OpenNebula's VM template
            xpath =
                'TEMPLATE/DISK[OPENNEBULA_MANAGED="NO" '\
                'or OPENNEBULA_MANAGED="no"]'
            unmanaged_disks = one_item.retrieve_xmlelements(xpath)

            managed = false
            extraconfig = reference_disks(
                template_ref,
                unmanaged_disks,
                managed
            )

            # Add info for existing nics in template in vm xml
            xpath =
                'TEMPLATE/NIC[OPENNEBULA_MANAGED="NO" '\
                'or OPENNEBULA_MANAGED="no"]'
            unmanaged_nics = one_item.retrieve_xmlelements(xpath)

            # Handle NIC changes (different model and/or set MAC address
            # for unmanaged nics
            begin
                if !unmanaged_nics.empty?
                    nics = vcenter_nics_list

                    # iterate over nics array and find nic with ref
                    # or return nil if not exist
                    select_net =lambda {|ref|
                        device = nil
                        nics.each do |nic|
                            type = nic.backing.class.to_s

                            case type
                            when NET_CARD.to_s
                                nref = nic.backing.network._ref
                            when DNET_CARD.to_s
                                nref = nic.backing.port.portgroupKey
                            when OPAQUE_CARD.to_s
                                # Select only Opaque Networks
                                opaque_networks = @item.network.select do |net|
                                    net.class == RbVmomi::VIM::OpaqueNetwork
                                end
                                opaque_network = opaque_networks.find do |opn|
                                    nic.backing.opaqueNetworkId ==
                                        opn.summary.opaqueNetworkId
                                end
                                nref = opaque_network._ref
                            else
                                raise 'Unsupported network card type: '\
                                        "#{nic.backing.class}"
                            end

                            next unless nref == ref

                            device = nic
                            break
                        end

                        if device
                            nics.delete(device)
                        else
                            nil
                        end
                    }

                    # Go over all unmanaged nics in order to sync
                    # with vCenter Virtual Machine
                    unmanaged_nics.each do |unic|
                        vnic      = select_net.call(unic['VCENTER_NET_REF'])
                        nic_class = vnic.class if vnic

                        if unic['MODEL']
                            new_model = Nic.nic_model_class(unic['MODEL'])
                        end

                        # if vnic is nil add a new device
                        if vnic.nil?
                            device_change << calculate_add_nic_spec(unic)
                        # delete actual nic and update the new one.
                        elsif new_model && new_model != nic_class
                            device_change << {
                                :device => vnic,
                                :operation => :remove
                            }
                            device_change << calculate_add_nic_spec(
                                unic,
                                vnic.unitNumber
                            )
                        else
                            vnic.macAddress = unic['MAC']
                            device_change << {
                                :device => vnic,
                                :operation => :edit
                            }
                        end
                    end

                end
            rescue StandardError => e
                raise 'There is a problem with your vm NICS, '\
                      'make sure that they are working properly. '\
                      "Error: #{e.message}"
            end

            # Save in extraconfig the key for unmanaged disks
            if !extraconfig.empty? || !device_change.empty?
                spec[:extraConfig]  = extraconfig unless extraconfig.empty?
                spec[:deviceChange] = device_change unless device_change.empty?

                return spec unless execute

                @item.ReconfigVM_Task(:spec => spec).wait_for_completion
            end

            {}
        end

        def reference_all_disks
            # OpenNebula VM disks saved inside .vmx file in vCenter
            disks_extraconfig_current = {}
            # iterate over all attributes and get the disk information
            # keys for disks are prefixed with
            # opennebula.disk and opennebula.mdisk
            @item.config.extraConfig.each do |elem|
                disks_extraconfig_current[elem.key] =
                    elem.value if elem.key.start_with?('opennebula.disk.')
                disks_extraconfig_current[elem.key] =
                    elem.value if elem.key.start_with?('opennebula.mdisk.')
            end

            # disks that exist currently in the vCenter Virtual Machine
            disks_vcenter_current = []
            disks_each(:synced?) do |disk|
                begin
                    if disk.managed?
                        key_prefix = 'opennebula.mdisk.'
                    else
                        key_prefix = 'opennebula.disk.'
                    end
                    k = "#{key_prefix}#{disk.id}"
                    v = disk.key.to_s

                    disks_vcenter_current << { :key => k, :value => v }
                rescue StandardError => _e
                    next
                end
            end

            update = false
            # differences in the number of disks
            # between vCenter and OpenNebula VMs
            num_disks_difference =
                disks_extraconfig_current.keys.count -
                    disks_vcenter_current.count

            # check if disks are same in vCenter and OpenNebula
            disks_vcenter_current.each do |item|
                # check if vCenter disk have representation in the extraConfig
                # but with a different key, then we have to update
                first_condition =
                    disks_extraconfig_current.key? item[:key]
                second_condition =
                    disks_extraconfig_current[item[:key]] == item[:value]
                if first_condition && !second_condition
                    update = true
                end
                # check if vCenter disk hasn't got
                # a representation in the extraConfig
                # then we have to update
                if !disks_extraconfig_current.key? item[:key]
                    update = true
                end
            end

            # new configuration for vCenter .vmx file
            disks_extraconfig_new = {}

            return unless num_disks_difference != 0 || update

            # Step 1: remove disks in the current configuration of .vmx
            # Avoids having an old disk in the configuration
            # that does not really exist
            disks_extraconfig_current.keys.each do |key|
                disks_extraconfig_new[key] = ''
            end

            # Step 2: add current vCenter disks to new configuration
            disks_vcenter_current.each do |item|
                disks_extraconfig_new[item[:key]] = item[:value]
            end

            # Step 3: create extraconfig_new with the values to update
            extraconfig_new = []
            disks_extraconfig_new.keys.each do |key|
                extraconfig_new <<
                    {
                        :key =>
                            key,
                        :value =>
                            disks_extraconfig_new[key]
                    }
            end

            # Step 4: update the extraConfig
            spec_hash = { :extraConfig => extraconfig_new }
            spec = RbVmomi::VIM.VirtualMachineConfigSpec(spec_hash)
            @item.ReconfigVM_Task(:spec => spec).wait_for_completion
        end

        # Build extraconfig section to reference disks
        # by key and avoid problems with changing paths
        # (mainly due to snapshots)
        # Uses VM Templte if ref available, or the vCenter VM if not
        # (latter case is if we are dealing with a Wild VM
        def reference_disks(template_ref, disks, managed)
            return [] if disks.empty? || instantiated_as_persistent?

            extraconfig = []
            if managed
                key_prefix = 'opennebula.mdisk'
            else
                key_prefix = 'opennebula.disk'
            end

            # Get vcenter VM disks to know real path of cloned disk
            vcenter_disks = vcenter_disks_get

            # Create an array with the paths of the disks in vcenter template
            if !template_ref.nil?
                template = VCenterDriver::Template.new_from_ref(template_ref,
                                                                vi_client)
                template_disks = template.vcenter_disks_get
            else
                # If we are dealing with a Wild VM, we simply use
                # what is available in the vCenter VM
                template_disks = vcenter_disks_get
            end
            template_disks_vector = []
            template_disks.each do |d|
                template_disks_vector << d[:path_wo_ds]
            end

            # Try to find index of disks in template disks
            disks.each do |disk|
                disk_source =
                    VCenterDriver::FileHelper
                    .unescape_path(
                        disk['SOURCE']
                    )
                template_disk = template_disks.select do |d|
                    d[:path_wo_ds] == disk_source
                end.first

                if template_disk
                    vcenter_disk = vcenter_disks.select do |d|
                        d[:key] == template_disk[:key]
                    end.first
                end

                unless vcenter_disk
                    raise "disk with path #{disk_source}"\
                            'not found in the vCenter VM'
                end

                reference = {}
                reference[:key]   = "#{key_prefix}.#{disk['DISK_ID']}"
                reference[:value] = (vcenter_disk[:key]).to_s
                extraconfig << reference
            end

            extraconfig
        end

        # create storagedrs disks
        #
        # @param device_change_spod [array] add disk spec for every device
        #
        # @param device_change_spod_ids [object] map from unit ctrl to
        #        disk_id
        #
        # @return extra_config [Array] array with the extra config for vCenter
        def create_storagedrs_disks(device_change_spod, device_change_spod_ids)
            sm = storagemanager
            disk_locator = []
            extra_config = []

            device_change_spod.each do |device_spec|
                disk_locator <<
                    RbVmomi::VIM
                    .PodDiskLocator(
                        :diskId => device_spec[
                            :device
                        ].key
                    )
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
            spod_hash[:initialVmConfig] = [vmpod_config]
            spod_select = RbVmomi::VIM::StorageDrsPodSelectionSpec(spod_hash)
            storage_spec = RbVmomi::VIM.StoragePlacementSpec(
                :type => :reconfigure,
                :podSelectionSpec => spod_select,
                :vm => self['_ref'],
                :configSpec => spec
            )

            # Query a storage placement recommendation
            result = sm
                     .RecommendDatastores(
                         :storageSpec => storage_spec
                     ) rescue nil

            if result.nil?
                raise 'Could not get placement specification for StoragePod'
            end

            if !result.respond_to?(:recommendations) ||
                result.recommendations.empty?
                raise 'Could not get placement specification for StoragePod'
            end

            # Get recommendation key to be applied
            key = result.recommendations.first.key ||= ''

            if key.empty?
                raise 'Missing Datastore recommendation for StoragePod'
            end

            # Apply recommendation
            sm.ApplyStorageDrsRecommendation_Task(
                :key => [key]
            ).wait_for_completion

            # Set references in opennebula.disk elements
            device_change_spod.each do |device_spec|
                unit_number    = device_spec[:device].unitNumber
                controller_key = device_spec[:device].controllerKey
                key            = get_vcenter_disk_key(unit_number,
                                                      controller_key)
                disk_id =
                    device_change_spod_ids[
                        "#{controller_key}-#{unit_number}"
                    ]
                reference = {}
                reference[:key]   = "opennebula.disk.#{disk_id}"
                reference[:value] = key.to_s
                extra_config << reference
            end

            extra_config
        end

        # set the boot order of the machine
        #
        # @param boot_info [String] boot information stored in
        # the template of the virtual machine. example: disk0, nic0
        #
        # @return [Array (vCenterbootClass)] An array with the vCenter classes
        def boot_order_update(boot_info)
            convert = lambda {|device_str|
                spl = device_str.scan(/^(nic|disk)(\d+$)/).flatten
                raise "#{device_str} is not supported" if spl.empty?

                device = nil
                sync = "sync_#{spl[0]}s"
                (0..1).each do |_i|
                    device = send(spl[0], spl[1])
                    break if device.exists?

                    send(sync)
                end

                device.boot_dev
            }

            boot_order = boot_info.split(',').map {|str| convert.call(str) }

            RbVmomi::VIM.VirtualMachineBootOptions({ :bootOrder => boot_order })
        end

        # sync OpenNebula nic model with vCenter
        #
        # @param option  [symbol]  if :all is provided
        # the method will try to sync
        # all the nics (detached and not existing ones)
        # otherwise it will only sync
        # the nics that are not existing
        #
        # @param execute [boolean] indicates
        # if the reconfigure operation is going to
        # be executed
        def sync_nics(option = :none, execute = true)
            device_change = []

            if option == :all
                dchange = []

                # detached? condition indicates that
                # the nic exists in OpeNebula but not
                # in vCenter
                nics_each(:detached?) do |nic|
                    dchange << {
                        :operation => :remove,
                        :device    => nic.vc_item
                    }
                end
                if !dchange.empty?
                    dspec_hash = { :deviceChange => dchange }
                    dspec = RbVmomi::VIM.VirtualMachineConfigSpec(dspec_hash)
                    @item.ReconfigVM_Task(:spec => dspec).wait_for_completion
                end
            end

            # no_exits? condition indicates that
            # the nic does not exist in vCenter
            nics_each(:no_exists?) do |nic|
                device_change << calculate_add_nic_spec(nic.one_item)
            end

            return device_change unless execute

            spec_hash = { :deviceChange => device_change }

            spec = RbVmomi::VIM.VirtualMachineConfigSpec(spec_hash)
            @item.ReconfigVM_Task(:spec => spec).wait_for_completion

            info_nics
        end

        # Clear extraconfig tags from a vCenter VM
        #
        def clear_tags
            keys_to_remove = extra_config_keys

            spec_hash =
                keys_to_remove.map {|key| { :key => key, :value => '' } }

            spec = RbVmomi::VIM.VirtualMachineConfigSpec(
                :extraConfig => spec_hash
            )
            @item.ReconfigVM_Task(:spec => spec).wait_for_completion
        end

        # Get extraconfig tags from a vCenter VM
        #
        def extra_config_keys
            keys_to_remove = []
            @item['config.extraConfig'].each do |extraconfig|
                next unless extraconfig.key.include?('opennebula.disk') ||
                extraconfig.key.include?('opennebula.vm') ||
                extraconfig.key.downcase.include?('remotedisplay')

                keys_to_remove << extraconfig.key
            end
            keys_to_remove
        end

        # Get required parameters to use VMware HTML Console SDK
        # To be used with the following SDK:
        # https://code.vmware.com/web/sdk/2.1.0/html-console
        #
        def html_console_parameters
            ticket = @item.AcquireTicket(:ticketType => 'webmks')
            { :ticket => ticket.ticket, :host => ticket.host,
  :port => ticket.port }
        end

        # Synchronize the OpenNebula VM representation with vCenter VM
        #
        # if the device exists in vCenter and not in OpenNebula : detach
        # if the device exists in OpenNebula and not in vCenter : attach
        # if the device exists in both : noop
        #
        def sync(deploy = {})
            extraconfig   = []
            device_change = []
            sync_opt = nil

            # Disk are only synced with :all option when VM is first created
            # NOTE: Detach actions are implemented through TM (not sync)
            sync_opt = :all if deploy[:new] == true

            disks = sync_disks(sync_opt, false)
            resize_unmanaged_disks

            if deploy[:boot] && !deploy[:boot].empty?
                boot_opts = boot_order_update(deploy[:boot])
            end

            # changes from sync_disks
            device_change += disks[:deviceChange] if disks[:deviceChange]
            extraconfig   += disks[:extraConfig]  if disks[:extraConfig]

            # get token and context
            extraconfig += extraconfig_context

            # get file_ds
            if (files = one_item['TEMPLATE/CONTEXT/FILES_DS'])
                file_id = 0
                files.split(' ').each do |file|
                    extraconfig += extraconfig_file(file, file_id)
                    file_id += 1
                end
            end

            # vnc configuration (for config_array hash)
            extraconfig += extraconfig_vnc

            # device_change hash (nics)
            device_change += sync_nics(:all, false)

            # Set CPU, memory and extraconfig
            num_cpus = one_item['TEMPLATE/VCPU'] || 1
            spec_hash = {
                :numCPUs      => num_cpus.to_i,
                :memoryMB     => one_item['TEMPLATE/MEMORY'],
                :extraConfig  => extraconfig,
                :deviceChange => device_change
            }
            num_cores = one_item['TEMPLATE/TOPOLOGY/CORES'] || num_cpus.to_i
            if num_cpus.to_i % num_cores.to_i != 0
                num_cores = num_cpus.to_i
            end
            spec_hash[:numCoresPerSocket] = num_cores.to_i

            spec_hash[:bootOptions] = boot_opts if boot_opts

            spec = RbVmomi::VIM.VirtualMachineConfigSpec(spec_hash)

            @item.ReconfigVM_Task(:spec => spec).wait_for_completion
            sync_extraconfig_disk(spec_hash)
        end

        def extraconfig_file(file, id)
            path, name = file.split(':')
            name = name.gsub('\'', '')
            file_content = Base64.encode64(File.read(path))
            file_content.prepend("#{name}\n")

            [
                { :key => "guestinfo.opennebula.file.#{id}",
                  :value => file_content }
            ]
        end

        def extraconfig_context
            one_item.info(true)

            context_text = "# Context variables generated by OpenNebula\n"
            one_item.each('TEMPLATE/CONTEXT/*') do |context_element|
                # next if !context_element.text
                context_text += context_element.name + "='" +
                                context_element.text.gsub("'", "\'") + "'\n"
            end

            # token
            token = File.read(File.join(VAR_LOCATION,
                                        'vms',
                                        one_item['ID'],
                                        'token.txt')).chomp rescue nil

            context_text += "ONEGATE_TOKEN='#{token}'\n" if token

            # context_text
            [
                { :key => 'guestinfo.opennebula.context',
                  :value => Base64.encode64(context_text) }
            ]
        end

        def extraconfig_vnc
            if one_item['TEMPLATE/GRAPHICS']
                vnc_port   = one_item['TEMPLATE/GRAPHICS/PORT'] || ''
                vnc_listen = one_item['TEMPLATE/GRAPHICS/LISTEN'] || '0.0.0.0'
                vnc_keymap = one_item['TEMPLATE/GRAPHICS/KEYMAP']

                conf =
                    [
                        {
                            :key =>
                                'remotedisplay.vnc.enabled',
                            :value =>
                                'TRUE'
                        },
                        {
                            :key =>
                                'remotedisplay.vnc.port',
                            :value =>
                                vnc_port
                        },
                        {
                            :key =>
                                'remotedisplay.vnc.ip',
                            :value =>
                                vnc_listen
                        }
                    ]

                conf +=
                    [
                        {
                            :key =>
                              'remotedisplay.vnc.keymap',
                            :value =>
                                vnc_keymap
                        }
                    ] if vnc_keymap

                conf
            else
                []
            end
        end

        # Regenerate context when devices are hot plugged (reconfigure)
        def regenerate_context
            spec_hash = { :extraConfig => extraconfig_context }
            spec = RbVmomi::VIM.VirtualMachineConfigSpec(spec_hash)

            begin
                @item.ReconfigVM_Task(:spec => spec).wait_for_completion
            rescue StandardError => e
                error = "Cannot generate VM context info: #{e.message}."

                if VCenterDriver::CONFIG[:debug_information]
                    error += "\n\n#{e.backtrace}"
                end

                raise error
            end
        end

        # Returns an array of actions to be included in :deviceChange
        def calculate_add_nic_spec(nic, unumber = nil)
            mac     = nic['MAC']
            pg_name = nic['BRIDGE']
            default =
                VCenterDriver::VIHelper
                .get_default(
                    'VM/TEMPLATE/NIC/MODEL'
                )
            tmodel  = one_item['USER_TEMPLATE/NIC_DEFAULT/MODEL']

            # got the model of the nic, first try to get the model
            # inside the nic, then the model defined by user and
            # last option model by default in vCenter Driver
            model   = nic['MODEL'] || tmodel || default
            raise 'nic model cannot be empty!' if model == ''

            vnet_ref  = nic['VCENTER_NET_REF']
            backing   = nil

            # Maximum bitrate for the interface in kilobytes/second
            # for inbound traffic
            limit_in  =
                nic['INBOUND_PEAK_BW'] ||
                    VCenterDriver::VIHelper.get_default(
                        'VM/TEMPLATE/NIC/INBOUND_PEAK_BW'
                    )
            # Maximum bitrate for the interface in kilobytes/second
            # for outbound traffic
            limit_out =
                nic['OUTBOUND_PEAK_BW'] ||
                    VCenterDriver::VIHelper.get_default(
                        'VM/TEMPLATE/NIC/OUTBOUND_PEAK_BW'
                    )
            limit = nil

            if limit_in && limit_out
                limit=([limit_in.to_i, limit_out.to_i].min / 1024) * 8
            end

            # Average bitrate for the interface in kilobytes/second
            # for inbound traffic
            rsrv_in  =
                nic['INBOUND_AVG_BW'] ||
                    VCenterDriver::VIHelper.get_default(
                        'VM/TEMPLATE/NIC/INBOUND_AVG_BW'
                    )
            # Average bitrate for the interface in kilobytes/second
            # for outbound traffic
            rsrv_out =
                nic['OUTBOUND_AVG_BW'] ||
                    VCenterDriver::VIHelper.get_default(
                        'VM/TEMPLATE/NIC/OUTBOUND_AVG_BW'
                    )
            rsrv = nil

            if rsrv_in || rsrv_out
                rsrv=([rsrv_in.to_i, rsrv_out.to_i].min / 1024) * 8
            end

            # get the network with ref equal to vnet_ref or
            # with name equal to pg_name
            network = self['runtime.host'].network.select do |n|
                n._ref == vnet_ref || n.name == pg_name
            end
            network = network.first

            unless network
                raise "#{pg_name} not found in #{self['runtime.host'].name}"
            end

            # start in one, we want the next avaliable id
            card_num = 1
            @item['config.hardware.device'].each do |dv|
                card_num += 1 if VCenterDriver::Network.nic?(dv)
            end

            nic_card = Nic.nic_model_class(model)

            if network.class == RbVmomi::VIM::Network
                backing = RbVmomi::VIM.VirtualEthernetCardNetworkBackingInfo(
                    :deviceName => pg_name,
                    :network    => network
                )
            elsif network.class == RbVmomi::VIM::DistributedVirtualPortgroup
                port = RbVmomi::VIM::DistributedVirtualSwitchPortConnection(
                    :switchUuid =>
                            network.config.distributedVirtualSwitch.uuid,
                    :portgroupKey => network.key
                )
                backing =
                    RbVmomi::VIM
                    .VirtualEthernetCardDistributedVirtualPortBackingInfo(
                        :port => port
                    )
            elsif network.class == RbVmomi::VIM::OpaqueNetwork
                backing =
                    RbVmomi::VIM
                    .VirtualEthernetCardOpaqueNetworkBackingInfo(
                        :opaqueNetworkId =>
                            network.summary.opaqueNetworkId,
                        :opaqueNetworkType =>
                            'nsx.LogicalSwitch'
                    )
            else
                raise 'Unknown network class'
            end

            # grab the last unitNumber to ensure the nic to be added at the end
            if !unumber
                @unic = @unic || vcenter_nics_list.map do |d|
                    d.unitNumber
                end.max || 0
                unumber = @unic += 1
            else
                @unic   = unumber
            end

            card_spec = {
                :key => 0,
                :deviceInfo => {
                    :label => 'net' + card_num.to_s,
                    :summary => pg_name
                },
                :backing     => backing,
                :addressType => mac ? 'manual' : 'generated',
                :macAddress  => mac,
                :unitNumber  => unumber
            }
            if @vi_client.vim.serviceContent.about.apiVersion.to_f >= 7.0
                card_spec[:key] = -100 - card_num.to_i
            end

            if (limit || rsrv) && (limit > 0)
                ra_spec = {}
                rsrv = limit if rsrv > limit
                # The bandwidth limit for the virtual network adapter. The
                # utilization of the virtual network adapter will not exceed
                # this limit, even if there are available resources. To clear
                # the value of this property and revert it to unset, set the
                # vaule to "-1" in an update operation. Units in Mbits/sec
                ra_spec[:limit] = limit if limit
                # Amount of network bandwidth that is guaranteed to the virtual
                # network adapter. If utilization is less than reservation, the
                # resource can be used by other virtual network adapters.
                # Reservation is not allowed to exceed the value of limit if
                # limit is set. Units in Mbits/sec
                ra_spec[:reservation] = rsrv if rsrv
                # Network share. The value is used as a relative weight in
                # competing for shared bandwidth, in case of resource contention
                ra_spec[:share] =
                    RbVmomi::VIM.SharesInfo(
                        {
                            :level => RbVmomi::VIM.SharesLevel('normal'),
                            :shares => 0
                        }
                    )
                card_spec[:resourceAllocation] =
                    RbVmomi::VIM.VirtualEthernetCardResourceAllocation(
                        ra_spec
                    )
            end

            {
                :operation => :add,
                :device    => nic_card.new(card_spec)
            }
        end

        # Returns an array of actions to be included in :deviceChange
        def calculate_add_nic_spec_autogenerate_mac(nic)
            pg_name = nic['BRIDGE']

            default =
                VCenterDriver::VIHelper.get_default(
                    'VM/TEMPLATE/NIC/MODEL'
                )
            tmodel = one_item['USER_TEMPLATE/NIC_DEFAULT/MODEL']

            model = nic['MODEL'] || tmodel || default

            vnet_ref  = nic['VCENTER_NET_REF']
            backing   = nil

            # Maximum bitrate for the interface in kilobytes/second
            # for inbound traffic
            limit_in  =
                nic['INBOUND_PEAK_BW'] ||
                    VCenterDriver::VIHelper.get_default(
                        'VM/TEMPLATE/NIC/INBOUND_PEAK_BW'
                    )
            # Maximum bitrate for the interface in kilobytes/second
            # for outbound traffic
            limit_out =
                nic['OUTBOUND_PEAK_BW'] ||
                    VCenterDriver::VIHelper.get_default(
                        'VM/TEMPLATE/NIC/OUTBOUND_PEAK_BW'
                    )
            limit = nil

            if limit_in && limit_out
                limit=([limit_in.to_i, limit_out.to_i].min / 1024) * 8
            end

            # Average bitrate for the interface in kilobytes/second
            # for inbound traffic
            rsrv_in  =
                nic['INBOUND_AVG_BW'] ||
                    VCenterDriver::VIHelper.get_default(
                        'VM/TEMPLATE/NIC/INBOUND_AVG_BW'
                    )

            # Average bitrate for the interface in kilobytes/second
            # for outbound traffic
            rsrv_out =
                nic['OUTBOUND_AVG_BW'] ||
                    VCenterDriver::VIHelper.get_default(
                        'VM/TEMPLATE/NIC/OUTBOUND_AVG_BW'
                    )

            rsrv = nil

            if rsrv_in || rsrv_out
                rsrv=([rsrv_in.to_i, rsrv_out.to_i].min / 1024) * 8
            end

            network = self['runtime.host'].network.select do |n|
                n._ref == vnet_ref || n.name == pg_name
            end

            network = network.first

            card_num = 1 # start in one, we want the next available id

            @item['config.hardware.device'].each do |dv|
                card_num += 1 if VCenterDriver::Network.nic?(dv)
            end

            nic_card = Nic.nic_model_class(model)

            if network.class == RbVmomi::VIM::Network
                backing = RbVmomi::VIM.VirtualEthernetCardNetworkBackingInfo(
                    :deviceName => pg_name,
                    :network    => network
                )
            elsif network.class == RbVmomi::VIM::DistributedVirtualPortgroup
                port = RbVmomi::VIM::DistributedVirtualSwitchPortConnection(
                    :switchUuid =>
                            network.config.distributedVirtualSwitch.uuid,
                    :portgroupKey => network.key
                )
                backing =
                    RbVmomi::VIM
                    .VirtualEthernetCardDistributedVirtualPortBackingInfo(
                        :port => port
                    )
            elsif network.class == RbVmomi::VIM::OpaqueNetwork
                backing =
                    RbVmomi::VIM
                    .VirtualEthernetCardOpaqueNetworkBackingInfo(
                        :opaqueNetworkId => network.summary.opaqueNetworkId,
                        :opaqueNetworkType => 'nsx.LogicalSwitch'
                    )
            else
                raise 'Unknown network class'
            end

            card_spec = {
                :key => 0,
                :deviceInfo => {
                    :label => 'net' + card_num.to_s,
                    :summary => pg_name
                },
                :backing     => backing,
                :addressType => 'generated'
            }
            if @vi_client.vim.serviceContent.about.apiVersion.to_f >= 7.0
                card_spec[:key] = -100 - card_num.to_i
            end

            if (limit || rsrv) && (limit > 0)
                ra_spec = {}
                rsrv = limit if rsrv > limit
                # The bandwidth limit for the virtual network adapter. The
                # utilization of the virtual network adapter will not exceed
                # this limit, even if there are available resources. To clear
                # the value of this property and revert it to unset, set the
                # vaule to "-1" in an update operation. Units in Mbits/sec
                ra_spec[:limit] = limit if limit
                # Amount of network bandwidth that is guaranteed to the virtual
                # network adapter. If utilization is less than reservation, the
                # resource can be used by other virtual network adapters.
                # Reservation is not allowed to exceed the value of limit if
                # limit is set. Units in Mbits/sec
                ra_spec[:reservation] = rsrv if rsrv
                # Network share. The value is used as a relative weight in
                # competing for shared bandwidth, in case of resource contention
                ra_spec[:share] =
                    RbVmomi::VIM.SharesInfo(
                        {
                            :level =>
                                RbVmomi::VIM.SharesLevel(
                                    'normal'
                                ),
                            :shares => 0
                        }
                    )
                card_spec[:resourceAllocation] =
                    RbVmomi::VIM.VirtualEthernetCardResourceAllocation(ra_spec)
            end

            {
                :operation => :add,
                :device    => nic_card.new(card_spec)
            }
        end

        # Add NIC to VM
        def attach_nic(one_nic)
            spec_hash = {}

            begin
                # A new NIC requires a vcenter spec
                attach_nic_array = []
                attach_nic_array << calculate_add_nic_spec(one_nic)
                spec_hash[:deviceChange] =
                    attach_nic_array unless attach_nic_array.empty?

                # Reconfigure VM
                spec = RbVmomi::VIM.VirtualMachineConfigSpec(spec_hash)

                @item.ReconfigVM_Task(:spec => spec).wait_for_completion
            rescue StandardError => e
                error = "Cannot attach NIC to VM: #{e.message}."

                if VCenterDriver::CONFIG[:debug_information]
                    error += "\n\n#{e.backtrace.join("\n")}"
                end

                raise error
            end
        end

        # Detach NIC from VM
        def detach_nic(mac)
            spec_hash = {}

            nic = nic(mac) rescue nil

            return if !nic || nic.no_exists?

            # Remove NIC from VM in the ReconfigVM_Task
            spec_hash[:deviceChange] = [
                :operation => :remove,
                :device => nic.vc_item
            ]
            begin
                @item.ReconfigVM_Task(:spec => spec_hash).wait_for_completion
            rescue StandardError => e
                error = "Cannot detach NIC from VM: #{e.message}."

                if VCenterDriver::CONFIG[:debug_information]
                    error += "\n\n#{e.backtrace.join("\n")}"
                end

                raise error
            end
        end

        # Detach all nics useful when removing pg and sw so they're not in use
        def detach_all_nics
            spec_hash = {}
            device_change = []

            nics_each(:exists?) do |nic|
                device_change << {
                    :operation => :remove,
                    :device => nic.vc_item
                }
            end

            return if device_change.empty?

            # Remove NIC from VM in the ReconfigVM_Task
            spec_hash[:deviceChange] = device_change

            begin
                @item.ReconfigVM_Task(:spec => spec_hash).wait_for_completion
            rescue StandardError => e
                error = "Cannot detach all NICs from VM: #{e.message}."

                if VCenterDriver::CONFIG[:debug_information]
                    error += "\n\n#{e.backtrace}"
                end

                raise error
            end
        end

        # try to get specs for new attached disks
        # using disk_each method with :no_exists? condition
        def attach_disks_specs
            attach_disk_array     = []
            extraconfig           = []
            attach_spod_array     = []
            attach_spod_disk_info = {}

            pos = { :ide => 0, :scsi => 0 }
            disks_each(:no_exists?) do |disk|
                disk.one_item['TYPE'] == 'CDROM' ? k = :ide : k = :scsi

                if disk.storpod?
                    spec = calculate_add_disk_spec(disk.one_item, pos[k])
                    attach_spod_array << spec

                    controller_key = spec[:device].controllerKey
                    unit_number = spec[:device].unitNumber

                    unit_ctrl = "#{controller_key}-#{unit_number}"
                    attach_spod_disk_info[unit_ctrl] = disk.id
                else
                    aspec = calculate_add_disk_spec(disk.one_item, pos[k])
                    extra_key   = "opennebula.mdisk.#{disk.one_item['DISK_ID']}"
                    extra_value = aspec[:device].key.to_s

                    attach_disk_array << aspec
                    extraconfig << { :key => extra_key, :value => extra_value }
                end

                pos[k]+=1
            end

            { :disks => attach_disk_array,
              :spods => attach_spod_array,
              :spod_info => attach_spod_disk_info,
              :extraconfig => extraconfig }
        end

        # try to get specs for detached disks
        # using disk_each method with :dechaded? condition
        def detach_disks_specs
            detach_disk_array = []
            extra_config      = []
            keys = disk_keys.invert

            ipool = VCenterDriver::VIHelper.one_pool(OpenNebula::ImagePool)
            disks_each(:detached?) do |d|
                key = d.key.to_s
                source = VCenterDriver::FileHelper.escape_path(d.path)
                persistent =
                    VCenterDriver::VIHelper
                    .find_persistent_image_by_source(
                        source, ipool
                    )

                op = { :operation => :remove, :device => d.device }
                if !persistent && d.type != 'CDROM'
                    op[:fileOperation] = :destroy
                end
                detach_disk_array << op

                # Remove reference opennebula.disk if exist from vmx and cache
                extra_config << d.config(:delete) if keys[key]
            end

            [detach_disk_array, extra_config]
        end

        def different_key?(change_disk, vc_disk)
            change_disk[:device].controllerKey == vc_disk.controllerKey &&
            change_disk[:device].unitNumber == vc_disk.unitNumber &&
            change_disk[:device].key != vc_disk.key
        end

        def sync_extraconfig_disk(spec_hash)
            return if spec_hash[:deviceChange].empty?

            extraconfig_new = []
            # vCenter mob disks
            vc_disks = @item['config.hardware.device'].select do |vc_device|
                disk?(vc_device)
            end
            return unless vc_disks

            # For each changed disk, compare with vcenter mob disk
            spec_hash[:deviceChange].each_with_index do |_device, index|
                change_disk = spec_hash[:deviceChange][index]
                vc_disks.each do |vc_disk|
                    next unless different_key?(change_disk, vc_disk)

                    extraconfig_new <<
                        {
                            :key =>
                                spec_hash[:extraConfig][index][:key],
                          :value =>
                                vc_disk.key.to_s
                        }
                end
            end

            return if extraconfig_new.empty?

            spec_hash = {
                :extraConfig => extraconfig_new
            }
            spec =
                RbVmomi::VIM
                .VirtualMachineConfigSpec(
                    spec_hash
                )
            @item.ReconfigVM_Task(
                :spec => spec
            ).wait_for_completion
        end

        # sync OpenNebula disk model with vCenter
        #
        # @param option  [symbol]  if :all is provided the
        # method will try to sync
        # all the disks (detached and not existing ones)
        # otherwise it will only sync the disks that are not existing
        #
        # @param execute [boolean] indicates if the reconfigure operation
        # is going to
        # be executed
        def sync_disks(option = :nil, execute = true)
            info_disks

            spec_hash = {}

            if option == :all
                detach_op = {}
                detach_op[:deviceChange], detach_op[:extraConfig] =
                    detach_disks_specs
                perform =
                    !detach_op[:deviceChange].empty? ||
                        !detach_op[:extraConfig].empty?
                @item
                    .ReconfigVM_Task(
                        :spec => detach_op
                    ).wait_for_completion if perform
            end

            a_specs = attach_disks_specs

            if !a_specs[:spods].empty?
                spec_hash[:extraConfig] =
                    create_storagedrs_disks(a_specs[:spods],
                                            a_specs[:spod_info])
            end

            if !a_specs[:disks].empty?
                spec_hash[:deviceChange] = a_specs[:disks]
                spec_hash[:extraConfig]  = a_specs[:extraconfig]
            end

            return spec_hash unless execute

            spec = RbVmomi::VIM.VirtualMachineConfigSpec(spec_hash)
            @item.ReconfigVM_Task(:spec => spec).wait_for_completion
            info_disks
        end

        # Attach DISK to VM (hotplug)
        def attach_disk(disk)
            # Adding a new disk in newer vSphere versions
            # automatically cleans all system snapshots
            # https://github.com/OpenNebula/one/issues/5409
            if snapshots? || one_snapshots?
                error_msg =  'Existing sytem snapshots, cannot change disks. '
                error_msg << 'Please remove all snapshots and try again'
                raise error_msg
            end

            spec_hash     = {}
            device_change = []

            # Extract unmanaged_keys
            unmanaged_keys = disk_keys
            vc_disks = vcenter_disks_get

            # Check if we're dealing with a StoragePod SYSTEM ds
            storpod = disk['VCENTER_DS_REF'].start_with?('group-')

            # Check if disk being attached is already connected to the VM
            raise 'DISK is already connected to VM' if disk_attached_to_vm(
                disk, unmanaged_keys, vc_disks
            )

            # Generate vCenter spec and reconfigure VM
            add_spec = calculate_add_disk_spec(disk)
            device_change << add_spec
            raise 'Could not generate DISK spec' if device_change.empty?

            extra_key   = "opennebula.mdisk.#{disk['DISK_ID']}"
            extra_value = add_spec[:device].key.to_s

            spec_hash[:deviceChange] = device_change
            spec_hash[:extraConfig]  =
                [{ :key => extra_key, :value => extra_value }]
            spec = RbVmomi::VIM.VirtualMachineConfigSpec(spec_hash)

            begin
                if storpod
                    # Ask for StorageDRS recommendation
                    # to reconfigure VM (AddDisk)
                    sm = storagemanager

                    # Disk id is -1 as I don't know
                    # what disk id is going to be set
                    disk_locator = [RbVmomi::VIM.PodDiskLocator(:diskId => -1)]

                    # Disk locator is required for AddDisk
                    vmpod_hash = {}
                    vmpod_hash[:storagePod] = get_ds
                    vmpod_hash[:disk] = disk_locator
                    vmpod_config =
                        RbVmomi::VIM::VmPodConfigForPlacement(
                            vmpod_hash
                        )

                    # The storage pod selection requires initialize
                    spod_hash = {}
                    spod_hash[:initialVmConfig] = [vmpod_config]
                    spod_select =
                        RbVmomi::VIM::StorageDrsPodSelectionSpec(
                            spod_hash
                        )
                    storage_spec = RbVmomi::VIM.StoragePlacementSpec(
                        :type => :reconfigure,
                        :podSelectionSpec => spod_select,
                        :vm => self['_ref'],
                        :configSpec => spec
                    )

                    # Query a storage placement recommendation
                    result = sm
                             .RecommendDatastores(
                                 :storageSpec => storage_spec
                             ) rescue nil

                    if result.nil?
                        raise 'Could not get placement '\
                                'specification for StoragePod'
                    end

                    if !result.respond_to?(:recommendations) ||
                        result.recommendations.empty?
                        raise 'Could not get placement '\
                                'specification for StoragePod'
                    end

                    # Get recommendation key to be applied
                    key = result.recommendations.first.key ||= ''

                    if key.empty?
                        raise 'Missing Datastore recommendation for StoragePod'
                    end

                    # Apply recommendation
                    sm.ApplyStorageDrsRecommendation_Task(
                        :key => [key]
                    ).wait_for_completion

                    # Add the key for the volatile disk to the
                    # unmanaged opennebula.disk.id variables
                    unit_number    =
                        spec_hash[:deviceChange][0][:device]
                        .unitNumber
                    controller_key =
                        spec_hash[:deviceChange][0][:device]
                        .controllerKey
                    key =
                        get_vcenter_disk_key(
                            unit_number,
                            controller_key
                        )
                    spec_hash = {}
                    reference = {}
                    reference[:key] =
                        "opennebula.disk.#{disk['DISK_ID']}"
                    reference[:value] = key.to_s
                    spec_hash[:extraConfig] = [reference]
                    @item
                        .ReconfigVM_Task(
                            :spec => spec_hash
                        ).wait_for_completion
                else
                    @item
                        .ReconfigVM_Task(
                            :spec => spec
                        ).wait_for_completion
                end
                # Modify extraConfig if disks has a bad key
                sync_extraconfig_disk(spec_hash)
            rescue StandardError => e
                error = "Cannot attach DISK to VM: #{e.message}."

                if VCenterDriver::CONFIG[:debug_information]
                    error += "\n\n#{e.backtrace.join("\n")}"
                end

                raise error
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
                next unless disk_or_cdrom?(disk)

                # Let's try to find if disks is persistent
                source_unescaped = disk.backing.fileName.sub(
                    /^\[(.*?)\] /, ''
                ) rescue next
                source = VCenterDriver::FileHelper.escape_path(source_unescaped)

                persistent = VCenterDriver::VIHelper
                             .find_persistent_image_by_source(
                                 source, ipool
                             )

                next unless persistent

                spec_hash[:deviceChange] << {
                    :operation => :remove,
                    :device => disk
                }
            end

            return if spec_hash[:deviceChange].empty?

            begin
                vm.ReconfigVM_Task(:spec => spec_hash).wait_for_completion
            rescue StandardError => e
                error = "Cannot detach all DISKs from VM: #{e.message}."

                if VCenterDriver::CONFIG[:debug_information]
                    error += "\n\n#{e.backtrace}"
                end

                raise error
            end
        end

        def detach_disk(disk)
            return unless disk.exists?

            if snapshots? || one_snapshots?
                error_message =  'Existing sytem snapshots, cannot change disks'
                error_message << '. Please remove all snapshots and try again'
                raise error_message
            end

            spec_hash = {}
            spec_hash[:extraConfig] = [disk.config(:delete)]
            spec_hash[:deviceChange] = [{
                :operation => :remove,
                :device => disk.device
            }]

            begin
                @item.ReconfigVM_Task(:spec => spec_hash).wait_for_completion
            rescue StandardError => e
                error = "Cannot detach DISK from VM: #{e.message}."
                error += "\nProbably an existing VM snapshot includes that disk"

                if VCenterDriver::CONFIG[:debug_information]
                    error += "\n\n#{e.backtrace}"
                end

                raise error
            end
        end

        def destroy_disk(disk)
            one_vm = one_item

            # Check if we can detach and delete the non persistent disk:
            # - VM is terminated
            # - The disk is managed by OpenNebula
            detachable= !(one_vm['LCM_STATE'].to_i == 11 && !disk.managed?)
            detachable &&= disk.exists?

            return unless detachable

            detach_disk(disk)

            # Check if we want to keep the non persistent disk
            keep_non_persistent_disks =
                VCenterDriver::CONFIG[:keep_non_persistent_disks]

            return if keep_non_persistent_disks == true

            disk.destroy
            @disks.delete(disk.id.to_s)
        end

        # Get vcenter device representing DISK object (hotplug)
        def disk_attached_to_vm(disk, unmanaged_keys, vc_disks)
            img_name = ''
            device_found = nil
            disk_id = disk['DISK_ID']
            unmanaged_key = unmanaged_keys["opennebula.disk.#{disk_id}"]

            img_name_escaped = VCenterDriver::FileHelper.get_img_name(
                disk,
                one_item['ID'],
                self['name'],
                instantiated_as_persistent?
            )

            img_name = VCenterDriver::FileHelper.unescape_path(img_name_escaped)

            vc_disks.each do |d|
                key_matches  = unmanaged_key && d[:key] == unmanaged_key.to_i
                path_matches = (d[:path_wo_ds] == img_name)

                if key_matches || path_matches
                    device_found = d
                    break
                end
            end

            device_found
        end

        def get_key(type)
            @used_keys ||= []

            if type == 'CDROM'
                bound = 'cdrom?'
                key   = 3000
            else
                bound = 'disk?'
                key   = 2000
            end

            used = @used_keys
            @item.config.hardware.device.each do |dev|
                used << dev.key
                next unless send(bound, dev)

                key = dev.key
            end

            loop do
                break unless used.include?(key)

                key+=1
            end

            @used_keys << key

            key
        end

        def calculate_add_disk_spec(disk, position = 0)
            img_name_escaped = VCenterDriver::FileHelper.get_img_name(
                disk,
                one_item['ID'],
                self['name'],
                instantiated_as_persistent?
            )

            img_name = VCenterDriver::FileHelper.unescape_path(img_name_escaped)

            type     = disk['TYPE']
            size_kb  = disk['SIZE'].to_i * 1024

            if type == 'CDROM'
                # CDROM drive will be found in the IMAGE DS
                ds_ref   = disk['VCENTER_DS_REF']
                ds       = VCenterDriver::Storage.new_from_ref(ds_ref,
                                                               @vi_client)
                ds_name  = ds['name']

                # CDROM can only be added when the VM is in poweroff state
                vmdk_backing = RbVmomi::VIM::VirtualCdromIsoBackingInfo(
                    :datastore => ds.item,
                    :fileName  => "[#{ds_name}] #{img_name}"
                )

                if @item['summary.runtime.powerState'] != 'poweredOff'
                    raise 'The CDROM image can only be added as an IDE device '\
                          'when the VM is in the powered off state'
                end

                controller, unit_number = find_free_ide_controller(position)

                device = RbVmomi::VIM::VirtualCdrom(
                    :backing       => vmdk_backing,
                    :key           => get_key(type),
                    :controllerKey => controller.key,
                    :unitNumber    => unit_number,

                    :connectable => RbVmomi::VIM::VirtualDeviceConnectInfo(
                        :startConnected    => true,
                        :connected         => true,
                        :allowGuestControl => true
                    )
                )

                {
                    :operation => :add,
                    :device => device
                }

            else
                # TYPE is regular disk (not CDROM)
                # disk_adapter
                disk_adapter = disk['VCENTER_ADAPTER_TYPE']
                case disk_adapter
                when 'ide'
                    controller, unit_number = find_free_ide_controller(position)
                else
                    controller, unit_number = find_free_controller(position)
                end
                storpod = disk['VCENTER_DS_REF'].start_with?('group-')
                if storpod
                    vmdk_backing = RbVmomi::VIM::VirtualDiskFlatVer2BackingInfo(
                        :diskMode  => 'persistent',
                        :fileName  => ''
                    )
                else
                    ds = get_effective_ds(disk)
                    if ds.item._ref.start_with?('group-')
                        ds_object = item.datastore.first
                        ds_name   = ds_object.name
                    else
                        ds_object = ds.item
                        ds_name = ds['name']
                    end
                    vmdk_backing = RbVmomi::VIM::VirtualDiskFlatVer2BackingInfo(
                        :datastore => ds_object,
                        :diskMode  => 'persistent',
                        :fileName  => "[#{ds_name}] #{img_name}"
                    )
                end

                device = RbVmomi::VIM::VirtualDisk(
                    :backing       => vmdk_backing,
                    :capacityInKB  => size_kb,
                    :controllerKey => controller.key,
                    :key           => get_key(type),
                    :unitNumber    => unit_number
                )

                config = {
                    :operation => :add,
                  :device    => device
                }

                # For StorageDRS vCenter must create the file
                config[:fileOperation] = :create if storpod

                config
            end
        end

        # Remove the MAC addresses so they cannot be in conflict
        # with OpenNebula assigned mac addresses.
        # We detach all nics from the VM
        def convert_to_template
            detach_all_nics

            # We attach new NICs where the MAC address is assigned by vCenter
            nic_specs = []
            one_nics = one_item.retrieve_xmlelements('TEMPLATE/NIC')
            one_nics.each do |nic|
                next unless nic['OPENNEBULA_MANAGED'] &&
                    nic['OPENNEBULA_MANAGED'].upcase == 'NO'

                nic_specs <<
                    calculate_add_nic_spec_autogenerate_mac(
                        nic
                    )
            end

            # Reconfigure VM to add unmanaged nics
            spec_hash = {}
            spec_hash[:deviceChange] = nic_specs
            spec = RbVmomi::VIM.VirtualMachineConfigSpec(spec_hash)
            @item.ReconfigVM_Task(:spec => spec).wait_for_completion

            # Convert VM to template in vCenter
            mark_as_template

            # Edit the OpenNebula template
            one_client = OpenNebula::Client.new
            template_id = one_item['TEMPLATE/TEMPLATE_ID']
            new_template = OpenNebula::Template.new_with_id(template_id,
                                                            one_client)
            new_template.info

            # unlock VM Template
            new_template.unlock

            # Update the template reference
            new_template.update("VCENTER_TEMPLATE_REF=#{@item._ref}", true)

            # Add vCenter template name
            new_template.update("VCENTER_TEMPLATE_NAME=#{@item.name}", true)
        end

        def resize_unmanaged_disks
            spec = { :deviceChange => [] }
            disks_each(:one?) do |d|
                next unless !d.managed? && d.new_size

                spec[:deviceChange] << d.config(:resize)
            end

            return if spec[:deviceChange].empty?

            @item
                .ReconfigVM_Task(
                    :spec => spec
                ).wait_for_completion
        end

        def resize_disk(disk)
            if !disk.exists?
                size = disk.size
                sync_disks
                disk = disk(disk.id)
                disk.change_size(size)
            end

            spec = { :deviceChange => [disk.config(:resize)] }

            @item.ReconfigVM_Task(:spec => spec).wait_for_completion
        end

        def snapshots?
            clear('rootSnapshot')
            self['rootSnapshot'] && !self['rootSnapshot'].empty?
        end

        def one_snapshots?
            begin
                !one_item['TEMPLATE/SNAPSHOT'].nil?
            rescue StandardError
                # one_item may not be retrieved if deploy_id hasn't been set
                false
            end
        end

        def instantiated_as_persistent?
            begin
                !one_item['TEMPLATE/CLONING_TEMPLATE_ID'].nil?
            rescue StandardError
                # one_item may not be retrieved if deploy_id hasn't been set
                false
            end
        end

        def use_linked_clone?
            one_item['USER_TEMPLATE/VCENTER_LINKED_CLONES'] &&
                one_item['USER_TEMPLATE/VCENTER_LINKED_CLONES']
                    .upcase == 'YES'
        end

        def find_free_ide_controller(_position = 0)
            free_ide_controller = nil
            ide_schema = {}
            devices = @item.config.hardware.device

            devices.each do |dev|
                # Iteration to initialize IDE Controllers
                next unless dev.is_a? RbVmomi::VIM::VirtualIDEController

                if ide_schema[dev.key].nil?
                    ide_schema[dev.key] = {}
                end
                ide_schema[dev.key][:device] = dev
                ide_schema[dev.key][:freeUnitNumber] = [0, 1]
            end

            # Iteration to match Disks and Cdroms with its controllers
            devices.each do |dev| # rubocop:disable Style/CombinableLoops
                first_condition = dev.is_a? RbVmomi::VIM::VirtualDisk
                second_condition = dev.is_a? RbVmomi::VIM::VirtualCdrom
                third_condition = ide_schema.key?(dev.controllerKey)

                next unless (first_condition || second_condition) &&
                    third_condition

                ide_schema[dev.controllerKey][:freeUnitNumber]
                    .delete(
                        dev.unitNumber
                    )
            end

            ide_schema.keys.each do |controller|
                unless ide_schema[controller][:freeUnitNumber].empty?
                    free_ide_controller = ide_schema[controller]
                    break
                end
            end

            if !free_ide_controller
                raise 'There are no free IDE controllers ' +
                          'to connect this CDROM device'
            end

            controller = free_ide_controller[:device]
            new_unit_number = free_ide_controller[:freeUnitNumber][0]

            [controller, new_unit_number]
        end

        def find_free_controller(position = 0)
            free_scsi_controllers = []
            scsi_schema           = {}

            used_numbers      = []
            available_numbers = []
            devices           = @item.config.hardware.device

            devices.each do |dev|
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
                available_numbers <<
                    scsi_id if used_numbers.grep(scsi_id).length <= 0
            end

            scsi_schema.keys.each do |controller|
                free_scsi_controllers <<
                    scsi_schema[controller][:device].deviceInfo.label
            end

            if !free_scsi_controllers.empty?
                available_controller_label = free_scsi_controllers[0]
            else
                add_new_scsi(scsi_schema, devices)
                return find_free_controller
            end

            controller = nil

            devices.each do |device|
                if device.deviceInfo.label == available_controller_label
                    controller = device
                    break
                end
            end

            new_unit_number = available_numbers.sort[position]

            [controller, new_unit_number]
        end

        def add_new_scsi(scsi_schema, devices)
            controller = nil

            if scsi_schema.keys.length >= 4
                raise 'Cannot add a new controller, maximum is 4.'
            end

            scsi_key    = 0
            scsi_number = 0

            if !scsi_schema.keys.empty? && scsi_schema.keys.length < 4
                scsi_key    =
                    scsi_schema.keys.max + 1
                scsi_number =
                    scsi_schema[scsi_schema.keys.max][:device].busNumber + 1
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

            devices.each do |device|
                valid_device =
                    device.class == RbVmomi::VIM::VirtualLsiLogicController &&
                    device.key == scsi_key
                controller = device.deviceInfo.label if valid_device
            end

            controller
        end

        # Create a snapshot for the VM
        def create_snapshot(snap_id, snap_name)
            memory_dumps = true
            memory_dumps = CONFIG[:memory_dumps] \
                                     unless CONFIG[:memory_dumps].nil?

            snapshot_hash = {
                :name        => snap_id,
                :description => "OpenNebula Snapshot: #{snap_name}",
                :memory      => memory_dumps,
                :quiesce     => true
            }

            begin
                @item.CreateSnapshot_Task(snapshot_hash).wait_for_completion
            rescue StandardError => e
                error = "Cannot create snapshot for VM: #{e.message}."

                if VCenterDriver::CONFIG[:debug_information]
                    error += "\n\n#{e.backtrace.join("\n")}"
                end

                raise error
            end

            snap_id
        end

        # Revert to a VM snapshot
        def revert_snapshot(snap_id)
            snapshot_list = self['snapshot.rootSnapshotList']
            snapshot = find_snapshot_in_list(snapshot_list, snap_id)

            return unless snapshot

            begin
                revert_snapshot_hash = { :_this => snapshot }
                snapshot
                    .RevertToSnapshot_Task(
                        revert_snapshot_hash
                    ).wait_for_completion
            rescue StandardError => e
                error = "Cannot revert snapshot of VM: #{e.message}."

                if VCenterDriver::CONFIG[:debug_information]
                    error += "\n\n#{e.backtrace.join("\n")}"
                end

                raise error
            end
        end

        # Delete VM snapshot
        def delete_snapshot(snap_id)
            snapshot_list = self['snapshot.rootSnapshotList']
            snapshot = find_snapshot_in_list(snapshot_list, snap_id)

            return unless snapshot

            begin
                delete_snapshot_hash = {
                    :_this => snapshot,
                    :removeChildren => false
                }
                snapshot
                    .RemoveSnapshot_Task(
                        delete_snapshot_hash
                    ).wait_for_completion
            rescue StandardError => e
                error = "Cannot delete snapshot of VM: #{e.message}."

                if VCenterDriver::CONFIG[:debug_information]
                    error += "\n\n#{e.backtrace.join("\n")}"
                end

                raise error
            end
        end

        def find_snapshot_in_list(list, snap_id)
            list.each do |i|
                return i.snapshot if i.name == snap_id.to_s

                unless i.childSnapshotList.empty?
                    snap = find_snapshot_in_list(i.childSnapshotList, snap_id)
                    return snap if snap
                end
            end rescue nil

            nil
        end

        def migrate(config = {})
            if config.empty?
                raise 'You need at least 1 parameter to perform a migration'
            end

            begin
                # retrieve host from DRS
                one_cluster = config[:cluster]
                resourcepool = one_cluster.item.resourcePool
                datastore    = config[:datastore]

                if datastore
                    relocate_spec_params = {
                        :folder => @item.parent,
                        :datastore => datastore
                    }

                    unless config[:same_host]
                        relocate_spec_params[:pool] = resourcepool
                    end

                    if config[:esx_migration_list].is_a?(String)
                        if config[:esx_migration_list]==''
                            relocate_spec_params[:host] =
                                config[:cluster].item.host.sample
                        elsif config[:esx_migration_list]!='Selected_by_DRS'
                            hostnames = config[:esx_migration_list].split(' ')
                            hostname = hostnames.sample
                            host_moref = one_cluster.hostname_to_moref(hostname)
                            relocate_spec_params[:host] = host_moref
                        end
                    end

                    relocate_spec =
                        RbVmomi::VIM
                        .VirtualMachineRelocateSpec(
                            relocate_spec_params
                        )
                    @item.RelocateVM_Task(
                        :spec => relocate_spec,
                        :priority => 'defaultPriority'
                    ).wait_for_completion
                else
                    migrate_spec_params = {
                        :priority => 'defaultPriority'
                    }

                    unless config[:same_host]
                        migrate_spec_params[:pool] = resourcepool
                    end

                    @item.MigrateVM_Task(
                        migrate_spec_params
                    ).wait_for_completion
                end
            rescue StandardError => e
                error = "Cannot migrate VM: #{e.message}."

                if VCenterDriver::CONFIG[:debug_information]
                    error += "\n\n#{e.backtrace.join("\n")}"
                end

                raise error
            end
        end

        ########################################################################
        # actions
        ########################################################################

        def shutdown
            return if powered_off?

            begin
                if vm_tools?
                    @item.ShutdownGuest
                else
                    poweroff_hard
                end
            rescue RbVmomi::Fault => e
                error = e.message.split(':').first
                raise e.message if error != 'InvalidPowerState'
            end
            timeout = CONFIG[:vm_poweron_wait_default]
            wait_timeout(:powered_off?, timeout)
        end

        def destroy
            @item.Destroy_Task.wait_for_completion
        end

        def mark_as_template
            @item.MarkAsTemplate
        end

        def mark_as_virtual_machine
            @item.MarkAsVirtualMachine(
                :pool => cluster['resourcePool']
            )
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

        def poweron(set_running = false)
            begin
                @item.PowerOnVM_Task.wait_for_completion
            rescue RbVmomi::Fault => e
                error = e.message.split(':').first
                raise e.message if error != 'InvalidPowerState'
            end
            # opennebula.running flag
            set_running(true, true) if set_running

            timeout = CONFIG[:vm_poweron_wait_default]
            wait_timeout(:powered_on?, timeout)
        end

        def powered_on?
            @item.runtime.powerState == 'poweredOn'
        end

        def powered_off?
            @item.runtime.powerState == 'poweredOff'
        end

        def poweroff_hard
            @item.PowerOffVM_Task.wait_for_completion
        end

        def remove_all_snapshots(consolidate = true)
            @item
                .RemoveAllSnapshots_Task(
                    { :consolidate => consolidate }
                ).wait_for_completion
            info_disks
        end

        def vm_tools?
            @item.guest.toolsRunningStatus == 'guestToolsRunning'
        end

        def set_running(state, execute = true)
            state ? value = 'yes' : value = 'no'

            config_array = [
                { :key => 'opennebula.vm.running', :value => value }
            ]

            return config_array unless execute

            spec = RbVmomi::VIM.VirtualMachineConfigSpec(
                { :extraConfig => config_array }
            )

            @item.ReconfigVM_Task(:spec => spec).wait_for_completion
        end

        # STATIC MEMBERS, ROUTINES AND CONSTRUCTORS
        ########################################################################

        def self.get_vm(opts = {})
            # try to retrieve machine from name
            if opts[:name]
                matches = opts[:name].match(/^one-(\d*)(-(.*))?$/)
                if matches
                    id = matches[1]
                    one_vm = VCenterDriver::VIHelper.one_item(
                        OpenNebula::VirtualMachine, id, false
                    )
                end
            end

            if one_vm.nil?
                one_vm = VCenterDriver::VIHelper
                         .find_by_ref(
                             OpenNebula::VirtualMachinePool,
                             'DEPLOY_ID',
                             opts[:ref],
                             opts[:vc_uuid],
                             opts[:pool]
                         )
            end

            one_vm
        end

        # Migrate a VM to another cluster and/or datastore
        # @params [int] vm_id ID of the VM to be migrated
        # @params [String] src_host Name of the source cluster
        # @params [String] dst_host Name of the target cluster
        # @params [Bool] hot_ds Wether this is a DS migration
        #         with the VM running or not
        # @params [int] ds Destination datastore ID
        def self.migrate_routine(
            vm_id,
            src_host,
            dst_host,
            hot_ds = false,
            ds = nil
        )
            one_client = OpenNebula::Client.new
            pool = OpenNebula::HostPool.new(one_client)
            pool.info

            src_id = pool["/HOST_POOL/HOST[NAME='#{src_host}']/ID"].to_i

            return if src_id == 0

            dst_id = pool["/HOST_POOL/HOST[NAME='#{dst_host}']/ID"].to_i

            # different destination ds
            if ds
                ds_pool = OpenNebula::DatastorePool.new(one_client)
                ds_pool.info
                vcenter_ds_red =
                    "/DATASTORE_POOL/DATASTORE[ID='#{ds}']" +
                        '/TEMPLATE/VCENTER_DS_REF'
                datastore = ds_pool[vcenter_ds_red]
            end

            vi_client = VCenterDriver::VIClient.new_from_host(src_id)

            # required one objects
            vm = OpenNebula::VirtualMachine.new_with_id(vm_id, one_client)
            dst_host = OpenNebula::Host.new_with_id(dst_id, one_client)

            # get info
            vm.info
            dst_host.info

            esx_migration_list = dst_host['/HOST/TEMPLATE/ESX_MIGRATION_LIST']

            # required vcenter objects
            vc_vm = VCenterDriver::VirtualMachine
                    .new_without_id(
                        vi_client,
                        vm['/VM/DEPLOY_ID']
                    )

            vc_vm.vm_id = vm_id

            ccr_ref  = dst_host['/HOST/TEMPLATE/VCENTER_CCR_REF']
            vc_host  = VCenterDriver::ClusterComputeResource.new_from_ref(
                ccr_ref, vi_client
            )

            config = { :cluster => vc_host }

            config[:same_host] = src_id == dst_id

            config[:datastore] = datastore if datastore
            if hot_ds
                config[:esx_migration_list] =
                    esx_migration_list if esx_migration_list
            else
                config[:esx_migration_list] = 'Selected_by_DRS'
            end

            vc_vm.reference_all_disks
            vc_vm.migrate(config)

            vm.replace({ 'VCENTER_CCR_REF' => ccr_ref })
        end

        # Try to build the vcenterdriver virtualmachine without
        # any opennebula id or object, this constructor can find
        # inside the opennebula pool until match
        #
        # @param vi_client [vi_client] the vcenterdriver client
        #        that allows the connection
        # @param ref [String] vcenter ref to the vm
        # @param opts [Hash] object with pairs that could
        #        contain multiple option
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

            new_one(vi_client, ref, one_vm)
        end

        # build a vcenterdriver virtual machine from a template
        # this function is used to instantiate vcenter vms
        #
        # @param vi_client [vi_client] the vcenterdriver
        #        client that allows the connection
        # @param drv_action [xmlelement] driver_action that contains the info
        # @param id [int] the if of the opennebula virtual machine
        #
        # @return [vcenterdriver::vm] the virtual machine
        def self.new_from_clone(vi_client, drv_action, id)
            new(vi_client, nil, id).tap do |vm|
                vm.clone_vm(drv_action)
            end
        end

        # build a vcenterdriver virtual machine
        # with the vmware item already linked
        #
        # @param vm_item the vmware VM item that it's going to be associated
        #
        # @return [vcenterdriver::vm] the virtual machine
        def self.new_with_item(vm_item)
            new(nil, nil, -1).tap do |vm|
                vm.item_update(vm_item)
            end
        end

        # build a vcenterdriver virtual machine
        # with the opennebula object linked
        #
        # @param vi_client [vi_client] the vcenterdriver
        #        client that allows the connection
        # @param ref [String] vcenter ref to the vm
        # @param one_item [one::vm] xmlelement of opennebula
        #
        # @return [vcenterdriver::vm] the virtual machine
        def self.new_one(vi_client, ref, one_item)
            id = one_item['ID'] || one_item['VM/ID'] rescue -1

            new(vi_client, ref, id).tap do |vm|
                if one_item.instance_of?(OpenNebula::VirtualMachine)
                    vm.one_item = one_item
                end
            end
        end

        # build a vcenterdriver virtual machine
        # without opennebula object link, use id = -1 instead
        #
        # @param vi_client [vi_client] the vcenterdriver client
        #        that allows the connection
        # @param ref [String] vcenter ref to the vm
        #
        # @return [vcenterdriver::vm] the virtual machine
        def self.new_without_id(vi_client, ref)
            new(vi_client, ref, -1)
        end

        ########################################################################

    end
    # class VirtualMachine

end
# module VCenterDriver
