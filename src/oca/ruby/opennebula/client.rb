# -------------------------------------------------------------------------- #
# Copyright 2002-2023, OpenNebula Project, OpenNebula Systems                #
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
require 'bigdecimal'
require 'stringio'
require 'openssl'


module OpenNebula
    def self.pool_page_size
        @@pool_page_size
    end

    if OpenNebula::OX
        class OxStreamParser < XMLRPC::XMLParser::AbstractStreamParser
            def initialize
                @parser_class = OxParser
            end

            class OxParser < Ox::Sax
                include XMLRPC::XMLParser::StreamParserMixin

                alias :text :character
                alias :end_element :endElement
                alias :start_element :startElement

                def parse(str)

                    Ox.sax_parse(self, StringIO.new(str),
                        :symbolize => false,
                        :convert_special => true,
                        :skip => :skip_none)
                end
            end
        end
    elsif OpenNebula::NOKOGIRI
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

    DEFAULT_POOL_PAGE_SIZE = 200

    if size=ENV['ONE_POOL_PAGE_SIZE']
        if size.strip.match(/^\d+$/) && size.to_i >= 2
            @@pool_page_size = size.to_i
        else
            @@pool_page_size = nil
        end
    else
        @@pool_page_size = DEFAULT_POOL_PAGE_SIZE
    end


    # The client class, represents the connection with the core and handles the
    # xml-rpc calls.
    class Client
        NO_ONE_AUTH_ERROR = "ONE_AUTH file not present"

        attr_accessor :one_auth
        attr_reader   :one_endpoint, :one_zmq

        begin
            require 'xmlparser'
            XMLPARSER=true
        rescue LoadError
            XMLPARSER=false
        end

        # Creates a new client object that will be used to call OpenNebula
        # functions.
        #
        # @param [String, nil] secret user credentials ("user:password") or
        #   nil to get the credentials from user auth file
        # @param [String, nil] endpoint OpenNebula server endpoint
        #   (http://host:2633/RPC2) or nil to get it form the environment
        #   variable ONE_XMLRPC or use the default endpoint
        # @param [Hash] options
        # @option params [Integer] :timeout connection timeout in seconds,
        #   defaults to 30
        # @option params [String] :http_proxy HTTP proxy string used for
        #  connecting to the endpoint; defaults to no proxy
        # @option params [Boolean] :sync Use only one http connection for
        #  all calls. It should not be used for multithreaded programs.
        #  It's the only mode that can be used with :cert_dir and
        #  :disable_ssl_verify
        # @option params [String] :cert_dir Extra directory where to import
        #  trusted issuer certificates. Use with :sync = true
        # @option params [String] :disable_ssl_verify Disable SSL certificate
        #  verification. Use only for testing and with :sync = true
        #
        # @return [OpenNebula::Client]
        def initialize(secret=nil, endpoint=nil, options={})
            if secret
                @one_auth = secret
            elsif ENV["ONE_AUTH"] and !ENV["ONE_AUTH"].empty? and
                    File.file?(ENV["ONE_AUTH"])
                @one_auth = File.read(ENV["ONE_AUTH"])
            elsif ENV["HOME"] and File.file?(ENV["HOME"]+"/.one/one_auth")
                @one_auth = File.read(ENV["HOME"]+"/.one/one_auth")
            elsif File.file?("/var/lib/one/.one/one_auth")
                @one_auth = File.read("/var/lib/one/.one/one_auth")
            else
                raise NO_ONE_AUTH_ERROR
            end

            @one_auth = @one_auth.rstrip

            if endpoint
                @one_endpoint = endpoint
            elsif ENV["ONE_XMLRPC"]
                @one_endpoint = ENV["ONE_XMLRPC"]
            elsif ENV['HOME'] and File.exist?(ENV['HOME']+"/.one/one_endpoint")
                @one_endpoint = File.read(ENV['HOME']+"/.one/one_endpoint")
            elsif File.exist?("/var/lib/one/.one/one_endpoint")
                @one_endpoint = File.read("/var/lib/one/.one/one_endpoint")
            else
                @one_endpoint = "http://localhost:2633/RPC2"
            end

            @one_endpoint= @one_endpoint.rstrip

            @async = !options[:sync]

            if options[:subscriber_endpoint]
                @one_zmq = options[:subscriber_endpoint]
            elsif ENV["ONE_ZMQ"]
                @one_zmq = ENV["ONE_ZMQ"]
            else
                @one_zmq = 'tcp://localhost:2101'
            end

            timeout=nil
            if options[:timeout]
                timeout = options[:timeout]
            elsif ENV['ONE_XMLRPC_TIMEOUT']
                timeout = ENV['ONE_XMLRPC_TIMEOUT'].to_i
            end

            http_proxy=nil
            http_proxy=options[:http_proxy] if options[:http_proxy]

            @server = XMLRPC::Client.new2(@one_endpoint, http_proxy, timeout)
            @server.http_header_extra = {'accept-encoding' => 'identity'}

            http = @server.instance_variable_get("@http")

            if options[:cert_dir] || ENV['ONE_CERT_DIR']
                raise "SSL options don't work in async mode" if @async

                cert_dir = options[:cert_dir] || ENV['ONE_CERT_DIR']
                cert_files = Dir["#{cert_dir}/*"]

                cert_store = OpenSSL::X509::Store.new
                cert_store.set_default_paths
                cert_files.each {|cert| cert_store.add_file(cert) }

                http.cert_store = cert_store
            end

            if options[:disable_ssl_verify] || ENV['ONE_DISABLE_SSL_VERIFY']
                raise "SSL options don't work in async mode" if @async

                http.verify_mode = OpenSSL::SSL::VERIFY_NONE
            end

            if defined?(OxStreamParser)
                @server.set_parser(OxStreamParser.new)
            elsif OpenNebula::NOKOGIRI
                @server.set_parser(NokogiriStreamParser.new)
            elsif XMLPARSER
                @server.set_parser(XMLRPC::XMLParser::XMLStreamParser.new)
            end
        end

        def call(action, *args)
            begin
                if @async
                    response = @server.call_async("one."+action, @one_auth, *args)
                else
                    response = @server.call("one."+action, @one_auth, *args)
                end

                if response[0] == false
                    Error.new(response[1], response[2])
                else
                    response[1] #response[1..-1]
                end
            rescue Exception => e
                Error.new(e.message, Error::EXML_RPC_CALL)
            end
        end

        def get_version()
            call("system.version")
        end
    end
end
