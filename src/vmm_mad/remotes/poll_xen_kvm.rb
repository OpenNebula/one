#!/usr/bin/env ruby

# -------------------------------------------------------------------------- #
# Copyright 2002-2014, OpenNebula Project (OpenNebula.org), C12G Labs        #
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

require 'pp'
require 'rexml/document'

ENV['LANG']='C'

################################################################################
#
#  KVM Monitor Module
#
################################################################################
module KVM
    # Constants for KVM operations
    CONF={
        :dominfo    => 'virsh --connect LIBVIRT_URI --readonly dominfo',
        :list       => 'virsh --connect LIBVIRT_URI --readonly list',
        :dumpxml    => 'virsh --connect LIBVIRT_URI --readonly dumpxml',
        :domifstat  => 'virsh --connect LIBVIRT_URI --readonly domifstat',
        :top        => 'top -b -d2 -n 2 -p ',
        'LIBVIRT_URI' => 'qemu:///system'
    }

    # Execute a virsh command using the predefined command strings and URI
    # @param command [Symbol] as defined in the module CONF constant
    def self.virsh(command)
        CONF[command].gsub('LIBVIRT_URI', CONF['LIBVIRT_URI'])
    end

    # Get the information of a single VM. In case of error the VM is reported
    # as not found.
    # @param vm_id [String] with the VM information
    def self.get_vm_info(one_vm)
        dominfo = dom_info(one_vm)

        return { :state => '-' } if !dominfo

        psinfo = process_info(dominfo['UUID'])

        vm = Hash.new

        vm[:name] = one_vm
        vm[:pid]  = psinfo[1]

        cpu = get_cpu_info({one_vm => vm})

        resident_mem = psinfo[5].to_i
        max_mem      = dominfo['Max memory'].split(/\s+/).first.to_i

        values=Hash.new

        values[:state]      = get_state(dominfo['State'])
        values[:usedcpu]    = cpu[vm[:pid]] if cpu[vm[:pid]]
        values[:usedmemory] = [resident_mem, max_mem].max

        values.merge!(get_interface_statistics(one_vm))

        return values
    end

    # Gets the information of all VMs
    #
    # @return [Hash, nil] Hash with the VM information or nil in case of error
    def self.get_all_vm_info
        vms_info = Hash.new
        vms      = Hash.new

        text=`#{virsh(:list)}`

        return nil if $?.exitstatus != 0

        lines = text.split(/\n/)[2..-1]

        names = lines.map do |line|
            line.split(/\s+/).delete_if {|d| d.empty? }[1]
        end

        return vms_info if names.length == 0

        names.each do |vm|
            dominfo = dom_info(vm)

            if dominfo
                psinfo = process_info(dominfo['UUID'])

                info= Hash.new

                info[:dominfo] = dominfo
                info[:psinfo]  = psinfo
                info[:name]    = vm
                info[:pid]     = psinfo[1]

                vms[vm]=info
            end
        end

        cpu = get_cpu_info(vms)

        vms.each do |name, vm|
            ps_data = vm[:psinfo]
            dominfo = vm[:dominfo]

            resident_mem = ps_data[5].to_i
            max_mem      = dominfo['Max memory'].split(/\s+/).first.to_i

            values = Hash.new

            values[:state]      = get_state(dominfo['State'])
            values[:usedcpu]    = cpu[vm[:pid]] if cpu[vm[:pid]]
            values[:usedmemory] = [resident_mem, max_mem].max

            values.merge!(get_interface_statistics(name))

            vms_info[vm[:name]] = values
        end

        return vms_info
    end

    # Gathers process information from a set of VMs.
    #   @param vms [Hash] of vms indexed by name. Value is a hash with :pid
    #   @return  [Hash] with ps information
    def self.get_cpu_info(vms)
        pids = vms.map {|name, vm| vm[:pid] }
        pids.compact!

        cpu = Hash.new

        pids.each_slice(20) do |slice|
            data = %x{#{CONF[:top]} #{slice.join(',')}}

            lines = data.strip.split("\n")

            block_size  = lines.length/2
            valid_lines = lines.last(block_size)

            first_domain = 7

            valid_lines.each_with_index{ |l,i|
                if l.match 'PID USER'
                    first_domain=i+1
                    break
                end
            }

            domain_lines = valid_lines[first_domain..-1]

            domain_lines.each do |line|
                d = line.split
                cpu[d[0]] = d[8]
            end
        end

        cpu
    end

    # Process information for a KVM domain by its UUID
    #   @param uid [String] with user id
    #   @return [Array] of user processes
    def self.process_info(uuid)
        ps=`ps auxwww | grep -- '-uuid #{uuid}' | grep -v grep`
        ps.split(/\s+/)
    end

    # Gets the info of a domain by its id
    #   @param the ID of the VM as defined in libvirt
    #   @return [Hash] with the output of virsh dominfo, indexed by name (Id...)
    # Example execution of dominfo
    #   Id:             5
    #   Name:           one-6
    #   UUID:           06bc1876-fc6a-4dca-b41d-d7f2093b6b59
    #   OS Type:        hvm
    #   State:          running
    #   CPU(s):         1
    #   CPU time:       11.1s
    #   Max memory:     524288 KiB
    #   Used memory:    524288 KiB
    #   Persistent:     no
    #   Autostart:      disable
    #   Managed save:   no
    #   Security model: none
    #   Security DOI:   0
    def self.dom_info(vmid)
        text = `#{virsh(:dominfo)} #{vmid}`

        return nil if $?.exitstatus != 0

        lines = text.split(/\n/)
        hash  = Hash.new

        lines.map do |line|
            parts = line.split(/:\s+/)

            hash[parts[0]] = parts[1]
        end

        hash
    end

    # Aggregate statics of all VM NICs
    #   @param the ID of the VM as defined in libvirt
    #   @return [Hash] with network stats, by name [symbol] :netrx, :nettx
    def self.get_interface_statistics(vmid)
        text = `#{virsh(:dumpxml)} #{vmid}`

        return {} if $?.exitstatus != 0

        doc = REXML::Document.new(text)

        interfaces = Array.new

        doc.elements.each('domain/devices/interface/target') do |ele|
            interfaces << ele.attributes["dev"]
        end

        return {} if interfaces.empty?

        values = Hash.new

        values[:netrx] = 0
        values[:nettx] = 0

        interfaces.each do |interface|
            text=`#{virsh(:domifstat)} #{vmid} #{interface}`

            next if $?.exitstatus != 0

            text.each_line do |line|
                columns = line.split(/\s+/)

                case columns[1]
                    when 'rx_bytes'
                        values[:netrx] += columns[2].to_i
                    when 'tx_bytes'
                        values[:nettx]+=columns[2].to_i
                    end
                end
        end

        values
    end

    # Translate libvirt state to Opennebula monitor state
    #  @param state [String] libvirt state
    #  @return [String] OpenNebula state
    def self.get_state(state)
        case state.gsub('-', '')
            when *%w{running blocked shutdown dying idle}
                'a'
            when 'paused'
                'd'
            when 'crashed'
                'e'
            else
                '-'
        end
    end
end

################################################################################
#
# Xen Monitor Module
#
################################################################################
module XEN
    # Default configuration variables. It can be overridden through xenrc
    CONF={
        'XM_POLL' => 'sudo /usr/sbin/xentop -bi2'
    }

    # Get the information of a single VM. In case of error the VM is reported
    # as not found.
    # @param vm_id [String] with the VM information
    def self.get_vm_info(vm_id)
        data = get_all_vm_info

        if !data
            return {:STATE => 'd'}
        else
            return data[vm_id]
        end
    end

    # Gets the information of all VMs
    #
    # @return [Hash, nil] Hash with the VM information or nil in case of error
    def self.get_all_vm_info
        begin
            text  = `#{CONF['XM_POLL']}`

            return nil if $?.exitstatus != 0

            lines = text.strip.split("\n")

            block_size  = lines.length/2
            valid_lines = lines.last(block_size)

            first_domain = 4

            valid_lines.each_with_index{ |l,i|
                if l.match 'NAME  STATE'
                    first_domain=i+1
                    break
                end
            }

            domain_lines = valid_lines[first_domain..-1]

            domains = Hash.new

            domain_lines.each do |dom|
                dom_data = dom.gsub('no limit', 'no-limit').strip.split

                dom_hash = Hash.new

                dom_hash[:name]       = dom_data[0]
                dom_hash[:state]      = get_state(dom_data[1])
                dom_hash[:usedcpu]    = dom_data[3]
                dom_hash[:usedmemory] = dom_data[4]
                dom_hash[:nettx]      = dom_data[10].to_i * 1024
                dom_hash[:netrx]      = dom_data[11].to_i * 1024

                domains[dom_hash[:name]] = dom_hash
            end

            domains
        rescue
            STDERR.puts "Error executing #{CONF['XM_POLL']}"
            nil
        end
    end

    # Returns an OpenNebula state from the Xen status
    # @param state [String] with the Xen status
    # @return [String] OpenNebula monitor state
    def self.get_state(state)
        case state.gsub('-', '')[-1..-1]
        when *%w{r b s d}
            'a'
        when 'p'
            'd'
        when 'c'
            'e'
        else
            '-'
        end
    end
end

################################################################################
# Functions to interface hypervisor information
################################################################################

# Selects the hypervisor to be used based on the arguments or probe location
# This function also loads the associated configuration variables.
# @return [Module] with the hypervisor XEN, KVM
def setup_hypervisor
    hypervisor = nil
    params     = ARGV.clone

    params.each_with_index do |param, index|
        case param
            when '--kvm'
                hypervisor = KVM
                ARGV.delete_at(index)
            when '--xen'
                hypervisor = XEN
                ARGV.delete_at(index)
        end
    end

    if !hypervisor
        case $0
            when %r{/vmm\/kvm/}
                hypervisor=KVM
            when %r{/vmm\/xen\d?/}
                hypervisor=XEN
        end
    end

    case hypervisor.name
        when 'XEN'
            file = 'xenrc'
            vars = %w{XM_POLL}
        when 'KVM'
            file = 'kvmrc'
            vars = %w{LIBVIRT_URI}
        else
            return nil
    end

    # Load the rc variables and override the default values
    begin
        env   = `. #{File.dirname($0)+"/#{file}"};env`
        lines = env.split("\n")

        vars.each do |var|
            lines.each do |line|
                if a = line.match(/^(#{var})=(.*)$/)
                    hypervisor::CONF[var] = a[2]
                    break
                end
            end
        end
    rescue
    end

    return hypervisor
end

# Returns an OpenNebula monitor string
# @param name [String] of the monitor metric
# @param value [String] of the monitor metric
# @return [String, nil]
def print_data(name, value)
    if value
        "#{name.to_s.upcase}=#{value}"
    else
        nil
    end
end

# Puts to STDOUT a string in the form "VAL1=VAR1 VAL2=VAR2" with the monitor
# attributes of the VM
# @param hypervisor [Module]
# @param vm_id [String] with the VM ID
def print_one_vm_info(hypervisor, vm_id)
    info = hypervisor.get_vm_info(vm_id)

    exit(-1) if !info

    values = info.map do |key, value|
        print_data(key, value)
    end

    puts values.zip.join(' ')
end

def print_all_vm_info(hypervisor)
    require 'yaml'
    require 'base64'
    require 'zlib'

    vms = hypervisor.get_all_vm_info

    return nil if vms.nil?

    compressed = Zlib::Deflate.deflate(vms.to_yaml)

    puts Base64.encode64(compressed).delete("\n")
end

def print_all_vm_template(hypervisor)
    vms=hypervisor.get_all_vm_info

    return nil if vms.nil?

    puts "VM_POLL=YES"

    vms.each do |name, data|
        number = -1

        if (name =~ /^one-\d*$/)
            number = name.split('-').last
        end

        string  = "VM=[\n"
        string << "  ID=#{number},\n"
        string << "  DEPLOY_ID=#{name},\n"

        values = data.map do |key, value|
            print_data(key, value)
        end

        monitor = values.zip.join(' ')

        string << "  POLL=\"#{monitor}\" ]"

        puts string
    end
end


################################################################################
# MAIN PROGRAM
################################################################################

hypervisor = setup_hypervisor

if !hypervisor
    STDERR.puts "Could not detect hypervisor"
    exit(-1)
end

vm_id = ARGV[0]

if vm_id == '-t'
    print_all_vm_template(hypervisor)
elsif vm_id
    print_one_vm_info(hypervisor, vm_id)
else
    print_all_vm_info(hypervisor)
end
