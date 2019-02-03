#!/usr/bin/env ruby

# -------------------------------------------------------------------------- #
# Copyright 2002-2019, OpenNebula Project, OpenNebula Systems                #
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
require 'rexml/document'
require 'open3'

ENV['LANG'] = 'C'
ENV['LC_ALL'] = 'C'

GUEST_ARCHS = %w(i686 x86_64)

begin

    capabilities = ""
    archs    = []
    machines = []
    models   = []

    cmd = 'virsh -r -c qemu:///system capabilities'
    capabilities, e, s = Open3.capture3(cmd)
    exit(-1) unless s.success?

    cap_xml = REXML::Document.new(capabilities)
    cap_xml = cap_xml.root

    GUEST_ARCHS.each { |a|
        a_elem = cap_xml.elements["guest/arch[@name='#{a}']"]
        next if !a_elem

        # Evaluate the domain specific machines with higher priority
        # over the machines listed just inside the architecture.
        #
        #  <guest>
        #    <os_type>hvm</os_type>
        #    <arch name='x86_64'>
        #      <wordsize>64</wordsize>
        #      <emulator>/usr/bin/qemu-system-x86_64</emulator>
        #      <machine maxCpus='255'>pc-i440fx-2.0</machine>
        #      <machine canonical='pc-i440fx-2.0' maxCpus='255'>pc</machine>
        #      ...
        #      <machine maxCpus='255'>pc-1.0</machine>
        #      <machine maxCpus='255'>pc-0.13</machine>
        #      <domain type='qemu'/>
        #      <domain type='kvm'>
        #        <emulator>/usr/libexec/qemu-kvm</emulator>
        #        <machine maxCpus='240'>pc-i440fx-rhel7.4.0</machine>
        #        <machine canonical='pc-i440fx-rhel7.4.0' maxCpus='240'>pc</machine>
        #        ...
        #        <machine maxCpus='240'>rhel6.2.0</machine>
        #        <machine maxCpus='240'>pc-i440fx-rhel7.3.0</machine>
        #      </domain>
        #    </arch>
        #    ...
        #  </guest>

        a_machines = []

        ['kvm', 'kqemu', 'qemu', ''].each { |type|
            if type.empty?
                d_elem = a_elem
            else
                d_elem = a_elem.elements["domain[@type='#{type}']"]
            end

            if d_elem
                d_elem.elements.each('machine') { |m|
                    a_machines << m.text
                }

                # take only first found domain type
                unless a_machines.empty?
                    machines.concat(a_machines)
                    break
                end
            end
        }

        cmd = "virsh -r -c qemu:///system cpu-models #{a}"
        cpu_models, e, s = Open3.capture3(cmd)
        break unless s.success?

        cpu_models.each_line { |l|
            l.chomp!
            next if l.empty? or l =~ /all CPU models are accepted/i;
            models << l
        }
    }

    machines.uniq!
    models.uniq!

    puts "KVM_MACHINES=\"#{machines.join(' ')}\""
    puts "KVM_CPU_MODELS=\"#{models.join(' ')}\""

rescue
end


