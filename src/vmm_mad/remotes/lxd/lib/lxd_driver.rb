#!/usr/bin/ruby

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

require_relative 'container'
require_relative 'client'
require_relative '/var/tmp/one/scripts_common'

ONE_LOCATION = ENV['ONE_LOCATION'] unless defined?(ONE_LOCATION)

if !ONE_LOCATION
    RUBY_LIB_LOCATION = '/usr/lib/one/ruby' unless defined?(RUBY_LIB_LOCATION)
else
    RUBY_LIB_LOCATION = ONE_LOCATION + '/lib/ruby' unless defined?(RUBY_LIB_LOCATION)
end

$LOAD_PATH << RUBY_LIB_LOCATION

require 'opennebula'

module LXDdriver

    SEP = '-' * 40

    # Container Info
    class Info < Hash

        attr_accessor :xml

        TEMPLATE_PREFIX = '//TEMPLATE/'

        def initialize(xml)
            self.xml = xml
            self['name'] = 'one-' + single_element('ID')
            self['config'] = {}
            self['devices'] = {}
            memory
            cpu
            network
            # storage
            # context
            # vnc
        end

        # Creates a dictionary for LXD containing $MEMORY RAM allocated
        def memory
            ram = single_element_pre('MEMORY')
            ram = ram.to_s + 'MB'
            self['config']['limits.memory'] = ram
        end

        # Creates a dictionary for LXD  $CPU percentage and cores
        def cpu
            cpu = single_element_pre('CPU')
            vcpu = single_element_pre('VCPU')
            cpu = (cpu.to_f * 100).to_i.to_s + '%'
            self['config']['limits.cpu.allowance'] = cpu
            self['config']['limits.cpu'] = vcpu
        end

        def network
            nics = multiple_elements_pre('NIC')
            nics.each do |nic|
                info = nic['NIC']
                name = "eth#{info['NIC_ID']}"
                eth = { 'name' => name, 'host_name' => info['TARGET'],
                        'parent' => info['BRIDGE'], 'hwaddr' => info['MAC'],
                        'nictype' => 'bridged', 'type' => 'nic' }

                # Optional args
                eth['limits.ingress'] = info['INBOUND_AVG_BW'] if info['INBOUND_AVG_BW']
                eth['limits.egress'] = info['OUTBOUND_AVG_BW'] if info['OUTBOUND_AVG_BW']

                self['devices'][name] = eth
            end
        end

        def storage; end

        def vnc; end

        # Returns PATH's instance in XML
        def single_element(path)
            xml[path]
        end

        def single_element_pre(path)
            single_element(TEMPLATE_PREFIX + path)
        end

        # Returns an Array with PATH's instances in XML
        def multiple_elements(path)
            elements = []
            xml.retrieve_xmlelements(path).each {|d| elements.append(d.to_hash) }
            elements
        end

        def multiple_elements_pre(path)
            multiple_elements(TEMPLATE_PREFIX + path)
        end

    end

end
