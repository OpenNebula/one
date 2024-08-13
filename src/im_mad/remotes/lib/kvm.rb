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

require 'open3'
require 'base64'
require 'json'
require 'yaml'
require 'rexml/document'

require_relative 'process_list'
require_relative 'domain'

ENV['LANG'] = 'C'
ENV['LC_ALL'] = 'C'

#-------------------------------------------------------------------------------
#  KVM Monitor Module. This module provides basic functionality to execute
#  virsh commands and load KVM configuration in remotes/etc/vmm/kvm/kvmrc
#
#  The load_conf should be called before executing virsh commands
#-------------------------------------------------------------------------------
module KVM

    # Constants for KVM virsh commands
    CONF = {
        :dominfo  => 'virsh --connect LIBVIRT_URI --readonly dominfo',
        :domstate => 'virsh --connect LIBVIRT_URI --readonly domstate',
        :list     => 'virsh --connect LIBVIRT_URI --readonly list',
        :dumpxml  => 'virsh --connect LIBVIRT_URI --readonly dumpxml',
        :domstats => 'virsh --connect LIBVIRT_URI --readonly domstats',
        :qemuga   => 'virsh --connect LIBVIRT_URI qemu-agent-command',
        :top      => 'top -b -d2 -n 2 -p ',
        'LIBVIRT_URI' => 'qemu:///system'
    }

    QEMU_GA = {
        :enabled => false,
        :commands => {
            :vm_qemu_ping => "one-$vm_id \'{\"execute\":\"guest-ping\"}\'"
        }
    }

    # Variables to read from kvmrc
    CONF_VARS = ['LIBVIRT_URI']

    # Execute a virsh command using the predefined command strings and URI
    # @param command [Symbol] as defined in the module CONF constant
    def self.virsh(command, arguments)
        cmd = CONF[command].gsub('LIBVIRT_URI', CONF['LIBVIRT_URI'])

        Open3.capture3("#{cmd} #{arguments}")
    end

    # Loads the rc variables and overrides the default values
    def self.load_conf
        file = "#{__dir__}/../../etc/vmm/kvm/kvmrc"

        env   = `. "#{file}"; env`
        lines = env.split("\n")

        CONF_VARS.each do |var|
            lines.each do |line|
                if (a = line.match(/^(#{var})=(.*)$/))
                    CONF[var] = a[2]
                    break
                end
            end
        end

        ga_conf_path = "#{__dir__}/../../etc/im/kvm-probes.d/guestagent.conf"
        QEMU_GA.merge!(YAML.load_file(ga_conf_path))
    rescue StandardError
    end

end

#-------------------------------------------------------------------------------
#  Extends ProcessList module defined at process_list.rb
#-------------------------------------------------------------------------------
module ProcessList

    #  Number of seconds to average process usage
    AVERAGE_SECS = 1

    # Regex used to retrieve VMs process info
    PS_REGEX = /-uuid ([a-z0-9\-]+) /

    def self.retrieve_names
        text, _e, s = KVM.virsh(:list, '')

        if s.exitstatus != 0
            raise 'Error retrieving names. Check Libvirtd service is up.'
        end

        lines = text.split("\n")[2..-1]

        # rubocop:disable Style/RedundantAssignment
        names = lines.map do |line|
            line.split(/\s+/).delete_if {|d| d.empty? }[1]
        end
        # rubocop:enable Style/RedundantAssignment

        names
    end

end

#-------------------------------------------------------------------------------
#  This class represents a qemu domain, information includes:
#    @vm[:name]
#    @vm[:id] from one-<id>, -1 if wild
#    @vm[:uuid]
#    @vm[:deploy_id]
#    @vm[:kvm_state] KVM-qemu state
#    @vm[:reason] reason for state transition
#    @vm[:state] OpenNebula state
#    @vm[:netrx]
#    @vm[:nettx]
#    @vm[:diskrdbytes]
#    @vm[:diskwrbytes]
#    @vm[:diskrdiops]
#    @vm[:diskwriops]
#    @vm[ga_info] quemu guest agent information. symbols are dynamic based on guestagent.conf
#
#  This class uses the KVM and ProcessList interface
#-------------------------------------------------------------------------------
class Domain < BaseDomain

    # Gets the information of the domain, fills the @vm hash using ProcessList
    # and virsh dominfo
    def info
        text, _e, s = KVM.virsh(:dominfo, @name)

        return -1 if s.exitstatus != 0

        lines = text.split("\n")
        hash  = {}

        lines.map do |line|
            parts = line.split(/:\s+/)
            hash[parts[0].upcase] = parts[1]
        end

        @vm[:name] = hash['NAME']
        @vm[:uuid] = hash['UUID']

        @vm[:deploy_id] = hash['UUID']

        m = @vm[:name].match(/^one-(\d*)$/)

        if m
            @vm[:id] = m[1]
        else
            @vm[:id] = -1
        end

        return if @vm[:id] == -1 # Skip wild VMs

        @vm[:kvm_state] = hash['STATE']

        # Domain state

        state  = 'UNKNOWN'
        reason = 'missing'

        if hash['STATE'] == 'paused'
            text, _e, s = KVM.virsh(:domstate, "#{@name} --reason")

            if s.exitstatus == 0
                text =~ /^[^ ]+ \(([^)]+)\)/
                reason = Regexp.last_match(1) || 'missing'
            end

            state = STATE_MAP['paused'][reason] || 'UNKNOWN'
        else
            state = STATE_MAP[hash['STATE']] || 'UNKNOWN'
        end

        @vm[:state]  = state
        @vm[:reason] = reason

        ga_stats
        io_stats
    end

    # Convert the output of dumpxml for this domain to an OpenNebula template
    # that can be imported. This method is for wild VMs.
    #
    #   @return [String] OpenNebula template encoded in base64
    def to_one
        xml, _e, s = KVM.virsh(:dumpxml, @name)
        return '' if s.exitstatus != 0

        doc = REXML::Document.new(xml)

        name = REXML::XPath.first(doc, '/domain/name').text
        uuid = REXML::XPath.first(doc, '/domain/uuid').text
        vcpu = REXML::XPath.first(doc, '/domain/vcpu').text
        mem  = REXML::XPath.first(doc, '/domain/memory').text.to_i / 1024
        arch = REXML::XPath.first(doc, '/domain/os/type').attributes['arch']

        spice = REXML::XPath.first(doc,
                                   "/domain/devices/graphics[@type='spice']")
        spice = spice.attributes['port'] if spice

        spice_txt = ''
        spice_txt = %(GRAPHICS = [ TYPE="spice", PORT="#{spice}" ]) if spice

        vnc = REXML::XPath.first(doc, "/domain/devices/graphics[@type='vnc']")
        vnc = vnc.attributes['port'] if vnc

        vnc_txt = ''
        vnc_txt = %(GRAPHICS = [ TYPE="vnc", PORT="#{vnc}" ]) if vnc

        features = []
        ['acpi', 'apic', 'pae'].each do |feature|
            if REXML::XPath.first(doc, "/domain/features/#{feature}")
                features << feature
            end
        end

        feat = []
        features.each do |feature|
            feat << %(  #{feature.upcase}="yes")
        end

        features_txt = ''
        features_txt = "FEATURES=[#{feat.join(', ')}]" unless feat.empty?

        tmpl =  "NAME=\"#{name}\"\n"
        tmpl << "CPU=#{vcpu}\n"
        tmpl << "VCPU=#{vcpu}\n"
        tmpl << "MEMORY=#{mem}\n"
        tmpl << "HYPERVISOR=\"kvm\"\n"
        tmpl << "DEPLOY_ID=\"#{uuid}\"\n"
        tmpl << "OS=[ARCH=\"#{arch}\"]\n"
        tmpl << features_txt << "\n" unless features_txt.empty?
        tmpl << spice_txt << "\n" unless spice_txt.empty?
        tmpl << vnc_txt << "\n" unless vnc_txt.empty?

        tmpl
    rescue StandardError
        ''
    end

    def to_monitor
        KVM::QEMU_GA[:commands].each_key do |ga_info|
            MONITOR_KEYS << ga_info
        end

        super
    end

    private

    # --------------------------------------------------------------------------
    # Libvirt states for the guest are
    #  * 'running' state refers to guests which are currently active on a CPU.
    #  * 'idle' ('blocked') not running or runnable (waiting on I/O or sleeping)
    #  * 'paused' after virsh suspend.
    #  * 'in shutdown' ('shutdown') guest in the process of shutting down.
    #  * 'dying' the domain has not completely shutdown or crashed.
    #  * 'crashed' guests have failed while running and are no longer running.
    #  * 'pmsuspended' suspended by guest power management (e.g. S3 state)
    # --------------------------------------------------------------------------
    STATE_MAP = {
        'running'     => 'RUNNING',
        'idle'        => 'RUNNING',
        'blocked'     => 'RUNNING',
        'in shutdown' => 'RUNNING',
        'shutdown'    => 'RUNNING',
        'dying'       => 'RUNNING',
        'crashed'     => 'FAILURE',
        'pmsuspended' => 'SUSPENDED',
        'paused' => {
            'migrating' => 'RUNNING',
            'saving'    => 'RUNNING',
            'starting up' => 'RUNNING',
            'booted'    => 'RUNNING',
            'I/O error' => 'FAILURE',
            'watchdog'  => 'FAILURE',
            'crashed'   => 'FAILURE',
            'post-copy failed' => 'FAILURE',
            'unknown'   => 'FAILURE',
            'user'      => 'SUSPENDED'
        }
    }

    # List of domain state reasons (for RUNNING) when to skip I/O monitoring
    REASONS_SKIP_IO = ['migrating', 'starting up', 'saving']

    # Get the I/O stats of the domain as provided by Libvirt command domstats
    # The metrics are aggregated for all DIKS and NIC
    def io_stats
        @vm[:netrx] = 0
        @vm[:nettx] = 0
        @vm[:diskrdbytes] = 0
        @vm[:diskwrbytes] = 0
        @vm[:diskrdiops]  = 0
        @vm[:diskwriops]  = 0

        return if @vm[:state] != 'RUNNING' ||
                  REASONS_SKIP_IO.include?(@vm[:reason])

        vm_stats, _e, s = KVM.virsh(:domstats, @name)

        return if s.exitstatus != 0

        vm_stats.each_line do |line|
            columns = line.split(/=(\d+)/)

            case columns[0]
            when /rx.bytes/
                @vm[:netrx] += columns[1].to_i
            when /tx.bytes/
                @vm[:nettx] += columns[1].to_i
            when /rd.bytes/
                @vm[:diskrdbytes] += columns[1].to_i
            when /wr.bytes/
                @vm[:diskwrbytes] += columns[1].to_i
            when /rd.reqs/
                @vm[:diskrdiops] += columns[1].to_i
            when /wr.reqs/
                @vm[:diskwriops] += columns[1].to_i
            end
        end
    end

    # Get OS metrics provided by the qemu guest agent
    def ga_stats
        ga_commands = KVM::QEMU_GA[:commands].transform_values do |ga_cmd|
            ga_cmd.gsub('$vm_id', @vm[:id])
        end

        if KVM::QEMU_GA[:enabled]
            ga_commands.each do |ga_info, ga_cmd|
                text, e, s = KVM.virsh(:qemuga, ga_cmd)

                if s.exitstatus != 0
                    @vm[ga_info] = e.chomp
                else
                    @vm[ga_info] = JSON.parse(text)['return']
                end
            end
        else
            ga_commands.each_key do |ga_info|
                @vm[ga_info] = 'QEMU Guest Agent monitoring disabled'
            end
        end
    end

end

#-------------------------------------------------------------------------------
# This module provides a basic interface to get the list of domains in
# the system and convert the information to be added to monitor or system
# messages.
#
# It also gathers the state information of the domains for the state probe
#-------------------------------------------------------------------------------
module DomainList

    ############################################################################
    #  Module Interface
    ############################################################################
    def self.info
        domains = KVMDomains.new

        domains.info
        domains.to_monitor
    end

    def self.wilds_info
        domains = KVMDomains.new

        domains.wilds_info
        domains.wilds_to_monitor
    end

    def self.state_info(_host, _host_id)
        domains = KVMDomains.new

        domains.state_info
    end

    ############################################################################
    # This is the implementation class for the module logic
    ############################################################################
    class KVMDomains < BaseDomains

        include KVM
        include ProcessList

        # Get the list of wild VMs (not known to OpenNebula) and their monitor
        # information including process usage
        #
        #   @return [Hash] with KVM Domain classes indexed by their uuid
        def wilds_info
            info_each(true) do |name|
                next if name =~ /^one-\d+/

                vm = Domain.new name

                next if vm.info == -1

                t = vm.to_one

                vm[:template] = Base64.strict_encode64(t) unless t.empty?

                vm
            end
        end

        # Return a message string with wild VM information
        def wilds_to_monitor
            mon_s = ''

            @vms.each do |_uuid, vm|
                next if vm[:id] != -1 || vm[:template].empty?

                mon_s << "VM = [ID=\"#{vm[:id]}\", DEPLOY_ID=\"#{vm[:deploy_id]}\","
                mon_s << " VM_NAME=\"#{vm.name}\","
                mon_s << " IMPORT_TEMPLATE=\"#{vm[:template]}\"]\n"
            end

            mon_s
        end

    end

end
