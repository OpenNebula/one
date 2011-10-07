# -------------------------------------------------------------------------- #
# Copyright 2002-2011, OpenNebula Project Leads (OpenNebula.org)             #
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
require 'json'

module OpenNebula 
    ############################################################################
    # The Configuration Class represents a simple configuration file using 
    # OpenNebula syntax. It does not check syntax.
    ############################################################################
    class Configuration
        attr_reader :conf
        
        ########################################################################
        # Patterns to parse the Configuration File
        ########################################################################
        
        NAME_REG     =/[\w\d_-]+/
        VARIABLE_REG =/\s*(#{NAME_REG})\s*=\s*/
        
        SIMPLE_VARIABLE_REG =/#{VARIABLE_REG}([^\[]+?)(#.*)?/
        SINGLE_VARIABLE_REG =/^#{SIMPLE_VARIABLE_REG}$/
        ARRAY_VARIABLE_REG  =/^#{VARIABLE_REG}\[(.*?)\]/m
        
        ########################################################################
        ########################################################################

        def initialize(str)
            parse_conf(str)
        end
        
        def self.new_from_file(file)
            conf_file = File.read(file)
            self.new(conf_file)
        end

        def add_value(key, value)
            if @conf[key]
                if !@conf[key].kind_of?(Array)
                    @conf[key]=[@conf[key]]
                end
                @conf[key]<<value
            else
                @conf[key]=value
            end
        end

        def [](key)
            @conf[key.to_s.upcase]
        end

        def to_json
            JSON::generate(@conf) if @conf
        end

        ########################################################################
        ########################################################################
    private
        #
        #
        #
        def parse_conf(conf_file)
            @conf=Hash.new

            conf_file.scan(SINGLE_VARIABLE_REG) {|m|
                key=m[0].strip.upcase
                value=m[1].strip
            
                # hack to skip multiline VM_TYPE values
                next if %w{NAME TEMPLATE}.include? key.upcase
            
                add_value(key, value)
            }
        
            conf_file.scan(ARRAY_VARIABLE_REG) {|m|
                master_key=m[0].strip.upcase
                    
                pieces=m[1].split(',')
            
                vars=Hash.new
                pieces.each {|p|
                    key, value=p.split('=')
                    vars[key.strip.upcase]=value.strip
                }

                add_value(master_key, vars)
            }

        end
    end


    #
    # Test program for the Configuration Parser
    #
    if $0 == __FILE__

        require 'pp'

        conf=Configuration.new_from_file('cloud.conf')
        pp conf

    end
end