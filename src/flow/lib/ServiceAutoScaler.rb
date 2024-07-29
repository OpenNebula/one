# -------------------------------------------------------------------------- #
# Copyright 2002-2024, OpenNebula Project, OpenNebula Systems                #
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

# Service auto scaler class
class ServiceAutoScaler

    LOG_COMP = 'AE'

    # Class constructor
    #
    # @param service_pool [OpenNebula::ServicePool] Service pool
    # @param cloud_auth   [OpenNebula::CloudAuth]   Cloud auth to get clients
    # @param lcm          [LifeCycleManager]        Lcm for flows
    def initialize(service_pool, cloud_auth, lcm)
        @lcm        = lcm
        @interval   = cloud_auth.conf[:autoscaler_interval]
        @srv_pool   = service_pool
        @cloud_auth = cloud_auth
    end

    # Start auto scaler loop
    def start
        loop do
            @srv_pool.info

            vm_pool = VirtualMachinePool.new(@cloud_auth.client)

            # -2 to get all resources, 0 just to get last record
            monitoring = vm_pool.monitoring_xml(-2, 0)
            monitoring = XMLElement.new(XMLElement.build_xml(monitoring,
                                                             'MONITORING_DATA'))
            monitoring = monitoring.to_hash['MONITORING_DATA']
            monitoring = monitoring['MONITORING'] if monitoring
            monitoring = [monitoring].flatten

            vm_pool.info_all_extended

            @srv_pool.each do |service|
                # fill service roles information
                service.info_roles

                next if service.state != Service::STATE['RUNNING']

                Log.info LOG_COMP,
                         'Checking policies for ' \
                         "service: #{service.id}"

                apply_scaling_policies(service, vm_pool, monitoring)
            end

            sleep(@interval)
        end
    end

    private

    # If a role needs to scale, its cardinality is updated, and its state is set
    # to SCALING. Only one role is set to scale.
    #
    # @param service    [OpenNebula::Service]
    # @param vm_pool    [OpenNebula::VirtualMachinePool] VM pool
    # @param monitoring [Hash]                           Monitoring data
    def apply_scaling_policies(service, vm_pool, monitoring)
        service.roles.each do |name, role|
            diff, cooldown_duration = role.scale?({ :vm_pool    => vm_pool,
                                                    :monitoring => monitoring })

            policies = {}
            policies['elasticity_policies'] = role.elasticity_policies
            policies['scheduled_policies']  = role.scheduled_policies

            # if diff is zero, cooldown doesn't matter
            cooldown_duration = nil if diff == 0

            @lcm.update_role_policies(nil,
                                      service.id,
                                      name,
                                      policies,
                                      cooldown_duration)

            next unless diff != 0

            Log.info LOG_COMP,
                     "Applying scalinig policies to service: #{service.id}"

            Log.info LOG_COMP,
                     "Role #{name} needs to scale #{diff} nodes", service.id

            @lcm.scale_action(nil,
                              service.id,
                              name,
                              role.cardinality + diff,
                              false)
        end
    end

end
