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

require 'rexml/document'

# This class abstracts the access to XML elements. It provides basic methods
# to get elements by their xpath
class XMLElement

    def initialize(xml)
        @xml = xml
    end

    # Create a new XMLElement using a xml document in a string
    def self.new_s(xml_s)
        xml = nil
        xml = REXML::Document.new(xml_s).root unless xml_s.empty?

        new(xml)
    end

    # Gets the text associated to a th element. The element is select by
    # its xpath. If not found an empty string is returned
    def [](key)
        element = @xml.elements[key.to_s]

        return '' if (element && !element.has_text?) || !element

        element.text
    end

    # Return an XMLElement for the given xpath
    def element(key)
        e = @xml.elements[key.to_s]

        element = nil
        element = XMLElement.new(e) if e

        element
    end

    def exist?(key)
        !@xml.elements[key.to_s].nil?
    end

    # Get elements by xpath. This function returns an Array of XMLElements
    def elements(key)
        collection = []

        @xml.elements.each(key) do |pelem|
            collection << XMLElement.new(pelem)
        end

        collection
    end

end
