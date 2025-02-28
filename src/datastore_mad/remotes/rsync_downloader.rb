#!/usr/bin/env ruby

# ---------------------------------------------------------------------------- #
# Copyright 2002-2025, OpenNebula Project, OpenNebula Systems                  #
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

proto, url = rsync_url.split(%r{://}, 2)
tokens     = url.split('/', 4)
ds_id      = tokens[0].to_i
_bj_id     = tokens[1]
increments = tokens[2].split(',').map {|s| s.split(':') }
disk_path  = "/#{tokens[3]}"
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
    tmp_dir  = "#{rsync_tmp_dir}/#{SecureRandom.uuid}"
    if proto == 'rsync+rbd'
        # FULL/INCREMENTAL BACKUP (RBD)

        disk_paths = increments.map do |index, snap|
            raw = if index == '0'
                      "#{base_path}/#{vm_id}/#{snap}/disk.#{disk_index}.rbd2"
                  else
                      "#{base_path}/#{vm_id}/#{snap}/disk.#{disk_index}.#{index}.rbdiff"
                  end
            Pathname.new(raw).cleanpath
        end

        tmp_path = "#{tmp_dir}/disk.#{disk_index}.#{increments.last[0]}.tar.gz"

        script = <<~EOS
            set -e -o pipefail; shopt -qs failglob
            mkdir -p '#{tmp_dir}/'
            tar zcvf '#{tmp_path}'#{disk_paths.map {|d| " -C #{d.dirname} #{d.basename}" }.join('')}
        EOS

        rc = TransferManager::Action.ssh('prepare_image',
                                         :host     => "#{rsync_user}@#{rsync_host}",
                                         :forward  => true,
                                         :cmds     => script,
                                         :nostdout => false,
                                         :nostderr => false)

        raise StandardError, "Unable to prepare image: #{rc.stderr}" if rc.code != 0

        STDOUT.puts <<~EOS
            command="ssh #{SSH_OPTS} '#{rsync_user}@#{rsync_host}' cat '#{tmp_path}'"
            clean_command="ssh #{SSH_OPTS} '#{rsync_user}@#{rsync_host}' rm -rf '#{tmp_dir}/'"
        EOS
    elsif increments.size == 1
        # FULL BACKUP (QCOW2)

        STDOUT.puts <<~EOS
            command="ssh #{SSH_OPTS} '#{rsync_user}@#{rsync_host}' cat '#{disk_path}'"
            clean_command=""
        EOS
    else
        # INCREMENTAL BACKUP (QCOW2)

        disk_paths = increments.map do |index, snap|
            raw     = %(#{base_path}/#{vm_id}/#{snap}/disk.#{disk_index}.#{index})
            cleaned = Pathname.new(raw).cleanpath.to_s
            cleaned
        end

        tmp_path = "#{tmp_dir}/#{Pathname.new(disk_paths.last).basename}"

        script = <<~EOS
            set -e -o pipefail; shopt -qs failglob

            #{TransferManager::BackupImage.reconstruct_chain(disk_paths)}
            mkdir -p '#{tmp_dir}/'
            #{TransferManager::BackupImage.merge_chain(disk_paths,
                                                       :destdir => tmp_dir)}
        EOS

        rc = TransferManager::Action.ssh('prepare_image',
                                         :host     => "#{rsync_user}@#{rsync_host}",
                                         :forward  => true,
                                         :cmds     => script,
                                         :nostdout => false,
                                         :nostderr => false)

        raise StandardError, "Unable to prepare image: #{rc.stderr}" if rc.code != 0

        STDOUT.puts <<~EOS
            command="ssh #{SSH_OPTS} '#{rsync_user}@#{rsync_host}' cat '#{tmp_path}'"
            clean_command="ssh #{SSH_OPTS} '#{rsync_user}@#{rsync_host}' rm -rf '#{tmp_dir}/'"
        EOS
    end
rescue StandardError => e
    STDERR.puts e.full_message
    exit(-1)
end
