#!/usr/bin/ruby

require_relative '../../../lib/kvm'
require_relative '../../../lib/probe_db'

xml_txt = STDIN.read

begin
    config = REXML::Document.new(xml_txt).root
    period = config.elements['PROBES_PERIOD/STATE_VM'].text.to_s
rescue StandardError
    period = 0
end

KVM.load_conf

begin
    vmdb = VirtualMachineDB.new('kvm',
                                :missing_state => 'POWEROFF',
                                :period => period)
    vmdb.purge

    puts vmdb.to_status
rescue StandardError => e
    puts e
end
