#!/usr/bin/ruby

# require_relative '../lib/lxd_driver'
require_relative '../lib/container'
require_relative '../lib/client'

client = LXDClient.new

# get containers
container = client.get('containers/ruby')

puts container.monitor

# data = {
#     :action => 'start', # State change action (stop, start, restart, freeze or unfreeze)
#     :force => false, # Force the state change (currently only valid for stop and restart where it means killing the container)
#     :timeout => nil, # A timeout after which the state change is considered as failed
#     :stateful => nil # Whether to store or restore runtime state before stopping or startiong (only valid for stop and start, defaults to false)
# }
# puts client.put('containers/ruby/state', data)

# container state
# puts client.put('containers/ruby/state', { :action => 'start' })
