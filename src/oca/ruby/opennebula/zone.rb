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


require 'opennebula/pool_element'

module OpenNebula
    class Zone < PoolElement
        #######################################################################
        # Constants and Class Methods
        #######################################################################

        ZONE_METHODS = {
            :info           => "zone.info",
            :allocate       => "zone.allocate",
            :update         => "zone.update",
            :rename         => "zone.rename",
            :delete         => "zone.delete",
            :addserver      => "zone.addserver",
            :delserver      => "zone.delserver",
            :resetserver    => "zone.resetserver",
            :enable         => "zone.enable"
        }

        ZONE_STATES=%w{ENABLED DISABLED}

        SHORT_ZONE_STATES={
            "ENABLED"              => "on",
            "DISABLED"             => "off"
        }

        # Creates a Zone description with just its identifier
        # this method should be used to create plain Zone objects.
        # @param id [Integer] the id of the Zone
        #
        # Example:
        #   zone = Zone.new(Zone.build_xml(3),rpc_client)
        #
        def Zone.build_xml(pe_id=nil)
            if pe_id
                zone_xml = "<ZONE><ID>#{pe_id}</ID></ZONE>"
            else
                zone_xml = "<ZONE></ZONE>"
            end

            XMLElement.build_xml(zone_xml,'ZONE')
        end

        # Class constructor
        def initialize(xml, client)
            super(xml,client)
        end

        #######################################################################
        # XML-RPC Methods for the Zone Object
        #######################################################################

        # Retrieves the information of the given Zone.
        # @return [nil, OpenNebula::Error] nil in case of success, Error
        #   otherwise
        def info()
            super(ZONE_METHODS[:info], 'ZONE')
        end

        # Retrieves the information extended of the given Zone.
        # @return [nil, OpenNebula::Error] nil in case of success, Error
        #   otherwise
        def info_extended()
            rc = info()

            return rc if OpenNebula.is_error?(rc)

            @xml.xpath("SERVER_POOL/SERVER").each do |server|
                endpoint = server.xpath("ENDPOINT")
                endpoint = endpoint.text if endpoint

                next if endpoint.nil?

                client = OpenNebula::Client.new(nil, endpoint, {:timeout => 5})

                xml = client.call("zone.raftstatus")

                if OpenNebula.is_error?(xml)
                    add_element(server, "STATE", "-")
                    add_element(server, "TERM", "-")
                    add_element(server, "VOTEDFOR", "-")
                    add_element(server, "COMMIT", "-")
                    add_element(server, "LOG_INDEX", "-")
                    add_element(server, "FEDLOG_INDEX", "-")

                    next
                end

                xml = Nokogiri::XML(xml)

                add_element_xml(server, xml, "STATE", "RAFT/STATE")
                add_element_xml(server, xml, "TERM", "RAFT/TERM")
                add_element_xml(server, xml, "VOTEDFOR", "RAFT/VOTEDFOR")
                add_element_xml(server, xml, "COMMIT", "RAFT/COMMIT")
                add_element_xml(server, xml, "LOG_INDEX", "RAFT/LOG_INDEX")
                add_element_xml(server, xml, "FEDLOG_INDEX","RAFT/FEDLOG_INDEX")
            end
        end

        alias_method :info!, :info
        alias_method :info_extended!, :info_extended

        # Allocates a new Zone in OpenNebula
        #
        # @param description [String] The template of the Zone.
        # @return [nil, OpenNebula::Error] nil in case of success, Error
        #   otherwise
        def allocate(description)
            super(ZONE_METHODS[:allocate], description)
        end

        # Replaces the template contents
        #
        # @param new_template [String] New template contents
        # @param append [true, false] True to append new attributes instead of
        #   replace the whole template
        #
        # @return [nil, OpenNebula::Error] nil in case of success, Error
        #   otherwise
        def update(new_template=nil, append=false)
            super(ZONE_METHODS[:update], new_template, append ? 1 : 0)
        end

        # Deletes the Zone
        # @return [nil, OpenNebula::Error] nil in case of success, Error
        #   otherwise
        def delete()
            super(ZONE_METHODS[:delete])
        end

        # Renames this Zone
        #
        # @param name [String] New name for the Zone.
        #
        # @return [nil, OpenNebula::Error] nil in case of success, Error
        #   otherwise
        def rename(name)
            return call(ZONE_METHODS[:rename], @pe_id, name)
        end

        # Adds servers to this Zone
        #
        # @param name [String] Template with zone servers
        #   SERVER = [ NAME = "<server_name>", ENDPOINT = "<rpc_ep>" ]
        #
        # @return [nil, OpenNebula::Error] nil in case of success, Error
        #   otherwise
        def add_servers(servers)
            return call(ZONE_METHODS[:addserver], @pe_id, servers)
        end

        # Delete servers from this Zone
        #
        # @param id [Int] Server ID
        #
        # @return [nil, OpenNebula::Error] nil in case of success, Error
        #   otherwise
        def delete_servers(server_id)
            return call(ZONE_METHODS[:delserver], @pe_id, server_id)
        end

        # Reset index for a follower
        #
        # @param id [Int] Server ID
        #
        # @return [nil, OpenNebula::Error] nil in case of success, Error
        #   otherwise
        def reset_server(server_id)
            return call(ZONE_METHODS[:resetserver], @pe_id, server_id)
        end

        # Enable zone
        #
        # @return [nil, OpenNebula::Error] nil in case of success, Error
        #   otherwise
        def enable()
            return call(ZONE_METHODS[:enable], @pe_id, true)
        end

        # Disable zone, only readonly commands can be executed in disabled
        # state
        #
        # @return [nil, OpenNebula::Error] nil in case of success, Error
        #   otherwise
        def disable()
            return call(ZONE_METHODS[:enable], @pe_id, false)
        end

        #######################################################################
        # Helpers to get Zone information
        #######################################################################

        # Returns the state of the Zone (numeric value)
        def state
            self['STATE'].to_i
        end

        # Returns the state of the Zone (string value)
        def state_str
            ZONE_STATES[state]
        end

        private

        # These methods adds elements to the given node of the zone
        def add_element(parent, key, value)
            elem = Nokogiri::XML::Node.new(key, @xml.document)
            elem.content = value

            parent.add_child(elem)
        end

        def add_element_xml(parent, doc, key, xpath)
            value = doc.at_xpath(xpath)

            if value
                value = value.text
            else
                value = "-"
            end

            elem = Nokogiri::XML::Node.new(key, @xml.document)
            elem.content = value

            parent.add_child(elem)
        end
    end
end
