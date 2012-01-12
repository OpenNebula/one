#!/usr/bin/env ruby
# ---------------------------------------------------------------------------- #
# Copyright 2002-2012, OpenNebula Project Leads (OpenNebula.org)             #
#                                                                              #
# Licensed under the Apache License, Version 2.0 (the "License"); you may      #
# not use this file except in compliance with the License. You may obtain      #
# a copy of the License at                                                     #
#                                                                              #
# http://www.apache.org/licenses/LICENSE-2.0                                   #
#                                                                              #
# Unless required by applicable law or agreed to in writing, software          #
# distributed under the License is distributed on an "AS IS" BASIS,            #
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.     #
# See the License for the specific language governing permissions and          #
# limitations under the License.                                               #
# ---------------------------------------------------------------------------- #

# Set up the environment for the driver

EC2_LOCATION = ENV["EC2_HOME"]

if !EC2_LOCATION
    puts "EC2_HOME not set"
    exit(-1)
end

EC2_JVM_CONCURRENCY = ENV["EC2_JVM_CONCURRENCY"]

ONE_LOCATION = ENV["ONE_LOCATION"]

if !ONE_LOCATION
    RUBY_LIB_LOCATION = "/usr/lib/one/ruby"
    ETC_LOCATION      = "/etc/one/"
else
    RUBY_LIB_LOCATION = ONE_LOCATION + "/lib/ruby"
    ETC_LOCATION      = ONE_LOCATION + "/etc/"
end

$: << RUBY_LIB_LOCATION

require 'pp'
require "VirtualMachineDriver"
require "CommandManager"
require "rexml/document"

# The main class for the EC2 driver
class EC2Driver < VirtualMachineDriver

    # EC2 commands constants
    EC2 = {
        :run       => "#{EC2_LOCATION}/bin/ec2-run-instances",
        :terminate => "#{EC2_LOCATION}/bin/ec2-terminate-instances",
        :describe  => "#{EC2_LOCATION}/bin/ec2-describe-instances",
        :associate => "#{EC2_LOCATION}/bin/ec2-associate-address",
        :reboot    => "#{EC2_LOCATION}/bin/ec2-reboot-instances",
        :authorize => "#{EC2_LOCATION}/bin/ec2-authorize"
    }

    # EC2 constructor, loads defaults for the EC2Driver
    def initialize(ec2_conf = nil)

        if !EC2_JVM_CONCURRENCY
            concurrency = 5
        else
            concurrency = EC2_JVM_CONCURRENCY.to_i
        end

        super('',
            :concurrency => concurrency,
            :threaded => true
        )

        @defaults = Hash.new

        if ec2_conf && File.exists?(ec2_conf)
            fd  = File.new(ec2_conf)
            xml = REXML::Document.new fd
            fd.close()

            return if !xml || !xml.root

            ec2 = xml.root.elements["EC2"]

            return if !ec2

            @defaults["KEYPAIR"]         = ec2_value(ec2,"KEYPAIR")
            @defaults["AUTHORIZEDPORTS"] = ec2_value(ec2,"AUTHORIZEDPORTS")
            @defaults["INSTANCETYPE"]    = ec2_value(ec2,"INSTANCETYPE")
        end
    end

    # DEPLOY action, also sets ports and ip if needed
    def deploy(id, drv_message)
        msg = decode(drv_message)

        host        = msg.elements["HOST"].text

        local_dfile = msg.elements["LOCAL_DEPLOYMENT_FILE"].text

        if !local_dfile
            send_message(ACTION[:deploy],RESULT[:failure],id,
                "Can not open deployment file #{local_dfile}")
            return
        end

        tmp = File.new(local_dfile)
        xml = REXML::Document.new tmp
        tmp.close()

        ec2 = nil

        all_ec2_elements = xml.root.get_elements("EC2")

        # First, let's see if we have an EC2 site that matches
        # our desired host name
        all_ec2_elements.each { |element|
            cloud=element.elements["CLOUD"]
            if cloud and cloud.text.upcase == host.upcase
                ec2 = element
            end
        }

        if !ec2
            # If we don't find the EC2 site, and ONE just
            # knows about one EC2 site, let's use that
            if all_ec2_elements.size == 1
                ec2 = all_ec2_elements[0]
            else
                send_message(ACTION[:deploy],RESULT[:failure],id,
                    "Can not find EC2 element in deployment file "<<
                    "#{local_dfile} or couldn't find any EC2 site matching "<<
                    "one of the template.")
                return
            end
        end

        ami     = ec2_value(ec2,"AMI")
        keypair = ec2_value(ec2,"KEYPAIR")
        eip     = ec2_value(ec2,"ELASTICIP")
        ports   = ec2_value(ec2,"AUTHORIZEDPORTS")
        type    = ec2_value(ec2,"INSTANCETYPE")

        if !ami
            send_message(ACTION[:deploy],RESULT[:failure],id,
                "Can not find AMI in deployment file #{local_dfile}")
            return
        end

        deploy_cmd = "#{EC2[:run]} #{ami}"
        deploy_cmd << " -k #{keypair}" if keypair
        deploy_cmd << " -t #{type}" if type

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

    # Shutdown a EC2 instance
    def shutdown(id, drv_message)
        msg = decode(drv_message)

        host      = msg.elements["HOST"].text
        deploy_id = msg.elements["DEPLOY_ID"].text

        ec2_terminate(ACTION[:shutdown], id, deploy_id)
    end
   
    # Reboot a EC2 instance 
    def reboot(id, drv_message)
        cmd = "#{EC2_LOCATION}/bin/ec2-reboot-instances #{deploy_id}"
        exe = LocalCommand.run(cmd, log_method(id))

        if exe.code != 0
            result = RESULT[:failure]
        else
            result = RESULT[:success]
        end

        send_message(action,result,id)
    end

    # Cancel a EC2 instance
    def cancel(id, drv_message)
        msg = decode(drv_message)

        host      = msg.elements["HOST"].text
        deploy_id = msg.elements["DEPLOY_ID"].text

        ec2_terminate(ACTION[:cancel], id, deploy_id)
    end

    # Get info (IP, and state) for a EC2 instance
    def poll(id, drv_message)
        msg = decode(drv_message)

        host      = msg.elements["HOST"].text
        deploy_id = msg.elements["DEPLOY_ID"].text

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
                when "pending"
                    info << " #{POLL_ATTRIBUTE[:state]}=#{VM_STATE[:active]}"
                when "running"
                    info<<" #{POLL_ATTRIBUTE[:state]}=#{VM_STATE[:active]}"<<
                        " IP=#{monitor_data[1]}"
                when "shutting-down","terminated"
                    info << " #{POLL_ATTRIBUTE[:state]}=#{VM_STATE[:deleted]}"
            end
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
        value   = element.text.strip if element && element.text

        if !value
            value = @defaults[name]
        end

        return value
    end
end

# EC2Driver Main program

ec2_conf = ARGV.last

if ec2_conf
    ec2_conf = ETC_LOCATION + ec2_conf if ec2_conf[0] != ?/
end

ec2_driver = EC2Driver.new(ec2_conf)
ec2_driver.start_driver
