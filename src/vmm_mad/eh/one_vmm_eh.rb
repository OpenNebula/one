#!/usr/bin/env ruby
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

EHAUTH = ENV["EHAUTH"]

if !EHAUTH
        puts "EHAUTH not set"
            exit -1
end

ONE_LOCATION=ENV["ONE_LOCATION"]

if !ONE_LOCATION
    RUBY_LIB_LOCATION="/usr/lib/one/ruby"
else
    RUBY_LIB_LOCATION=ONE_LOCATION+"/lib/ruby"
end

$: << RUBY_LIB_LOCATION

require 'pp'
require 'one_mad'
require 'open3'

class DM < ONEMad

    def initialize
        super(5, 4)
    end

    def action_init(args)

        send_message("INIT", "SUCCESS")

    end

    def action_deploy(args)

        action_number=args[1]
        action_host=args[2]
        remote_deployment_file=args[3]

        # Get local deployment file
        local_deployment_file=get_local_deployment_file(remote_deployment_file)

        std_action("DEPLOY", "elastichosts -f #{local_deployment_file} servers create", args)
        
    end

    def action_shutdown(args)

       std_action("SHUTDOWN", "elastichosts servers #{args[3]} shutdown", args)

    end

    def action_cancel(args)

       std_action("SHUTDOWN", "elastichosts servers #{args[3]} destroy", args)

    end

    def action_checkpoint(args)

        send_message("CHECKPOINT", "FAILURE", args[1], "action not supported for ElasticHost")

    end

    def action_save(args)

        send_message("SAVE", "FAILURE", args[1], "action not supported for ElasticHost")

    end

    def action_restore(args)

        send_message("RESTORE", "FAILURE", args[1], "action not supported for ElasticHost")

    end

    def action_poll(args)

        std = Open3.popen3("elastichosts servers #{args[3]} info; echo ExitCode: $? 1>&2")

        stdout=std[1].read
        stderr=std[2].read

        exit_code=get_exit_code(stderr)

        tx=0
        rx=0

        if exit_code=="0"
            stdout.each_line{|line|
                cols=line.split(" ")
                case cols[0]
                when "rx"
                    rx=cols[1]
                when "tx"
                    tx=cols[1]
                end
            }

        end

        send_message("POLL", "SUCCESS", args[1],"USEDCPU=0.0 NETTX=#{tx} NETRX=#{rx} USEDMEMORY=0")

    end

    ###########################
    # Common action functions #
    ###########################

    def std_action(action, command, args)

        std= Open3.popen3("#{command} ; echo ExitCode: $? 1>&2")

        stdout=std[1].read
        stderr=std[2].read

        exit_code=get_exit_code(stderr)

        if exit_code=="0"
            domain_name=args[3]
            if action=="DEPLOY"
               remote_deployment_file=args[3]

               # Get local deployment file
               local_deployment_file=get_local_deployment_file(remote_deployment_file)

               domain_name = stdout
            end
            send_message(action, "SUCCESS", args[1], domain_name)
        else
            error_message=get_error_message(stderr)
            send_message(action, "FAILURE", args[1], error_message)
        end

    end

    #########################################
    # Get information form xm create output #
    #########################################

    # From STDERR if exit code == 1
    def get_exit_code(str)
        tmp=str.scan(/^ExitCode:.*$/)[0]
        if tmp
            return tmp.split(' ')[1]
        else
            return -1
        end
    end

    # From STDERR if exit code == 1
    def get_error_message(str)
        tmp=str.split(/\n/)
        return "Unknown error" if !tmp[0]
        tmp[0]
    end

end

dm=DM.new
dm.loop