#!/usr/bin/env ruby

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

ONE_LOCATION = ENV['ONE_LOCATION']

if !ONE_LOCATION
    RUBY_LIB_LOCATION = '/usr/lib/one/ruby'
    GEMS_LOCATION     = '/usr/share/one/gems'
    ETC_LOCATION      = '/etc/one/'
else
    RUBY_LIB_LOCATION = ONE_LOCATION + '/lib/ruby'
    GEMS_LOCATION     = ONE_LOCATION + '/share/gems'
    ETC_LOCATION      = ONE_LOCATION + '/etc/'
end

# %%RUBYGEMS_SETUP_BEGIN%%
if File.directory?(GEMS_LOCATION)
    real_gems_path = File.realpath(GEMS_LOCATION)
    if !defined?(Gem) || Gem.path != [real_gems_path]
        $LOAD_PATH.reject! {|l| l =~ /vendor_ruby/ }

        # Suppress warnings from Rubygems
        # https://github.com/OpenNebula/one/issues/5379
        begin
            verb = $VERBOSE
            $VERBOSE = nil
            require 'rubygems'
            Gem.use_paths(real_gems_path)
        ensure
            $VERBOSE = verb
        end
    end
end
# %%RUBYGEMS_SETUP_END%%

$LOAD_PATH << RUBY_LIB_LOCATION

DUMMY_ACTIONS_DIR = "/tmp/opennebula_dummy_actions"

require "VirtualMachineDriver"
require "CommandManager"

# This is a dummy driver for the Virtual Machine management
#
# By default all the actions will succeed
#
# Action results can be specified in the DUMMY_ACTIONS_DIRS
#   * Example, Next deploy will fail
#       echo "failure" > $DUMMY_ACTIONS_DIR/deploy
#     If this file is not removed next deploy actions will fail
#       rm $DUMMY_ACTIONS_DIR/deploy
#         or
#       echo "success" > $DUMMY_ACTIONS_DIR/deploy
#
#   * Example, Defining multiple results per action
#       echo "success\nfailure" > $DUMMY_ACTIONS_DIR/deploy
#     The 1st deploy will succeed and the 2nd will fail. This
#       behavior will be repeated, i.e 3th success, 4th failure


class DummyDriver < VirtualMachineDriver
    def initialize
        super('',
            :concurrency => 15,
            :threaded => true
        )

        `mkdir #{DUMMY_ACTIONS_DIR}`

        @actions_counter = Hash.new(0)
    end

    def deploy(id, drv_message)
        msg = decode(drv_message)

        host = msg.elements["HOST"].text
        name = msg.elements["VM/NAME"].text

        result = retrieve_result("deploy")

        send_message(ACTION[:deploy],result,id,"#{host}:#{name}:dummy")
    end

    def shutdown(id, drv_message)
        result = retrieve_result("shutdown")

        send_message(ACTION[:shutdown],result,id)
    end

    def reboot(id, drv_message)
        result = retrieve_result("reboot")

        send_message(ACTION[:reboot],result,id)
    end

    def reset(id, drv_message)
        result = retrieve_result("reset")

        send_message(ACTION[:reset],result,id)
    end

    def cancel(id, drv_message)
        result = retrieve_result("cancel")

        send_message(ACTION[:cancel],result,id)
    end

    def save(id, drv_message)
        result = retrieve_result("save")

        send_message(ACTION[:save],result,id)
    end

    def restore(id, drv_message)
        result = retrieve_result("restore")

        send_message(ACTION[:restore],result,id)
    end

    def migrate(id, drv_message)
        result = retrieve_result("migrate")

        send_message(ACTION[:migrate],result,id)
    end

    def attach_disk(id, drv_message)
        result = retrieve_result("attach_disk")

        send_message(ACTION[:attach_disk],result,id)
    end

    def detach_disk(id, drv_message)
        result = retrieve_result("detach_disk")

        send_message(ACTION[:detach_disk],result,id)
    end

    def attach_nic(id, drv_message)
        result = retrieve_result("attach_nic")

        send_message(ACTION[:attach_nic],result,id)
    end

    def detach_nic(id, drv_message)
        result = retrieve_result("detach_nic")

        send_message(ACTION[:detach_nic],result,id)
    end

    def snapshot_create(id, drv_message)
        result = retrieve_result("snapshot_create")

        send_message(ACTION[:snapshot_create], result, id, "dummy-snap")
    end

    def snapshot_revert(id, drv_message)
        result = retrieve_result("snapshot_revert")

        send_message(ACTION[:snapshot_revert], result, id)
    end

    def snapshot_delete(id, drv_message)
        result = retrieve_result("snapshot_delete")

        send_message(ACTION[:snapshot_delete], result, id)
    end

    def disk_snapshot_create(id, drv_message)
        result = retrieve_result("disk_snapshot_create")

        send_message(ACTION[:disk_snapshot_create], result, id, "dummy-snap")
    end

    def update_conf(id, drv_message)
        result = retrieve_result("update_conf")

        send_message(ACTION[:update_conf], result, id)
    end

    def cleanup(id, drv_message)
        result = retrieve_result("cleanup")

        send_message(ACTION[:cleanup],result,id)
    end

    def update_sg(id, drv_message)
        result = retrieve_result("update_sg")

        xml_data = decode(drv_message)
        sg_id    = xml_data.elements['SECURITY_GROUP_ID'].text

        send_message(ACTION[:update_sg],result,id,sg_id)
    end

    def resize_disk(id, drv_message)
        result = retrieve_result("resize_disk")

        send_message(ACTION[:resize_disk], result, id)
    end

    def resize(id, drv_message)
        result = retrieve_result("resize")

        send_message(ACTION[:resize], result, id)
    end

    def backup(id, drv_message)
        result = retrieve_result("backup")

        send_message(ACTION[:backup], result, id, 'dummy-backup-id 1024')
    end

    def backup_cancel(id, drv_message)
        result = retrieve_result("backup_cancel")

        send_message(ACTION[:backup_cancel], result, id)
    end

    def update_nic(id, drv_message)
        result = retrieve_result("update_nic")

        xml_data = decode(drv_message)
        nic_id   = xml_data.elements['VIRTUAL_NETWORK_ID'].text

        send_message(ACTION[:update_nic], result, id, nic_id)
    end

    def poll(id, drv_message)
        result = retrieve_result("poll")

        msg = decode(drv_message)

        max_memory = 256
        if msg.elements["VM/TEMPLATE/MEMORY"]
            max_memory = msg.elements["VM/TEMPLATE/MEMORY"].text.to_i * 1024
        end

        max_cpu = 100
        if msg.elements["VM/TEMPLATE/CPU"]
            max_cpu = msg.elements["VM/TEMPLATE/CPU"].text.to_i * 100
        end

        prev_nettx = 0
        if msg.elements["VM/MONITORING/NETTX"]
            prev_nettx = msg.elements["VM/MONITORING/NETTX"].text.to_i
        end

        prev_netrx = 0
        if msg.elements["VM/MONITORING/NETRX"]
            prev_netrx = msg.elements["VM/MONITORING/NETRX"].text.to_i
        end

        # monitor_info: string in the form "VAR=VAL VAR=VAL ... VAR=VAL"
        # known VAR are in POLL_ATTRIBUTES. VM states VM_STATES
        monitor_info = "#{POLL_ATTRIBUTE[:state]}=#{VM_STATE[:active]} " \
                       "#{POLL_ATTRIBUTE[:nettx]}=#{prev_nettx+(50*rand(3))} " \
                       "#{POLL_ATTRIBUTE[:netrx]}=#{prev_netrx+(100*rand(4))} " \
                       "#{POLL_ATTRIBUTE[:memory]}=#{max_memory * (rand(80)+20)/100} " \
                       "#{POLL_ATTRIBUTE[:cpu]}=#{max_cpu * (rand(95)+5)/100} " \
                       "#{POLL_ATTRIBUTE[:disk_size]}=[ID=0, SIZE=#{rand(1024)}] "\
                       "#{POLL_ATTRIBUTE[:disk_size]}=[ID=1, SIZE=#{rand(1024)}] "\
                       "#{POLL_ATTRIBUTE[:snapshot_size]}=[ID=0, DISK_ID=0, SIZE=#{rand(1024)}] "

        send_message(ACTION[:poll],result,id,monitor_info)
    end

    private

    # Retrives the result for a given action from the OpenNebula core. Each
    # action has a defined set of responses in:
    #    /tmp/opennebula_dummy_actions/<action_name>
    #
    # Each line of this file represents a response in the form:
    #    <"sucess|0" | "failure|1" | "-"> [sleep]
    #
    #    - success or 1 returns SUCCESS
    #    - failure o 0 returns FAILURE
    #    - "-" returns nothing
    #    - sleep optional number of seconds to wait before answering
    #
    # Example: /tmp/opennebula_dummy_actions/deploy
    #  0
    #  0
    #  1 120
    #  1
    #  -
    #  0
    #
    def retrieve_result(action)
        begin
            actions = File.read(DUMMY_ACTIONS_DIR+"/#{action}")
        rescue
            return RESULT[:success]
        end

        actions_array = actions.split("\n")
        action_id     = @actions_counter[action]
        action_id     %= actions_array.size

        if actions_array && actions_array[action_id]

            @actions_counter[action] += 1

            result = actions_array[action_id].split

            case result[0]
            when "success", 1, "1"
                sleep result[1].to_i if result[1]
                return RESULT[:success]
            when "failure", 0, "0"
                sleep result[1].to_i if result[1]
                return RESULT[:failure]
            when "-"
                return nil
            else
                return RESULT[:success]
            end
        else
            return RESULT[:success]
        end
    end
end

dd = DummyDriver.new
dd.start_driver
