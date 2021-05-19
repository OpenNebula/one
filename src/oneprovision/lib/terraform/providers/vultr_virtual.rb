# -------------------------------------------------------------------------- #
# Copyright 2002-2021, OpenNebula Project, OpenNebula Systems                #
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

require 'terraform/providers/vultr'

# Module OneProvision
module OneProvision

    # Vultr Virtual Terraform Provider
    class VultrVirtual < Vultr

        # OpenNebula - Terraform equivalence
        TYPES = {
            :cluster   => 'vultr_private_network',
            :datastore => '',
            :host      => 'vultr_instance',
            :network   => ''
        }

        # Class constructor
        #
        # @param provider [Provider]
        # @param state    [String] Terraform state in base64
        # @param conf     [String] Terraform config state in base64
        def initialize(provider, state, conf)
            @dir = "#{PROVIDERS_LOCATION}/templates/vultr_virtual"

            super
        end

    end

end
