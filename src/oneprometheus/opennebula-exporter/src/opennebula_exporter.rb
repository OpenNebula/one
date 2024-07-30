#!/usr/bin/ruby
# -------------------------------------------------------------------------- #
# Copyright 2002-2023, OpenNebula Project, OpenNebula Systems                #
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

if !ONE_LOCATION
    LOG_LOCATION      = '/var/log/one'
    VAR_LOCATION      = '/var/lib/one'
    ETC_LOCATION      = '/etc/one'
    SHARE_LOCATION    = '/usr/share/one'
    RUBY_LIB_LOCATION = '/usr/lib/one/ruby'
    GEMS_LOCATION     = '/usr/share/one/gems'
else
    VAR_LOCATION      = ONE_LOCATION + '/var'
    LOG_LOCATION      = ONE_LOCATION + '/var'
    ETC_LOCATION      = ONE_LOCATION + '/etc'
    SHARE_LOCATION    = ONE_LOCATION + '/share'
    RUBY_LIB_LOCATION = ONE_LOCATION + '/lib/ruby'
    GEMS_LOCATION     = ONE_LOCATION + '/share/gems'
end


if File.directory?(GEMS_LOCATION)
    $LOAD_PATH.reject! {|l| l =~ /vendor_ruby/ }
    require 'rubygems'
    Gem.use_paths(File.realpath(GEMS_LOCATION))

    # for some platforms, we redistribute newer base Ruby gems which
    # should be loaded instead of default ones in the distributions
    %w[openssl json].each do |name|
        begin
            gem name
        rescue LoadError
            # ignore
        end
    end
end

$LOAD_PATH << RUBY_LIB_LOCATION
$:.unshift File.dirname(__FILE__)


##############################################################################
# Required libraries
##############################################################################
require 'rubygems'
require 'sinatra'

require 'prometheus/middleware/exporter'
require 'prometheus/middleware/collector'
require 'opennebula_collector'


use Rack::Deflater
use Prometheus::Middleware::OpenNebulaCollector
use Prometheus::Middleware::Exporter


get '/' do
    body = '<html>'\
           '<head><title>OpenNebula Exporter</title></head>'\
           '<body>'\
           '<h1>OpenNebula Exporter</h1>'\
           '<p><a href="/metrics">Metrics</a></p>'\
           '</body>'\
           '</html>'
    [200, {'Content-Type' => 'text/html'}, body]
end


# Default Options
set :port, 9925
set :bind, '0.0.0.0'

# Run the Sinatra application
set :run, false
Sinatra::Application.run!
