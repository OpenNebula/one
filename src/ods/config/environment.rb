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

# -------------------------------------------------------------------------- #
# OpenNebula paths
# -------------------------------------------------------------------------- #
# %%RUBYGEMS_SETUP_START%%

ONE_LOCATION = ENV['ONE_LOCATION']
ODS_NAME     = ENV['ODS_NAME'] || (defined?(APP_NAME) ? APP_NAME : nil)

abort 'APP_NAME is not defined' unless ODS_NAME

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

SERVER_AUTH = VAR_LOCATION + "/.one/#{ODS_NAME.downcase}_auth"
CONF_FILE   = ETC_LOCATION + "/#{ODS_NAME.downcase}-server.conf"
SCHEMA_FILE = LIB_LOCATION + "/#{ODS_NAME.downcase}/#{ODS_NAME.downcase}-server.yaml"

$LOAD_PATH << RUBY_LIB_LOCATION
$LOAD_PATH << RUBY_LIB_LOCATION + '/cloud'

# %%RUBYGEMS_SETUP_END%%

# -------------------------------------------------------------------------- #
# Required libraries
# -------------------------------------------------------------------------- #

# Ruby standard gems
require 'base64'
require 'fileutils'
require 'ipaddr'
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
require 'lockfile'
require 'logger'
require 'parse-cron'
require 'puma'
require 'rack'
require 'rackup'
require 'rexml'

# -------------------------------------------------------------------------- #
# Required classes
# -------------------------------------------------------------------------- #

include OpenNebula

ODS_ROOT = File.expand_path('..', __dir__)

# Configuration
require_relative File.join(ODS_ROOT, 'config', 'validator')

# Helpers
require_relative File.join(ODS_ROOT, 'lib', 'helpers', 'request_helper')
require_relative File.join(ODS_ROOT, 'lib', 'helpers', 'response_helper')
require_relative File.join(ODS_ROOT, 'lib', 'helpers', 'log_helper')
require_relative File.join(ODS_ROOT, 'lib', 'hash')
require_relative File.join(ODS_ROOT, 'lib', 'log')
require_relative File.join(ODS_ROOT, 'lib', 'state_machine')
require_relative File.join(ODS_ROOT, 'lib', 'event_manager')
require_relative File.join(ODS_ROOT, 'lib', 'thread_manager')
require_relative File.join(ODS_ROOT, 'lib', 'subscriber')

# Models
require_relative File.join(ODS_ROOT, 'app', 'models', 'schema')
require_relative File.join(ODS_ROOT, 'app', 'models', 'pool')
require_relative File.join(ODS_ROOT, 'app', 'models', 'document')

# Controllers
ODS_PATHS = [File.join(ODS_ROOT, 'app', 'controllers')]
ODS_PATHS.each do |path|
    Dir.glob(File.join(path, '*.rb')).sort.each {|file| require file }
end

# Main controller
require_relative File.join(ODS_ROOT, 'app', 'routes')

# Set aliases to access ODS modules and classes
ODS = OpenNebula::DocumentServer
Log = ODS::Log

# -------------------------------------------------------------------------- #
# Server configuration
# -------------------------------------------------------------------------- #

begin
    conf_file = YAML.load_file(CONF_FILE)

    if File.exist?(SCHEMA_FILE)
        SCHEMA_CONF = YAML.load_file(SCHEMA_FILE)
        SERVER_CONF = ODS::Validator.validate(conf_file, SCHEMA_CONF)
    else
        SERVER_CONF = conf_file
    end
rescue Errno::ENOENT
    abort "Configuration file not found: #{CONF_FILE}"
rescue Psych::SyntaxError => e
    abort "Configuration file contains invalid YAML: #{CONF_FILE}\n#{e.message}"
rescue OpenNebula::DocumentServer::Validator::ValidationError => e
    abort "Configuration validation error: #{e.message}"
end

ENV['RACK_ENV'] ||= SERVER_CONF[:server][:environment]

require 'sinatra'
require 'sinatra/namespace'
