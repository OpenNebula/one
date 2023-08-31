#!/usr/bin/env ruby

# ---------------------------------------------------------------------------- #
# Copyright 2002-2023, OpenNebula Project, OpenNebula Systems                  #
#                                                                              #
# Licensed under the Apache License, Version 2.0 (the "License"); you may      #
# not use this file except in compliance with the License. You may obtain      #
# a copy of the License at                                                     #
#                                                                              #
# http://www.apache.org/licenses/LICENSE-2.0                                   #
#                                                                              #
# Unless required by applicable law or agreed to in writing, software          #
# distributed under the License is distributed on an "AS IS" BASIS,            #
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.     #
# See the License for the specific language governing permissions and          #
# limitations under the License.                                               #
# ---------------------------------------------------------------------------- #

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
if File.directory?(GEMS_LOCATION)
    real_gems_path = File.realpath(GEMS_LOCATION)
    if !defined?(Gem) || Gem.path != [real_gems_path]
        $LOAD_PATH.reject! {|l| l =~ /vendor_ruby/ }

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
$LOAD_PATH << File.dirname(__FILE__)

require 'opennebula'
require 'pathname'
require 'securerandom'

require_relative '../tm/lib/backup'
require_relative '../tm/lib/tm_action'

SSH_OPTS = '-q -o ControlMaster=no -o ControlPath=none -o ForwardAgent=yes'

# Parse input data.

# rsync://100/3/0:8a3454,1:f6e63e//var/lib/one/datastores/100/6/8a3454/disk.0.0
rsync_url  = ARGV[0]
tokens     = rsync_url.delete_prefix('rsync://').split('/')
ds_id      = tokens[0].to_i
_bj_id     = tokens[1]
increments = tokens[2].split(',').map {|s| s.split(':') }
disk_path  = "/#{tokens[3..-1].join('/')}"
disk_index = Pathname.new(disk_path).basename.to_s.split('.')[1]
vm_id      = disk_path.match("/#{ds_id}/(\\d+)/[^/]+/[^/]+$")[1].to_i

begin
    backup_ds = OpenNebula::Datastore.new_with_id ds_id, OpenNebula::Client.new

    rc = backup_ds.info(true)

    raise StandardError, rc.message if OpenNebula.is_error?(backup_ds)

    ds_hash = backup_ds.to_hash['DATASTORE']

    base_path     = ds_hash['BASE_PATH']
    rsync_user    = ds_hash['TEMPLATE']['RSYNC_USER'] || 'oneadmin'
    rsync_host    = ds_hash['TEMPLATE']['RSYNC_HOST']
    rsync_tmp_dir = ds_hash['TEMPLATE']['RSYNC_TMP_DIR'] || '/var/tmp'
rescue StandardError => e
    STDERR.puts e.full_message
    exit(-1)
end

# Prepare image.

begin
    disk_paths = increments.map do |index, snap|
        raw     = %(#{base_path}/#{vm_id}/#{snap}/disk.#{disk_index}.#{index})
        cleaned = Pathname.new(raw).cleanpath.to_s
        cleaned
    end

    # FULL BACKUP

    if disk_paths.size == 1
        # Return shell code snippets according to the downloader's interface.
        STDOUT.puts <<~EOS
            command="ssh #{SSH_OPTS} '#{rsync_user}@#{rsync_host}' cat '#{disk_path}'"
            clean_command=""
        EOS
        exit(0)
    end

    # INCREMENTAL BACKUP

    tmp_dir  = "#{rsync_tmp_dir}/#{SecureRandom.uuid}"
    tmp_path = "#{tmp_dir}/#{Pathname.new(disk_paths.last).basename}"

    script = [<<~EOS]
        set -e -o pipefail; shopt -qs failglob
    EOS

    script << TransferManager::BackupImage.reconstruct_chain(disk_paths)

    script << "mkdir -p '#{tmp_dir}/'"

    script << TransferManager::BackupImage.merge_chain(disk_paths,
                                                       :destdir => tmp_dir)

    rc = TransferManager::Action.ssh 'prepare_image',
                                     :host     => "#{rsync_user}@#{rsync_host}",
                                     :forward  => true,
                                     :cmds     => script.join("\n"),
                                     :nostdout => false,
                                     :nostderr => false

    raise StandardError, "Unable to prepare image: #{rc.stderr}" if rc.code != 0

    # Return shell code snippets according to the downloader's interface.
    STDOUT.puts <<~EOS
        command="ssh #{SSH_OPTS} '#{rsync_user}@#{rsync_host}' cat '#{tmp_path}'"
        clean_command="ssh #{SSH_OPTS} '#{rsync_user}@#{rsync_host}' rm -rf '#{tmp_dir}/'"
    EOS
    exit(0)
rescue StandardError => e
    STDERR.puts e.full_message
    exit(-1)
end
