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
    VAR_LOCATION      = "/var/lib/one"
else
    RUBY_LIB_LOCATION = ONE_LOCATION + "/lib/ruby"
    VAR_LOCATION      = ONE_LOCATION + "/var"
end

$: << RUBY_LIB_LOCATION

require "VirtualMachineDriver"
require 'getoptlong'

# ---------------------------------------------------------------------------- #
# The main class for the Sh driver                                             #
# ---------------------------------------------------------------------------- #
class ShDriver < VirtualMachineDriver
    # ------------------------------------------------------------------------ #
    # ShDriver constructor                                                     #
    # ------------------------------------------------------------------------ #
    def initialize(hypervisor,threads)
        super(threads,true)
        
        @config = read_configuration
        @hypervisor = hypervisor
        
        @actions_path = "#{VAR_LOCATION}/remotes/vmm/#{hypervisor}"
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
       
        local_action("#{@actions_path}/deploy #{host} #{local_dfile}",id,:deploy)
    end

    # ------------------------------------------------------------------------ #
    # Basic Domain Management Operations                                       #
    # ------------------------------------------------------------------------ #
    def shutdown(id, host, deploy_id, not_used)
        local_action("#{@actions_path}/shutdown #{host} #{deploy_id}", id, 
                     :shutdown)
    end

    def cancel(id, host, deploy_id, not_used)
        local_action("#{@actions_path}/cancel #{host} #{deploy_id}", id, :cancel)
    end

    def save(id, host, deploy_id, file)
        local_action("#{@actions_path}/save #{host} #{deploy_id} #{file}", id, 
                     :save)
    end

    def restore(id, host, deploy_id, file)
        local_action("#{@actions_path}/restore #{host} #{file}", id, :restore)
    end

    def migrate(id, host, deploy_id, dest_host)
        local_action(
              "#{@actions_path}/migrate #{host} #{deploy_id} #{dest_host}", id, 
              :migrate)
    end

    def poll(id, host, deploy_id, not_used)
        local_action("#{@actions_path}/poll #{host} #{deploy_id}",id,:poll)
    end
end

# ---------------------------------------------------------------------------- #
# ShDriver Main program                                                        #
# ---------------------------------------------------------------------------- #
opts = GetoptLong.new(
    [ '--threads',    '-t', GetoptLong::OPTIONAL_ARGUMENT ]
)

hypervisor = ''
threads    = 15

begin
    opts.each do |opt, arg|
        case opt
            when '--threads'
                threads = arg.to_i
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

sh_driver = ShDriver.new(hypervisor,threads)
sh_driver.start_driver
