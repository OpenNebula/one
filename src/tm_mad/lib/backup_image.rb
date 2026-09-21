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

require 'json'
require 'fileutils'
require 'shellwords'

require_relative 'backup_command'

#-------------------------------------------------------------------------------
# CONFIGURATION CONSTANTS
#   QEMU_IO_OPEN: options to open command for qemu-io
#   -t <cache_mode>: none, writeback (recommended)
#       wirteback = cache.writeback (fsync() after each write)
#       none      = cache.writeback | cache.direct (use O_DIRECT)
#   -i <io_mode>: io_uring, threads, native (requires cache_mode = none)
#
#   IO_ASYNC: if true issues aio_read commands instead of read
#   OUTSTAND_OPS: number of aio_reads before issuing a aio_flush commnand
#
#   BDRV_MAX_REQUEST is the limit for the sieze of qemu-io operations
#-------------------------------------------------------------------------------
QEMU_IO_OPEN ||= '-t none -i native -o driver=qcow2' unless defined?(QEMU_IO_OPEN)
IO_ASYNC     ||= false unless defined?(IO_ASYNC)
OUTSTAND_OPS ||= 8 unless defined?(OUTSTAND_OPS)

BDRV_MAX_REQUEST ||= 2**30 unless defined?(BDRV_MAX_REQUEST)

#-------------------------------------------------------------------------------
# Setup an NBD server to pull changes, an optional map can be provided
#-------------------------------------------------------------------------------
class Nbd

    @instances = {}
    @current   = nil

    class << self

        def start_nbd(file, map = '')
            socket   = socket_for(file)
            instance = @instances[socket]

            if instance
                @current = instance
                return
            end

            instance = new(file, socket, map)
            instance.start

            @instances[socket] = instance
            @current           = instance
        end

        def stop_nbd(file = nil)
            instance = if file.nil?
                           @current
                       else
                           @instances[socket_for(file)]
                       end

            return unless instance

            @instances.delete(instance.socket)
            instance.stop

            @current = @instances.values.last if @current == instance
        end

        def uri(file = nil)
            socket = if file.nil?
                         @current&.socket
                     else
                         @instances[socket_for(file)]&.socket || socket_for(file)
                     end

            "nbd+unix:///?socket=#{socket}"
        end

        private

        def socket_for(file)
            "#{File.realpath(file)}.socket"
        end

    end

    attr_reader :socket

    def initialize(file, socket, map = '')
        @file   = file
        @socket = socket
        @map    = map
        @server = nil
    end

    def start
        return if @server

        @server = fork do
            args  = ['-r', '-k', @socket, '-f', 'qcow2', '-t']
            args << '-B' << @map unless @map.empty?
            args << @file

            exec('qemu-nbd', *args)
        end

        sleep(1) # TODO: inotify or poll for @socket
    end

    def stop
        return unless @server

        Process.kill('QUIT', @server)
        Process.waitpid(@server)

        File.unlink(@socket)

        @server = nil

        sleep(1) # TODO: improve settle down FS/qemu locks
    end

end

# ------------------------------------------------------------------------------
# This class abstracts the information and several methods to operate over
# disk images files
#
# +--------+---------------+---------------------------------------------------+
# | Driver |      PType    |                      Layout                       |
# +========+===============+===================================================+
# | NFS    | persistent    | disk.0 -> /var/lib/one/datastores/1/ab24b7.snap/0 |
# |        | no persistent | disk.0 -> disk.0.snap/0                           |
# +----------------------------------------------------------------------------+
# | SSH    | persistent    | disk.0                                            |
# |        | no persistent | (no link regular file)                            |
# +--------+---------------+---------------------------------------------------+
#
# NOTE: A persistent SSH disk may be a link to a pevious snapshot
#
# @name of the file supporting the disk
# @snap path for the snapshot folder (absolute)
# @path real path (links resolved of the file)
# @slink path to symlink disk.i file (= @snap for persistent)
class QemuImg

    include Command

    attr_reader :path, :name, :snap, :slink

    def initialize(path, opts = {})
        @_info = nil

        read_paths(path, opts)
    end

    def read_paths(path, opts = {})
        # Default locations
        @path = path
        @name = File.basename(path)
        @snap = "#{opts[:vm_dir]}/disk.#{opts[:disk_id]}.snap"

        return if opts.empty? || !File.exist?(path)

        @path  = File.realpath(path)

        rl = begin
            File.readlink(path)
        rescue StandardError
            nil
        end

        return unless rl

        @name  = File.basename(rl)
        @slink = File.dirname(rl)

        @snap = if opts[:shared] && opts[:persistent]
                    @slink
                else
                    File.dirname("#{opts[:vm_dir]}/#{rl}")
                end
    end

    #---------------------------------------------------------------------------
    # qemu-img command methods
    #---------------------------------------------------------------------------
    QEMU_IMG_COMMANDS = ['convert', 'create', 'rebase', 'info', 'bitmap', 'commit']

    QEMU_IMG_COMMANDS.each do |command|
        define_method(command.to_sym) do |args = '', opts|
            cmd("qemu-img #{command}", "#{@path} #{args}", opts)
        end
    end

    #---------------------------------------------------------------------------
    #  Image information methods.
    #
    #  Sample output of qemu image info output in json format
    #  {
    #  "backing-filename-format": "qcow2",
    #  "virtual-size": 268435456,
    #  "filename": "disk.0",
    #  "cluster-size": 65536,
    #  "format": "qcow2",
    #  "actual-size": 2510848,
    #  "format-specific": {
    #      "type": "qcow2",
    #      "data": {
    #          "compat": "1.1",
    #          "compression-type": "zlib",
    #          "lazy-refcounts": false,
    #          "bitmaps": [
    #              {
    #                  "flags": [
    #                      "auto"
    #                  ],
    #                  "name": "one-0-5",
    #                  "granularity": 65536
    #              },
    #              {
    #                  "flags": [
    #                      "auto"
    #                  ],
    #                  "name": "one-0-4",
    #                  "granularity": 65536
    #              }
    #          ],
    #          "refcount-bits": 16,
    #          "corrupt": false,
    #          "extended-l2": false
    #      }
    #  },
    #  "full-backing-filename": "/var/lib/one/datastores/1/e948982",
    #  "backing-filename": "/var/lib/one/datastores/1/e948982",
    #  "dirty-flag": false
    # }
    #---------------------------------------------------------------------------
    def [](key)
        if !@_info
            out    = info(:output => 'json', :force_share => '')
            @_info = JSON.parse(out)
        end

        @_info[key]
    end

    def bitmaps
        self['format-specific']['data']['bitmaps']
    rescue StandardError
        []
    end

    #---------------------------------------------------------------------------
    # Pull changes since last checkpoint through the NBD server in this image
    #   1. Get list of dirty blocks
    #   2. Create increment qcow2 using NBD as backing file
    #   3. Pull changes reading (copy-on-write)
    #
    # Note: Increment files neeed rebase to reconstruct the increment chain
    #---------------------------------------------------------------------------
    def pull_changes(uri, map)
        # ----------------------------------------------------------------------
        # Get extents from NBD server
        # ----------------------------------------------------------------------
        exts = if !map || map.empty?
                   # TODO: change pattern to include zero
                   extents(uri, '', 'data')
               else
                   extents(uri, map, 'dirty')
               end

        rc, msg = create(:f => 'qcow2', :F => 'raw', :b => uri)

        return [false, msg] unless rc

        # ----------------------------------------------------------------------
        # Create a qemu-io script to pull changes
        # ----------------------------------------------------------------------
        io_script = "open -C #{QEMU_IO_OPEN} #{@path}\n"
        index     = -1

        exts.each do |e|
            ext_length = Integer(e['length'])
            new_exts   = []

            if ext_length > BDRV_MAX_REQUEST
                ext_offset = Integer(e['offset'])

                loop do
                    index += 1

                    blk_length = [ext_length, BDRV_MAX_REQUEST].min

                    new_exts << {
                        'offset' => ext_offset,
                        'length' => blk_length,
                        'index'  => index
                    }

                    ext_offset += BDRV_MAX_REQUEST
                    ext_length -= BDRV_MAX_REQUEST

                    break if ext_length <= 0
                end
            else
                index += 1

                new_exts << {
                    'offset' => e['offset'],
                    'length' => e['length'],
                    'index'  => index
                }
            end

            new_exts.each do |i|
                if IO_ASYNC
                    io_script << "aio_read -q #{i['offset']} #{i['length']}\n"
                    io_script << "aio_flush\n" if (i['index'] + 1) % OUTSTAND_OPS == 0
                else
                    io_script << "read -q #{i['offset']} #{i['length']}\n"
                end
            end
        end

        io_script << "aio_flush\n" if IO_ASYNC

        cmd('qemu-io', '', :stdin_data => io_script)
    end

    private

    #---------------------------------------------------------------------------
    # Gets the dirty extent information from the given map using an NBD server
    #---------------------------------------------------------------------------
    def extents(uri, map, description)
        opts = { :json => '' }

        if !map.empty?
            opts[:map=] = map
        else
            opts[:map] = ''
        end

        out = cmd('nbdinfo', uri, opts)

        bmap = JSON.parse(out)
        exts = []

        bmap.each do |e|
            next if !e || e['description'] != description

            exts << e
        end

        exts
    end

end
