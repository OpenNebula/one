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

module OneForm

    # Provider document schema
    class ProviderSchema < ODS::Schema

        include ODS::UserInputsRules

        params do
            required(:name).filled(:string)
            optional(:description).filled(:string)
            required(:driver).filled(:string)

            required(:fireedge).hash do
                optional(:logo).filled(:string)
            end

            required(:connection).hash
            required(:user_inputs).array(:hash)

            required(:provision_ids).array(:integer)
            required(:registration_time).filled(:integer)
        end

    end

    # Provision document schema
    class ProvisionSchema < ODS::Schema

        include ODS::UserInputsRules

        params do
            required(:name).filled(:string)
            optional(:description).filled(:string)
            required(:deployment_file).filled(:string)
            optional(:onedeploy_tags).filled(:string)
            required(:provider_id).filled(:integer)

            required(:fireedge).hash do
                optional(:logo).filled(:string)
            end

            required(:user_inputs).array(:hash)
            required(:user_inputs_values).hash

            required(:one_objects).hash do
                required(:cluster).maybe(:hash)
                required(:shared).hash do
                    required(:hosts).hash do
                        required(:template).hash
                    end
                end
                required(:hosts).maybe(:array)
                required(:networks).filled(:array)
                required(:datastores).filled(:array)
            end

            required(:state).filled(
                :string,
                :included_in? => Provision.states.map(&:to_s)
            )
            required(:tfstate).value(:string)
            required(:registration_time).filled(:integer)
        end

    end

end
