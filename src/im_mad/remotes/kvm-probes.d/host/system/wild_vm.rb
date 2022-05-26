#!/usr/bin/ruby

require_relative '../../../lib/kvm'

KVM.load_conf

begin
    puts DomainList.wilds_info
rescue StandardError => e
    STDERR.puts e.message
    exit(-1)
end
