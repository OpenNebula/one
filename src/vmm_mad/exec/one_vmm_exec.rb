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

class VmmAction
    attr_reader :data

    def initialize(driver, id, action, xml_data)
        @vmm=driver
        @id=id
        @main_action=action
        @xml_data=@vmm.decode(xml_data)

        @data=Hash.new

        get_data(:host)
        get_data(:net_drv)
        get_data(:deploy_id)
        get_data(:checkpoint_file)

        get_data(:local_dfile, :LOCAL_DEPLOYMENT_FILE)
        get_data(:remote_dfile, :REMOTE_DEPLOYMENT_FILE)

        # For migration
        get_data(:dest_host, :MIGR_HOST)
        get_data(:dest_driver, :MIGR_NET_DRV)

        # Initialize streams and vnm
        @ssh_src = @vmm.get_ssh_stream(@data[:host], @id)
        @vnm_src = VirtualNetworkDriver.new(@data[:net_drv],
                            :local_actions  => @vmm.options[:local_actions],
                            :message        => @xml_data,
                            :ssh_stream     => @ssh_src)

        if @data[:dest_host] and !@data[:dest_host].empty?
            @ssh_dst = @vmm.get_ssh_stream(@data[:dest_host], @id)
            @vnm_dst = VirtualNetworkDriver.new(@data[:dest_driver],
                            :local_actions  => @vmm.options[:local_actions],
                            :message        => @xml_data,
                            :ssh_stream     => @ssh_dst)
        end
    end

    def get_data(name, xml_path=nil)
        if xml_path
            path=xml_path.to_s
        else
            path=name.to_s.upcase
        end

        @data[name]=@xml_data.elements[path].text
    end

=begin
    {
        :driver => :vmm,
        :action => :deploy,
        :parameters => [:host, :deploy_id],
        :destination => false
        :save_info => :deploy_id,
        :fail_actions => [],
        :pre_log => "",
        :post_log => "",
        :stdin => nil
    }
=end

    def execute_steps(steps)
        result=false
        info='Action #{step[:action]} not found'

        steps.each do |step|

            driver=step[:driver] || :vmm

            @vmm.log(@id, @data[:pre_log]) if @data[:pre_log]

            case driver
            when :vmm
                if step[:destination]
                    host = @data[:dest_host]
                    ssh  = @ssh_dst
                else
                    host = @data[:host]
                    ssh  = @ssh_src
                end

                result, info=@vmm.do_action(get_parameters(step), @id, host,
                                            step[:action],
                                            :ssh_stream => ssh,
                                            :respond => false,
                                            :stdin => step[:stdin])

            when :vnm
                if step[:destination]
                    vnm=@vnm_dst
                else
                    vnm=@vnm_src
                end

                result, info=vnm.do_action(@id, step[:action])
            else
            end

            # Save the info variable if asked for
            if @data[:save_info]
                @data[@data[:save_info]]=info
            end

            if @vmm.failed?(result)
                if @data[:fail_actions]
                    execute_steps(@data[:fail_actions])
                end

                break
            end

            @vmm.log(@id, @data[:post_log]) if @data[:post_log]
        end

        return result, info
    end

    def run(steps)
        result, info=execute_steps(steps)

        @vmm.send_message(VirtualMachineDriver::ACTION[@main_action],
                          result, @id, info)
    end

    def get_parameters(step)
        parameters=step[:parameters] || []
        parameters.map do |param|
            if Symbol===param
                @data[param].to_s
            else
                param
            end
        end.join(' ')
    end
end


# The main class for the Sh driver
class ExecDriver < VirtualMachineDriver
    attr_reader :options

    # SshDriver constructor
    def initialize(hypervisor, options={})
        @options={
            :threaded => true
        }.merge!(options)
        
        super("vmm/#{hypervisor}", @options)

        @hypervisor  = hypervisor
    end

    def get_ssh_stream(host, id)
        SshStreamCommand.new(host,
                             @remote_scripts_base_path,
                             log_method(id))
    end

    # DEPLOY action, sends the deployment file to remote host
    def deploy(id, drv_message)
        # ----------------------------------------------------------------------
        #  Initialization of deployment data
        # ----------------------------------------------------------------------

        action=VmmAction.new(self, id, :deploy, drv_message)

        local_dfile=action.data[:local_dfile]

        if !local_dfile || File.zero?(local_dfile)
            send_message(ACTION[:deploy],RESULT[:failure],id,
                "Can not open deployment file #{local_dfile}")
            return
        end

        domain = File.read(local_dfile)

        if action_is_local?(:deploy)
            dfile = action.data[:local_dfile]
        else
            dfile = action.data[:remote_dfile]
        end

        steps=[
            {
                :driver     => :vnm,
                :action     => :pre,
                :post_log   => "Successfully executed network driver " <<
                    "#{action.data[:net_drv]} (pre-boot)"
            },
            {
                :driver         => :vmm,
                :action         => :deploy,
                :parameters     => [dfile, :host],
                :stdin          => domain,
                :save_info      => :deploy_id
            },
            {
                :driver         => :vnm,
                :action         => :post,
                :fail_actions   => [
                    {
                        :driver     => :vmm,
                        :action     => :cancel,
                        :parameters => [:deploy_id, :host]
                    }
                ]
            }
        ]

        action.run(steps)
    end

    # Basic Domain Management Operations

    def shutdown(id, drv_message)
        action=VmmAction.new(self, id, :shutdown, drv_message)

        steps=[
            {
                :driver     => :vmm,
                :action     => :shutdown,
                :parameters => [:deploy_id, :host],
                :post_log   => "Successfully shut down VM with id: " <<
                    action.data[:deploy_id]
            },
            {
                :driver     => :vnm,
                :action     => :clean,
                :post_log   => "Successfully executed network driver " <<
                    "#{action.data[:net_drv]} (clean-shutdown)"
            }
        }

        action.run(steps)
    end

    def cancel(id, drv_message)
        action=VmmAction.new(self, id, :cancel, drv_message)

        steps=[
            {
                :driver     => :vmm,
                :action     => :cancel,
                :parameters => [:deploy_id, :host],
                :post_log   => "Successfully canceled VM with id: " <<
                    action.data[:deploy_id]
            },
            {
                :driver     => :vnm,
                :action     => :clean,
                :post_log   => "Successfully executed network driver " <<
                    "#{action.data[:net_drv]} (clean-cancel)"
            }
        ]

        action.run(steps)
    end

    def save(id, drv_message)
        action=VmmAction.new(self, id, :save, drv_message)

        steps=[
            {
                :driver     => :vmm,
                :action     => :save,
                :parameters => [:deploy_id, :checkpoint_file, :host],
                :post_log   => "Successfully saved VM with id: " <<
                    action.data[:deploy_id]
            },
            {
                :driver     => :vnm,
                :action     => :clean,
                :post_log   => "Successfully executed network driver " <<
                    "#{action.data[:net_drv]} (clean-save)"
            }
        ]

        action.run(steps)
    end

    def restore(id, drv_message)
        action=VmmAction.new(self, id, :restore, drv_message)

        steps=[
            {
                :driver     => :vnm,
                :action     => :pre,
                :post_log   => "Successfully executed network driver " <<
                    "#{action.data[:net_drv]} (pre-restore)"
            },
            {
                :driver     => :vmm,
                :action     => :restore,
                :parameters => [:checkpoint_file, :host],
                :save_info  => :deploy_id,
                :post_log   => "Successfully restored VM with id: " <<
                    action.data[:deploy_id]
            },
            {
                :driver         => :vnm,
                :action         => :post,
                :fail_actions   => [
                    {
                        :pre_log    => "Failed to execute network driver" <<
                            "#{action.data[:net_drv]} (post-restore). " <<
                            "Cancelling VM with id: #{action.data[:deploy_id]}"
                        :driver     => :vmm,
                        :action     => :cancel,
                        :parameters => [:deploy_id, :host]
                    }
                ],
                :post_log       => "Successfully executed network driver " <<
                    "#{action.data[:net_drv]} (post-restore)"
            }
        ]

        action.run(steps)
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


