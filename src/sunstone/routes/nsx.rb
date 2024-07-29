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

# %%RUBYGEMS_SETUP_BEGIN%%
if File.directory?(GEMS_LOCATION)
    real_gems_path = File.realpath(GEMS_LOCATION)
    if !defined?(Gem) || Gem.path != [real_gems_path]
        $LOAD_PATH.reject! {|l| l =~ /vendor_ruby/ }

        # Suppress warnings from Rubygems
        # https://github.com/OpenNebula/one/issues/5379
        begin
            verb = $VERBOSE
            $VERBOSE = nil
            require 'rubygems'
            Gem.use_paths(real_gems_path)
        ensure
            $VERBOSE = verb
        end
    end
end
# %%RUBYGEMS_SETUP_END%%

$LOAD_PATH << RUBY_LIB_LOCATION

require 'vcenter_driver'
require 'nsx_driver'

# rubocop:disable Lint/EmptyBlock
helpers do
end
# rubocop:enable Lint/EmptyBlock

# Return token if auth was successfully
post '/nsx/auth' do
    # Get params
    nsxmgr = params['NSX_MANAGER']
    nsxuser = params['nsxuser']
    nsxpassword = params['nsxpassword']
    nsx_type = params['NSX_TYPE']
    # Check all params have data
    return [400, { 'error' => NSXDriver::NSXConstants::MSG_INCOMPLETE_REQ }] \
        unless nsxmgr && nsxuser && nsxpassword && nsx_type

    nsx_client = NSXDriver::NSXClient.new_child(nsxmgr,
                                                nsxuser,
                                                nsxpassword,
                                                nsx_type)
    case nsx_type
    when 'NSX-T'
        url = NSXDriver::NSXConstants::NSXT_AUTH
        response = nsx_client.get_token(url)
    when 'NSX-V'
        url = NSXDriver::NSXConstants::NSXV_AUTH
        response = nsx_client.get_token(url)
    else
        return [400,
                { 'error' => NSXDriver::NSXConstants::MSG_INVALID_NSXTYPE }]
    end
    return [200, response] if response
    return [400, { 'error' => NSXDriver::NSXConstants::MSG_INVALID_REQ }] \
        unless response
end
