#!/usr/bin/ruby

require 'rexml/document'
require 'socket'
require_relative '../../../lib/probe_db'
require_relative '../../../lib/lxd'

#  -----------------------------------------------------------
#  This module implements the functions needed by probe_db.rb
#  -----------------------------------------------------------
module DomainList

    #   Returns a vm hash with the containers running in LXD
    #   @param host [String] name of the host (not used here)
    #   @param host_id [Integer] ID of the host (not used here)
    #
    #   @return [Hash] with KVM Domain classes indexed by their name
    def self.state_info(*)
        containers = Container.get_all(LXD::CLIENT)
        return unless containers

        vms = {}

        containers.each do |container|
            vm   = {}
            name = container.name

            vm[:ignore] = true if container.config['user.one_status'] == '0'

            vm[:name]  = name
            vm[:uuid]  = "#{name}-#{Socket.gethostname}"
            vm[:state] = Domain.one_status(container)

            vm[:deploy_id] = name

            m = vm[:name].match(/^one-(\d*)$/)

            if m
                vm[:id] = m[1]
            else
                vm[:id] = -1
            end

            vms[name] = vm
        end

        vms
    end

end

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
    vmdb = VirtualMachineDB.new('lxd',
                                host,
                                host_id,
                                :missing_state => 'POWEROFF',
                                :sync => sync)
    vmdb.purge

    puts vmdb.to_status
rescue StandardError => e
    puts e
end
