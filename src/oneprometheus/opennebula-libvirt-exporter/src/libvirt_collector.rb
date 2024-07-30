# -------------------------------------------------------------------------- #
# Copyright 2002-2023, OpenNebula Project, OpenNebula Systems                #
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

require 'open3'
require 'prometheus/client'
require 'rexml/document'

ENV['LANG']   = 'C'
ENV['LC_ALL'] = 'C'

#-------------------------------------------------------------------------------
#  Libvirt Module. This module provides basic functionality to execute
#  virsh commands
#-------------------------------------------------------------------------------
module Libvirt

    # Default URI to connect to libvirt daemon
    LIBVIRT_URI = 'qemu:///system'

    # Constants for virsh commands
    COMMANDS = {
        :dominfo  => "virsh --connect #{LIBVIRT_URI} --readonly dominfo",
        :domstate => "virsh --connect #{LIBVIRT_URI} --readonly domstate",
        :list     => "virsh --connect #{LIBVIRT_URI} --readonly list",
        :dumpxml  => "virsh --connect #{LIBVIRT_URI} --readonly dumpxml",
        :domstats => "virsh --connect #{LIBVIRT_URI} --readonly domstats"
    }

    # @param command [Symbol] as defined in the module CONF constant
    def self.virsh(command, arguments)
        Open3.capture3("#{COMMANDS[command]} #{arguments}")
    end

end

#-------------------------------------------------------------------------------
#  Libvirt Module. This module provides basic functionality to execute
#  virsh commands
#
#  [1] https://libvirt.org/html/libvirt-libvirt-domain.html#virConnectGetAllDomainStats
#-------------------------------------------------------------------------------
class LibvirtDomain

    attr_reader :domain

    # --------------------------------------------------------------------------
    # Instance variables that store domain statitics for different areas. Each
    # stat may refer to single components (e.g. cpu):
    #  @cpu = {
    #    "time"   => "99196706981502",
    #    "user"   => "85358250000000",
    #    "system" => "12549140000000"
    #  }
    #
    # or multiple devices (e.g. disk block devices) indexed by ID
    #  @block = {
    #    "count" => "2",
    #    "0" => {
    #      "name"      => "vda",
    #      "rd_reqs"   => "207979",
    #      "rd_bytes"  => "8762597888",
    #       ...
    #       "physical" => "4921245696"
    #    },
    #    "1" => {
    #       "name"     => "hda",
    #       "rd_reqs"  => "317",
    #       "rd_bytes" => "1145692",
    #       ...
    #
    # Metadata for OpenNebula VMs are availbale through @one
    #  @one = {
    #    :name             => "ubuntu2204-func-6-4-2-072c-0.test",
    #    :system_datastore => "/var/lib/one//datastores/0/161",
    #    :uname =>"oneadmin",
    #    :uid   =>"0",
    #    :gname =>"oneadmin",
    #    :gid   =>"0",
    #    :opennebula_version =>"6.4.1",
    #    :stime           =>"1664446859",
    #    :deployment_time =>"1665072011"
    #  }
    # --------------------------------------------------------------------------
    STATS = [:state, :cpu, :balloon, :vcpu, :net, :block]

    def initialize(domain, stats_s)
        @labels = {
            :domain    => domain,
            :one_vm_id => domain.split('-')[1]
        }

        stats_s.each_line do |l|
            next if l.empty?

            name, value = l.split('=')

            next if name.nil? || name.empty? || value.nil? || value.empty?

            parts = name.split('.')
            sname = "@#{parts[0].strip}"

            instance_variable_set(sname, {}) unless instance_variable_defined?(sname)

            stat = instance_variable_get(sname)

            if parts.size == 2 || (parts.size > 2 && !parts[1].match(/[0-9]+/))
                index = 1
            else
                index = 2
                stat[parts[1]] ||= {}

                stat = stat[parts[1]]
            end

            metric = parts[index..-1].join('_').gsub('-', '_')

            stat[metric] = value.chop
        end

        @one = {}

        return unless ENV['ONE_PROMETHEUS_VM_NAMES']

        # Add Domain metadata
        out, _err, rc = Libvirt.virsh(:dumpxml, "#{domain}")

        begin
            if rc.success?
                doc = REXML::Document.new(out)

                @one[:name] = doc.elements['domain/name'].text

                doc.elements.each('domain/metadata/one:vm/*') do |elem|
                    @one[elem.name.to_sym] = elem.text
                end
            end
        rescue StandardError
        end

        # metadata labels
        @labels[:one_vm_name] = ''
        @labels[:one_vm_name] = @one[:name] if @one[:name]
    end

    # --------------------------------------------------------------------------
    # --------------------------------------------------------------------------
    def set_metrics(metrics)
        STATS.each do |stat_class|
            next unless instance_variable_defined?("@#{stat_class}")

            stat     = instance_variable_get("@#{stat_class}")
            lmetrics = LibvirtCollector.const_get("#{stat_class.upcase}_METRICS")

            stat.each do |stat_name, value|
                if stat_name.match(/[0-9]+/)
                    value.each do |sstat_name, svalue|
                        mname  = "#{stat_class}.#{sstat_name}"
                        metric = metrics[mname]
                        conf   = lmetrics[mname]

                        gauge_set(metric, conf, stat_name, svalue, value)
                    end
                else
                    mname  = "#{stat_class}.#{stat_name}"
                    metric = metrics[mname]
                    conf   = lmetrics[mname]

                    gauge_set(metric, conf, stat_name, value, stat)
                end
            end
        end
    end

    private

    # --------------------------------------------------------------------------
    # --------------------------------------------------------------------------
    def gauge_set(metric, conf, name, value, stat)
        return if conf.nil? || metric.nil?

        if conf[:render]
            mvalue = conf[:render].call(value)
        else
            mvalue = Integer(value)
        end

        if conf[:render_labels]
            mlabels = @labels.merge(conf[:render_labels].call(name, stat))
        else
            mlabels = @labels
        end

        metric.set(mvalue, :labels => mlabels)
    end

end

# ------------------------------------------------------------------------------
# TBD
#
#  Gauge is used as metric type as it can go back to 0 when the domain resets
# ------------------------------------------------------------------------------
module Prometheus
    # Patch base classes to clear internal stores each scrape
    # this allows for some metrics to disappear between scrapes
    # Concurrent scrapes are not supported
    module Client
        class Registry
            def clear
                @mutex.synchronize do
                    @metrics.each_value { |m| m.clear if m }
                end
            end
        end

        class Metric
            def clear
                @store.clear
            end
        end

        class DataStores::Synchronized
            private

            class MetricStore
                def clear
                    synchronize { @internal_store.clear }
                end
            end
        end
    end
end

class LibvirtCollector < Prometheus::Middleware::Collector

    include Libvirt

    # Labels that be added to every metric
    #   - domain: the libvirt domain ID
    #   - one_vm_id: the opennebula associated VM ID.
    #   - one_vm_name: the opennebula NAME attribute of the VM
    LIBVIRT_LABELS = [:domain, :one_vm_id]
    LIBVIRT_LABELS << :one_vm_name if ENV['ONE_PROMETHEUS_VM_NAMES']

    # Metrics are named within this namesapce
    NAMESPACE = 'opennebula_libvirt'

    # --------------------------------------------------------------------------
    # STATE metrics
    # --------------------------------------------------------------------------
    #   - opennebula_libvirt_state
    STATE_METRICS = {
        'state.state' => {
            :name   => 'state',
            :type   => :gauge,
            :docstr => 'State of the domain 0:no_state, 1:running, 2:blocked, ' \
                       '3:paused, 4:shutdown, 5:shutoff, 6:chrased, 7:suspended (PM)',
            :labels => LIBVIRT_LABELS + [:reason],
            :render_labels => ->(_i, stat) { { :reason => stat['reason'] } }
        }
    }

    # --------------------------------------------------------------------------
    # CPU metrics
    # --------------------------------------------------------------------------
    #   - opennebula_libvirt_cpu_seconds_total
    #   - opennebula_libvirt_cpu_system_seconds_total
    #   - opennebula_libvirt_cpu_user_seconds_total
    # --------------------------------------------------------------------------
    CPU_METRICS = {
        'cpu.time' => {
            :name   => 'cpu_seconds_total',
            :type   => :gauge,
            :docstr => 'Total CPU time used by the domain',
            :render => ->(v) { Integer(v) / 10**9 },
            :labels => LIBVIRT_LABELS
        },
        'cpu.system' => {
            :name   => 'cpu_system_seconds_total',
            :type   => :gauge,
            :docstr => 'System CPU time used by the domain',
            :render => ->(v) { Integer(v) / 10**9 },
            :labels => LIBVIRT_LABELS
        },
        'cpu.user' => {
            :name   => 'cpu_user_seconds_total',
            :type   => :gauge,
            :docstr => 'User CPU time used by the domain',
            :render => ->(v) { Integer(v) / 10**9 },
            :labels => LIBVIRT_LABELS
        }
    }

    # --------------------------------------------------------------------------
    # Memory metrics
    # --------------------------------------------------------------------------
    #   - opennebula_libvirt_memory_total_bytes
    #   - opennebula_libvirt_memory_maximum_bytes
    #   - opennebula_libvirt_memory_swapin_bytes_total
    #   - opennebula_libvirt_memory_swapout_bytes_total
    #   - opennebula_libvirt_memory_unsed_bytes
    #   - opennebula_libvirt_memory_available_bytes
    #   - opennebula_libvirt_memory_rss_bytes
    # --------------------------------------------------------------------------
    BALLOON_METRICS = {
        'balloon.current' => {
            :name   => 'memory_total_bytes',
            :type   => :gauge,
            :docstr => 'Total memory currently used by the domain',
            :render => ->(v) { Integer(v) * 1024 },
            :labels => LIBVIRT_LABELS
        },
        'balloon.maximum' => {
            :name   => 'memory_maximum_bytes',
            :type   => :gauge,
            :docstr => 'Total memory currently used by the domain',
            :render => ->(v) { Integer(v) * 1024 },
            :labels => LIBVIRT_LABELS
        },
        'balloon.swap_in' => {
            :name   => 'memory_swapin_bytes_total',
            :type   => :gauge,
            :docstr => 'Amount of data read from swap space',
            :render => ->(v) { Integer(v) * 1024 },
            :labels => LIBVIRT_LABELS
        },
        'balloon.swap_out' => {
            :name   => 'memory_swapout_bytes_total',
            :type   => :gauge,
            :docstr => 'Amount of data written out to swap space',
            :render => ->(v) { Integer(v) * 1024 },
            :labels => LIBVIRT_LABELS
        },
        'balloon.unused' => {
            :name   => 'memory_unsed_bytes',
            :type   => :gauge,
            :docstr => 'Amount of memory left unused by the system',
            :render => ->(v) { Integer(v) * 1024 },
            :labels => LIBVIRT_LABELS
        },
        'balloon.available' => {
            :name   => 'memory_available_bytes',
            :type   => :gauge,
            :docstr => 'Amount of usable memory as seen by the domain',
            :render => ->(v) { Integer(v) * 1024 },
            :labels => LIBVIRT_LABELS
        },
        'balloon.rss' => {
            :name   => 'memory_rss_bytes',
            :type   => :gauge,
            :docstr => 'Resident Set Size of running domain\'s process',
            :render => ->(v) { Integer(v) * 1024 },
            :labels => LIBVIRT_LABELS
        }
    }

    # --------------------------------------------------------------------------
    # Virtual CPU metrics
    # --------------------------------------------------------------------------
    #   - opennebula_libvirt_vcpu_online
    #   - opennebula_libvirt_vcpu_maximum
    #   - opennebula_libvirt_vcpu_state
    #   - opennebula_libvirt_vcpu_time_seconds_total
    #   - opennebula_libvirt_vcpu_wait_seconds_total
    # --------------------------------------------------------------------------
    VCPU_METRICS = {
        'vcpu.current' => {
            :name   => 'vcpu_online',
            :type   => :gauge,
            :docstr => 'Current number of online virtual CPUs',
            :labels => LIBVIRT_LABELS
        },
        'vcpu.maximum' => {
            :name   => 'vcpu_maximum',
            :type   => :gauge,
            :docstr => 'Maximum number of online virtual CPUs',
            :labels => LIBVIRT_LABELS
        },
        'vcpu.state' => {
            :name   => 'vcpu_state',
            :type   => :gauge,
            :docstr => 'State of the virtual CPU 0:offline, 1:running, 2:blocked',
            :labels => LIBVIRT_LABELS + [:vcpu],
            :render_labels => ->(i, _stat) { { :vcpu => i } }
        },
        'vcpu.time' => {
            :name   => 'vcpu_time_seconds_total',
            :type   => :gauge,
            :docstr => 'vitual cpu time spent by virtual CPU',
            :render => ->(v) { Integer(v) / 10**9 },
            :labels => LIBVIRT_LABELS + [:vcpu],
            :render_labels => ->(i, _stat) { { :vcpu => i } }
        },
        'vcpu.wait' => {
            :name   => 'vcpu_wait_seconds_total',
            :type   => :gauge,
            :docstr => 'Time the vCPU wants to run, but the host scheduler' \
                       ' has something else running ahead of it',
            :render => ->(v) { Integer(v) / 10**9 },
            :labels => LIBVIRT_LABELS + [:vcpu],
            :render_labels => ->(i, _stat) { { :vcpu => i } }
        }
    }

    # --------------------------------------------------------------------------
    # Network interface metrics
    # --------------------------------------------------------------------------
    #   - opennebula_libvirt_net_vnics
    #   - opennebula_libvirt_net_rx_total_bytes
    #   - opennebula_libvirt_net_rx_packets
    #   - opennebula_libvirt_net_rx_errors
    #   - opennebula_libvirt_net_rx_drops
    #   - opennebula_libvirt_net_tx_total_bytes
    #   - opennebula_libvirt_net_tx_packets
    #   - opennebula_libvirt_net_tx_errors
    #   - opennebula_libvirt_net_tx_drops
    # --------------------------------------------------------------------------
    NET_METRICS = {
        'net.count' => {
            :name   => 'net_devices',
            :type   => :gauge,
            :docstr => 'Total number of network interfaces on this domain',
            :labels => LIBVIRT_LABELS,
        },
        'net.rx_bytes' => {
            :name   => 'net_rx_total_bytes',
            :type   => :gauge,
            :docstr => 'Total bytes received by the vNIC',
            :labels => LIBVIRT_LABELS + [:vnic, :device],
            :render_labels => ->(i, stat) { { :vnic => i, :device => stat['name'] } }
        },
        'net.rx_pkts' => {
            :name   => 'net_rx_packets',
            :type   => :gauge,
            :docstr => 'Total number of packets received by the vNIC',
            :labels => LIBVIRT_LABELS + [:vnic, :device],
            :render_labels => ->(i, stat) { { :vnic => i, :device => stat['name'] } }
        },
        'net.rx_errs' => {
            :name   => 'net_rx_errors',
            :type   => :gauge,
            :docstr => 'Total number of receive errors',
            :labels => LIBVIRT_LABELS + [:vnic, :device],
            :render_labels => ->(i, stat) { { :vnic => i, :device => stat['name'] } }
        },
        'net.rx_drop' => {
            :name   => 'net_rx_drops',
            :type   => :gauge,
            :docstr => 'Total number of receive packets dropped by the vNIC',
            :labels => LIBVIRT_LABELS + [:vnic, :device],
            :render_labels => ->(i, stat) { { :vnic => i, :device => stat['name'] } }
        },
        'net.tx_bytes' => {
            :name   => 'net_tx_total_bytes',
            :type   => :gauge,
            :docstr => 'Total bytes transmitted by the vNIC',
            :labels => LIBVIRT_LABELS + [:vnic, :device],
            :render_labels => ->(i, stat) { { :vnic => i, :device => stat['name'] } }
        },
        'net.tx_pkts' => {
            :name   => 'net_tx_packets',
            :type   => :gauge,
            :docstr => 'Total number of packets transmitted by the vNIC',
            :labels => LIBVIRT_LABELS + [:vnic, :device],
            :render_labels => ->(i, stat) { { :vnic => i, :device => stat['name'] } }
        },
        'net.tx_errs' => {
            :name   => 'net_tx_errors',
            :type   => :gauge,
            :docstr => 'Total number of transmission errors',
            :labels => LIBVIRT_LABELS + [:vnic, :device],
            :render_labels => ->(i, stat) { { :vnic => i, :device => stat['name'] } }
        },
        'net.tx_drop' => {
            :name   => 'net_tx_drops',
            :type   => :gauge,
            :docstr => 'Total number of transmit packets dropped by the vNIC',
            :labels => LIBVIRT_LABELS + [:vnic, :device],
            :render_labels => ->(i, stat) { { :vnic => i, :device => stat['name'] } }
        }
    }

    # --------------------------------------------------------------------------
    # Block device metrics
    # --------------------------------------------------------------------------
    #   - opennebula_libvirt_block_devices
    #   - opennebula_libvirt_block_rd_requests
    #   - opennebula_libvirt_block_rd_bytes
    #   - opennebula_libvirt_block_rd_time_seconds
    #   - opennebula_libvirt_block_wr_requests
    #   - opennebula_libvirt_block_wr_bytes
    #   - opennebula_libvirt_block_wr_time_seconds
    #   - opennebula_libvirt_block_virtual_bytes
    #   - opennebula_libvirt_block_physical_bytes
    # --------------------------------------------------------------------------
    BLOCK_METRICS = {
        'block.count' => {
            :name   => 'block_devices',
            :type   => :gauge,
            :docstr => 'Total number of block devices on this domain',
            :labels => LIBVIRT_LABELS,
        },
        'block.rd_reqs' => {
            :name   => 'block_rd_requests',
            :type   => :gauge,
            :docstr => 'Total number of read requests',
            :labels => LIBVIRT_LABELS + [:disk, :device],
            :render_labels => ->(i, stat) { { :disk => i, :device => stat['name'] } }
        },
        'block.rd_bytes' => {
            :name   => 'block_rd_bytes',
            :type   => :gauge,
            :docstr => 'Total number of read bytes',
            :labels => LIBVIRT_LABELS + [:disk, :device],
            :render_labels => ->(i, stat) { { :disk => i, :device => stat['name'] } }
        },
        'block.rd_times' => {
            :name   => 'block_rd_time_seconds',
            :type   => :gauge,
            :docstr => 'Total time spent on reads',
            :render => ->(v) { Integer(v) / 10**9 },
            :labels => LIBVIRT_LABELS + [:disk, :device],
            :render_labels => ->(i, stat) { { :disk => i, :device => stat['name'] } }
        },
        'block.wr_reqs' => {
            :name   => 'block_wr_requests',
            :type   => :gauge,
            :docstr => 'Total number of write requests',
            :labels => LIBVIRT_LABELS + [:disk, :device],
            :render_labels => ->(i, stat) { { :disk => i, :device => stat['name'] } }
        },
        'block.wr_bytes' => {
            :name   => 'block_wr_bytes',
            :type   => :gauge,
            :docstr => 'Total number of written bytes',
            :labels => LIBVIRT_LABELS + [:disk, :device],
            :render_labels => ->(i, stat) { { :disk => i, :device => stat['name'] } }
        },
        'block.wr_times' => {
            :name   => 'block_wr_time_seconds',
            :type   => :gauge,
            :docstr => 'Total time spent on writes',
            :render => ->(v) { Integer(v) / 10**9 },
            :labels => LIBVIRT_LABELS + [:disk, :device],
            :render_labels => ->(i, stat) { { :disk => i, :device => stat['name'] } }
        },
        'block.capacity' => {
            :name   => 'block_virtual_bytes',
            :type   => :gauge,
            :docstr => 'Virtual size of the device',
            :labels => LIBVIRT_LABELS + [:disk, :device],
            :render_labels => ->(i, stat) { { :disk => i, :device => stat['name'] } }
        },
        'block.physical' => {
            :name   => 'block_physical_bytes',
            :type   => :gauge,
            :docstr => 'Physical size of the container of the backing image',
            :labels => LIBVIRT_LABELS + [:disk, :device],
            :render_labels => ->(i, stat) { { :disk => i, :device => stat['name'] } }
        }
    }

    # --------------------------------------------------------------------------
    ALL_METRICS = [
        STATE_METRICS,
        CPU_METRICS,
        BALLOON_METRICS,
        VCPU_METRICS,
        NET_METRICS,
        BLOCK_METRICS
    ]
    # --------------------------------------------------------------------------

    def initialize(app)
        # Initialize registry and metrics
        super(app, :metrics_prefix => NAMESPACE)

        @libvirt_metrics = {}
        @rec_mutex       = Mutex.new

        # Define all metrics in the Promethues client registry
        ALL_METRICS.each do |m|
            m.each do |name, conf|
                @libvirt_metrics[name] = @registry.method(conf[:type]).call(
                    "#{NAMESPACE}_#{conf[:name]}".to_sym,
                    :docstring => conf[:docstr],
                    :labels    => conf[:labels]
                )
            end
        end

        # Libvirt globael state
        @libvirt_state_metric = @registry.gauge(
            "#{NAMESPACE}_daemon_up".to_sym,
            :docstring => 'State of the libvirt daemon 0:down 1:up'
        )
    end

    def record(env, code, duration)
        @rec_mutex.synchronize { single_record(env, code, duration) }
    end

    private

    def single_record(env, code, duration)
        @registry.clear

        #super(env, code, duration)
        Prometheus::Middleware::Collector.instance_method(:record).bind(self).call(env, code, duration)

        out, _err, rc = Libvirt.virsh(:domstats, '')

        if !rc.success?
            @libvirt_state_metric.set(0)
            return
        end

        @libvirt_state_metric.set(1)

        domain = { :id => '', :txt => '' }

        set_metrics = lambda do
            ld = LibvirtDomain.new(domain[:id], domain[:txt])
            ld.set_metrics(@libvirt_metrics)
        end

        out.each_line do |line|
            m = line.match(/Domain: '([^']*)'/)

            if m
                if domain[:txt].empty?
                    domain[:id] = m[1]
                else
                    set_metrics.call

                    domain[:txt] = ''
                    domain[:id]  = m[1]
                end
            else
                domain[:txt] << line
            end
        end

        # Make sure to handle the last domain!
        set_metrics.call
    rescue StandardError
        nil
    end

end
