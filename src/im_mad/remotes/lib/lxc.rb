#!/usr/bin/env ruby

# -------------------------------------------------------------------------- #
# Copyright 2002-2024, OpenNebula Project, OpenNebula Systems                #
#                                                                            #
# Licensed under the Apache License, Version 2.0 (the "License"); you may    #
# not use this file except in compliance with the License. You may obtain    #
# a copy of the License at                                                   #
#                                                                            #
# http://www.apache.org/licenses/LICENSE-2.0                                 #
#                                                                            #
# Unless required by applicable law or agreed to in writing, software        #
# distributed under the License is distributed on an "AS IS" BASIS,          #
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.   #
# See the License for the specific language governing permissions and        #
# limitations under the License.                                             #
#--------------------------------------------------------------------------- #

$LOAD_PATH.unshift "#{File.dirname(__FILE__)}/../../vmm/lxc/"

require 'json'
require 'base64'
require 'client'

require_relative 'process_list'
require_relative 'domain'

#-------------------------------------------------------------------------------
#  Extends ProcessList module defined at procepss_list.rb
#-------------------------------------------------------------------------------
module ProcessList

    #  Number of seconds to average process usage
    AVERAGE_SECS = 1

    def self.retrieve_names
        LXCClient.new.list
    end

    # list of process indexed by uuid, each entry:
    #    :pid
    #    :memory
    #    :cpu
    def self.process_list
        procs = {}
        client = LXCClient.new

        client.list.each do |container|
            # sudo lxc-info -SH container
            info = client.info(container, { :H => nil })

            next if info['State'].downcase == 'stopped'

            procs[container] = {
                :pid => info['PID'],
                :memory => info['Memory use'].to_i / 1024,
                :cpu => usage_cpu(container)
            }
        end

        procs
    end

    def self.usage_cpu(container)
        multiplier = `grep -c processor /proc/cpuinfo`.to_i * 100

        cpuj0 = Jiffies.cpu
        container_cpuj0 = Jiffies.process(container)

        sleep 1 # measure diff

        cpuj1 = Jiffies.cpu - cpuj0
        container_cpuj1 = (Jiffies.process(container) - container_cpuj0)

        ((container_cpuj1 / cpuj1) * multiplier).round(2)
    end

    # --------------------------------------------------------------------------
    # Compute process and total system jiffies
    # --------------------------------------------------------------------------
    module Jiffies

        def self.process(container)
            jiffies = 0
            path = '/sys/fs/cgroup/cpu,cpuacct/lxc.payload.' \
                   "#{container}/cpuacct.stat"

            begin
                stat = File.read(path)
            rescue StandardError
                return 0
            end

            stat.lines.each {|line| jiffies += line.split(' ')[1].to_i }

            jiffies.to_f
        end

        def self.cpu
            begin
                stat = File.read('/proc/stat')
            rescue StandardError
                return 0
            end

            jiffies = 0

            # skip cpu string and guest jiffies
            stat.lines.first.split(' ')[1..-3].each do |num|
                jiffies += num.to_i
            end

            jiffies
        end

    end

end

#-------------------------------------------------------------------------------
#  This class represents an LXC domain, information includes:
#    @vm[:name]
#    @vm[:id] from one-<id>
#    @vm[:uuid] (deployment id)
#    @vm[:deploy_id] (deployment id)
#    @vm[:lxc_state] LXC state
#    @vm[:state] OpenNebula state
#    @vm[:netrx]
#    @vm[:nettx]
#    @vm[:diskrdbytes]
#    @vm[:diskwrbytes]
#    @vm[:diskrdiops]
#    @vm[:diskwriops]
#
#  This class uses the LXCClient and ProcessList interface
#-------------------------------------------------------------------------------
class Domain < BaseDomain

    # Gets the information of the domain, fills the @vm hash using ProcessList
    # and ps command
    def info
        client = LXCClient.new

        # Flush the microVM metrics
        hash = client.info(@name, { :H => nil })

        return -1 if hash.nil?

        @vm[:name] = @name
        @vm[:uuid] = @name

        @vm[:deploy_id] = @name

        m = @vm[:name].match(/^one-(\d*)$/)

        if m
            @vm[:id] = m[1]
        else
            @vm[:id] = -1
        end

        @vm[:lxc_state] = hash['State']

        state = STATE_MAP[hash['State']] || 'UNKNOWN'

        @vm[:state] = state

        # Ignore VM if it's in transient state to avoid monitoring interference
        @vm[:ignore] = true if @vm[:state] == STATE_MAP['STOPPED']

        io_stats(hash)
    end

    private

    # --------------------------------------------------------------------------
    # LXC states for the guest are
    # * 'STOPPED'
    # * 'STARTING'
    # * 'RUNNING'
    # * 'ABORTING'
    # * 'STOPPING'
    # https://linuxcontainers.org/lxc/manpages/man7/lxc.7.html
    # --------------------------------------------------------------------------
    STATE_MAP = {
        'STOPPED'     => 'POWEROFF', # Transitory state to RUNNING or POWEROFF
        'STARTING'    => 'RUNNING',
        'RUNNING'     => 'RUNNING',
        'ABORTING'    => 'FAILURE',
        'STOPPING'    => 'RUNNING'   # Transitory state to POWEROFF
    }

    # Get the I/O stats of the domain as provided by Libvirt command domstats
    # The metrics are aggregated for all DIKS and NIC
    def io_stats(domain_info)
        @vm[:netrx] = 0
        @vm[:nettx] = 0

        return if @vm[:state] != 'RUNNING'

        # Add RX bytes of every NIC
        Array(domain_info['RX bytes']).each do |i|
            @vm[:netrx] += i.to_i
        end

        Array(domain_info['TX bytes']).each do |i|
            @vm[:nettx] += i.to_i
        end
    end

end

#-------------------------------------------------------------------------------
# This module provides a basic interface to get the list of domains in
# the system and convert the information to be added to monitor or system
# messages.
#
# It also gathers the state information of the domains for the state probe
#-------------------------------------------------------------------------------
module DomainList

    ############################################################################
    #  Module Interface
    ############################################################################
    def self.info
        domains = LXCDomains.new

        domains.info
        domains.to_monitor
    end

    def self.state_info(_host, _host_id)
        domains = LXCDomains.new

        domains.state_info
    end

    ############################################################################
    # This is the implementation class for the module logic
    ############################################################################
    class LXCDomains < BaseDomains

        include ProcessList

    end

end
