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

module OpenNebula
    class DocumentPoolJSON < DocumentPool

        TEMPLATE_TAG = "BODY"

        def factory(element_xml)
            doc = OpenNebula::DocumentJSON.new(element_xml, @client)
            doc.load_body
            doc
        end

        # Generates a json representing the object
        #
        # @param [true, false] pretty_generate
        # @return [String] json representing the object
        #
        def to_json(pretty_generate=true)
            hash = self.to_hash

            if hash['DOCUMENT_POOL'] && hash['DOCUMENT_POOL']['DOCUMENT']
                if !hash['DOCUMENT_POOL']['DOCUMENT'].instance_of?(Array)
                    array = [hash['DOCUMENT_POOL']['DOCUMENT']]
                    hash['DOCUMENT_POOL']['DOCUMENT'] = array.compact
                end

                hash['DOCUMENT_POOL']['DOCUMENT'].each { |doc|
                    body = doc['TEMPLATE']["#{TEMPLATE_TAG}"]
                    if body && !body.empty?
                        b_hash = JSON.parse(body)
                        doc['TEMPLATE']["#{TEMPLATE_TAG}"] = b_hash
                    end
                }
            end

            if pretty_generate
                JSON.pretty_generate hash
            else
                hash.to_json
            end
        end
    end
end
