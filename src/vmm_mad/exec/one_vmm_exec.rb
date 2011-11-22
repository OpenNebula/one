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

require 'ssh_stream'
require 'pp'

# The main class for the Sh driver
class ExecDriver < VirtualMachineDriver

    # SshDriver constructor
    def initialize(hypervisor, options={})
        @options={
            :threaded => true
        }.merge!(options)
        
        super("vmm/#{hypervisor}", @options)

        @hypervisor  = hypervisor
    end

    # DEPLOY action, sends the deployment file to remote host
    def deploy(id, drv_message)
        data = decode(drv_message)

        local_dfile  = data.elements['LOCAL_DEPLOYMENT_FILE'].text
        remote_dfile = data.elements['REMOTE_DEPLOYMENT_FILE'].text

        host = data.elements['HOST'].text

        if !local_dfile || File.zero?(local_dfile)
            send_message(ACTION[:deploy],RESULT[:failure],id,
                "Can not open deployment file #{local_dfile}")
            return
        end

        domain = File.read(local_dfile)

        if action_is_local?(:deploy)
            dfile = local_dfile
        else
            dfile = remote_dfile
        end

        ssh = SshStreamCommand.new(host, log_method(id))
        vnm = VirtualNetworkDriver.new(data.elements['NET_DRV'].text,
                                     :local_actions => @options[:local_actions],
                                     :message    => data,
                                     :ssh_stream => ssh)
         
        result, info = vnm.do_action(id, :pre)

        if failed?(result)
            send_message(:deploy,result,id,info)
            return
        end

        result, info = do_action("#{dfile} #{host}", id, host, :deploy, 
                                 :stdin      => domain,
                                 :ssh_stream => ssh,
                                 :respond    => false)

        if failed?(result)
            send_message(:deploy,result,id,info)
            return
        end

        domain_id = info

        result, info = vnm.do_action(id, :post)

        if failed?(result)
            send_message(:deploy,result,id,info)
            return
        end

        send_message(:deploy,RESULT[:success],id,domain_id)
    end

    # Basic Domain Management Operations

    def shutdown(id, drv_message)
        data        = decode(drv_message)
        host        = data['HOST']
        deploy_id   = data['DEPLOY_ID']

        do_action("#{deploy_id} #{host}", id, host, :shutdown)
    end

    def cancel(id, drv_message)
        data        = decode(drv_message)
        host        = data['HOST']
        deploy_id   = data['DEPLOY_ID']

        do_action("#{deploy_id} #{host}", id, host, :cancel)
    end

    def save(id, drv_message)
        data        = decode(drv_message)
        host        = data['HOST']
        deploy_id   = data['DEPLOY_ID']
        file        = data['CHECKPOINT_FILE']

        do_action("#{deploy_id} #{file} #{host}", id, host, :save)
    end

    def restore(id, drv_message)
        data        = decode(drv_message)
        host        = data['HOST']
        file        = data['CHECKPOINT_FILE']

        do_action("#{file} #{host}", id, host, :restore)
    end

    def migrate(id, drv_message)
        data        = decode(drv_message)
        host        = data['HOST']
        deploy_id   = data['DEPLOY_ID']

        do_action("#{deploy_id} #{dest_host} #{host}", id, host, :migrate)
    end

    def poll(id, drv_message)
        data        = decode(drv_message)
        host        = data['HOST']
        deploy_id   = data['DEPLOY_ID']

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

exec_driver = ExecDriver.new(hypervisor,
                :concurrency => threads,
                :retries => retries,
                :local_actions => local_actions)

exec_driver.start_driver
