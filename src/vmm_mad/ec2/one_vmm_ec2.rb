#!/usr/bin/env ruby
# -------------------------------------------------------------------------- #
# Copyright 2002-2008, Distributed Systems Architecture Group, Universidad   #
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

VMWARECMD="/usr/bin/"

ONE_LOCATION = ENV["ONE_LOCATION"]
EC2_LOCATION = ENV["EC2_HOME"]


if !ONE_LOCATION
        puts "ONE_LOCATION not set"
            exit -1
end

if !EC2_LOCATION
        puts "EC2_LOCATION not set"
            exit -1
end

$: << ONE_LOCATION+"/lib/ruby"


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

        pkeypair = ""
        paminame = ""
        pinstance = ""
        pports = ""

        File.read(args[3]).split(/\n/).each{|line|

            result = line.split(/=/)

            pkeypair = result[1] if result[0] == "keypair"

            paminame = result[1] if result[0] == "aminame"

            pinstance = result[1] if result[0] == "instancetype"

            pports = result[1] if result[0] == "authorizedports"
        }

        std_action("DEPLOY", "#{EC2_LOCATION}bin/ec2-run-instances #{paminame} -k #{pkeypair} -t #{pinstance}", args)

        Open3.popen3("#{EC2_LOCATION}bin/ec2-authorize default -p #{pports}; echo ExitCode: $? 1>&2") if !pports.empty?

    end

    def action_shutdown(args)

       std_action("SHUTDOWN", "#{EC2_LOCATION}bin/ec2-terminate-instances #{args[3]}", args)

    end

    def action_cancel(args)

       std_action("CANCEL", "#{EC2_LOCATION}bin/ec2-terminate-instances #{args[3]}", args)

    end

    def action_checkpoint(args)

        send_message("CHECKPOINT", "FAILURE", args[1], "action not supported for EC2")

    end

    def action_save(args)

        send_message("SAVE", "FAILURE", args[1], "action not supported for EC2")

    end

    def action_restore(args)

        send_message("RESTORE", "FAILURE", args[1], "action not supported for EC2")

    end

    def action_poll(args)

        std = Open3.popen3("#{EC2_LOCATION}bin/ec2-describe-instances #{args[3]}; echo ExitCode: $? 1>&2")

        stdout=std[1].read
        stderr=std[2].read

        exit_code=get_exit_code(stderr)

        ip_address = "N/A"

        if exit_code=="0"
            stdout.split(/\n/).each{|line|
            result = line.squeeze(" ").split(/\t/)
            if result[0] == "INSTANCE" then
                ip_address = result[3]
                break
            end
            }

        end

        send_message("POLL", "SUCCESS", args[1],"USEDCPU=0.0 NETTX=0 NETRX=0 USEDMEMORY=0 IP=#{ip_address}")

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
            domain_name=""
            if action=="DEPLOY"

                domain_name = "id_not_found"

                stdout.split(/\n/).each{|line|
                    result = line.squeeze(" ").split(/\t/)
                    if result[0] == "INSTANCE" then
                        domain_name = result[1]
                        break
                    end
                }

                pelasticip=""

                File.read(args[3]).split(/\n/).each{|line|

                    result = line.split(/=/)

                    if result[0] == "elasticip"

                        pelasticip = result[1]

                        Open3.popen3("#{EC2_LOCATION}bin/ec2-associate-address #{pelasticip} -i #{domain_name}; echo ExitCode: $? 1>&2")

                        break
                    end
                }

            else
                domain_name=get_domain_name(stdout)
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
        #puts "scanninge error code.... >>" + str + "<<"
        tmp=str.scan(/^ExitCode:.*$/)[0]
        if tmp
            return tmp.split(' ')[1]
        else
            return -1
        end
    end

    # From STDERR if exit code == 1
    def get_error_message(str)
        #puts "escanenado el mensaje del error ..." + str
        tmp=str.split(/\n/)
        return "Unknown error" if !tmp[0]
        tmp[0]
    end

    # From STDOUT if exit code == 0
    def get_domain_name(str)
        tmp=str.scan(/(hard) = 1$/)
        #puts "get_domain_name " + str
        return nil if !tmp[0]
        tmp[0][0]
    end

end

dm=DM.new
dm.loop
