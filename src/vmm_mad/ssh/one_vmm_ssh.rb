#!/usr/bin/env ruby

# -------------------------------------------------------------------------.- #
# Copyright 2002-2010, OpenNebula Project Leads (OpenNebula.org)              #
#                                                                             #
# Licensed under the Apache License, Version 2.0 (the "License"); you may     #
# not use this file except in compliance with the License. You may obtain     #
# a copy of the License at                                                    #
#                                                                             #
# http://www.apache.org/licenses/LICENSE-2.0                                  #
#                                                                             #
# Unless required by applicable law or agreed to in writing, software         #
# distributed under the License is distributed on an "AS IS" BASIS,           #
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.    #
# See the License for the specific language governing permissions and         #
# limitations under the License.                                              #
#---------------------------------------------------------------------------- #

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

# ---------------------------------------------------------------------------- 
# The main class for the Sh driver
# ---------------------------------------------------------------------------- 
class SshDriver < VirtualMachineDriver
    # ------------------------------------------------------------------------ 
    # SshDriver constructor                                                
    # ------------------------------------------------------------------------ 
    def initialize(hypervisor, threads, retries, localpoll)
        super(threads,true,retries)
        
        @config = read_configuration
        
        @hypervisor  = hypervisor
        @remote_dir  = @config['SCRIPTS_REMOTE_DIR']
        @remote_path = "#{@config['SCRIPTS_REMOTE_DIR']}/vmm/#{@hypervisor}"
        
        if ONE_LOCATION == nil 
            @actions_path = "/usr/lib/one"
        else
            @actions_path = "#{ENV['ONE_LOCATION']}/lib"
        end

        @actions_path << "/remotes/vmm/#{hypervisor}"

        @localpoll  = localpoll
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

        remotes_action("#{@remote_path}/deploy #{remote_dfile}",
                        id, host, :deploy, @remote_dir, domain)
    end

    # ------------------------------------------------------------------------ #
    # Basic Domain Management Operations                                       #
    # ------------------------------------------------------------------------ #
    def shutdown(id, host, deploy_id, not_used)
        remotes_action("#{@remote_path}/shutdown #{deploy_id}",
                       id, host, :shutdown, @remote_dir)
    end

    def cancel(id, host, deploy_id, not_used)
        remotes_action("#{@remote_path}/cancel #{deploy_id}",
                       id, host, :cancel, @remote_dir)
    end

    def save(id, host, deploy_id, file)
        remotes_action("#{@remote_path}/save #{deploy_id} #{file}",
                       id, host, :save, @remote_dir)
    end

    def restore(id, host, deploy_id, file)
        remotes_action("#{@remote_path}/restore #{file}",
                       id, host, :restore, @remote_dir)
    end

    def migrate(id, host, deploy_id, dest_host)
        remotes_action("#{@remote_path}/migrate #{deploy_id} #{dest_host}",
                       id, host, :migrate, @remote_dir)
    end

    def poll(id, host, deploy_id, not_used)
        if localpoll == true
            local_action("#{@actions_path}/poll_local #{host} #{deploy_id}",id,
                         :poll)
        else
            remotes_action("#{@remote_path}/poll #{deploy_id}",
                           id, host, :poll, @remote_dir)
        end 
    end
end

# ---------------------------------------------------------------------------- #
# SshDriver Main program
# ---------------------------------------------------------------------------- #
opts = GetoptLong.new(
    [ '--retries',    '-r', GetoptLong::OPTIONAL_ARGUMENT ],
    [ '--threads',    '-t', GetoptLong::OPTIONAL_ARGUMENT ],
    [ '--localpoll',  '-l', GetoptLong::NO_ARGUMENT ]
)

hypervisor = ''
retries    = 0
threads    = 15
localpoll  = false

begin
    opts.each do |opt, arg|
        case opt
            when '--retries'
                retries   = arg.to_i
            when '--threads'
                threads   = arg.to_i
            when '--localpoll'
                localpoll = true
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

ssh_driver = SshDriver.new(hypervisor, threads, retries, localpoll)
ssh_driver.start_driver
