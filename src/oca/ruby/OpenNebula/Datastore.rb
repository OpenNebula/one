# -------------------------------------------------------------------------- #
# Copyright 2002-2012, OpenNebula Project Leads (OpenNebula.org)             #
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


require 'OpenNebula/Pool'

module OpenNebula
    class Datastore < PoolElement
        #######################################################################
        # Constants and Class Methods
        #######################################################################

        DATASTORE_METHODS = {
            :info       => "datastore.info",
            :allocate   => "datastore.allocate",
            :delete     => "datastore.delete"
        }

        # Creates a Datastore description with just its identifier
        # this method should be used to create plain Datastore objects.
        # +id+ the id of the user
        #
        # Example:
        #   datastore = Datastore.new(Datastore.build_xml(3),rpc_client)
        #
        def Datastore.build_xml(pe_id=nil)
            if pe_id
                datastore_xml = "<DATASTORE><ID>#{pe_id}</ID></DATASTORE>"
            else
                datastore_xml = "<DATASTORE></DATASTORE>"
            end

            XMLElement.build_xml(datastore_xml,'DATASTORE')
        end

        # Class constructor
        def initialize(xml, client)
            super(xml,client)
        end

        #######################################################################
        # XML-RPC Methods for the Datastore Object
        #######################################################################

        # Retrieves the information of the given Datastore.
        def info()
            super(DATASTORE_METHODS[:info], 'DATASTORE')
        end

        # Allocates a new Datastore in OpenNebula
        #
        # @param description [String] The template of the Datastore.
        #
        # @return [Integer, OpenNebula::Error] the new ID in case of
        #   success, error otherwise
        def allocate(description)
            super(DATASTORE_METHODS[:allocate], description)
        end

        # Deletes the Datastore
        def delete()
            super(DATASTORE_METHODS[:delete])
        end

        # ---------------------------------------------------------------------
        # Helpers to get information
        # ---------------------------------------------------------------------

        # Returns whether or not the image with id 'id' is part of this datastore
        def contains(id)
            #This doesn't work in ruby 1.8.5
            #return self["DATASTORE/ID[.=#{uid}]"] != nil

            id_array = retrieve_elements('DATASTORE/ID')
            return id_array != nil && id_array.include?(uid.to_s)
        end

        # Returns an array with the numeric image ids
        def img_ids
            array = Array.new

            self.each("IMAGES/ID") do |id|
                array << id.text.to_i
            end

            return array
        end
    end
end
