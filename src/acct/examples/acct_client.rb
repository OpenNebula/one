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

require 'watch_helper'

class AcctClient
    def prolog_time(t1, t2, opts={})
        times(t1, t2, opts) { |reg|
            calculate_time(t1, t2, reg.pstime, reg.petime)
        }
    end

    def running_time(t1, t2, opts={})
        # TBD Suspened VMs

        times(t1, t2, opts) { |reg|
            calculate_time(t1, t2, reg.rstime, reg.retime)
        }
    end

    def epilog_time(t1, t2, opts={})
        times(t1, t2, opts) { |reg|
            calculate_time(t1, t2, reg.estime, reg.eetime)
        }
    end

    private

    def times(t1, t2, opts={}, &block)
        time = 0

        vms = filter_vms(opts)

        if vms && !vms.empty?
            vms.each { |vm|
                vm.registers.each { |reg|
                    time += block.call(reg)
                }
            }
        end

        time
    end

    def calculate_time(t1, t2, stime, etime)
        if etime < t1 && etime != 0
            return 0
        elsif stime < t2 && stime != 0
            if etime < t2 && etime != 0
                e = etime
            else
                e = t2
            end

            s = stime > t1 ? stime : t1
            return e - s
        end

        return 0
    end

    def filter_vms(opts={})
        opts ||= {}

        if opts[:uid]
            vms = WatchHelper::Vm.filter(:uid=>opts[:uid])
        elsif opts[:gid]
            vms = WatchHelper::Vm.filter(:gid=>opts[:gid])
        elsif opts[:hid]
            vms = WatchHelper::Vm.filter(
                    :registers=>WatchHelper::Register.filter(:hid => opts[:hid]))
        elsif opts[:vmid]
            vms = WatchHelper::Vm.filter(:id=>opts[:vmid])
        else
            vms = WatchHelper::Vm
        end
    end
end
