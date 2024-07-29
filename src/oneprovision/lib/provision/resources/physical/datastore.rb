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

require 'provision/resources/physical/physical_resource'

module OneProvision

    # Datastore
    class Datastore < PhysicalResource

        # Class constructor
        #
        # @param provider   [Provider] Datastore provider
        # @param p_template [Hash]     Resource information in hash form
        def initialize(provider, p_template = nil)
            super

            @pool = OpenNebula::DatastorePool.new(@client)
            @type = 'datastore'
        end

        # Info an specific object
        #
        # @param id [String] Object ID
        def info(id)
            @one = OpenNebula::Datastore.new_with_id(id, @client)
            @one.info(true)
        end

        # Destroy datastore in provider
        #
        # @param provision [OpenNebula::Provision] Provision information
        # @param tf [Hash] Terraform configuration
        def destroy(provision, tf)
            Terraform.p_load

            terraform = Terraform.singleton(@provider, tf)
            terraform.destroy_datastore(provision, @one.id)
        end

        private

        # Create new object
        def new_object
            @one = OpenNebula::Datastore.new(OpenNebula::Datastore.build_xml,
                                             @client)
        end

    end

end
