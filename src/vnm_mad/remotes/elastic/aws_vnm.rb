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
else
    LIB_LOCATION      ||= ONE_LOCATION + '/lib'
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

$LOAD_PATH << LIB_LOCATION + '/oneprovision/lib'

require 'aws-sdk-ec2'
require 'ipaddr'

# Class covering AWS functionality for Elastic driver
class AWSProvider

    def initialize(provider, host)
        connect = provider.body['connection']

        options = {
            :access_key_id     => connect['access_key'],
            :secret_access_key => connect['secret_key'],
            :region            => connect['region']
        }

        Aws.config.merge!(options)

        @ec2       = Aws::EC2::Resource.new.client
        @deploy_id = host['TEMPLATE/PROVISION/DEPLOY_ID']
    end

    # Assign a private IP to the instance, associate given elastic ip with it
    #   @param ip               [String]  private_ip for AWS
    #   @param external         [String]  public_ip, not used for AWS
    #   @param opts             [Hash]
    #          opts[:alloc_id]  [String]  must contain public_ip alloc id
    #   @return 0 on success, 1 on error
    def assign(ip, _external, opts = {})
        instcs = @ec2.describe_instances({ :instance_ids => [@deploy_id] })
        inst   = instcs[0][0].instances[0]

        # find NIC to which the IP belongs (avoid Ceph network)
        nic_id = nil
        inst.network_interfaces.each do |ec2_nic|
            ec2_subnet = @ec2.describe_subnets(
                { :subnet_ids => [ec2_nic.subnet_id] }
            )[0][0]
            ip_range = IPAddr.new(ec2_subnet.cidr_block)

            if ip_range.include?(ip)
                nic_id = ec2_nic.network_interface_id
            end
        end

        if nic_id
            @ec2.assign_private_ip_addresses(
                { :network_interface_id => nic_id,
                  :private_ip_addresses => [ip] }
            )

            @ec2.associate_address(
                { :network_interface_id => nic_id,
                  :allocation_id        => opts[:alloc_id],
                  :private_ip_address   => ip }
            )
        else
            OpenNebula.log_error("Can not find any interface to assign #{ip}")
            exit 1
        end

        0
    rescue StandardError => e
        OpenNebula.log_error("Error assigning #{ip}:#{e.message}")
        1
    end

    #  Unassign a public_ip from an instance
    #   @param ip       [String] not used for AWS
    #   @param external [String] the public ip
    def unassign(ip, external, _opts = {})
        filter = [{ :name => 'public-ip', :values => [external] }]
        aws_ip = @ec2.describe_addresses({ :filters => filter }).addresses[0]

        if aws_ip.nil? \
                || aws_ip.network_interface_id.nil? \
                || aws_ip.private_ip_address.nil?
            return
        end

        # free associated private ip, it frees associated public ip
        @ec2.unassign_private_ip_addresses(
            { :network_interface_id => aws_ip.network_interface_id,
              :private_ip_addresses => [aws_ip.private_ip_address] }
        )
    rescue StandardError
        OpenNebula.log_error("Error unassigning #{ip}:#{e.message}")
    end

end
