
module OpenNebula

    begin
        require 'nokogiri'
        NOKOGIRI=true
    rescue LoadError
        NOKOGIRI=false
    end

    # Require crack library if present, otherwise don't bother
    # This is just for OCCI use
    begin
        require 'crack'
    rescue LoadError
    end

    ###########################################################################
    # The XMLUtilsElement module provides an abstraction of the underlying
    # XML parser engine. It provides XML-related methods for the Pool Elements
    ###########################################################################
    module XMLUtilsElement
        # Initialize a XML document for the element
        # xml:: _String_ the XML document of the object
        # root_element:: _String_ Base xml element
        # [return] _XML_ object for the underlying XML engine
        def self.initialize_xml(xml, root_element)
            if NOKOGIRI
                xmldoc = Nokogiri::XML(xml).xpath("/#{root_element}")
                if xmldoc.size == 0
                    xmldoc = nil
                end
            else
                xmldoc = REXML::Document.new(xml).root
                if xmldoc.name != root_element
                    xmldoc = nil
                end
            end

            return xmldoc
        end

        # Extract an element from the XML description of the PoolElement.
        # key::_String_ The name of the element
        # [return] _String_ the value of the element
        # Examples:
        #   ['VID'] # gets VM id
        #   ['HISTORY/HOSTNAME'] # get the hostname from the history
        def [](key)
            if NOKOGIRI
                element=@xml.xpath(key.to_s)
                if element.size == 0
                    return nil
                end
            else
                element=@xml.elements[key.to_s]
            end

            if element
                element.text
            end
        end

        # Gets an attribute from an elemenT
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

        def template_str(indent=true)
            template_like_str('TEMPLATE', indent)
        end

        def template_like_str(root_element, indent=true)
            if NOKOGIRI
                xml_template=@xml.xpath(root_element).to_s
                rexml=REXML::Document.new(xml_template).root
            else
                rexml=@xml.elements[root_element]
            end

            if indent
                ind_enter="\n"
                ind_tab='  '
            else
                ind_enter=''
                ind_tab=' '
            end

            str=rexml.collect {|n|
                if n.class==REXML::Element
                    str_line=""
                    if n.has_elements?
                        str_line << n.name << "=[" << ind_enter

                        str_line << n.collect {|n2|
                            if n2 && n2.class==REXML::Element
                                str = ind_tab + n2.name + "="
                                str += n2.text if n2.text
                                str
                            end
                        }.compact.join(","+ind_enter)
                        str_line<<" ]"
                    else
                        str_line<<n.name << "=" << n.text.to_s
                    end
                    str_line
                end
            }.compact.join("\n")

            str
        end

        def to_hash
            if !@hash && @xml
                begin
                   @hash = Crack::XML.parse(to_xml)
                rescue Exception => e
                   error = OpenNebula::Error.new(e.message)
                   return error
                end
            end
            return @hash
        end

        def to_xml(pretty=false)
            if NOKOGIRI
                @xml.to_xml
            else
                str = ""
                if pretty
                    REXML::Formatters::Pretty.new(1).write(@xml,str)
                else
                    REXML::Formatters::Default.new.write(@xml,str)
                end
                str
            end
        end
    end

    ###########################################################################
    # The XMLUtilsPool module provides an abstraction of the underlying
    # XML parser engine. It provides XML-related methods for the Pools
    ###########################################################################
    module XMLUtilsPool

        #Executes the given block for each element of the Pool
        #block:: _Block_
        def each_element(block)
            if NOKOGIRI
                @xml.xpath(
                    "#{@element_name}").each {|pelem|
                    block.call self.factory(pelem)
                }
            else
                @xml.elements.each(
                    "#{@element_name}") {|pelem|
                    block.call self.factory(pelem)
                }
            end
        end


        def to_hash
            if !@hash && @xml
                @hash=Crack::XML.parse(to_xml)
            end
            return @hash
        end
    end

    class XMLElement
        include XMLUtilsElement

        def initialize(xml)
            @xml = xml
        end
    end
end


