# -------------------------------------------------------------------------- #
# Copyright 2002-2019, OpenNebula Project, OpenNebula Systems                #
#                                                                            #
# Licensed under the Apache License, Version 2.0 (the "License"); you may    #
# not use this file except in compliance with the License. You may obtain    #
# a copy of the License at                                                   #
#                                                                            #
# http://www.apache.org/licenses/LICENSE-2.0                                 #
#                                                                             #
# Unless required by applicable law or agreed to in writing, software        #
# distributed under the License is distributed on an "AS IS" BASIS,          #
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.   #
# See the License for the specific language governing permissions and        #
# limitations under the License.                                             #
#--------------------------------------------------------------------------- #
module NSXDriver

    ONE_LOCATION = ENV['ONE_LOCATION'] unless defined?(ONE_LOCATION)

    if !ONE_LOCATION
        RUBY_LIB_LOCATION = '/usr/lib/one/ruby' \
            unless defined?(RUBY_LIB_LOCATION)
        GEMS_LOCATION     = '/usr/share/one/gems' \
            unless defined?(GEMS_LOCATION)
    else
        RUBY_LIB_LOCATION = ONE_LOCATION + '/lib/ruby' \
            unless defined?(RUBY_LIB_LOCATION)
        GEMS_LOCATION     = ONE_LOCATION + '/share/gems' \
            unless defined?(GEMS_LOCATION)
    end

    if File.directory?(GEMS_LOCATION)
        Gem.use_paths(GEMS_LOCATION)
    end

    $LOAD_PATH << RUBY_LIB_LOCATION

    class NSXConstants

        # CONSTANTS
        NSXT = 'NSX-T'
        NSXV = 'NSX-V'
        HEADER_JSON = { :'Content-Type' => 'application/json' }
        HEADER_XML = { :'Content-Type' => 'application/xml' }
        # NSX Manager
        NSXT_EXTENSION_LIST = 'com.vmware.nsx.management.nsxt'
        NSXV_EXTENSION_LIST = 'com.vmware.vShieldManager'
        NSXT_BASE = '/api/v1'
        NSXV_BASE = '/api/2.0'
        # Transport Zones
        NSXV_TZS = NSXV_BASE + '/vdn/scopes'
        NSXV_TZS_XPATH = '//vdnScope'
        NSXT_TZS = NSXT_BASE + '/transport-zones'
        # VirtualWire
        NSXV_AUTH = NSXV_BASE + '/services/auth/token'
        NSXV_LS_NAME_XPATH = '//virtualWire/name'
        NSXV_LS_VNI_XPATH = '//virtualWire/vdnId'
        NSXV_LS_BACKING_XPATH = '//virtualWire/vdsContextWithBacking' \
                                '/backingValue'
        NSXV_LS_OBJECTID_XPATH = '//virtualWire/vdsContextWithBacking' \
                                 '/switch/objectId'
        NSXV_LS_XPATH = '//virtualWire'
        NSXV_LS_SECTION = NSXV_BASE + '/vdn/virtualwires/'
        NSXV_TZ_SECTION = NSXV_BASE + '/vdn/scopes/'
        NSXV_TZ_XPATH = '//virtualWire/vdnScopeId'
        # OpaqueNetwork
        NSXT_AUTH = NSXT_BASE + '/aaa/registration-token'
        NSXT_LS_SECTION = NSXT_BASE + '/logical-switches/'
        # Messages
        MSG_INCOMPLETE_REQ = 'Incomplete request, NSX_MANAGER, NSX_USER, \
                              NSX_PASSWORD and NSX_TYPE are needed'
        MSG_INVALID_REQ = 'Invalid request, check that NSX_MANAGER, NSX_USER, \
                           NSX_PASSWORD and NSX_TYPE are correct'
        MSG_INVALID_NSXTYPE = 'Invalid NSX-TYPE: Only NSX-T and NSX-V are \
                               supported'

    end

end
