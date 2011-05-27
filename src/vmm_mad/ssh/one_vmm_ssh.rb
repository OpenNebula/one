#!/usr/bin/env ruby

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


# Set up the environment for the driver

ONE_LOCATION = ENV["ONE_LOCATION"]

if !ONE_LOCATION
    RUBY_LIB_LOCATION = "/usr/lib/one/ruby"
    ETC_LOCATION      = "/etc/one/"
else
    RUBY_LIB_LOCATION = ONE_LOCATION + "/lib/ruby"
    ETC_LOCATION      = ONE_LOCATION + "/etc/"
end

$: << RUBY_LIB_LOCATION

require "VirtualMachineDriver"
require 'getoptlong'

# The main class for the Sh driver
class SshDriver < VirtualMachineDriver

    # SshDriver constructor
    def initialize(hypervisor, threads, retries, local_actions)
        super(threads, true, retries, "vmm/#{hypervisor}", local_actions)

        @hypervisor  = hypervisor
    end

    # DEPLOY action, sends the deployment file to remote host
    def deploy(id, host, remote_dfile, not_used)
        local_dfile = get_local_deployment_file(remote_dfile)

        if !local_dfile || File.zero?(local_dfile)
            send_message(ACTION[:deploy],RESULT[:failure],id,
                "Can not open deployment file #{local_dfile}")
            return
        end

        tmp    = File.new(local_dfile)
        domain = tmp.read
        tmp.close()

        if action_is_local?(:deploy)
            dfile=local_dfile
        else
            dfile=remote_dfile
        end

        do_action("#{dfile} #{host}", id, host, :deploy,
            :stdin => domain)
    end

    # Basic Domain Management Operations

    def shutdown(id, host, deploy_id, not_used)
        do_action("#{deploy_id} #{host}", id, host, :shutdown)
    end

    def cancel(id, host, deploy_id, not_used)
        do_action("#{deploy_id} #{host}", id, host, :cancel)
    end

    def save(id, host, deploy_id, file)
        do_action("#{deploy_id} #{file} #{host}", id, host, :save)
    end

    def restore(id, host, deploy_id, file)
        do_action("#{file} #{host}", id, host, :restore)
    end

    def migrate(id, host, deploy_id, dest_host)
        do_action("#{deploy_id} #{dest_host} #{host}", id, host, :migrate)
    end

    def poll(id, host, deploy_id, not_used)
        do_action("#{deploy_id} #{host}", id, host, :poll)
    end
end

# SshDriver Main program
opts = GetoptLong.new(
    [ '--retries',    '-r', GetoptLong::OPTIONAL_ARGUMENT ],
    [ '--threads',    '-t', GetoptLong::OPTIONAL_ARGUMENT ],
    [ '--local',      '-l', GetoptLong::REQUIRED_ARGUMENT ]
)

hypervisor      = ''
retries         = 0
threads         = 15
local_actions   = {}

begin
    opts.each do |opt, arg|
        case opt
            when '--retries'
                retries   = arg.to_i
            when '--threads'
                threads   = arg.to_i
            when '--local'
                local_actions=OpenNebulaDriver.parse_actions_list(arg)
        end
    end
rescue Exception => e
    exit(-1)
end

if ARGV.length >= 1
    hypervisor = ARGV.shift
else
    exit(-1)
end

ssh_driver = SshDriver.new(hypervisor, threads, retries, local_actions)
ssh_driver.start_driver
