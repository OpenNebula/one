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
module NSXDriver

    # Class VirtualWire NSX-V Network
    class VirtualWire < LogicalSwitch

        # CONSTRUCTOR
        def initialize(nsx_client, ls_id = nil, tz_id = nil, ls_data = nil)
            super(nsx_client)
            if ls_id
                initialize_with_id(ls_id)
            else
                if tz_id && ls_data
                    begin
                        @ls_id = new_logical_switch(ls_data, tz_id)
                    rescue NSXError::IncorrectResponseCodeError => e
                        raise 'VirtualWire not created in NSX Manager: ' \
                              "#{e.message}"
                    end
                    unless @ls_id
                        raise 'Virtual Wire not created in NSX Manager: ' \
                              'generic error'
                    end

                    # Construct URL of the created logical switch
                    @url_ls = NSXConstants::NSXV_LS_SECTION + @ls_id
                    @ls_vni = ls_vni
                    @ls_name = ls_name
                    @tz_id = ls_tz
                    @tenant_id = 'virtual wire tenant'
                    @guest_vlan_allowed = false
                end
            end
        end

        # Creates a VirtualWire from its name
        def self.new_from_name(nsx_client, ls_name)
            virtualwire = new(nsx_client)
            ls_id = virtualwire.ls_id_from_name(nsx_client, ls_name)
            unless ls_id
                error_msg = "VirtualWire with name: #{ls_name} not found"
                error = NSXError::ObjectNotFound
                        .new(error_msg)
                raise error
            end

            # initialize_with_id(@ls_id)
            virtualwire.initialize_with_id(ls_id)
            virtualwire
        end

        # Creates a VirtualWire from its id
        def initialize_with_id(ls_id)
            @ls_id = ls_id
            # Construct URL of the created logical switch
            @url_ls = NSXConstants::NSXV_LS_SECTION + \
                      @ls_id
            # Raise an error if VirtualWire id doesn't exists
            unless ls?
                error_msg = "VirtualWire with id: #{ls_id} not found"
                error = NSXError::ObjectNotFound
                        .new(error_msg)
                raise error
            end

            @ls_vni =  ls_vni
            @ls_name = ls_name
            @tz_id = ls_tz
            @tenant_id = 'virtual wire tenant'
            @guest_vlan_allowed = false
        end

        # Get the logical switch id from its name
        def ls_id_from_name(nsx_client, name)
            url = NSXConstants::NSXV_LS_SECTION
            virtualwires = nsx_client
                           .get(url)
                           .xpath(NSXConstants::NSXV_LS_XPATH)
            virtualwires.each do |virtualwire|
                lsname_arr = name.split('-sid-')
                lsname = lsname_arr[-1].split('-', 2)[-1]
                lsid = lsname_arr[0].split(/vxw-dvs-\w.-/)[-1]
                if virtualwire.xpath('name').text == lsname &&
                   virtualwire.xpath('objectId').text == lsid
                    return virtualwire.xpath('objectId').text
                end
            end
            nil
        end

        # METHODS

        # Check if logical switch exists
        def ls?
            @nsx_client.get(@url_ls) ? true : false
        end

        # Get logical switch's name
        def ls_name
            @nsx_client.get(@url_ls)
                       .xpath(NSXConstants::NSXV_LS_NAME_XPATH).text
        end

        # Get logical switch's vni
        def ls_vni
            @nsx_client.get(@url_ls)
                       .xpath(NSXConstants::NSXV_LS_VNI_XPATH).text
        end

        # Get the Transport Zone of the logical switch
        def ls_tz
            @nsx_client.get(@url_ls)
                       .xpath(NSXConstants::NSXV_TZ_XPATH).text
        end

        # Get the logical switch reference into vcenter
        def ls_vcenter_ref
            @nsx_client.get(@url_ls)
                       .xpath(NSXConstants::NSXV_LS_BACKING_XPATH)
                       .text
        end

        # Get the distributed virtual switch's ref associated to a LS
        def ls_dvs_ref
            @nsx_client.get(@url_ls)
                       .xpath(NSXConstants::NSXV_LS_OBJECTID_XPATH)
                       .text
        end

        # Create a new logical switch (NSX-V: virtualwire)
        def new_logical_switch(ls_data, tz_id)
            url = "#{NSXConstants::NSXV_TZ_SECTION}#{tz_id}" \
                  '/virtualwires'
            @nsx_client.post(url, ls_data)
        end

        # Delete a logical switch
        def delete_logical_switch
            @nsx_client.delete(@url_ls)
        end

    end

end
