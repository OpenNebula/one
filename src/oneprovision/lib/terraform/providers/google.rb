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

require 'terraform/terraform'

# Module OneProvision
module OneProvision

    # Google Terraform Provider
    class Google < Terraform

        # OpenNebula - Terraform equivalence
        TYPES = {
            :cluster   => 'google_compute_network',
            :datastore => '',
            :host      => 'google_compute_instance',
            :network   => ''
        }

        KEYS = %w[credentials project region zone]

        # Class constructor
        #
        # @param provider [Provider]
        # @param state    [String] Terraform state in base64
        # @param conf     [String] Terraform config state in base64
        def initialize(provider, state, conf)
            @dir = "#{PROVIDERS_LOCATION}/templates/google"

            # Credentials are stored in a file
            @file_credentials = true

            super
        end

        # Get user data to add into the VM
        #
        # @param ssh_key [String] SSH keys to add
        def user_data(ssh_key)
            # Add clod unit information into user_data
            # This only applies for a set of spported providers
            user_data = "#cloud-config\n"

            ssh_key.split("\n").each {|key| user_data << "install:#{key}\n" }

            # Escape \n to avoid multilines in Terraform deploy file
            user_data.gsub!("\n", '\\n')

            user_data
        end

    end

end
