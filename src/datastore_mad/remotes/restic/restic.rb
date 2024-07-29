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

# This class provides basic helper functions to parse OpenNebula information
# and generate restic commands

require 'json'
require 'pathname'
require 'rexml/document'

require 'CommandManager'

require_relative '../../tm/lib/tm_action'

# This class abstracts the interface with a Restic repo
class Restic

    attr_reader :doc, :path, :sftp, :tmp_dir, :sparsify, :user

    RESTIC_BIN_PATHS = {
        :frontend => "#{ENV['ONE_LOCATION']&.then {|p| "#{p}/var" } || '/var/lib/one'}" \
                     '/remotes/datastore/restic/restic',
        :hypervisor => '/var/tmp/one/datastore/restic/restic'
    }.freeze

    def self.mk_repo_id(backupjob_id)
        "job_#{backupjob_id}"
    end

    def initialize(action, opts = {})
        @options = {
            :create_repo => false,
            :host_type   => :frontend,
            :prefix      => '',
            :repo_id     => nil,
            :repo_type   => :sftp
        }.merge!(opts)

        @doc   = REXML::Document.new(action).root
        prefix = @options[:prefix]

        @ds_id = @doc.elements["#{prefix}ID"].text

        @user = safe_get("#{prefix}TEMPLATE/RESTIC_SFTP_USER", 'oneadmin')
        @sftp = @doc.elements["#{prefix}TEMPLATE/RESTIC_SFTP_SERVER"].text
        base  = @doc.elements["#{prefix}BASE_PATH"].text

        if @options[:repo_id].nil?
            img_bj = @doc.elements['IMAGE/TEMPLATE/BACKUP_JOB_ID']&.text
            img_bj ||= @doc.elements['IMAGE/BACKUP_JOB_ID']&.text

            vm_id  = @doc.elements['IMAGE/VMS/ID']&.text
            path   = @doc.elements['IMAGE/PATH']&.text

            if img_bj
                @repo_id = Restic.mk_repo_id(img_bj)
            elsif vm_id
                @repo_id = vm_id.to_i
            elsif path
                @repo_id = path.match('/(\d+)/backup/[^/]+$') {|m| m[1].to_i }
            else
                @repo_id = nil
            end
        else
            @repo_id = @options[:repo_id]
        end

        @path = if @repo_id.nil?
                    Pathname.new(base).cleanpath.to_s
                else
                    Pathname.new("#{base}/#{@repo_id}").cleanpath.to_s
                end

        @repo = case @options[:repo_type]
                when :sftp
                    "sftp:#{@user}@#{@sftp}:#{@path}"
                when :local
                    @path
                else
                    raise StandardError, 'Unknown Restic repo type'
                end

        @restic_bin = RESTIC_BIN_PATHS[@options[:host_type]]

        @passwd = @doc.elements["#{prefix}TEMPLATE/RESTIC_PASSWORD"].text.delete(%("'))

        @bwlimit = safe_get("#{prefix}TEMPLATE/RESTIC_BWLIMIT", -1)
        @maxproc = Integer(safe_get("#{prefix}TEMPLATE/RESTIC_MAXPROC", -1))

        comp_s = safe_get("#{prefix}TEMPLATE/RESTIC_COMPRESSION", 'auto')
        @comp  = comp_s.downcase
        @comp  = 'auto' unless ['auto', 'off', 'max'].include?(comp_s)

        conn_s = safe_get("#{prefix}TEMPLATE/RESTIC_CONNECTIONS", 5)
        @conns = Integer(conn_s)

        @tmp_dir = safe_get("#{prefix}TEMPLATE/RESTIC_TMP_DIR", '/var/tmp')

        sparsify_s = safe_get("#{prefix}TEMPLATE/RESTIC_SPARSIFY", 'no')
        @sparsify  = sparsify_s.downcase == 'yes'

        # By default we perform aggressive pruning.

        # --max-repack-size size if set limits the total size of files to repack.
        @max_repack = safe_get("#{prefix}TEMPLATE/RESTIC_PRUNE_MAX_REPACK", nil)

        raise StandardError, 'Invalid value for RESTIC_PRUNE_MAX_REPACK' \
            unless @max_repack.nil? || @max_repack.match(/^\d+[kKmMgGtT]?$/)

        # --max-unused limit allow unused data up to the specified limit within the repository.
        # If you want to minimize the space used by your repository, pass 0 to this option.
        @max_unused = safe_get("#{prefix}TEMPLATE/RESTIC_PRUNE_MAX_UNUSED", '0')

        raise StandardError, 'Invalid value for RESTIC_PRUNE_MAX_UNUSED' \
            unless @max_unused.nil? || @max_unused.match(/^\d+[kKmMgGtT%]?$|^unlimited$/)

        create_repo_if_not_exists if @options[:create_repo] && @repo_id
    rescue StandardError => e
        raise StandardError, "Wrong restic datastore configuration: #{e.message}"
    end

    def restic(cmd, opts = {})
        if @bwlimit != -1
            opts['limit-upload']   = @bwlimit
            opts['limit-download'] = @bwlimit
        end

        # Add connectins and compression options if different from defaults
        if cmd.match(/^backup|^restore|^dump/)
            opts['option']      = "sftp.connections=#{@conns}" if @conns != 5
            opts['compression'] = @comp if @comp != 'auto'
        end

        %("$RESTIC_BIN" #{opts_to_str(opts)} '--repo=#{@repo}' #{cmd})
    end

    def resticenv_sh(restic_bin = @restic_bin)
        env = []
        env << %(export RESTIC_BIN="#{restic_bin}")
        env << %(export RESTIC_PASSWORD='#{@passwd}')
        env << %(export GOMAXPROCS="#{@maxproc}") unless @maxproc == -1

        env.join("\n")
    end

    def resticenv_rb(restic_bin = @restic_bin)
        ENV['RESTIC_BIN']      = restic_bin
        ENV['RESTIC_PASSWORD'] = @passwd
        ENV['GOMAXPROCS']      = @maxproc.to_s unless @maxproc == -1
    end

    def [](xpath)
        @doc.elements[xpath].text
    end

    # Ensures that an instance of Restic repo is created for a VM.
    #
    # @return [nil]
    def create_repo_if_not_exists
        script = <<~EOS
            set -e -o pipefail; shopt -qs failglob
            #{resticenv_sh(RESTIC_BIN_PATHS[:frontend])}
            #{restic('stats')} || #{restic('init')}
        EOS

        rc = LocalCommand.run '/bin/bash -s', nil, script

        raise StandardError, rc.stderr if rc.code != 0
    end

    # Gets (from Restic) full metadata of a specific snapshot.
    #
    # @param snap [String] Restic snapshot ID (short)
    #
    # @param rhost [String] hostname/IP of a node to run restic commands on
    #
    # @return [Hash] data struct containing snapshot's details
    def query_snapshot(snap, rhost = @sftp)
        script = <<~EOS
            set -e -o pipefail; shopt -qs failglob
            #{resticenv_sh}
            #{restic("snapshots '#{snap}'", 'no-lock' => nil, 'json' => nil)} | jq --slurp .
        EOS

        rc = run_action 'query_snapshot', script, rhost

        raise StandardError, rc.stderr if rc.code != 0

        snapshots = JSON.parse rc.stdout
        snapshots.flatten!

        raise StandardError, "No such snapshot: #{snap}" if snapshots.empty?

        snapshots[0]
    end

    # Pulls (from Restic) qcow2 images across all snapshots for a specifc VM disk.
    #
    # @param snaps [Array] list of Restic snapshot IDs (short)
    #
    # @param index [String, Integer] VM index of a disk
    #
    # @param rhost [String] hostname/IP of a node to run restic commands on
    #
    # @param wdir [String, nil] directory to pull artifacts into (optional)
    #
    # @return [Hash] data structure containing all discovered paths
    def pull_chain(snaps, index, rhost = @sftp, wdir = nil)
        paths = parse_paths(snaps, rhost, /^disk\.#{index}\./)
        pull_disks(paths[:disks], rhost, wdir)
        paths
    end

    # Reads (in Restic) a single non-disk document in a specifc snapshot.
    #
    # @param snap [String] Restic snapshot ID (short)
    #
    # @param path_filter [Regexp] expression to match document's basename
    #
    # @param rhost [String] hostname/IP of a node to run restic commands on
    #
    # @return [Hash, Hash] document contents and data struct containing all discovered paths
    def read_document(snap, path_filter, rhost = @sftp)
        paths    = parse_paths([snap], rhost)
        document = read_other(snap, paths[:other], rhost, path_filter)
        [document, paths]
    end

    # Pulls (from Restic) a complete set of VM disks and the latest non-disk documents.
    #
    # @param snaps [Array] list of Restic snapshot IDs (short)
    #
    # @param rhost [String] hostname/IP of a node to run restic commands on
    #
    # @param wdir [String, nil] directory to pull artifacts into (optional)
    #
    # @return [Hash] data structure containing all discovered paths
    def pull_snapshots(snaps, rhost = @sftp, wdir = nil)
        paths = parse_paths(snaps, rhost)
        pull_disks(paths[:disks], rhost, wdir)
        pull_other(snaps.last, paths[:other], rhost, wdir)
        paths
    end

    # Drops (from Restic) a set of snapshots. Prune is executed always,
    # but by default nothing should be pruned (performance optimization).
    #
    # @param snaps [Array] list of Restic snapshot IDs (short)
    #
    # @param rhost [String] hostname/IP of a node to run restic commands on
    #
    # @return [nil]
    def remove_snapshots(snaps, rhost = @sftp, opts = {})
        options = {
            :retries => 60,
            :delay   => 5 # seconds
        }.merge!(opts)

        args = {}
        args['prune'] = nil # always prune
        args['max-repack-size'] = @max_repack unless @max_repack.nil?
        args['max-unused'] = @max_unused unless @max_unused.nil?

        forget_cmd = restic "forget #{snaps.join(' ')}", args

        script = <<~EOS
            set -e -o pipefail; shopt -qs failglob
            #{resticenv_sh}
            #{forget_cmd}
        EOS

        # Users can trigger multiple concurrent backup image removals
        # (for a single VM). We wait here in a retry loop, because
        # forget/prune operations lock Restic exclusively.

        rc = nil

        options[:retries].to_i.times do
            # NOTE: Running this operation on the Restic server (@sftp) can
            # improve performance significantly.
            rc = run_action 'remove_snapshots', script, rhost

            return if rc.code == 0

            # https://github.com/restic/restic/issues/2492#issuecomment-1126910866

            break if rc.stderr.match(/unable to create lock.+locked exclusively/).nil?

            sleep options[:delay].to_i
        end

        raise StandardError, "Unable to remove snapshots: #{rc.stdout} #{rc.stderr}" \
            unless rc.nil?
    end

    private

    # Runs shell script locally or remotely depending on the :host_type.
    #
    # @param name [String] name of the action (arbitrary)
    #
    # @param script [String] multiline shell script (BASH)
    #
    # @param rhost [String] hostname/IP of a node to run restic commands on
    #
    # @return [Object] RC struct
    def run_action(name, script, rhost = @sftp)
        case @options[:host_type]
        when :frontend
            # NOTE: The rhost param is ignored when running on a FE.
            LocalCommand.run '/bin/bash -s', nil, script
        when :hypervisor
            host = if @options[:repo_type] == :local
                       "#{@user}@#{rhost}"
                   else
                       rhost
                   end
            TransferManager::Action.ssh name,
                                        :host     => host,
                                        :forward  => true,
                                        :cmds     => script,
                                        :nostdout => false,
                                        :nostderr => false
        end
    end

    # Queries Restic for a complete list of file paths contained in
    # all requested snapshots.
    #
    # @param snaps [Array] list of Restic snapshot IDs (short)
    #
    # @param rhost [String] hostname/IP of a node to run restic commands on
    #
    # @param path_filter [Regexp] expression to match disk basenames
    #
    # @return [Hash] data struct, where all paths are grouped by the VM disk's index
    #                and/or by the Restic's snapshot ID (short).
    def parse_paths(snaps, rhost, path_filter = /^disk\./)
        # NOTE: This simple API call works, because we deliberately put
        # specific files into Restic snapshots (instead of whole directories).

        script = [<<~EOS]
            set -e -o pipefail; shopt -qs failglob
            #{resticenv_sh}
        EOS

        snaps_quoted = snaps.map {|s| "'#{s}'" }

        script << restic("snapshots #{snaps_quoted.join(' ')}", 'no-lock' => nil,
                                                                'json'    => nil)

        rc = run_action 'parse_paths', script.join("\n"), rhost

        raise StandardError, rc.stderr if rc.code != 0

        items = JSON.parse rc.stdout

        disks_by_snap = {}
        other_by_snap = {}
        items.each do |item|
            snap = item['short_id']
            item['paths'].each do |path|
                name = Pathname.new(path).basename.to_s
                if name.match?(path_filter)
                    (disks_by_snap[snap] ||= []) << path
                else
                    (other_by_snap[snap] ||= []) << path
                end
            end
        end

        disks_by_index = {}
        disks_by_snap.values.flatten.each do |path|
            name   = Pathname.new(path).basename.to_s
            tokens = name.split('.')
            (disks_by_index[tokens[1]] ||= []) << path
        end

        raise StandardError, 'Backup does not contain any disks' \
            if disks_by_snap.empty? || disks_by_index.empty?

        {
            :disks => {
                :by_snap  => disks_by_snap,
                :by_index => disks_by_index,
                :uniq     => disks_by_index.values.flatten.uniq
            },
            :other => {
                :by_snap => other_by_snap,
                :uniq    => other_by_snap.values.flatten.uniq
            }
        }
    end

    # Pulls (from Restic) all VM disks specified in the "paths" data struct.
    #
    # @param disks [Hash] sub-hash of the "paths" data struct (paths[:disks])
    #
    # @param rhost [String] hostname/IP of a node to run restic commands on
    #
    # @param wdir [String, nil] directory to pull artifacts into (optional)
    #
    # @return [nil]
    def pull_disks(disks, rhost, wdir = nil)
        script = [<<~EOS]
            set -e -o pipefail; shopt -qs failglob
            #{resticenv_sh}
        EOS

        disks[:by_snap].each do |snap, disk_paths|
            disk_paths.each do |path|
                wdir = File.dirname(path) if wdir.nil?
                file = File.basename(path)

                rcmd = restic("dump '#{snap}' '#{path}'", 'quiet' => nil)

                script << "install -d '#{wdir}/'"
                script << "#{rcmd} > '#{wdir}/#{file}'"
            end
        end

        rc = run_action 'pull_disks', script.join("\n"), rhost

        raise StandardError, "Unable to pull disks: #{rc.stderr}" if rc.code != 0
    end

    # Pulls (from Restic) all non-disk documents for a specific snapshot.
    #
    # @param snap [String] Restic snapshot ID (short)
    #
    # @param other [Hash] sub-hash of the "paths" data struct (paths[:other])
    #
    # @param rhost [String] hostname/IP of a node to run restic commands on
    #
    # @param wdir [String, nil] directory to pull artifacts into (optional)
    #
    # @return [nil]
    def pull_other(snap, other, rhost, wdir = nil)
        script = [<<~EOS]
            set -e -o pipefail; shopt -qs failglob
            #{resticenv_sh}
        EOS

        other[:by_snap][snap].each do |path|
            wdir = File.dirname(path) if wdir.nil?
            file = File.basename(path)
            script << "install -d '#{wdir}/'"
            script << "#{restic("dump '#{snap}' '#{path}'", 'quiet' => nil)} > '#{wdir}/#{file}'"
        end

        rc = run_action 'pull_other', script.join("\n"), rhost

        raise StandardError, "Unable to pull files (non-disk): #{rc.stderr}" \
            if rc.code != 0
    end

    # Reads (in Restic) a single non-disk document in a specific snapshot.
    #
    # @param snap [String] Restic snapshot ID (short)
    #
    # @param other [Hash] sub-hash of the "paths" data struct (paths[:other])
    #
    # @param rhost [String] hostname/IP of a node to run restic commands on
    #
    # @param path_filter [Regexp] expression to match document's basename
    #
    # @return [String] document's payload encoded in base64
    def read_other(snap, other, rhost, path_filter)
        path = other[:by_snap][snap].find do |p|
            path_filter.match? File.basename(p)
        end

        return if path.nil?

        script = <<~EOS
            set -e -o pipefail; shopt -qs failglob
            #{resticenv_sh}
            #{restic("dump '#{snap}' '#{path}'", 'quiet' => nil)}
        EOS

        rc = run_action 'read_other', script, rhost

        raise StandardError, "Unable to read document (non-disk): #{rc.stderr}" \
            if rc.code != 0

        rc.stdout
    end

    def safe_get(name, default)
        @doc.elements[name].text
    rescue StandardError
        default
    end

    def opts_to_str(opts = {})
        opts.to_a.map do |kv|
            "'--#{kv.compact.join('=').delete(%("'))}'" # paranoid about shell injection
        end.join(' ')
    end

end
