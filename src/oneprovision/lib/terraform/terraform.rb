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

require 'erb'
require 'ostruct'
require 'yaml'
require 'zlib'
require 'json'

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

        # Available providers
        # rubocop:disable Style/ClassVars
        @@providers = {}
        # rubocop:enable Style/ClassVars

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

        # Add new provider to @@providers
        #
        # @param p_name  [String] Provider class definition file name
        # @param p_class [String] Provider class name
        #
        # @return [String] File name
        def self.append_provider(p_name, p_class)
            # Provider name, this is used for several things:
            #
            #   check the provider type
            #   directory that contains the provider templates
            name = File.basename(p_name).gsub('.rb', '')

            # Add provider class to available providers hash
            @@providers[name] = Object.const_get(p_class)

            name
        end

        # Check if provider is loaded
        #
        # @return [Boolean] True if exists
        def self.exist?(provider)
            @@providers[provider]
        end

        # Return avaiable providers list
        #
        # @return [Array]
        def self.providers
            @@providers.keys
        end

        # Load providers
        def self.p_load
            return unless @@providers.empty?

            Dir["#{PROVIDERS_LOCATION}/**.rb"].sort.each do |file|
                require file
            end
        end

        # Get a provider instance
        #
        # @param provider [Provider] Provider information
        # @param tf       [Hash]     Terraform :state and :conf
        #
        # @return [Terraform] Terraform provider
        def self.singleton(provider, tf)
            p_name = provider.body['provider']

            unless exist?(p_name)
                raise OneProvisionLoopException, "Unknown provider: #{p_name}"
            end

            if tf
                @@providers[p_name].new(provider, tf[:state], tf[:conf])
            else
                @@providers[p_name].new(provider)
            end
        end

        # Check connection attributes of a provider template
        #
        # @param provider [Provider] Provider information
        # @param p_class  [Class]    Terraform provider class
        #
        # @return true or raise exception
        def self.check_connection(provider)
            p_name = provider['provider']

            return true if p_name == 'onprem'

            unless exist?(p_name)
                raise OneProvisionLoopException, "Unknown provider: #{p_name}"
            end

            @@providers[p_name]::KEYS.each do |k|
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

            c = File.read(
                "#{PROVIDERS_LOCATION}/templates/#{self.class::NAME}/" \
                'provider.erb'
            )
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

            if @file_credentials
                c_key       = Provider::CREDENTIALS_FILE[@provider.type]
                credentials = @provider.connection[c_key.upcase]

                File.open("#{tempdir}/credentials.json", 'w') do |file|
                    file.write(Base64.decode64(credentials))
                end
            end

            # Apply
            Driver.retry_loop("Driver action 'tf deploy' failed", provision) do
                _, e, s = Driver.run(
                    "cd #{tempdir}; " \
                    "export TF_LOG=#{OneProvisionLogger.tf_log}; " \
                    'terraform apply -auto-approve'
                )

                unless s && s.success?
                    conf  = Base64.encode64(Zlib::Deflate.deflate(@conf))
                    state = ''

                    if File.exist?("#{tempdir}/terraform.tfstate")
                        @state = File.read("#{tempdir}/terraform.tfstate")
                        state  = Base64.encode64(Zlib::Deflate.deflate(@state))
                    end

                    provision.add_tf(state, conf)

                    provision.update

                    STDERR.puts '[ERROR] Hosts provision failed!!! ' \
                                'Please log in to your console to delete ' \
                                'left resources'

                    raise OneProvisionLoopException, e
                end
            end

            @state = File.read("#{tempdir}/terraform.tfstate")

            # Get IP information and deploy IDs
            info = output(tempdir)

            # Filter ids
            hash_ids = info.select do |key, _value|
                key.to_s.match(/^device_[0-9]*_id/)
            end
            ids = hash_ids.values.map {|h| h['value'] }

            # Filter ips
            hash_ips = info.select do |key, _value|
                key.to_s.match(/^device_[0-9]*_ip/)
            end
            ips = hash_ips.values.map {|h| h['value'] }

            conf  = Base64.encode64(Zlib::Deflate.deflate(@conf))
            state = Base64.encode64(Zlib::Deflate.deflate(@state))

            [ips, ids, state, conf]
        ensure
            FileUtils.rm_r(tempdir) if tempdir && File.exist?(tempdir)
        end

        # Provisions and configures new hosts
        #
        # @param provision [OpenNebula::Provision] Provision information
        def add_hosts(provision)
            @conf  = Zlib::Inflate.inflate(Base64.decode64(@conf))
            @state = Zlib::Inflate.inflate(Base64.decode64(@state))

            # Generate hosts Terraform configuration
            host_info(provision)

            deploy(provision)
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

            if @file_credentials
                c_key       = Provider::CREDENTIALS_FILE[@provider.type]
                credentials = @provider.connection[c_key.upcase]

                File.open("#{tempdir}/credentials.json", 'w') do |file|
                    file.write(Base64.decode64(credentials))
                end
            end

            # Destroy
            Driver.retry_loop("Driver action 'tf destroy' failed", provision) do
                _, e, s = Driver.run(
                    "cd #{tempdir}; " \
                    "export TF_LOG=#{OneProvisionLogger.tf_log}; " \
                    'terraform refresh; ' \
                    "terraform destroy #{target} -auto-approve"
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
        # @param provision [OpenNebula::Provision] Provision information
        # @param id        [String] Host ID
        def destroy_cluster(provision, id)
            destroy_resource(self.class::TYPES[:cluster], provision, id)
        end

        # Destroys a host
        #
        # @param provision [OpenNebula::Provision] Provision information
        # @param id        [String] Host ID
        def destroy_host(provision, id)
            destroy_resource(self.class::TYPES[:host], provision, id)
        end

        # Destroys a datastore
        #
        # @param provision [OpenNebula::Provision] Provision information
        # @param id        [String] Datastore ID
        def destroy_datastore(provision, id)
            destroy_resource(self.class::TYPES[:datastore], provision, id)
        end

        # Destriys a network
        #
        # @param provision [OpenNebula::Provision] Provision information
        # @param id        [String] Network ID
        def destroy_network(provision, id)
            destroy_resource(self.class::TYPES[:network], provision, id)
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

                obj['user_data'] = user_data(ssh_key)
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

                next if p['DEPLOY_ID'] # Already configured host

                p = p.merge(@provider.connection)

                yield(obj) if block_given?

                c = File.read(
                    "#{PROVIDERS_LOCATION}/templates/#{self.class::NAME}/#{erb}"
                )

                next if c.empty?

                c = ERBVal.render_from_hash(c,
                                            :c         => cluster,
                                            :obj       => obj,
                                            :provision => p,
                                            :ceph_vars => provision.ceph_vars)

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
            elsif version < Gem::Version.new('0.15')
                cmd = '0.13upgrade'
            else
                return
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
        # @return [Hash] Variable value
        #
        #                example:
        #                { "device_51_id" => {
        #                     "sensitive" => false,
        #                     "type"      => "string",
        #                     "value"     => "i-02a4d0f8012392d83"
        #                }

        def output(tempdir, variable = nil)
            ret = nil

            Driver.retry_loop "Driver action 'tf output' failed" do
                ret, e, s = Driver.run(
                    "cd #{tempdir}; terraform output -json #{variable}"
                )

                unless s && s.success?
                    raise OneProvisionLoopException, e
                end
            end

            JSON.parse(ret)
        end

        # Destroys an specific resource
        #
        # @param type      [String]                Resource type
        # @param provision [OpenNebula::Provision] Provision information
        # @param id        [String]                Resource ID
        def destroy_resource(type, provision, id)
            destroy(provision, "-target=#{type}.device_#{id}")
        end

    end

end
