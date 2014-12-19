# -------------------------------------------------------------------------- #
# Copyright 2002-2014, OpenNebula Project (OpenNebula.org), C12G Labs        #
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
    class Vdc < PoolElement
        #######################################################################
        # Constants and Class Methods
        #######################################################################

        VDC_METHODS = {
            :info           => "vdc.info",
            :allocate       => "vdc.allocate",
            :update         => "vdc.update",
            :rename         => "vdc.rename",
            :delete         => "vdc.delete"
        }

        # Creates a Vdc description with just its identifier
        # this method should be used to create plain Vdc objects.
        # @param id [Integer] the id of the Vdc
        #
        # Example:
        #   vdc = Vdc.new(Vdc.build_xml(3),rpc_client)
        #
        def Vdc.build_xml(pe_id=nil)
            if pe_id
                vdc_xml = "<VDC><ID>#{pe_id}</ID></VDC>"
            else
                vdc_xml = "<VDC></VDC>"
            end

            XMLElement.build_xml(vdc_xml,'VDC')
        end

        # Class constructor
        def initialize(xml, client)
            super(xml,client)
        end

        #######################################################################
        # XML-RPC Methods for the Vdc Object
        #######################################################################

        # Retrieves the information of the given Vdc.
        # @return [nil, OpenNebula::Error] nil in case of success, Error
        #   otherwise
        def info()
            super(VDC_METHODS[:info], 'VDC')
        end

        alias_method :info!, :info

        # Allocates a new Vdc in OpenNebula
        #
        # @param description [String] The template of the Vdc.
        # @return [nil, OpenNebula::Error] nil in case of success, Error
        #   otherwise
        def allocate(description)
            super(VDC_METHODS[:allocate], description)
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
            super(VDC_METHODS[:update], new_template, append ? 1 : 0)
        end       

        # Deletes the Vdc
        # @return [nil, OpenNebula::Error] nil in case of success, Error
        #   otherwise
        def delete()
            super(VDC_METHODS[:delete])
        end

        # Renames this Vdc
        #
        # @param name [String] New name for the Vdc.
        #
        # @return [nil, OpenNebula::Error] nil in case of success, Error
        #   otherwise
        def rename(name)
            return call(VDC_METHODS[:rename], @pe_id, name)
        end
    end
end
