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

        # Class constructor
        #
        # @param state  [String] Terraform state in base64
        # @param conf   [String] Terraform config state in base64
        def initialize(state, conf)
            @device_erb = "#{PROVIDERS_LOCATION}/templates/aws_device.erb"
            @erb        = "#{PROVIDERS_LOCATION}/templates/aws.erb"
            @host_type  = 'aws_instance'

            # User data should be encoded in base64
            @base64 = true

            super
        end

    end

end
