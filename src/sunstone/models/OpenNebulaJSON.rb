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

require 'opennebula'
include OpenNebula

require 'OpenNebulaJSON/GroupJSON'
require 'OpenNebulaJSON/HostJSON'
require 'OpenNebulaJSON/ClusterJSON'
require 'OpenNebulaJSON/ImageJSON'
require 'OpenNebulaJSON/TemplateJSON'
require 'OpenNebulaJSON/JSONUtils'
require 'OpenNebulaJSON/PoolJSON'
require 'OpenNebulaJSON/UserJSON'
require 'OpenNebulaJSON/VMGroupJSON'
require 'OpenNebulaJSON/VirtualMachineJSON'
require 'OpenNebulaJSON/VirtualNetworkJSON'
require 'OpenNebulaJSON/VirtualNetworkTemplateJSON'
require 'OpenNebulaJSON/AclJSON'
require 'OpenNebulaJSON/DatastoreJSON'
require 'OpenNebulaJSON/ZoneJSON'
require 'OpenNebulaJSON/SecurityGroupJSON'
require 'OpenNebulaJSON/VdcJSON'
require 'OpenNebulaJSON/VirtualRouterJSON'
require 'OpenNebulaJSON/MarketPlaceJSON'
require 'OpenNebulaJSON/MarketPlaceAppJSON'
require 'OpenNebulaJSON/BackupJobJSON'

module OpenNebula
    class Error
        def to_json
            error_hash = self.to_hash

            return JSON.pretty_generate error_hash
        end

        def to_hash
            message = { :message => @message }
            error_hash = { :error => message }

            return error_hash
        end
    end
end
