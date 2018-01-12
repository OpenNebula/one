#!/usr/bin/env ruby

# -------------------------------------------------------------------------- #
# Copyright 2002-2018, OpenNebula Project, OpenNebula Systems                #
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

    Open3.popen3("virsh -c qemu:///system capabilities") {|i, o, e, t|
        if t.value.exitstatus != 0
            exit -1
        end

        capabilities = o.read
    }


    cap_xml = REXML::Document.new(capabilities)
    cap_xml = cap_xml.root

    GUEST_ARCHS.each { |a|
        a_elem = cap_xml.elements["guest/arch[@name='#{a}']"]
        next if !a_elem

        a_elem.elements.each('machine') { |m|
            machines << m.text
        }

        cpu_models = ""
        Open3.popen3("virsh -c qemu:///system cpu-models #{a}") {|i, o, e, t|
            break if t.value.exitstatus != 0

            cpu_models = o.read
        }

        cpu_models.each_line { |l|
            next if l.empty?
            models << l.chomp
        }
    }

    machines.uniq!
    models.uniq!

    puts "KVM_MACHINES=\"#{machines.join(' ')}\""
    puts "KVM_CPU_MODELS=\"#{models.join(' ')}\""

rescue
end


