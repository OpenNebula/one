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
    class VirtualRouterPool < Pool
        #######################################################################
        # Constants and Class attribute accessors
        #######################################################################


        VIRTUAL_ROUTER_POOL_METHODS = {
            :info => "vrouterpool.info"
        }

        #######################################################################
        # Class constructor & Pool Methods
        #######################################################################

        # +client+ a Client object that represents an XML-RPC connection
        # +user_id+ used to refer to a Pool with Virtual Routers from that user
        def initialize(client, user_id=-1)
            super('VROUTER_POOL','VROUTER',client)

            @user_id  = user_id
        end

        # Factory method to create Virtual Router objects
        def factory(element_xml)
            OpenNebula::VirtualRouter.new(element_xml,@client)
        end

        #######################################################################
        # XML-RPC Methods for the Virtual Router Object
        #######################################################################

        # Retrieves all or part of the Virtual Routers in the pool.
        def info(*args)
            case args.size
                when 0
                    info_filter(VIRTUAL_ROUTER_POOL_METHODS[:info],@user_id,-1,-1)
                when 3
                    info_filter(VIRTUAL_ROUTER_POOL_METHODS[:info],args[0],args[1],args[2])
            end
        end

        def info_all()
            return super(VIRTUAL_ROUTER_POOL_METHODS[:info])
        end

        def info_mine()
            return super(VIRTUAL_ROUTER_POOL_METHODS[:info])
        end

        def info_group()
            return super(VIRTUAL_ROUTER_POOL_METHODS[:info])
        end

        alias_method :info!, :info
        alias_method :info_all!, :info_all
        alias_method :info_mine!, :info_mine
        alias_method :info_group!, :info_group
    end
end
