# -------------------------------------------------------------------------- #
# Copyright 2002-2023, OpenNebula Project, OpenNebula Systems                #
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

require 'opennebula/pool'

module OpenNebula

    # The PoolElement Class represents a generic element of a Pool in
    # XML format
    class PoolElement < XMLElement

        protected

        # node:: _XML_is a XML element that represents the Pool element
        # client:: _Client_ represents a XML-RPC connection
        def initialize(node, client)
            @xml    = node
            @client = client

            if self['ID']
                @pe_id = self['ID'].to_i
            else
                @pe_id = nil
            end
            @name = self['NAME'] if self['NAME']
        end

        #######################################################################
        # Common XML-RPC Methods for all the Pool Element Types
        #######################################################################

        # Common client call wrapper. Checks that @pe_id is defined, and
        # returns nil instead of the response if it is successful
        #
        # @param [String] xml_method xml-rpc method
        # @param [Array] args any arguments for the xml-rpc method
        #
        # @return [nil, OpenNebula::Error] nil in case of success, Error
        #   otherwise
        def call(xml_method, *args)
            return Error.new('ID not defined') unless @pe_id

            rc = @client.call(xml_method, *args)
            rc = nil unless OpenNebula.is_error?(rc)

            rc
        end

        # Calls to the corresponding info method to retreive the element
        # detailed information in XML format
        #
        # @param [String] xml_method the name of the XML-RPC method
        # @param [String] root_element Base XML element name
        #
        # @return [nil, OpenNebula::Error] nil in case of success, Error
        #   otherwise
        def info(xml_method, root_element, decrypt = false)
            return Error.new('ID not defined') unless @pe_id

            rc = @client.call(xml_method, @pe_id, decrypt)

            if !OpenNebula.is_error?(rc)
                initialize_xml(rc, root_element)
                rc = nil

                @pe_id = self['ID'].to_i if self['ID']
                @name  = self['NAME'] if self['NAME']
            end

            rc
        end

        # Calls to the corresponding allocate method to create a new element
        # in the OpenNebula core
        #
        # @param [String] xml_method the name of the XML-RPC method
        # @param [Array] args any extra arguments for the xml-rpc method
        #
        # @return [nil, OpenNebula::Error] nil in case of success, Error
        #   otherwise
        def allocate(xml_method, *args)
            rc = @client.call(xml_method, *args)

            if !OpenNebula.is_error?(rc)
                @pe_id = rc
                rc     = nil
            end

            rc
        end

        # Calls to the corresponding update method to modify
        # the object's template
        #
        # @param [String] xml_method the name of the XML-RPC method
        # @param [String] new_template the new template contents
        # @param [Array] args any extra arguments for the xml-rpc method
        #
        # @return [nil, OpenNebula::Error] nil in case of success, Error
        #   otherwise
        def update(xml_method, new_template, *args)
            if new_template.nil?
                return Error.new('Wrong argument', Error::EXML_RPC_CALL)
            end

            call(xml_method, @pe_id, new_template, *args)
        end

        # Calls to the corresponding delete method to remove this element
        # from the OpenNebula core
        #
        # @param [String] xml_method the name of the XML-RPC method
        #
        # @return [nil, OpenNebula::Error] nil in case of success, Error
        #   otherwise
        def delete(xml_method)
            call(xml_method, @pe_id)
        end

        # Calls to the corresponding chown method to modify
        # the object's owner and group
        #
        # @param [String] xml_method the name of the XML-RPC method
        # @param [Integer] uid the new owner id. Set to -1 to leave the current one
        # @param [Integer] gid the new goup id. Set to -1 to leave the current one
        #
        # @return [nil, OpenNebula::Error] nil in case of success, Error
        #   otherwise
        def chown(xml_method, uid, gid)
            call(xml_method, @pe_id, uid, gid)
        end

        # Calls to the corresponding chmod method to modify
        # the object's permission bits
        #
        # @param xml_method [String] the name of the XML-RPC method
        # @param octet [String] Permissions octed , e.g. 640
        #
        # @return [nil, OpenNebula::Error] nil in case of success, Error
        #   otherwise
        def chmod_octet(_xml_method, octet)
            owner_u = octet[0..0].to_i & 4 != 0 ? 1 : 0
            owner_m = octet[0..0].to_i & 2 != 0 ? 1 : 0
            owner_a = octet[0..0].to_i & 1 != 0 ? 1 : 0
            group_u = octet[1..1].to_i & 4 != 0 ? 1 : 0
            group_m = octet[1..1].to_i & 2 != 0 ? 1 : 0
            group_a = octet[1..1].to_i & 1 != 0 ? 1 : 0
            other_u = octet[2..2].to_i & 4 != 0 ? 1 : 0
            other_m = octet[2..2].to_i & 2 != 0 ? 1 : 0
            other_a = octet[2..2].to_i & 1 != 0 ? 1 : 0

            chmod(owner_u, owner_m, owner_a, group_u, group_m, group_a, other_u,
                  other_m, other_a)
        end

        # Calls to the corresponding chmod method to modify
        # the object's permission bits
        # Each [Integer] parameter must be 1 to allow, 0 deny, -1 do not change
        #
        # @param xml_method [String] the name of the XML-RPC method
        #
        # @return [nil, OpenNebula::Error] nil in case of success, Error
        #   otherwise
        def chmod(xml_method, owner_u, owner_m, owner_a, group_u, group_m, group_a, other_u,
                  other_m, other_a)
            call(xml_method, @pe_id, owner_u, owner_m,
                 owner_a, group_u, group_m, group_a, other_u,
                 other_m, other_a)
        end

        # Retrieves this Element's monitoring data from OpenNebula
        #
        # @param [String] xml_method the name of the XML-RPC method
        # @param xpaths [Array<String>] Xpath expressions for the elements to
        # retrieve.
        #
        # @return [Hash<String, Array<Array<int>>, OpenNebula::Error] Hash with
        #   the requested xpath expressions, and an Array of [timestamp, value].
        def monitoring(xml_method, xpaths)
            return Error.new('ID not defined') unless @pe_id

            rc = @client.call(xml_method, @pe_id)

            if OpenNebula.is_error?(rc)
                return rc
            end

            xmldoc = XMLElement.new
            xmldoc.initialize_xml(rc, 'MONITORING_DATA')

            OpenNebula.process_monitoring(xmldoc, @pe_id, xpaths)
        end

        public

        # Creates new element specifying its id
        # id:: identifyier of the element
        # client:: initialized OpenNebula::Client object
        def self.new_with_id(id, client = nil)
            new(build_xml(id), client)
        end

        # Returns element identifier
        # [return] _Integer_ the PoolElement ID
        def id
            @pe_id
        end

        # Gets element name
        # [return] _String_ the PoolElement name
        attr_reader :name

        # DO NOT USE - ONLY REXML BACKEND
        def to_str
            str = ''
            REXML::Formatters::Pretty.new(1).write(@xml, str)

            str
        end

        # Replace the xml pointed by xpath using  a Hash object
        # one object will be modified taking hash object pairs
        #
        # @param [String] xpath
        # @param [Hash] options object containing pair key-value
        #
        # @returns the new xml representation
        def replace(opts, xpath = 'TEMPLATE')
            return unless self[xpath]

            opts.each do |att, value|
                xpath_u = xpath+"/#{att}"
                docs = retrieve_xmlelements(xpath_u)
                if docs.size == 1
                    docs[0].set_content(value)
                end
            end
            update(template_like_str(xpath))
        end

    end

    # Processes the monitoring data in XML returned by OpenNebula
    #
    # @param [XMLElement] xmldoc monitoring data returned by OpenNebula
    #   monitorization timestamp
    # @param [Integer] oid Id of the object to process
    # @param [Array<String>] xpath_expressions Elements to retrieve.
    #
    # @return [Hash<String, Array<Array<int>>, OpenNebula::Error] Hash with
    #   the requested xpath expressions, and an Array of [timestamp, value].
    def self.process_monitoring(xmldoc, oid, xpath_expressions)
        hash = {}
        timestamps = xmldoc.retrieve_elements(
            "/MONITORING_DATA/MONITORING[ID=#{oid}]/TIMESTAMP"
        )

        xpath_expressions.each do |xpath|
            xpath_values = xmldoc.retrieve_elements(
                "/MONITORING_DATA/MONITORING[ID=#{oid}]/#{xpath}"
            )

            if xpath_values.nil?
                hash[xpath] = []
            else
                hash[xpath] = timestamps.zip(xpath_values)
            end
        end

        hash
    end

end
