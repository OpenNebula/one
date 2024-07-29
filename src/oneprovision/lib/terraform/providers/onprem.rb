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

    # Onprem Provider
    class Onprem < Terraform

        NAME = Terraform.append_provider(__FILE__, name)

        # Generate Terraform deployment file
        #
        # @param provision [Provision] Provision information
        def generate_deployment_file(provision)
            @hosts = provision.info_objects('hosts')
        end

        # Deploys a new host
        def deploy(_)
            OneProvisionLogger.info('(Deploy skipped)')

            [@hosts.map do |h|
                h.to_hash['HOST']['TEMPLATE']['PROVISION']['HOSTNAME']
            end,
             nil,
             nil]
        end

        # Get polling information from a host
        #
        # @param id [String] Host ID
        #
        # @param [String] Host public IP
        def poll(_) end

        # Provisions and configures new hosts
        #
        # @param provision [OpenNebula::Provision] Provision information
        def add_hosts(_)
            deploy(nil)
        end

        # Destroy infra via Terraform
        #
        # @param target [String] Target to destroy
        #
        # @return [Array]
        #   - Terraform state in base64
        #   - Terraform config in base64
        def destroy(_ = nil)
            OneProvisionLogger.info('(Destroy skipped)')
        end

        # Destroys a host
        #
        # @param host [String] Host ID
        def destroy_host(_)
            OneProvisionLogger.info('(Destroy host skipped)')
        end

        def destroy_cluster(_)
            OneProvisionLogger.info('(Destroy cluster skipped)')
        end

        # Destroys a datastore
        #
        # @param id [String] Datastore ID
        def destroy_datastore(_)
            OneProvisionLogger.info('(Destroy datastore skipped)')
        end

        # Destriys a network
        #
        # @param id [String] Network ID
        def destroy_network(_)
            OneProvisionLogger.info('(Destroy network skipped)')
        end

    end

end
