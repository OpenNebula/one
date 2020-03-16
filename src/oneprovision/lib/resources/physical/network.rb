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

require 'resources/physical/physical_resource'

module OneProvision

    # Network
    class Network < PhysicalResource

        # Class constructor
        def initialize
            super

            @pool = OpenNebula::VirtualNetworkPool.new(@client)
            @type = 'network'
        end

        # Info an specific object
        #
        # @param id [String] Object ID
        def info(id)
            @one = OpenNebula::VirtualNetwork.new_with_id(id, @client)
            @one.info
        end

        private

        # Create new object
        def new_object
            @one = OpenNebula::VirtualNetwork.new(
                OpenNebula::VirtualNetwork.build_xml,
                @client
            )
        end

    end

end
