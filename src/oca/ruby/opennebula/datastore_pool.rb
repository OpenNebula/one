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


require 'opennebula/pool'

module OpenNebula
    class DatastorePool < Pool
        #######################################################################
        # Constants and Class attribute accessors
        #######################################################################

        DATASTORE_POOL_METHODS = {
            :info => "datastorepool.info"
        }

        #######################################################################
        # Class constructor & Pool Methods
        #######################################################################

        # +client+ a Client object that represents a XML-RPC connection
        def initialize(client)
            super('DATASTORE_POOL','DATASTORE',client)
        end

        # Factory method to create datastore objects
        def factory(element_xml)
            OpenNebula::Datastore.new(element_xml,@client)
        end

        #######################################################################
        # XML-RPC Methods for the User Object
        #######################################################################

        # Retrieves all the Groups in the pool.
        def info()
            super(DATASTORE_POOL_METHODS[:info])
        end

        def info_all()
            return super(DATASTORE_POOL_METHODS[:info])
        end

        def info_mine()
            return super(DATASTORE_POOL_METHODS[:info])
        end

        def info_group()
            return super(DATASTORE_POOL_METHODS[:info])
        end

        alias_method :info!, :info
        alias_method :info_all!, :info_all
        alias_method :info_mine!, :info_mine
        alias_method :info_group!, :info_group
    end
end
