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
    # The XMLElement class provides an abstraction of the underlying
    # XML parser engine. It provides XML-related methods for the Pool and
    # PoolElement classes
    class XMLElement

        # xml:: _opaque xml object_ an xml object as returned by build_xml
        def initialize(xml=nil)
            @xml = xml
        end

        # Initialize a XML document for the element
        # xml:: _String_ the XML document of the object
        # root_element:: _String_ Base xml element
        def initialize_xml(xml, root_element)
            @xml = XMLElement.build_xml(xml, root_element)

            if OpenNebula.is_error?(@xml)
                @xml = nil
            else
                if NOKOGIRI
                    if @xml.size == 0
                        @xml = nil
                    end
                else
                    if @xml.name != root_element
                        @xml = nil
                    end
                end
            end
            @xml
        end

        # Builds a XML document
        # xml:: _String_ the XML document of the object
        # root_element:: _String_ Base xml element
        # [return] _XML_ object for the underlying XML engine
        def self.build_xml(xml, root_element)
            begin
                if NOKOGIRI
                    doc = Nokogiri::XML(xml).xpath("/#{root_element}")
                else
                    doc = REXML::Document.new(xml).root
                end
            rescue Exception => e
                return OpenNebula::Error.new(e.message)
            end

            return doc
        end

        # Checks if the internal XML representation is valid
        def xml_nil?
            return @xml.nil?
        end

        # Extract a text element from the XML description of the PoolElement.
        #
        # @param [String] key Xpath expression
        #
        # @return [String, nil] If a text element is found, the element's
        #   text value. Otherwise, an empty string or nil, depending
        #   on the backend
        #
        # @example
        #   vm['VID'] # gets VM id
        #   vm['HISTORY/HOSTNAME'] # get the hostname from the history
        def [](key)
            if NOKOGIRI
                element=@xml.xpath(key.to_s)

                return nil if element.size == 0
            else
                element=@xml.elements[key.to_s]

                return "" if element && !element.has_text?
            end

            element.text if element
        end

        # Delete an element from the xml
        # xpath::_String_ xpath expression that selects the elemnts to be deleted
        def delete_element(xpath)
            if NOKOGIRI
                @xml.xpath(xpath.to_s).remove
            else
                @xml.delete_element(xpath.to_s)
            end
        end

        # Add a new element to the xml
        # xpath::_String_ xpath xpression where the elemente will be added
        # elems::_Hash_ Hash containing the pairs key-value to be included
        # Examples:
        #   add_element('VM', 'NEW_ITEM' => 'NEW_VALUE')
        #     <VM><NEW_ITEM>NEW_VALUE</NEW_ITEM>...</VM>
        #
        #   add_element('VM/TEMPLATE', 'V1' => {'X1' => 'A1', 'Y2' => 'A2'})
        #     <VM><TEMPLATE><V1><X1>A1</X1><Y2>A2</Y2>...</TEMPLATE></VM>
        def add_element(xpath, elems)
            elems.each { |key, value|
                if value.instance_of?(Hash)
                    if NOKOGIRI
                        elem = Nokogiri::XML::Node.new key, @xml.document
                        value.each { |k2, v2|
                            child = Nokogiri::XML::Node.new k2, elem
                            child.content = v2
                            elem.add_child(child)
                        }
                        @xml.xpath(xpath.to_s).first.add_child(elem)
                    else
                        elem = REXML::Element.new(key)
                        value.each { |k2, v2|
                            elem.add_element(k2).text = v2
                        }
                        @xml.elements[xpath].add_element(elem)
                    end
                else
                    if NOKOGIRI
                        elem = Nokogiri::XML::Node.new key, @xml.document
                        elem.content = value
                        @xml.xpath(xpath.to_s).first.add_child(elem)
                    else
                        @xml.elements[xpath].add_element(key).text = value
                    end
                end
            }
        end

        # Update the content of the current doc
        def set_content(content)
            if NOKOGIRI
                @xml.content = content
            else
                @xml.text = content
            end
        end

        # Gets an array of text from elements extracted
        # using  the XPATH  expression passed as filter
        def retrieve_elements(filter)
            elements_array = Array.new

            if NOKOGIRI
                @xml.xpath(filter.to_s).each { |pelem|
                    elements_array << pelem.text if pelem.text
                 }
            else
                @xml.elements.each(filter.to_s) { |pelem|
                    elements_array << pelem.text if pelem.text
                }
            end

            if elements_array.size == 0
                return nil
            else
                return elements_array
            end

        end

        # Iterates over every Element in the XPath and returns an array
        # with XMLElements
        # @return [XMLElement]
        def retrieve_xmlelements(xpath_str)
            collection = []
            if NOKOGIRI
                @xml.xpath(xpath_str).each { |pelem|
                    collection << XMLElement.new(pelem)
                }
            else
                @xml.elements.each(xpath_str) { |pelem|
                    collection << XMLElement.new(pelem)
                }
            end
            collection
        end

        # Gets an attribute from an element
        # key:: _String_ xpath for the element
        # name:: _String_ name of the attribute
        def attr(key,name)
            value = nil

            if NOKOGIRI
                element=@xml.xpath(key.to_s.upcase)
                if element.size == 0
                    return nil
                end

                attribute = element.attr(name)

                value = attribute.text if attribute != nil
            else
                element=@xml.elements[key.to_s.upcase]

                value = element.attributes[name] if element != nil
            end

            return value
        end

        # Iterates over every Element in the XPath and calls the block with a
        # a XMLElement
        # block:: _Block_
        def each(xpath_str,&block)
            if NOKOGIRI
                @xml.xpath(xpath_str).each { |pelem|
                    block.call XMLElement.new(pelem)
                }
            else
                @xml.elements.each(xpath_str) { |pelem|
                    block.call XMLElement.new(pelem)
                }
            end
        end

        def each_xpath(xpath_str,&block)
            if NOKOGIRI
                @xml.xpath(xpath_str).each { |pelem|
                    block.call pelem.text
                }
            else
                @xml.elements.each(xpath_str) { |pelem|
                    block.call pelem.text
                }
            end
        end

        def name
            @xml.name
        end

        def text
            if NOKOGIRI
                @xml.content
            else
                @xml.text
            end
        end

        # Returns wheter there are elements for a given XPath
        # xpath_str:: _String_ XPath expression to locate the element
        def has_elements?(xpath_str)
            if NOKOGIRI
                element = @xml.xpath(xpath_str.to_s.upcase)
                return element != nil && element.children.size > 0
            else
                element = @xml.elements[xpath_str.to_s]
                return element != nil && element.has_elements?
            end
        end

        # Returns the <TEMPLATE> element in text form
        # indent:: _Boolean_ indents the resulting string, default true
        def template_str(indent=true)
            template_like_str('TEMPLATE', indent)
        end

        # Returns the <TEMPLATE> element in XML form
        def template_xml
            if NOKOGIRI
                @xml.xpath('TEMPLATE').to_s
            else
                @xml.elements['TEMPLATE'].to_s
            end
        end

        # Returns the xml of an element
        def element_xml(xpath)
            if NOKOGIRI
                @xml.xpath(xpath).to_s
            else
                @xml.elements[xpath].to_s
            end
        end

        # Returns elements in text form
        # root_element:: _String_ base element
        # indent:: _Boolean_ indents the resulting string, default true
        # xpath_exp:: _String_ filter elements with a XPath
        def template_like_str(root_element, indent=true, xpath_exp=nil)
            if NOKOGIRI
                xml_template = @xml.xpath(root_element).to_s
                rexml        = REXML::Document.new(xml_template).root
            else
                rexml = @xml.elements[root_element]
            end

            if indent
                ind_enter = "\n"
                ind_tab   = '  '
            else
                ind_enter = ''
                ind_tab   = ' '
            end

            str = rexml.elements.collect(xpath_exp) {|n|
                next if n.class != REXML::Element

                str_line = ""

                if n.has_elements?
                    str_line << "#{n.name}=[#{ind_enter}" << n.collect { |n2|

                        next if n2.class != REXML::Element or !n2.has_text?

                        str = "#{ind_tab}#{n2.name}=#{attr_to_str(n2.text)}"

                    }.compact.join(",#{ind_enter}") << " ]"
                else
                    next if !n.has_text?

                    str_line << "#{n.name}=#{attr_to_str(n.text)}"
                end

                str_line
            }.compact.join("\n")

            return str
        end

        #
        #
        #
        def to_xml(pretty=false)
            if NOKOGIRI && pretty
                str = @xml.to_xml
            elsif REXML_FORMATTERS && pretty
                str = String.new

                formatter = REXML::Formatters::Pretty.new
                formatter.compact = true

                formatter.write(@xml,str)
            else
                str = @xml.to_s
            end

            return str
        end

        # @return [Hash] a hash representing the resource
        def to_hash
            hash = {}

            if NOKOGIRI
                if @xml.instance_of?(Nokogiri::XML::NodeSet)
                    @xml.each { |c|
                        if c.element?
                            build_hash(hash, c)
                        end
                    }
                else
                    build_hash(hash, @xml)
                end
            else
                build_hash(hash, @xml)
            end

            hash
        end

        private

        #
        #
        #
        def build_hash(hash, element)
            if NOKOGIRI
                array = element.children
                if array.length==1 and (array.first.text? or array.first.cdata?)
                    r = array.first.text
                else
                    r = {}
                    array.each { |c|
                        if c.element?
                            build_hash(r, c)
                        end
                    }
                end
            else
                r = {}
                if element.has_elements?
                    element.each_element { |c| build_hash(r, c) }
                elsif element.has_text?
                    r = element.text
                end
            end

            key = element.name
            if hash.has_key?(key)
                if hash[key].instance_of?(Array)
                    hash[key] << r
                else
                    hash[key] = [hash[key], r]
                end
            else
                hash[key] = r
            end

            hash
        end

        #
        #
        #
        def attr_to_str(attr)
            attr.gsub!('"',"\\\"")
            attr = "\"#{attr}\""

            return attr
        end
    end
end

