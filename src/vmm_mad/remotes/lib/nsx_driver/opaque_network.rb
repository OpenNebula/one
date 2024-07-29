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

    # Class Opaque Network NSX-T Network
    class OpaqueNetwork < LogicalSwitch

        # ATTRIBUTES
        # attr_reader :ls_id, :admin_display

        # CONSTRUCTOR
        def initialize(nsx_client, ls_id = nil, tz_id = nil, ls_data = nil)
            super(nsx_client)
            if ls_id
                initialize_with_id(ls_id)
            else
                if tz_id && ls_data
                    begin
                        @ls_id = new_logical_switch(ls_data)
                    rescue NSXError::IncorrectResponseCodeError => e
                        raise 'Opaque Network not created in ' \
                              "NSX Manager: #{e.message}"
                    end
                    unless @ls_id
                        raise 'Opaque Network not created in NSX Manager: '\
                              'generic error'
                    end

                    # Construct URL of the created logical switch
                    @url_ls = NSXConstants::NSXT_LS_SECTION + @ls_id
                    @ls_vni = ls_vni
                    @ls_name = ls_name
                    @tz_id = ls_tz
                    @admin_display = 'UP'
                end
            end
        end

        # Creates a OpaqueNetwork from its name
        def self.new_from_name(nsx_client, ls_name)
            lswitch = new(nsx_client)
            ls_id = lswitch.ls_id_from_name(nsx_client, ls_name)
            unless ls_id
                error_msg = "Opaque Network with name: #{ls_name} not found"
                error =  NSXError::ObjectNotFound
                         .new(error_msg)
                raise error
            end

            # initialize_with_id(@ls_id)
            lswitch.initialize_with_id(ls_id)
            lswitch
        end

        # Creates a OpaqueNetwork from its id
        def initialize_with_id(ls_id)
            @ls_id = ls_id
            # Construct URL of the created logical switch
            @url_ls = NSXConstants::NSXT_LS_SECTION + \
                      @ls_id
            if ls?
                @ls_vni = ls_vni
                @ls_name = ls_name
                @tz_id = ls_tz
                @admin_display = 'UP'
            else
                error_msg = "Opaque Network with id: #{ls_id} not found"
                error = NSXError::ObjectNotFound
                        .new(error_msg)
                raise error
            end
        end

        # Get the logical switch id from its name
        def ls_id_from_name(nsx_client, name)
            url = NSXConstants::NSXT_LS_SECTION
            lswitches = nsx_client.get(url)['results']
            lswitches.each do |lswitch|
                lsname = lswitch['display_name']
                lsid = lswitch['id']
                if lsname == name && lsid
                    return lsid
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
            @nsx_client.get(@url_ls)['display_name']
        end

        # Get logical switch's vni
        def ls_vni
            @nsx_client.get(@url_ls)['vni']
        end

        # Get the Transport Zone of the logical switch
        def ls_tz
            @nsx_client.get(@url_ls)['transport_zone_id']
        end

        # Create a new logical switch (NSX-T: opaque network)
        def new_logical_switch(ls_data)
            @nsx_client.post(NSXConstants::NSXT_LS_SECTION, ls_data)
        end

        # Delete a logical switch
        def delete_logical_switch
            @nsx_client.delete(@url_ls)
        end

    end

end
