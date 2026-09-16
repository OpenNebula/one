# -------------------------------------------------------------------------- #
# Copyright 2002-2026, OpenNebula Project, OpenNebula Systems                #
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

module OneForm

    class Provision < ODS::Document

        # Base model for a OpenNebula OneForm Object
        class Resource

            attr_reader :body

            # body atrribute => default value
            BODY_ATTRIBUTES = {
                :id       => nil,
                :name     => nil,
                :uuid     => nil,
                :template => {}
            }

            BODY_ATTRIBUTES.each do |attribute, default|
                define_method(attribute) do
                    value = @body[attribute]
                    value.nil? && default ? default.dup : value
                end

                define_method("#{attribute}=") do |value|
                    @body[attribute] = value
                end
            end

            def initialize(body)
                raise ArgumentError, 'Resource body must be a hash' unless body.is_a?(Hash)

                @body = body
            end

            def type
                self.class::TYPE
            end

            def suffix?
                self.class::SUFFIX
            end

            def associated_types
                self.class::ASSOCIATED_TYPES
            end

            def pre_create!
                nil
            end

            def pre_delete!(_client)
                nil
            end

            # Returns the complete OpenNebula object represented by this resource
            # @param client [OpenNebula::Client] OpenNebula client
            def one_object(client)
                return unless id

                helper = ODS::OneHelper::Resource.resolve(type)
                return helper if OpenNebula.is_error?(helper)

                object = helper.get(client, id)

                return if OpenNebula.is_error?(object) &&
                          object.errno == OpenNebula::Error::ENO_EXISTS

                object
            end

            def to_json(*args)
                @body.to_json(*args)
            end

            def self.json_create(value)
                return value if value.is_a?(self)

                new(value)
            end

        end

    end

end
