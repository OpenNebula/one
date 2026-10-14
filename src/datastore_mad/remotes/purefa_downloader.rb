#!/usr/bin/env ruby

# -------------------------------------------------------------------------- #
# Copyright 2019-2025, OpenNebula Systems S.L.                               #
#                                                                            #
# Licensed under the OpenNebula Software License                             #
# (the "License"); you may not use this file except in compliance with       #
# the License. You may obtain a copy of the License as part of the software  #
# distribution.                                                              #
#                                                                            #
# See https://github.com/OpenNebula/one/blob/master/LICENSE.onsla            #
# (or copy bundled with OpenNebula in /usr/share/doc/one/).                  #
#                                                                            #
# Unless agreed to in writing, software distributed under the License is     #
# distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY   #
# KIND, either express or implied. See the License for the specific language #
# governing permissions and  limitations under the License.                  #
# -------------------------------------------------------------------------- #

require 'digest'
require 'tmpdir'
require 'socket'

require_relative '../tm/lib/tm_action'
require_relative '../tm/lib/purefa'

include TransferManager
include OpenNebula

# purefa://one_101_234(_suffix)?
purefa_url = ARGV[0]

downloader = Action.new(:action_name => 'purefa_downloader')

volume_name  = purefa_url.split(%r{://}, 2)[1] # one_101_234(_suffix)
source_ds_id = volume_name.split('_', 3)[1]    # 101

source_ds = OpenNebula::Datastore.new_with_id(source_ds_id, OpenNebula::Client.new)
rc = source_ds.info(true)
raise rc.message.to_s if OpenNebula.is_error?(rc)

ds_hash        = source_ds.to_hash['DATASTORE']
purefa_data    = ds_hash['TEMPLATE']
purefa_host    = purefa_data['PUREFA_HOST']
purefa_token   = purefa_data['PUREFA_API_TOKEN']
purefa_target  = purefa_data['PUREFA_TARGET']
# purefa_suffix  = ds_hash.key?('PUREFA_SUFFIX') ? "_#{ds_hash['PUREFA_SUFFIX']}" : ''
purefa_version = ds_hash.key?('PUREFA_VERSION') ? ds_hash['PUREFA_VERSION'] : PureFA::DEFAULT_API_VERSION

purefa = PureFA.new(
    :host        => purefa_host,
    :target      => purefa_target,
    :api_token   => purefa_token,
    :api_version => purefa_version,
    :action      => downloader
)

fe_hostname = Socket.gethostname

begin
    volume = purefa.get_volume(volume_name)
    DriverLogger.log_info "Creating Connection for #{volume_name}"

    cxn = volume.create_connection(fe_hostname)
    device_path = cxn.setup_disk
    DriverLogger.log_info "Setup device #{device_path} for volume #{volume_name}"
rescue StandardError => e
    DriverLogger.log_error "Error setting up disk connection: #{e.message}"
    DriverLogger.log_error e.backtrace.to_s
    raise
end

begin
    base_file = File.join(Dir.tmpdir, "#{volume_name}.raw")
    convert_command = "qemu-img convert -f raw -O raw #{device_path} #{base_file}"
    downloader.ssh({
                       :cmds => convert_command,
                       :host => false,
                       :err_msg => 'Failed to convert disk ' \
                                   "#{device_path} to file #{base_file}"
                   })

    command       = "cat #{base_file}"
    clean_command = "rm -f #{base_file}"

    DriverLogger.log_info "Created base file: #{base_file}"

    puts "command=\"#{command}\""
    puts "clean_command=\"#{clean_command}\""
rescue StandardError => e
    DriverLogger.log_error "Error during convert: #{e.message}"
    if base_file && File.exist?(base_file)
        downloader.ssh({
                           :cmds => clean_command,
                           :err_msg => "Failed to clean convert file #{base_file} after error"
                       })
    end
    raise
ensure
    cxn.remove_connection
    cxn.delete
end
