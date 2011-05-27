#!/usr/bin/env ruby

MONITOR_INTERVAL= ARGV[1]? ARGV[1].to_i : 10 #secs

$: << File.dirname(__FILE__)

require 'HostMonitor.rb'
require 'VMMonitor.rb'

FILE= ARGV[0]? ARGV[0]: "#{ENV['ONE_LOCATION']}/logs/"

hostm = HostMonitor.new(FILE+"host")
vmm = VMMonitor.new(FILE+"vm")

while true do
    hostm.snapshot
    vmm.snapshot
    sleep MONITOR_INTERVAL
end

