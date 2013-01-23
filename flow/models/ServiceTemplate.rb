# -------------------------------------------------------------------------- #
# Copyright 2010-2013, C12G Labs S.L.                                        #
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

module OpenNebula

    class ServiceTemplate < DocumentJSON
        ROLE_SCHEMA = {
            :type => :object,
            :properties => {
                'name' => {
                    :type => :string,
                    :required => true
                },
                'cardinality' => {
                    :type => :integer,
                    :default => 1
                },
                'vm_template' => {
                    :type => :integer,
                    :required => true
                },
                'parents' => {
                    :type => :array,
                    :items => {
                        :type => :string
                    }
                }
            }
        }

        SCHEMA = {
            :type => :object,
            :properties => {
                'name' => {
                    :type => :string,
                    :required => true
                },
                'deployment' => {
                :type => :string,
                :enum => %w{none straight},
                :default => 'none'
                },
                'roles' => {
                    :type => :array,
                    :items => ROLE_SCHEMA,
                    :required => true
                }
            }
        }



        DOCUMENT_TYPE = 101

        def allocate(template_json)
            template = JSON.parse(template_json)

            validator = Validator::Validator.new(
                :default_values => true,
                :delete_extra_properties => false
            )

            validator.validate!(template, SCHEMA)

            super(template.to_json, template['name'])
        end

        # Retrieves the template
        #
        # @return [String] json template
        def template
            @body.to_json
        end

    end
end
