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

require 'terraform/terraform'

# Module OneProvision
module OneProvision

    # DigitalOcean Terraform Provider
    class DigitalOcean < Terraform

        NAME = Terraform.append_provider(__FILE__, name)

        # OpenNebula - Terraform equivalence
        TYPES = {
            :cluster   => 'digitalocean_vpc',
            :datastore => 'digitalocean_volume',
            :host      => 'digitalocean_droplet',
            :network   => ''
        }

        KEYS = ['token', 'region']

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
            user_data = "#cloud-config\n"

            user_data << "users:\n"
            user_data << " - name: install\n"
            user_data << "   groups: sudo\n"
            user_data << "   shell: /bin/bash\n"
            user_data << "   sudo: ['ALL=(ALL) NOPASSWD:ALL']\n"
            user_data << "   ssh_authorized_keys:\n"

            ssh_key.split("\n").each {|key| user_data << "       - #{key}\n" }

            user_data = user_data.gsub("\n", '\\n')
        end

    end

end
