#!/usr/bin/env ruby

# -------------------------------------------------------------------------- #
# Copyright 2002-2012, OpenNebula Project Leads (OpenNebula.org)             #
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

ONE_LOCATION=ENV["ONE_LOCATION"]

if !ONE_LOCATION
    RUBY_LIB_LOCATION="/usr/lib/one/ruby"
    ETC_LOCATION="/etc/one/"
else
    RUBY_LIB_LOCATION=ONE_LOCATION+"/lib/ruby"
    ETC_LOCATION=ONE_LOCATION+"/etc/"
end

$: << RUBY_LIB_LOCATION

require 'pp'
require 'OpenNebulaDriver'
require 'CommandManager'
require 'TMScript'


class TransferManager < OpenNebulaDriver

    def initialize(plugin, options={})
        @options={
            :threaded => true
        }.merge!(options)

        super('', @options)

        @plugin=plugin

        # register actions
        register_action(:TRANSFER, method("action_transfer"))
    end

    def action_transfer(number, script_file)
        script_text=""

        if File.exist?(script_file)
            open(script_file) {|f|
                script_text=f.read
            }

            script=TMScript.new(script_text, log_method(number))
            res=script.execute(@plugin)

            if res[0]
                send_message("TRANSFER", RESULT[:success], number)
            else
                send_message("TRANSFER", RESULT[:failure], number, res[1])
            end
        else
            send_message("TRANSFER", RESULT[:failure], number,
                "Transfer file not found: #{script_file}")
        end
    end

end

tm_conf=ARGV[0]

if !tm_conf
    puts "You need to specify config file."
    exit(-1)
end

tm_conf=ETC_LOCATION+tm_conf if tm_conf[0] != ?/

plugin=TMPlugin.new(tm_conf)

tm=TransferManager.new(plugin,
    :concurrency => 15)

tm.start_driver




