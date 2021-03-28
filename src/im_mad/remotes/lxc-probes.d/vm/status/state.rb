#!/usr/bin/ruby

require_relative '../../../lib/probe_db'
require_relative '../../../lib/lxc'

xml_txt = STDIN.read
host    = ARGV[-1]
host_id = ARGV[-2]

begin
    config = REXML::Document.new(xml_txt).root
    sync   = config.elements['PROBES_PERIOD/SYNC_STATE_VM'].text.to_i
rescue StandardError
    sync   = 180
end

begin
    vmdb = VirtualMachineDB.new('lxc',
                                host,
                                host_id,
                                :missing_state => 'POWEROFF',
                                :sync => sync)
    vmdb.purge

    puts vmdb.to_status
rescue StandardError => e
    puts e
end
