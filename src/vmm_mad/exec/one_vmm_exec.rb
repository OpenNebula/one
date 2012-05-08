#!/usr/bin/env ruby

# -------------------------------------------------------------------------- #
# Copyright 2002-2012, OpenNebula Project Leads (OpenNebula.org)             #
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

    # Initialize a VmmAction object
    # @param[OpenNebula::ExecDriver] Driver to be used for the actions
    # @param[String] Id of the VM
    # @param[String] name of the actions as described in the VMM protocol
    # @param[xml_data] data sent from OpenNebula core
    def initialize(driver, id, action, xml_data)
        # Initialize object with xml data
        @vmm = driver
        @id  = id

        @main_action = action
        @xml_data    = @vmm.decode(xml_data)

        @data = Hash.new

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
        @ssh_src = @vmm.get_ssh_stream(action, @data[:host], @id)
        @vnm_src = VirtualNetworkDriver.new(@data[:net_drv],
                            :local_actions  => @vmm.options[:local_actions],
                            :message        => @xml_data,
                            :ssh_stream     => @ssh_src)

        if @data[:dest_host] and !@data[:dest_host].empty?
            @ssh_dst = @vmm.get_ssh_stream(action, @data[:dest_host], @id)
            @vnm_dst = VirtualNetworkDriver.new(@data[:dest_driver],
                            :local_actions  => @vmm.options[:local_actions],
                            :message        => @xml_data,
                            :ssh_stream     => @ssh_dst)
        end
    end

    #Execute a set of steps defined with
    #  - :driver :vmm or :vnm to execute the step
    #  - :action for the step
    #  - :parameters command line paremeters for the action
    #  - :destination use next host
    #  - :fail_action steps to be executed if steps fail
    #  - :stdin for the action
    #  @param [Array] of steps
    def run(steps, info_on_success = nil)
        result = execute_steps(steps)

        @ssh_src.close if @ssh_src
        @ssh_dst.close if @ssh_dst

        #Prepare the info for the OpenNebula core
        if DriverExecHelper.failed?(result)
            info = @data[:failed_info]
        else
            info = @data["#{@main_action.to_s}_info".to_sym]
        end

        @vmm.send_message(VirtualMachineDriver::ACTION[@main_action],
                          result, @id, info)
    end

    private

    DRIVER_NAMES = {
        :vmm => "virtualization driver",
        :vnm => "network driver"
    }

    # Executes a set of steps. If one step fails any recover action is performed
    # and the step execution breaks.
    # @param [Array] array of steps to be executed
    # @return [String, Hash] "SUCCESS/FAILURE" for the step set, and
    # information associated to each step (by :<action>_info). In case of
    # failure information is also in [:failed_info]
    def execute_steps(steps)
	result = DriverExecHelper.const_get(:RESULT)[:failure]

        steps.each do |step|
            # Execute Step
            case step[:driver]
            when :vmm
                if step[:destination]
                    host = @data[:dest_host]
                    ssh  = @ssh_dst
                else
                    host = @data[:host]
                    ssh  = @ssh_src
                end

                result, info = @vmm.do_action(get_parameters(step[:parameters]),
                                              @id,
                                              host,
                                              step[:action],
                                              :ssh_stream => ssh,
                                              :respond => false,
                                              :stdin => step[:stdin])
            when :vnm
                if step[:destination]
                    vnm = @vnm_dst
                else
                    vnm = @vnm_src
                end

                result, info = vnm.do_action(@id, step[:action],
                            :parameters => get_parameters(step[:parameters]))
            else
                result = DriverExecHelper.const_get(:RESULT)[:failure]
                info   = "No driver in #{step[:action]}"
            end

            # Save the step info
            @data["#{step[:action]}_info".to_sym] = info.strip

            # Roll back steps, store failed info and break steps
            if DriverExecHelper.failed?(result)
                execute_steps(step[:fail_actions]) if step[:fail_actions]
                @data[:failed_info] = info

                @vmm.log(@id,
                         "Failed to execute #{DRIVER_NAMES[step[:driver]]} " \
                         "operation: #{step[:action]}.")
                break
            else
                @vmm.log(@id,
                         "Successfully execute #{DRIVER_NAMES[step[:driver]]} " \
                         "operation: #{step[:action]}.")
            end
        end

        return result
    end

    # Prepare the parameters for the action step generating a blanck separated
    # list of command arguments
    # @param [Hash] an action step
    def get_parameters(step_params)
        parameters = step_params || []

        parameters.map do |param|
            if Symbol===param
                @data[param].to_s
            else
                param
            end
        end.join(' ')
    end

    # Extracts data from the XML argument of the VMM action
    # @param [Symbol] corresponding to a XML element
    # @param [String] an xpath for the XML element
    # @return [String] the element value
    def get_data(name, xml_path=nil)
        if xml_path
            path=xml_path.to_s
        else
            path=name.to_s.upcase
        end

        @data[name]=@xml_data.elements[path].text
    end
end


# The main class for the Sh driver
class ExecDriver < VirtualMachineDriver
    attr_reader :options

    # Initializes the VMM driver
    # @param [String] hypervisor name identifies the plugin
    # @param [OpenNebulaDriver::options]
    def initialize(hypervisor, options={})
        @options={
            :threaded => true
        }.merge!(options)

        super("vmm/#{hypervisor}", @options)

        @hypervisor  = hypervisor
    end

    # Creates an SshStream to execute commands on the target host
    # @param[String] the hostname of the host
    # @param[String] id of the VM to log messages
    # @return [SshStreamCommand]
    def get_ssh_stream(aname, host, id)
        stream = nil
         
        if not action_is_local?(aname)
            stream = SshStreamCommand.new(host,
                                          @remote_scripts_base_path,
                                          log_method(id))
        else
            return nil
        end
    end

    #---------------------------------------------------------------------------
    #  Virtual Machine Manager Protocol Actions
    #---------------------------------------------------------------------------
    #
    # DEPLOY action, sends the deployment file to remote host
    #
    def deploy(id, drv_message)
        action = VmmAction.new(self, id, :deploy, drv_message)

        # ----------------------------------------------------------------------
        #  Initialization of deployment data
        # ----------------------------------------------------------------------
        local_dfile=action.data[:local_dfile]

        if !local_dfile || File.zero?(local_dfile)
            send_message(ACTION[:deploy],RESULT[:failure],id,
                "Cannot open deployment file #{local_dfile}")
            return
        end

        domain = File.read(local_dfile)

        if action_is_local?(:deploy)
            dfile = action.data[:local_dfile]
        else
            dfile = action.data[:remote_dfile]
        end

        # ----------------------------------------------------------------------
        #  Deployment Steps
        # ----------------------------------------------------------------------

        steps=[
            # Execute pre-boot networking setup
            {
                :driver   => :vnm,
                :action   => :pre
            },
            # Boot the Virtual Machine
            {
                :driver       => :vmm,
                :action       => :deploy,
                :parameters   => [dfile, :host],
                :stdin        => domain,
            },
            # Execute post-boot networking setup
            {
                :driver       => :vnm,
                :action       => :post,
                :parameters   => [:deploy_info],
                :fail_actions => [
                    {
                        :driver     => :vmm,
                        :action     => :cancel,
                        :parameters => [:deploy_info, :host]
                    }
                ]
            }
        ]

        action.run(steps)
    end

    #
    # SHUTDOWN action, graceful shutdown and network clean up
    #
    def shutdown(id, drv_message)

        action = VmmAction.new(self, id, :shutdown, drv_message)

        steps=[
            # Shutdown the Virtual Machine
            {
                :driver     => :vmm,
                :action     => :shutdown,
                :parameters => [:deploy_id, :host]
            },
            # Execute networking clean up operations
            {
                :driver   => :vnm,
                :action   => :clean
            }
        ]

        action.run(steps)
    end

    #
    # CANCEL action, destroys a VM and network clean up
    #
    def cancel(id, drv_message)
        action = VmmAction.new(self, id, :cancel, drv_message)

        steps=[
            # Cancel the Virtual Machine
            {
                :driver     => :vmm,
                :action     => :cancel,
                :parameters => [:deploy_id, :host]
            },
            # Execute networking clean up operations
            {
                :driver   => :vnm,
                :action   => :clean
            }
        ]

        action.run(steps)
    end

    #
    # SAVE action, stops the VM and saves its state, network is cleaned up
    #
    def save(id, drv_message)
        action = VmmAction.new(self, id, :save, drv_message)

        steps=[
            # Save the Virtual Machine state
            {
                :driver     => :vmm,
                :action     => :save,
                :parameters => [:deploy_id, :checkpoint_file, :host]
            },
            # Execute networking clean up operations
            {
                :driver   => :vnm,
                :action   => :clean
            }
        ]

        action.run(steps)
    end

    #
    # RESTORE action, restore a VM from a previous state, and restores network
    #
    def restore(id, drv_message)
        action=VmmAction.new(self, id, :restore, drv_message)

        steps=[
            # Execute pre-boot networking setup
            {
                :driver     => :vnm,
                :action     => :pre
            },
            # Restore the Virtual Machine from checkpoint
            {
                :driver     => :vmm,
                :action     => :restore,
                :parameters => [:checkpoint_file, :host]
            },
            # Execute post-boot networking setup
            {
                :driver       => :vnm,
                :action       => :post,
                :parameters   => [:deploy_id],
                :fail_actions => [
                    {
                        :driver     => :vmm,
                        :action     => :cancel,
                        :parameters => [:deploy_id, :host]
                    }
                ],
            }
        ]

        action.run(steps)
    end

    #
    # MIGRATE (live) action, migrates a VM to another host creating network
    #
    def migrate(id, drv_message)
        action=VmmAction.new(self, id, :migrate, drv_message)

        steps=[
            # Execute pre-boot networking setup on migrating host
            {
                :driver      => :vnm,
                :action      => :pre,
                :destination => true
            },
            # Migrate the Virtual Machine
            {
                :driver     => :vmm,
                :action     => :migrate,
                :parameters => [:deploy_id, :dest_host, :host]
            },
            # Execute networking clean up operations
            {
                :driver       => :vnm,
                :action       => :clean
            },
            # Execute post-boot networking setup on migrating host
            {
                :driver       => :vnm,
                :action       => :post,
                :parameters   => [:deploy_id],
                :destination  => :true
                #TODO :fail_action what to do here? cancel VM?
            },
        ]

        action.run(steps)
    end

    #
    # POLL action, gets information of a VM
    #
    def poll(id, drv_message)
        data      = decode(drv_message)
        host      = data.elements['HOST'].text
        deploy_id = data.elements['DEPLOY_ID'].text

        do_action("#{deploy_id} #{host}", id, host, ACTION[:poll])
    end

    #
    # REBOOT action, reboots a running VM
    #
    def reboot(id, drv_message)
        data      = decode(drv_message)
        host      = data.elements['HOST'].text
        deploy_id = data.elements['DEPLOY_ID'].text

        do_action("#{deploy_id} #{host}", id, host, ACTION[:reboot])
    end

    #
    # RESET action, resets a running VM
    #
    def reset(id, drv_message)
        data      = decode(drv_message)
        host      = data.elements['HOST'].text
        deploy_id = data.elements['DEPLOY_ID'].text

        do_action("#{deploy_id} #{host}", id, host, ACTION[:reset])
    end
end

################################################################################
#
# Virtual Machine Manager Execution Driver - Main Program
#
################################################################################

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
