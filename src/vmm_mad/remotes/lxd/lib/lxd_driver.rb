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

ONE_LOCATION = ENV['ONE_LOCATION'] unless defined?(ONE_LOCATION)

if !ONE_LOCATION
    RUBY_LIB_LOCATION = '/usr/lib/one/ruby' unless defined?(RUBY_LIB_LOCATION)
else
    RUBY_LIB_LOCATION = ONE_LOCATION + '/lib/ruby' unless defined?(RUBY_LIB_LOCATION)
end

$LOAD_PATH << RUBY_LIB_LOCATION
$LOAD_PATH << File.dirname(__FILE__)

require 'opennebula'
require 'client'
require 'container'

module LXDdriver

    # Container Info
    class Info < Hash

        attr_accessor :xml

        TEMPLATE_PREFIX = '//TEMPLATE/'

        def initialize(xml)
            self.xml = xml
            self['name'] = ''
            self['config'] = {}
            self['devices'] = {}
        end

        def name
            name = single_element('ID')
            self['name'] = 'one-' + name.to_s
        end

        # Creates a dictionary for LXD containing $MEMORY RAM allocated
        def memory
            ram = single_element(TEMPLATE_PREFIX + 'MEMORY')
            ram = ram.to_s + 'MB'
            self['config'].merge!({ 'limits.memory' => ram })
        end

        # Creates a dictionary for LXD containing $CPU percentage per core assigned to the container
        def cpu
            cpu = single_element(TEMPLATE_PREFIX + 'CPU')
            cpu = (cpu.to_f * 100).to_i.to_s + '%'
            self['config'].merge!({ 'limits.cpu.allowance' => cpu })
        end

        # Returns PATH's instance in XML
        def single_element(path)
            xml[path]
        end

        # Returns an Array with PATH's instances in XML
        def multiple_elements(path)
            elements = []
            xml.retrieve_xmlelements(path).each {|d| elements.append(d.to_hash) }
            elements
        end

    end

end
