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

require 'resources/resource'

module OneProvision

    # Represents the virtual resources
    class VirtualResource < Resource

        # Creates a new object in OpenNebula
        #
        # @param template     [Hash]   Object attributes
        # @param provision_id [String] Provision ID
        #
        # @return [Integer] Resource ID
        def create(template, provision_id)
            add_provision_id(template, provision_id)

            # create ONE object
            new_object

            rc = @one.allocate(format_template(template))
            Utils.exception(rc)
            rc = @one.info
            Utils.exception(rc)

            OneProvisionLogger.debug(
                "#{@type} created with ID: #{@one.id}"
            )

            @one.id.to_i
        end

    end

end
