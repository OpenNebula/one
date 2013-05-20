#!/usr/bin/env ruby
require 'tempfile'

if ENV['RBVMOMI_COVERAGE'] == '1'
  require 'simplecov'
  SimpleCov.start
end

require 'rbvmomi'
require 'rbvmomi/deserialization'
require 'benchmark'
require 'libxml'

NS_XSI = 'http://www.w3.org/2001/XMLSchema-instance'

VIM = RbVmomi::VIM
$conn = VIM.new(:ns => 'urn:vim25', :rev => '4.0')
raw = File.read(ARGV[0])

def diff a, b
  a_io = Tempfile.new 'rbvmomi-diff-a'
  b_io = Tempfile.new 'rbvmomi-diff-b'
  PP.pp a, a_io
  PP.pp b, b_io
  a_io.close
  b_io.close
  system("diff -u #{a_io.path} #{b_io.path}")
  a_io.unlink
  b_io.unlink
end

begin
  deserializer = RbVmomi::OldDeserializer.new($conn)
  end_time = Time.now + 1
  n = 0
  while n == 0 or end_time > Time.now
    deserializer.deserialize Nokogiri::XML(raw).root
    n += 1
  end
  N = n*10
end

puts "iterations: #{N}"

parsed_nokogiri = Nokogiri::XML(raw)
parsed_libxml = LibXML::XML::Parser.string(raw).parse

if true
  nokogiri_xml = parsed_nokogiri.root
  libxml_xml = parsed_libxml.root

  old_nokogiri_result = RbVmomi::OldDeserializer.new($conn).deserialize nokogiri_xml
  new_nokogiri_result = RbVmomi::NewDeserializer.new($conn).deserialize nokogiri_xml
  new_libxml_result = RbVmomi::NewDeserializer.new($conn).deserialize libxml_xml

  if new_nokogiri_result != old_nokogiri_result
    puts "new_nokogiri_result doesnt match old_nokogiri_result"
    puts "old_nokogiri_result:"
    pp old_nokogiri_result
    puts "new_nokogiri_result:"
    pp new_nokogiri_result
    puts "diff:"
    diff old_nokogiri_result, new_nokogiri_result
    exit 1
  end

  if new_libxml_result != old_nokogiri_result
    puts "new_libxml_result doesnt match old_nokogiri_result"
    puts "old_nokogiri_result:"
    pp old_nokogiri_result
    puts "new_libxml_result:"
    pp new_libxml_result
    puts "diff:"
    diff old_nokogiri_result, new_libxml_result
    exit 1
  end

  puts "all results match"
end

Benchmark.bmbm do|b|
  GC.start
  b.report("nokogiri parsing") do
    N.times { Nokogiri::XML(raw) }
  end
  
  GC.start
  b.report("libxml parsing") do
    N.times do
      LibXML::XML::Parser.string(raw).parse
    end
  end
  
  GC.start
  b.report("old deserialization (nokogiri)") do
    deserializer = RbVmomi::OldDeserializer.new($conn)
    N.times do
      deserializer.deserialize Nokogiri::XML(raw).root
    end
  end

  GC.start
  b.report("new deserialization (nokogiri)") do
    deserializer = RbVmomi::NewDeserializer.new($conn)
    N.times do
      deserializer.deserialize Nokogiri::XML(raw).root
    end
  end

  GC.start
  b.report("new deserialization (libxml)") do
    deserializer = RbVmomi::NewDeserializer.new($conn)
    N.times do
      deserializer.deserialize LibXML::XML::Parser.string(raw).parse.root
    end
  end
end
