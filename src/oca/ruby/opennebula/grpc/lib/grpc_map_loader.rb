# -------------------------------------------------------------------------- #
# Copyright 2002-2025, OpenNebula Project, OpenNebula Systems                #
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

require_relative 'acl_map'
require_relative 'backupjob_map'
require_relative 'cluster_map'
require_relative 'datastore_map'
require_relative 'document_map'
require_relative 'group_map'
require_relative 'hook_map'
require_relative 'host_map'
require_relative 'image_map'
require_relative 'marketplace_map'
require_relative 'marketplaceapp_map'
require_relative 'securitygroup_map'
require_relative 'system_map'
require_relative 'template_map'
require_relative 'user_map'
require_relative 'vdc_map'
require_relative 'virtualmachine_map'
require_relative 'virtualnetwork_map'
require_relative 'virtualrouter_map'
require_relative 'vmgroup_map'
require_relative 'vntemplate_map'
require_relative 'zone_map'

# rubocop:disable Style/Documentation
module GRPCMappings

    class MapLoader

        MAP_CONSTANTS = [:ACL_MAP,
                         :BACKUPJOB_MAP,
                         :CLUSTER_MAP,
                         :DATASTORE_MAP,
                         :DOCUMENT_MAP,
                         :HOOK_MAP,
                         :HOST_MAP,
                         :GROUP_MAP,
                         :IMAGE_MAP,
                         :MARKETPLACE_MAP,
                         :MARKETPLACEAPP_MAP,
                         :SECURITYGROUP_MAP,
                         :SYSTEM_MAP,
                         :TEMPLATE_MAP,
                         :USER_MAP,
                         :VDC_MAP,
                         :VIRTUALMACHINE_MAP,
                         :VIRTUALNETWORK_MAP,
                         :VIRTUALROUTER_MAP,
                         :VMGROUP_MAP,
                         :VNTEMPLATE_MAP,
                         :ZONE_MAP].freeze

        def self.load
            MAP_CONSTANTS
                .map {|name| GRPCMappings.const_get(name) }
                .reduce({}, :merge)
                .freeze
        end

    end

end
# rubocop:enable Style/Documentation
