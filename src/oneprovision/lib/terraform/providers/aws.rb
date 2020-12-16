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

    # AWS Terraform Provider
    class AWS < Terraform

        # OpenNebula - Terraform equivalence
        TYPES = {
            :cluster   => 'aws_vpc',
            :datastore => 'aws_ebs_volume',
            :host      => 'aws_instance',
            :network   => 'aws_subnet'
        }

        KEYS = %w[access_key secret_key region]
        # Class constructor
        #
        # @param provider [Provider]
        # @param state    [String] Terraform state in base64
        # @param conf     [String] Terraform config state in base64
        def initialize(provider, state, conf)
            @dir = "#{PROVIDERS_LOCATION}/templates/aws"

            # User data should be encoded in base64
            @base64 = true

            super
        end

    end

end
