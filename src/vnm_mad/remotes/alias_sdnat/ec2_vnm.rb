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
else
    LIB_LOCATION      ||= ONE_LOCATION + '/lib'
    RUBY_LIB_LOCATION ||= ONE_LOCATION + '/lib/ruby'
    GEMS_LOCATION     ||= ONE_LOCATION + '/share/gems'
end

if File.directory?(GEMS_LOCATION)
    $LOAD_PATH.reject! {|l| l =~ /vendor_ruby/ }
    require 'rubygems'
    Gem.use_paths(File.realpath(GEMS_LOCATION))
end

$LOAD_PATH << LIB_LOCATION + '/oneprovision/lib'

require 'aws-sdk-ec2'

# Class covering AWS functionality for AMM driver and AliasSDNAT
class AWSProvider

    def initialize(provider, host)
        connect = provider.body['connection']

        options = {
            :access_key_id     => connect['aws_access'],
            :secret_access_key => connect['aws_secret'],
            :region            => connect['aws_region']
        }

        Aws.config.merge!(options)

        @ec2       = Aws::EC2::Resource.new.client
        @deploy_id = host['TEMPLATE/PROVISION/DEPLOY_ID']
    end

    # Assign a public_ip to an instance. It creates a secondary IP to map the
    # public one
    #   @param public_ip [String] the IP to map
    #   @return [Hash] if success a Hash with the mapping, empty on error
    def assign(public_ip)
        instcs = @ec2.describe_instances({ :instance_ids => [@deploy_id] })

        inst   = instcs[0][0].instances[0]
        nic_id = inst.network_interfaces[0].network_interface_id

        rc = @ec2.assign_private_ip_addresses(
            { :network_interface_id               => nic_id,
              :secondary_private_ip_address_count => 1 }
        )

        priv_ip = rc.assigned_private_ip_addresses[0].private_ip_address

        @ec2.associate_address({
                                   :instance_id        => @deploy_id,
            :public_ip          => public_ip,
            :private_ip_address => priv_ip
                               })

        { public_ip => priv_ip }
    rescue StandardError => e
        OpenNebula.log_error("Error assiging #{public_ip}:#{e.message}")
        {}
    end

    #  Unassign a public_ip from an instance private_ip
    #    @param public_ip [String] the public ip
    def unassign(public_ip)
        filter = [{ :name => 'public-ip', :values => [public_ip] }]
        ip     = @ec2.describe_addresses({ :filters => filter }).addresses[0]

        if ip.nil? || ip.network_interface_id.nil? || ip.private_ip_address.nil?
            return
        end

        # free associated private ip, it frees associated public ip
        @ec2.unassign_private_ip_addresses(
            { :network_interface_id => ip.network_interface_id,
              :private_ip_addresses => [ip.private_ip_address] }
        )
    rescue StandardError
        OpenNebula.log_error("Error unassiging #{public_ip}:#{e.message}")
    end

end
