#!/usr/bin/env ruby

require 'json'
require 'pp'
require 'yaml'
require 'open-uri'

puts "Very slow script... hold on tight for a couple of minutes..."
puts

content = open('https://pricing.us-east-1.amazonaws.com/offers/v1.0/aws/AmazonEC2/current/index.json').read
content = JSON.parse(content)

types = {}
content["products"].each do |k,v|
    instanceType = v["attributes"]["instanceType"]
    memory       = v["attributes"]["memory"].split[0] rescue nil
    cpu          = v["attributes"]["vcpu"]

    if types[instanceType].nil? && instanceType && memory && cpu
        types[instanceType] = {"cpu" => cpu, "memory" => memory}
    end
end

puts ({"instance_types" => types.sort.to_h}).to_yaml(:indentation=>4)
