#!/usr/bin/ruby

require_relative 'opennebula_vm'

defaults = LXDConfiguration::DEFAULT_CONFIGURATION.to_yaml
lxdrc = "#{__dir__}/../../lxd/lxdrc"

File.open(lxdrc, 'w') {|f| f.write(YAML.dump(defaults)) }