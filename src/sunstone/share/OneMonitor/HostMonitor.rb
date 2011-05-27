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

    def initialize (log_file,monitoring_elems=HOST_MONITORING_ELEMS)
        super log_file,monitoring_elems
    end

    def monitor
        super HostPool
    end

    def snapshot
        super HostPool
    end

    def active (host_hash)
        host_hash[:state].to_i < 3
    end

    def error (host_hash)
        host_hash[:state].to_i == 3
    end
end
