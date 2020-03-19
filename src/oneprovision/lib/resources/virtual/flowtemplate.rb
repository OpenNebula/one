# -------------------------------------------------------------------------- #
# Copyright 2002-2019, OpenNebula Project, OpenNebula Systems                #
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

require 'resources/virtual/virtual_resource'
require 'models'

require 'json'

module OneProvision

    # FlowTemplate
    class FlowTemplate < VirtualResource

        # Class constructor
        def initialize
            super

            @pool = OpenNebula::ServiceTemplatePool.new(@client)
            @type = 'flowtemplate'
        end

        # Info an specific object
        #
        # @param id [String] Object ID
        def info(id)
            @one = OpenNebula::ServiceTemplate.new_with_id(id, @client)
            @one.info
        end

        # Gets all resources or just provision resources
        #
        # @param id [Integer]  ID of the provision
        #
        # @return [Array] with provision resource if id!=nil
        #                 with all resources if if==nil
        def get(id = nil)
            Utils.exception(@pool.info_all)

            if id
                @pool.select do |resource|
                    resource = resource.to_hash['DOCUMENT']['TEMPLATE']['BODY']
                    resource = JSON.parse(resource)

                    resource['provision']['provision_id'] == id
                end
            else
                @pool.reject do |resource|
                    resource = resource.to_hash['DOCUMENT']['TEMPLATE']['BODY']
                    resource = JSON.parse(resource)

                    resource['provision']['provision_id'].nil?
                end
            end
        end

        # Get template in json format
        #
        # @param template [Hash] Key value template
        def format_template(template)
            obj_template(template).to_json
        end

        private

        # Create new object
        def new_object
            @one = OpenNebula::ServiceTemplate.new(
                OpenNebula::ServiceTemplate.build_xml,
                @client
            )
        end

    end

end
