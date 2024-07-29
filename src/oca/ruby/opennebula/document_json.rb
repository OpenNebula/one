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

require 'json'

module OpenNebula
    class DocumentJSON < Document

        TEMPLATE_TAG = "BODY"

        # Returns current template tag
        def template_tag
            if @tag
                @tag
            else
                TEMPLATE_TAG
            end
        end

        # Allocate a new Document containing the json inside the TEMPLATE
        #
        # @param [String] template_json json to be inserted in the TEMPLATE
        #   of the new resource
        # @param [String, nil] name name of the object, this value will be
        #   processed by the OpenNebula core
        # @return [nil, OpenNebula::Error] nil in case of success, Error
        #   otherwise
        #
        def allocate(template_json, name = nil, tag = nil)
            @tag = tag if tag

            text = build_template_xml(template_json, name)

            super(text)
        end

        # Allocate XML Document
        #
        # @param xml [String] XML document content
        def allocate_xml(xml)
            super(xml)
        end

        # Retrieves the information of the Service and all its Nodes.
        #
        # @return [nil, OpenNebula::Error] nil in case of success, Error
        #   otherwise
        #
        def info(decrypt = false)
            rc = super(decrypt)
            if OpenNebula.is_error?(rc)
                return rc
            end

            load_body
        end

        alias_method :info!, :info

        # Updates the current state of this Service in the OpenNebula DB
        #
        # @params [String, nil] template_json string to be inserted in the
        #   template. If nil @body will be used instead
        # @param append [true, false] True to append new attributes instead of
        #   replace the whole template
        #
        # @return [nil, OpenNebula::Error] nil in case of success, Error
        #   otherwise
        #
        def update(template_json=nil, append=false)
            template_json ||= @body.to_json

            text = build_template_xml(template_json)

            super(text, append)
        end

        # Replaces the raw template contents
        #
        # @param template [String] New template contents, in the form KEY = VAL
        # @param append [true, false] True to append new attributes instead of
        #   replace the whole template
        #
        # @return [nil, OpenNebula::Error] nil in case of success, Error
        #   otherwise
        def update_raw(template_raw, append=false)
            super(template_raw, append)
        end

        # Generates a json representing the object
        #
        # @param [true, false] pretty_generate
        # @return [String] json representing the object
        #
        def to_json(pretty_generate=true)
            hash = self.to_hash

            body = hash['DOCUMENT']['TEMPLATE']["#{template_tag}"]
            if body
                body_hash = JSON.parse(body)
                hash['DOCUMENT']['TEMPLATE']["#{template_tag}"] = body_hash
            end

            if pretty_generate
                JSON.pretty_generate hash
            else
                hash.to_json
            end
        end


        # Fill the @body hash with the values of the template
        def load_body
            body_str = self["TEMPLATE/#{template_tag}"]

            if body_str
                begin
                    @body = JSON.parse(body_str)
                rescue JSON::JSONError
                    return OpenNebula::Error.new($!)
                end
            end

            plain_str = self['TEMPLATE/PLAIN']

            if plain_str
                begin
                    @plain = JSON.parse(plain_str)
                rescue JSON::JSONError
                    return OpenNebula::Error.new($!)
                end
            end

            return nil
        end

        # Build an xml string incluiding the provided json
        #
        # @param [String] template_json The template to be inserted
        # @param [String, nil] name The string to be inserted as name
        # @param [String, nil] plain information to add to the document
        # @return [String] The xml containing the json
        #
        def build_template_xml(template_json, name = nil, plain = nil)
            template_json ||= ""
            plain         ||= @plain
            plain           = plain.to_json if plain && !(plain.is_a? String)

            text = "<TEMPLATE>"

            text << "<NAME>#{name}</NAME>" if name
            text << "<PLAIN><![CDATA[#{plain}]]></PLAIN>" if plain

            text << "<#{template_tag}>"
            text << "<![CDATA[#{template_json}]]>"
            text << "</#{template_tag}>"

            text << "</TEMPLATE>"

            text
        end
    end
end
