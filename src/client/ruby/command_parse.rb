# -------------------------------------------------------------------------- #
# Copyright 2002-2010, OpenNebula Project Leads (OpenNebula.org)             #
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

require 'optparse'
require 'pp'

class CommandParse
    
    COMMANDS_HELP=<<-EOT
Commands:

EOT

    USAGE_BANNER=<<-EOT
Usage:
    onevm [<options>] <command> [<parameters>]

Options:
EOT

    ONE_VERSION=<<-EOT
OpenNebula 1.5.0
Copyright 2002-2010, OpenNebula Project Leads (OpenNebula.org)
EOT
    
    def initialize
        @options=Hash.new
    
        @cmdparse=OptionParser.new do |opts|
            opts.banner=text_banner
            
            opts.on("-l x,y,z", "--list x,y,z", Array, 
                    "Selects columns to display with list", "command") do |o|
                @options[:list]=o.collect {|c| c.to_sym }
            end
            
            opts.on("--list-columns", "Information about the columns available",
                    "to display, order or filter") do |o|
                puts list_options
                exit
            end
            
            opts.on("-o x,y,z", "--order x,y,z", Array, 
                    "Order by these columns, column starting",
                    "with - means decreasing order") do |o|
                @options[:order]=o
            end
            
            opts.on("-f x,y,z", "--filter x,y,z", Array,
                    "Filter data. An array is specified", "with column=value pairs.") do |o|
                @options[:filter]=Hash.new
                o.each {|i|
                    k,v=i.split('=')
                    @options[:filter][k]=v
                }
            end
            
            opts.on("-d seconds", "--delay seconds", Integer,
                    "Sets the delay in seconds for top", "command") do |o|
                @options[:delay]=o
            end

            opts.on("-v", "--verbose", 
                    "Tells more information if the command",
                    "is successful") do |o|
                @options[:verbose]=true
            end

            opts.on("-x", "--xml",
                    "Returns xml instead of human readable text") do |o|
                @options[:xml]=true
            end
            
            opts.on_tail("-h", "--help", "Shows this help message") do |o|
                print_help
                exit
            end
            
            opts.on_tail("--version", 
                        "Shows version and copyright information") do |o|
                puts text_version
                exit
            end
        end
    end

    def parse(args)
        begin
            @cmdparse.parse!(args)
        rescue => e
            puts e.message
            exit -1
        end
    end
    
    def options
        @options
    end
    
    def print_help
        puts @cmdparse
        puts
        puts text_commands
    end
    
    def text_commands
        COMMANDS_HELP
    end
    
    def text_command_name
        "onevm"
    end
    
    def text_banner
        USAGE_BANNER.gsub("onevm", text_command_name)
    end
    
    def text_version
        ONE_VERSION
    end
    
    def list_options
        "<list options>\n\n"
    end
end

