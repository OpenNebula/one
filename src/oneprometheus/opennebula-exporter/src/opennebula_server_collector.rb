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

require 'socket'

class OpenNebulaServerCollector

    FQDN = Addrinfo.getaddrinfo(Socket.gethostname, nil).first.getnameinfo.first

    LABELS = %i[one_server_fqdn]

    # --------------------------------------------------------------------------
    # Server metrics
    # --------------------------------------------------------------------------
    #   - opennebula_server_state
    # --------------------------------------------------------------------------
    SERVER_METRICS = {
        'oned_state' => {
            :type   => :gauge,
            :docstr => 'OpenNebula oned service state 0:down 1:up',
            :labels => LABELS,
            :systemd => 'opennebula.service'
        },
        'scheduler_state' => {
            :type   => :gauge,
            :docstr => 'OpenNebula scheduler service state 0:down 1:up',
            :labels => LABELS,
            :systemd => 'opennebula-scheduler.service'
        },
        'flow_state' => {
            :type   => :gauge,
            :docstr => 'OpenNebula Flow service state 0:down 1:up',
            :labels => LABELS,
            :systemd => 'opennebula-flow.service'
        },
        'hem_state' => {
            :type   => :gauge,
            :docstr => 'OpenNebula hook manager service state 0:down 1:up',
            :labels => LABELS,
            :systemd => 'opennebula-hem.service'
        },
        'gate_state' => {
            :type   => :gauge,
            :docstr => 'OpenNebula Gate service state 0:down 1:up',
            :labels => LABELS,
            :systemd => 'opennebula-gate.service'
        }
    }

    def initialize(registry, client, namespace)
        @client  = client
        @metrics = {}

        SERVER_METRICS.each do |name, conf|
            @metrics[name] = registry.method(conf[:type]).call(
                      "#{namespace}_#{name}".to_sym,
                      :docstring => conf[:docstr],
                      :labels    => conf[:labels])
        end
    end

    def collect
        SERVER_METRICS.each do |name, conf|
            @metrics[name].set(
                is_active(conf[:systemd]),
                :labels => { :one_server_fqdn => FQDN }
            )
        end
    end

    private

    def is_active(service)
        if `systemctl show --value -p ActiveState #{service}`.strip == 'active'
            1
        else
            0
        end
    rescue
        0
    end
end
