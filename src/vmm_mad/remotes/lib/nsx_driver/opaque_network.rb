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

    # Class Opaque Network NSX-T Network
    class OpaqueNetwork < NSXDriver::LogicalSwitch

        # ATTRIBUTES
        # attr_reader :ls_id, :admin_display
        HEADER = { :'Content-Type' => 'application/json' }

        # CONSTRUCTOR
        def initialize(nsx_client, ls_id = nil, _tz_id = nil, ls_data = nil)
            super(nsx_client)
            if ls_id
                initialize_with_id(ls_id)
            else
                if ls_data
                    @ls_id = new_logical_switch(ls_data)
                    @ls_vni = ls_vni
                    @ls_name = ls_name
                    @tz_id = ls_tz
                    @admin_display = 'UP'
                end
                raise 'Missing logical switch data' unless ls_data
            end
        end

        # Creates a NSXDriver::OpaqueNetwork from its id
        def initialize_with_id(ls_id)
            @ls_id = ls_id
            if ls?
                @ls_id = ls_id
                @ls_vni = ls_vni
                @ls_name = ls_name
                @admin_display = 'UP'
            end
            raise "Logical switch with id: #{ls_id} not found" unless ls?
        end

        # METHODS
        # Check if logical switch exists
        def ls?
            url = "#{@nsx_client.nsxmgr}/api/v1/logical-switches/#{@ls_id}"
            @nsx_client.get_json(url) ? true : false
        end

        # Get logical switch's name
        def ls_name
            url = "#{@nsx_client.nsxmgr}/api/v1/logical-switches/#{@ls_id}"
            @nsx_client.get_json(url)['display_name']
        end

        # Get logical switch's vni
        def ls_vni
            url = "#{@nsx_client.nsxmgr}/api/v1/logical-switches/#{@ls_id}"
            @nsx_client.get_json(url)['vni']
        end

        # Get the Transport Zone of the logical switch
        def ls_tz
            url = "#{@nsx_client.nsxmgr}/api/v1/logical-switches/#{@ls_id}"
            @nsx_client.get_json(url)['transport_zone_id']
        end

        # Create a new logical switch (NSX-T: opaque network)
        def new_logical_switch(ls_data)
            url = "#{@nsx_client.nsxmgr}/api/v1/logical-switches"
            @nsx_client.post_json(url, ls_data)
        end

        # Delete a logical switch
        def delete_logical_switch
            url = "#{@nsx_client.nsxmgr}/api/v1/logical-switches/#{@ls_id}"
            @nsx_client.delete(url, HEADER)
        end

    end

end
