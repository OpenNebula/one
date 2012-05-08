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
require "CommandManager"

class DummyDriver < VirtualMachineDriver
    def initialize
        super('',
            :concurrency => 15,
            :threaded => true
        )
    end

    def deploy(id, drv_message)
        msg = decode(drv_message)

        host = msg.elements["HOST"].text
        name = msg.elements["VM/NAME"].text

        send_message(ACTION[:deploy],RESULT[:success],id,"#{host}:#{name}:dummy")
    end

    def shutdown(id, drv_message)
        send_message(ACTION[:shutdown],RESULT[:success],id)
    end

    def reboot(id, drv_message)
        send_message(ACTION[:reboot],RESULT[:success],id)
    end

    def reset(id, drv_message)
        send_message(ACTION[:reset],RESULT[:success],id)
    end

    def cancel(id, drv_message)
        send_message(ACTION[:cancel],RESULT[:success],id)
    end

    def save(id, drv_message)
        send_message(ACTION[:save],RESULT[:success],id)
    end

    def restore(id, drv_message)
        send_message(ACTION[:restore],RESULT[:success],id)
    end

    def migrate(id, drv_message)
        send_message(ACTION[:migrate],RESULT[:success],id)
    end

    def poll(id, drv_message)
        # monitor_info: string in the form "VAR=VAL VAR=VAL ... VAR=VAL"
        # known VAR are in POLL_ATTRIBUTES. VM states VM_STATES
        monitor_info = "#{POLL_ATTRIBUTE[:state]}=#{VM_STATE[:active]} " \
                       "#{POLL_ATTRIBUTE[:nettx]}=12345"

        send_message(ACTION[:poll],RESULT[:success],id,monitor_info)
    end

    end

dd = DummyDriver.new
dd.start_driver
