# -------------------------------------------------------------------------- #
# Copyright 2002-2019, OpenNebula Project, OpenNebula Systems                #
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

require 'vcenter_driver'
require 'nsx_driver'

URL_AUTH_NSXT = '/api/v1/aaa/registration-token'
URL_AUTH_NSXV = '/api/2.0/services/auth/token'
HEADER_JSON = { :'Content-Type' => 'application/json' }
HEADER_XML = { :'Content-Type' => 'application/xml' }
MSG_INCOMPLETE_REQ = 'Incomplete request, NSX_MANAGER, NSX_USER, NSX_PASSWORD \
                      and NSX_TYPE are needed'
MSG_INVALID_REQ = 'Invalid request, check that NSX_MANAGER, NSX_USER, \
                   NSX_PASSWORD and NSX_TYPE are correct'
MSG_INVALID_NSXTYPE = 'Invalid NSX-TYPE: Only NSX-T and NSX-V are supported'

helpers do
end

# Return token if auth was successfully
post '/nsx/auth' do
    # Get params
    nsxmgr = params['NSX_MANAGER']
    nsxuser = params['nsxuser']
    nsxpassword = params['nsxpassword']
    nsx_type = params['NSX_TYPE']
    # Check all params have data
    return [400, { 'error' => MSG_INCOMPLETE_REQ }] \
        unless nsxmgr && nsxuser && nsxpassword && nsx_type

    nsx_client = NSXDriver::NSXClient.new(nsxmgr, nsxuser, nsxpassword)
    if nsx_type == 'NSX-T'
        url = nsxmgr + URL_AUTH_NSXT
        response = nsx_client.get_token(url, HEADER_JSON)
    elsif nsx_type == 'NSX-V'
        url = nsxmgr + URL_AUTH_NSXV
        response = nsx_client.get_token(url, HEADER_XML)
    else
        return [400, { 'error' => MSG_INVALID_NSXTYPE }]
    end
    return [200, response] if response
    return [400, { 'error' => MSG_INVALID_REQ }] unless response
end
