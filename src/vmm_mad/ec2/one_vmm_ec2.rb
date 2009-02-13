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

EC2_LOCATION = ENV["EC2_HOME"]

if !EC2_LOCATION
    puts "EC2_HOME not set"
    exit(-1)
end

ONE_LOCATION=ENV["ONE_LOCATION"]

if !ONE_LOCATION
    RUBY_LIB_LOCATION="/usr/lib/one/ruby"
else
    RUBY_LIB_LOCATION=ONE_LOCATION+"/lib/ruby"
end

$: << RUBY_LIB_LOCATION

require 'pp'
require "VirtualMachineDriver"
require "CommandManager"
require "rexml/document"

class EC2Driver < VirtualMachineDriver

    EC2 = {
        :run       => "#{EC2_LOCATION}/bin/ec2-run-instances",
        :terminate => "#{EC2_LOCATION}/bin/ec2-terminate-instances",
        :describe  => "#{EC2_LOCATION}/bin/ec2-describe-instances",
        :associate => "#{EC2_LOCATION}/bin/ec2-associate-address",
        :authorize => "#{EC2_LOCATION}bin/ec2-authorize"
    }

    def initialize
        super(15,true)
    end

    def deploy(id, host, remote_dfile, not_used)

        local_dfile = get_local_deployment_file(remote_dfile)

        if !local_dfile
            send_message(ACTION[:deploy],RESULT[:failure],id,
                "Can not open deployment file #{local_dfile}")
            return
        end

        tmp = File.new(local_dfile)
        xml = REXML::Document.new tmp
        tmp.close()

        ec2 = xml.root.elements["EC2"]

        if !ec2
            send_message(ACTION[:deploy],RESULT[:failure],id,
                "Can not find EC2 element in deployment file #{local_dfile}")
            return
        end

        ami     = ec2_value(ec2,"AMI")
        keypair = ec2_value(ec2,"KEYPAIR")
        eip     = ec2_value(ec2,"ELASTICIP")
        ports   = ec2_value(ec2,"AUTHORIZEDPORTS")
        type    = ec2_value(ec2,"INSTANCETYPE")

        deploy_cmd = "#{EC2[:run]} #{ami} -k #{keypair} -t #{type}"
        deploy_exe = LocalCommand.run(deploy_cmd, log_method(id))

        if deploy_exe.code != 0
            send_message(ACTION[:deploy],RESULT[:failure],id)
            return
        end

        if !deploy_exe.stdout.match(/^INSTANCE\s*(.+?)\s/)
            send_message(ACTION[:deploy],RESULT[:failure],id,
                "Could not find instance id. Check ec2-describe-instances")
            return
        end

        deploy_id = $1

        if eip
            ip_cmd = "#{EC2[:associate]} #{eip} -i #{deploy_id}"
            ip_exe = LocalCommand.run(ip_cmd, log_method(id))
        end

        if ports
            ports_cmd = "#{EC2[:authorize]} default -p #{ports}"
            ports_exe = LocalCommand.run(ports_cmd, log_method(id))
        end

        send_message(ACTION[:deploy],RESULT[:success],id,deploy_id)
    end

    def shutdown(id, host, deploy_id, not_used)
        ec2_terminate(ACTION[:shutdown], id, deploy_id)
    end

    def cancel(id, host, deploy_id, not_used)
        ec2_terminate(ACTION[:cancel], id, deploy_id)
    end

    def poll(id, host, deploy_id, not_used)

        info =  "#{POLL_ATTRIBUTE[:usedmemory]}=0 " \
                "#{POLL_ATTRIBUTE[:usedcpu]}=0 " \
                "#{POLL_ATTRIBUTE[:nettx]}=0 " \
                "#{POLL_ATTRIBUTE[:netrx]}=0"

        cmd  = "#{EC2[:describe]} #{deploy_id}"
        exe  = LocalCommand.run(cmd, log_method(id))

        if exe.code != 0
            send_message(ACTION[:poll],RESULT[:failure],id)
            return
        end

        exe.stdout.match(Regexp.new("INSTANCE\\s+#{deploy_id}\\s+(.+)"))

        if !$1
            info << " #{POLL_ATTRIBUTE[:state]}=#{VM_STATE[:deleted]}"
        else
            monitor_data = $1.split(/\s+/)

            case monitor_data[3]
                when "pending","running"
                    info << " #{POLL_ATTRIBUTE[:state]}=#{VM_STATE[:active]}"
                when "shutting-down","terminated"
                    info << " #{POLL_ATTRIBUTE[:state]}=#{VM_STATE[:deleted]}"
            end

            info << " IP=#{monitor_data[1]}"
        end

        send_message(ACTION[:poll], RESULT[:success], id, info)
    end

private

    def ec2_terminate(action, id, deploy_id)
        cmd = "#{EC2_LOCATION}/bin/ec2-terminate-instances #{deploy_id}"
        exe = LocalCommand.run(cmd, log_method(id))

        if exe.code != 0
            result = RESULT[:failure]
        else
            result = RESULT[:success]
        end

        send_message(action,result,id)
    end

    def ec2_value(xml,name)
        value   = nil
        element = xml.elements[name]
        value   = element.text.strip if element

        return value
    end
end

ec2_driver = EC2Driver.new
ec2_driver.start_driver
