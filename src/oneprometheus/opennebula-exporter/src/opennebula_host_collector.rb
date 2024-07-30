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

require 'opennebula'

class OpenNebulaHostCollector

    LABELS = %i[one_host_id]

    # --------------------------------------------------------------------------
    # Host metrics
    # --------------------------------------------------------------------------
    #   - opennebula_host_total
    #   - opennebula_host_state
    #   - opennebula_host_mem_total_bytes
    #   - opennebula_host_mem_maximum_bytes
    #   - opennebula_host_cpu_total_ratio
    #   - opennebula_host_cpu_maximum_ratio
    #   - opennebula_host_cpu_usage_ratio
    #   - opennebula_host_vms
    # --------------------------------------------------------------------------
    HOST_METRICS = {
        'host_total' => {
            :type   => :gauge,
            :docstr => 'Total number of hosts defined in OpenNebula',
            :labels => {}
        },
        'host_state' => {
            :type   => :gauge,
            :docstr => 'Host state 0:init 2:monitored 3:error 4:disabled ' \
                       '8:offline',
            :value  => ->(v) { Integer(v['STATE']) },
            :labels => LABELS
        },
        'host_mem_total_bytes' => {
            :type   => :gauge,
            :docstr => 'Total memory capacity',
            :value  => ->(v) { Integer(v['HOST_SHARE/TOTAL_MEM']) * 1024 },
            :labels => LABELS
        },
        'host_mem_maximum_bytes' => {
            :type   => :gauge,
            :docstr => 'Total memory capacity considering overcommitment',
            :value  => ->(v) { Integer(v['HOST_SHARE/MAX_MEM']) * 1024 },
            :labels => LABELS
        },
        'host_mem_usage_bytes' => {
            :type   => :gauge,
            :docstr => 'Total memory capacity allocated to VMs',
            :value  => ->(v) { Integer(v['HOST_SHARE/MEM_USAGE']) * 1024 },
            :labels => LABELS
        },
        'host_cpu_total_ratio' => {
            :type   => :gauge,
            :docstr => 'Total CPU capacity',
            :xpath  => 'HOST_SHARE/TOTAL_CPU',
            :value  => ->(v) { Integer(v['HOST_SHARE/TOTAL_CPU']) },
            :labels => LABELS
        },
        'host_cpu_maximum_ratio' => {
            :type   => :gauge,
            :docstr => 'Total CPU capacity considering overcommitment',
            :value  => ->(v) { Integer(v['HOST_SHARE/MAX_CPU']) },
            :labels => LABELS
        },
        'host_cpu_usage_ratio' => {
            :type   => :gauge,
            :docstr => 'Total CPU capacity allocated to VMs',
            :value  => ->(v) { Integer(v['HOST_SHARE/CPU_USAGE']) },
            :labels => LABELS
        },
        'host_vms' => {
            :type   => :gauge,
            :docstr => 'Number of VMs allocated to the host',
            :value  => ->(v) {
                ids = v.retrieve_elements('VMS/ID')

                if ids
                    ids.size
                else
                    0
                end
            },
            :labels => LABELS
        }
    }

    def initialize(registry, client, namespace)
        @client  = client
        @metrics = {}

        HOST_METRICS.each do |name, conf|
            @metrics[name] = registry.method(conf[:type]).call(
                      "#{namespace}_#{name}".to_sym,
                      :docstring => conf[:docstr],
                      :labels    => conf[:labels])
        end
    end

    def collect
        host_pool = OpenNebula::HostPool.new(@client)
        rc        = host_pool.info_all!

        raise rc.message if OpenNebula.is_error?(rc)

        hosts = host_pool.retrieve_xmlelements('/HOST_POOL/HOST')

        @metrics['host_total'].set(hosts.length)

        hosts.each do |host|
            labels = { :one_host_id => Integer(host['ID']) }

            HOST_METRICS.each do |name, conf|
                next unless conf[:value]

                metric = @metrics[name]
                value  = conf[:value].call(host)

                next unless metric

                metric.set(value, :labels => labels)
            end
        end
    end
end

