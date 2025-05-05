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
require_relative '../../../lib/probe_db'

xml_txt = STDIN.read
host    = ARGV[-1]
host_id = ARGV[-2]

begin
    config = REXML::Document.new(xml_txt).root
    sync   = config.elements['PROBES_PERIOD/SYNC_STATE_VM'].text.to_i
rescue StandardError
    sync   = 180
end

KVM.load_conf

begin
    vmdb = VirtualMachineDB.new('kvm',
                                host,
                                host_id,
                                :missing_state => 'POWEROFF',
                                :sync => sync)
    vmdb.purge

    puts vmdb.to_status
rescue StandardError => e
    STDERR.puts e.message
    exit(-1)
end
