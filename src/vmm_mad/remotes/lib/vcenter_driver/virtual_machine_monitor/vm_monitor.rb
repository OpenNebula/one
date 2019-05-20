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
module VirtualMachineMonitor
      # Converts the VI string state to OpenNebula state convention
      # Guest states are:
      # - poweredOff   The virtual machine is currently powered off.
      # - poweredOn    The virtual machine is currently powered on.
      # - suspended    The virtual machine is currently suspended.
      def state_to_c(state)
        case state
        when 'poweredOn'
            OpenNebula::VirtualMachine::Driver::VM_STATE[:active]
        when 'suspended'
            OpenNebula::VirtualMachine::Driver::VM_STATE[:paused]
        when 'poweredOff'
            OpenNebula::VirtualMachine::Driver::VM_STATE[:deleted]
        else
            OpenNebula::VirtualMachine::Driver::VM_STATE[:unknown]
        end
    end

    # monitor function used when VMM poll action is called
    def monitor_poll_vm
        reset_monitor

        @state = state_to_c(self["summary.runtime.powerState"])

        if @state != OpenNebula::VirtualMachine::Driver::VM_STATE[:active]
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

            if (self.one_item["MONITORING/LAST_MON"] && self.one_item["MONITORING/LAST_MON"].to_i != 0 )
                #Real time data stores max 1 hour. 1 minute has 3 samples
                interval = (Time.now.to_i - self.one_item["MONITORING/LAST_MON"].to_i)

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

        return if @state != OpenNebula::VirtualMachine::Driver::VM_STATE[:active]

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

        str_info << "#{OpenNebula::VirtualMachine::Driver::POLL_ATTRIBUTE[:state]}="  << @state               << " "
        str_info << "#{OpenNebula::VirtualMachine::Driver::POLL_ATTRIBUTE[:cpu]}="    << used_cpu.to_s        << " "
        str_info << "#{OpenNebula::VirtualMachine::Driver::POLL_ATTRIBUTE[:memory]}=" << used_memory.to_s     << " "
        str_info << "#{OpenNebula::VirtualMachine::Driver::POLL_ATTRIBUTE[:netrx]}="  << netrx.to_s           << " "
        str_info << "#{OpenNebula::VirtualMachine::Driver::POLL_ATTRIBUTE[:nettx]}="  << nettx.to_s           << " "

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

end
