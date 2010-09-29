# -------------------------------------------------------------------------- */
# Copyright 2002-2010, OpenNebula Project Leads (OpenNebula.org)             #
# Licensed under the Apache License, Version 2.0 (the "License"); you may    */
# not use this file except in compliance with the License. You may obtain    */
# a copy of the License at                                                   */
#                                                                            */
# http://www.apache.org/licenses/LICENSE-2.0                                 */
#                                                                            */
# Unless required by applicable law or agreed to in writing, software        */
# distributed under the License is distributed on an "AS IS" BASIS,          */
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.   */
# See the License for the specific language governing permissions and        */
# limitations under the License.                                             */
# -------------------------------------------------------------------------- */
require "OpenNebulaDriver"
require "CommandManager"

# Author:: dsa-research.org
# Copyright:: (c) 2009 Universidad Computense de Madrid
# License:: Apache License

# This class provides basic messaging and logging functionality
# to implement OpenNebula Drivers. A driver is a program that
# specialize the OpenNebula behavior by interfacing with specific
# infrastructure functionalities.
#
# A Driver inherits this class and only has to provide methods
# for each action it wants to receive. The method must be associated
# with the action name through the register_action func

class VirtualMachineDriver < OpenNebulaDriver

    # -------------------------------------------------------------------------
    # Virtual Machine Driver Protocol constants
    # -------------------------------------------------------------------------
    ACTION = {
        :deploy     => "DEPLOY",
        :shutdown   => "SHUTDOWN",
        :cancel     => "CANCEL",
        :save       => "SAVE",
        :restore    => "RESTORE",
        :migrate    => "MIGRATE",
        :poll       => "POLL",
        :log        => "LOG"
    }

    POLL_ATTRIBUTE = {
        :usedmemory => "USEDMEMORY",
        :usedcpu    => "USEDCPU",
        :nettx      => "NETTX",
        :netrx      => "NETRX",
        :state      => "STATE"
    }

    VM_STATE = {
        :active  => 'a',
        :paused  => 'p',
        :error   => 'e',
        :deleted => 'd',
        :unknown => '-'
    }
    
    HOST_ARG = 1

    # -------------------------------------------------------------------------
    # Register default actions for the protocol
    # -------------------------------------------------------------------------
    def initialize(concurrency=10, threaded=true)
        super(concurrency,threaded)
        
        @hosts = Array.new

        register_action(ACTION[:deploy].to_sym, method("deploy"))
        register_action(ACTION[:shutdown].to_sym, method("shutdown"))
        register_action(ACTION[:cancel].to_sym, method("cancel"))
        register_action(ACTION[:save].to_sym, method("save"))
        register_action(ACTION[:restore].to_sym, method("restore"))
        register_action(ACTION[:migrate].to_sym, method("migrate"))
        register_action(ACTION[:poll].to_sym, method("poll"))
    end

    # -------------------------------------------------------------------------
    # Converts a deployment file from its remote path to the local (front-end)
    # path
    # -------------------------------------------------------------------------
    def get_local_deployment_file(rfile)

        lfile = nil

        one_location = ENV["ONE_LOCATION"]

        if one_location == nil
            var_location = "/var/lib/one/"
        else
            var_location = one_location + "/var/"
        end

        m = rfile.match(/.*?\/(\d+)\/images\/(deployment.\d+)$/)

        lfile = "#{var_location}#{m[1]}/#{m[2]}" if m

        lfile = nil if lfile and !File.exists?(lfile)

        return lfile
    end

    # -------------------------------------------------------------------------
    # Execute a command associated to an action and id in a remote host.
    # -------------------------------------------------------------------------
    def ssh_action(command, id, host, action)
        command_exe = SSHCommand.run(command, host, log_method(id))

        if command_exe.code == 0
            result = :success
        else
            result = :failure
        end

        send_message(ACTION[action],RESULT[result],id)
    end

    # -------------------------------------------------------------------------
    # Virtual Machine Manager Protocol Actions (generic implementation
    # -------------------------------------------------------------------------
    def deploy(id, host, remote_dfile, not_used)
        error = "Action not implemented by driver #{self.class}"
        send_message(ACTION[:deploy],RESULT[:failure],id,error)
    end

    def shutdown(id, host, deploy_id, not_used)
        error = "Action not implemented by driver #{self.class}"
        send_message(ACTION[:shutdown],RESULT[:failure],id,error)
    end

    def cancel(id, host, deploy_id, not_used)
        error = "Action not implemented by driver #{self.class}"
        send_message(ACTION[:cancel],RESULT[:failure],id,error)
    end

    def save(id, host, deploy_id, file)
        error = "Action not implemented by driver #{self.class}"
        send_message(ACTION[:save],RESULT[:failure],id,error)
    end

    def restore(id, host, deploy_id, file)
        error = "Action not implemented by driver #{self.class}"
        send_message(ACTION[:restore],RESULT[:failure],id,error)
    end

    def migrate(id, host, deploy_id, dest_host)
        error = "Action not implemented by driver #{self.class}"
        send_message(ACTION[:migrate],RESULT[:failure],id,error)
    end

    def poll(id, host, deploy_id, not_used)
        error = "Action not implemented by driver #{self.class}"
        send_message(ACTION[:poll],RESULT[:failure],id,error)
    end
    
private

    def delete_running_action(action_id)
        action=@action_running[action_id]
        if action
            @hosts.delete(action[:args][HOST_ARG])
            @action_running.delete(action_id)
        end
    end
    
    def get_first_runable
        action_index=nil
        @action_queue.each_with_index do |action, index|
            if action[:args][HOST_ARG]
                if !@hosts.include?(action[:args][HOST_ARG])
                    action_index=index
                    break
                end
           else
               action_index=index
               break
           end
        end
        
        return action_index
    end
    
    def get_runable_action
        action_index=get_first_runable
        
        if action_index
            action=@action_queue[action_index]
        else
            action=nil
        end
        
        if action
            @hosts << action[:args][HOST_ARG] if action[:args][HOST_ARG]
            @action_queue.delete_at(action_index)
        end
        
        STDERR.puts "action: #{action.inspect}"
        STDERR.puts "queue: #{@action_queue.inspect}"
        STDERR.puts "hosts: #{@hosts.inspect}"
        STDERR.flush
        
        return action
    end
    
    def empty_queue
        get_first_runable==nil
    end
end

if __FILE__ == $0

class TemplateDriver < VirtualMachineDriver
    def initialize
        super(15,true)
    end

    def deploy(id, host, remote_dfile, not_used)
        #MUST return deploy_id if deployment was successfull
        deploy_id = "-"
        send_message(ACTION[:deploy],RESULT[:success],id,deploy_id)
    end

    def shutdown(id, host, deploy_id, not_used)
        send_message(ACTION[:shutdown],RESULT[:success],id)
    end

    def cancel(id, host, deploy_id, not_used)
        send_message(ACTION[:cancel],RESULT[:success],id)
    end

    def save(id, host, deploy_id, file)
        send_message(ACTION[:save],RESULT[:success],id)
    end

    def restore(id, host, deploy_id , file)
        send_message(ACTION[:restore],RESULT[:success],id)
    end

    def migrate(id, host, deploy_id, dest_host)
        send_message(ACTION[:migrate],RESULT[:success],id)
    end

    def poll(id, host, deploy_id, not_used)
        # monitor_info: string in the form "VAR=VAL VAR=VAL ... VAR=VAL"
        # known VAR are in POLL_ATTRIBUTES. VM states VM_STATES
        monitor_info = "#{POLL_ATTRIBUTE[:state]}=#{VM_STATE[:active]} " \
                       "#{POLL_ATTRIBUTE[:nettx]}=12345"

        send_message(ACTION[:poll],RESULT[:success],id,monitor_info)
    end

    end

    sd = TemplateDriver.new
    sd.start_driver

end
