# -------------------------------------------------------------------------- #
# Copyright 2002-2012, OpenNebula Project Leads (OpenNebula.org)             #
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

require 'xmlrpc/client'

module OpenNebula
    if OpenNebula::NOKOGIRI
        class NokogiriStreamParser < XMLRPC::XMLParser::AbstractStreamParser
            def initialize
                @parser_class = NokogiriParser
            end

            class NokogiriParser < Nokogiri::XML::SAX::Document
                include XMLRPC::XMLParser::StreamParserMixin

                alias :cdata_block :character
                alias :characters :character
                alias :end_element :endElement
                alias :start_element :startElement

                def parse(str)
                    parser = Nokogiri::XML::SAX::Parser.new(self)
                    parser.parse(str)
                end
            end
        end
    end

    # The client class, represents the connection with the core and handles the
    # xml-rpc calls.
    class Client
        attr_accessor :one_auth

        begin
            require 'xmlparser'
            XMLPARSER=true
        rescue LoadError
            XMLPARSER=false
        end

        def initialize(secret=nil, endpoint=nil)
            if secret
                @one_auth = secret
            elsif ENV["ONE_AUTH"] and !ENV["ONE_AUTH"].empty? and File.file?(ENV["ONE_AUTH"])
                @one_auth = File.read(ENV["ONE_AUTH"])
            elsif File.file?(ENV["HOME"]+"/.one/one_auth")
                @one_auth = File.read(ENV["HOME"]+"/.one/one_auth")
            else
                raise "ONE_AUTH file not present"
            end

            @one_auth.rstrip!

            if endpoint
                @one_endpoint = endpoint
            elsif ENV["ONE_XMLRPC"]
                @one_endpoint = ENV["ONE_XMLRPC"]
            else
                @one_endpoint = "http://localhost:2633/RPC2"
            end

            @server = XMLRPC::Client.new2(@one_endpoint)

            if OpenNebula::NOKOGIRI
                @server.set_parser(NokogiriStreamParser.new)
            elsif XMLPARSER
                @server.set_parser(XMLRPC::XMLParser::XMLStreamParser.new)
            end
        end

        def call(action, *args)
            begin
                response = @server.call_async("one."+action, @one_auth, *args)

                if response[0] == false
                    Error.new(response[1], response[2])
                else
                    response[1] #response[1..-1]
                end
            rescue Exception => e
                Error.new(e.message)
            end
        end

        def get_version()
            call("system.version")
        end
    end
end
