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

    # network script actions

    def execute_network_script(action, connection, message)
        driver=message.elements['NET_DRV'].text
        id=message.elements['VM/ID'].text

        vm_encoded=Base64.encode64(message.elements['VM'].to_s).delete("\n")

        result=[false, '']

        if(action_is_local?(action.to_s))
            script_path=File.join(
                @local_scripts_base_path,
                'vnm',
                driver,
                action.to_s)

            command="#{script_path} #{vm_encoded}"

            command_exe = LocalCommand.run(command, log_method(id))

            code=(command_exe.code==0)

            result=[code, command_exe]
        else
            script_path=File.join(
                @remote_scripts_base_path,
                'vnm',
                driver,
                action.to_s)

            command="#{script_path} #{vm_encoded}"

            pp command

            error_code=connection.run(command)

            pp error_code
            pp connection.stderr

            code=(error_code==0)

            result=[code, connection]
        end
    end


    # DEPLOY action, sends the deployment file to remote host
    def deploy(id, drv_message)
        data = decode(drv_message)

        local_dfile = data.elements['LOCAL_DEPLOYMENT_FILE'].text
        remote_dfile = data.elements['REMOTE_DEPLOYMENT_FILE'].text
        host= data.elements['HOST'].text

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

        ssh=SshStreamCommand.new(host, log_method(id))

        execute_network_script(:pre, ssh, data)

        pp ssh.run("cat << EOT | #{remote_scripts_path}/deploy #{dfile} #{host}",
                domain+"\nEOT\n")

        execute_network_script(:post, ssh, data)

        pp ssh.stdout
        pp ssh.stderr

        #do_action("#{dfile} #{host}", id, host, :deploy,
        #    :stdin => domain)
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
