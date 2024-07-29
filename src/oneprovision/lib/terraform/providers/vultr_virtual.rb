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

require 'terraform/providers/vultr'

# Module OneProvision
module OneProvision

    # Vultr Virtual Terraform Provider
    class VultrVirtual < Vultr

        NAME = Terraform.append_provider(__FILE__, name)

        # OpenNebula - Terraform equivalence
        TYPES = {
            :cluster   => 'vultr_private_network',
            :datastore => '',
            :host      => 'vultr_instance',
            :network   => ''
        }

        # Add configuration variables to host template
        #
        # @param host [OneProvision::Host] Host information
        def add_host_vars(host)
            host.one.add_element(
                '//TEMPLATE',
                'ANSIBLE_HOST_VARS' => "private_ip=#{private_ip(host)}"
            )
        end

        private

        # Get private IP of an instance
        #
        # @param host [OneProvision::Host] Host information
        #
        # @return [String] Instance private IP
        def private_ip(host)
            v = ::Vultr.new(@provider.connection['KEY'])
            i = v.instance(host.one['TEMPLATE/PROVISION/DEPLOY_ID'])

            raise OneProvisionLoopException i if ::VultrError.error?(i)

            i['internal_ip']
        end

    end

end
