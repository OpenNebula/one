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

# ---------------------------------------------------------------------------- #
# Set up the environment for the driver                                        #
# ---------------------------------------------------------------------------- #

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

# ---------------------------------------------------------------------------- #
# The main class for the Sh driver                                        #
# ---------------------------------------------------------------------------- #
class SshDriver < VirtualMachineDriver
    # ------------------------------------------------------------------------ #
    # SshDriver constructor                                                #
    # ------------------------------------------------------------------------ #
    def initialize(hypervisor)
        super(15,true)
        
        @config = read_configuration
        
        @hypervisor = hypervisor
        @remote_dir = @config['SCRIPTS_REMOTE_DIR'] || '/tmp/one'
    end

    # ------------------------------------------------------------------------ #
    # DEPLOY action, sends the deployment file to remote host                  #
    # ------------------------------------------------------------------------ #
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

        cmd = "#{@remote_dir}/vmm/#{@hypervisor}/deploy #{remote_dfile}"

        deploy_exe = SSHCommand.run(cmd, host, log_method(id), domain)


        if deploy_exe.code != 0
            send_message(ACTION[:deploy],RESULT[:failure],id)
       else
            send_message(ACTION[:deploy],RESULT[:success],id,deploy_exe.stdout)
        end
    end

    # ------------------------------------------------------------------------ #
    # Basic Domain Management Operations                                       #
    # ------------------------------------------------------------------------ #
    def shutdown(id, host, deploy_id, not_used)
        ssh_action("#{@remote_dir}/vmm/#{@hypervisor}/shutdown #{deploy_id}",
                    id, host, :shutdown)
    end

    def cancel(id, host, deploy_id, not_used)
        ssh_action("#{@remote_dir}/vmm/#{@hypervisor}/cancel #{deploy_id}",
                    id, host, :cancel)
    end

    def save(id, host, deploy_id, file)
        ssh_action("#{@remote_dir}/vmm/#{@hypervisor}/save #{deploy_id} #{file}",
                    id, host, :save)
    end

    def restore(id, host, deploy_id, file)
        ssh_action("#{@remote_dir}/vmm/#{@hypervisor}/restore #{file}",
                    id, host, :restore)
    end

    def migrate(id, host, deploy_id, dest_host)
        ssh_action("#{@remote_dir}/vmm/#{@hypervisor}/migrate #{deploy_id} #{dest_host}",
                    id, host, :migrate)
    end

    def poll(id, host, deploy_id, not_used)
        cmd = "#{@remote_dir}/vmm/#{@hypervisor}/poll #{deploy_id}"

        poll_exe = SSHCommand.run(cmd, host, log_method(id))

        if poll_exe.code != 0
            send_message(ACTION[:poll],RESULT[:failure],id)
        else
            send_message(ACTION[:poll],RESULT[:success],id,poll_exe.stdout)
        end
    end
end

# ---------------------------------------------------------------------------- #
# SshDriver Main program
# ---------------------------------------------------------------------------- #
hypervisor = ARGV[0]

ssh_driver = SshDriver.new(hypervisor)
ssh_driver.start_driver
