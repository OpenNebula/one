#!/usr/bin/ruby

require_relative '../../../lib/kvm'

KVM.load_conf

puts DomainList.info
