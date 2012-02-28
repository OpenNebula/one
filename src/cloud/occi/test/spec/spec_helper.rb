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

require 'rexml/document'

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



def get_fixture(path)
	File.read(FIXTURES_PATH + path).strip
end


def compare_xml(a, b)
	a = REXML::Document.new(a.to_s)
	b = REXML::Document.new(b.to_s)

	normalized = Class.new(REXML::Formatters::Pretty) do
	  	def write_text(node, output)
	    	super(node.to_s.strip, output)
	  	end
	end

	normalized.new(indentation=0,ie_hack=false).write(node=a, a_normalized='')
	normalized.new(indentation=0,ie_hack=false).write(node=b, b_normalized='')

	a_normalized.should == b_normalized
end


OCCI_NETWORK = %q{
    <NETWORK>
        <% if hash[:name] %>
        <NAME><%= hash[:name] %></NAME>
        <% end %>

        <% if hash[:description] %>
        <DESCRIPTION><%= hash[:description] %></DESCRIPTION>
        <% end %>

        <% if hash[:address] %>
        <ADDRESS><%= hash[:address] %></ADDRESS>
        <% end %>

        <% if hash[:size] %>
        <SIZE><%= hash[:size] %></SIZE>
        <% end %>

        <% if hash[:public] %>
        <PUBLIC><%= hash[:public] %></PUBLIC>
        <% end %>
    </NETWORK>
}

def network_template(hash)
    ERB.new(OCCI_NETWORK).result(binding)
end

OCCI_IMAGE = %q{
    <STORAGE>
        <% if hash[:name] %>
        <NAME><%= hash[:name] %></NAME>
        <% end %>

        <% if hash[:type] %>
        <TYPE><%= hash[:type] %></TYPE>
        <% end %>

        <% if hash[:description] %>
        <DESCRIPTION><%= hash[:description] %></DESCRIPTION>
        <% end %>

        <% if hash[:size] %>
        <SIZE><%= hash[:size] %></SIZE>
        <% end %>

        <% if hash[:fstype] %>
        <FSTYPE><%= hash[:fstype] %></FSTYPE>
        <% end %>

        <% if hash[:public] %>
        <PUBLIC><%= hash[:public] %></PUBLIC>
        <% end %>

        <% if hash[:persistent] %>
        <PERSISTENT><%= hash[:persistent] %></PERSISTENT>
        <% end %>
    </STORAGE>
}

def storage_template(hash)
    ERB.new(OCCI_IMAGE).result(binding)
end

OCCI_VM = %q{
    <COMPUTE>
        <% if hash[:name] %>
        <NAME><%= hash[:name] %></NAME>
        <% end %>

    	<% if hash[:instance_type] %>
    	<INSTANCE_TYPE href="http://localhost:4567/instance_type/<%= hash[:instance_type] %>"/>
    	<% end %>

        <% if hash[:disk] %>
       	<% hash[:disk].each { |disk| %>
        <DISK>
        	<% if disk[:storage] %>
        	<STORAGE href="http://localhost:4567/storage/<%= disk[:storage] %>"/>
        	<% end %>
        </DISK>
        <% } %>
        <% end %>

        <% if hash[:nic] %>
       	<% hash[:nic].each { |nic| %>
        <NIC>
        	<% if nic[:network] %>
        	<NETWORK href="http://localhost:4567/network/<%= nic[:network] %>"/>
        	<% end %>
        	<% if nic[:ip] %>
        	<IP><%= nic[:ip] %></IP>
        	<% end %>
        </NIC>
        <% } %>
        <% end %>

        <% if hash[:context] %>
        <CONTEXT>
        <% hash[:context].each { |key, value| %>
        	<<%= key.to_s.upcase %>><%= value %></<%= key.to_s.upcase %>>
        <% } %>
        </CONTEXT>
        <% end %>
    </COMPUTE>
}

OCCI_VM_ACTION = %q{
    <COMPUTE>
        <% if hash[:id] %>
        <ID><%= hash[:id] %></ID>
        <% end %>
        <% if hash[:state] %>
        <STATE><%= hash[:state] %></STATE>
        <% end %>
    </COMPUTE>
}

def compute_template(hash)
    ERB.new(OCCI_VM).result(binding)
end

def compute_action(hash)
    ERB.new(OCCI_VM_ACTION).result(binding)
end
