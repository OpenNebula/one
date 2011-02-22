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

ONE_LOCATION = ENV["ONE_LOCATION"]

if !ONE_LOCATION
    RUBY_LIB_LOCATION = "/usr/lib/one/ruby"
else
    RUBY_LIB_LOCATION = ONE_LOCATION+"/lib/ruby"
end

$: << RUBY_LIB_LOCATION
$: << File.dirname(__FILE__)

require 'OpenNebula'
include OpenNebula

require 'OpenNebulaJSON/ClusterJSON'
require 'OpenNebulaJSON/HostJSON'
require 'OpenNebulaJSON/ImageJSON'
require 'OpenNebulaJSON/JSONUtils'
require 'OpenNebulaJSON/PoolJSON'
require 'OpenNebulaJSON/UserJSON'
require 'OpenNebulaJSON/VirtualMachineJSON'
require 'OpenNebulaJSON/VirtualNetworkJSON'

module OpenNebula
    class Error
        def to_json
            message = { :message => @message }
            error_hash = { :error => message }

            return JSON.pretty_generate error_hash
        end
    end
end
