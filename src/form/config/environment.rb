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

DEFAULT_DRIVER_DIR  = "#{LIB_LOCATION}/oneform/drivers"
EXTERNAL_DRIVER_DIR = "#{VAR_LOCATION}/oneform/drivers"
STATES_DIR          = "#{VAR_LOCATION}/oneform/drivers/.states"

# -------------------------------------------------------------------------- #
# Required libraries
# -------------------------------------------------------------------------- #

require 'hcl_parser'
require 'securerandom'
require 'uri'

# -------------------------------------------------------------------------- #
# Required classes
# -------------------------------------------------------------------------- #

APP_ROOT = File.expand_path('..', __dir__)

# Tools
require_relative File.join(APP_ROOT, 'lib', 'tools', 'terraform')
require_relative File.join(APP_ROOT, 'lib', 'tools', 'ansible')

# Models
require_relative File.join(APP_ROOT, 'app', 'models', 'driver')
require_relative File.join(APP_ROOT, 'app', 'models', 'provider')
require_relative File.join(APP_ROOT, 'app', 'models', 'resource')
require_relative File.join(APP_ROOT, 'app', 'models', 'resources', 'cluster')
require_relative File.join(APP_ROOT, 'app', 'models', 'resources', 'host')
require_relative File.join(APP_ROOT, 'app', 'models', 'resources', 'network')
require_relative File.join(APP_ROOT, 'app', 'models', 'resources', 'datastore')
require_relative File.join(APP_ROOT, 'app', 'models', 'provision_values')
require_relative File.join(APP_ROOT, 'app', 'services', 'resource_manager')
require_relative File.join(APP_ROOT, 'app', 'models', 'provision')
require_relative File.join(APP_ROOT, 'app', 'models', 'schemas')
require_relative File.join(APP_ROOT, 'app', 'models', 'pools')

# Services
require_relative File.join(APP_ROOT, 'app', 'services', 'provision_lcm')

# Controllers
APP_PATHS = [File.join(APP_ROOT, 'app', 'controllers')]
APP_PATHS.each do |path|
    Dir.glob(File.join(path, '*.rb')).sort.each {|file| require file }
end

# Main controller
require_relative File.join(APP_ROOT, 'app', 'routes')
