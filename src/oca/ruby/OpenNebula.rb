begin # require 'rubygems'
    require 'rubygems'
rescue Exception
end
require 'xmlrpc/client'
require 'digest/sha1'
require 'rexml/document'
require 'pp'

require 'OpenNebula/XMLUtils'
require 'OpenNebula/VirtualMachine'
require 'OpenNebula/VirtualMachinePool'
require 'OpenNebula/VirtualNetwork'
require 'OpenNebula/VirtualNetworkPool'
require 'OpenNebula/User'
require 'OpenNebula/UserPool'
require 'OpenNebula/Host'
require 'OpenNebula/HostPool'

module OpenNebula

    # -------------------------------------------------------------------------
    # The Error Class represents a generic error in the OpenNebula
    # library. It contains a readable representation of the error.
    # Any function in the OpenNebula module will return an Error
    # object in case of error.
    # -------------------------------------------------------------------------
    class Error
        attr_reader :message
        
        # +message+ a description of the error
        def initialize(message=nil)
            @message=message
        end

        def to_str()
            @message
        end
    end

    # -------------------------------------------------------------------------
    # Returns true if the object returned by a method of the OpenNebula
    # library is an Error
    # -------------------------------------------------------------------------
    def self.is_error?(value)
        value.class==OpenNebula::Error
    end
 
    # -------------------------------------------------------------------------
    # The client class, represents the connection with the core and handles the
    # xml-rpc calls.
    # -------------------------------------------------------------------------
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
                one_secret = secret
            elsif ENV["ONE_AUTH"]
                one_secret = ENV["ONE_AUTH"]
            end

            one_secret=~/^(.+?):(.+)$/
            @one_auth  = "#{$1}:#{Digest::SHA1.hexdigest($2)}"

            if endpoint
                @one_endpoint=endpoint
            elsif ENV["ONE_XMLRPC"]
                @one_endpoint=ENV["ONE_XMLRPC"]
            else
                @one_endpoint="http://localhost:2633/RPC2"
            end
        end

        def call(action, *args)
            server=XMLRPC::Client.new2(@one_endpoint)
            if XMLPARSER
                server.set_parser(XMLRPC::XMLParser::XMLStreamParser.new)
            end

            begin
                response = server.call("one."+action, @one_auth, *args)
                
                if response[0] == false
                    Error.new(response[1])
                else
                    response[1] #response[1..-1] 
                end
            rescue Exception => e
                Error.new(e.message) 
            end
        end
    end
end
