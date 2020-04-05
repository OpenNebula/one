#!/usr/bin/ruby

require 'rexml/document'
require 'socket'
require_relative '../../../lib/probe_db'
require_relative '../../../lib/lxd'

#  -----------------------------------------------------------
#  This module implements the functions needed by probe_db.rb
#  -----------------------------------------------------------
module DomainList

    # LXD to OpenNebula state mapping
    STATE_MAP = {
        'RUNNING' => 'RUNNING',
        'FROZEN'  => 'PAUSED',
        'STOPPED' => 'POWEROFF',
        'FAILURE' => 'FAILURE',
        'POWEROFF'=> 'POWEROFF'
    }

    # Returns a vm hash with the containers running in LXD
    #   @param host [String] name of the host (not used here)
    #   @param host_id [Integer] ID of the host (not used here)
    #
    #   @return [Hash] with KVM Domain classes indexed by their name
    def self.state_info(host, host_id)
        containers = Container.get_all(LXD::CLIENT)
        return unless containers

        vms = {}

        containers.each do |container|
            vm   = {}
            name = container.name

            next if container.config['user.one_status'] == '0'

            vm[:name]  = name
            vm[:uuid]  = "#{name}-#{Socket.gethostname}"
            vm[:state] = one_status(container)

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

    def self.one_status(container)
        state = STATE_MAP[container.status.upcase]
        state ||= 'UNKNOWN'

        state
    rescue StandardError
        'UNKNOWN'
    end

end

xml_txt = STDIN.read
host    = ARGV[-1]
host_id = ARGV[-2]

begin
    config = REXML::Document.new(xml_txt).root
    sync   = config.elements['PROBES_PERIOD/SYNC_STATE_VM'].text.to_s
rescue StandardError
    sync   = 180
end

begin
    vmdb = VirtualMachineDB.new('lxd',
                                :missing_state => 'POWEROFF',
                                :sync => sync)
    vmdb.purge

    puts vmdb.to_status(host, host_id)
rescue StandardError => e
    puts e
end
