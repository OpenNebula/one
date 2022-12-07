#!/usr/bin/env ruby
# -------------------------------------------------------------------------- #
# Copyright 2002-2022, OpenNebula Project, OpenNebula Systems                #
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

# frozen_string_literal: true

# rubocop:disable Lint/MissingCopEnableDirective
# rubocop:disable Lint/RedundantRequireStatement
# rubocop:disable Layout/FirstHashElementIndentation
# rubocop:disable Layout/HashAlignment
# rubocop:disable Layout/HeredocIndentation
# rubocop:disable Layout/IndentationWidth
# rubocop:disable Style/HashSyntax
# rubocop:disable Style/ParallelAssignment

ONE_LOCATION = ENV['ONE_LOCATION']

if !ONE_LOCATION
    RUBY_LIB_LOCATION = '/usr/lib/one/ruby'
    GEMS_LOCATION     = '/usr/share/one/gems'
    ETC_LOCATION      = '/etc/one'
    REMOTES_LOCATION  = '/var/tmp/one'
else
    RUBY_LIB_LOCATION = ONE_LOCATION + '/lib/ruby'
    GEMS_LOCATION     = ONE_LOCATION + '/share/gems'
    ETC_LOCATION      = ONE_LOCATION + '/etc'
    REMOTES_LOCATION  = ONE_LOCATION + '/var/remotes'
end

CONFIGURATION_FILE = REMOTES_LOCATION + '/etc/onegate-proxy.conf'

# %%RUBYGEMS_SETUP_BEGIN%%
if File.directory?(GEMS_LOCATION)
    real_gems_path = File.realpath(GEMS_LOCATION)
    if !defined?(Gem) || Gem.path != [real_gems_path]
        $LOAD_PATH.reject! {|p| p =~ /vendor_ruby/ }

        # Suppress warnings from Rubygems
        # https://github.com/OpenNebula/one/issues/5379
        begin
            verb = $VERBOSE
            $VERBOSE = nil
            require 'rubygems'
            Gem.use_paths(real_gems_path)
        ensure
            $VERBOSE = verb
        end
    end
end
# %%RUBYGEMS_SETUP_END%%

$LOAD_PATH << RUBY_LIB_LOCATION

require 'async/io'
require 'async/io/stream'
require 'async/io/trap'
require 'etc'
require 'pp'
require 'rb-inotify'
require 'socket'
require 'yaml'

$stdout.sync = true
$stderr.sync = true

DEFAULT_OPTIONS = {
    :debug_level   => 2, # 0 = ERROR, 1 = WARNING, 2 = INFO, 3 = DEBUG
    :process_owner => 'oneadmin',
    :onegate_addr  => '127.0.0.1',
    :onegate_port  => '5030',
    :service_addr  => '169.254.16.9'
}.freeze

# Proxy-class for converting log levels between OpenNebula and
# the socketry/console library. It also splits specific log levels
# into separate stdout and stderr loggers.
class Logger

    LOG_LEVEL_MAP = {
        0 => '3', # ERROR
        1 => '2', # WARN
        2 => '1', # INFO
        3 => '0'  # DEBUG
    }.freeze

    def initialize(log_level = 2)
        @out = Console::Logger.default_logger $stdout, {
            'CONSOLE_LEVEL' => LOG_LEVEL_MAP[log_level]
        }
        @err = Console::Logger.default_logger $stderr, {
            'CONSOLE_LEVEL' => LOG_LEVEL_MAP[log_level]
        }
    end

    def error(*args, &block)
        @err.error(*args, &block)
    end

    def warn(*args, &block)
        @err.warn(*args, &block)
    end

    def info(*args, &block)
        @out.info(*args, &block)
    end

    def debug(*args, &block)
        @err.debug(*args, &block)
    end

end

# Class that implements a classic two-way TCP socket proxy (async).
class OneGateProxy

    def initialize(options = {})
        @options = DEFAULT_OPTIONS.dup.merge! options
        @options.each {|k, v| instance_variable_set("@#{k}", v) }

        @logger = Logger.new options[:debug_level]

        @sigint = Async::IO::Trap.new :INT
        @sigint.install!

        @inotify    = setup_inotify
        @inotify_io = Async::IO::Generic.new @inotify.to_io

        @proxy_ep = Async::IO::Endpoint.socket setup_socket
    end

    def run
        # NOTE: At this point all config should be set in stone,
        # we can drop root privileges..
        drop_privileges

        Async do |task|
            # Make CTRL-C work..
            task.async do
                @sigint.wait { exit 0 }
            end

            # Handle filesystem notifications..
            task.async do
                @inotify.process while @inotify_io.wait_readable
            end

            glue_peers task
        end
    end

    private

    def drop_privileges
        new_gid, new_uid = Etc.getpwnam(@process_owner).gid,
                           Etc.getpwnam(@process_owner).uid

        @logger.info(self) do
            "Drop root privileges -> #{@process_owner}"
        end

        Process::Sys.setgid new_gid
        Process::Sys.setuid new_uid
    end

    def setup_inotify
        inotify = INotify::Notifier.new
        inotify.watch(CONFIGURATION_FILE, :modify) do
            @logger.info(self) do
                "#{CONFIGURATION_FILE} has been just updated, exiting.."
            end
            # We assume here that the service will be restarted by
            # the service manager.
            exit 0
        end
        inotify
    rescue Errno::ENOENT => e
        @logger.error(self) do
            e.message
        end
        # We assume here that the service will be restarted by
        # the service manager.
        exit e.class::Errno
    end

    def setup_service_addr
        # NOTE: We need the service_addr to be defined on one of the interfaces
        # inside the host, one natural choice is the loopback interface (lo).
        # Effectively we set it once, subsequent restarts of the service should
        # honor the idempotence.
        ip_address_add_cmd = lambda do |cidr_host, nic_device|
            check = "[ -n \"$(ip a s to '#{cidr_host}' dev '#{nic_device}')\" ]"
            apply = "ip a a '#{cidr_host}' dev '#{nic_device}'"
            "#{check.strip} >/dev/null 2>&1 || #{apply.strip}"
        end
        system ip_address_add_cmd.call "#{@service_addr}/32", 'lo'
    end

    def setup_socket(listen = Socket::SOMAXCONN)
        # NOTE: Must be executed before calling bind(), otherwise it fails..
        setup_service_addr

        sock = Socket.new Socket::AF_INET, Socket::SOCK_STREAM, 0
        sock.setsockopt Socket::SOL_SOCKET, Socket::SO_REUSEADDR, 1

        @logger.info(self) do
            "Bind #{Addrinfo.tcp(@service_addr, @onegate_port).inspect}"
        end

        sock.bind Socket.pack_sockaddr_in(@onegate_port, @service_addr)
        sock.listen listen
        sock
    end

    def glue_streams(stream1, stream2, task)
        Async do
            concurrent = []
            concurrent << task.async do
                while (chunk = stream1.read_partial)
                    stream2.write chunk
                    stream2.flush
                end
            end
            concurrent << task.async do
                while (chunk = stream2.read_partial)
                    stream1.write chunk
                    stream1.flush
                end
            end
            concurrent.each(&:wait)
        end
    end

    def glue_peers(task)
        @proxy_ep.accept do |vm_peer|
            @logger.debug(self) do
                "Accept #{vm_peer.remote_address.inspect}"
            end

            begin
                gate_ep = Async::IO::Endpoint.tcp @onegate_addr,
                                                  @onegate_port
                gate_ep.connect do |gate_peer|
                    vm_stream, gate_stream = Async::IO::Stream.new(vm_peer),
                                             Async::IO::Stream.new(gate_peer)

                    glue_streams(vm_stream, gate_stream, task).wait

                    @logger.debug(self) do
                        "Close #{gate_peer.remote_address.inspect}"
                    end

                    gate_peer.close
                end
            rescue Errno::ECONNREFUSED,
                   Errno::ECONNRESET,
                   Errno::EHOSTUNREACH,
                   Errno::ETIMEDOUT => e
                    @logger.error(self) do
                        e.message
                    end
            end

            @logger.debug(self) do
                "Close #{vm_peer.remote_address.inspect}"
            end

            vm_peer.close
        end
    end

end

if caller.empty?
    options = DEFAULT_OPTIONS.dup

    # NOTE: The "CONFIGURATION_FILE" is updated during the host sync procedure.
    begin
        options.merge! YAML.load_file(CONFIGURATION_FILE)
    rescue StandardError => e
        warn "Error parsing config file #{CONFIGURATION_FILE}: #{e.message}"
        exit 1
    end

    puts <<~HEADER
    --------------------------------------
            Proxy configuration
    --------------------------------------
    #{options.pretty_inspect.strip}
    --------------------------------------
    HEADER

    service = OneGateProxy.new options
    service.run
end
