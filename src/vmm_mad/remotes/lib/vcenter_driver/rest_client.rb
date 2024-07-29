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
require 'openssl'
require 'yaml'
require 'vsphere-automation-vcenter'
require 'vsphere-automation-cis'

module VCenterDriver

    ########################################################################
    # Class RESTClient
    ########################################################################
    class RESTClient

        attr_accessor :configuration

        def initialize(opts)
            @opts = {
                :insecure => true,
                :associable_types => [
                    ClusterComputeResource,
                    DistributedVirtualSwitch,
                    VmwareDistributedVirtualSwitch,
                    LibraryItem,
                    ResourcePool,
                    Folder,
                    HostNetwork,
                    DistributedVirtualPortgroup,
                    VirtualApp,
                    StoragePod,
                    Datastore,
                    Network,
                    Datacenter,
                    Library,
                    HostSystem,
                    OpaqueNetwork,
                    VirtualMachine
                ],
                :category_name => 'OpenNebula',
                :category_description => 'OpenNebula Category',
            :cardinality =>
                VSphereAutomation::CIS::CisTaggingCategoryModelCardinality
                    .const_get(
                        'multiple'.upcase
                    )
            }.merge(opts)

            @configuration = VSphereAutomation::Configuration.new.tap do |c|
                c.host = @opts[:hostname]
                c.username = @opts[:username]
                c.password = @opts[:password]
                c.scheme = 'https'
                c.verify_ssl = !@opts[:insecure]
                c.verify_ssl_host = !@opts[:insecure]
            end
        end

        def self.new_from_host(host_id)
            client = OpenNebula::Client.new
            host = OpenNebula::Host.new_with_id(host_id, client)
            rc = host.info(true)
            if OpenNebula.is_error?(rc)
                raise "Could not get host info for ID: \
                       #{host_id} - #{rc.message}"
            end

            connection = {
                :hostname => host['TEMPLATE/VCENTER_HOST'],
                :username => host['TEMPLATE/VCENTER_USER'],
                :password => host['TEMPLATE/VCENTER_PASSWORD']
            }

            new(connection)
        end

        def get_or_create_tag(
            api_client,
            category_id,
            tag_name,
            tag_description
        )

            tag_api = VSphereAutomation::CIS::TaggingTagApi.new(api_client)
            tag = tag_api.list.value.find do |id|
                c = tag_api.get(id).value
                break c if c.name == tag_name
            end

            if tag.nil?
                create_spec =
                    VSphereAutomation::CIS::CisTaggingTagCreateSpec
                    .new(
                        name => tag_name,
                        description => tag_description,
                        category_id => category_id
                    )
                create_model = VSphereAutomation::CIS::CisTaggingTagCreate.new(
                    create_spec => create_spec
                )

                api_instance =
                    VSphereAutomation::CIS::TaggingTagApi.new(api_client)
                api_instance.create(create_model).value
            else
                tag.id
            end
        end

        def get_or_create_category(api_client, category_name)
            category_api =
                VSphereAutomation::CIS::TaggingCategoryApi.new(api_client)
            category = category_api.list.value.find do |id|
                c = category_api.get(id).value
                break c if c.name == category_name
            end
            if category.nil?
                create_spec =
                    VSphereAutomation::CIS::CisTaggingCategoryCreateSpec
                    .new(
                        name => category_name,
                        description => @opts[:category_description],
                        associable_types => @opts[:associable_types],
                        cardinality => @opts[:cardinality]
                    )
                create_model =
                    VSphereAutomation::CIS::CisTaggingCategoryCreate
                    .new(create_spec => create_spec)

                category = category_api.create(create_model)
                category.value
            else
                category.id
            end
        end

        def sync_tags(vm)
            api_client = VSphereAutomation::ApiClient.new(@configuration)
            VSphereAutomation::CIS::SessionApi.new(api_client).create('')

            association_api =
                VSphereAutomation::CIS::TaggingTagAssociationApi
                .new(api_client)

            vm.vcenter_tags.each do |tag|
                category_name = @opts[:category_name]

                unless tag['CATEGORY_NAME'].nil?
                    category_name = tag['CATEGORY_NAME']
                end

                category_id = get_or_create_category(api_client, category_name)

                tag_name = tag['NAME']
                tag_description = tag['DESCRIPTION']

                tag_id =
                    get_or_create_tag(
                        api_client,
                        category_id,
                        tag_name,
                        tag_description
                    )

                request_body =
                    VSphereAutomation::CIS::CisTaggingTagAssociationAttach.new

                object_id = VSphereAutomation::CIS::VapiStdDynamicID.new
                object_id.id = vm['_ref']
                object_id.type = 'VirtualMachine'

                request_body.object_id = object_id

                begin
                    association_api.attach(tag_id, request_body)
                rescue VSphereAutomation::ApiError => e
                    puts "Exception when calling \
                         TaggingTagAssociationApi->attach: #{e}"
                end
            end
        end

    end

end
