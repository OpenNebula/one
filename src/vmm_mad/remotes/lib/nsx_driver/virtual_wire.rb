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

    # Class VirtualWire NSX-V Network
    class VirtualWire < NSXDriver::LogicalSwitch

        # ATTRIBUTES
        HEADER = { :'Content-Type' => 'application/xml' }
        NAME_XPATH = '//virtualWire/name'
        VNI_XPATH = '//virtualWire/vdnId'
        BACKING_XPATH = '//virtualWire/vdsContextWithBacking/backingValue'
        OBJECTID_XPATH = '//virtualWire/vdsContextWithBacking/switch/objectId'
        TZ_XPATH = '//virtualWire/vdnScopeId'

        # CONSTRUCTOR
        def initialize(nsx_client, ls_id = nil, tz_id = nil, ls_data = nil)
            super(nsx_client)
            if ls_id
                initialize_with_id(ls_id)
            else
                if tz_id
                    if ls_data
                        @ls_id = new_logical_switch(ls_data, tz_id)
                        @ls_vni = ls_vni
                        @ls_name = ls_name
                        @tz_id = ls_tz
                        @tenant_id = 'virtual wire tenant'
                        @guest_vlan_allowed = false
                    end
                    raise 'Missing logical switch data' unless ls?
                end
            end
        end

        # Creates a NSXDriver::VirtualWire from its id
        def initialize_with_id(ls_id)
            @ls_id = ls_id
            if ls?
                @ls_vni =  ls_vni
                @ls_name = ls_name
                @tz_id = ls_tz
                @tenant_id = 'virtual wire tenant'
                @guest_vlan_allowed = false
            end
            raise "VirtualWire with id: #{ls_id} not found" unless ls?
        end

        # METHODS

        # Check if logical switch exists
        def ls?
            url = "#{@nsx_client.nsxmgr}/api/2.0/vdn/virtualwires/#{@ls_id}"
            @nsx_client.get_xml(url) ? true : false
        end

        # Get logical switch's name
        def ls_name
            url = "#{@nsx_client.nsxmgr}/api/2.0/vdn/virtualwires/#{@ls_id}"
            @nsx_client.get_xml(url).xpath(NAME_XPATH).text
        end

        # Get logical switch's vni
        def ls_vni
            url = "#{@nsx_client.nsxmgr}/api/2.0/vdn/virtualwires/#{@ls_id}"
            @nsx_client.get_xml(url).xpath(VNI_XPATH).text
        end

        # Get the Transport Zone of the logical switch
        def ls_tz
            url = "#{@nsx_client.nsxmgr}/api/2.0/vdn/virtualwires/#{@ls_id}"
            @nsx_client.get_xml(url).xpath(TZ_XPATH).text
        end

        # Get the logical switch reference into vcenter
        def ls_vcenter_ref
            url = "#{@nsx_client.nsxmgr}/api/2.0/vdn/virtualwires/#{@ls_id}"
            @nsx_client.get_xml(url).xpath(BACKING_XPATH).text
        end

        # Get the distributed virtual switch's ref associated to a LS
        def ls_dvs_ref(url)
            @nsx_client.get_xml(url).xpath(OBJECTID_XPATH).text
        end

        # Create a new logical switch (NSX-V: virtualwire)
        def new_logical_switch(ls_data, tz_id)
            url = "#{@nsx_client.nsxmgr}/api/2.0/vdn/scopes/#{tz_id}/" +
                  "virtualwires"
            @nsx_client.post_xml(url, ls_data)
        end

        # Delete a logical switch
        def delete_logical_switch
            url = "#{@nsx_client.nsxmgr}/api/2.0/vdn/virtualwires/#{@ls_id}"
            @nsx_client.delete(url, HEADER)
        end

    end

end
