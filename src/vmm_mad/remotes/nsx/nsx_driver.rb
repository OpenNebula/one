# ---------------------------------------------------------------------------- #
# Copyright 2002-2019, OpenNebula Project, OpenNebula Systems                  #
#                                                                              #
# Licensed under the Apache License, Version 2.0 (the "License"); you may      #
# not use this file except in compliance with the License. You may obtain      #
# a copy of the License at                                                     #
#                                                                              #
# http://www.apache.org/licenses/LICENSE-2.0                                   #
#                                                                              #
# Unless required by applicable law or agreed to in writing, software          #
# distributed under the License is distributed on an "AS IS" BASIS,            #
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.     #
# See the License for the specific language governing permissions and          #
# limitations under the License.                                               #
# ---------------------------------------------------------------------------- #

# ---------------------------------------------------------------------------- #
# Set up the environment for the driver                                        #
# ---------------------------------------------------------------------------- #

ONE_LOCATION = ENV['ONE_LOCATION'] unless defined?(ONE_LOCATION)

if !ONE_LOCATION
    BIN_LOCATION  = '/usr/bin'     unless defined?(BIN_LOCATION)
    LIB_LOCATION  = '/usr/lib/one' unless defined?(LIB_LOCATION)
    ETC_LOCATION  = '/etc/one/'    unless defined?(ETC_LOCATION)
    VAR_LOCATION  = '/var/lib/one' unless defined?(VAR_LOCATION)
    GEMS_LOCATION = '/usr/share/one/gems' unless defined?(GEMS_LOCATION)
else
    BIN_LOCATION  = ONE_LOCATION + '/bin' unless defined?(BIN_LOCATION)
    LIB_LOCATION  = ONE_LOCATION + '/lib'  unless defined?(LIB_LOCATION)
    ETC_LOCATION  = ONE_LOCATION + '/etc/' unless defined?(ETC_LOCATION)
    VAR_LOCATION  = ONE_LOCATION + '/var/' unless defined?(VAR_LOCATION)
    GEMS_LOCATION = ONE_LOCATION + '/share/gems' unless defined?(GEMS_LOCATION)
end

ENV['LANG'] = 'C'

if File.directory?(GEMS_LOCATION)
    Gem.use_paths(GEMS_LOCATION)
end

$LOAD_PATH << LIB_LOCATION + '/ruby'
$LOAD_PATH << LIB_LOCATION + '/ruby/nsx_driver'

# ---------------------------------------------------------------------------- #
# NSX Library                                                                  #
# ---------------------------------------------------------------------------- #
require 'nsx_constants'
require 'nsx_error'
require 'nsx_component'
require 'nsx_client'
require 'nsxt_client'
require 'nsxv_client'
require 'logical_switch'
require 'opaque_network'
require 'transport_zone'
require 'nsxt_tz'
require 'nsxv_tz'
require 'virtual_wire'
require 'distributed_firewall'
require 'nsxt_dfw'
require 'nsxv_dfw'
require 'logical_port'
require 'nsxt_logical_port'
require 'nsxv_logical_port'
require 'nsx_rule'
require 'nsxt_rule'
require 'nsxv_rule'


# NSX Driver module
module NSXDriver
end
