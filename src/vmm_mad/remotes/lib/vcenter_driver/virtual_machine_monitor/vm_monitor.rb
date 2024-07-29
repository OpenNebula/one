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
module VirtualMachineMonitor

    POLL_ATTRIBUTE = OpenNebula::VirtualMachine::Driver::POLL_ATTRIBUTE
    VM_STATE = OpenNebula::VirtualMachine::Driver::VM_STATE

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

    # monitor function used when poll action is called for all vms
    def monitor(stats)
        reset_monitor

        refresh_rate = 20 # 20 seconds between samples (realtime)

        @state = state_to_c(@vm_info['summary.runtime.powerState'])

        return if @state != VM_STATE[:active]

        cpuMhz =  @vm_info[:esx_host_cpu]

        @monitor[:used_memory] = @vm_info['summary.quickStats.hostMemoryUsage']
                                 .to_i * 1024

        used_cpu = @vm_info['summary.quickStats.overallCpuUsage'].to_f / cpuMhz
        used_cpu = (used_cpu * 100).to_s
        @monitor[:used_cpu] = format('%.2f', used_cpu).to_s

        # Check for negative values
        @monitor[:used_memory] = 0 if @monitor[:used_memory].to_i < 0
        @monitor[:used_cpu]    = 0 if @monitor[:used_cpu].to_i < 0

        guest_ip_addresses = []
        unless self['guest.net'].empty?
            @vm_info['guest.net'].each do |net|
                next unless net.ipConfig
                next if net.ipConfig.ipAddress.empty?

                net.ipConfig.ipAddress.each do |ip|
                    guest_ip_addresses << ip.ipAddress
                end
            end
        end

        @guest_ip_addresses = guest_ip_addresses.join(',')

        if stats.key?(@item)
            metrics = stats[@item][:metrics]

            nettx_kbpersec = 0
            if metrics['net.transmitted']
                metrics['net.transmitted'].each do |sample|
                    nettx_kbpersec += sample if sample > 0
                end
            end

            netrx_kbpersec = 0
            if metrics['net.bytesRx']
                metrics['net.bytesRx'].each do |sample|
                    netrx_kbpersec += sample if sample > 0
                end
            end

            read_kbpersec = 0
            if metrics['virtualDisk.read']
                metrics['virtualDisk.read'].each do |sample|
                    read_kbpersec += sample if sample > 0
                end
            end

            read_iops = 0
            if metrics['virtualDisk.numberReadAveraged']
                metrics['virtualDisk.numberReadAveraged'].each do |sample|
                    read_iops += sample if sample > 0
                end
            end

            write_kbpersec = 0
            if metrics['virtualDisk.write']
                metrics['virtualDisk.write'].each do |sample|
                    write_kbpersec += sample if sample > 0
                end
            end

            write_iops = 0
            if metrics['virtualDisk.numberWriteAveraged']
                metrics['virtualDisk.numberWriteAveraged'].each do |sample|
                    write_iops += sample if sample > 0
                end
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
        if @one_item && @one_item['MONITORING/NETTX']
            previous_nettx = @one_item['MONITORING/NETTX'].to_i
        else
            previous_nettx = 0
        end

        if @one_item && @one_item['MONITORING/NETRX']
            previous_netrx = @one_item['MONITORING/NETRX'].to_i
        else
            previous_netrx = 0
        end

        if @one_item && @one_item['MONITORING/DISKRDIOPS']
            previous_diskrdiops = @one_item['MONITORING/DISKRDIOPS'].to_i
        else
            previous_diskrdiops = 0
        end

        if @one_item && @one_item['MONITORING/DISKWRIOPS']
            previous_diskwriops = @one_item['MONITORING/DISKWRIOPS'].to_i
        else
            previous_diskwriops = 0
        end

        if @one_item && @one_item['MONITORING/DISKRDBYTES']
            previous_diskrdbytes = @one_item['MONITORING/DISKRDBYTES'].to_i
        else
            previous_diskrdbytes = 0
        end

        if @one_item && @one_item['MONITORING/DISKWRBYTES']
            previous_diskwrbytes = @one_item['MONITORING/DISKWRBYTES'].to_i
        else
            previous_diskwrbytes = 0
        end

        @monitor[:nettx] = previous_nettx +
                           (nettx_kbpersec * 1024 * refresh_rate).to_i
        @monitor[:netrx] = previous_netrx +
                           (netrx_kbpersec * 1024 * refresh_rate).to_i

        @monitor[:diskrdiops]  = previous_diskrdiops + read_iops
        @monitor[:diskwriops]  = previous_diskwriops + write_iops
        @monitor[:diskrdbytes] = previous_diskrdbytes +
                                 (read_kbpersec * 1024 * refresh_rate).to_i
        @monitor[:diskwrbytes] = previous_diskwrbytes +
                                 (write_kbpersec * 1024 * refresh_rate).to_i
    end

    #  Generates a OpenNebula IM Driver valid string with the monitor info
    def info
        # return 'STATE=d' if @state == 'd'

        if @vm_info
            guest_ip = @vm_info['guest.ipAddress']
        else
            guest_ip = self['guest.ipAddress']
        end

        used_cpu    = @monitor[:used_cpu]
        used_memory = @monitor[:used_memory]
        netrx       = @monitor[:netrx]
        nettx       = @monitor[:nettx]
        diskrdbytes = @monitor[:diskrdbytes]
        diskwrbytes = @monitor[:diskwrbytes]
        diskrdiops  = @monitor[:diskrdiops]
        diskwriops  = @monitor[:diskwriops]

        if @vm_info
            esx_host = @vm_info[:esx_host_name].to_s
        else
            esx_host = self['runtime.host.name'].to_s
        end

        if @vm_info
            guest_state = @vm_info['guest.guestState'].to_s
        else
            guest_state = self['guest.guestState'].to_s
        end

        if @vm_info
            vmware_tools = @vm_info['guest.toolsRunningStatus'].to_s
        else
            vmware_tools = self['guest.toolsRunningStatus'].to_s
        end

        if @vm_info
            vm_name = @vm_info['name'].to_s
        else
            vm_name = self['name'].to_s
        end

        if @vm_info
            vmtools_ver = @vm_info['guest.toolsVersion'].to_s
        else
            vmtools_ver = self['guest.toolsVersion'].to_s
        end

        if @vm_info
            vmtools_verst = @vm_info['guest.toolsVersionStatus2'].to_s
        else
            vmtools_verst = self['guest.toolsVersionStatus2'].to_s
        end

        if @vm_info
            rp_name = @vm_info[:rp_list]
                      .select do |item|
                          item[:ref] == @vm_info['resourcePool']._ref
                      end
                      .first[:name] rescue ''

            rp_name = 'Resources' if rp_name.empty?
        else
            rp_name = self['resourcePool'].name
        end

        str_info = ''

        str_info = 'GUEST_IP=' << guest_ip.to_s << "\n" if guest_ip

        if @guest_ip_addresses && !@guest_ip_addresses.empty?
            str_info << 'GUEST_IP_ADDRESSES="' << @guest_ip_addresses.to_s \
                     << '" '
        end

        str_info << "#{POLL_ATTRIBUTE[:cpu]}=" << used_cpu.to_s << "\n"
        str_info << "#{POLL_ATTRIBUTE[:memory]}=" << used_memory.to_s << "\n"
        str_info << "#{POLL_ATTRIBUTE[:netrx]}=" << netrx.to_s << "\n"
        str_info << "#{POLL_ATTRIBUTE[:nettx]}=" << nettx.to_s << "\n"

        str_info << 'DISKRDBYTES=' << diskrdbytes.to_s << "\n"
        str_info << 'DISKWRBYTES=' << diskwrbytes.to_s << "\n"
        str_info << 'DISKRDIOPS='  << diskrdiops.to_s  << "\n"
        str_info << 'DISKWRIOPS='  << diskwriops.to_s  << "\n"

        str_info << 'VCENTER_ESX_HOST="' << esx_host << '" ' << "\n"
        str_info << 'VCENTER_GUEST_STATE=' << guest_state << "\n"
        str_info << 'VCENTER_VM_NAME="' << vm_name << '" ' << "\n"
        str_info << 'VCENTER_VMWARETOOLS_RUNNING_STATUS=' \
                 << vmware_tools << "\n"
        str_info << 'VCENTER_VMWARETOOLS_VERSION=' << vmtools_ver << "\n"
        str_info << 'VCENTER_VMWARETOOLS_VERSION_STATUS=' \
                 << vmtools_verst << "\n"
        str_info << 'VCENTER_RP_NAME="' << rp_name << '" ' << "\n"

        info_disks.each do |disk|
            next if disk[1].no_exists?

            # disk[0] contains the disk ID in OpenNebula or the disk path if
            #         there is no corresponding OpenNebula disk
            # disk[1] contains the vcenter resource corresponding to the VM disk

            # Delete special characters
            name = disk[0].gsub(/[^0-9A-Za-z]/, '_')

            str_info << "DISK_#{name}_ACTUAL_PATH=\"[" <<
                disk[1].ds.name << '] ' << disk[1].path << '" ' << "\n"
        end

        str_info
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
