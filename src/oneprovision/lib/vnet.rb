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

require 'resource'

module OneProvision

    # Vnet
    class Vnet < Resource

        # Class constructor
        def initialize
            super 'Vnet'
        end

        # Creates a new VNET in OpenNebula
        #
        # @param cluster_id     [Integer] ID of the CLUSTER where is the VNET
        # @param template       [String]  Template of the VNET
        # @param pm_mad         [String]  Provision Manager Driver
        # @param provision_id   [String]  ID of the provision
        # @param provision_name [String]  Name of the provision
        def create(cluster_id, template, pm_mad, provision_id, provision_name)
            template['provision']['provision_id'] = provision_id
            template['provision']['name']         = provision_name

            template  = Utils.template_like_str(template)
            template += "PM_MAD=\"#{pm_mad}\"\n"

            super(cluster_id, template)
        end

    end

end
