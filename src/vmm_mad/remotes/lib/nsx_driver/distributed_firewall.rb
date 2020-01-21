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
    class DistributedFirewall < NSXDriver::NSXComponent

        # ATTRIBUTES

        # CONSTRUCTOR
        def initialize(nsx_client)
            super(nsx_client)
            @one_section_name = NSXDriver::NSXConstants::ONE_SECTION_NAME
        end

        def self.new_child(nsx_client)
            case nsx_client
            when NSXDriver::NSXTClient
                NSXDriver::NSXTdfw.new(nsx_client)
            when NSXDriver::NSXVClient
                NSXDriver::NSXVdfw.new(nsx_client)
            else
                error_msg = "Unknown object type: #{nsx_client}"
                error = NSXDriver::NSXError::UnknownObject.new(error_msg)
                raise error
            end
        end

        # Sections
        # Creates OpenNebula section if not exists and returns
        # its section_id. Returns its section_id if OpenNebula
        # section already exists
        def init_section; end

        # Get all sections
        def sections; end

        # Get section by id
        def section_by_id(section_id); end

        # Get section by name
        def section_by_name(section_name); end

        # Create new section
        def create_section(section_name); end

        # Delete section
        def delete_section(section_id); end

        # Rules
        # Get all rules
        def rules; end

        # Get rule by id
        def rules_by_id; end

        # Get rule by name
        def rules_by_name; end

        # Create new rule
        def create_rule; end

        # Update rule
        def update_rule; end

        # Delete rule
        def delete_rule; end

        # Remove OpenNebula created fw rules for an instance (given a template)
        def clear_opennebula_rules(template); end

    end

end
