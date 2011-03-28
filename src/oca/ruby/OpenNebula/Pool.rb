# -------------------------------------------------------------------------- #
# Copyright 2002-2011, OpenNebula Project Leads (OpenNebula.org)             #
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

module OpenNebula
    # The Pool class represents a generic OpenNebula Pool in XML format
    # and provides the basic functionality to handle the Pool elements
    
    class Pool < XMLPool
        include Enumerable

    protected

        #pool:: _String_ XML name of the root element
        #element:: _String_ XML name of the Pool elements
        #client::  _Client_ represents a XML-RPC connection
        def initialize(pool,element,client)
            super(nil)

            @pool_name    = pool.upcase
            @element_name = element.upcase

            @client = client
            @hash   = nil
        end

        # Default Factory Method for the Pools. The factory method returns an
        # suitable PoolElement object. Each Pool MUST implement the
        # corresponding factory method
        # element_xml:: _XML_ XML element describing the pool element
        # [return] a PoolElement object
        def factory(element_xml)
            OpenNebula::PoolElement.new(element_xml,client)
        end

        #######################################################################
        # Common XML-RPC Methods for all the Pool Types
        #######################################################################

        # Calls to the corresponding info method to retreive the pool
        # representation in XML format
        # xml_method:: _String_ the name of the XML-RPC method
        # args:: _Array_ with additional arguments for the info call
        # [return] nil in case of success or an Error object
        def info(xml_method,*args)
            rc = @client.call(xml_method,*args)

            if !OpenNebula.is_error?(rc)
                initialize_xml(rc,@pool_name)
                rc   = nil
            end

            return rc
        end

    public

        # Iterates over every PoolElement in the Pool and calls the block with a
        # a PoolElement obtained calling the factory method
        # block:: _Block_
        def each(&block)
            each_element(block) if @xml
        end

        # DO NOT USE - ONLY REXML BACKEND
        def to_str
            str = ""
            REXML::Formatters::Pretty.new(1).write(@xml,str)

            return str
        end
    end

    # The PoolElement Class represents a generic element of a Pool in
    # XML format
    class PoolElement < XMLElement

    protected
        # node:: _XML_is a XML element that represents the Pool element
        # client:: _Client_ represents a XML-RPC connection
        def initialize(node, client)
            @xml    = node
            @client = client
            @hash   = nil

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

        # Calls to the corresponding info method to retreive the element
        # detailed information in XML format
        # xml_method:: _String_ the name of the XML-RPC method
        # root_element:: _String_ Base XML element
        # [return] nil in case of success or an Error object
        def info(xml_method, root_element)
            return Error.new('ID not defined') if !@pe_id

            rc = @client.call(xml_method,@pe_id)

            if !OpenNebula.is_error?(rc)
                initialize_xml(rc, root_element)
                rc   = nil

                @pe_id = self['ID'].to_i if self['ID']
                @name  = self['NAME'] if self['NAME']
            end

            return rc
        end

        # Calls to the corresponding allocate method to create a new element
        # in the OpenNebula core
        # xml_method:: _String_ the name of the XML-RPC method
        # args:: _Array_ additional arguments including the template for the
        #                new element
        # [return] nil in case of success or an Error object
        def allocate(xml_method, *args)
            rc = @client.call(xml_method, *args)

            if !OpenNebula.is_error?(rc)
                @pe_id = rc
                rc     = nil
            end

            return rc
        end

        # Calls to the corresponding update method to modify
        # the object's template
        # xml_method:: _String_ the name of the XML-RPC method
        # name:: _String_ the name of the property to be modified
        # value:: _String_ the new value of the property to be modified
        # [return] nil in case of success or an Error object
        def update(xml_method, name, value)
            return Error.new('ID not defined') if !@pe_id

            rc = @client.call(xml_method,@pe_id, name, value)
            rc = nil if !OpenNebula.is_error?(rc)

            return rc
        end

        # Calls to the corresponding delete method to remove this element
        # from the OpenNebula core
        # xml_method:: _String_ the name of the XML-RPC method
        # [return] nil in case of success or an Error object
        def delete(xml_method)
            return Error.new('ID not defined') if !@pe_id

            rc = @client.call(xml_method,@pe_id)
            rc = nil if !OpenNebula.is_error?(rc)

            return rc
        end

    public

        # Creates new element specifying its id
        # id:: identifyier of the element
        # client:: initialized OpenNebula::Client object
        def self.new_with_id(id, client=nil)
            self.new(self.build_xml(id), client)
        end

        # Returns element identifier
        # [return] _Integer_ the PoolElement ID
        def id
            @pe_id
        end

        # Gets element name
        # [return] _String_ the PoolElement name
        def name
            @name
        end

        # DO NOT USE - ONLY REXML BACKEND
        def to_str
            str = ""
            REXML::Formatters::Pretty.new(1).write(@xml,str)

            return str
        end
    end
end
