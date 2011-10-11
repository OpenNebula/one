# -------------------------------------------------------------------------- #
# Copyright 2002-2011, OpenNebula Project Leads (OpenNebula.org)             #
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
require 'OpenNebula/Image'
require 'OpenNebula/ImagePool'
require 'OpenNebula/User'
require 'OpenNebula/UserPool'
require 'OpenNebula/Host'
require 'OpenNebula/HostPool'
require 'OpenNebula/Template'
require 'OpenNebula/TemplatePool'
require 'OpenNebula/Group'
require 'OpenNebula/GroupPool'
require 'OpenNebula/Acl'
require 'OpenNebula/AclPool'

module OpenNebula

    # The Error Class represents a generic error in the OpenNebula
    # library. It contains a readable representation of the error.
    # Any function in the OpenNebula module will return an Error
    # object in case of error.
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

    # Returns true if the object returned by a method of the OpenNebula
    # library is an Error
    def self.is_error?(value)
        value.class==OpenNebula::Error
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
        end

        def call(action, *args)

            if XMLPARSER
                @server.set_parser(XMLRPC::XMLParser::XMLStreamParser.new)
            end

            begin
                response = @server.call_async("one."+action, @one_auth, *args)

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
