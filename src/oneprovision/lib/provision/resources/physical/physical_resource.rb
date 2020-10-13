# -------------------------------------------------------------------------- #
# Copyright 2002-2020, OpenNebula Project, OpenNebula Systems                #
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

        # Creates the object in OpenNebula
        #
        # @param template   [Hash]    Object attributes
        # @param cluster_id [Integer] Cluster ID
        #
        # @return [Integer] Resource ID
        def create(template, cluster_id)
            # create ONE object
            new_object

            rc = @one.allocate(format_template(template), cluster_id)
            Utils.exception(rc)
            rc = @one.info
            Utils.exception(rc)

            OneProvisionLogger.debug(
                "#{@type} created with ID: #{@one.id}"
            )

            Integer(@one.id)
        end

    end

end
