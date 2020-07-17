#!/usr/bin/env ruby

# -------------------------------------------------------------------------- #
# Copyright 2002-2020, OpenNebula Project, OpenNebula Systems                #
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

$LOAD_PATH.unshift "#{File.dirname(__FILE__)}/../../vmm/lxd/"

require 'container'
require 'client'
require 'base64'
require 'socket'

module LXD

    CLIENT = LXDClient.new

    # LXD to OpenNebula state mapping
    STATE_MAP = {
        'RUNNING' => 'RUNNING',
        'FROZEN'  => 'PAUSED',
        'STOPPED' => 'POWEROFF',
        'FAILURE' => 'FAILURE',
        'POWEROFF'=> 'POWEROFF'
    }

    # High level abstraction entity for monitoring LXD containers
    class Domain

        attr_accessor :metrics, :lxc_path, :container, :id, :wild

        def initialize(container)
            @container = container

            @deploy_id = @container.name
            @uuid      = "#{@deploy_id}-#{Socket.gethostname}"

            if @deploy_id =~ /^one-\d+/
                @wild = false
                @id   = @container.name.split('-').last
            else
                @wild = true
                @id   = -1
            end

            cgroup = ENV['LXC_CGROUP_PREFIX']

            @lxc_path = 'lxc/' + container.name
            @lxc_path = "#{cgroup}#{@lxc_path}" if cgroup

            @metrics = {}
        end

        # Calculates and saves memory usage
        def usage_memory
            path = "/sys/fs/cgroup/memory/#{@lxc_path}/memory.usage_in_bytes"
            stat = File.read(path).to_i

            @metrics[:memory] = stat / 1024
        rescue StandardError
            @metrics[:memory] = 0
        end

        # Calculates and saves network usage
        def usage_network
            netrx = 0
            nettx = 0

            @container.monitor['metadata']['network'].each do |iface, val|
                next if iface == 'lo'

                netrx += val['counters']['bytes_received']
                nettx += val['counters']['bytes_sent']
            end

            @metrics[:netrx] = netrx
            @metrics[:nettx] = nettx
        rescue StandardError
            @metrics[:netrx] = 0
            @metrics[:nettx] = 0
        end

        # Calculates and cpu usage
        def usage_cpu
            DomainList.usage_cpu([self])
        end

        # LXD -> ONE status mapping
        def self.one_status(container)
            state = STATE_MAP[container.status.upcase]
            state ||= 'UNKNOWN'

            state
        rescue StandardError
            'UNKNOWN'
        end

        # Returns VM string in template
        def template_string
            string = template_string_header
            string << "MONITOR=\"#{xml_metrics}\"]\n"
        end

        # Returns VM string in template
        def wild_template_string
            string = template_string_header
            string << "VM_NAME=#{@deploy_id}, "

            template = Base64.encode64(import_template).delete("\n")

            string << "IMPORT_TEMPLATE=\"#{template}\"]\n"
        end

        # Encodes @metrics in ATTR="VALUE" format to Base64
        def xml_metrics
            string = ''

            @metrics.each do |key, value|
                string << "#{key.upcase}=\"#{value}\"\n"
            end

            Base64.encode64(string).delete("\n")
        end

        # Template string required for a wild container to be imported into one
        def import_template
            arch     = @container.architecture
            capacity = @container.expanded_config

            cpu  = ''
            vcpu = ''
            mem  = ''

            if capacity
                cpu  = capacity['limits.cpu.allowance']
                vcpu = capacity['limits.cpu']
                mem  = capacity['limits.memory']
            end

            cpu  = '50%'  if !cpu || cpu.empty?
            vcpu = '1'    if !vcpu || vcpu.empty?
            mem  = '512MB' if !mem || mem.empty?

            cpu = cpu.chomp('%').to_f / 100
            mem = parse_memory(mem)

            <<-EOT
                NAME   = "#{@deploy_id}"
                CPU    = #{cpu}
                VCPU   = #{vcpu}
                MEMORY = #{mem}
                IMPORT_STATE = #{self.class.one_status(@container)}
                HYPERVISOR = "lxd"
                DEPLOY_ID  = "#{@deploy_id}"
                OS = [ ARCH="#{arch}" ]
            EOT
        end

        private

        def template_string_header
            "VM = [ ID=#{@id}, DEPLOY_ID=#{@deploy_id}, "
        end

        def parse_memory(memory)
            mem_suffix = memory[-2..-1]
            memory = memory[0..-3].to_i # remove sufix

            case mem_suffix[-2..-1]
            when 'GB'
                memory *= 1024
            when 'TB'
                memory *= 1024**2
            end
            memory
        end

    end

end

# ------------------------------------------------------------------------------
# This module includes function to get the list of LXC domains
# ------------------------------------------------------------------------------
module DomainList

    attr_accessor :domains

    def self.info
        containers = Container.get_all(LXD::CLIENT)

        return '' if containers.empty?

        domains = []

        containers.each do |container|
            domain = LXD::Domain.new(container)

            next unless container.status.casecmp('running').zero?

            domain.usage_memory
            domain.usage_network

            domains.push(domain)
        end

        return '' if domains.empty?

        usage_cpu(domains)

        string = ''

        domains.each do |domain|
            string << domain.template_string
        end

        string
    end

    def self.wilds_info
        import_templates = ''

        Container.get_all(LXD::CLIENT).each do |container|
            domain = LXD::Domain.new(container)

            next unless domain.wild

            import_templates << domain.wild_template_string
        end

        import_templates
    end

    def self.usage_cpu(domains)
        multiplier = `grep -c processor /proc/cpuinfo`.to_i * 100

        cpuj0 = Jiffies.cpu

        domains.each {|domain| domain.metrics[:cpu] = Jiffies.process(domain) }

        sleep 1 # measure diff
        cpuj1 = Jiffies.cpu - cpuj0

        domains.each do |domain|
            cpu0 = domain.metrics[:cpu]
            cpu1 = (Jiffies.process(domain) - cpu0) / cpuj1

            domain.metrics[:cpu] = (cpu1 * multiplier).round(2)
        end
    end

    # --------------------------------------------------------------------------
    # Compute process and total system jiffies
    # --------------------------------------------------------------------------
    module Jiffies

        def self.process(domain)
            jiffies = 0
            path = "/sys/fs/cgroup/cpu,cpuacct/#{domain.lxc_path}/cpuacct.stat"

            begin
                stat = File.read(path)
            rescue StandardError
                return 0
            end

            stat.lines.each {|line| jiffies += line.split(' ')[1].to_i }

            jiffies.to_f
        end

        def self.cpu
            begin
                stat = File.read('/proc/stat')
            rescue StandardError
                return 0
            end

            jiffies = 0

            # skip cpu string and guest jiffies
            stat.lines.first.split(' ')[1..-3].each do |num|
                jiffies += num.to_i
            end

            jiffies
        end

    end

end
