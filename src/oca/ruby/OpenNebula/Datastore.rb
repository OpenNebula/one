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
            :delete     => "datastore.delete",
            :update     => "datastore.update",
            :chown      => "datastore.chown",
            :chmod      => "datastore.chmod"
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
        # @param cluster_id [Integer] Id of the cluster
        #
        # @return [Integer, OpenNebula::Error] the new ID in case of
        #   success, error otherwise
        def allocate(description, cluster_id=ClusterPool::NONE_CLUSTER_ID)
            super(DATASTORE_METHODS[:allocate], description, cluster_id)
        end

        # Deletes the Datastore
        def delete()
            super(DATASTORE_METHODS[:delete])
        end

        # Replaces the template contents
        #
        # @param new_template [String] New template contents
        #
        # @return [nil, OpenNebula::Error] nil in case of success, Error
        #   otherwise
        def update(new_template)
            super(DATASTORE_METHODS[:update], new_template)
        end

        # Changes the owner/group
        #
        # @param uid [Integer] the new owner id. Set to -1 to leave the current one
        # @param gid [Integer] the new group id. Set to -1 to leave the current one
        #
        # @return [nil, OpenNebula::Error] nil in case of success, Error
        #   otherwise
        def chown(uid, gid)
            super(DATASTORE_METHODS[:chown], uid, gid)
        end

        # Changes the datastore permissions.
        #
        # @param octet [String] Permissions octed , e.g. 640
        # @return [nil, OpenNebula::Error] nil in case of success, Error
        #   otherwise
        def chmod_octet(octet)
            super(DATASTORE_METHODS[:chmod], octet)
        end

        # Changes the datastore permissions.
        # Each [Integer] argument must be 1 to allow, 0 deny, -1 do not change
        #
        # @return [nil, OpenNebula::Error] nil in case of success, Error
        #   otherwise
        def chmod(owner_u, owner_m, owner_a, group_u, group_m, group_a, other_u,
                other_m, other_a)
            super(DATASTORE_METHODS[:chmod], owner_u, owner_m, owner_a, group_u,
                group_m, group_a, other_u, other_m, other_a)
        end

        # ---------------------------------------------------------------------
        # Helpers to get information
        # ---------------------------------------------------------------------

        # Returns whether or not the image with id 'id' is part of this datastore
        def contains(id)
            #This doesn't work in ruby 1.8.5
            #return self["DATASTORE/ID[.=#{uid}]"] != nil

            id_array = retrieve_elements('IMAGES/ID')
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
