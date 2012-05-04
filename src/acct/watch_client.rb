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

module OneWatchClient
    require 'acct/watch_helper'

    class WatchClient
        TOTAL_COUNT = [:total, :active, :error]

        def resource_monitoring(id, monitoring_resources=[], filter={})
            # Retrieve Sequel resource
            rsql = filter_resource(id, filter)
            return nil if rsql.nil?

            # By default show all the available monitoring resources.
            # If a set of monitoring resources is specified
            # select only the allowed ones
            allowed_keys = allowed_samples.keys
            if monitoring_resources && !monitoring_resources.empty?
                monitoring_resources = allowed_keys & monitoring_resources
            else
                monitoring_resources = allowed_keys
            end

            # Initialize monitoring information
            mon = Hash.new
            monitoring_resources.each { |mr|
                mon[mr] = Array.new
            }

            # Retrieve information
            rsql.samples_dataset.map { |sample|
                monitoring_resources.each { |mr|
                    if sample.last_poll && sample.last_poll != 0
                        mon[mr] << [sample.last_poll, sample.send(mr.to_sym)]
                    end
                }
            }

            # Format response in a Hash
            hash = Hash.new
            hash[:resource]   = kind
            hash[:id]         = rsql.id
            hash[:monitoring] = mon
            hash
        end

        def total_monitoring(monitoring_resources=[], filter={})
            # Retrieve Sequel resource
            rsql = filter_pool(filter)
            return nil if rsql.nil?

            # By default show all the available monitoring resources.
            # If a set of monitoring resources is specified
            # select only the allowed ones
            allowed_keys = allowed_samples.keys + TOTAL_COUNT
            if monitoring_resources && !monitoring_resources.empty?
                monitoring_resources = allowed_keys & monitoring_resources
            else
                monitoring_resources = allowed_keys
            end

            # Retrieve information
            mon = Hash.new
            monitoring_resources.each { |opt|
                opt = opt.to_sym
                if allowed_samples.has_key?(opt)
                    mon[opt] = sum_monitoring(rsql, opt)
                elsif TOTAL_COUNT.include?(opt)
                    mon[opt] = count_monitoring(rsql, opt)
                end
            }

            # Format response in a Hash
            hash = Hash.new
            hash[:resource] = "#{kind.upcase}_POOL"
            hash[:monitoring] = mon
            hash
        end

        private

        def sum_monitoring(rsql, mr)
            # Get the MAX for each VM and last_poll value
            max_per_vm =
                rsql.
                group(:timestamp).
                select{[:timestamp, sum(mr.to_sym).as(:sum_mr)]}

            # Add all the existing timestamps
            with_ts = timestamps.left_join(max_per_vm, :timestamp=>:id)
            with_ts.collect do |row|
                [row[:id], row[:sum_mr].to_i]
            end
        end

        def count_monitoring(rsql, opt)
            resources = case opt
                when :total  then rsql
                when :active then active(rsql)
                when :error  then error(rsql)
                else return nil
            end

            count = resources.group_and_count(:timestamp)

            # Add all the existing timestamps
            with_ts = timestamps.left_join(count, :timestamp=>:id)
            with_ts.collect do |row|
                [row[:id], row[:count].to_i]
            end
        end
    end

    class HostWatchClient < WatchClient
        def pool
            WatchHelper::Host
        end

        def allowed_samples
            WatchHelper::HOST_SAMPLE
        end

        def kind
            "HOST"
        end

        def active(pool)
            pool.filter('state < 3')
        end

        def error(pool)
            pool.filter(:state=>3)
        end

        def timestamps
            WatchHelper::HostTimestamp
        end

        def filter_pool(filter)
            if filter[:uid]
                filter[:uid]==0 ? (hosts = pool) : (return nil)
            elsif filter[:gid]
                filter[:gid]==0 ? (hosts = pool) : (return nil)
            else
                hosts = pool
            end

            WatchHelper::HostSample.join(hosts.select(:id.as(:host_id)), [:host_id])
        end

        def filter_resource(id, filter)
            rsql = pool[id]
            return nil if rsql.nil?

            if filter[:uid]
                filter[:uid]==0 ? rsql : nil
            elsif filter[:gid]
                filter[:gid]==0 ? rsql : nil
            else
                rsql
            end
        end
    end

    class VmWatchClient < WatchClient
        def pool
            WatchHelper::Vm
        end

        def allowed_samples
            WatchHelper::VM_SAMPLE
        end

        def kind
            "VM"
        end

        def active(pool)
            pool.filter(:state=>3)
        end

        def error(pool)
            pool.filter(:state=>7)
        end

        def timestamps
            WatchHelper::VmTimestamp
        end

        def filter_pool(filter)
            if filter[:uid]
                vms = pool.filter(:uid=>filter[:uid])
            elsif filter[:gid]
                vms = pool.filter(:gid=>filter[:gid])
            else
                vms = pool
            end

            WatchHelper::VmSample.join(vms.select(:id.as(:vm_id)), [:vm_id])
        end

        def filter_resource(id, filter)
            rsql = pool[id]
            return nil if rsql.nil?

            if filter[:uid]
                filter[:uid]==rsql.uid ? rsql : nil
            elsif filter[:gid]
                filter[:gid]==rsql.gid ? rsql : nil
            else
                rsql
            end
        end
    end
end
