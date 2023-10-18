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


begin # require 'rubygems'
    require 'rubygems'
rescue Exception
end

require 'digest/sha1'
require 'rexml/document'
require 'pp'

require 'opennebula/xml_utils'
require 'opennebula/client'
require 'opennebula/error'
require 'opennebula/utils'
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
require 'opennebula/acl'
require 'opennebula/acl_pool'
require 'opennebula/datastore'
require 'opennebula/datastore_pool'
require 'opennebula/cluster'
require 'opennebula/cluster_pool'
require 'opennebula/document'
require 'opennebula/document_json'
require 'opennebula/document_pool'
require 'opennebula/document_pool_json'
require 'opennebula/zone'
require 'opennebula/zone_pool'
require 'opennebula/security_group'
require 'opennebula/security_group_pool'
require 'opennebula/vdc'
require 'opennebula/vdc_pool'
require 'opennebula/system'
require 'opennebula/virtual_router'
require 'opennebula/virtual_router_pool'
require 'opennebula/marketplace'
require 'opennebula/marketplace_pool'
require 'opennebula/marketplaceapp'
require 'opennebula/marketplaceapp_pool'
require 'opennebula/vm_group'
require 'opennebula/vm_group_pool'
require 'opennebula/vntemplate'
require 'opennebula/vntemplate_pool'
require 'opennebula/hook'
require 'opennebula/hook_pool'
require 'opennebula/hook_log'
require 'opennebula/flow'
require 'opennebula/backupjob'
require 'opennebula/backupjob_pool'

module OpenNebula

    # OpenNebula version
    VERSION = '6.99.80'
end
