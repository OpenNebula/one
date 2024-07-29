#!/usr/bin/env ruby

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

require 'English'

# Gathers compute and network resource information about the host
class LinuxHost

    ENV['LANG'] = 'C'
    ENV['LC_ALL'] = 'C'

    CPUINFO = 'lscpu | grep CPU'
    MEMINFO = 'cat /proc/meminfo | grep MemTotal'

    ######
    #  First, get all the posible info out of virsh
    #  TODO : use virsh freecell when available
    ######

    attr_accessor :cpu, :memory, :net, :cgversion

    def initialize
        cpuinfo = `#{CPUINFO}`

        exit(-1) if $CHILD_STATUS.exitstatus != 0

        @cpu = {}
        @memory = {}
        @net = {}

        cpuinfo.split(/\n/).each do |line|
            if line =~ /^CPU\(s\):/
                @cpu[:total] = line.split(':')[1].strip.to_i * 100
            elsif line =~ /^CPU MHz:/
                @cpu[:speed] = Float(line.split(':')[1].strip.split(' ')[0]).round
            end
        end

        meminfo = `#{MEMINFO}`
        @memory[:total] = meminfo.split(':')[1].strip.split(' ')[0]

        ######
        #  CPU
        ######
        vmstat = `vmstat 1 2`
        @cpu[:free] = @cpu[:total] * vmstat.split("\n").to_a.last.split[14].to_i / 100
        @cpu[:used] = @cpu[:total] - @cpu[:free]

        ######
        #  MEMORY
        ######
        memory = `cat /proc/meminfo`
        meminfo = {}
        memory.each_line do |line|
            key, value = line.split(':')
            meminfo[key] = /\d+/.match(value)[0].to_i
        end

        @memory[:total] = meminfo['MemTotal']

        @memory[:used] = meminfo['MemTotal'] - meminfo['MemFree'] - meminfo['Buffers'] - meminfo['Cached']
        @memory[:free] = @memory[:total] - @memory[:used]

        ######
        #  CGROUPS VERSION
        ######
        is_cg1 = !(`mount | grep "type cgroup ("`.empty?)
        is_cg2 = !(`mount | grep "type cgroup2 ("`.empty?)

        if is_cg1
            @cgversion="1"
        elsif is_cg2
            @cgversion="2"
        else
            @cgversion=""
        end

        ######
        #  INTERFACE
        ######

        netinterface = [
            'eth[0-9]+',
            'ib[0-9]+',

            # --- BIOS derived names:
            'em[0-9]+(_[0-9]+)?',
            'p[0-9]+p[0-9]+(_[0-9]+)?',

            # --- Systemd naming - type of names for en*:
            # o<index>[n<phys_port_name>|d<dev_port>] — on-board device index number
            # s<slot>[f<function>][n<phys_port_name>|d<dev_port>] — hotplug slot index number
            # x<MAC> — MAC address
            # [P<domain>]p<bus>s<slot>[f<function>][n<phys_port_name>|d<dev_port>] — PCI geographical location
            # a<vendor><model>i<instance> — Platform bus ACPI instance id
            'eno[0-9]+(n[0-9a-zA-Z]+|d[0-9]+)?',
            'ens[0-9]+(f[0-9]+)?(n[0-9a-zA-Z]+|d[0-9]+)?',
            'enx[0-9a-fA-F]{12}',
            'en(P[0-9]+)?p[0-9]+s[0-9]+(f[0-9]+)?(n[0-9a-zA-Z]+|d[0-9]+)?',
            'ena[0-9a-zA-Z]+i[0-9]+'
        ].join('|')

        net_text = `cat /proc/net/dev`
        exit(-1) if $CHILD_STATUS.exitstatus != 0

        @net[:rx] = 0
        @net[:tx] = 0

        net_text.split(/\n/).each do |line|
            next unless line =~ /^ *#{netinterface}/

            arr = line.split(':')[1].split(' ')
            @net[:rx] += arr[0].to_i
            @net[:tx] += arr[8].to_i
        end
    end

    def self.print_info(name, value)
        value = '0' if value.nil? || value.to_s.strip.empty?
        puts "#{name}=#{value}"
    end

    def self.usage(hypervisor)
        linux = new

        print_info('HYPERVISOR', hypervisor)

        print_info('USEDMEMORY', linux.memory[:used])
        print_info('FREEMEMORY', linux.memory[:free])

        print_info('FREECPU', linux.cpu[:free])
        print_info('USEDCPU', linux.cpu[:used])

        print_info('NETRX', linux.net[:rx])
        print_info('NETTX', linux.net[:tx])
    end

    def self.config(hypervisor)
        linux = new

        print_info('HYPERVISOR', hypervisor)

        print_info('TOTALCPU', linux.cpu[:total])
        print_info('CPUSPEED', linux.cpu[:speed])

        print_info('TOTALMEMORY', linux.memory[:total])
        print_info('CGROUPS_VERSION', linux.cgversion) unless linux.cgversion.empty?
    end

end
