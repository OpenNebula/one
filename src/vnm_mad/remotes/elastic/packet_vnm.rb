# -------------------------------------------------------------------------- #
# Copyright 2002-2021, OpenNebula Project, OpenNebula Systems                #
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
#
ONE_LOCATION = ENV['ONE_LOCATION'] unless defined?(ONE_LOCATION)

if !ONE_LOCATION
    LIB_LOCATION      ||= '/usr/lib/one'
    RUBY_LIB_LOCATION ||= '/usr/lib/one/ruby'
    GEMS_LOCATION     ||= '/usr/share/one/gems'
    PACKET_LOCATION   ||= '/usr/lib/one/ruby/vendors/packethost/lib'
else
    LIB_LOCATION      ||= ONE_LOCATION + '/lib'
    RUBY_LIB_LOCATION ||= ONE_LOCATION + '/lib/ruby'
    GEMS_LOCATION     ||= ONE_LOCATION + '/share/gems'
    PACKET_LOCATION   ||= ONE_LOCATION + '/lib/ruby/vendors/packethost/lib'
end

if File.directory?(GEMS_LOCATION)
    real_gems_path = File.realpath(GEMS_LOCATION)
    if !defined?(Gem) || Gem.path != [real_gems_path]
        $LOAD_PATH.reject! {|l| l =~ /vendor_ruby/ }
        require 'rubygems'
        Gem.use_paths(real_gems_path)
    end
end

$LOAD_PATH << RUBY_LIB_LOCATION
$LOAD_PATH << PACKET_LOCATION

require 'packet'

# Class covering Packet/Equinix functionality for Elastic driver
class PacketProvider

    def initialize(provider, host)
        connect = provider.body['connection']

        @client = Packet::Client.new(connect['token'])
        @deploy_id = host['TEMPLATE/PROVISION/DEPLOY_ID']
    end

    def assign(_ip, external, _opts = {})
        @client.assign_cidr_device("#{external}/32", @deploy_id)
        0
    rescue Packet::Error => e
        # potential VM poweroff(itself) + resume
        return 0 if e.message == '{"errors"=>["Address has already been taken"]}'

        OpenNebula.log_error("Error assiging #{external}:#{e.message}")
        1
    rescue StandardError => e
        OpenNebula.log_error("Error assiging #{external}:#{e.message}")
        1
    end

    def unassign(_ip, external)
        dev = @client.get_device(@deploy_id)

        ip = dev.ip_addresses.select do |i|
            i['address'] == external &&
            i['cidr'] == 32 &&
            i['address_family'] == 4
        end

        @client.delete_ip(ip[0]['id'])
    rescue StandardError => e
        OpenNebula.log_error("Error assiging #{external}:#{e.message}")
    end

    def activate(cmds, nic)
        cmds.add :iptables, "-t nat -A POSTROUTING -s #{nic[:ip]} -j SNAT"\
                        " --to-source #{nic[:external_ip]}"
        cmds.add :iptables, "-t nat -A PREROUTING -d #{nic[:external_ip]} -j DNAT"\
                        " --to-destination #{nic[:ip]}"
    end

    def deactivate(cmds, nic)
        cmds.add :iptables, "-t nat -D POSTROUTING -s #{nic[:ip]} -j SNAT"\
                        " --to-source #{nic[:external_ip]}"
        cmds.add :iptables, "-t nat -D PREROUTING -d #{nic[:external_ip]} -j DNAT"\
                        " --to-destination #{nic[:ip]}"
    end

end
