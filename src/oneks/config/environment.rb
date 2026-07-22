# -------------------------------------------------------------------------- #
# Copyright 2002-2026, OpenNebula Project, OpenNebula Systems                #
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

ONEKS_SPEC_DIR    = File.join(VAR_LOCATION, 'oneks')
TPROXY_PATH       = File.join(VAR_LOCATION, 'remotes', 'etc', 'vnm', 'OpenNebulaNetwork.conf')
SKIP_DEPENDENCIES = ENV['RACK_ENV'] == 'development'

# -------------------------------------------------------------------------- #
# Required classes
# -------------------------------------------------------------------------- #

APP_ROOT = File.expand_path('..', __dir__)

# External libraries
require 'active_support/core_ext/string/indent'
require 'securerandom'
require 'shellwords'
require 'uri'

# Helpers
require_relative File.join(APP_ROOT, 'lib', 'helpers', 'oneks_helper')
require_relative File.join(APP_ROOT, 'lib', 'helpers', 'k8s_helper')
require_relative File.join(APP_ROOT, 'lib', 'fakes', 'k8s_fake')

# Models
require_relative File.join(APP_ROOT, 'app', 'models', 'deployment')
require_relative File.join(APP_ROOT, 'app', 'models', 'k8s_dependency')
require_relative File.join(APP_ROOT, 'app', 'models', 'k8s_group')
require_relative File.join(APP_ROOT, 'app', 'models', 'dependencies', 'seed_vm')
require_relative File.join(APP_ROOT, 'app', 'models', 'dependencies', 'cluster_router')
require_relative File.join(APP_ROOT, 'app', 'models', 'groups', 'controlplane')
require_relative File.join(APP_ROOT, 'app', 'models', 'groups', 'nodegroup')
require_relative File.join(APP_ROOT, 'app', 'models', 'cluster')
require_relative File.join(APP_ROOT, 'app', 'models', 'pools')

# Services
require_relative File.join(APP_ROOT, 'app', 'services', 'cluster_readiness')
require_relative File.join(APP_ROOT, 'app', 'services', 'cluster_lcm')
require_relative File.join(APP_ROOT, 'app', 'services', 'event_manager', 'event_manager')
require_relative File.join(APP_ROOT, 'app', 'services', 'cluster_wd')

# Controllers
APP_PATHS = [File.join(APP_ROOT, 'app', 'controllers')]
APP_PATHS.each do |path|
    Dir.glob(File.join(path, '*.rb')).sort.each {|file| require file }
end

# Main controller
require_relative File.join(APP_ROOT, 'app', 'routes')
