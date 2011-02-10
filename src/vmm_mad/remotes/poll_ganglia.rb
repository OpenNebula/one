#!/usr/bin/env ruby

# Adds current directory to the library search path (make the script
# compatible with ruby 1.9.2)
$: << '.'

ONE_LOCATION=ENV["ONE_LOCATION"]

if !ONE_LOCATION
    RUBY_LIB_LOCATION="/usr/lib/one/ruby"
else
    RUBY_LIB_LOCATION=ONE_LOCATION+"/lib/ruby"
end

$: << RUBY_LIB_LOCATION

require 'socket'
require 'pp'
require 'rexml/document'
require 'Ganglia'

#############################
## CONFIGURATION GOES HERE ##
#############################

# host and port where to get monitoring information
GANGLIA_HOST='localhost'
GANGLIA_PORT=8649

# If this variable is set the the information will be read from that file
# otherwise it will get information from the ganglia endpoint
# defined previously
#GANGLIA_FILE='data.xml'


host=ARGV[0]
domain=ARGV[1]

# Gets monitoring data from ganglia or file
begin
    if defined?(GANGLIA_FILE)
        ganglia=GangliaHost.new_from_file(host, GANGLIA_FILE)
    else
        ganglia=GangliaHost.new_from_ganglia(host, GANGLIA_HOST, GANGLIA_PORT)
    end
rescue
    STDERR.puts "Error reading ganglia data"
    exit -1
end

dom_info=ganglia.get_vms_information

if dom_info[domain]
    info=dom_info[domain].map do |key, value|
        "#{key.to_s.upcase}=\"#{value}\""
    end.join(' ')
    
    puts info
end


