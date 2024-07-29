# -------------------------------------------------------------------------- #
# Copyright 2002-2024, OpenNebula Project, OpenNebula Systems                #
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
require 'opennebula'
require "OpenNebulaDriver"
require "CommandManager"
require 'base64'
require 'rexml/document'

# This class provides basic messaging and logging functionality
# to implement OpenNebula Drivers. A driver is a program that
# specialize the OpenNebula behavior by interfacing with specific
# infrastructure functionalities.
#
# A Driver inherits this class and only has to provide methods
# for each action it wants to receive. The method must be associated
# with the action name through the register_action function
class VirtualMachineDriver < OpenNebulaDriver

    # Virtual Machine Driver Protocol constants
    ACTION = {
        :deploy      => "DEPLOY",
        :shutdown    => "SHUTDOWN",
        :reboot      => "REBOOT",
        :reset       => "RESET",
        :cancel      => "CANCEL",
        :save        => "SAVE",
        :restore     => "RESTORE",
        :migrate     => "MIGRATE",
        :poll        => "POLL",
        :log         => "LOG",
        :attach_disk => "ATTACHDISK",
        :detach_disk => "DETACHDISK",
        :snapshot_create => "SNAPSHOTCREATE",
        :snapshot_revert => "SNAPSHOTREVERT",
        :snapshot_delete => "SNAPSHOTDELETE",
        :cleanup         => "CLEANUP",
        :attach_nic  => "ATTACHNIC",
        :detach_nic  => "DETACHNIC",
        :disk_snapshot_create => "DISKSNAPSHOTCREATE",
        :resize_disk => "RESIZEDISK",
        :update_sg   => "UPDATESG",
        :update_conf => "UPDATECONF",
        :resize      => "RESIZE",
        :backup      => "BACKUP",
        :update_nic   => "UPDATENIC",
        :backup_cancel=> "BACKUPCANCEL"
    }

    POLL_ATTRIBUTE = OpenNebula::VirtualMachine::Driver::POLL_ATTRIBUTE
    VM_STATE = OpenNebula::VirtualMachine::Driver::VM_STATE

    HOST_ARG = 1

    # Register default actions for the protocol.
    #
    # @param [String] directory path inside remotes path where the scripts
    #   reside
    # @param [Hash] options options for OpenNebula driver (check the available
    #   options in {OpenNebulaDriver#initialize})
    # @option options [Boolean] :threaded (true) enables or disables threads
    def initialize(directory, options={})
        @options={
            :threaded    => true,
            :single_host => true
        }.merge!(options)

        super(directory, @options)

        @hosts = Array.new

        register_action(ACTION[:deploy].to_sym, method("deploy"))
        register_action(ACTION[:shutdown].to_sym, method("shutdown"))
        register_action(ACTION[:reboot].to_sym, method("reboot"))
        register_action(ACTION[:reset].to_sym, method("reset"))
        register_action(ACTION[:cancel].to_sym, method("cancel"))
        register_action(ACTION[:save].to_sym, method("save"))
        register_action(ACTION[:restore].to_sym, method("restore"))
        register_action(ACTION[:migrate].to_sym, method("migrate"))
        register_action(ACTION[:poll].to_sym, method("poll"))
        register_action(ACTION[:attach_disk].to_sym, method("attach_disk"))
        register_action(ACTION[:detach_disk].to_sym, method("detach_disk"))
        register_action(ACTION[:snapshot_create].to_sym, method("snapshot_create"))
        register_action(ACTION[:snapshot_revert].to_sym, method("snapshot_revert"))
        register_action(ACTION[:snapshot_delete].to_sym, method("snapshot_delete"))
        register_action(ACTION[:cleanup].to_sym, method("cleanup"))
        register_action(ACTION[:attach_nic].to_sym, method("attach_nic"))
        register_action(ACTION[:detach_nic].to_sym, method("detach_nic"))
        register_action(ACTION[:disk_snapshot_create].to_sym, method("disk_snapshot_create"))
        register_action(ACTION[:resize_disk].to_sym, method("resize_disk"))
        register_action(ACTION[:update_sg].to_sym, method("update_sg"))
        register_action(ACTION[:update_conf].to_sym, method("update_conf"))
        register_action(ACTION[:resize].to_sym, method("resize"))
        register_action(ACTION[:backup].to_sym, method("backup"))
        register_action(ACTION[:update_nic].to_sym, method("update_nic"))
        register_action(ACTION[:backup_cancel].to_sym, method("backup_cancel"))
    end

    # Decodes the encoded XML driver message received from the core
    #
    # @param [String] drv_message the driver message
    # @return [REXML::Element] the root element of the decoded XML message
    def decode(drv_message)
        message = Base64.decode64(drv_message)
        xml_doc = REXML::Document.new(message)

        xml_doc.root
    end

    # Execute a command associated to an action and id in a remote host.
    def remotes_action(command, id, host, action, remote_dir, std_in=nil)
        super(command,id,host,ACTION[action],remote_dir,std_in)
    end

    # Execute a command associated to an action and id on localhost
    def local_action(command, id, action)
        super(command,id,ACTION[action])
    end

    # Virtual Machine Manager Protocol Actions (generic implementation)
    def deploy(id, drv_message)
        error = "Action not implemented by driver #{self.class}"
        send_message(ACTION[:deploy],RESULT[:failure],id,error)
    end

    def shutdown(id, drv_message)
        error = "Action not implemented by driver #{self.class}"
        send_message(ACTION[:shutdown],RESULT[:failure],id,error)
    end

    def reboot(id, drv_message)
        error = "Action not implemented by driver #{self.class}"
        send_message(ACTION[:reboot],RESULT[:failure],id,error)
    end

    def reset(id, drv_message)
        error = "Action not implemented by driver #{self.class}"
        send_message(ACTION[:reset],RESULT[:failure],id,error)
    end

    def cancel(id, drv_message)
        error = "Action not implemented by driver #{self.class}"
        send_message(ACTION[:cancel],RESULT[:failure],id,error)
    end

    def save(id, drv_message)
        error = "Action not implemented by driver #{self.class}"
        send_message(ACTION[:save],RESULT[:failure],id,error)
    end

    def restore(id, drv_message)
        error = "Action not implemented by driver #{self.class}"
        send_message(ACTION[:restore],RESULT[:failure],id,error)
    end

    def migrate(id, drv_message)
        error = "Action not implemented by driver #{self.class}"
        send_message(ACTION[:migrate],RESULT[:failure],id,error)
    end

    def poll(id, drv_message)
        error = "Action not implemented by driver #{self.class}"
        send_message(ACTION[:poll],RESULT[:failure],id,error)
    end

    def attach_disk(id, drv_message)
        error = "Action not implemented by driver #{self.class}"
        send_message(ACTION[:attach_disk],RESULT[:failure],id,error)
    end

    def detach_disk(id, drv_message)
        error = "Action not implemented by driver #{self.class}"
        send_message(ACTION[:detach_disk],RESULT[:failure],id,error)
    end

    def attach_nic(id, drv_message)
        error = "Action not implemented by driver #{self.class}"
        send_message(ACTION[:attach_nic],RESULT[:failure],id,error)
    end

    def detach_nic(id, drv_message)
        error = "Action not implemented by driver #{self.class}"
        send_message(ACTION[:detach_nic],RESULT[:failure],id,error)
    end

    def snapshot_create(id, drv_message)
        error = "Action not implemented by driver #{self.class}"
        send_message(ACTION[:snapshot_create],RESULT[:failure],id,error)
    end

    def snapshot_revert(id, drv_message)
        error = "Action not implemented by driver #{self.class}"
        send_message(ACTION[:snapshot_revert],RESULT[:failure],id,error)
    end

    def snapshot_delete(id, drv_message)
        error = "Action not implemented by driver #{self.class}"
        send_message(ACTION[:snapshot_delete],RESULT[:failure],id,error)
    end

    def disk_snapshot_create(id, drv_message)
        error = "Action not implemented by driver #{self.class}"
        send_message(ACTION[:disk_snapshot_create],RESULT[:failure],id,error)
    end

    def resize_disk(id, drv_message)
        error = "Action not implemented by driver #{self.class}"
        send_message(ACTION[:resize_disk],RESULT[:failure],id,error)
    end

    def update_sg(id, drv_message)
        error = "Action not implemented by driver #{self.class}"
        send_message(ACTION[:update_sg],RESULT[:failure],id,error)
    end

    def cleanup(id, drv_message)
        error = "Action not implemented by driver #{self.class}"
        send_message(ACTION[:cleanup],RESULT[:failure],id,error)
    end

    def update_conf(id, drv_message)
        error = "Action not implemented by driver #{self.class}"
        send_message(ACTION[:update_conf],RESULT[:failure],id,error)
    end

    def resize(id, drv_message)
        error = "Action not implemented by driver #{self.class}"
        send_message(ACTION[:resize],RESULT[:failure],id,error)
    end

    def backup(id, drv_message)
        error = "Action not implemented by driver #{self.class}"
        send_message(ACTION[:backup],RESULT[:failure],id,error)
    end

    def update_nic(id, drv_message)
        error = "Action not implemented by driver #{self.class}"
        send_message(ACTION[:update_nic],RESULT[:failure],id,error)
    end

    def backup_cancel(id, drv_message)
        error = "Action not implemented by driver #{self.class}"
        send_message(ACTION[:backup_cancel],RESULT[:failure],id,error)
    end

private

    # Interface to handle the pending events from the ActionManager Interface
    def delete_running_action(action_id)
        if @options[:single_host]
            delete_running_action_single_host(action_id)
        else
            super(action_id)
        end
    end

    def delete_running_action_single_host(action_id)
        action=@action_running[action_id]
        if action
            @hosts.delete(action[:host])
            @action_running.delete(action_id)
        end
    end

    def get_first_runable
        if @options[:single_host]
            get_first_runable_single_host
        else
            super
        end
    end

    def get_first_runable_single_host
        action_index=nil
        @action_queue.each_with_index do |action, index|
            if !action.keys.include?(:host)
                if action[:args].length == 2
                    begin
                        xml=decode(action[:args].last)
                        host=xml.elements['HOST']
                        action[:host]=host.text if host
                    rescue
                        action[:host]=nil
                    end
                else
                    action[:host]=nil
                end
            end

            if action.keys.include?(:host) && action[:host]
                if !@hosts.include?(action[:host])
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
        if @options[:single_host]
            get_runable_action_single_host
        else
            super
        end
    end

    def get_runable_action_single_host
        action_index=get_first_runable

        if action_index
            action=@action_queue[action_index]
        else
            action=nil
        end

        if action
            @hosts << action[:host] if action[:host]
            @action_queue.delete_at(action_index)
        end

        return action
    end

    def empty_queue
        if @options[:single_host]
            empty_queue_single_host
        else
            super
        end
    end

    def empty_queue_single_host
        get_first_runable==nil
    end
end

################################################################
################################################################

if __FILE__ == $0

    class TemplateDriver < VirtualMachineDriver
        def initialize
            super('vmm/dummy',
                :concurrency => 15,
                :threaded => true)
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
