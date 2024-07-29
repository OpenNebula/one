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

require 'opennebula/xml_pool'

module OpenNebula

    begin
        require 'nokogiri'
        NOKOGIRI=true
    rescue LoadError
        NOKOGIRI=false
    end

    begin
        require 'ox'
        OX=true
    rescue LoadError
        OX=false
    end

    begin
        require 'rexml/formatters/pretty'
        REXML_FORMATTERS=true
    rescue LoadError
        REXML_FORMATTERS=false
    end

    # Utilities to parse pools with sax (Nokogiri and Ox)

    # vmpool, imagepool, templatepool, vnpool, documentpool

    module ParsePoolBase
        attr_accessor :pool

        def initialize (pool_name, elem_name)
            clear

            @pool_name = pool_name
            @elem_name = elem_name
        end

        def clear
            @current = 0
            @levels  = [{}]
            @pool    = Array.new
        end

        def start_element(name, attrs = [])
            return if name == @pool_name
            @value = nil

            @current = @current + 1

            @levels[@current] = Hash.new if @levels[@current].nil?
        end

        def characters(s)
            @value = s
        end

        def end_element(name)
            if @levels[@current].empty?
                @levels[@current-1][name] = @value || {}
            else
                if @levels[@current-1][name]
                    @levels[@current-1][name] = [@levels[@current-1][name], @levels[@current]].flatten
                else
                    @levels[@current-1][name] = @levels[@current]
                end

                @levels[@current] = Hash.new
            end

            if name == @elem_name
                @pool << @levels[0][@elem_name]

                @current   = 0
                @levels[0] = Hash.new
            else
                @current = @current -1
            end
        end
    end

    class ParsePoolSaxBase
        def initialize(pool_name, elem_name)
            @pool_sax=ParsePoolSax::PoolSax.new(pool_name, elem_name)
        end

        def parse(str)
            @pool_sax.clear
            sax_parse(str)
            @pool_sax.pool
        end
    end

    if OX
        class ParsePoolSax < ParsePoolSaxBase
            def sax_parse(str)
                Ox.sax_parse(@pool_sax, StringIO.new(str),
                    :symbolize => false,
                    :convert_special => true)
            end

            class PoolSax < Ox::Sax
                include ParsePoolBase

                alias :text :characters
                alias :cdata :characters
            end
        end
    elsif NOKOGIRI
        class ParsePoolSax < ParsePoolSaxBase
            def initialize(pool_name, elem_name)
                super(pool_name, elem_name)
                @parser = Nokogiri::XML::SAX::Parser.new(@pool_sax)
            end

            def sax_parse(str)
                @parser.parse(str)
            end

            class PoolSax < Nokogiri::XML::SAX::Document
                include ParsePoolBase

                alias :cdata_block :characters
            end
        end
    else
        raise "nokogiri gem not installed."
    end
end
