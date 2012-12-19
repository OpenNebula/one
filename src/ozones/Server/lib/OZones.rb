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

require 'OpenNebulaJSON'

require 'OZones/Zones'
require 'OZones/VDC'
require 'OZones/ProxyRules'
require 'OZones/ApacheWritter'
require 'OZones/AggregatedPool'
require 'OZones/AggregatedHosts'
require 'OZones/AggregatedVirtualMachines'
require 'OZones/AggregatedVirtualNetworks'
require 'OZones/AggregatedImages'
require 'OZones/AggregatedUsers'
require 'OZones/AggregatedClusters'
require 'OZones/AggregatedDatastores'
require 'OZones/AggregatedTemplates'
require 'OZones/AggregatedClusters'
require 'OZones/AggregatedDatastores'

require 'openssl'
require 'digest/sha1'
require 'base64'

module OZones

    # -------------------------------------------------------------------------
    # The Error Class represents a generic error in the OZones
    # library. It contains a readable representation of the error.
    # Any function in the OZones module will return an Error
    # object in case of error.
    # -------------------------------------------------------------------------
    class Error
        attr_reader :message

        # +message+ a description of the error
        def initialize(message=nil)
            @message=message
        end

        def to_str
            @message
        end

        def to_json
            message = { :message => @message }
            error_hash = { :error => message }

            return JSON.pretty_generate error_hash
        end
    end

    # -------------------------------------------------------------------------
    # Returns true if the object returned by a method of the OZones
    # library is an Error
    # -------------------------------------------------------------------------
    def self.is_error?(value)
        value.class==OZones::Error
    end

    def self.str_to_json(str)
        return JSON.pretty_generate({:message  => str})
    end
end
