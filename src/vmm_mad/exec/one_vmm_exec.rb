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
require 'one_vnm'
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
        # ----------------------------------------------------------------------
        #  Initialization of deployment data
        # ----------------------------------------------------------------------

        data = decode(drv_message)

        local_dfile  = data.elements['LOCAL_DEPLOYMENT_FILE'].text
        remote_dfile = data.elements['REMOTE_DEPLOYMENT_FILE'].text

        host    = data.elements['HOST'].text
        net_drv = data.elements['NET_DRV'].text

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

        ssh = SshStreamCommand.new(host,
                                   @remote_scripts_base_path,
                                   log_method(id))

        vnm = VirtualNetworkDriver.new(net_drv,
                                     :local_actions => @options[:local_actions],
                                     :message       => data,
                                     :ssh_stream    => ssh)

        # ----------------------------------------------------------------------
        #  Execute pre-boot action of the network driver
        # ----------------------------------------------------------------------

        result, info = vnm.do_action(id, :pre)

        if failed?(result)
            send_message(ACTION[:deploy], result, id,info)
            return
        end

        log(id, "Successfully executed network driver #{net_drv} (pre-boot)")

        # ----------------------------------------------------------------------
        # Boot the VM
        # ----------------------------------------------------------------------

        result, info = do_action("#{dfile} #{host}", id, host, :deploy, 
                                      :stdin      => domain,
                                      :ssh_stream => ssh,
                                      :respond    => false)
        if failed?(result)
            send_message(ACTION[:deploy], result, id, info)
            return
        end

        deploy_id = info

        log(id, "Successfully booted VM with id: #{deploy_id}")

        # ----------------------------------------------------------------------
        #  Execute post-boot action of the network driver
        # ----------------------------------------------------------------------

        result, info = vnm.do_action(id, :post)

        if failed?(result)
            log(id, "Failed to executed network driver #{net_drv} (post-boot)")
            log(id, "Canceling VM with id: #{deploy_id}")

            do_action("#{deploy_id} #{host}", id, host, :cancel,
                      :ssh_stream => ssh,
                      :respond    => false)

            send_message(ACTION[:deploy], result, id, info)
            return
        end

        log(id, "Successfully executed network driver #{net_drv} (post-boot)")

        send_message(ACTION[:deploy], RESULT[:success], id, deploy_id)
    end

    # Basic Domain Management Operations

    def shutdown(id, drv_message)
        data        = decode(drv_message)
        host        = data.elements['HOST'].text
        net_drv     = data.elements['NET_DRV'].text
        deploy_id   = data.elements['DEPLOY_ID'].text

        ssh = SshStreamCommand.new(host,
                                   @remote_scripts_base_path,
                                   log_method(id))

        vnm = VirtualNetworkDriver.new(net_drv,
                                    :local_actions => @options[:local_actions],
                                    :message       => data,
                                    :ssh_stream    => ssh)

        result, info = do_action("#{deploy_id} #{host}", id, host, :shutdown,
                                 :ssh_stream => ssh,
                                 :respond    => false)

        if failed?(result)
            send_message(ACTION[:shutdown], result, id,info)
            return
        end

        log(id, "Successfully shut down VM with id: #{deploy_id}")

        # ----------------------------------------------------------------------
        #  Execute clean action of the network driver
        # ----------------------------------------------------------------------

        result, info = vnm.do_action(id, :clean)

        if failed?(result)
            send_message(ACTION[:shutdown], result, id,info)
            return
        end

        log(id, "Successfully executed network driver #{net_drv}" <<
                " (clean-shutdown)")
    end

    def cancel(id, drv_message)
        data        = decode(drv_message)
        host        = data.elements['HOST'].text
        net_drv     = data.elements['NET_DRV'].text
        deploy_id   = data.elements['DEPLOY_ID'].text

        ssh = SshStreamCommand.new(host,
                                   @remote_scripts_base_path,
                                   log_method(id))

        vnm = VirtualNetworkDriver.new(net_drv,
                                    :local_actions => @options[:local_actions],
                                    :message       => data,
                                    :ssh_stream    => ssh)

        result, info = do_action("#{deploy_id} #{host}", id, host, :cancel,
                                 :ssh_stream => ssh,
                                 :respond    => false)

        if failed?(result)
            send_message(ACTION[:cancel], result, id,info)
            return
        end

        log(id, "Successfully canceled VM with id: #{deploy_id}")

        # ----------------------------------------------------------------------
        #  Execute clean action of the network driver
        # ----------------------------------------------------------------------

        result, info = vnm.do_action(id, :clean)

        if failed?(result)
            send_message(ACTION[:cancel], result, id,info)
            return
        end

        log(id, "Successfully executed network driver #{net_drv}" <<
                " (clean-cancel)")

        send_message(ACTION[:shutdown], RESULT[:success], id, domain_id)
    end

    def save(id, drv_message)
        data        = decode(drv_message)
        host        = data.elements['HOST'].text
        net_drv     = data.elements['NET_DRV'].text
        deploy_id   = data.elements['DEPLOY_ID'].text
        file        = data.elements['CHECKPOINT_FILE'].text

        ssh = SshStreamCommand.new(host,
                                   @remote_scripts_base_path,
                                   log_method(id))

        vnm = VirtualNetworkDriver.new(net_drv,
                                    :local_actions => @options[:local_actions],
                                    :message       => data,
                                    :ssh_stream    => ssh)

        result, info = do_action("#{deploy_id} #{file} #{host}", id, host,
                                 :save,
                                 :ssh_stream => ssh,
                                 :respond    => false)

        if failed?(result)
            send_message(ACTION[:save], result, id,info)
            return
        end

        log(id, "Successfully saved VM with id: #{deploy_id}")

        # ----------------------------------------------------------------------
        #  Execute clean action of the network driver
        # ----------------------------------------------------------------------

        result, info = vnm.do_action(id, :clean)

        if failed?(result)
            send_message(ACTION[:save], result, id,info)
            return
        end

        log(id, "Successfully executed network driver #{net_drv}" <<
                " (clean-save)")

        send_message(ACTION[:save], RESULT[:success], id, domain_id)
    end

    def restore(id, drv_message)
        data        = decode(drv_message)
        host        = data.elements['HOST'].text
        file        = data.elements['CHECKPOINT_FILE'].text

        ssh = SshStreamCommand.new(host,
                                   @remote_scripts_base_path,
                                   log_method(id))

        vnm = VirtualNetworkDriver.new(net_drv,
                                    :local_actions => @options[:local_actions],
                                    :message       => data,
                                    :ssh_stream    => ssh)

        # ----------------------------------------------------------------------
        #  Execute pre-boot action of the network driver
        # ----------------------------------------------------------------------

        result, info = vnm.do_action(id, :pre)

        if failed?(result)
            send_message(ACTION[:restore], result, id,info)
            return
        end

        log(id, "Successfully executed network driver #{net_drv} (pre-restore)")

        result, info = do_action("#{file} #{host}", id, host, :restore,
                                 :save,
                                 :ssh_stream => ssh,
                                 :respond    => false)
        if failed?(result)
            send_message(ACTION[:restore], result, id, info)
            return
        end

        log(id, "Successfully restored VM with id: #{info}")

        # ----------------------------------------------------------------------
        #  Execute post-restore action of the network driver
        # ----------------------------------------------------------------------

        result, info = vnm.do_action(id, :post)

        if failed?(result)
            log(id, "Failed to executed network driver #{net_drv} (post-restore)")
            log(id, "Canceling VM with id: #{domain_id}")

            do_action("#{domain_id} #{host}", id, host, :cancel,
                      :ssh_stream => ssh,
                      :respond    => false)

            send_message(ACTION[:restore], result, id, info)
            return
        end

        log(id, "Successfully executed network driver #{net_drv} (post-restore)")

        send_message(ACTION[:restore], RESULT[:success], id, domain_id)
    end

    def migrate(id, drv_message)
        data        = decode(drv_message)
        net_drv     = data.elements['NET_DRV'].text
        host        = data.elements['HOST'].text
        deploy_id   = data.elements['DEPLOY_ID'].text
        dest_host   = data.elements['MIGR_HOST'].text
        dest_driver = data.elements['MIGR_NET_DRV'].text

        ssh_src = SshStreamCommand.new(host,
                                       @remote_scripts_base_path,
                                       log_method(id))

        ssh_dst = SshStreamCommand.new(dest_host,
                                       @remote_scripts_base_path,
                                       log_method(id))

        vnm_src = VirtualNetworkDriver.new(net_drv,
                                    :local_actions => @options[:local_actions],
                                    :message       => data,
                                    :ssh_stream    => ssh_src)

        vnm_dst = VirtualNetworkDriver.new(dest_driver,
                                    :local_actions => @options[:local_actions],
                                    :message       => data,
                                    :ssh_stream    => ssh_dst)

        # ----------------------------------------------------------------------
        #  Execute pre-boot action of the network driver
        # ----------------------------------------------------------------------

        result, info = vnm_dst.do_action(id, :pre)

        if failed?(result)
            send_message(ACTION[:migrate], result, id,info)
            return
        end

        log(id, "Successfully executed network driver #{net_drv} (pre-migrate)")

        result, info = do_action("#{deploy_id} #{dest_host} #{host}", id, host,
                                 :migrate,
                                 :save,
                                 :ssh_stream => ssh_src,
                                 :respond    => false)
        if failed?(result)
            send_message(ACTION[:migrate], result, id, info)
            return
        end

        log(id, "Successfully migrated VM with id: #{deploy_id}")

        # ----------------------------------------------------------------------
        #  Execute post-migrate action of the network driver
        # ----------------------------------------------------------------------

        result, info = vnm_dst.do_action(id, :post)

        if failed?(result)
            log(id, "Failed to executed network driver #{dest_driver} (post-migrate)")
            log(id, "Canceling VM with id: #{deploy_id}")

            do_action("#{deploy_id} #{host}", id, dest_host, :cancel,
                      :ssh_stream => ssh_dst,
                      :respond    => false)

            send_message(ACTION[:restore], result, id, info)
            return
        end

        log(id, "Successfully executed network driver #{net_drv} (post-restore)")

        send_message(ACTION[:restore], RESULT[:success], id, deploy_id)
    end

    def poll(id, drv_message)
        data        = decode(drv_message)
        host        = data.elements['HOST'].text
        deploy_id   = data.elements['DEPLOY_ID'].text

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
