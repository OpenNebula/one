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

require 'OpenNebulaJSON/JSONUtils'

module OpenNebulaJSON
    class HostPoolJSON < OpenNebula::HostPool; include JSONUtils; end
    class VMGroupPoolJSON < OpenNebula::VMGroupPool; include JSONUtils; end
    class VirtualMachinePoolJSON < OpenNebula::VirtualMachinePool; include JSONUtils; end
    class VirtualNetworkPoolJSON < OpenNebula::VirtualNetworkPool; include JSONUtils; end
    class VNTemplatePoolJSON < OpenNebula::VNTemplatePool; include JSONUtils; end
    class ImagePoolJSON < OpenNebula::ImagePool; include JSONUtils; end
    class TemplatePoolJSON < OpenNebula::TemplatePool; include JSONUtils; end
    class GroupPoolJSON < OpenNebula::GroupPool; include JSONUtils; end
    class UserPoolJSON < OpenNebula::UserPool; include JSONUtils; end
    class AclPoolJSON < OpenNebula::AclPool; include JSONUtils; end
    class ClusterPoolJSON < OpenNebula::ClusterPool; include JSONUtils; end
    class DatastorePoolJSON < OpenNebula::DatastorePool; include JSONUtils; end
    class ZonePoolJSON < OpenNebula::ZonePool; include JSONUtils; end
    class SecurityGroupPoolJSON < OpenNebula::SecurityGroupPool; include JSONUtils; end
    class VdcPoolJSON < OpenNebula::VdcPool; include JSONUtils; end
    class VirtualRouterPoolJSON < OpenNebula::VirtualRouterPool; include JSONUtils; end
    class MarketPlacePoolJSON < OpenNebula::MarketPlacePool; include JSONUtils; end
    class MarketPlaceAppPoolJSON < OpenNebula::MarketPlaceAppPool; include JSONUtils; end
    class BackupJobPoolJSON < OpenNebula::BackupJobPool; include JSONUtils; end
end
