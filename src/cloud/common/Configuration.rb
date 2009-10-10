# -------------------------------------------------------------------------- #
# Copyright 2002-2009, Distributed Systems Architecture Group, Universidad   #
# Complutense de Madrid (dsa-research.org)                                   #
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

###############################################################################
# The Configuration Class represents a simple configuration file for the
# Cloud servers. It does not check syntax.
###############################################################################
class Configuration
  
    ###########################################################################
    # Patterns to parse the Configuration File
    ###########################################################################
    
    NAME_REG     =/[\w\d_-]+/
    VARIABLE_REG =/\s*(#{NAME_REG})\s*=\s*/
    
    SIMPLE_VARIABLE_REG =/#{VARIABLE_REG}([^\[]+?)(#.*)?/
    SINGLE_VARIABLE_REG =/^#{SIMPLE_VARIABLE_REG}$/
    ARRAY_VARIABLE_REG  =/^#{VARIABLE_REG}\[(.*?)\]/m
    
    ###########################################################################
    ###########################################################################

    def initialize(file)
        @conf=parse_conf(file)
    end
    
    def [](key)
        @conf[key.to_s.upcase]
    end

    ###########################################################################
    ###########################################################################

private
    
    #
    #
    #
    def add_value(conf, key, value)
        if conf[key]
            if !conf[key].kind_of?(Array)
                conf[key]=[conf[key]]
            end
            conf[key]<<value
        else
            conf[key]=value
        end
    end
    
    #
    #
    #
    def parse_conf(file)
        conf_file=File.read(file)
    
        conf=Hash.new

        conf_file.scan(SINGLE_VARIABLE_REG) {|m|
            key=m[0].strip.upcase
            value=m[1].strip
        
            # hack to skip multiline VM_TYPE values
            next if %w{NAME TEMPLATE}.include? key.upcase
        
            add_value(conf, key, value)
        }
    
        conf_file.scan(ARRAY_VARIABLE_REG) {|m|
            master_key=m[0].strip.upcase
                
            pieces=m[1].split(',')
        
            vars=Hash.new
            pieces.each {|p|
                key, value=p.split('=')
                vars[key.strip.upcase]=value.strip
            }

            add_value(conf, master_key, vars)
        }

        conf
    end
end


#
# Test program for the Configuration Parser
#
if $0 == __FILE__

    require 'pp'

    conf=Configuration.new('cloud.conf')
    pp conf

end
