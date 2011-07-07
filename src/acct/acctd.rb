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

ONE_LOCATION=ENV["ONE_LOCATION"]

if !ONE_LOCATION
    RUBY_LIB_LOCATION="/usr/lib/one/ruby"
    ACCTD_CONF="/etc/one/acctd.conf"
else
    RUBY_LIB_LOCATION=ONE_LOCATION+"/lib/ruby"
    ACCTD_CONF=ONE_LOCATION+"/etc/acctd.conf"
end

$: << RUBY_LIB_LOCATION
$: << RUBY_LIB_LOCATION+"/acct"

require 'yaml'

require 'OpenNebula'
require 'sequel'
require 'watch_helper'

CONF = YAML.load_file(ACCTD_CONF)

class Watcher
    def initialize
        @monitors = Array.new
    end

    def add(resource, steps, pools)
        @monitors <<    {   :resource => resource,
                            :steps    => steps,
                            :pools    => [pools].flatten
                        }
    end

    def log(msg)
        STDERR.puts "#{Time.now} #{msg}"
    end

    def update(step)
        # clear pool cache
        @pool_cache = Hash.new

        @monitors.each do |monitor|
            if monitor[:steps] > 0 and step % monitor[:steps] == 0
                monitor[:pools].each do |pool|
                    resource = monitor[:resource]

                    log "#{resource.class}"

                    if pool_hash = @pool_cache[pool]
                    else
                        rc = pool.info
                        if OpenNebula.is_error?(rc)
                            log "Error: " + rc.message
                            log "Shutting down"
                            exit 1
                        end

                        pool_hash = pool.to_hash
                        @pool_cache[pool] = pool_hash
                    end

                    resource.insert(pool_hash)
                end
            end
        end
    end
end

watcher = Watcher.new

# OpenNebula variables
one_client  = OpenNebula::Client.new
vm_pool     = nil # common for accounting and monitoring
host_pool   = nil

# Initialize accounting
if CONF[:ACCOUNTING_STEPS] > 0
    require 'accounting'

    accounting  = OneWatch::Accounting.new(one_client)

    vm_pool     ||= OpenNebula::VirtualMachinePool.new(one_client, -2)

    watcher.add(accounting, CONF[:ACCOUNTING_STEPS], vm_pool)
end

# Initialize monitoring
if CONF[:MONITORING_STEPS] > 0
    require 'monitoring'

    vm_monitoring       = OneWatch::VmMonitoring.new(one_client)
    host_monitoring     = OneWatch::HostMonitoring.new(one_client)

    vm_pool     ||= OpenNebula::VirtualMachinePool.new(one_client, -2)
    host_pool   ||= OpenNebula::HostPool.new(one_client)

    watcher.add(vm_monitoring,   CONF[:MONITORING_STEPS], vm_pool)
    watcher.add(host_monitoring, CONF[:MONITORING_STEPS], host_pool)
end

step = 0
loop do
    start_time  = Time.now
    step        = step + 1

    watcher.update(step)

    diff_time = Time.now - start_time

    if diff_time < CONF[:STEP]
        sleep (CONF[:STEP] - diff_time)
    end
end
