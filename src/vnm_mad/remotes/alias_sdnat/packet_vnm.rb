# -------------------------------------------------------------------------- #
# Copyright 2002-2020, OpenNebula Project, OpenNebula Systems                #
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
    PACKET_LOCATION   ||= ONE_LOCATION + '/ruby/vendors/packethost/lib'
end

if File.directory?(GEMS_LOCATION)
    $LOAD_PATH.reject! {|l| l =~ /vendor_ruby/ }
    require 'rubygems'
    Gem.use_paths(File.realpath(GEMS_LOCATION))
end

$LOAD_PATH << RUBY_LIB_LOCATION
$LOAD_PATH << PACKET_LOCATION

require 'packet'

# Class covering Packet/Equinix functionality for AliasSDNAT
class PacketProvider

    def initialize(provider, host)
        connect = provider.body['connection']

        @client = Packet::Client.new(connect['packet_token'])
        @deploy_id = host['TEMPLATE/PROVISION/DEPLOY_ID']
    end

    def assign(public_ip)
        @client.assign_cidr_device("#{public_ip}/32", @deploy_id)
        { public_ip => public_ip }
    rescue StandardError => e
        OpenNebula.log_error("Error assiging #{public_ip}:#{e.message}")
        {}
    end

    def unassign(public_ip)
        dev = @client.get_device(@deploy_id)

        ip = dev.ip_addresses.select do |i|
            i['address'] == public_ip &&
            i['cidr'] == 32 &&
            i['address_family'] == 4
        end

        @client.delete_ip(ip[0]['id'])
    rescue StandardError => e
        OpenNebula.log_error("Error assiging #{public_ip}:#{e.message}")
        {}
    end

end
