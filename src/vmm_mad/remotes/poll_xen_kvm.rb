#!/usr/bin/env ruby

# -------------------------------------------------------------------------- #
# Copyright 2002-2015, OpenNebula Project, OpenNebula Systems                #
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
require 'base64'
require 'uri'

begin
    require 'rubygems'
    require 'json'

    JSON_LOADED = true
rescue LoadError
    JSON_LOADED = false
end

ENV['LANG']='C'
ENV['LC_ALL']='C'

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

        values[:state]  = get_state(dominfo['State'])
        values[:cpu]    = cpu[vm[:pid]] if cpu[vm[:pid]]
        values[:memory] = [resident_mem, max_mem].max

        xml = dump_xml(one_vm)

        values.merge!(get_interface_statistics(one_vm, xml))

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

            values[:state]  = get_state(dominfo['State'])
            values[:cpu]    = cpu[vm[:pid]] if cpu[vm[:pid]]
            values[:memory] = [resident_mem, max_mem].max

            xml = dump_xml(name)

            values.merge!(get_interface_statistics(name, xml))
            values.merge!(get_disk_usage(xml))

            if !name.match(/^one-\d+/)
                uuid, template = xml_to_one(xml)
                values[:template] = Base64.encode64(template).delete("\n")
                values[:vm_name] = name
                vm[:name] = uuid
            end

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

            cpu_field = nil
            valid_lines.each_with_index{ |l,i|
                if l.match 'PID USER'
                    first_domain=i+1
                    cpu_field = l.strip.split.index("%CPU")
                    break
                end
            }

            domain_lines = valid_lines[first_domain..-1]

            domain_lines.each do |line|
                d = line.split
                cpu[d[0]] = d[cpu_field]
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

    # Get dumpxml output of a VM
    #   @param the ID of the VM as defined in libvirt
    #   @return [String] xml output of virsh dumpxml
    def self.dump_xml(vmid)
        `#{virsh(:dumpxml)} '#{vmid}'`
    end

    # Aggregate statics of all VM NICs
    #   @param the ID of the VM as defined in libvirt
    #   @param text [nil, String] dumpxml output or nil to execute dumpxml
    #   @return [Hash] with network stats, by name [symbol] :netrx, :nettx
    def self.get_interface_statistics(vmid, text = nil)
        text = dump_xml(vmid) if !text

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
    #
    # Libvirt states for the guest are
    #  * 'running' state refers to guests which are currently active on a CPU.
    #  * 'blocked' not running or runnable (waiting on I/O or in a sleep mode).
    #  * 'paused' after virsh suspend.
    #  * 'shutdown' guest in the process of shutting down.
    #  * 'dying' the domain has not completely shutdown or crashed.
    #  * 'crashed' guests have failed while running and are no longer running.
    #
    def self.get_state(state)
        case state.gsub('-', '')
            when *%w{running blocked shutdown dying idle paused}
                'a'
            when 'crashed'
                'e'
            else
                '-'
        end
    end

    def self.get_disk_usage(xml)
        return {} if !JSON_LOADED

        doc  = REXML::Document.new(xml)
        size = 0
        systemds = doc.elements['domain/metadata/system_datastore'] rescue nil
        systemds = systemds.text.gsub(/\/+/, '/') if systemds

        data = {
            :disk_size       => [],
            :snapshot_size   => []
        }

        begin
        doc.elements.each('domain/devices/disk/source') do |ele|
            # read the disk path (for regular disks)
            file = ele.attributes['file'] rescue nil

            # get protocol and name (for ceph)
            protocol = ele.attributes['protocol'] rescue nil
            name = ele.attributes['name'] rescue nil

            if protocol == "rbd"
                # Ceph
                auth = ele.parent.elements["auth"].attributes["username"] rescue nil
                auth = "--id #{auth}" if !auth.nil?

                pool, image = name.split('/')
                disk_id = image.split('-')[-1].to_i

                images_list = rbd_pool(pool, auth)
                images_doc  = REXML::Document.new(images_list)

                xpath = "images/image[image='#{image}']/size"
                disk_size = images_doc.elements[xpath].text.to_f/1024/1024

                data[:disk_size] << {:id => disk_id, :size => disk_size.round}

                images_doc.elements.each("images/snapshot") do |snap|
                    next unless snap.elements["image"].text.start_with?(image)

                    snap_id = snap.elements["snapshot"].text.to_i
                    snapshot_size = snap.elements["size"].text.to_f/1024/1024

                    data[:snapshot_size] << { :id => snap_id, :disk_id => disk_id, :size => snapshot_size.round}

                end
            elsif file
                # Search the disk in system datastore when the source
                # is a persistent image with snapshots
                source = nil
                current_snap_id = nil

                if !file.match(/.*disk\.\d+$/) && systemds
                    source = file.gsub(%r{/+}, '/')

                    disks = Dir["#{systemds}/disk.*"]

                    disks.each do |disk|
                        next if !File.symlink?(disk)
                        link = File.readlink(disk).gsub(%r{/+}, '/')

                        if link == source
                            file = disk
                            current_snap_id = link.split('/').last
                            break
                        end
                    end
                else
                    if File.symlink?(file)
                        link = File.readlink(file)
                        current_snap_id = link.split('/').last
                    end
                end

                # Regular Disk
                text = `qemu-img info --output=json #{file}`
                next if !$? || !$?.success?

                json = JSON.parse(text)

                disk_id = file.split(".")[-1]

                disk_size = json['actual-size'].to_f/1024/1024

                data[:disk_size] << {:id => disk_id, :size => disk_size.round}

                # Get snapshots
                Dir[file + '.snap/*'].each do |snap|
                    if current_snap_id
                        next if snap.split('/').last == current_snap_id
                    else
                        next if source == snap
                    end

                    text = `qemu-img info --output=json #{snap}`
                    next if !$? || !$?.success?

                    json = JSON.parse(text)

                    snap_id = snap.split("/")[-1]

                    snap_size = json['actual-size'].to_f/1024/1024

                    data[:snapshot_size] << { :id => snap_id, :disk_id => disk_id, :size => snap_size.round}
                end
            end
        end
        rescue Exception => e
            STDERR.puts "Error getting disk information."
            STDERR.puts e.message
            STDERR.puts e.backtrace.join("\n  ")
        end

        data
    end

    # Convert the output of dumpxml to an OpenNebula template
    #   @param xml [String] output of dumpxml
    #   @return [Array] uuid and OpenNebula template encoded in base64
    def self.xml_to_one(xml)
        doc = REXML::Document.new(xml)

        name = REXML::XPath.first(doc, '/domain/name').text
        uuid = REXML::XPath.first(doc, '/domain/uuid').text
        vcpu = REXML::XPath.first(doc, '/domain/vcpu').text
        memory = REXML::XPath.first(doc, '/domain/memory').text.to_i / 1024
        arch = REXML::XPath.first(doc, '/domain/os/type').attributes['arch']

=begin
        disks = []
        REXML::XPath.each(doc, '/domain/devices/disk') do |d|
            type = REXML::XPath.first(d, '//disk').attributes['type']
            driver = REXML::XPath.first(d, '//disk/driver').attributes['type']
            source = REXML::XPath.first(d, '//disk/source').attributes[type]
            target = REXML::XPath.first(d, '//disk/target').attributes['dev']

            disks << {
                :type => type,
                :driver => driver,
                :source => source,
                :target => target
            }
        end

        disks_txt = ''

        disks.each do |disk|
            disks_txt << "DISK=[\n"
            disks_txt << "  SOURCE=\"#{disk[:source]}\",\n"
            disks_txt << "  DRIVER=\"#{disk[:driver]}\",\n"
            disks_txt << "  TARGET=\"#{disk[:target]}\""
            disks_txt << "]\n"
        end


        interfaces = []
        REXML::XPath.each(doc,
                "/domain/devices/interface[@type='bridge']") do |i|
            mac = REXML::XPath.first(i, '//interface/mac').
                attributes['address']
            bridge = REXML::XPath.first(i, '//interface/source').
                attributes['bridge']
            model = REXML::XPath.first(i, '//interface/model').
                attributes['type']

            interfaces << {
                :mac => mac,
                :bridge => bridge,
                :model => model
            }
        end

        interfaces_txt = ''

        interfaces.each do |interface|
            interfaces_txt << "NIC=[\n"
            interfaces_txt << "  MAC=\"#{interface[:mac]}\",\n"
            interfaces_txt << "  BRIDGE=\"#{interface[:bridge]}\",\n"
            interfaces_txt << "  MODEL=\"#{interface[:model]}\""
            interfaces_txt << "]\n"
        end
=end

        spice = REXML::XPath.first(doc,
            "/domain/devices/graphics[@type='spice']")
        spice = spice.attributes['port'] if spice

        spice_txt = ''
        if spice
            spice_txt = %Q<GRAPHICS = [ TYPE="spice", PORT="#{spice}" ]>
        end

        vnc = REXML::XPath.first(doc, "/domain/devices/graphics[@type='vnc']")
        vnc = vnc.attributes['port'] if vnc

        vnc_txt = ''
        if vnc
            vnc_txt = %Q<GRAPHICS = [ TYPE="vnc", PORT="#{vnc}" ]>
        end


        feature_list = %w{acpi apic pae}
        features = []

        feature_list.each do |feature|
            if REXML::XPath.first(doc, "/domain/features/#{feature}")
                features << feature
            end
        end

        feat = []
        features.each do |feature|
            feat << %Q[  #{feature.upcase}="yes"]
        end

        features_txt = "FEATURES=[\n"
        features_txt << feat.join(",\n")
        features_txt << "]\n"


        template = <<EOT
NAME="#{name}"
CPU=#{vcpu}
VCPU=#{vcpu}
MEMORY=#{memory}
HYPERVISOR="kvm"
IMPORT_VM_ID="#{uuid}"
OS=[ARCH="#{arch}"]
#{features_txt}
#{spice_txt}
#{vnc_txt}
EOT

        return uuid, template
    end

    def self.rbd_pool(pool, auth = nil)
        @@rbd_pool ||= {}

        if @@rbd_pool[pool].nil?
            @@rbd_pool[pool] = `rbd #{auth} ls -l -p #{pool} --format xml`
        end

        @@rbd_pool[pool]
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
            begin
                list_long = get_vm_list_long
            rescue
                list_long = []
            end

            vm_templates = get_vm_templates(list_long)
            vm_disk_stats = get_vm_disk_stats(list_long)

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

                name = dom_data[0]

                dom_hash = Hash.new

                dom_hash[:name]    = name
                dom_hash[:vm_name] = name
                dom_hash[:state]   = get_state(dom_data[1])
                dom_hash[:cpu]     = dom_data[3]
                dom_hash[:memory]  = dom_data[4]
                dom_hash[:nettx]   = dom_data[10].to_i * 1024
                dom_hash[:netrx]   = dom_data[11].to_i * 1024

                if !name.match(/^one-\d/) && vm_templates[name]
                    dom_hash[:template] =
                        Base64.encode64(vm_templates[name]).delete("\n")
                end

                dom_hash.merge!(vm_disk_stats[name]) if vm_disk_stats[name]

                domains[name] = dom_hash
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
    #
    # Xentop states are:
    #  'd' – domain is dying
    #  's' – domain shutting down
    #  'b' – blocked domain
    #  'c' – domain crashed
    #  'p' – domain paused
    #  'r' – domain is actively ruining on one of the CPU
    def self.get_state(state)
        case state.gsub('-', '')[-1..-1]
        when *%w{r b s d p}
            'a'
        when 'c'
            'e'
        else
            '-'
        end
    end

    def self.get_vm_list_long
        return {} if !JSON_LOADED

        text = `#{CONF['XM_LIST']} -l`
        doms = JSON.parse(text)
    end

    def self.get_vm_templates(doms)
        dom_tmpl = {}

        doms.each do |dom|
            name = dom['config']['c_info']['name']
            name = URI.escape(name)

            tmp = %Q<NAME = "#{name}"\n>
            tmp << %Q<IMPORT_VM_ID = "#{name}"\n>

            vcpus = dom['config']['b_info']['max_vcpus'].to_i
            vcpus = 1 if vcpus < 1

            tmp << %Q<CPU = #{vcpus}\n>
            tmp << %Q<VCPU = #{vcpus}\n>

            memory = dom['config']['b_info']['max_memkb']
            memory /= 1024

            tmp << %Q<MEMORY = #{memory}\n>

            dom_tmpl[name] = tmp
        end

        dom_tmpl
    end

    def self.get_vm_disk_stats(doms)
        dom_disk_stats = {}

        doms.each do |dom|
            data = {
                :disk_size       => [],
                :snapshot_size   => []
            }

            dom['config']['disks'].each do |disk|
                next if !disk['pdev_path']

                path = disk['pdev_path']

                text = `qemu-img info --output=json #{path}`
                next if !$? || !$?.success?

                json = JSON.parse(text)

                disk_id = path.split(".")[-1]

                disk_size = json['actual-size'].to_f/1024/1024

                data[:disk_size] << {:id => disk_id, :size => disk_size.round}
            end


            data
        end

        dom_disk_stats
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
            vars = %w{XM_POLL XM_LIST}
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
    return nil if value.nil? || (value.respond_to?(:empty?) && value.empty?)

    if value.instance_of? Array
        data_str = ""
        value.each do |v|
            data_str += print_data(name, v)
        end

        return data_str
    elsif value.instance_of? Hash
        values = value.map do |k,v|
            "#{k.to_s.upcase}=#{v}"
        end.join(", ")

        return "#{name.to_s.upcase}=[ #{values} ] "
    else
        return "#{name.to_s.upcase}=#{value}"
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

        vm_name = data[:vm_name]

        string  = "VM=[\n"
        string << "  ID=#{number},\n"
        string << "  DEPLOY_ID=#{name},\n"
        string << %Q(  VM_NAME="#{vm_name}",\n) if vm_name

        if data[:template]
            string << %Q(  IMPORT_TEMPLATE="#{data[:template]}",\n)
            data.delete(:template)
        end

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
