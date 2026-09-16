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

# Apps Controller
module OneForm

    # Drivers Controller
    module DriverController

        extend ODS::GenericController

        BASE_PATH = '/drivers'

        # GET /drivers
        # Params:
        #   :enabled [Boolean] - Returns only enabled drivers
        get do
            drivers = OneForm::Driver.list
            next drivers if OpenNebula.is_error?(drivers)

            params.key?(:enabled) ? drivers.select(&:enabled?) : drivers
        end

        # GET /drivers/:name
        # Params:
        #   :name [String] - Driver name
        get ':name' do
            driver = OneForm::Driver.from_name(params[:name])
            next driver if OpenNebula.is_error?(driver)

            next OpenNebula::Error.new(
                "Driver '#{params[:name]}' not found",
                OpenNebula::Error::ENO_EXISTS
            ) unless driver

            driver
        end

        # GET /drivers/:name/:deployment/inputs
        # Params:
        #   :name [String] - Driver name
        #   :deployment [String] - Deployment inventory name
        get ':name/:deployment/inputs' do
            driver = OneForm::Driver.from_name(params[:name])
            next driver if OpenNebula.is_error?(driver)

            next OpenNebula::Error.new(
                "Driver '#{params[:name]}' not found",
                OpenNebula::Error::ENO_EXISTS
            ) unless driver

            driver.deployment_inputs(params[:deployment])
        end

        # POST /drivers/sync
        post 'sync', :oneadmin_only => true do
            OneForm::Driver.sync
        end

        # POST /drivers/:name/enable
        post ':name/enable', :oneadmin_only => true, :response => false do
            OneForm::Driver.enable(params[:name])
        end

        # POST /drivers/:name/disable
        post ':name/disable', :oneadmin_only => true, :response => false do
            OneForm::Driver.disable(params[:name])
        end

        def self.registered(app)
            register_routes(app)
        end

    end

end
