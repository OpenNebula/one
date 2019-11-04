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
module NSXDriver

    # Class Logical Switch
    class LogicalSwitch < NSXDriver::NSXComponent

        # ATTRIBUTES
        attr_reader :ls_id
        attr_reader :tz_id
        attr_reader :replication_mode
        attr_reader :display_name
        attr_reader :description

        # CONSTRUCTOR

        def initialize(nsx_client)
            super(nsx_client)
        end

        def ls?; end

        # Get logical switch's name
        def ls_name; end

        # Get logical switch's vni
        def ls_vni; end

        # Get the Transport Zone of the logical switch
        def ls_tz; end

        # Create a new logical switch
        def new_logical_switch(ls_data); end

        # Delete a logical switch
        def delete_logical_switch; end

        # Update a logical switch
        def update_logical_switch; end

    end

end
