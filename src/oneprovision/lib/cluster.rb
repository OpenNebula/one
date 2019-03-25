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

    # Cluster
    class Cluster < Resource

        # Class constructor
        #
        # @param id [Integer] Id of the cluster
        def initialize(id = nil)
            super('Cluster', id)
        end

        # Creates a new CLUSTER in OpenNebula
        #
        # @param template       [String] Template of the CLUSTER
        # @param provision_id   [String] ID of the provision
        # @param provision_name [String] Name of the provision
        def create(template, provision_id, provision_name)
            template['provision']['provision_id'] = provision_id
            template['provision']['name']         = provision_name

            name     = template['name']
            template = Utils.template_like_str(template)

            super(name, template)
        end

    end

end
