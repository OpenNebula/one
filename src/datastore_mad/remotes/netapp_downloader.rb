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

require 'tmpdir'

require_relative '../tm/lib/tm_action'
require_relative '../tm/lib/netapp'

# netapp:///vol/one_101_234/one_101_234_lun
netapp_url = ARGV[0]

downloader = TransferManager::Action.new(:action_name => 'netapp_downloader')

lun_path     = netapp_url.split(%r{://}, 2)[1] # /vol/one_101_234(_suffix)/one_101_234(_suffix)_lun
volume_name  = lun_path.split('/')[2]          # one_101_234(_suffix)
source_ds_id = volume_name.split('_', 3)[1]    # 101

source_ds = OpenNebula::Datastore.new_with_id(source_ds_id, OpenNebula::Client.new)
rc = source_ds.info(true)
raise rc.message.to_s if OpenNebula.is_error?(rc)

ds_hash       = source_ds.to_hash['DATASTORE']
netapp_data   = ds_hash['TEMPLATE']
netapp_host   = netapp_data['NETAPP_HOST']
netapp_user   = netapp_data['NETAPP_USER']
netapp_pass   = netapp_data['NETAPP_PASS']
netapp_igroup = netapp_data['NETAPP_IGROUP']
netapp_target = netapp_data['NETAPP_TARGET']

auth   = Base64.strict_encode64("#{netapp_user}:#{netapp_pass}")
netapp = TransferManager::NetApp.new(auth, netapp_host, netapp_target, :action => downloader)

begin
    volume = TransferManager::NetApp::Volume.new({ 'name' => volume_name }, netapp)
    lun    = volume.lun

    raise "No LUN found in volume #{volume_name}" if lun.nil?

    OpenNebula::DriverLogger.log_info "Creating LUN map for #{volume_name}_lun"
    lun.create_lun_map({ 'igroup' => { 'uuid' => netapp_igroup } }) unless lun.lun_map

    device_path = lun.lun_map.setup_disk(:host => false)

    OpenNebula::DriverLogger.log_info "Discovered device: #{device_path}"
rescue StandardError => e
    STDERR.puts "Error during download: #{e.message}"
    if lun.lun_map
        lun.lun_map.remove_connection(:force => true)
        lun.lun_map.delete
    end
    raise
end

begin
    base_file       = File.join(Dir.tmpdir, "#{volume_name}.raw")
    convert_command = "qemu-img convert -f raw -O raw #{device_path} #{base_file}"
    downloader.ssh({
                       :cmds => convert_command,
                       :host => false,
                       :err_msg => 'Failed to convert disk ' \
                                   "#{device_path} to file #{base_file}"
                   })

    command       = "cat #{base_file}"
    clean_command = "rm -f #{base_file}"

    OpenNebula::DriverLogger.log_info "Created base file: #{base_file}"

    puts "command=\"#{command}\""
    puts "clean_command=\"#{clean_command}\""
rescue StandardError => e
    STDERR.puts "Error during convert: #{e.message}"
    if base_file && File.exist?(base_file)
        downloader.ssh({
                           :cmds => clean_command,
                           :err_msg => "Failed to clean convert file #{base_file} after error"
                       })
    end
    raise
ensure
    if lun.lun_map
        lun.lun_map.remove_connection(:force => true)
        lun.lun_map.delete
        OpenNebula::DriverLogger.log_info "Removed device and LUN map for #{lun_name}"
    end
end
