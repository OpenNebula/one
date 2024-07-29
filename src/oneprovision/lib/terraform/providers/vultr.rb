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

ONE_LOCATION = ENV['ONE_LOCATION'] unless defined?(ONE_LOCATION)

if !ONE_LOCATION
    VULTR_LOCATION ||= '/usr/lib/one/oneprovision/provider_apis/vultr'
else
    VULTR_LOCATION ||= ONE_LOCATION + '/lib/oneprovision/provider_apis/vultr'
end

$LOAD_PATH << VULTR_LOCATION

require 'vultr'
require 'terraform/terraform'

# Module OneProvision
module OneProvision

    # Vultr Terraform Provider
    class Vultr < Terraform

        KEYS = ['key', 'region']

        # Class constructor
        #
        # @param provider [Provider]
        # @param state    [String] Terraform state in base64
        # @param conf     [String] Terraform config state in base64
        def initialize(provider, state, conf)
            # Credentials are not stored in a file
            @file_credentials = false

            super
        end

        # Get user data to add into the VM
        #
        # @param ssh_key [String] SSH keys to add
        def user_data(ssh_key)
            user_data = "#! /bin/bash\n"
            user_data << "mkdir ~/.ssh\n"

            ssh_key.split("\n").each do |key|
                user_data << "echo #{key} >> ~/.ssh/authorized_keys\n"
            end

            user_data << "chmod 700 ~/.ssh\n"
            user_data << "chmod 644 ~/.ssh/authorized_keys\n"

            Base64.strict_encode64(user_data)
        end

    end

end
