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

# This class parses and wraps the information in the Driver action data
class OpenNebulaVM

    # rubocop:disable Naming/PredicateName
    # rubocop:disable Naming/AccessorMethodName

    attr_reader :vm_id, :vm_name, :sysds_path

    # share values default for cgroup versions
    DEFAULT_SHARES = {
        1 => {
            :base => 1024,
            :min  => 2,
            :max  => 262144
        },
        2 => {
            :base => 100,
            :min  => 1,
            :max  => 10000
        }
    }

    CGROUP_NAMES ={
        'cgroup' => {
            :cpu        => 'shares',
            :cores      => 'cpus',
            :nodes      => 'mems',
            :memory_max => 'limit_in_bytes',
            :memory_low => 'soft_limit_in_bytes',
            :swap       => 'memsw.limit_in_bytes',
            :oom        => 'oom_control'
        },
        'cgroup2' => {
            :cpu        => 'weight',
            :cores      => 'cpus',
            :nodes      => 'mems',
            :memory_max => 'max',
            :memory_low => 'low',
            :swap       => 'swap.max',
            :oom        => 'oom.group'

        }
    }

    #---------------------------------------------------------------------------
    # Class Constructor
    #---------------------------------------------------------------------------
    def initialize(xml, mad_conf)
        @xml = XMLElement.new_s(xml)
        @xml = @xml.element('//VM')

        @vm_id   = Integer(@xml['//TEMPLATE/VMID'])
        @vm_name = @xml['//DEPLOY_ID']
        @vm_name = "one-#{@vm_id}" if @vm_name.empty?

        if mad_conf[:datastore_location]
            sysds_id    = @xml['//HISTORY_RECORDS/HISTORY/DS_ID']
            @sysds_path = "#{mad_conf[:datastore_location]}/#{sysds_id}"
        end

        return if wild?

        # Sets the DISK ID of the root filesystem (LXC)
        disk = @xml.element('//TEMPLATE/DISK')

        return unless disk

        @rootfs_id = disk['DISK_ID']
        boot_order = @xml['//TEMPLATE/OS/BOOT']
        @rootfs_id = boot_order.split(',')[0][-1] unless boot_order.empty?
    end

    #---------------------------------------------------------------------------
    # Helpers
    #---------------------------------------------------------------------------

    def has_context?
        !@xml['//TEMPLATE/CONTEXT/DISK_ID'].empty?
    end

    # Returns cgroup version
    def get_cgroup_version
        return 1 unless `mount | grep "type cgroup ("`.empty?
        return 2 unless `mount | grep "type cgroup2 ("`.empty?

        0
    end

    def wild?
        @vm_name && !@vm_name.include?('one-')
    end

    def vnc?
        data = @xml.element('//TEMPLATE/GRAPHICS')
        data && data['TYPE'].casecmp('vnc').zero?
    end

    def get_cpu
        Float(@xml['//TEMPLATE/CPU'])
    end

    def get_nics
        @xml.elements('//TEMPLATE/NIC')
    end

    def get_disks
        @xml.elements('//TEMPLATE/DISK')
    end

    def get_numa_nodes
        @xml.elements('//TEMPLATE/NUMA_NODE')
    end

    def swap_limitable?
        if File.exist?('/sys/fs/cgroup/memory/memory.memsw.limit_in_bytes')
            return true
        end

        OpenNebula.log_warning('swap limiting via cgroups not supported')
    end

    def location
        "#{sysds_path}/#{vm_id}"
    end

    def disk_location(disk_id)
        datastore = @sysds_path
        datastore = File.readlink(@sysds_path) if File.symlink?(@sysds_path)
        "#{datastore}/#{@vm_id}/disk.#{disk_id}"
    end

    # Start/stop the svncterm server.
    def vnc(signal, command, options)
        command = vnc_command(signal, command)
        return if command.nil?

        w = options[:width]
        h = options[:height]
        t = options[:timeout]

        vnc_args = "-w #{w} -h #{h} -t #{t}"

        pipe = '/tmp/svncterm_server_pipe'
        bin  = 'svncterm_server'
        server = "#{bin} #{vnc_args}"

        rc, _o, e = Command.execute_once(server, true)

        unless [nil, 0].include?(rc)
            OpenNebula.log_error("#{__method__}: #{e}\nFailed to start vnc")
            return
        end

        lfd = Command.lock

        File.open(pipe, 'a') do |f|
            f.write command
        end
    ensure
        Command.unlock(lfd) if lfd
    end

    #---------------------------------------------------------------------------
    # Cgroups
    #---------------------------------------------------------------------------

    # Return the value for cpu.shares cgroup based on the value of CPU.
    #
    # cpu.shares
    # contains an integer value that specifies a relative share of CPU time
    # available to the tasks in a cgroup. For example, tasks in two
    # that have cpu.shares set to 100 will receive equal CPU time, but tasks
    # in a cgroup that has cpu.shares set to 200 receive twice the CPU time of
    # tasks in a cgroup where cpu.shares is set to 100. The value specified in
    # the cpu.shares file must be 2 or higher.
    # (https://access.redhat.com/documentation/en-us/red_hat_enterprise_linux/6/html/resource_management_guide/sec-cpu)
    def cpu_shares(version = 1)
        cpu = get_cpu

        b_shares = DEFAULT_SHARES[version][:base]

        min_shares = DEFAULT_SHARES[version][:min]
        max_shares = DEFAULT_SHARES[version][:max]

        return b_shares if cpu.nil? || cpu == ''

        shares_val = (cpu * b_shares).round

        # Keep shares in range
        shares_val = min_shares if shares_val < min_shares
        shares_val = max_shares if shares_val > max_shares

        shares_val
    end

    def get_memory
        @xml['//TEMPLATE/MEMORY']
    end

    # Return the value for memory.limit_in_bytes cgroup based on the value of
    # MEMORY.
    #
    # memory.limit_in_bytes
    # sets the maximum amount of user memory (including file cache). If no
    # units are specified, the value is interpreted as bytes. However, it
    # is possible to use suffixes to represent larger units - k or K for
    # kilobytes, m or M for megabytes, and g or G for gigabytes.
    # (https://access.redhat.com/documentation/en-us/red_hat_enterprise_linux/6/html/resource_management_guide/sec-memory)
    def limits_memory
        "#{get_memory}M"
    end

    def limits_memory_swap(hypervisor_attr)
        memory = get_memory.to_i
        swap = @xml["/VM/USER_TEMPLATE/#{hypervisor_attr}"].to_i

        "#{swap + memory}M"
    end

    private

    # Creates vnc connection
    # Creates or closes a connection to a vm rfb port depending on signal
    def vnc_command(signal, vnc_command)
        data = @xml.element('//TEMPLATE/GRAPHICS')
        return unless data && data['TYPE'].casecmp('vnc').zero?

        pass = data['PASSWD']
        pass = '-' if pass.empty?

        case signal
        when 'start'
            "#{data['PORT']} #{pass} #{vnc_command} #{@vm_name}\n"
        when 'stop'
            "-#{data['PORT']}\n"
        end
    end

    # rubocop:enable Naming/PredicateName
    # rubocop:enable Naming/AccessorMethodName

end
