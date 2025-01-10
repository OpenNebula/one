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
#
ONE_LOCATION = ENV['ONE_LOCATION'] unless defined?(ONE_LOCATION)

if !ONE_LOCATION
    LIB_LOCATION      ||= '/usr/lib/one'
    RUBY_LIB_LOCATION ||= '/usr/lib/one/ruby'
    GEMS_LOCATION     ||= '/usr/share/one/gems'
    SCALEWAY_LOCATION ||= '/usr/lib/one/ruby/vendors/packethost/lib'
else
    LIB_LOCATION      ||= ONE_LOCATION + '/lib'
    RUBY_LIB_LOCATION ||= ONE_LOCATION + '/lib/ruby'
    GEMS_LOCATION     ||= ONE_LOCATION + '/share/gems'
    SCALEWAY_LOCATION ||= ONE_LOCATION + '/lib/ruby/vendors/packethost/lib'
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
$LOAD_PATH << SCALEWAY_LOCATION

require 'net/http'
require 'uri'
require 'json'
require 'scaleway'

# Class covering Scaleway functionality for Elastic driver
class ScalewayProvider

    def initialize(provider, host)
        connection = provider.body['connection']
        @secret_key  = connection['secret_key']
        @deploy_id = host['TEMPLATE/PROVISION/DEPLOY_ID'].split('/')[1]
        @zone = connection['zone']
        @sw = Scaleway.new(@secret_key)
    end

    def assign(_ip, external, _opts = {})
        # First of all, we need the fip_id of the external IP
        flexible_ip = sw_flexible_ip(external)

        unless flexible_ip
            STDERR.puts "Error assigning #{external}: IP not found"
            return 1
        end

        if flexible_ip['status'] == 'attached'
            STDERR.puts "Error assigning #{external}: IP already attached"
            return 1
        end

        fip_req = { :fips_ids =>  [flexible_ip['id']],
                    :server_id => @deploy_id }

        resp = @sw.api_call("/flexible-ip/v1alpha1/zones/#{@zone}/fips/attach",
                            Net::HTTP::Post,
                            fip_req)

        # HTTP 409 is returned if IP is being assigned to the device
        unless ['200', '409'].include?(resp.code)
            STDERR.puts "Error assigning #{external}:#{resp.message}"
            return 1
        end

        return 0
    rescue StandardError => e
        OpenNebula.log_error("Error assigning #{external}:#{e.message}")
        1
    end

    def unassign(_ip, external, _opts = {})
        # First of all, we need the fip_id of the external IP
        flexible_ip = sw_flexible_ip(external)

        unless flexible_ip
            STDERR.puts "Error unassigning #{external}:Can not find " <<
                        "#{external} ip in device #{@deploy_id}"
            # although unexpected still harmless, consider OK
            return 0
        end

        fip_req = { :fips_ids => [flexible_ip['id']] }
        resp = @sw.api_call("/flexible-ip/v1alpha1/zones/#{@zone}/fips/detach",
                            Net::HTTP::Post,
                            fip_req)

        # HTTP 409 is returned if IP is being unassigned to the device
        unless ['200', '409'].include?(resp.code)
            STDERR.puts "Error unassigning #{external}:#{resp.message}"
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

    private

    def sw_flexible_ip(external)
        resp_fips = @sw.api_call("/flexible-ip/v1alpha1/zones/#{@zone}/fips")
        fips = JSON.parse(resp_fips.body)['flexible_ips']
        fips.find {|fip| fip['ip_address'] == external }
    end

end
