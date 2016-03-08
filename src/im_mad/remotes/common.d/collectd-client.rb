#!/usr/bin/env ruby

# -------------------------------------------------------------------------- #
# Copyright 2002-2015, OpenNebula Project, OpenNebula Systems                #
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
require 'resolv'
require 'ipaddr'


DIRNAME = File.dirname(__FILE__)
REMOTE_DIR_UPDATE = File.join(DIRNAME, '../../.update')

class CollectdClient
    def initialize(hypervisor, number, host, port, probes_args,
                   monitor_push_period)
        # Arguments
        @hypervisor          = hypervisor
        @number              = number.to_i
        @host                = get_ipv4_address(host)
        @port                = port
        @monitor_push_period = monitor_push_period

        # Probes
        run_probes_cmd = File.join(DIRNAME, '..', "run_probes")
        @run_probes_cmd = "#{run_probes_cmd} #{@hypervisor}-probes #{probes_args}"

        # Get last update
        @last_update = get_last_update

        # Socket
        @s = UDPSocket.new
    end

    def get_ipv4_address(host)
        addresses=Resolv.getaddresses(host)
        address=nil

        addresses.each do |addr|
            begin
                a=IPAddr.new(addr)
                if a.ipv4?
                    address=addr
                    break
                end
            rescue
            end
        end

        address
    end

    def run_probes
        data   = `#{@run_probes_cmd} 2>&1`
        code   = $?.exitstatus == 0

        data64 = Base64::encode64(data).strip.delete("\n")

        [data64, code]
    end

    def send(data)
        message, code = data
        result = code ? "SUCCESS" : "FAILURE"
        @s.send("MONITOR #{result} #{@number} #{message}\n", 0, @host, @port)
    end

    def monitor
        loop do
            # Stop the execution if we receive the update signal
            exit 0 if stop?

            # Collect the Data
            ts = Time.now
            data = run_probes

            run_probes_time = (Time.now - ts).to_i

            # Send the Data
            send data

            # Sleep during the Cycle
            sleep_time = @monitor_push_period - run_probes_time
            sleep_time = 0 if sleep_time < 0
            sleep sleep_time
        end
    end

    def get_last_update
        File.stat(REMOTE_DIR_UPDATE).mtime.to_i rescue 0
    end

    def stop?
        get_last_update.to_i != @last_update.to_i
    end
end

#Arguments: hypervisor(0) ds_location(1) collectd_port(2) monitor_push_period(3)
#                         host_id(4) hostname(5)

hypervisor          = ARGV[0]
port                = ARGV[2]
monitor_push_period = ARGV[3].to_i
number              = ARGV[4]

monitor_push_period = 20 if monitor_push_period == 0

host       = ENV['SSH_CLIENT'].split.first
probes_args= ARGV[1..-1].join(" ")

# Add a random sleep before the first send
sleep rand monitor_push_period

# Start push monitorization
client = CollectdClient.new(hypervisor, number, host, port, probes_args,
                            monitor_push_period)
client.monitor
