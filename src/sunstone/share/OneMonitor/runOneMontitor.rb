#!/usr/bin/env ruby

MONITOR_INTERVAL= 10 #secs

$: << File.dirname(__FILE__)

require 'HostMonitor.rb'
require 'VMMonitor.rb'

FILE="/srv/cloud/one-dummy/logs/"

hostm = HostMonitor.new(FILE+"host")
vmm = VMMonitor.new(FILE+"vm")

while true do
    hostm.snapshot
    vmm.snapshot
    sleep MONITOR_INTERVAL
end

