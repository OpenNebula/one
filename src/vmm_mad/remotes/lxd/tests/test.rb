#!/usr/bin/ruby

require_relative '../lib/client'

client = Client.new

# get container properties
puts client::LXDRequests.get('containers/ruby')

# container state
# puts client.put('containers/ruby/state', action: 'start')
