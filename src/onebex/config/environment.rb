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

if !ONE_LOCATION
    RUBY_LIB_LOCATION ||= '/usr/lib/one/ruby'
    GEMS_LOCATION     ||= '/usr/share/one/gems'
    LOG_LOCATION      ||= '/var/log/one'
    VAR_LOCATION      ||= '/var/lib/one'
    ETC_LOCATION      ||= '/var/tmp/one/etc'
else
    RUBY_LIB_LOCATION ||= ONE_LOCATION + '/lib/ruby'
    GEMS_LOCATION     ||= ONE_LOCATION + '/share/gems'
    VAR_LOCATION      ||= ONE_LOCATION + '/var'
    LOG_LOCATION      ||= ONE_LOCATION + '/var'
    ETC_LOCATION      ||= ONE_LOCATION + '/etc'
end

ONEBEX_LOG         = LOG_LOCATION + '/onebex.log'
CONFIGURATION_FILE = ETC_LOCATION + '/onebex/onebex-server.conf'

# %%RUBYGEMS_SETUP_BEGIN%%
require 'load_opennebula_paths'
# %%RUBYGEMS_SETUP_END%%

$LOAD_PATH << RUBY_LIB_LOCATION

require 'rubygems'
require 'sinatra/base'
require 'yaml'
require 'json'
require 'logger'
require 'syslog/logger'
require 'puma'
require 'puma/launcher'

require 'securerandom'
require 'fileutils'
require 'open3'
require 'shellwords'
require 'timeout'

require_relative '../app/helpers'
require_relative '../app/routes'

require_relative '../exporters/registry'
require_relative '../exporters/nbd'
require_relative '../exporters/lvm'
