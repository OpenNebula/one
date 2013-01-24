# -------------------------------------------------------------------------- #
# Copyright 2002-2013, OpenNebula Project (OpenNebula.org), C12G Labs        #
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


$: << "../../../../oca/ruby"

begin # require 'rubygems'
    require 'rubygems'
rescue Exception
end

require 'xmlrpc/client'
require 'digest/sha1'
require 'rexml/document'
require 'pp'

require 'opennebula/xml_utils'
require 'opennebula/virtual_machine'
require 'opennebula/virtual_machine_pool'
require 'opennebula/virtual_network'
require 'opennebula/virtual_network_pool'
require 'opennebula/image'
require 'opennebula/image_pool'
require 'opennebula/user'
require 'opennebula/user_pool'
require 'opennebula/host'
require 'opennebula/host_pool'
require 'opennebula/template'
require 'opennebula/template_pool'
require 'opennebula/group'
require 'opennebula/group_pool'

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
        begin
            require 'xmlparser'
            XMLPARSER=true
        rescue LoadError
            XMLPARSER=false
        end

        def initialize(secret=nil, endpoint=nil)
            @endpoint = endpoint
            
            case endpoint
                when "http://zonea.zoneadomain.za:2633/RPC2"
                    @zone = "zonea"
                when "http://zoneb.zoneadomain.za:2634/RPC2"
                    @zone = "zoneb"
            end 
        end

        def call(action, *args)
            
            xmlrpc_action = "one."+action
    
            case xmlrpc_action
                when "one.vn.info"
                    return File.read("fixtures/xml/vnet.xml")
                when "one.vn.allocate"
                    return 3
                when "one.vn.delete"
                    return nil
                when "one.vm.info"
                    return File.read("fixtures/xml/vm.xml")
                when "one.vm.allocate"
                    return 6
                when "one.vm.delete"
                    return nil
                when "one.vm.action"
                    return nil
                when "one.vm.deploy"
                    return nil
                when "one.vm.migrate"
                    return nil
                when "one.host.info"
                    return File.read("fixtures/xml/host-#{@zone}.xml")
                when "one.host.allocate"
                    return 7
                when "one.host.delete"
                    return nil
                when "one.host.enable"
                    return nil
                when "one.user.allocate"
                    return 3
                when "one.user.info"
                    return File.read("fixtures/xml/user.xml")
                when "one.user.delete"
                    return nil
                when "one.vnpool.info"
                    return File.read("fixtures/xml/vnetpool-#{@zone}.xml")
                when "one.vmpool.info"
                    return File.read("fixtures/xml/vmpool-#{@zone}.xml")
                when "one.hostpool.info"
                    return File.read("fixtures/xml/hostpool-#{@zone}.xml")
                when "one.userpool.info"
                    return File.read("fixtures/xml/userpool-#{@zone}.xml")
                when "one.imagepool.info"
                    return File.read("fixtures/xml/imagepool-#{@zone}.xml")
                when "one.templatepool.info"
                    return File.read("fixtures/xml/templatepool-#{@zone}.xml")                    
            end
        end
    end
end
