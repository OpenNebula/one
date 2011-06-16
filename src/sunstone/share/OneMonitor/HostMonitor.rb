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

require 'OneMonitor'

class HostMonitor < OneMonitor
    #:time, :id labels
    HOST_MONITORING_ELEMS = {
        :time => "LAST_MON_TIME",
        :id => "ID",
        :name => "NAME",
        :state => "STATE",
        :cluster => "CLUSTER",
        :disk_usage => "HOST_SHARE/DISK_USAGE",
        :cpu_usage => "HOST_SHARE/CPU_USAGE",
        :mem_usage => "HOST_SHARE/MEM_USAGE",
        :max_mem => "HOST_SHARE/MAX_MEM",
        :max_disk => "HOST_SHARE/MAX_DISK",
        :max_cpu => "HOST_SHARE/MAX_CPU",
        :free_mem => "HOST_SHARE/FREE_MEM",
        :free_disk => "HOST_SHARE/FREE_DISK",
        :free_cpu => "HOST_SHARE/FREE_CPU",
        :used_disk => "HOST_SHARE/USED_DISK",
        :used_mem => "HOST_SHARE/USED_MEM",
        :used_cpu => "HOST_SHARE/USED_CPU"
    }

    def initialize (log_file_folder,monitoring_elems=HOST_MONITORING_ELEMS)
        super log_file_folder,monitoring_elems
    end

    def factory(client)
        HostPool.new(client)
    end

    def active (host_hash)
        host_hash[:state].to_i < 3
    end

    def error (host_hash)
        host_hash[:state].to_i == 3
    end

    def log_snapshot
        time = Time.new
        puts "#{time.strftime("%Y-%m-%d %H:%M:%S")} - Hosts have been monitored\n"
        STDOUT.flush
    end
end
