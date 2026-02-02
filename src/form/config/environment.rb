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

# -------------------------------------------------------------------------- #
# OpenNebula paths
# -------------------------------------------------------------------------- #
# %%RUBYGEMS_SETUP_START%%

ONE_LOCATION = ENV['ONE_LOCATION']

if !ONE_LOCATION
    RUBY_LIB_LOCATION = '/usr/lib/one/ruby'
    GEMS_LOCATION     = '/usr/share/one/gems'
    LOG_LOCATION      = '/var/log/one'
    VAR_LOCATION      = '/var/lib/one'
    ETC_LOCATION      = '/etc/one'
    LIB_LOCATION      = '/usr/lib/one'
else
    RUBY_LIB_LOCATION = ONE_LOCATION + '/lib/ruby'
    GEMS_LOCATION     = ONE_LOCATION + '/share/gems'
    VAR_LOCATION      = ONE_LOCATION + '/var'
    LOG_LOCATION      = ONE_LOCATION + '/var'
    ETC_LOCATION      = ONE_LOCATION + '/etc'
    LIB_LOCATION      = ONE_LOCATION + '/lib'
end

require 'load_opennebula_paths'

ONEFORM_AUTH       = VAR_LOCATION + '/.one/oneflow_auth'
ONEFORM_LOG        = LOG_LOCATION + '/oneform.log'
CONFIGURATION_FILE = ETC_LOCATION + '/oneform-server.conf'

$LOAD_PATH << RUBY_LIB_LOCATION
$LOAD_PATH << RUBY_LIB_LOCATION + '/cloud'

# %%RUBYGEMS_SETUP_END%%

# -------------------------------------------------------------------------- #
# Required libraries
# -------------------------------------------------------------------------- #

# Ruby standard gems
require 'base64'
require 'fileutils'
require 'json'
require 'open3'
require 'pathname'
require 'singleton'
require 'syslog/logger'
require 'timeout'
require 'tmpdir'
require 'yaml'

# OpenNebula gems
require 'opennebula'
require 'CloudAuth'

# Third-party gems
require 'dry-validation'
require 'hcl_parser'
require 'lockfile'
require 'logger'
require 'parse-cron'
require 'puma'
require 'rack'
require 'rackup'
require 'sinatra'
require 'sinatra/namespace'
require 'rexml'

# -------------------------------------------------------------------------- #
# Server configuration
# -------------------------------------------------------------------------- #

require_relative 'config_loader'

begin
    ConfigLoader.instance.load_config(CONFIGURATION_FILE)
rescue StandardError => e
    STDERR.puts "Error parsing config file #{CONFIGURATION_FILE}: #{e.message}"
    exit 1
end

# -------------------------------------------------------------------------- #
# Required classes
# -------------------------------------------------------------------------- #

include OpenNebula

APP_ROOT = File.expand_path('..', __dir__)

# Config
require_relative File.join(APP_ROOT, 'config', 'log_config')

# Tools
require_relative File.join(APP_ROOT, 'lib', 'tools', 'command')
require_relative File.join(APP_ROOT, 'lib', 'tools', 'terraform')
require_relative File.join(APP_ROOT, 'lib', 'tools', 'ansible')
require_relative File.join(APP_ROOT, 'lib', 'tools', 'log')

# Helpers
require_relative File.join(APP_ROOT, 'lib', 'helpers', 'response_helper')
require_relative File.join(APP_ROOT, 'lib', 'helpers', 'one_helper')

# Models
require_relative File.join(APP_ROOT, 'app', 'models', 'schema')
require_relative File.join(APP_ROOT, 'app', 'models', 'driver')
require_relative File.join(APP_ROOT, 'app', 'models', 'provision')
require_relative File.join(APP_ROOT, 'app', 'models', 'provider')

# Controllers and Services
APP_PATHS = [
    File.join(APP_ROOT, 'app', 'services'),
    File.join(APP_ROOT, 'app', 'controllers')
]

APP_PATHS.each do |path|
    Dir.glob(File.join(path, '*.rb')).sort.each {|file| require file }
end

# Main controller
require_relative File.join(APP_ROOT, 'app', 'app_routes')
