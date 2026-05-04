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

module OpenNebula

    module DocumentServer

        # OpenNebula Server Document
        class Document < OpenNebula::DocumentJSON

            TEMPLATE_TAG  = 'DOCUMENT_BODY'
            DOCUMENT_TYPE = 0

            DOCUMENT_ATTRS    = []
            UPDATE_ATTRS      = []
            ATTRIBUTE_CLASSES = {}
            RESOURCE_NAME     = 'document'
            INFO_ERROR        = /\A\[([^\]]+)\] Error getting document \[(.+)\]\.\z/

            def initialize(client, xml: nil, id: nil)
                @tag = self.class::TEMPLATE_TAG

                @xml = if id
                           OpenNebula::Document.build_xml(id)
                       elsif xml
                           xml
                       else
                           OpenNebula::Document.build_xml
                       end

                super(@xml, client)
            end

            #------------------------------------------------------
            # Class methods
            #------------------------------------------------------

            # Create a new document object from the given XML element
            #
            # @param [OpenNebula::Client] client the OpenNebula client
            # @param [String] XML object
            # @param [Bool] If true, returns the raw document content, skipping all
            #   parsing steps. Otherwise, returns the parsed document.
            def self.new_from_xml(client, xml, raw: false)
                document = new(client, :xml => xml)
                rc = document.info(:raw => raw)

                return rc if OpenNebula.is_error?(rc)

                document
            end

            # Create a new document object from the given ID
            # and tries to retrieve the body information of the document
            #
            # @param [OpenNebula::Client] client the OpenNebula client
            # @param [String] id the object ID
            # @param [Bool] If true, returns the raw document content, skipping all
            #   parsing steps. Otherwise, returns the parsed document.
            def self.new_from_id(client, id, raw: false)
                document = new(client, :id => id)
                rc = document.info(:raw => raw)

                return rc if OpenNebula.is_error?(rc)

                document
            end

            # Returns the document schema
            def self.schema
                raise 'Subclasses must implement #schema' if self == Document
            end

            # Validate a document against the schema
            #
            # @return [nil, OpenNebula::Error] nil in case of success
            def self.validate(document)
                validation = schema.call(document)

                return OpenNebula::Error.new(
                    {
                        'message' => 'Error validating document',
                        'context' => validation.errors.to_h
                    },
                    OpenNebula::Error::ENOTDEFINED
                ) if validation.failure?
            end

            #------------------------------------------------------
            # Document operations
            #------------------------------------------------------

            # Fetch the document body and define the accessors
            # @param skip_methods [Hash]  Optional hash specifying which
            #   attributes should not have automatic accessor methods generated.
            # @param raw [Bool] If true, returns the raw document content, skipping all
            #   parsing steps. Otherwise, returns the parsed document.
            def info(skip_methods: nil, raw: false)
                rc = super(true)
                return custom_info_error(rc) if OpenNebula.is_error?(rc)

                skip_methods ||= {}

                @body = @body.deep_symbolize_keys

                @body.each do |key, value|
                    next if skip_methods.include?(key)

                    next unless self.class::DOCUMENT_ATTRS.include?(key)

                    self.class.define_method(key) do
                        @body[key]
                    end

                    self.class.define_method("#{key}=") do |new_value|
                        @body[key] = new_value
                    end

                    # Auto-deserialize if attribute has an associated class
                    next if raw
                    next unless self.class::ATTRIBUTE_CLASSES.key?(key) && value&.any?

                    klass = self.class::ATTRIBUTE_CLASSES[key]

                    if value.is_a?(Array)
                        @body[key] = value.map {|item| klass.json_create(item) }
                    elsif value.is_a?(Hash)
                        @body[key] = klass.json_create(value)
                    end
                end
            end

            def custom_info_error(rc)
                match = rc.message.to_s.match(INFO_ERROR)
                return rc unless match

                OpenNebula::Error.new(
                    "[#{match[1]}] Error getting #{self.class::RESOURCE_NAME} " \
                    "[#{match[2]}].",
                    rc.errno
                )
            end

            # Allocate a new document
            def allocate(template)
                rc = self.class.validate(template)
                return rc if OpenNebula.is_error?(rc)

                super(template.slice(*self.class::DOCUMENT_ATTRS).to_json, template[:name])

                # Fill the body once allocated
                rc = info
                return rc if OpenNebula.is_error?(rc)
            end

            # Update the document info
            #
            # @param json [Hash, String] Attributes to update (only those in UPDATE_ATTRS)
            # @return [nil, OpenNebula::Error] nil in case of success
            def update(json = {})
                json = JSON.parse(json, :symbolize_names => true) if json.is_a?(String)

                return OpenNebula::Error.new(
                    'Invalid update body: expected a JSON object'
                ) unless json.is_a?(Hash)

                nbody = @body.clone

                self.class::UPDATE_ATTRS.each do |attribute|
                    next unless json.key?(attribute)

                    current  = nbody[attribute]
                    incoming = json[attribute]

                    nbody[attribute] =
                        if current.is_a?(Hash) && incoming.is_a?(Hash)
                            current.deep_merge(incoming, false)
                        else
                            incoming
                        end
                end

                if nbody[:name] != name
                    rc = rename(nbody[:name])
                    return rc if OpenNebula.is_error?(rc)
                end

                rc = super(nbody.to_json)
                return rc if OpenNebula.is_error?(rc)

                @body = nbody
            rescue StandardError => e
                OpenNebula::Error.new("Error updating document: #{e.message}")
            end

            # Constructs a basic body hash representation of the document
            # @return [Hash] body document attributes
            def plain_body
                attrs = [:id] + self.class::DOCUMENT_ATTRS
                attrs.to_h {|attr| [attr, respond_to?(attr) ? public_send(attr) : nil] }
            end

        end

    end

end
