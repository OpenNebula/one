# -------------------------------------------------------------------------- #
# Copyright 2002-2026, OpenNebula Project, OpenNebula Systems                #
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

module OneKS

    # Dispatches API callbacks through a resource lifecycle workflow.
    module ApiEvents

        # Schema for a Kubernetes node readiness callback.
        class NodeReadyEventSchema < Dry::Validation::Contract

            json do
                required(:vm_id).filled(:integer, :gteq? => 0)
                required(:ready).filled(:bool)
            end

        end

        # Schema for an application state callback from the Kubernetes monitor.
        class AppStateChangedEventSchema < Dry::Validation::Contract

            json do
                required(:state).filled(
                    :string, :included_in? => ['installing', 'ready', 'deleting', 'done']
                )
                required(:release_name).filled(:string)
                required(:resource_version).filled(:integer, :gteq? => 0)
                optional(:parent).filled(:string)
            end

        end

        # Schema for an application failure callback from the Kubernetes monitor.
        class AppFailedEventSchema < Dry::Validation::Contract

            json do
                required(:error_msg).filled(:string)
                required(:release_name).filled(:string)
                required(:resource_version).filled(:integer, :gteq? => 0)
                optional(:parent).filled(:string)
            end

        end

        PAYLOAD_SCHEMAS = {
            ClusterLCM => {
                :app_state_changed => AppStateChangedEventSchema,
                :app_failed        => AppFailedEventSchema
            },
            GroupLCM => {
                :node_ready => NodeReadyEventSchema
            }
        }

        def self.dispatch(lcm, resource_id, event:, payload: {})
            event_name = event.to_s
            event      = lcm.class::API_EVENTS[event_name]

            return OpenNebula::Error.new(
                "Event #{event_name} is not available through the API",
                ODS::ResponseHelper::VALIDATION_EC
            ) unless event

            payload = validate_payload(lcm, event, payload)
            return payload if OpenNebula.is_error?(payload)

            lcm.dispatch_event(resource_id, event, **payload)
        end

        def self.validate_payload(source, event, payload)
            return OpenNebula::Error.new(
                'Event payload must be an object', ODS::ResponseHelper::VALIDATION_EC
            ) unless payload.is_a?(Hash)

            payload = payload.transform_keys(&:to_sym)
            schema  = PAYLOAD_SCHEMAS.dig(source.class, event)
            return payload unless schema

            result = schema.new.call(payload)
            return result.to_h if result.success?

            OpenNebula::Error.new(
                "Invalid #{event} event payload: #{result.errors.to_h}",
                ODS::ResponseHelper::VALIDATION_EC
            )
        end

        private_class_method :validate_payload

    end

end
