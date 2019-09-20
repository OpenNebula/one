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

helpers do
    def vcenter_client
        reqenv = request.env

        # nsxuser = reqenv[head_user] ? reqenv[head_user] : reqenv[hpref+head_user]
        # vpass = reqenv[head_pwd] ? reqenv[head_pwd] : reqenv[hpref+head_pwd]
        # vhost = reqenv[head_vhost] ? reqenv[head_vhost] : reqenv[hpref+head_vhost]
    end
end

# Return token if auth was successfully
post '/nsx/auth' do

end