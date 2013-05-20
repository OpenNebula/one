#!/usr/bin/env ruby
# Find collisions between VMODL property names and Ruby methods
require 'rbvmomi'
VIM = RbVmomi::VIM

conn = VIM.new(:ns => 'urn:vim25', :rev => '4.0')

VIM.loader.typenames.each do |name|
  klass = VIM.loader.get name
  next unless klass.respond_to? :kind and [:managed, :data].member? klass.kind
  methods = klass.kind == :managed ?
    RbVmomi::BasicTypes::ObjectWithMethods.instance_methods : 
    RbVmomi::BasicTypes::ObjectWithProperties.instance_methods
  klass.props_desc.each do |x|
    name = x['name']
    puts "collision: #{klass}##{name}" if methods.member? name.to_sym
  end
end
