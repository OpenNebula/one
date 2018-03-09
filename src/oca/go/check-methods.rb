#!/usr/bin/env ruby

require 'open-uri'
require 'nokogiri'

URL = 'http://docs.opennebula.org/stable/integration/system_interfaces/api.html'.freeze

doc = Nokogiri::HTML(open(URL))

h3_texts = doc.css('h3').collect { |e| e.xpath('text()').text }
xmlrpc_methods = h3_texts.grep(/^one\./)

c = 0
xmlrpc_methods.each do |m|
  matches = `grep -l #{m} *.go`
  if matches.empty?
    puts m
  else
    c += 1
  end
end

puts

percent = 100 * c.to_f / xmlrpc_methods.length
printf "%.2f%%\n", percent

exit 1 if xmlrpc_methods.length != c

exit 0
