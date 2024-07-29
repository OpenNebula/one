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

#-------------------------------------------------------------------------------
#  This module gets the pid, memory and cpu usage of a set of process that
#  includes a -uuid argument (qemu-kvm vms).
#
#  Usage is computed based on the fraction of jiffies used by the process
#  relative to the system during AVERAGE_SECS (1s)
#-------------------------------------------------------------------------------
module ProcessList

    # list of process indexed by uuid, each entry:
    #    :pid
    #    :memory
    #    :cpu
    def self.process_list
        pids  = []
        procs = {}
        ps    = `ps auxwww`

        ps.each_line do |l|
            m = l.match(PS_REGEX)
            next unless m

            l = l.split(/\s+/)

            swap = `cat /proc/#{l[1]}/status 2>/dev/null | grep VmSwap`
            swap = swap.split[1] || 0

            procs[m[1]] = {
                :pid => l[1],
                :memory => l[5].to_i + swap.to_i
            }

            pids << l[1]
        end

        cpu = cpu_info(pids)

        procs.each {|_i, p| p[:cpu] = cpu[p[:pid]] || 0 }

        procs
    end

    # Get cpu usage in 100% for a set of PIDs
    #   param[Array] pids of the arrys to compute the CPU usage
    #   result[Array] array of cpu usage
    def self.cpu_info(pids)
        multiplier = Integer(`grep -c processor /proc/cpuinfo`) * 100

        cpu_ini = {}

        j_ini = jiffies

        pids.each do |pid|
            cpu_ini[pid] = proc_jiffies(pid).to_f
        end

        sleep AVERAGE_SECS

        cpu_j = jiffies - j_ini

        cpu = {}

        pids.each do |pid|
            cpu[pid] = (proc_jiffies(pid) - cpu_ini[pid]) / cpu_j
            cpu[pid] = (cpu[pid] * multiplier).round(2)
        end

        cpu
    end

    # CPU tics used in the system
    def self.jiffies
        stat = File.open('/proc/stat', 'r') {|f| f.readline }

        j = 0

        stat.split(' ')[1..-3].each {|num| j += num.to_i }

        j
    rescue StandardError
        0
    end

    # CPU tics used by a process
    def self.proc_jiffies(pid)
        stat = File.read("/proc/#{pid}/stat")

        j = 0

        data = stat.lines.first.split(' ')

        [13, 14, 15, 16].each {|col| j += data[col].to_i }

        j
    rescue StandardError
        0
    end

end
