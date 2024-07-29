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
    VULTR_LOCATION    ||= '/usr/lib/one/oneprovision/provider_apis/vultr'
    RUBY_LIB_LOCATION ||= '/usr/lib/one/ruby'
    GEMS_LOCATION     ||= '/usr/share/one/gems'
else
    LIB_LOCATION      ||= ONE_LOCATION + '/lib'
    VULTR_LOCATION    ||= ONE_LOCATION + '/lib/oneprovision/provider_apis/vultr'
    RUBY_LIB_LOCATION ||= ONE_LOCATION + '/lib/ruby'
    GEMS_LOCATION     ||= ONE_LOCATION + '/share/gems'
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
$LOAD_PATH << VULTR_LOCATION

require 'vultr'

# Class covering Vultr functionality for Elastic driver
class VultrProvider

    # Class constructor
    #
    # @param provider [OpenNebula::Provider] Provider information
    # @param host     [OpenNebula:Host]      Host information
    def initialize(provider, host)
        connect = provider.body['connection']

        @client    = Vultr.new(connect['key'])
        @deploy_id = host['TEMPLATE/PROVISION/DEPLOY_ID']
    end

    # Assign a reserved IP to the instance
    #
    # @param opts [Hash] opts[:vultr_ip_id] must contain reserved IP ID
    #
    # @return [Integer] 0 on success, 1 on error
    def assign(_, _, opts = {})
        rc = @client.attach_nic(@deploy_id, opts[:vultr_id])

        if VultrError.error?(rc)
            return 0 if rc.message == 'IP is already attached to a server'

            OpenNebula.log_error("Error assigning #{rc.message}")
            return 1
        end

        0
    end

    # Unassign a reserved IP from the instance
    #
    # @param opts [Hash] opts[:vultr_ip_id] must contain reserved IP ID
    #
    # @return [Integer] 0 on success, 1 on error
    def unassign(_, _, opts = {})
        rc = @client.detach_nic(@deploy_id, opts[:vultr_id])

        if VultrError.error?(rc)
            OpenNebula.log_error("Error unassigning #{rc.message}")
            return 1
        end

        0
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
