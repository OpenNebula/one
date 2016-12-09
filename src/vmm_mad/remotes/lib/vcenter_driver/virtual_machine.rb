module VCenterDriver
class VCenterVm
    attr_reader :vm

    POLL_ATTRIBUTE  = OpenNebula::VirtualMachine::Driver::POLL_ATTRIBUTE
    VM_STATE        = OpenNebula::VirtualMachine::Driver::VM_STATE

    ############################################################################
    #  Creates a new VIVm using a RbVmomi::VirtualMachine object
    #    @param client [VCenterClient] client to connect to vCenter
    #    @param vm_vi [RbVmomi::VirtualMachine] it will be used if not nil
    ########################################################################
    def initialize(client, vm_vi )
        @vm     = vm_vi
        @client = client

        @used_cpu    = 0
        @used_memory = 0

        @netrx = 0
        @nettx = 0

        @diskrdbytes = 0
        @diskwrbytes = 0
        @diskrdiops = 0
        @diskwriops = 0
    end

    ############################################################################
    # Deploys a VM
    #  @xml_text XML representation of the VM
    ############################################################################
    def self.deploy(xml_text, lcm_state, deploy_id, hostname, datastore = nil,
                    ops = {})
        if lcm_state == "BOOT" || lcm_state == "BOOT_FAILURE"
            return clone_vm(xml_text, hostname, datastore, ops)
        else
            hid         = VIClient::translate_hostname(hostname)
            connection  = VIClient.new(hid)
            vm          = connection.find_vm_fast(deploy_id,
                                                  ops[:ref],
                                                  ops[:name])
            xml         = REXML::Document.new xml_text

            reconfigure_vm(vm, xml, false, hostname)

            vm.PowerOnVM_Task.wait_for_completion

            return vm.config.uuid
        end
    end

    ############################################################################
    # Cancels a VM
    #  @param deploy_id vcenter identifier of the VM
    #  @param hostname name of the host (equals the vCenter cluster)
    #  @param lcm_state state of the VM
    #  @param keep_disks keep or not VM disks in datastore
    #  @param disks VM attached disks
    ############################################################################
    def self.cancel(deploy_id, hostname, lcm_state, keep_disks, disks, to_template)

        case lcm_state
            when "SHUTDOWN_POWEROFF", "SHUTDOWN_UNDEPLOY"
                shutdown(deploy_id, hostname, lcm_state, keep_disks, disks, to_template)
            when "CANCEL", "LCM_INIT", "CLEANUP_RESUBMIT", "SHUTDOWN", "CLEANUP_DELETE"
                hid         = VIClient::translate_hostname(hostname)
                connection  = VIClient.new(hid)

                vm = connection.find_vm_template(deploy_id)

                begin
                    if vm.summary.runtime.powerState == "poweredOn"
                        vm.PowerOffVM_Task.wait_for_completion
                    end
                rescue
                end

                if keep_disks
                    detach_all_disks(vm)
                else
                    detach_attached_disks(vm, disks, hostname) if disks
                end

                # If the VM was instantiated to persistent, convert the VM to
                # vCenter VM Template and update the OpenNebula new
                # VM Template to point to the new vCenter VM Template
                if !to_template.nil?
                    vm.MarkAsTemplate

                    new_template = OpenNebula::Template.new_with_id(to_template,
                                                         OpenNebula::Client.new)
                    new_template.info

                    public_cloud_str = "PUBLIC_CLOUD=["

                    new_template.to_hash["VMTEMPLATE"]["TEMPLATE"]["PUBLIC_CLOUD"].each{|k,v|
                        if k == "VM_TEMPLATE"
                            public_cloud_str += "VM_TEMPLATE=\"#{deploy_id}\",\n"
                        else
                            public_cloud_str += "#{k}=\"#{v}\",\n"
                        end
                    }

                    public_cloud_str = public_cloud_str + "]"

                    new_template.update(public_cloud_str, true)
                else
                    vm.Destroy_Task.wait_for_completion
                end
            else
                raise "LCM_STATE #{lcm_state} not supported for cancel"
        end
    end


    ############################################################################
    # Saves a VM
    #  @param deploy_id vcenter identifier of the VM
    #  @param hostname name of the host (equals the vCenter cluster)
    ############################################################################
    def self.save(deploy_id, hostname, lcm_state)
        case lcm_state
            when "SAVE_MIGRATE"
                raise "Migration between vCenters cluster not supported"
            when "SAVE_SUSPEND", "SAVE_STOP"
                hid         = VIClient::translate_hostname(hostname)
                connection  = VIClient.new(hid)
                vm          = connection.find_vm_template(deploy_id)

                vm.SuspendVM_Task.wait_for_completion
        end
    end

    ############################################################################
    # Resumes a VM
    #  @param deploy_id vcenter identifier of the VM
    #  @param hostname name of the host (equals the vCenter cluster)
    ############################################################################
    def self.resume(deploy_id, hostname)
        hid         = VIClient::translate_hostname(hostname)
        connection  = VIClient.new(hid)
        vm          = connection.find_vm_template(deploy_id)

        vm.PowerOnVM_Task.wait_for_completion
    end

    ############################################################################
    # Reboots a VM
    #  @param deploy_id vcenter identifier of the VM
    #  @param hostname name of the host (equals the vCenter cluster)
    ############################################################################
    def self.reboot(deploy_id, hostname)
        hid         = VIClient::translate_hostname(hostname)
        connection  = VIClient.new(hid)

        vm          = connection.find_vm_template(deploy_id)

        vm.RebootGuest.wait_for_completion
    end

    ############################################################################
    # Resets a VM
    #  @param deploy_id vcetranslate_hostnamnter identifier of the VM
    #  @param hostname name of the host (equals the vCenter cluster)
    ############################################################################
    def self.reset(deploy_id, hostname)
        hid         = VIClient::translate_hostname(hostname)
        connection  = VIClient.new(hid)

        vm          = connection.find_vm_template(deploy_id)

        vm.ResetVM_Task.wait_for_completion
    end

    ############################################################################
    # Shutdown a VM
    #  @param deploy_id vcenter identifier of the VM
    #  @param hostname name of the host (equals the vCenter cluster)
    #  @param lcm_state state of the VM
    #  @param keep_disks keep or not VM disks in datastore
    #  @param disks VM attached disks
    #  @param to_template whether this VM has been instantiated as persistent
    ############################################################################
    def self.shutdown(deploy_id, hostname, lcm_state, keep_disks, disks, to_template)
        hid         = VIClient::translate_hostname(hostname)
        connection  = VIClient.new(hid)

        vm   = connection.find_vm_template(deploy_id)

        case lcm_state
            when "SHUTDOWN"
                begin
                    vm.ShutdownGuest
                    counter = 60*10 # 10 minutes
                    while counter > 0
                        break if vm.runtime.powerState == "poweredOff"
                        counter -= 1
                        sleep 1
                    end
                rescue
                end

                if vm.runtime.powerState != "poweredOff"
                    vm.PowerOffVM_Task.wait_for_completion
                end

                if keep_disks
                    detach_all_disks(vm)
                else
                    detach_attached_disks(vm, disks, hostname) if disks
                end

                # If the VM was instantiated to persistent, convert the VM to
                # vCenter VM Template and update the OpenNebula new
                # VM Template to point to the new vCenter VM Template
                if !to_template.nil?
                    vm.MarkAsTemplate

                    new_template = OpenNebula::Template.new_with_id(to_template,
                                                        OpenNebula::Client.new)
                    new_template.info

                    public_cloud_str = "PUBLIC_CLOUD=["

                    new_template.to_hash["VMTEMPLATE"]["TEMPLATE"]["PUBLIC_CLOUD"].each{|k,v|
                        if k == "VM_TEMPLATE"
                            public_cloud_str += "VM_TEMPLATE=\"#{deploy_id}\"\n"
                        else
                            public_cloud_str += "#{k}=\"#{v}\",\n"
                        end
                    }

                    public_cloud_str = public_cloud_str + "]"

                    new_template.update(public_cloud_str, true)
                else
                    vm.Destroy_Task.wait_for_completion
                end

            when "SHUTDOWN_POWEROFF", "SHUTDOWN_UNDEPLOY"
                begin
                    vm.ShutdownGuest
                    counter = 60*10 # 10 minutes
                    while counter > 0
                        break if vm.runtime.powerState == "poweredOff"
                        counter -= 1
                        sleep 1
                    end
                rescue
                end

                if vm.runtime.powerState != "poweredOff"
                    vm.PowerOffVM_Task.wait_for_completion
                end
        end
    end

    ############################################################################
    # Create VM snapshot
    #  @param deploy_id vcenter identifier of the VM
    #  @param hostname name of the host (equals the vCenter cluster)
    #  @param snaphot_name name of the snapshot
    ############################################################################
    def self.create_snapshot(deploy_id, hostname, snapshot_name)
        hid         = VIClient::translate_hostname(hostname)
        connection  = VIClient.new(hid)

        snapshot_hash = {
            :name => snapshot_name,
            :description => "OpenNebula Snapshot of VM #{deploy_id}",
            :memory => true,
            :quiesce => true
        }

        vm          = connection.find_vm_template(deploy_id)

        vm.CreateSnapshot_Task(snapshot_hash).wait_for_completion

        return snapshot_name
    end

    ############################################################################
    # Find VM snapshot
    #  @param list root list of VM snapshots
    #  @param snaphot_name name of the snapshot
    ############################################################################
    def self.find_snapshot(list, snapshot_name)
        list.each do |i|
            if i.name == snapshot_name
                return i.snapshot
            elsif !i.childSnapshotList.empty?
                snap = find_snapshot(i.childSnapshotList, snapshot_name)
                return snap if snap
            end
        end

        nil
    end

    ############################################################################
    # Delete VM snapshot
    #  @param deploy_id vcenter identifier of the VM
    #  @param hostname name of the host (equals the vCenter cluster)
    #  @param snaphot_name name of the snapshot
    ############################################################################
    def self.delete_snapshot(deploy_id, hostname, snapshot_name)
        hid         = VIClient::translate_hostname(hostname)
        connection  = VIClient.new(hid)

        vm          = connection.find_vm_template(deploy_id)

        list = vm.snapshot.rootSnapshotList

        snapshot = find_snapshot(list, snapshot_name)
        return nil if !snapshot

        delete_snapshot_hash = {
            :_this => snapshot,
            :removeChildren => false
        }

        snapshot.RemoveSnapshot_Task(delete_snapshot_hash).wait_for_completion
    end

    ############################################################################
    # Revert VM snapshot
    #  @param deploy_id vcenter identifier of the VM
    #  @param hostname name of the host (equals the vCenter cluster)
    #  @param snaphot_name name of the snapshot
    ############################################################################
    def self.revert_snapshot(deploy_id, hostname, snapshot_name)
        hid         = VIClient::translate_hostname(hostname)
        connection  = VIClient.new(hid)

        vm          = connection.find_vm_template(deploy_id)

        list = vm.snapshot.rootSnapshotList

        snapshot = find_snapshot(list, snapshot_name)
        return nil if !snapshot

        revert_snapshot_hash = {
            :_this => snapshot
        }

        snapshot.RevertToSnapshot_Task(revert_snapshot_hash).wait_for_completion
    end

    ############################################################################
    # Attach NIC to a VM
    #  @param deploy_id vcenter identifier of the VM
    #  @param mac MAC address of the NIC to be attached
    #  @param bridge name of the Network in vCenter
    #  @param model model of the NIC to be attached
    #  @param host hostname of the ESX where the VM is running
    ############################################################################
    def self.attach_nic(deploy_id, mac, bridge, model, host)
        hid         = VIClient::translate_hostname(host)
        connection  = VIClient.new(hid)

        vm          = connection.find_vm_template(deploy_id)

        spec_nics   = calculate_addnic_spec(vm, mac, bridge, model)

        spec_hash = {:deviceChange => [spec_nics]}


        #B4897 track hot plugged nics
        hotplugged_nics = vm.config.extraConfig.select do |val|
            val[:key] == "opennebula.hotplugged_nics"
        end

        if hotplugged_nics && !hotplugged_nics.empty?
            hotplugged_nics = hotplugged_nics[0][:value].to_s
            hotplugged_nics << mac.to_s << ";" if !hotplugged_nics.include?(mac)
        else
            hotplugged_nics = ""
            hotplugged_nics << mac.to_s << ";"
        end

        config_array = [{:key=>"opennebula.hotplugged_nics",
                         :value=>hotplugged_nics}]
        extra_config_spec = {:extraConfig =>config_array}

        spec_hash.merge!(extra_config_spec)

        spec        = RbVmomi::VIM.VirtualMachineConfigSpec(spec_hash)

        vm.ReconfigVM_Task(:spec => spec).wait_for_completion

    end

    ############################################################################
    # Detach NIC from a VM
    ############################################################################
    def self.detach_nic(deploy_id, mac, host)
        hid         = VIClient::translate_hostname(host)
        connection  = VIClient.new(hid)

        vm   = connection.find_vm_template(deploy_id)

        nic  = vm.config.hardware.device.find { |d|
                is_nic?(d) && (d.macAddress ==  mac)
        }

        raise "Could not find NIC with mac address #{mac}" if nic.nil?

        #B4897 track hot plugged nics
        hotplugged_nics = vm.config.extraConfig.select do |val|
            val[:key] == "opennebula.hotplugged_nics"
        end

        config_array = []
        if hotplugged_nics && !hotplugged_nics.empty?
            hotplugged_nics = hotplugged_nics[0][:value].to_s
            hotplugged_nics.slice!(mac + ";") # remove hotplugged nic
            config_array = [{:key=>"opennebula.hotplugged_nics",
                         :value=>hotplugged_nics}]
        end

        spec = {
            :deviceChange => [
                :operation => :remove,
                :device => nic
            ],
            :extraConfig => config_array
        }

        vm.ReconfigVM_Task(:spec => spec).wait_for_completion
    end

    ############################################################################
    # Reconfigures a VM (context data)
    #  @param deploy_id vcenter identifier of the VM
    #  @param hostname name of the host (equals the vCenter cluster)
    #  @param xml_text XML repsentation of the VM
    ############################################################################
    def self.reconfigure(deploy_id, hostname, xml_text)
        hid         = VIClient::translate_hostname(hostname)
        connection  = VIClient.new(hid)
        vm          = connection.find_vm_template(deploy_id)

        xml = REXML::Document.new xml_text
        context = xml.root.elements["//TEMPLATE/CONTEXT"]

        if context
            context_text = create_context(context)
            context_spec = {
                :extraConfig => [
                    { :key=>"guestinfo.opennebula.context",
                      :value=> Base64.encode64(context_text) }
                ]
            }

            spec      = RbVmomi::VIM.VirtualMachineConfigSpec(context_spec)
            vm.ReconfigVM_Task(:spec => spec).wait_for_completion
        end
    end

    ########################################################################
    #  Initialize the vm monitor information
    ########################################################################
    def monitor(host)
        @summary = @vm.summary
        @state   = state_to_c(@summary.runtime.powerState)

        if @state != VM_STATE[:active]
            @used_cpu    = 0
            @used_memory = 0

            @netrx = 0
            @nettx = 0

            @diskrdbytes = 0
            @diskwrbytes = 0
            @diskrdiops = 0
            @diskwriops = 0
            return
        end

        @used_memory = @summary.quickStats.hostMemoryUsage * 1024
        cpuMhz       = @vm.runtime.host.summary.hardware.cpuMhz.to_f

        @used_cpu   =
                ((@summary.quickStats.overallCpuUsage.to_f / cpuMhz) * 100).to_s
        @used_cpu   = sprintf('%.2f',@used_cpu).to_s

        # Check for negative values
        @used_memory = 0 if @used_memory.to_i < 0
        @used_cpu    = 0 if @used_cpu.to_i < 0

        @esx_host       = @vm.summary.runtime.host.name
        @guest_ip       = @vm.guest.ipAddress
        @guest_state    = @vm.guest.guestState
        @vmware_tools   = @vm.guest.toolsRunningStatus
        @vmtools_ver    = @vm.guest.toolsVersion
        @vmtools_verst  = @vm.guest.toolsVersionStatus

        guest_ip_addresses = []

        @vm.guest.net.each do |net|
            net.ipConfig.ipAddress.each do |ip|
                guest_ip_addresses << ip.ipAddress
            end if net.ipConfig && net.ipConfig.ipAddress
        end if @vm.guest.net

        @guest_ip_addresses = guest_ip_addresses.join(',')

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
    end

    ########################################################################
    #  Generates a OpenNebula IM Driver valid string with the monitor info
    ########################################################################
    def info
      return 'STATE=d' if @state == 'd'

      str_info = ""

      str_info << "GUEST_IP=" << @guest_ip.to_s << " " if @guest_ip
      if @guest_ip_addresses && !@guest_ip_addresses.empty?
          str_info << "GUEST_IP_ADDRESSES=\\\"" <<
              @guest_ip_addresses.to_s << "\\\" "
      end
      str_info << "LAST_MON=" << Time.now.to_i.to_s << " "
      str_info << "#{POLL_ATTRIBUTE[:state]}="  << @state                << " "
      str_info << "#{POLL_ATTRIBUTE[:cpu]}="    << @used_cpu.to_s        << " "
      str_info << "#{POLL_ATTRIBUTE[:memory]}=" << @used_memory.to_s     << " "
      str_info << "#{POLL_ATTRIBUTE[:netrx]}="  << @netrx.to_s           << " "
      str_info << "#{POLL_ATTRIBUTE[:nettx]}="  << @nettx.to_s           << " "
      str_info << "DISKRDBYTES=" << @diskrdbytes.to_s << " "
      str_info << "DISKWRBYTES=" << @diskwrbytes.to_s << " "
      str_info << "DISKRDIOPS="  << @diskrdiops.to_s  << " "
      str_info << "DISKWRIOPS="  << @diskwriops.to_s  << " "
      str_info << "ESX_HOST=\\\""               << @esx_host.to_s        << "\\\" "
      str_info << "GUEST_STATE="                << @guest_state.to_s     << " "
      str_info << "VMWARETOOLS_RUNNING_STATUS=" << @vmware_tools.to_s    << " "
      str_info << "VMWARETOOLS_VERSION="        << @vmtools_ver.to_s     << " "
      str_info << "VMWARETOOLS_VERSION_STATUS=" << @vmtools_verst.to_s   << " "
      str_info << "RESOURCE_POOL=\\\""          << @vm.resourcePool.name << "\\\" "
    end

    ########################################################################
    # Generates an OpenNebula Template for this VCenterVm
    ########################################################################
    def to_one(host)
        cluster_name = host.cluster_name

        str = "NAME   = \"#{@vm.name} - #{cluster_name}\"\n"\
              "CPU    = \"#{@vm.config.hardware.numCPU}\"\n"\
              "vCPU   = \"#{@vm.config.hardware.numCPU}\"\n"\
              "MEMORY = \"#{@vm.config.hardware.memoryMB}\"\n"\
              "HYPERVISOR = \"vcenter\"\n"\
              "PUBLIC_CLOUD = [\n"\
              "  TYPE        =\"vcenter\",\n"\
              "  VM_TEMPLATE =\"#{@vm.config.uuid}\",\n"\
              "  VCENTER_REF =\"#{@vm.ref}\",\n"\
              "  VCENTER_NAME=\"#{@vm.name}\",\n"\
              "  HOST        =\"#{cluster_name}\"\n"\
              "]\n"\
              "GRAPHICS = [\n"\
              "  TYPE     =\"vnc\",\n"\
              "  LISTEN   =\"0.0.0.0\"\n"\
              "]\n"\
         "SCHED_REQUIREMENTS=\"NAME=\\\"#{cluster_name}\\\"\"\n"\
              "CONTEXT = ["\
              "  NETWORK = \"YES\","\
              "  SSH_PUBLIC_KEY = \"$USER[SSH_PUBLIC_KEY]\" ]"

        if @vm.config.annotation.nil? || @vm.config.annotation.empty?
            str << "DESCRIPTION = \"vCenter Template imported by OpenNebula"\
                " from Cluster #{@vm.runtime.host.parent.name}\"\n"
        else
            notes = @vm.config.annotation.gsub("\\", "\\\\").gsub("\"", "\\\"")
            str << "DESCRIPTION = \"#{notes}\"\n"
        end

        case @vm.guest.guestFullName
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

    ########################################################################
    # Generates a Datastore user input
    ########################################################################
    def to_one_ds(host, default_ds)
        # Datastores User Input
        str = ""

        if host.ds_list != ""
            str    =  "M|list|Which datastore you want this VM to run on?|"\
                   << "#{host.ds_list}|#{default_ds}"
        end

        return str
     end

    ########################################################################
    # Generates a Resource Pool user input
    ########################################################################
     def to_one_rp(host)
        # Resource Pool User Input
        str = ""

        if host.rp_list != ""
            str    =  "M|list|Which resource pool you want this VM to run"\
                      " in?|#{host.rp_list}|#{host.rp_list.split(",")[0]}"
        end

        return str
    end

    ########################################################################
    # Generates an OpenNebula VirtualMachine for this VCenterVm
    #
    #
    ########################################################################
    def vm_to_one(host)
        cluster_name = host.cluster_name

        state = case state_to_c(@summary.runtime.powerState)
                    when 'a'
                        "RUNNING"
                    when 'd'
                        "POWEROFF"
                end

        str = "NAME   = \"#{@vm.name} - #{cluster_name}\"\n"\
              "CPU    = \"#{@vm.config.hardware.numCPU}\"\n"\
              "vCPU   = \"#{@vm.config.hardware.numCPU}\"\n"\
              "MEMORY = \"#{@vm.config.hardware.memoryMB}\"\n"\
              "HYPERVISOR = \"vcenter\"\n"\
              "PUBLIC_CLOUD = [\n"\
              "  TYPE        =\"vcenter\",\n"\
              "  VM_TEMPLATE =\"#{@vm.config.uuid}\",\n"\
              "  HOST        =\"#{cluster_name}\"\n"\
              "]\n"\
              "IMPORT_VM_ID    = \"#{@vm.config.uuid}\"\n"\
              "IMPORT_STATE   = \"#{state}\"\n"\
              "SCHED_REQUIREMENTS=\"NAME=\\\"#{cluster_name}\\\"\"\n"

        vp     = @vm.config.extraConfig.select{|v|
                                           v[:key].downcase=="remotedisplay.vnc.port"}
        keymap = @vm.config.extraConfig.select{|v|
                                           v[:key].downcase=="remotedisplay.vnc.keymap"}

        if vp.size > 0
            str << "GRAPHICS = [\n"\
                   "  TYPE     =\"vnc\",\n"\
                   "  LISTEN   =\"0.0.0.0\",\n"\
                   "  PORT     =\"#{vp[0][:value]}\"\n"
            str << " ,KEYMAP   =\"#{keymap[0][:value]}\"\n" if keymap[0]
            str << "]\n"
        end

        if @vm.config.annotation.nil? || @vm.config.annotation.empty?
            str << "DESCRIPTION = \"vCenter Virtual Machine imported by"\
                " OpenNebula from Cluster #{cluster_name}\"\n"
        else
            notes = @vm.config.annotation.gsub("\\", "\\\\").gsub("\"", "\\\"")
            str << "DESCRIPTION = \"#{notes}\"\n"
        end

        case @vm.guest.guestFullName
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

private

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

    ########################################################################
    #  Checks if a RbVmomi::VIM::VirtualDevice is a network interface
    ########################################################################
    def self.is_nic?(device)
        !device.class.ancestors.index(RbVmomi::VIM::VirtualEthernetCard).nil?
    end

    ########################################################################
    #  Checks if a RbVmomi::VIM::VirtualDevice is a disk
    ########################################################################
    def self.is_disk?(device)
        is_disk  = !(device.class.ancestors.index(RbVmomi::VIM::VirtualDisk)).nil?
        is_cdrom =  !(device.class.ancestors.index(RbVmomi::VIM::VirtualCdrom)).nil?
        is_disk or is_cdrom
    end

    ########################################################################
    # Returns the spec to reconfig a VM and add a NIC
    ########################################################################
    def self.calculate_addnic_spec(vm, mac, bridge, model, limit=nil, rsrv=nil)
        model       = model.nil? ? nil : model.downcase
        network     = vm.runtime.host.network.select{|n| n.name==bridge}
        backing     = nil

        if network.empty?
            raise "Network #{bridge} not found in host #{vm.runtime.host.name}"
        else
            network = network[0]
        end

        card_num = 1 # start in one, we want the next avaliable id

        vm.config.hardware.device.each{ |dv|
            card_num = card_num + 1 if is_nic?(dv)
        }

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
                        :network => network)
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
            :backing => backing,
            :addressType => mac ? 'manual' : 'generated',
            :macAddress  => mac
        }

        if (limit or rsrv) and (limit > 0)
            ra_spec = Hash.new
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

        return {
                :operation => :add,
                :device => nic_card.new(card_spec)
               }
    end

    ########################################################################
    #  Clone a vCenter VM Template and leaves it powered on
    ########################################################################
    def self.clone_vm(xml_text, hostname, datastore, ops = {})

        host_id = VCenterDriver::VIClient.translate_hostname(hostname)

        # Retrieve hostname

        host  =  OpenNebula::Host.new_with_id(host_id, OpenNebula::Client.new())
        host.info   # Not failing if host retrieval fails

        # Get VM prefix name

        if host["/HOST/TEMPLATE/VM_PREFIX"] and !host["/HOST/TEMPLATE/VM_PREFIX"].empty?
            vmname_prefix = host["/HOST/TEMPLATE/VM_PREFIX"]
        else # fall back to default value
            vmname_prefix = "one-$i-"
        end

        xml = REXML::Document.new xml_text
        pcs = xml.root.get_elements("/VM/USER_TEMPLATE/PUBLIC_CLOUD")

        raise "Cannot find VCenter element in VM template." if pcs.nil?

        template = pcs.select { |t|
            type = t.elements["TYPE"]
            !type.nil? && type.text.downcase == "vcenter"
        }

        # If there are multiple vCenter templates, find the right one

        if template.is_a? Array
            all_vcenter_templates = template.clone
            # If there is more than one coincidence, pick the first one
            template = template.select {|t|
                cluster_name = t.elements["HOST"]
                !cluster_name.nil? && cluster_name.text == hostname
            }[0]
            # The template may not reference any specific CLUSTER
            # (referenced to as HOST in the OpenNebula template)
            # Therefore, here take the first one that does not
            # specify a CLUSTER to see if we are lucky
            if template.nil?
                template = all_vcenter_templates.select {|t|
                    t.elements["HOST"].nil?
                }[0]
            end
        end

        raise "Cannot find vCenter element in VM template." if template.nil?

        uuid = template.elements["VM_TEMPLATE"]

        raise "Cannot find VM_TEMPLATE in vCenter element." if uuid.nil?

        uuid         = uuid.text
        vmid         = xml.root.elements["/VM/ID"].text
        vmname_prefix.gsub!("$i", vmid)
        vcenter_name = "#{vmname_prefix}#{xml.root.elements["/VM/NAME"].text}"
        hid          = xml.root.elements["/VM/HISTORY_RECORDS/HISTORY/HID"]

        raise "Cannot find host id in deployment file history." if hid.nil?

        connection  = VIClient.new(hid)
        vc_template = connection.find_vm_fast(uuid, ops[:ref], ops[:name])

        # Find out requested and available resource pool

        req_rp = nil
        if !xml.root.elements["/VM/USER_TEMPLATE/RESOURCE_POOL"].nil?
            req_rp = xml.root.elements["/VM/USER_TEMPLATE/RESOURCE_POOL"].text
        end

        if connection.rp_confined?
            rp = connection.resource_pool.first
            if req_rp && rp.name != req_rp
                raise "Available resource pool in host [#{rp.name}]"\
                      " does not match requested resource pool"\
                      " [#{req_rp}]"
            end
        else
            if req_rp # if there is requested resource pool, retrieve it
                rp = connection.find_resource_pool(req_rp)
                raise "Cannot find resource pool "\
                      "#{template.elements["RESOURCE_POOL"].text}" if !rp
            else # otherwise, get the default resource pool
                rp = connection.default_resource_pool
            end
        end

        # Find out requested and available datastore

        if !xml.root.elements["/VM/USER_TEMPLATE/VCENTER_DATASTORE"].nil?
           datastore = xml.root.elements["/VM/USER_TEMPLATE/VCENTER_DATASTORE"].text
        end

        if datastore
            datastores = VIClient.get_entities(connection.dc.datastoreFolder,
                                             'Datastore')

            storage_pods = VIClient.get_entities(connection.dc.datastoreFolder,
                                                'StoragePod')

            storpod = storage_pods.select{|sp| sp.name == datastore}

            storage_pods.each { |sp|
                storage_pod_datastores = VIClient.get_entities(sp, 'Datastore')
                if not storage_pod_datastores.empty?
                    datastores.concat(storage_pod_datastores)
                end
            }

            ds  = datastores.select{|ds| ds.name == datastore}[0]

            raise "Cannot find datastore #{datastore}" if !ds && !storpod

        end

        relocate_spec_params = {
            :pool         => rp
        }

        relocate_spec_params[:datastore] = ds if datastore

        relocate_spec_params[:diskMoveType] = :moveChildMostDiskBacking if ds

        relocate_spec = RbVmomi::VIM.VirtualMachineRelocateSpec(
                                                         relocate_spec_params)

        # This running flag will prevent spurious poweroff states in the VM

        running_flag = [{:key=>"opennebula.vm.running",:value=>"no"}]

        running_flag_spec = RbVmomi::VIM.VirtualMachineConfigSpec(
                                {:extraConfig =>running_flag})

        clone_parameters = {
            :location => relocate_spec,
            :powerOn  => false,
            :template => false,
            :config   => running_flag_spec
        }

        customization = template.elements["CUSTOMIZATION_SPEC"]

        vim = connection.vim

        if !customization.nil?
            begin
                custom_spec = vim.serviceContent.customizationSpecManager.
                    GetCustomizationSpec(:name => customization.text)

                if custom_spec && spec=custom_spec.spec
                    clone_parameters[:customization] = spec
                else
                    raise "Error getting customization spec"
                end

            rescue
                raise "Customization spec '#{customization.text}' not found"
            end
        end

        clone_spec = RbVmomi::VIM.VirtualMachineCloneSpec(clone_parameters)

        if storpod && !storpod.empty? && storpod[0].is_a?(RbVmomi::VIM::StoragePod)

            storage_manager = vim.serviceContent.storageResourceManager

            pod_spec = RbVmomi::VIM.StorageDrsPodSelectionSpec(storagePod: storpod[0])

            storage_spec = RbVmomi::VIM.StoragePlacementSpec(
                type: 'clone',
                cloneName: vcenter_name,
                folder: vc_template.parent,
                podSelectionSpec: pod_spec,
                vm: vc_template,
                cloneSpec: clone_spec
            )

            result = storage_manager.RecommendDatastores(storageSpec: storage_spec)

            recommendation = result.recommendations[0]

            key = recommendation.key ||= ''

            if key == ''
                raise "Missing Datastore recommendation for StoragePod (Storage DRS)"
            end

            begin
                apply_sr = storage_manager.ApplyStorageDrsRecommendation_Task(key: [key]).wait_for_completion
                vm = apply_sr.vm
            rescue Exception => e
                raise "Cannot clone VM Template to StoragePod: #{e.message}"
            end
        else

            begin
            vm = vc_template.CloneVM_Task(
                   :folder => vc_template.parent,
                   :name   => vcenter_name,
                   :spec   => clone_spec).wait_for_completion
            rescue Exception => e

                if !e.message.start_with?('DuplicateName')
                    raise "Cannot clone VM Template: #{e.message}"
                end

                vm = connection.find_vm(vcenter_name)

                raise "Cannot clone VM Template" if vm.nil?

                vm.Destroy_Task.wait_for_completion
                vm = vc_template.CloneVM_Task(
                    :folder => vc_template.parent,
                    :name   => vcenter_name,
                    :spec   => clone_spec).wait_for_completion
            end

        end

        reconfigure_vm(vm, xml, true, hostname)

        # Power on the VM
        vm.PowerOnVM_Task.wait_for_completion

        # Set to yes the running flag

        config_array = [{:key=>"opennebula.vm.running",:value=>"yes"}]
        spec         = RbVmomi::VIM.VirtualMachineConfigSpec(
                                                 {:extraConfig =>config_array})

        vm.ReconfigVM_Task(:spec => spec).wait_for_completion

        return vm.config.uuid
    end

    ########################################################################
    # Reconfigures a VM with new deployment description
    ########################################################################
    def self.reconfigure_vm(vm, xml, newvm, hostname)
        vm_uuid     = vm.config.uuid
        vmid        = xml.root.elements["/VM/ID"].text
        context     = xml.root.elements["/VM/TEMPLATE/CONTEXT"]

        token = vm.config.extraConfig.select do |val|
            val[:key] == "opennebula.token"
        end

        if token && !token.empty?
            token = token.first[:value]
        else
            token = nil
        end

        # Add VMID to VM's extraConfig

        config_array = [{:key=>"opennebula.vm.id",:value=>vmid}]

        # VNC Section

        vnc_port   = xml.root.elements["/VM/TEMPLATE/GRAPHICS/PORT"]
        vnc_listen = xml.root.elements["/VM/TEMPLATE/GRAPHICS/LISTEN"]
        vnc_keymap = xml.root.elements["/VM/TEMPLATE/GRAPHICS/KEYMAP"]

        if !vnc_listen
            vnc_listen = "0.0.0.0"
        else
            vnc_listen = vnc_listen.text
        end

        context_vnc_spec = {}

        if vnc_port
            config_array +=
                     [{:key=>"remotedisplay.vnc.enabled",:value=>"TRUE"},
                      {:key=>"remotedisplay.vnc.port",   :value=>vnc_port.text},
                      {:key=>"remotedisplay.vnc.ip",     :value=>vnc_listen}]
        end

        config_array += [{:key=>"remotedisplay.vnc.keymap",
                          :value=>vnc_keymap.text}] if vnc_keymap

        # Context section

        if context
            context_text = create_context(context)

            # OneGate
            onegate_token_flag = xml.root.elements["/VM/TEMPLATE/CONTEXT/TOKEN"]

            if onegate_token_flag and onegate_token_flag.text == "YES"
                if token
                    onegate_token_64 = token
                else
                    # Create the OneGate token string
                    vmid_str  = xml.root.elements["/VM/ID"].text
                    stime_str = xml.root.elements["/VM/STIME"].text
                    str_to_encrypt = "#{vmid_str}:#{stime_str}"

                    user_id = xml.root.elements['//CREATED_BY'].text

                    if user_id.nil?
                        STDERR.puts {"VMID:#{vmid} CREATED_BY not present" \
                            " in the VM TEMPLATE"}
                        return nil
                    end

                    user = OpenNebula::User.new_with_id(user_id,
                                                        OpenNebula::Client.new)
                    rc   = user.info

                    if OpenNebula.is_error?(rc)
                        STDERR.puts {"VMID:#{vmid} user.info" \
                            " error: #{rc.message}"}
                        return nil
                    end

                    token_password = user['TEMPLATE/TOKEN_PASSWORD']

                    if token_password.nil?
                        STDERR.puts {"VMID:#{vmid} TOKEN_PASSWORD not present"\
                            " in the USER:#{user_id} TEMPLATE"}
                        return nil
                    end

                    cipher = OpenSSL::Cipher::Cipher.new("aes-256-cbc")
                    cipher.encrypt
                    cipher.key = token_password
                    onegate_token = cipher.update(str_to_encrypt)
                    onegate_token << cipher.final

                    onegate_token_64 = Base64.encode64(onegate_token).chop
                    config_array << {
                        :key    => 'opennebula.token',
                        :value  => onegate_token_64
                    }
                end

                context_text += "ONEGATE_TOKEN='#{onegate_token_64}'\n"
            end

            context_text = Base64.encode64(context_text.chop)

            config_array +=
                     [{:key=>"guestinfo.opennebula.context",
                       :value=>context_text}]
        end

        device_change = []

        # NIC section, build the reconfig hash

        nics     = xml.root.get_elements("/VM/TEMPLATE/NIC")

        # If the VM is not new, avoid readding NiCs
        if !newvm
            nic_array = []

            # Get MACs from NICs inside VM template
            one_mac_addresses = Array.new
            nics.each{|nic|
                one_mac_addresses << nic.elements["MAC"].text
            }

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
                   }

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

        if !nics.nil?
            nic_array = []
            nics.each{|nic|
               mac    = nic.elements["MAC"].text
               bridge = nic.elements["BRIDGE"].text
               model  = nic.elements["MODEL"] ? nic.elements["MODEL"].text : nil
               limit_in  = nic.elements["INBOUND_PEAK_BW"] ? nic.elements["INBOUND_PEAK_BW"].text : ""
               limit_out = nic.elements["OUTBOUND_PEAK_BW"] ? nic.elements["OUTBOUND_PEAK_BW"].text : ""
               limit     = nil
               if !limit_in.empty? or !limit_out.empty?
                  limit=([limit_in.to_i, limit_out.to_i].min / 1024) * 8
               end
               rsrv_in  = nic.elements["INBOUND_AVG_BW"] ? nic.elements["INBOUND_AVG_BW"].text : ""
               rsrv_out = nic.elements["OUTBOUND_AVG_BW"] ? nic.elements["OUTBOUND_AVG_BW"].text : ""
               rsrv     = nil
               if !rsrv_in.empty? or !rsrv_out.empty?
                  rsrv=([rsrv_in.to_i, rsrv_out.to_i].min / 1024) * 8
               end
               nic_array << calculate_addnic_spec(vm,
                                                  mac,
                                                  bridge,
                                                  model,
                                                  limit,
                                                  rsrv)
            }

            device_change += nic_array
        end

        # DISK section, build the reconfig hash

        disks     = xml.root.get_elements("/VM/TEMPLATE/DISK")
        disk_spec = {}

        # If the VM is not new, avoid reading DISKS
        if !newvm
            vm.config.hardware.device.select { |d|
                if is_disk?(d)
                   disks.each{|disk|
                      if d.backing.respond_to?(:fileName) &&
                         disk.elements["SOURCE"].text == d.backing.fileName &&
                         disks.delete(disk)
                      end
                   }
                end
            }
        end

        if !disks.nil?
            disk_array = []
            hid         = VIClient::translate_hostname(hostname)
            connection  = VIClient.new(hid)

            position    = 0
            disks.each{|disk|
                ds_name    = disk.elements["VCENTER_NAME"].text
                img_name   = get_disk_img_path(disk, vmid)
                type_str   = disk.elements["TYPE"].text

                disk_array += attach_disk("", "", ds_name, img_name, type_str, 0, vm, connection, position)[:deviceChange]
                position += 1
            }

            device_change += disk_array
        end

        # Capacity section

        cpu           = xml.root.elements["/VM/TEMPLATE/VCPU"] ? xml.root.elements["/VM/TEMPLATE/VCPU"].text : 1
        memory        = xml.root.elements["/VM/TEMPLATE/MEMORY"].text
        capacity_spec = {:numCPUs  => cpu.to_i,
                         :memoryMB => memory }

        # Perform the VM reconfiguration
        if config_array != []
            context_vnc_spec = {:extraConfig =>config_array}
        end

        spec_hash = context_vnc_spec.merge(capacity_spec)
        if device_change.length > 0
            spec_hash.merge!({ :deviceChange => device_change })
        end

        spec = RbVmomi::VIM.VirtualMachineConfigSpec(spec_hash)

        vm.ReconfigVM_Task(:spec => spec).wait_for_completion
    end

    ############################################################################
    # Attach disk to a VM
    # @params hostname[String] vcenter cluster name in opennebula as host
    # @params deploy_id[String] deploy id of the vm
    # @params ds_name[String] name of the datastore
    # @params img_name[String] path of the image
    # @params size_kb[String] size in kb of the disk
    # @params vm[RbVmomi::VIM::VirtualMachine] VM if called from instance
    # @params connection[ViClient::connectoon] connection if called from instance
    # @params position The number of disks to attach. Starts with 0.
    ############################################################################
    def self.attach_disk(hostname, deploy_id, ds_name, img_name, type, size_kb, vm=nil, connection=nil, position=0)
        only_return = true
        if !vm
            hid         = VIClient::translate_hostname(hostname)
            connection  = VIClient.new(hid)

            vm          = connection.find_vm_template(deploy_id)
            only_return = false
        end

        # Find datastore within datacenter
        datastores = VIClient.get_entities(connection.dc.datastoreFolder,
                                           'Datastore')

        storage_pods = VIClient.get_entities(connection.dc.datastoreFolder,
                                            'StoragePod')
        storage_pods.each { |sp|
            storage_pod_datastores = VIClient.get_entities(sp, 'Datastore')
            if not storage_pod_datastores.empty?
                datastores.concat(storage_pod_datastores)
            end
        }

        ds = datastores.select{|ds| ds.name == ds_name}[0]

        controller, new_number = find_free_controller(vm, position)

        if type == "CDROM"
            vmdk_backing = RbVmomi::VIM::VirtualCdromIsoBackingInfo(
                  :datastore => ds,
                  :fileName  => "[#{ds_name}] #{img_name}"
            )

            cd = vm.config.hardware.device.select {|hw|
                                 hw.class == RbVmomi::VIM::VirtualCdrom}.first

            # If no CDROM drive present, we need to add it
            if !cd
                controller, new_unit_number = find_free_controller(vm)
                cdrom_drive_spec = RbVmomi::VIM.VirtualMachineConfigSpec(
                  :deviceChange => [{
                    :operation => :add,
                    :device => RbVmomi::VIM::VirtualCdrom(
                      :backing => vmdk_backing,
                      :key => -1,
                      :controllerKey => 15000,
                      :unitNumber => 0,
                      :connectable => RbVmomi::VIM::VirtualDeviceConnectInfo(
                        :startConnected => true,
                        :connected => true,
                        :allowGuestControl => true
                      )
                   )}]
                )

                vm.ReconfigVM_Task(:spec =>
                                       cdrom_drive_spec).wait_for_completion

                return
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
                device_config_spec = RbVmomi::VIM::VirtualDeviceConfigSpec(
                   :device    => device,
                   :operation => RbVmomi::VIM::VirtualDeviceConfigSpecOperation('edit')
                )
            end
        else
            vmdk_backing = RbVmomi::VIM::VirtualDiskFlatVer2BackingInfo(
                  :datastore => ds,
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

            device_config_spec = RbVmomi::VIM::VirtualDeviceConfigSpec(
               :device    => device,
               :operation => RbVmomi::VIM::VirtualDeviceConfigSpecOperation('add')
            )
        end

        vm_config_spec = RbVmomi::VIM::VirtualMachineConfigSpec(
          :deviceChange => [device_config_spec]
        )

        return vm_config_spec if only_return

        vm.ReconfigVM_Task(:spec => vm_config_spec).wait_for_completion
    end

    def self.find_free_controller(vm, position=0)
        free_scsi_controllers = Array.new
        available_controller  = nil
        scsi_schema           = Hash.new

        used_numbers      =  Array.new
        available_numbers =  Array.new

        vm.config.hardware.device.each{ |dev|
          if dev.is_a? RbVmomi::VIM::VirtualSCSIController
            if scsi_schema[dev.controllerKey].nil?
              scsi_schema[dev.key] = Hash.new
              scsi_schema[dev.key][:lower] = Array.new
            end
            used_numbers << dev.scsiCtlrUnitNumber
            scsi_schema[dev.key][:device] = dev
          end

          next if dev.class != RbVmomi::VIM::VirtualDisk
          used_numbers << dev.unitNumber
        }

        15.times{ |scsi_id|
          available_numbers << scsi_id if used_numbers.grep(scsi_id).length <= 0
        }

        scsi_schema.keys.each{|controller|
          if scsi_schema[controller][:lower].length < 15
            free_scsi_controllers << scsi_schema[controller][:device].deviceInfo.label
          end
        }

        if free_scsi_controllers.length > 0
            available_controller_label = free_scsi_controllers[0]
        else
            add_new_scsi(vm, scsi_schema)
            return find_free_controller(vm)
        end

        controller = nil

        vm.config.hardware.device.each { |device|
          (controller = device ; break) if device.deviceInfo.label == available_controller_label
        }

        new_unit_number =  available_numbers.sort[position]

        return controller, new_unit_number
    end

    def self.add_new_scsi(vm, scsi_schema)
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
          :key => scsi_key,
          :busNumber => scsi_number,
          :sharedBus => :noSharing
        )

        device_config_spec = RbVmomi::VIM::VirtualDeviceConfigSpec(
          :device => controller_device,
          :operation => RbVmomi::VIM::VirtualDeviceConfigSpecOperation('add')
        )

        vm_config_spec = RbVmomi::VIM::VirtualMachineConfigSpec(
          :deviceChange => [device_config_spec]
        )

        vm.ReconfigVM_Task(:spec => vm_config_spec).wait_for_completion

        vm.config.hardware.device.each { |device|
          if device.class == RbVmomi::VIM::VirtualLsiLogicController &&
             device.key == scsi_key
               controller = device.deviceInfo.label
          end
        }

        return controller
    end

    ############################################################################
    # Detach a specific disk from a VM
    # @params hostname[String] vcenter cluster name in opennebula as host
    # @params deploy_id[String] deploy id of the vm
    # @params ds_name[String] name of the datastore
    # @params img_path[String] path of the image
    ############################################################################
    def self.detach_disk(hostname, deploy_id, ds_name, img_path)
        hid         = VIClient::translate_hostname(hostname)
        connection  = VIClient.new(hid)

        vm          = connection.find_vm_template(deploy_id)

        ds_and_img_name = "[#{ds_name}] #{img_path}"

        disk  = vm.config.hardware.device.select { |d| is_disk?(d) &&
                                 d.backing.respond_to?(:fileName) &&
                                 d.backing.fileName == ds_and_img_name }

        raise "Disk #{img_path} not found." if disk.nil?

        spec = { :deviceChange => [{
                  :operation => :remove,
                  :device => disk[0]
               }]}

        vm.ReconfigVM_Task(:spec => spec).wait_for_completion
    end

    ############################################################################
    # Detach all disks from a VM
    # @params vm[VCenterVm] vCenter VM
    ############################################################################
    def self.detach_all_disks(vm)
        disks  = vm.config.hardware.device.select { |d| is_disk?(d) }

        return if disks.nil?

        spec = { :deviceChange => [] }

        disks.each{|disk|
            spec[:deviceChange] <<  {
                :operation => :remove,
                :device => disk
            }
        }

        vm.ReconfigVM_Task(:spec => spec).wait_for_completion
    end

    def self.create_context(context)
        # Remove <CONTEXT> (9) and </CONTEXT>\n (11)
        context_text = "# Context variables generated by OpenNebula\n"
        context.elements.each{|context_element|
            next if !context_element.text
            context_text += context_element.name + "='" +
                            context_element.text.gsub("'", "\\'") + "'\n"
        }
        context_text
    end

    ############################################################################
    # Detach attached disks from a VM
    ############################################################################
    def self.detach_attached_disks(vm, disks, hostname)
        hid         = VIClient::translate_hostname(hostname)
        connection  = VIClient.new(hid)

        vmid =  vm.config.extraConfig.select do |val|
                    val[:key] == "opennebula.vm.id"
                end.first.value

        spec = { :deviceChange => [] }

        disks.each{ |disk|
            img_name = get_disk_img_path(disk, vmid)
            ds_and_img_name = "[#{disk['VCENTER_NAME']}] #{img_name}"

            vcenter_disk = vm.config.hardware.device.select { |d| is_disk?(d) &&
                                    d.backing.respond_to?(:fileName) &&
                                    d.backing.fileName == ds_and_img_name }[0]
            spec[:deviceChange] <<  {
                :operation => :remove,
                :device => vcenter_disk
            }
        }

        vm.ReconfigVM_Task(:spec => spec).wait_for_completion
    end


    ############################################################################
    # Returns the source path of a disk. It will use the 'SOURCE' path if
    # persistent and one-#{vm_id}-#{disk_id}.vmdk otherwise
    # @param disks VM attached disks, either an REXML document, or a hash
    # @param vmid The VM ID
    ############################################################################
    def self.get_disk_img_path(disk, vmid)
        if disk.respond_to? :elements
            # It's a REXML::Document, probably coming from self.reconfigure_vm
            persistent = disk.elements["PERSISTENT"].text == "YES" rescue false

            if persistent
                disk.elements["SOURCE"].text
            else
                disk_id = disk.elements["DISK_ID"].text
                "one_#{vmid}_#{disk_id}.vmdk"
            end
        else
            # It's a hash, probably coming from self.detach_attached_disks
            persistent = disk["PERSISTENT"] == "YES"

            if persistent
                disk["SOURCE"]
            else
                disk_id = disk["DISK_ID"]
                "one_#{vmid}_#{disk_id}.vmdk"
            end
        end
    end

end
end
