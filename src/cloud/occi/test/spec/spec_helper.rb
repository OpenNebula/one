# -------------------------------------------------------------------------- #
# Copyright 2002-2012, OpenNebula Project Leads (OpenNebula.org)             #
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

FIXTURES_PATH  = File.join(File.dirname(__FILE__),'../fixtures')
TEMPLATES_PATH = File.join(File.dirname(__FILE__),'../templates')

$: << File.join(File.dirname(__FILE__), '..', '..', 'lib')

# Load the testing libraries
require 'rubygems'
require 'rspec'
require 'rack/test'

# Load the Sinatra app
require 'occi-server'

# Make Rack::Test available to all spec contexts
RSpec.configure do |conf|
    conf.include Rack::Test::Methods
end

# Set the Sinatra environment
set :environment, :test

# Add an app method for RSpec
def app
    Sinatra::Application
end
