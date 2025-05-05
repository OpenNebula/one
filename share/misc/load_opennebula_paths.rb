#!/usr/bin/env ruby

ONE_LOCATION = ENV['ONE_LOCATION'] unless defined?(ONE_LOCATION)
if !ONE_LOCATION
    RUBY_LIB_LOCATION ||= '/usr/lib/one/ruby'
    GEMS_LOCATION     ||= '/usr/share/one/gems'
else
    RUBY_LIB_LOCATION ||= ONE_LOCATION + '/lib/ruby'
    GEMS_LOCATION     ||= ONE_LOCATION + '/share/gems'
end

require 'rubygems'
Gem.use_paths(File.realpath(GEMS_LOCATION))

$LOAD_PATH << RUBY_LIB_LOCATION
