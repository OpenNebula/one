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

require 'provision/resources/resource'

module OneProvision

    # Represents a physical resource for the provision
    class PhysicalResource < Resource

        # Class constructor
        #
        # @param provider   [Provider] Resource provider
        # @param p_template [Hash]     Resource information in hash form
        def initialize(provider, p_template)
            super(p_template)

            @provider = provider
        end

        # Creates the object in OpenNebula
        #
        # @param cluster_id [Integer] Cluster ID
        #
        # @return [Integer] Resource ID
        def create(cluster_id)
            # create ONE object
            new_object

            rc = @one.allocate(format_template(@p_template), cluster_id)
            Utils.exception(rc)
            rc = @one.info
            Utils.exception(rc)

            OneProvisionLogger.debug(
                "#{@type} created with ID: #{@one.id}"
            )

            Integer(@one.id)
        end

        # Deletes the resource
        #
        # @param force     [Boolean]   Force object deletion
        # @param provision [Provision] Provision information
        # @param tf        [Hash]      Terraform :conf and :state
        #
        # @return [Array]
        #   - Terraform state in base64
        #   - Terraform config in base64
        def delete(force, provision, tf = nil)
            state, conf = destroy(provision, tf) if tf && !tf.empty?

            if force
                @one.delete
            else
                Utils.exception(@one.delete)
            end

            if state && conf
                [state, conf]
            else
                0
            end
        end

    end

end
