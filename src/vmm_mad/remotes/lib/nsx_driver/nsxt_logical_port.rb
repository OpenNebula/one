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

    # Class NSXTLogicalPort
    class NSXTLogicalPort < LogicalPort

        # ATTRIBUTES
        attr_reader :id, :name, :type, :url

        # CONSTRUCTOR
        # Logical port class variables:
        # @lp_id
        # @url_lp
        # @lp_name
        # @lp_type
        def initialize(nsx_client, id = nil, data = nil)
            super(nsx_client)
            # lpid can be:
            #   - Logical port attach ID
            if id
                initialize_with_id(id)
            else
                if data
                    begin
                        @id = new_logical_port(data)
                    rescue NSXError::IncorrectResponseCodeError => e
                        raise 'Logical Port not created in ' \
                        "NSX Manager: #{e.message}"
                    end
                    unless @id
                        raise 'Logical Port not created in NSX Manager: '\
                              'generic error'
                    end
                    # Construct logical port class variables
                    @url = NSXConstants::NSXT_LP_BASE + @id
                    @name = lp_name
                    @type = lp_type
                end
            end
        end

        # Creates a NSXTLogicalPort from its id
        def initialize_with_id(id)
            @id = lp_with_attachid(id)
            # Construct URL of the created logical switch
            @url = NSXConstants::NSXT_LP_BASE + @id
            if lp?
                @name = lp_name
                @type = lp_type
            end
        end

        # Check if logical port exists
        def lp?
            @nsx_client.get(@url)
        end

        # Get logical port id from attach id
        def lp_with_attachid(attach_id)
            lps = @nsx_client.get(NSXConstants::NSXT_LP_BASE)
            lps['results'].each do |lp|
                return lp['id'] if lp['attachment']['id'] == attach_id
            end
        end

        # # Get logical port display name
        def lp_name
            lp = @nsx_client.get(@url)
            lp['display_name']
        end

        # # Get resource type
        def lp_type
            lp = @nsx_client.get(@url)
            lp['resource_type']
        end

    end

end
