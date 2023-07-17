# -------------------------------------------------------------------------- #
# Copyright 2002-2023, OpenNebula Project, OpenNebula Systems                #
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
require_relative '../lib/opennebula_vm'

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

            ENV[m[2]] = m[3].delete("\n") if m[2] && m[3]
        end
    rescue StandardError
    end

    # @return a virsh command considering LIBVIRT_URI env
    def virsh
        uri = ENV['LIBVIRT_URI']
        uri ||= 'qemu:///system'

        "virsh --connect #{uri}"
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
