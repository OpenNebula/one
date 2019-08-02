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

    # Class Transport Zone
    class TransportZone < NSXDriver::NsxComponent

        # ATTRIBUTES
        attr_reader :tz_id
        HEADER_XML = { :'Content-Type' => 'application/xml' }
        HEADER_JSON = { :'Content-Type' => 'application/json' }
        NSXV_TZ = '/vdn/scopes'
        NSXT_TZ = '/transport-zones'
        VDNSCOPE_XPATH = '//vdnScope'

        # CONSTRUCTOR
        def initialize(nsx_client)
            super(nsx_client)
            # Construct base URLs
            @base_url_nsxv = "#{@nsx_client.nsxmgr}/api/2.0"
            @base_url_nsxt = "#{@nsx_client.nsxmgr}/api/v1"
            @url_tz_nsxv = @base_url_nsxv + NSXV_TZ
            @url_tz_nsxt = @base_url_nsxt + NSXT_TZ
        end

        # METHODS
        # Return the transport zones list
        def tzs_nsxv
            @nsx_client.get_xml(@url_tz_nsxv).xpath(VDNSCOPE_XPATH)
        end

        def tzs_nsxt
            @nsx_client.get_json(@url_tz_nsxt)
        end

    end

end
