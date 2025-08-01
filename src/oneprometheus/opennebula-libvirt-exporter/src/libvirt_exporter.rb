#!/usr/bin/env ruby

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

ONE_LOCATION = ENV['ONE_LOCATION']

if ONE_LOCATION.nil?
    RUBY_LIB_LOCATION = '/usr/lib/one/ruby/'
    GEMS_LOCATION     = '/usr/share/one/gems/'
else
    RUBY_LIB_LOCATION = ONE_LOCATION + '/lib/ruby/'
    GEMS_LOCATION     = ONE_LOCATION + '/share/gems/'
end

# %%RUBYGEMS_SETUP_BEGIN%%
require 'load_opennebula_paths'
# %%RUBYGEMS_SETUP_END%%

$LOAD_PATH << RUBY_LIB_LOCATION

require 'sinatra'

require 'prometheus/middleware/exporter'
require 'prometheus/middleware/collector'

require_relative './libvirt_collector'

use Rack::Deflater
use LibvirtCollector
use Prometheus::Middleware::Exporter

get '/' do
    body = '<html>'\
           '<head><title>OpenNebula Libvirt Exporter</title></head>'\
           '<body>'\
           '<h1>OpenNebula Libvirt Exporter</h1>'\
           '<p><a href="/metrics">Metrics</a></p>'\
           '</body>'\
           '</html>'
    [200, { 'Content-Type' => 'text/html' }, body]
end

# Default Options
set :bind, '::'
set :port, 9926

# Run the Sinatra application
set :run, false
Sinatra::Application.run!
