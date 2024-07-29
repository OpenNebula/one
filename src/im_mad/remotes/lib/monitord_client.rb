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

require 'socket'
require 'base64'
require 'zlib'
require 'openssl'

#-------------------------------------------------------------------------------
#  This class represents a monitord client. It handles udp and tcp connections
#  and send update messages to monitord
#-------------------------------------------------------------------------------
class MonitorClient

    # Defined in src/monitor/include/MonitorDriverMessages.h
    MESSAGE_TYPES = ['MONITOR_VM', 'MONITOR_HOST', 'SYSTEM_HOST', 'BEACON_HOST', 'STATE_VM',
                     'START_MONITOR', 'STOP_MONITOR'].freeze

    MESSAGE_STATUS = { true =>'SUCCESS', false => 'FAILURE' }.freeze

    MESSAGE_TYPES.each do |mt|
        define_method("#{mt}_udp".downcase.to_sym) do |rc, payload|
            msg = "#{mt} #{MESSAGE_STATUS[rc]} #{@hostid} " \
                  "#{Time.now.to_i} #{pack(payload)}"
            @socket_udp.send(msg, 0, @host, @port)
        end

        define_method("#{mt}_tcp".downcase.to_sym) do |rc, payload|
            msg = "#{mt} #{MESSAGE_STATUS[rc]} #{@hostid} " \
                  "#{Time.now.to_i} #{pack(payload)}"

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
            :pubkey => nil
        }.merge opt

        addr = Socket.getaddrinfo(server, port)[0]

        @family = addr[0]
        @host   = addr[3]
        @port   = addr[1]

        @socket_udp = UDPSocket.new(@family)

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

        zdata = Zlib::Deflate.deflate(data, Zlib::BEST_COMPRESSION)
        Base64.strict_encode64(zdata)
    end

end
