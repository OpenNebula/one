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
require_relative '../lib/xmlparser'
require_relative '../lib/command'
require_relative '../lib/opennebula_vm'

require 'json'

# rubocop:disable Style/ClassAndModuleChildren
# rubocop:disable Style/ClassVars

# This module includes related KVM/Libvirt functions
module VirtualMachineManagerKVM

    #---------------------------------------------------------------------------
    # KVM Configuration
    #---------------------------------------------------------------------------

    # Default locations for kvmrc file on the front-end (local) or
    # hypervisor (remote)
    KVMRC_LOCAL  = '/var/lib/one/remotes/etc/vmm/kvm/kvmrc'
    KVMRC_REMOTE = '/var/tmp/one/etc/vmm/kvm/kvmrc'

    # Loads env from the default local (front-end) path
    def load_local_env
        load_env(KVMRC_LOCAL)
    end

    # Loads env from the default remote (hypervisor) path
    def load_remote_env
        load_env(KVMRC_REMOTE)
    end

    # Defines env variables for the current proccess by parsing a Shell
    # formatted file
    def load_env(path)
        File.readlines(path).each do |l|
            next if l.empty? || l[0] == '#'

            m = l.match(/(export)?[[:blank:]]*([^=]+)=([^[[:blank:]]]+)$/)

            next unless m

            k = m[2]
            v = m[3].strip

            # remove single or double quotes
            if !v.empty? && v[0] == v[-1] && ["'", '"'].include?(v[0])
                v = v.slice(1, v.length-2)
            end

            ENV[k] = v.delete("\n") if k && v
        end
    rescue StandardError
    end

    # @return a virsh command considering LIBVIRT_URI env
    def virsh
        uri = ENV['LIBVIRT_URI']
        uri ||= 'qemu:///system'

        "virsh --connect #{uri}"
    end

    # --------------------------------------------------------------------------
    # This class abstracts the information and several methods to operate over
    # qcow2 disk images files
    # --------------------------------------------------------------------------
    class QemuImg

        attr_reader :path

        def initialize(path)
            @_info = nil
            @path  = path
        end

        # @return[Array] with major, minor and micro qemu-img version numbers
        def self.version
            out, _err, _rc = Open3.capture3('qemu-img --version')

            m = out.lines.first.match(/([0-9]+)\.([0-9]+)\.([0-9]+)/)

            return '0000000' unless m

            [m[1], m[2], m[3]]
        end

        # qemu-img command methods
        #   @param args[String] non option argument
        #   @param opts[Hash] options arguments:
        #     -keys options as symbols, e.g.
        #       :o          '-o'
        #       :disks      '--disks'
        #       :disk_only  '--disk-only'
        #       :map=       '--map= '
        #     -values option values, can be empty
        QEMU_IMG_COMMANDS = [
            'convert',
            'create',
            'rebase',
            'info',
            'bitmap',
            'commit'
        ]

        QEMU_IMG_COMMANDS.each do |command|
            define_method(command.to_sym) do |args = '', opts|
                cmd_str = "qemu-img #{command}"

                opts.each do |key, value|
                    next if key == :stdin_data

                    if key.length == 1
                        cmd_str << " -#{key}"
                    else
                        cmd_str << " --#{key.to_s.gsub('_', '-')}"
                    end

                    if value && !value.empty?
                        cmd_str << ' ' if key[-1] != '='
                        cmd_str << value.to_s
                    end
                end

                out, err, rc = Open3.capture3("#{cmd_str} #{@path} #{args}",
                                              :stdin_data => opts[:stdin_data])

                if rc.exitstatus != 0
                    msg = "Error executing: #{cmd_str} #{@path} #{args}\n"
                    msg << "\t[stderr]: #{err}" unless err.empty?
                    msg << "\t[stdout]: #{out}" unless out.empty?

                    raise StandardError, msg
                end

                out
            end
        end

        # Access image attribute
        def [](key)
            if !@_info
                out    = info(:output => 'json', :force_share => '')
                @_info = JSON.parse(out)
            end

            @_info[key]
        end

    end

    #
    # This class provides abstractions to access KVM/Qemu libvirt domains
    #
    class KvmDomain

        def initialize(domain)
            @domain = domain
            @xml    = nil

            out, err, rc = Open3.capture3("#{virsh} dumpxml #{@domain}")

            if out.nil? || out.empty? || rc.exitstatus != 0
                raise StandardError, "Error getting domain info #{err}"
            end

            @xml = XMLElement.new_s out

            @snapshots = []
            @snapshots_current = nil

            @disks = nil
        end

        def [](xpath)
            @xml[xpath]
        end

        def exist?(xpath)
            @xml.exist?(xpath)
        end

        # ---------------------------------------------------------------------
        # VM system snapshots interface
        # ---------------------------------------------------------------------

        # Get the system snapshots of a domain
        #
        #  @param query[Boolean] refresh the snapshot information by querying
        #         libvirtd daemon
        #
        #  @return [Array] the array of snapshots name, and the current snapshot
        #          (if any)
        def snapshots(query = true)
            return [@snapshots, @snapshots_current] unless query

            o, e, rc = Open3.capture3("#{virsh} snapshot-list #{@domain} --name")

            if rc.exitstatus != 0
                raise StandardError, "Error getting domain snapshots #{e}"
            end

            @snapshots = o.lines.map {|l| l.strip! }
            @snapshots.reject! {|s| s.empty? }

            return [@snapshots, nil] if @snapshots.empty?

            o, _e, rc = Open3.capture3("#{virsh} snapshot-current #{@domain} --name")

            @snapshots_current = o.strip if rc.exitstatus == 0

            [@snapshots, @snapshots_current]
        end

        # Delete domain metadata snapshots.
        #   @param query[Boolean] update the snapshot list of the domain
        def snapshots_delete(query = true)
            snapshots(query)

            delete = "#{virsh} snapshot-delete #{@domain} --metadata --snapshotname"

            @snapshots.each do |snap|
                Command.execute_log("#{delete} #{snap}")
            end
        end

        # Redefine system snapshots on the destination libvirtd, the internal
        # list needs to be bootstraped by using the snapshots or snapshots_delete
        #
        #   @param host[String] where the snapshots will be defined
        #   @param dir[String] VM folder path to look for the XML snapshot
        #          metadata files
        def snapshots_redefine(host, dir)
            define  = "#{virsh_cmd(host)} snapshot-create --redefine #{@domain}"
            current = "#{virsh_cmd(host)} snapshot-current #{@domain}"

            @snapshots.each do |snap|
                Command.execute_log("#{define} #{dir}/#{snap}.xml")
            end

            return unless @snapshots_current

            Command.execute_log("#{current} #{@snapshots_current}")
        end

        # ---------------------------------------------------------------------
        # vm disk interface
        # ---------------------------------------------------------------------

        # Gets the list of disks of a domain as an Array of [dev, path] pairs
        #   - dev is the device name of the blk, e.g. vda, sdb...
        #   - path of the file for the virtual disk
        def disks
            if !@disks
                o, e, rc = Open3.capture3("#{virsh} domblklist #{@domain}")

                if rc.exitstatus != 0
                    raise StandardError, "Error getting domain snapshots #{e}"
                end

                @disks = o.lines[2..o.lines.length].map {|l| l.split }
                @disks.reject! {|s| s.empty? }
            end

            @disks
        end

        # @return [Boolean] true if the disk (by path) is readonly
        def readonly?(disk_path)
            exist? "//domain/devices/disk[source/@file='#{disk_path}']/readonly"
        end

        # ---------------------------------------------------------------------
        # domain operations
        # ---------------------------------------------------------------------

        # Live migrate the domain to the target host (SHARED STORAGE variant)
        #   @param host[String] name of the target host
        def live_migrate(host)
            cmd =  "migrate --live #{ENV['MIGRATE_OPTIONS']} #{@domain}"
            cmd << " #{virsh_uri(host)}"

            virsh_retry(cmd, 'active block job', virsh_tries)
        end

        # Live migrate the domain to the target host (LOCAL STORAGE variant)
        #   @param host[String] name of the target host
        #   @param devs[Array] of the disks that will be copied
        def live_migrate_disks(host, devs)
            cmd =  "migrate --live #{ENV['MIGRATE_OPTIONS']} --suspend"
            cmd << " #{@domain} #{virsh_uri(host)}"

            if !devs.empty?
                cmd << " --copy-storage-all --migrate-disks #{devs.join(',')}"
            end

            virsh_retry(cmd, 'active block job', virsh_tries)
        end

        #  Basic domain operations (does not require additional parameters)
        VIRSH_COMMANDS = [
            'resume',
            'destroy',
            'undefine'
        ]

        VIRSH_COMMANDS.each do |command|
            define_method(command.to_sym) do |host = nil|
                Command.execute_log("#{virsh_cmd(host)} #{command} #{@domain}")
            end
        end

        # ---------------------------------------------------------------------
        # Private function helpers
        # ---------------------------------------------------------------------
        private

        # @return [Integer] number of retries for virsh operations
        def virsh_tries
            vt = ENV['VIRSH_TRIES'].to_i
            vt = 3 if vt == 0

            vt
        end

        # @return [String] including the --connect attribute to run virsh commands
        def virsh_cmd(host = nil)
            if host
                "virsh --connect #{virsh_uri(host)}"
            else
                virsh
            end
        end

        # @return [String] to contact libvirtd in a host
        def virsh_uri(host)
            proto = ENV['QEMU_PROTOCOL']
            proto ||= 'qemu+ssh'

            "#{proto}://#{host}/system"
        end

        # Retries a virsh operation if the returned error matches the provided
        # one,
        #
        #  @param cmd[String] the virsh command arguments
        #  @param no_error_str[String] when stderr matches the string the operation
        #         will be retried
        #  @param tries[Integer] number of tries
        #  @param secs[Integer] seconds to wait between tries
        def virsh_retry(cmd, no_error_str, tries = 1, secs = 5)
            out, err, rc = nil

            tini = Time.now

            loop do
                tries -= 1

                out, err, rc = Open3.capture3("#{virsh} #{cmd}")

                break if rc.exitstatus == 0

                match = err.match(/#{no_error_str}/)

                break if tries == 0 || !match

                sleep(secs)
            end

            if rc.exitstatus == 0
                STDERR.puts "#{virsh} #{cmd} (#{Time.now-tini}s)"
            else
                STDERR.puts "Error executing: #{virsh} #{cmd} (#{Time.now-tini}s)"
                STDERR.puts "\t[stdout]: #{out}" unless out.empty?
                STDERR.puts "\t[stderr]: #{err}" unless err.empty?
            end

            [rc.exitstatus, out, err]
        end

    end

    #---------------------------------------------------------------------------
    # OpenNebula KVM Virtual Machine
    #---------------------------------------------------------------------------
    # This class parses and wraps the information in the Driver action data
    # It provides some helper functions to implement KVM driver actions
    class KvmVM < OpenNebulaVM

        def initialize(xml_action)
            super(xml_action, {})

            # if set, it will scope VM element access
            @xpath_prefix = ''
        end

        # @return true if the VM includes a PCI device being attached
        def pci_attach?
            @xml.exist? "TEMPLATE/PCI[ATTACH='YES']"
        end

        #-----------------------------------------------------------------------
        #  This function generates a XML document to attach a new interface
        #  to the VM. The interface specification supports the same OpenNebula
        #  attributes.
        #
        #  Model and filter can be set in kvmrc with DEFAULT_ATTACH_NIC_MODEL
        #  and DEFAULT_ATTACH_NIC_FILTER, respectively
        #
        #  Example:
        #
        #  <interface type='bridge'>
        #    <source bridge='onebr57'/>
        #    <mac address='02:00:c0:a8:96:01'/>
        #    <target dev='one-160-1'/>
        #    <model type='virtio'/>
        #  </interface>
        #-----------------------------------------------------------------------
        def interface_xml
            prefix_old    = @xpath_prefix
            @xpath_prefix = "TEMPLATE/NIC[ATTACH='YES']/"

            model = @xml["#{@xpath_prefix}MODEL"]
            model = env('DEFAULT_ATTACH_NIC_MODEL') if model.empty?
            model.encode!(:xml => :attr) unless model.empty?

            filter = @xml["#{@xpath_prefix}FILTER"]
            filter = env('DEFAULT_ATTACH_NIC_FILTER') if filter.empty?
            filter.encode!(:xml => :attr) unless filter.empty?

            if exist? 'BRIDGE'
                dev = '<interface type="bridge">'

                if @xml["#{@xpath_prefix}BRIDGE_TYPE"] =~ /openvswitch/
                    dev << '<virtualport type="openvswitch"/>'
                end

                dev << xputs('<source bridge=%s/>', 'BRIDGE')
            else
                dev = '<interface type="ethernet">'
            end

            dev << xputs('<mac address=%s/>', 'MAC')
            dev << xputs('<script path=%s/>', 'SCRIPT')

            dev << xputs('<target dev=%s/>', 'TARGET')
            dev << xputs('<boot order=%s/>', 'ORDER')
            dev << "<model type=#{model}/>" unless model.empty?

            if model == 'virtio'
                dev << xputs('<driver name="vhost" queues=%s/>',
                             'VIRTIO_QUEUES')
            end

            if exist?('IP') && !filter.empty?
                dev << "<filterref filter=#{filter}>"
                dev << xputs('<parameter name="IP" value=%s/>', 'IP')
                dev << xputs('<parameter name="IP" value=%s/>', 'VROUTER_IP')
                dev << '</filterref>'
            end

            inb_keys = ['INBOUND_AVG_BW', 'INBOUND_PEAK_BW', 'INBOUND_PEAK_KB']
            inbound  = inb_keys.any? {|e| exist? e }

            outb_keys = ['OUTBOUND_AVG_BW', 'OUTBOUND_PEAK_BW', 'OUTBOUND_PEAK_KB']
            outbound  = outb_keys.any? {|e| exist? e }

            if inbound || outbound
                dev << '<bandwidth>'

                if inbound
                    dev << '<inbound'
                    dev << xputs(' average=%s', 'INBOUND_AVG_BW')
                    dev << xputs(' peak=%s', 'INBOUND_PEAK_BW')
                    dev << xputs(' burst=%s', 'INBOUND_PEAK_KB')
                    dev << '/>'
                end

                if outbound
                    dev << '<outbound'
                    dev << xputs(' average=%s', 'OUTBOUND_AVG_BW')
                    dev << xputs(' peak=%s', 'OUTBOUND_PEAK_BW')
                    dev << xputs(' burst=%s', 'OUTBOUND_PEAK_KB')
                    dev << '/>'
                end

                dev << '</bandwidth>'
            end

            dev << '</interface>'

            @xpath_prefix = prefix_old

            dev
        end

        def vf?(short_address)
            cmd = "find /sys/devices -type l -name 'virtfn*' -printf '%p#'"\
                " -exec readlink -f '{}' \\;"

            out, _err, _rc = Open3.capture3(cmd)

            return false if out.nil? || out.empty?

            regexp = Regexp.new("#{short_address}$")

            !out.match(regexp).nil?
        end

        def dumpxml_regexp(domain, str_exp)
            cmd = "#{virsh} dumpxml #{domain}"

            out, _err, _rc = Open3.capture3(cmd)

            return false if out.nil? || out.empty?

            regexp = Regexp.new(str_exp)

            !out.match(regexp).nil?
        end

        #-----------------------------------------------------------------------
        # This function generates a XML document to attach a new device
        # to the VM. The specification supports the same OpenNebula attributes.
        #
        # Example:
        #
        # <hostdev mode='subsystem' type='pci' managed='yes'>
        #   <source>
        #     <address  domain='0x0000' bus='0x05' slot='0x02' function='0x0'/>
        #   </source>
        #   <address type='pci' domain='0x0' bus='0x01' slot='0x01' function='0'/>
        # </hostdev>
        #
        # NOTE: Libvirt/QEMU seems to have a race condition accesing vfio device
        # and the permission check/set that makes <hostdev> not work for VF.
        #
        # NOTE: On detach (as we are manging MAC/VLAN through ip link vf) devices
        # needs to use <hostdev> format
        #-----------------------------------------------------------------------
        def hostdev_xml(defined_opts = {})
            opts = {
                :force_hostdev => false,
                :pci => false
            }.merge(defined_opts)

            prefix_old    = @xpath_prefix
            @xpath_prefix = "TEMPLATE/PCI[ATTACH='YES']/"

            if exist? 'UUID'
                dev = '<hostdev mode="subsystem" type="mdev" model="vfio-pci">'
                dev << xputs('<source><address uuid=%s/></source>', 'UUID')
                dev << '</hostdev>'
            else
                if opts[:force_hostdev]
                    is_vf = false
                else
                    is_vf = vf?(@xml["#{@xpath_prefix}SHORT_ADDRESS"])
                end

                if is_vf
                    dev = '<interface type="hostdev" managed="yes">'
                    dev_end = '</interface>'
                else
                    dev = '<hostdev mode="subsystem" type="pci" managed="yes">'
                    dev_end = '</hostdev>'
                end

                dev << '<source><address'
                dev << ' type="pci"' if is_vf
                dev << xputs(' domain=%s', 'DOMAIN', :hex => true)
                dev << xputs(' bus=%s', 'BUS', :hex => true)
                dev << xputs(' slot=%s', 'SLOT', :hex => true)
                dev << xputs(' function=%s', 'FUNCTION', :hex => true)
                dev << '/></source>'

                # Setting Bus address needs to check that a PCI contoller is
                # present for Bus 1
                vm_addr = ['VM_DOMAIN', 'VM_BUS', 'VM_SLOT', 'VM_FUNCTION'].all? {|e| exist? e }

                if vm_addr && opts[:pci]
                    dev << '<address type="pci"'
                    dev << xputs(' domain=%s', 'VM_DOMAIN')
                    dev << xputs(' bus=%s', 'VM_BUS')
                    dev << xputs(' slot=%s', 'VM_SLOT')
                    dev << xputs(' function=%s', 'VM_FUNCTION')
                    dev << '/>'
                end

                dev << dev_end
            end

            @xpath_prefix = prefix_old

            dev
        end

        private

        # @return the string printing an XML VM attribute following the provided
        # format.
        # Options
        # :hex to prepend 0x to the attribute
        def xputs(format, name, opts = {})
            value = @xml["#{@xpath_prefix}#{name}"]

            return '' if value.empty?

            value = "0x#{value}" if opts[:hex]

            format(format, value.encode(:xml => :attr))
        end

        # @return true if the given VM element exists (considers xpath_prefix)
        def exist?(name)
            @xml.exist?("#{@xpath_prefix}#{name}")
        end

        # @return a copy of an env variable or '' if not defined
        def env(name)
            return '' if ENV[name].nil?

            ENV[name].dup
        end

    end

end

# rubocop:enable Style/ClassAndModuleChildren
# rubocop:enable Style/ClassVars
