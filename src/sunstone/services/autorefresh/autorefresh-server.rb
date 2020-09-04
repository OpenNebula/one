# -------------------------------------------------------------------------- #
# Copyright 2002-2020, OpenNebula Project, OpenNebula Systems                #
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

require 'faye/websocket'
require 'eventmachine'
require 'json'
require 'active_support/core_ext/hash'
require 'ffi-rzmq'
require 'base64'

##############################################################################
# Global Variables
##############################################################################

@context    = ZMQ::Context.new(1)
@subscriber = @context.socket(ZMQ::SUB)
@clients = []
@zeromq_server = ""

KEEPALIVE_TIME = 15
CONFIGURATION_FILE = ETC_LOCATION + '/sunstone-server.conf'

##############################################################################
# Methods
##############################################################################

# Reads the configuration file and creates the zeromq server ip
def get_zeroMQ_server_ip()
  begin
      $conf = YAML.load_file(CONFIGURATION_FILE)
  rescue Exception => e
      STDERR.puts "Error parsing config file #{CONFIGURATION_FILE}: #{e.message}"
      exit 1
  end

  puts $conf[:zeromq_server]
  @zeromq_server = $conf[:zeromq_server]
end

# Configures the ZeroMQ connection to recieve `event` notifications
def configure_zeroMQ(event="VM")
  @subscriber.setsockopt(ZMQ::SUBSCRIBE, "EVENT #{event}")
  @subscriber.connect(@zeromq_server)
  puts "Subscribed to #{event}"
end

# Broadcast event to all clients
def broadcast_message(message)
  @clients.each do |client|
    client.send(message)
  end
end

# Gets the ZeroMQ incomming messages and broadcast 
# them to all clients connected
def get_zeroMQ_messages()
  key = ''
  content = ''
  
  @subscriber.recv_string(key)
  @subscriber.recv_string(content)

  mensaje = Hash.from_xml(Base64.decode64(content)).to_json

  puts "key: #{key}"

  if (key != '')
    broadcast_message(mensaje)
  end
end

##############################################################################
# Server
##############################################################################

get_zeroMQ_server_ip()
configure_zeroMQ()

# Create a thread to get ZeroMQ messages
Thread.new do
  loop do
    get_zeroMQ_messages()
  end 
end

Autorefresh = lambda do |env|
  if Faye::WebSocket.websocket?(env)
    ws = Faye::WebSocket.new(env, nil, {ping: KEEPALIVE_TIME })

    ws.on :open do |event|
      puts "New client registered: #{ws.object_id}"
      @clients << ws
    end

    ws.on :message do |event|
      puts "New message received: #{event.data}"
    end

    ws.on :close do |event|
      puts "Client #{ws.object_id} disconnected. Reason: #{event.reason}"
      @clients.delete(ws)
    end

    # Return async Rack response
    ws.rack_response
  else
    # Normal HTTP request
    [401, { 'Content-Type' => 'text/plain' }, ['Unauthorized']]
  end
end
