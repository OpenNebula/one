#!/usr/bin/ruby

require_relative '../../../lib/kvm'
require_relative '../../../lib/probe_db'

xml_txt = STDIN.read

begin
    config = REXML::Document.new(xml_txt).root
    sync   = config.elements['PROBES_PERIOD/SYNC_STATE_VM'].text.to_s
rescue StandardError
    sync   = 180
end

KVM.load_conf

begin
    vmdb = VirtualMachineDB.new('kvm',
                                :missing_state => 'POWEROFF',
                                :sync => sync)
    vmdb.purge

    puts vmdb.to_status
rescue StandardError => e
    puts e
end
