#!/usr/bin/env ruby

# -------------------------------------------------------------------------- #
# Copyright 2002-2020, OpenNebula Project, OpenNebula Systems                #
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

require 'socket'
require 'base64'
require 'resolv'
require 'ipaddr'
require 'zlib'
require 'yaml'
require 'open3'
require 'openssl'

require 'rexml/document'

require_relative '../lib/probe_db'

#-------------------------------------------------------------------------------
#  This class represents a monitord client. It handles udp and tcp connections
#  and send update messages to monitord
#-------------------------------------------------------------------------------
class MonitorClient

    # Defined in src/monitor/include/MonitorDriverMessages.h
    MESSAGE_TYPES = %w[MONITOR_VM MONITOR_HOST SYSTEM_HOST BEACON_HOST STATE_VM
                       START_MONITOR STOP_MONITOR].freeze

    MESSAGE_STATUS = { true =>'SUCCESS', false => 'FAILURE' }.freeze

    MESSAGE_TYPES.each do |mt|
        define_method("#{mt}_udp".downcase.to_sym) do |rc, payload|
            msg = "#{mt} #{MESSAGE_STATUS[rc]} #{@hostid} #{pack(payload)}"
            @socket_udp.send(msg, 0)
        end
    end

    MESSAGE_TYPES.each do |mt|
        define_method("#{mt}_tcp".downcase.to_sym) do |rc, payload|
            msg = "#{mt} #{MESSAGE_STATUS[rc]} #{@hostid} #{pack(payload)}"

            socket_tcp = TCPSocket.new(@host, @port)
            socket_tcp.send(msg, 0)
            socket_tcp.close
        end
    end

    # Options to create a monitord client
    # :host [:String] to send the messages to
    # :port [:String] of monitord server
    # :hostid [:String] OpenNebula ID of this host
    # :pubkey [:String] public key to encrypt messages
    def initialize(server, port, id, opt = {})
        @opts = {
            :pubkey => ''
        }.merge opt

        addr = Socket.getaddrinfo(server, port)[0]

        @family = addr[0]
        @host   = addr[3]
        @port   = addr[1]

        @socket_udp = UDPSocket.new(@family)
        @socket_udp.connect(@host, @port)

        @pubkey = @opts[:pubkey]

        @hostid = id
    end

    private

    # Formats message payload to send over the wire
    def pack(data)
        if @pubkey
            block_size = @pubkey.n.num_bytes - 11

            edata = ''
            index = 0

            loop do
                break if index >= data.length

                edata << @pubkey.public_encrypt(data[index, block_size])

                index += block_size
            end

            data = edata
        end

        zdata  = Zlib::Deflate.deflate(data, Zlib::BEST_COMPRESSION)
        data64 = Base64.strict_encode64(zdata)

        data64
    end

end

#-------------------------------------------------------------------------------
#  This class wraps the execution of a probe directory and sends data to
#  monitord (optionally)
#-------------------------------------------------------------------------------
class ProbeRunner

    def initialize(hyperv, path, stdin)
        @path  = File.join(File.dirname(__FILE__), '..', "#{hyperv}-probes.d",
                           path)
        @stdin = stdin
    end

    # Run the probes once
    #   @return[Array] rc, data. rc 0 for success and data is the output of
    #   probes. If rc is -1 it signal failure and data is the error message of
    #   the failing probe
    #
    # rubocop:disable Lint/SuppressedException
    def run_probes
        data = ''
        dpro = Dir.new(@path)

        dpro.each do |probe|
            probe_path = File.join(@path, probe)

            next unless File.file?(probe_path)
            next unless File.executable?(probe_path)

            cmd = "#{probe_path} #{ARGV.join(' ')}"

            o_, e_, s_ = Open3.popen3(cmd) do |i, o, e, t|
                out_reader = Thread.new { o.read }
                err_reader = Thread.new { e.read }

                begin
                    i.write @stdin
                rescue Errno::EPIPE
                end

                i.close

                out = out_reader.value
                err = err_reader.value
                rc  = t.value

                begin
                    Process.waitpid(rc.pid)
                rescue Errno::ECHILD
                end

                [out, err, rc]
            end

            data += o_

            return [-1, "Error executing #{probe}: #{e_}"] if s_.exitstatus != 0
        end

        [0, data]
    end
    # rubocop:enable Lint/SuppressedException

    # Singleton call for run_probes method
    def self.run_once(hyperv, path, stdin)
        runner = ProbeRunner.new(hyperv, path, stdin)
        runner.run_probes
    end

    # Executes the probes in the directory in a loop. The block is called after
    # each execution to optionally send the data to monitord
    def self.monitor_loop(hyperv, path, period, stdin, &block)
        # Failure retries, simple exponential backoff
        sfail  = [1, 1, 1, 2, 4, 8, 8, 16, 32, 64]
        nfail  = 0

        runner = ProbeRunner.new(hyperv, path, stdin)

        loop do
            sleep_time = 0

            ts = Time.now

            rc, data = runner.run_probes

            begin
                block.call(rc, data)

                run_time   = (Time.now - ts).to_i
                sleep_time = (period.to_i - run_time) if period.to_i > run_time

                nfail = 0
            rescue StandardError
                sleep_time = sfail[nfail]

                nfail += 1 if nfail < sfail.length - 1
            end

            sleep(sleep_time) if sleep_time > 0
        end
    end

end

#-------------------------------------------------------------------------------
#  Script helper functions and gLobals
#-------------------------------------------------------------------------------
LOCAL_HYPERVISOR = %w[az ec2 packet].freeze

def local?(hypervisor)
  LOCAL_HYPERVISOR.include?(hypervisor)
end

#-------------------------------------------------------------------------------
# Configuration (from monitord)
#-------------------------------------------------------------------------------
xml_txt = STDIN.read

begin
    hyperv = ARGV[0].split(' ')[0]

    xml_txt = Base64.decode64(xml_txt) if local? hyperv
    config  = REXML::Document.new(xml_txt).root

    host   = config.elements['UDP_LISTENER/MONITOR_ADDRESS'].text.to_s
    port   = config.elements['UDP_LISTENER/PORT'].text.to_s
    pubkey = config.elements['UDP_LISTENER/PUBKEY'].text.to_s
    hostid = config.elements['HOST_ID'].text.to_s

    probes = {
        :system_host_udp => {
            :period => config.elements['PROBES_PERIOD/SYSTEM_HOST'].text.to_s,
            :path => 'host/system'
        },

        :monitor_host_udp => {
            :period => config.elements['PROBES_PERIOD/MONITOR_HOST'].text.to_s,
            :path => 'host/monitor'
        },

        :state_vm_tcp => {
            :period => config.elements['PROBES_PERIOD/STATE_VM'].text.to_s,
            :path => 'vm/status'
        },

        :monitor_vm_udp => {
            :period => config.elements['PROBES_PERIOD/MONITOR_VM'].text.to_s,
            :path => 'vm/monitor'
        }
    }

    probes[:beacon_host_udp] = {
        :period => config.elements['PROBES_PERIOD/BEACON_HOST'].text.to_s,
        :path => 'host/beacon'
    } unless local? hyperv

    if !pubkey.empty?
        exp = /(-+BEGIN RSA PUBLIC KEY-+)([^-]*)(-+END RSA PUBLIC KEY-+)/
        m   = pubkey.match(exp)

        if !m
            puts 'Public key not in PEM format'
            exit(-1)
        end

        pktxt = m[2].strip.tr(' ', "\n")

        pubkey = OpenSSL::PKey::RSA.new "-----BEGIN RSA PUBLIC KEY-----\n" \
            "#{pktxt}\n-----END RSA PUBLIC KEY-----"
    else
        pubkey = nil
    end
rescue StandardError => e
    puts e.inspect
    exit(-1)
end

#-------------------------------------------------------------------------------
# Run configuration probes and send information to monitord
#-------------------------------------------------------------------------------

client = MonitorClient.new(host, port, hostid, :pubkey => pubkey)

rc, dt = ProbeRunner.run_once(hyperv, probes[:system_host_udp][:path], xml_txt)

puts dt

STDOUT.flush

exit(-1) if rc == -1

#-------------------------------------------------------------------------------
# Start monitor threads and shepherd
#-------------------------------------------------------------------------------
Process.setsid

STDIN.close

_rd, wr = IO.pipe

STDOUT.reopen(wr)
STDERR.reopen(wr)

threads = []

probes.each do |msg_type, conf|
    threads << Thread.new do
        ProbeRunner.monitor_loop(hyperv,
                                 conf[:path],
                                 conf[:period],
                                 xml_txt) do |result, da|
            da.strip!
            next if da.empty?

            client.send(msg_type, result == 0, da)
        end
    end
end

threads.each {|thr| thr.join }
