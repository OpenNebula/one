#!/usr/bin/env ruby

# -------------------------------------------------------------------------- #
# Copyright 2002-2026, OpenNebula Project, OpenNebula Systems                #
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

ONE_LOCATION = ENV['ONE_LOCATION'] unless defined?(ONE_LOCATION)

if !ONE_LOCATION
    RUBY_LIB_LOCATION ||= '/usr/lib/one/ruby'
    GEMS_LOCATION     ||= '/usr/share/one/gems'
    VAR_LOCATION      ||= '/var/lib/one'
else
    RUBY_LIB_LOCATION ||= ONE_LOCATION + '/lib/ruby'
    GEMS_LOCATION     ||= ONE_LOCATION + '/share/gems'
    VAR_LOCATION      ||= ONE_LOCATION + '/var'
end

# %%RUBYGEMS_SETUP_BEGIN%%
require 'load_opennebula_paths'
# %%RUBYGEMS_SETUP_END%%

$LOAD_PATH << RUBY_LIB_LOCATION
$LOAD_PATH << File.dirname(__FILE__)

require 'socket'

bind_addr = ARGV[0]
port      = ARGV[1].to_i
to        = ARGV[2]

def read_exact(io, size)
    data = +''

    while data.bytesize < size
        chunk = io.read(size - data.bytesize)

        raise EOFError, 'Unexpected EOF' if chunk.nil? || chunk.empty?

        data << chunk
    end

    data
end

begin
    if bind_addr.nil? || bind_addr.empty?
        raise StandardError, 'Missing bind address'
    end

    if port <= 0
        raise StandardError, 'Missing or invalid port'
    end

    if to.nil? || to.empty?
        raise StandardError, 'Missing destination path'
    end

    File.open(to, 'wb') {}

    server = TCPServer.new(bind_addr, port)
    socket = nil

    pipe_r, pipe_w = IO.pipe

    Thread.new do
        loop do
            rs, _ws, _es = IO.select([pipe_r])
            break if rs[0] == pipe_r
        end

        server.close rescue nil
        socket.close rescue nil
    end

    Signal.trap(:TERM) do
        pipe_w.write 'W'
    end

    loop do
        begin
            socket = nil
            socket = server.accept
            socket.binmode

            header = read_exact(socket, 24)
            start_byte, bytes_to_write, total_size = header.unpack('Q>Q>Q>')

            payload = read_exact(socket, bytes_to_write)

            File.open(to, 'r+b') do |file|
                file.truncate(total_size) if total_size > 0 && file.size == 0
                file.seek(start_byte)

                bytes_written = file.write(payload)

                if bytes_written != bytes_to_write
                    raise StandardError,
                          "Partial write: #{bytes_written}/#{bytes_to_write} bytes written"
                end

                file.flush
                file.fsync
            end
        rescue IOError, Errno::EBADF
            break if server.closed?

            raise
        ensure
            socket.close rescue nil
        end
    end
rescue StandardError => e
    STDERR.puts e.full_message
    exit(-1)
end
