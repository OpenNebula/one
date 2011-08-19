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

module OneWatchClient
    require 'acct/watch_helper'

    class WatchClient
        def vm_monitoring(id, opts=[])
            if resource = WatchHelper::Vm[id]
                resource_monitoring(
                    resource,
                    "VM",
                    WatchHelper::VM_SAMPLE,
                    opts
                )
            else
                return nil
            end
        end

        def host_monitoring(id, opts=[])
            if resource = WatchHelper::Host[id]
                resource_monitoring(
                    resource,
                    "HOST",
                    WatchHelper::HOST_SAMPLE,
                    opts
                )
            else
                return nil
            end
        end

        def vm_total(opts=[])
            total_monitoring(
                WatchHelper::VmSample,
                "VM",
                WatchHelper::VM_SAMPLE,
                opts
            )
        end

        def host_total(opts=[])
            total_monitoring(
                WatchHelper::HostSample,
                "HOST",
                WatchHelper::HOST_SAMPLE,
                opts
            )
        end

        private

        def total_monitoring(rsql, kind, allowed_samples, monitoring_resources)
            hash = Hash.new
            hash[:resource] = "#{kind.upcase}_POOL"

            mon = Hash.new
            monitoring_resources.each { |opt|
                opt = opt.to_sym
                if allowed_samples.has_key?(opt)
                    mon[opt] = sum_monitoring(rsql, kind, opt)
                elsif [:total, :active, :error].include?(opt)
                    mon[opt] = count_monitoring(rsql, opt)
                end
            }

            hash[:monitoring] = mon

            hash
        end

        def sum_monitoring(rsql, kind, mr)
            a = Array.new

            WatchHelper::DB.fetch(
                "SELECT last_poll,sum(u#{mr}) AS sum_#{mr} FROM " <<
                    "(SELECT last_poll, max(#{mr}) AS u#{mr} "    <<
                    "FROM #{kind.downcase}_samples "              <<
                    "GROUP BY #{kind.downcase}_id, last_poll) "   <<
                "GROUP BY last_poll;"
            ) do |row|
                if row[:last_poll] && row[:last_poll] != 0
                    a << [row[:last_poll], row["sum_#{mr}".to_sym].to_i]
                end
            end

            a
        end

        def count_monitoring(rsql, opt)
            resources = case opt
            when :total then  rsql
            when :active then rsql.active
            when :error  then rsql.error
            else return nil
            end

            a = Array.new
            resources.group_and_count(:timestamp).all.each { |row|
                a << [row[:timestamp], row[:count].to_i]
            }

            a
        end

        def resource_monitoring(rsql, kind, allowed_sample, monitoring_resources)
            hash = Hash.new
            hash[:resource] = kind
            hash[:id] = rsql.id

            mon = Hash.new
            monitoring_resources.each { |mr|
                if allowed_sample.has_key?(mr.to_sym)
                    mon[mr] = Array.new
                else
                    monitoring_resources.delete(mr)
                end
            }

            rsql.samples_dataset.map { |sample|
                monitoring_resources.each { |mr|
                    if sample.last_poll && sample.last_poll != 0
                        mon[mr] << [sample.last_poll, sample.send(mr.to_sym)]
                    end
                }
            }

            hash[:monitoring] = mon

            hash
        end
    end
end