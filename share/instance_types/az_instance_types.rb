#!/usr/bin/env ruby

require 'open-uri'
require 'nokogiri'
require 'yaml'

content = open('https://azure.microsoft.com/en-us/documentation/articles/cloud-services-sizes-specs/').read
doc = Nokogiri::HTML(content)

types = {}

doc.root.css("table tbody tr").each do |tr|
    instanceType = tr.at_css("td[1]").text
    cpu          = tr.at_css("td[2]").text.to_i
    memory       = tr.at_css("td[3]").text.split[0].to_f rescue nil

    types[instanceType] = {"cpu" => cpu, "memory" => memory}
end

puts ({"instance_types" => types}).to_yaml(:indentation=>4)
