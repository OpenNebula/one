#!/bin/ruby
require 'rubygems'
require 'json'
js = File.read(ARGV[0])
parsed = JSON.parse(js)
puts parsed
