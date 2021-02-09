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

require 'erb'
require 'ostruct'
require 'yaml'
require 'zlib'

if !ONE_LOCATION
    PROVIDERS_LOCATION = '/usr/lib/one/oneprovision/lib/terraform/providers'
else
    PROVIDERS_LOCATION = ONE_LOCATION +
                         '/lib/oneprovision/lib/terraform/providers'
end

# Module OneProvision
module OneProvision

    # ERB
    class ERBVal < OpenStruct

        def self.render_from_hash(template, hash)
            ERBVal.new(hash).render(template)
        end

        def render(template)
            ERB.new(template).result(binding)
        end

    end

    # Terraform operations
    class Terraform

        # Providers that are currently available
        PROVIDERS = %w[aws packet]

        # Class constructor
        #
        # @param provider [Provider]
        # @param state    [String] Terraform state in base64
        # @param conf     [String] Terraform config state in base64
        def initialize(provider = nil, state = nil, conf = nil)
            @state    = state
            @conf     = conf
            @provider = provider
        end

        # Get a provider instance
        #
        # @param provider [Provider] Provider information
        # @param tf       [Hash]     Terraform :state and :conf
        #
        # @return [Terraform] Terraform provider
        def self.singleton(provider, tf)
            return Dummy.new if Integer(provider['ID']) == -1

            case provider.body['provider']
            when 'packet'
                tf_class = Packet
            when 'aws'
                tf_class = AWS
            else
                raise OneProvisionLoopException,
                      "Unknown provider: #{provider.body['provider']}"
            end

            tf_class.new(provider, tf[:state], tf[:conf])
        end

        # Check connection attributes of a provider template
        #
        # @param provider [Provider] Provider information
        # @return true or raise exception
        def self.check_connection(provider)
            case provider['provider']
            when 'packet'
                keys = Packet::KEYS
            when 'aws'
                keys = AWS::KEYS
            else
                raise OneProvisionLoopException,
                      "Unknown provider: #{provider['provider']}"
            end

            keys.each do |k|
                if !provider['connection'].key? k
                    raise  OneProvisionLoopException,
                           "Missing provider connection attribute: '#{k}'"
                end
            end

            true
        end

        # Generate Terraform deployment file
        #
        # @param provision [Provision] Provision information
        def generate_deployment_file(provision)
            return if @conf

            @conf = ''

            c = File.read("#{@dir}/provider.erb")
            c = ERBVal.render_from_hash(c, :conn => @provider.connection)

            @conf << c

            # Generate clusters Terraform configuration
            cluster_info(provision)

            # Generate hosts Terraform configuration
            host_info(provision)

            # Generate datastores Terraform configuration
            ds_info(provision)

            # Generate networks Terraform configuration
            network_info(provision)
        end

        # Deploy infra via Terraform
        #
        # @param provision [OpenNebula::Provision] Provision information
        #
        # @return [String, String]
        #   - IPs for each deployed host
        #   - Deploy ID for each host
        #   - Terraform state in base64
        #   - Terraform config in base64
        def deploy(provision)
            tempdir = init(provision, false, false)

            # Apply
            Driver.retry_loop("Driver action 'tf deploy' failed", provision) do
                _, e, s = Driver.run(
                    "cd #{tempdir}; terraform apply -auto-approve"
                )

                unless s && s.success?
                    STDERR.puts '[ERROR] Hosts provision failed!!! ' \
                                'Please log in to your console to delete ' \
                                'left resources'

                    raise OneProvisionLoopException, e
                end
            end

            @state = File.read("#{tempdir}/terraform.tfstate")

            # Get IP information and deploy IDs
            info = output(tempdir)

            info.gsub!(' ', '')
            info = info.split("\n")
            info.map! {|ip| ip.split('=')[1] }

            # From 0 to (size / 2) - 1 -> deploy IDS
            # From (size / 2) until the end -> IPs
            ids = info[0..(info.size / 2) - 1]
            ips = info[(info.size / 2)..-1]

            conf  = Base64.encode64(Zlib::Deflate.deflate(@conf))
            state = Base64.encode64(Zlib::Deflate.deflate(@state))

            [ips, ids, state, conf]
        ensure
            FileUtils.rm_r(tempdir) if tempdir && File.exist?(tempdir)
        end

        # Get polling information from a host
        #
        # @param id [String] Host ID
        #
        # @param [String] Host public IP
        def poll(id)
            tempdir = init

            output(tempdir, "ip_#{id}")
        ensure
            FileUtils.rm_r(tempdir) if tempdir && File.exist?(tempdir)
        end

        # Destroy infra via Terraform
        #
        # @param provision [OpenNebula::Provision] Provision information
        # @param target    [String]                Target to destroy
        #
        # @return [Array]
        #   - Terraform state in base64
        #   - Terraform config in base64
        def destroy(provision, target = nil)
            tempdir = init(provision)

            # Destroy
            Driver.retry_loop("Driver action 'tf destroy' failed", provision) do
                _, e, s = Driver.run(
                    "cd #{tempdir}; terraform destroy #{target} -auto-approve"
                )

                unless s && s.success?
                    raise OneProvisionLoopException, e
                end
            end

            @conf  = File.read("#{tempdir}/deploy.tf")
            @state = File.read("#{tempdir}/terraform.tfstate")

            conf  = Base64.encode64(Zlib::Deflate.deflate(@conf))
            state = Base64.encode64(Zlib::Deflate.deflate(@state))

            [state, conf]
        ensure
            FileUtils.rm_r(tempdir) if tempdir && File.exist?(tempdir)
        end

        # Destroys a cluster
        #
        # @param id [String] Host ID
        def destroy_cluster(id)
            destroy_resource(self.class::TYPES[:cluster], id)
        end

        # Destroys a host
        #
        # @param id [String] Host ID
        def destroy_host(id)
            destroy_resource(self.class::TYPES[:host], id)
        end

        # Destroys a datastore
        #
        # @param id [String] Datastore ID
        def destroy_datastore(id)
            destroy_resource(self.class::TYPES[:datastore], id)
        end

        # Destriys a network
        #
        # @param id [String] Network ID
        def destroy_network(id)
            destroy_resource(self.class::TYPES[:network], id)
        end

        private

        ########################################################################
        # Configuration file generation
        ########################################################################

        # Add clusters information to configuration
        #
        # @param provision [Provision] Provision information
        def cluster_info(provision)
            object_info(provision, 'clusters', 'CLUSTER', 'cluster.erb')
        end

        # Add hosts information to configuration
        #
        # @param provision [Provision] Provision information
        def host_info(provision)
            object_info(provision, 'hosts', 'HOST', 'host.erb') do |obj|
                ssh_key = obj['TEMPLATE']['CONTEXT']['SSH_PUBLIC_KEY']

                return if !ssh_key || ssh_key.empty?

                # Add clod unit information into user_data
                # This only applies for a set of spported providers
                user_data = "#cloud-config\n"

                user_data << "ssh_authorized_keys:\n"

                ssh_key.split("\n").each {|key| user_data << "- #{key}\n" }

                if @base64
                    user_data = Base64.strict_encode64(user_data)
                else
                    # Escape \n to avoid multilines in Terraform deploy file
                    user_data = user_data.gsub("\n", '\\n')
                end

                obj['user_data'] = user_data
            end
        end

        # Add datastores information to configuration
        #
        # @param provision [Provision] Provision information
        def ds_info(provision)
            object_info(provision, 'datastores', 'DATASTORE', 'datastore.erb')
        end

        # Add networks information to configuration
        #
        # @param provision [Provision] Provision information
        def network_info(provision)
            object_info(provision, 'networks', 'VNET', 'network.erb')
        end

        # Generate object Terraform configuration
        #
        # @param provision [Provision] Provision information
        # @param objects   [String]    Objects to get
        # @param object    [String]    Object name
        # @param erb       [String]    ERB file
        def object_info(provision, objects, object, erb)
            cluster = provision.info_objects('clusters')[0]
            cluster = cluster.to_hash['CLUSTER']

            provision.info_objects(objects).each do |obj|
                obj = obj.to_hash[object]
                p   = obj['TEMPLATE']['PROVISION']

                next if !p || p.empty?

                p = p.merge(@provider.connection)

                yield(obj) if block_given?

                c = File.read("#{@dir}/#{erb}")

                next if c.empty?

                c = ERBVal.render_from_hash(c,
                                            :c         => cluster,
                                            :obj       => obj,
                                            :provision => p)

                @conf << c
            end
        end

        ########################################################################
        # Helper functions
        ########################################################################

        # Initialize Terraform directory content
        #
        # @param provisino [OpenNebula::Provision] Provision information
        # @param state     [Boolean] True to copy state, false otherwise
        # @param decode    [Boolean] True to decode @conf and @state
        def init(provision = nil, state = true, decode = true)
            tempdir = Dir.mktmpdir('tf')

            if decode
                conf  = Zlib::Inflate.inflate(Base64.decode64(@conf))
                state = Zlib::Inflate.inflate(Base64.decode64(@state))
            else
                conf  = @conf
                state = @state
            end

            # Copy configuration file to Terraform directory
            File.open("#{tempdir}/deploy.tf", 'w') do |file|
                file.write(conf)
            end

            if state
                # Copy Terraform state to Terraform directory
                File.open("#{tempdir}/terraform.tfstate", 'w') do |file|
                    file.write(state)
                end
            end

            # Upgrade
            upgrade(tempdir)

            # Init
            Driver.retry_loop("Driver action 'tf init' failed", provision) do
                _, e, s = Driver.run("cd #{tempdir}; terraform init")

                unless s && s.success?
                    raise OneProvisionLoopException, e
                end
            end

            tempdir
        end

        # Upgrade Terraform configuration file to an specific version if needed
        #
        # @param dir [String] Directory to upgrade
        def upgrade(dir)
            version, = Driver.run('terraform version --json')
            version  = JSON.parse(version)['terraform_version']
            version  = Gem::Version.new(version)

            return if version < Gem::Version.new('0.12')

            if version < Gem::Version.new('0.13')
                cmd = '0.12upgrade'
            else
                cmd = '0.13upgrade'
            end

            # Upgrade
            Driver.retry_loop "Driver action 'tf upgrade' failed" do
                _, e, s = Driver.run("cd #{dir}; terraform #{cmd} -yes")

                unless s && s.success?
                    raise OneProvisionLoopException, e
                end
            end
        end

        # Get a variable from terraform state using output
        #
        # @param tempdir  [String] Path to temporal directory
        # @param variable [String] Variable to check
        #
        # @return [String] Variable value
        def output(tempdir, variable = nil)
            ret = nil

            Driver.retry_loop "Driver action 'tf output' failed" do
                ret, e, s = Driver.run(
                    "cd #{tempdir}; terraform output #{variable}"
                )

                unless s && s.success?
                    raise OneProvisionLoopException, e
                end
            end

            ret
        end

        # Destroys an specific resource
        #
        # @param type [String] Resource type
        # @param id   [String] Resource ID
        def destroy_resource(type, id)
            destroy("-target=#{type}.device_#{id}")
        end

    end

end
