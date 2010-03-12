#!/usr/bin/env ruby

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


class HookManagerDriver < OpenNebulaDriver
    def initialize(num)
        super(num, true)

        register_action(:EXECUTE, method("action_execute"))
    end

    def action_execute(number, hook_name, host, script, *arguments)
        cmd=nil
        cmd_string="#{script} #{arguments.join(' ')}"

        if host.upcase=="LOCAL"
            cmd=LocalCommand.run(cmd_string, log_method(number))
        else
            cmd=SSHCommand.run("'#{cmd_string}'", host, log_method(number))
        end

        if cmd.code==0
            send_message("EXECUTE", RESULT[:success], number, hook_name)
        else
            send_message("EXECUTE", RESULT[:failure], number, hook_name)
        end
    end
end

hm=HookManagerDriver.new(15)
hm.start_driver

