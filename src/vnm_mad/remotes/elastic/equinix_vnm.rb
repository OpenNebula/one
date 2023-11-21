# -------------------------------------------------------------------------- #
# Copyright 2002-2023, OpenNebula Project, OpenNebula Systems                #
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
    EQUINIX_LOCATION  ||= '/usr/lib/one/ruby/vendors/packethost/lib'
else
    LIB_LOCATION      ||= ONE_LOCATION + '/lib'
    RUBY_LIB_LOCATION ||= ONE_LOCATION + '/lib/ruby'
    GEMS_LOCATION     ||= ONE_LOCATION + '/share/gems'
    EQUINIX_LOCATION  ||= ONE_LOCATION + '/lib/ruby/vendors/packethost/lib'
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
$LOAD_PATH << EQUINIX_LOCATION

require 'net/http'
require 'uri'
require 'json'
require 'equinix'

# Class covering Equinix functionality for Elastic driver
class EquinixProvider

    def initialize(provider, host)
        @eq_token  = provider.body['connection']['token']
        @deploy_id = host['TEMPLATE/PROVISION/DEPLOY_ID']
    end

    def assign(_ip, external, _opts = {})
        ip_req = { :manageable => true,
                   :address => external }

        eq = Equinix.new(@eq_token)

        resp = eq.api_call("/devices/#{@deploy_id}/ips",
                           Net::HTTP::Post,
                           ip_req)

        # HTTP 422 is returned if IP already assigned to the device
        # e.g. VM poweroff from inside + onevm resume
        unless resp.code == '201' || resp.code == '422'
            STDERR.puts "Error assigning #{external}:#{resp.message}"
            return 1
        end

        return 0
    rescue StandardError => e
        OpenNebula.log_error("Error assigning #{external}:#{e.message}")
        1
    end

    def unassign(_ip, external, _opts = {})
        eq = Equinix.new(@eq_token)

        # find assignment id for external in device
        resp = eq.api_call("/devices/#{@deploy_id}/ips")

        unless resp.code == '200'
            STDERR.puts "Error unassigning #{external}:#{resp.message}"
            return 1
        end

        assignment_id = nil
        JSON.parse(resp.body)['ip_addresses'].each do |ip|
            if ip['address'] == external
                assignment_id = ip['id']
                break
            end
        end

        unless assignment_id
            STDERR.puts "Error unassigning #{external}:Can not find " <<
                        "{external} ip in device #{@deploy_id}"
            # although unexpected still harmless, consider OK
            return 0
        end

        # unassign external ip
        resp = eq.api_call("/ips/#{assignment_id}", Net::HTTP::Delete)

        unless resp.code == '204'
            STDERR.puts "Equinix API failure, HTTP #{resp.code}, " <<
                        "#{resp.message}, #{resp.body}"
            return 1
        end

        return 0
    rescue StandardError => e
        OpenNebula.log_error("Error unassigning #{external}:#{e.message}")
        1
    end

    def activate(cmds, nic)
        cmds.add :iptables,
                 "-t nat -A POSTROUTING -s #{nic[:ip]} -j SNAT " \
                 "--to-source #{nic[:external_ip]}"
        cmds.add :iptables,
                 "-t nat -A PREROUTING -d #{nic[:external_ip]} -j DNAT " \
                 "--to-destination #{nic[:ip]}"
    end

    def deactivate(cmds, nic)
        cmds.add :iptables,
                 "-t nat -D POSTROUTING -s #{nic[:ip]} -j SNAT " \
                 "--to-source #{nic[:external_ip]}"
        cmds.add :iptables,
                 "-t nat -D PREROUTING -d #{nic[:external_ip]} -j DNAT " \
                 "--to-destination #{nic[:ip]}"
    end

end
