#!/usr/bin/env ruby

require 'json'
require 'pp'
require 'yaml'
require 'open-uri'

$stderr.reopen("/tmp/ec2_err", "w")
STDERR.puts "Very slow script... hold on tight for a couple of minutes..."

content = open('https://pricing.us-east-1.amazonaws.com/offers/v1.0/aws/AmazonEC2/current/index.json').read
content = JSON.parse(content)

types = {}
content["products"].each do |k,v|
    instanceType = v["attributes"]["instanceType"]

    next unless v["attributes"]["servicecode"] == "AmazonEC2"

    memory       = v["attributes"]["memory"].split[0].to_f rescue nil
    cpu          = v["attributes"]["vcpu"].to_i

    if types[instanceType].nil? && instanceType && memory && cpu
        types[instanceType] = {"cpu" => cpu, "memory" => memory} if instanceType.include?(".")
    end
end

puts "proxy_uri:"
puts "state_wait_timeout_seconds: 300"
puts (({"instance_types" => types.sort.to_h}).to_yaml(:indentation=>4)).gsub("---\n", '')
