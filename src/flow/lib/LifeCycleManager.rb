# -------------------------------------------------------------------------- #
# Copyright 2002-2015, OpenNebula Project, OpenNebula Systems                #
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

require 'strategy'

class ServiceLCM

    LOG_COMP = "LCM"

    def initialize(sleep_time, cloud_auth)
        @sleep_time = sleep_time
        @cloud_auth = cloud_auth
    end

    def loop()
        Log.info LOG_COMP, "Starting Life Cycle Manager"

        while true
            srv_pool = ServicePool.new(@cloud_auth.client)

            rc = srv_pool.info_all()

            if OpenNebula.is_error?(rc)
                Log.error LOG_COMP, "Error retrieving the Service Pool: #{rc.message}"
            else
                srv_pool.each_xpath('DOCUMENT/ID') { |id|
                    rc_get = srv_pool.get(id.to_i) { |service|
                        owner_client = @cloud_auth.client(service.owner_name)
                        service.replace_client(owner_client)

                        Log.debug LOG_COMP, "Loop for service #{service.id()} #{service.name()}" \
                                " #{service.state_str()} #{service.strategy()}"

                        strategy = get_deploy_strategy(service)

                        case service.state()
                        when Service::STATE['PENDING']
                            service.set_state(Service::STATE['DEPLOYING'])

                            rc = strategy.boot_step(service)
                            if !rc[0]
                                service.set_state(Service::STATE['FAILED_DEPLOYING'])
                            end
                        when Service::STATE['DEPLOYING']
                            strategy.monitor_step(service)

                            if service.all_roles_running?
                                service.set_state(Service::STATE['RUNNING'])
                            elsif service.any_role_failed?
                                service.set_state(Service::STATE['FAILED_DEPLOYING'])
                            else
                                rc = strategy.boot_step(service)
                                if !rc[0]
                                    service.set_state(Service::STATE['FAILED_DEPLOYING'])
                                end
                            end
                        when Service::STATE['RUNNING'], Service::STATE['WARNING']
                            strategy.monitor_step(service)

                            if service.all_roles_running?
                                if service.state() == Service::STATE['WARNING']
                                    service.set_state(Service::STATE['RUNNING'])
                                end
                            else
                                if service.state() == Service::STATE['RUNNING']
                                    service.set_state(Service::STATE['WARNING'])
                                end
                            end

                            if strategy.apply_scaling_policies(service)
                                service.set_state(Service::STATE['SCALING'])

                                rc = strategy.scale_step(service)
                                if !rc[0]
                                    service.set_state(Service::STATE['FAILED_SCALING'])
                                end
                            end
                        when Service::STATE['SCALING']
                            strategy.monitor_step(service)

                            if service.any_role_failed_scaling?
                                service.set_state(Service::STATE['FAILED_SCALING'])
                            elsif service.any_role_cooldown?
                                service.set_state(Service::STATE['COOLDOWN'])
                            elsif !service.any_role_scaling?
                                service.set_state(Service::STATE['RUNNING'])
                            else
                                rc = strategy.scale_step(service)
                                if !rc[0]
                                    service.set_state(Service::STATE['FAILED_SCALING'])
                                end
                            end
                        when Service::STATE['COOLDOWN']
                            strategy.monitor_step(service)

                            if !service.any_role_cooldown?
                                service.set_state(Service::STATE['RUNNING'])
                            end
                        when Service::STATE['FAILED_SCALING']
                            strategy.monitor_step(service)

                            if !service.any_role_failed_scaling?
                                service.set_state(Service::STATE['SCALING'])
                            end
                        when Service::STATE['UNDEPLOYING']
                            strategy.monitor_step(service)

                            if service.all_roles_done?
                                service.set_state(Service::STATE['DONE'])
                            elsif service.any_role_failed?
                                service.set_state(Service::STATE['FAILED_UNDEPLOYING'])
                            else
                                rc = strategy.shutdown_step(service)
                                if !rc[0]
                                    service.set_state(Service::STATE['FAILED_UNDEPLOYING'])
                                end
                            end
                        when Service::STATE['FAILED_DEPLOYING']
                            strategy.monitor_step(service)

                            if !service.any_role_failed?
                                service.set_state(Service::STATE['DEPLOYING'])
                            end
                        when Service::STATE['FAILED_UNDEPLOYING']
                            strategy.monitor_step(service)

                            if !service.any_role_failed?
                                service.set_state(Service::STATE['UNDEPLOYING'])
                            end
                        end

                        rc = service.update()
                        if OpenNebula.is_error?(rc)
                            Log.error LOG_COMP, "Error trying to update " <<
                                "Service #{service.id()} : #{rc.message}"
                        end
                    }

                    if OpenNebula.is_error?(rc_get)
                      Log.error LOG_COMP, "Error getting Service " <<
                        "#{id}: #{rc_get.message}"
                    end
              }
            end

            sleep @sleep_time
        end
    end

private
    # Returns the deployment strategy for the given Service
    # @param [Service] service the service
    # @return [Strategy] the deployment Strategy
    def get_deploy_strategy(service)
        strategy = Strategy.new

        case service.strategy
        when 'straight'
            strategy.extend(Straight)
        end

        return strategy
    end
end
