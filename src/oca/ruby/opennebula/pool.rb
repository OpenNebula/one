# -------------------------------------------------------------------------- #
# Copyright 2002-2015, OpenNebula Project (OpenNebula.org), C12G Labs        #
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

require 'opennebula/xml_utils'

module OpenNebula

    # The Pool class represents a generic OpenNebula Pool in XML format
    # and provides the basic functionality to handle the Pool elements
    class Pool < XMLPool
        include Enumerable
        alias_method :each_with_xpath, :each

        PAGINATED_POOLS=%w{VM_POOL IMAGE_POOL TEMPLATE_POOL VN_POOL
                           DOCUMENT_POOL SECGROUP_POOL}

    protected
        #pool:: _String_ XML name of the root element
        #element:: _String_ XML name of the Pool elements
        #client::  _Client_ represents a XML-RPC connection
        def initialize(pool,element,client)
            super(nil)

            @pool_name    = pool.upcase
            @element_name = element.upcase

            @client = client
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

        #Gets the pool without any filter. Host, Group and User Pools
        # xml_method:: _String_ the name of the XML-RPC method
        def info(xml_method)
            return xmlrpc_info(xml_method)
        end

        alias_method :info!, :info

        def info_all(xml_method, *args)
            return xmlrpc_info(xml_method,INFO_ALL,-1,-1, *args)
        end

        def info_mine(xml_method, *args)
            return xmlrpc_info(xml_method,INFO_MINE,-1,-1, *args)
        end

        def info_group(xml_method, *args)
            return xmlrpc_info(xml_method,INFO_GROUP,-1,-1, *args)
        end

        def info_filter(xml_method, who, start_id, end_id, *args)
            return xmlrpc_info(xml_method,who, start_id, end_id, *args)
        end

        # Retrieves the monitoring data for all the Objects in the pool
        #
        # @param [String] xml_method xml-rcp method
        # @param [String] root_elem Root for each individual PoolElement
        # @param [String] timestamp_elem Name of the XML element with the last
        #   monitorization timestamp
        # @param [Array<String>] xpath_expressions Elements to retrieve.
        # @param args arguemnts for the xml_method call
        #
        # @return [Hash<String, <Hash<String, Array<Array<int>>>>>,
        #   OpenNebula::Error] The first level hash uses the Object ID as keys,
        #   and as value a Hash with the requested xpath expressions,
        #   and an Array of 'timestamp, value'.
        def monitoring(xml_method, root_elem, timestamp_elem, xpath_expressions,
            *args)

            rc = @client.call(xml_method, *args)

            if ( OpenNebula.is_error?(rc) )
                return rc
            end

            xmldoc = XMLElement.new
            xmldoc.initialize_xml(rc, 'MONITORING_DATA')

            hash = {}

            # Get all existing Object IDs
            ids = xmldoc.retrieve_elements("#{root_elem}/ID")

            if ids.nil?
                return hash
            else
                ids.uniq!
            end

            ids.each { |id|
                hash[id] = OpenNebula.process_monitoring(
                    xmldoc, root_elem, timestamp_elem, id, xpath_expressions)

            }

            return hash
        end

    private
        # Calls to the corresponding info method to retreive the pool
        # representation in XML format
        # xml_method:: _String_ the name of the XML-RPC method
        # args:: _Array_ with additional arguments for the info call
        # [return] nil in case of success or an Error object
        def xmlrpc_info(xml_method,*args)
            rc = @client.call(xml_method,*args)

            if !OpenNebula.is_error?(rc)
                initialize_xml(rc,@pool_name)
                rc   = nil
            end

            return rc
        end

    public
        # Constants for info queries (include/RequestManagerPoolInfoFilter.h)
        INFO_GROUP = -1
        INFO_ALL   = -2
        INFO_MINE  = -3

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

        # Gets a hash from a pool
        #
        # size:: nil => default page size
        #        < 2 => not paginated
        #        >=2 => page size
        #
        # The default page size can be changed with the environment variable
        # ONE_POOL_PAGE_SIZE. Any value > 2 will set a page size, a non
        # numeric value disables pagination.
        def get_hash(size=nil)
            allow_paginated = PAGINATED_POOLS.include?(@pool_name)

            if OpenNebula.pool_page_size && allow_paginated &&
                    ( ( size && size >= 2 ) || !size )
                size = OpenNebula.pool_page_size if !size
                hash=info_paginated(size)

                return hash if OpenNebula.is_error?(hash)
                { @pool_name => { @element_name => hash } }
            else
                rc=info
                return rc if OpenNebula.is_error?(rc)
                to_hash
            end
        end

        # Gets a pool in hash form using pagination
        #
        # size:: _Integer_ size of each page
        def info_paginated(size)
            array=Array.new
            current=0

            parser=ParsePoolSax.new(@pool_name, @element_name)

            while true
                a=@client.call("#{@pool_name.delete('_').downcase}.info",
                    @user_id, current, -size, -1)
                return a if OpenNebula.is_error?(a)

                a_array=parser.parse(a)

                array += a_array
                current += size
                break if !a || a_array.length<size
            end

            array.compact!
            array=nil if array.length == 0

            array
        end
    end
end
