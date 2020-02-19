# rubocop:disable Naming/FileName
# -------------------------------------------------------------------------- #
# Copyright 2002-2019, OpenNebula Project, OpenNebula Systems                #
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
    # @param clien        [OpenNebula::Client]      OpenNebula Client
    # @param cloud_auth   [OpenNebula::CloudAuth]   Cloud auth to get clients
    # @param lcm          [LifeCycleManager]        Lcm for flows
    def initialize(service_pool, client, cloud_auth, lcm)
        @lcm        = lcm
        @interval   = cloud_auth.conf[:autoscaler_interval]
        @srv_pool   = service_pool
        @vm_pool    = VirtualMachinePool.new(cloud_auth.client)
        @cloud_auth = cloud_auth
        @client     = client
    end

    # Start auto scaler loop
    def start
        loop do
            @srv_pool.info
            @vm_pool.info_all_extended

            @srv_pool.each do |service|
                # fill service roles information
                service.info_roles

                next if service.state == Service::STATE['DONE']

                Log.info LOG_COMP,
                         'Checking policies for ' \
                         "service: #{service.id}"

                apply_scaling_policies(service)
            end

            sleep(@interval)
        end
    end

    private

    # Get OpenNebula client
    def client
        # If there's a client defined use it
        return @client unless @client.nil?

        # If not, get one via cloud_auth
        @cloud_auth.client
    end

    # If a role needs to scale, its cardinality is updated, and its state is set
    # to SCALING. Only one role is set to scale.
    #
    # @param  [OpenNebula::Service] service
    def apply_scaling_policies(service)
        service.roles.each do |name, role|
            diff, cooldown_duration = role.scale?(@vm_pool)

            policies = {}
            policies['elasticity_policies'] = role.elasticity_policies
            policies['scheduled_policies']  = role.scheduled_policies

            @lcm.update_role_policies(client,
                                      service.id,
                                      name,
                                      policies,
                                      cooldown_duration)

            next unless diff != 0

            Log.info LOG_COMP,
                     "Applying scalinig policies to service: #{service.id}"

            Log.info LOG_COMP,
                     "Role #{name} needs to scale #{diff} nodes", service.id

            @lcm.scale_action(client,
                              service.id,
                              name,
                              role.cardinality + diff,
                              false)
        end
    end

end
# rubocop:enable Naming/FileName
