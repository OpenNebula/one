#!/usr/bin/ruby
ONE_LOCATION = ENV['ONE_LOCATION'] unless defined?(ONE_LOCATION)

if !ONE_LOCATION
    LIB_LOCATION      ||= '/usr/lib/one'
    RUBY_LIB_LOCATION ||= '/usr/lib/one/ruby'
    GEMS_LOCATION     ||= '/usr/share/one/gems'
else
    LIB_LOCATION      ||= ONE_LOCATION + '/lib'
    RUBY_LIB_LOCATION ||= ONE_LOCATION + '/lib/ruby'
    GEMS_LOCATION     ||= ONE_LOCATION + '/share/gems'
end

# %%RUBYGEMS_SETUP_BEGIN%%
require 'load_opennebula_paths'
# %%RUBYGEMS_SETUP_END%%

$LOAD_PATH << RUBY_LIB_LOCATION

require_relative '../../../lib/kvm'
require_relative '../../../lib/kvm_qemu_ga'

host    = ARGV[-1]
host_id = ARGV[-2]

KVM.load_conf

begin
    puts VirshWrapper.qemu_ga_reaper(host, host_id)
rescue StandardError => e
    STDERR.puts e.message
    exit(-1)
end
