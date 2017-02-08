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

    attr_accessor :item

    include Memoize

    def initialize(item=nil)
        @item = item
    end

    ############################################################################
    ############################################################################

    # clone from template attrs
    attr_accessor :vi_client
    attr_accessor :vm_prefix
    attr_accessor :one_item
    # attr_accessor :dfile
    attr_accessor :host

    # (used in clone_vm)
    # @return ClusterComputeResource
    def cluster
        if @cluster.nil?
            ccr_ref = @host['TEMPLATE/VCENTER_CCR']
            @cluster = ClusterComputeResource.new_from_ref(@vi_client, ccr_ref)
        end
        @cluster
    end

    # (used in clone_vm)
    # @return RbVmomi::VIM::ResourcePool
    def get_rp
        req_rp = one_item['USER_TEMPLATE/RESOURCE_POOL']

        if @vi_client.rp_confined?
            if req_rp && req_rp != @vi_client.rp
                raise "Available resource pool in host [#{@vi_client.rp}]"\
                      " does not match requested resource pool"\
                      " [#{req_rp}]"
            end

            return @vi_client.rp
        else

            if req_rp
                rps = cluster.resource_pools.select{|r| r._ref == req_rp }

                if rps.empty?
                    raise "No matching resource pool found (#{req_rp})."
                else
                    return rps.first
                end
            else
                return cluster.item.resourcePool
            end
        end
    end

    # (used in clone_vm)
    # @return RbVmomi::VIM::Datastore or nil
    def get_ds
        req_ds = one_item['USER_TEMPLATE/VCENTER_DATASTORE']

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

    # (used in clone_vm)
    # @return Customization or nil
    def get_customization
        xpath = "USER_TEMPLATE/VCENTER_CUSTOMIZATION_SPEC"
        customization_spec = one_item[xpath]

        if customization_spec.nil?
            return nil
        end

        begin
            custom_spec = @vi_client.vim
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

    def clone_vm
        vm_prefix = @host['TEMPLATE/VM_PREFIX']
        vm_prefix = VM_PREFIX_DEFAULT if vm_prefix.nil? || vm_prefix.empty?
        vm_prefix.gsub!("$i", one_item['ID'])

        vc_template_ref = one_item['USER_TEMPLATE/VCENTER_REF']
        vc_template = RbVmomi::VIM::VirtualMachine(@vi_client.vim, vc_template_ref)

        vcenter_name = vm_prefix + one_item['NAME']

        # Relocate spec
        relocate_spec_params = {}

        relocate_spec_params[:pool] = get_rp

        ds = get_ds
        if ds
            relocate_spec_params[:datastore] = ds
            relocate_spec_params[:diskMoveType] = :moveChildMostDiskBacking
        end

        relocate_spec = RbVmomi::VIM.VirtualMachineRelocateSpec(
                                                         relocate_spec_params)

        # Running flag - prevents spurious poweroff states in the VM
        running_flag = [{ :key => "opennebula.vm.running", :value => "no"}]

        running_flag_spec = RbVmomi::VIM.VirtualMachineConfigSpec(
                                {:extraConfig => running_flag})

        clone_parameters = {
            :location => relocate_spec,
            :powerOn  => false,
            :template => false,
            :config   => running_flag_spec
        }

        cs = get_customization
        clone_parameters[:customization] = cs if cs

        clone_spec = RbVmomi::VIM.VirtualMachineCloneSpec(clone_parameters)

        # TODO storpod (L2575 vcenter_driver.rb)

        begin
            vm = vc_template.CloneVM_Task(
                   :folder => vc_template.parent,
                   :name   => vcenter_name,
                   :spec   => clone_spec).wait_for_completion
        rescue Exception => e
            if !e.message.start_with?('DuplicateName')
                raise "Cannot clone VM Template: #{e.message}"
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

        # @item is populated

        @item = item

        reconfigure
        poweron
        set_running(true)

        return @item._ref
    end

    ############################################################################
    ############################################################################
    # these have @item populated


    # spec_hash
    #     :device_change
    #     :numCPUs
    #     :memoryMB
    #     :extraconfig
    #         :vmid
    #         :context
    #         :vnc
    #         :opennebula.hotplugged_nics
    def reconfigure
        spec_hash = {}
        extraconfig = []

        # get vmid
        extraconfig << spec_hash_vmid

        # get token
        extraconfig << spec_hash_context

        # vnc configuration (for config_array hash)
        extraconfig << spec_hash_vnc

        # extraconfig
        spec_hash.merge({:extraConfig => extraconfig})

        # device_change hash (nics)
        spec_hash.merge(spec_hash_nics)

        # device_change hash (disks)
        spec_hash.merge(spec_hash_disks)

        binding.pry
        #
    end

    def spec_hash_vmid
        { :key => "opennebula.vm.id", :value => one_item['ID'] }
    end

    def spec_hash_context
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

    def spec_hash_vnc
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

    def spec_hash_nics
        nics = []
        one_item.each("TEMPLATE/NIC") { |nic| nics << nic }

        if !is_new?
            # TODO: review
            nic_array = []

            # Get MACs from NICs inside VM template
            one_mac_addresses = []

            nics.each{|nic|
                one_mac_addresses << nic.elements["MAC"].text
            } rescue nil

            # B4897 - Get mac of NICs that were hot-plugged from vCenter extraConfig
            hotplugged_nics = []
            extraconfig_nics = vm.config.extraConfig.select do |val|
                val[:key] == "opennebula.hotplugged_nics"
            end

            if extraconfig_nics && !extraconfig_nics.empty?
                hotplugged_nics = extraconfig_nics[0][:value].to_s.split(";")
            end

            vm.config.hardware.device.each{ |dv|
                if is_nic?(dv)
                   nics.each{|nic|
                      if nic.elements["MAC"].text == dv.macAddress
                         nics.delete(nic)
                      end
                   } rescue nil

                   # B4897 - Remove detached NICs from vCenter that were unplugged in POWEROFF
                   if !one_mac_addresses.include?(dv.macAddress) && hotplugged_nics.include?(dv.macAddress)
                       nic_array << { :operation => :remove, :device => dv}
                       hotplugged_nics.delete(dv.macAddress)
                       config_array << {
                        :key    => 'opennebula.hotplugged_nics',
                        :value  => hotplugged_nics.join(";")
                       }
                   end
                end
            }

            device_change += nic_array
        end

        return if nics.nil?

        if nics

        end
    end

    def spec_hash_disks
        if is_new?
        end
    end

    def poweron
    end

    def set_running(state)
    end

    def one_item
        # TODO: fetch one_item if it doesn't exist
        @one_item
    end

    def is_new?
        vm_id = vm['config.extraConfig'].select do |o|
            o.key == "opennebula.vm.id"
        end.first.value rescue nil

        !vm_id
    end

    ############################################################################
    ############################################################################

    # @param vm CachedItem (of RbVmomi::VIM::VirtualMachine)
    def to_one
        cluster = self["runtime.host.parent.name"]

        str = %Q{
            NAME   = "#{self["name"]} - #{cluster}"
            CPU    = "#{self["config.hardware.numCPU"]}"
            vCPU   = "#{self["config.hardware.numCPU"]}"
            MEMORY = "#{self["config.hardware.memoryMB"]}"

            HYPERVISOR = "vcenter"

            PUBLIC_CLOUD = [
              TYPE        ="vcenter",
              VM_TEMPLATE ="#{self["config.uuid"]}",
              VCENTER_REF ="#{self["_ref"]}",
              VCENTER_NAME="#{self["name"]}",
              HOST        ="#{cluster}"
            ]

            GRAPHICS = [
              TYPE     ="vnc",
              LISTEN   ="0.0.0.0"
            ]

            SCHED_REQUIREMENTS="NAME=\\\"#{cluster}\\\""

            CONTEXT = [
              NETWORK = "YES",
              SSH_PUBLIC_KEY = "$USER[SSH_PUBLIC_KEY]"
            ]
        }

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

=begin
        # PerfManager metrics
        pm = @client.vim.serviceInstance.content.perfManager

        provider = pm.provider_summary [@vm].first
        refresh_rate = provider.refreshRate

        vmid = -1
        extraconfig_vmid = @vm.config.extraConfig.select{|val|
                                        val[:key]=="opennebula.vm.id"}
        if extraconfig_vmid.size > 0 and extraconfig_vmid[0]
            vmid = extraconfig_vmid[0][:value].to_i
        end

        if vmid < 0
            @nettx = 0
            @netrx = 0
            @diskrdbytes = 0
            @diskwrbytes = 0
            @diskrdiops = 0
            @diskwriops = 0
        else
            one_vm = OpenNebula::VirtualMachine.new_with_id(vmid, OpenNebula::Client.new)
            one_vm.info
            stats = []

            if(one_vm["MONITORING/LAST_MON"] && one_vm["MONITORING/LAST_MON"].to_i != 0 )
                #Real time data stores max 1 hour. 1 minute has 3 samples
                interval = (Time.now.to_i - one_vm["MONITORING/LAST_MON"].to_i)

                #If last poll was more than hour ago get 3 minutes,
                #else calculate how many samples since last poll
                samples =  interval > 3600 ? 9 : (interval / refresh_rate) + 1
                max_samples = samples > 0 ? samples : 1

                stats = pm.retrieve_stats(
                    [@vm],
                    ['net.transmitted','net.bytesRx','net.bytesTx','net.received',
                    'virtualDisk.numberReadAveraged','virtualDisk.numberWriteAveraged',
                    'virtualDisk.read','virtualDisk.write'],
                    {interval:refresh_rate, max_samples: max_samples}
                )
            else
                # First poll, get at least latest 3 minutes = 9 samples
                stats = pm.retrieve_stats(
                    [@vm],
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
            end
        end
=end

    end

    ########################################################################
    #  Generates a OpenNebula IM Driver valid string with the monitor info
    ########################################################################
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

    ########################################################################
    # Converts the VI string state to OpenNebula state convention
    # Guest states are:
    # - poweredOff   The virtual machine is currently powered off.
    # - poweredOn    The virtual machine is currently powered on.
    # - suspended    The virtual machine is currently suspended.
    ########################################################################
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
    def self.new_from_ref(vi_client, ref)
        self.new(RbVmomi::VIM::VirtualMachine.new(vi_client.vim, ref))
    end
end # class VirtualMachine

end # module VCenterDriver
