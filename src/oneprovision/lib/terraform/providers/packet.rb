# -------------------------------------------------------------------------- #
# Copyright 2002-2020, OpenNebula Project, OpenNebula Systems                #
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

require 'terraform/terraform'

# Module OneProvision
module OneProvision

    # Packet Terraform Provider
    class Packet < Terraform

        # OpenNebula - Terraform equivalence
        TYPES = {
            :datastore => 'packet_volume',
            :host      => 'packet_device',
            :network   => 'packet_reserved_ip_block'
        }

        KEYS = %w[project token facility]

        # Class constructor
        #
        # @param provider [Provider]
        # @param state    [String] Terraform state in base64
        # @param conf     [String] Terraform config state in base64
        def initialize(provider, state, conf)
            @dir = "#{PROVIDERS_LOCATION}/templates/packet"

            # User data is in plain text
            @base64 = false

            super
        end

    end

end
