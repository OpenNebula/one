#!/usr/bin/env ruby

# -------------------------------------------------------------------------- #
# Copyright 2002-2013, OpenNebula Project (OpenNebula.org), C12G Labs        #
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

require 'socket'
require 'base64'

DIRNAME = File.dirname(__FILE__)
REMOTE_DIR_UPDATE = File.join(DIRNAME, '../../.update')

CYCLE       = 20
TOTAL_HOSTS = 1000

SLEEP       = 1

class CollectdClient
    def initialize(hypervisor, number, host, port, probes_args)
        # Arguments
        @hypervisor = hypervisor
        @number     = number.to_i
        @host       = host
        @port       = port

        # Monitorization slot
        hosts_per_cycle = TOTAL_HOSTS.to_f / CYCLE.to_f
        @my_slot = ((@number % TOTAL_HOSTS) / hosts_per_cycle).to_i

        # Probes
        run_probes_cmd = File.join(DIRNAME, '..', "run_probes")
        @run_probes_cmd = "#{run_probes_cmd} #{@hypervisor}-probes #{probes_args}"

        # Get last update
        @last_update = get_last_update

        # Socket
        @s = UDPSocket.new
    end

    def run_probes
        data   = `#{@run_probes_cmd}`
        data64 = Base64::encode64(data).strip.delete("\n")

        return data64
    end

    def send(data)
        @s.send("MONITOR SUCCESS #{@number} #{data}\n", 0, @host, @port)
    end

    def do_send?(current, last_send)
        current_cycle = current[0]
        current_slot  = current[1]

        last_cycle    = last_send[0]
        last_slot     = last_send[1]

        if last_slot < @my_slot
            min_cycle = last_cycle
        else
            min_cycle = last_cycle + 1
        end

        if current_cycle > min_cycle
            return true
        elsif current_cycle < min_cycle
            return false
        else
            return current_slot >= @my_slot
        end
    end

    def monitor
        initial = true
        data    = run_probes

        last_send = nil

        loop do
            # Stop the execution if we receive the update signal
            exit 0 if stop?

            t = Time.now.to_i

            current_cycle = t / CYCLE
            current_slot  = t % CYCLE

            current = [current_cycle, current_slot]

            if initial
                last_send = current
                initial   = false
            end

            if do_send?(current, last_send)
                send data
                last_send = current

                data = run_probes
            end

            sleep SLEEP
        end
    end

    def get_last_update
        File.stat(REMOTE_DIR_UPDATE).mtime.to_i rescue 0
    end

    def stop?
        get_last_update.to_i != @last_update.to_i
    end
end

#Arguments: hypervisor(0) ds_location(1) collectd_port(2) host_id(3) hostname(4)
hypervisor = ARGV[0]
number     = ARGV[3]
port       = ARGV[2]

host       = ENV['SSH_CLIENT'].split.first
probes_args= ARGV[1..-1].join(" ")

client = CollectdClient.new(hypervisor, number, host, port, probes_args)
client.monitor
