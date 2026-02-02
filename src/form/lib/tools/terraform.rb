# -------------------------------------------------------------------------- #
# Copyright 2002-2025, OpenNebula Project, OpenNebula Systems                #
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

# Class to operate with Terraform
class Terraform

    extend OneForm::Command

    class << self

        # Generate connection details and terraform files
        #
        # @param provision [Provision] the provision object
        # @param provider [Provider] the provider object to use
        # @param success_cb [Proc] the success callback
        # @param failure_cb [Proc] the failure callback
        def prepare(provision, provider, success_cb, failure_cb)
            # Create Provision folder if not exists
            FileUtils.mkdir_p(provision.dir) unless File.exist? provision.dir

            log = provision.logger

            # Copy and generate terraform files in ddir
            ddir = tf_dir(provision, true)

            log.debug("Gathering Terraform files for provision #{provision.id}")
            FileUtils.cp_r("#{provider.driver_path}/terraform/.", ddir)

            # Change to the terraform provision directory
            within_dir(ddir) do
                # Add provider info to terraform tags
                vars = provision.user_inputs_values.merge(
                    'oneform_tags' => {
                        'provision_id' => provision.id,
                        'provider_id' => provider.id,
                        'driver' => provider.driver
                    }.merge(provision.tags_values)
                )
                generate_tfvars(provider.connection, vars)

                if !File.exist?("#{ddir}/terraform.tfstate") && !provision.tfstate.empty?
                    log.warn('Terraform state file not found, restoring from provision body')
                    tfstate = JSON.parse(Base64.decode64(provision.tfstate))

                    File.open("#{ddir}/terraform.tfstate", 'w') do |f|
                        f.write(JSON.pretty_generate(tfstate))
                    end

                    log.info('Terraform state file restored')
                end

                log.debug("Provider configuration generated for provision #{provision.id}")
                log.debug("Initializing terraform configuration for provision #{provision.id}")

                # Run terraform init in background
                run('terraform init -no-color', log, success_cb, failure_cb)
            end
        rescue StandardError => e
            Log.error("Error preparing Terraform files: #{e.message} #{e.backtrace}")
            raise e
        end

        # Execute Terraform plan operation
        #
        # @param provision [Provision] the provision object
        # @param success_cb [Proc] the success callback
        # @param failure_cb [Proc] the failure callback
        def plan(provision, success_cb, failure_cb)
            log = provision.logger

            # Change to the terraform provision directory
            ddir = tf_dir(provision)

            within_dir(ddir) do
                log.debug('Planning terraform resources')
                run('terraform plan -no-color -out=./plan.txt', log, success_cb, failure_cb)
            end
        rescue StandardError => e
            Log.error('Error planning Terraform files for ' \
                "provision #{provision.id}: #{e.message}")
            raise e
        end

        # Execute Terraform apply operation
        #
        # @param provision [Provision] the provision object
        # @param success_cb [Proc] the success callback
        # @param failure_cb [Proc] the failure callback
        def apply(provision, success_cb, failure_cb)
            log = provision.logger

            # Change to the terraform provision directory
            ddir = tf_dir(provision)

            within_dir(ddir) do
                log.info('Running terraform provisioning')
                run('terraform apply -auto-approve -no-color', log, success_cb, failure_cb)
            end
        rescue StandardError => e
            Log.error('Error applying Terraform files for ' \
                "provision #{provision.id}: #{e.message}")
            raise e
        end

        # Save the outputs available for a current deployment
        # in the provision body
        #
        # @param provision [Provision] the provision object
        def save_outputs(provision)
            log = provision.logger
            ddir = tf_dir(provision)

            within_dir(ddir) do
                log.debug('Processing terraform state file')

                tfstate = JSON.parse(File.read('terraform.tfstate'))
                provision.tfstate = Base64.encode64(tfstate.to_json)
                provisioned_hosts = tfstate.dig('outputs', 'provisioned_hosts', 'value') || []

                # Determine new and removed hosts
                output_ips    = provisioned_hosts.map {|h| h['instance_ip'] }
                new_hosts     = output_ips - provision.hosts_ips
                removed_hosts = provision.hosts_ips - output_ips

                provisioned_index = provisioned_hosts.each_with_object({}) do |host, hash|
                    hash[host['instance_ip']] = host
                end

                new_hosts.each do |ip|
                    instance = provisioned_index[ip]
                    provision.add_host(nil, instance['instance_id'], instance['instance_ip'])
                end

                removed_hosts.each do |ip|
                    provision.remove_host(ip)
                end
            end
        rescue StandardError => e
            Log.error('Error getting outputs for Terraform files for ' \
                "provision #{provision.id}: #{e.message}")
            raise e
        end

        # Execute Terraform destroy operation
        #
        # @param provision [Provision] the provision object
        # @param provider [Provider] the provider object to use
        # @param success_cb [Proc] the success callback
        # @param failure_cb [Proc] the failure callback
        # @param resources [Hash] the resources IDs to destroy, all if not specified
        def destroy(provision, provider, resources, success_cb, failure_cb)
            log = provision.logger
            log.info('Destroying terraform resources')

            # Destroy operations triggered from earlier stages may not have tf_state defined yet
            success_cb.call if provision.tfstate.nil? || provision.tfstate.empty?

            # Get terraform provision directory
            ddir = tf_dir(provision)

            tf_destroy_cb = lambda do
                # Change to the terraform provision directory
                within_dir(ddir) do
                    tfstate = JSON.parse(Base64.decode64(provision.tfstate))

                    # Check if tfstate file is present in ddir
                    # If not, restore the provision folder and tfstate file
                    if !File.exist?("#{ddir}/terraform.tfstate")
                        log.warn('Terraform state file not found, restoring from provision body')

                        File.open("#{ddir}/terraform.tfstate", 'w') do |f|
                            f.write(JSON.pretty_generate(tfstate))
                        end

                        log.info('Terraform state file restored')
                    end

                    # If resources are specified, destroy them
                    # Otherwise, destroy all resources
                    if resources.empty?
                        log.info('Destroying all terraform resources')
                        cmd = 'terraform destroy'
                    else
                        log.info("Destroying terraform resources: #{resources.join(', ')}")
                        resource_paths = []

                        resources.each do |resource_id|
                            path = get_resource_path(tfstate, resource_id)
                            resource_paths << path if path
                        end

                        targets = resource_paths.map {|path| "-target='#{path}'" }.join(' ')
                        cmd     = "terraform destroy #{targets}"
                    end

                    run(
                        "#{cmd} -auto-approve && terraform apply -refresh-only -auto-approve",
                        log,
                        success_cb,
                        failure_cb
                    )
                end
            end

            # Recreate the Terraform folder if not exists
            if !Dir.exist?(ddir) && !File.exist?("#{ddir}/main.tf")
                log.warn("Terraform directory not found for provision #{provision.id}")
                log.info('Recreating Terraform folder')

                prepare(provision, provider, tf_destroy_cb, failure_cb)
            else
                tf_destroy_cb.call
            end
        rescue StandardError => e
            Log.error('Error destroying Terraform files ' \
                "for provision #{provision.id}: #{e.message}")
            raise e
        end

        private

        # Generate terraform working directory
        # /var/lib/one/form/provision/<id>/terraform/
        #
        # @param provision [Provision] the provision object
        # @param mkdir [Boolean] create the directory if not exists
        def tf_dir(provision, mkdir = false)
            dirname = File.join(provision.dir, 'terraform')

            if mkdir
                FileUtils.rm_rf(dirname) if File.exist? dirname
                FileUtils.mkdir_p(dirname)
            end

            dirname
        end

        # Copy terraform files from the provider folder to the
        # deployment provision directory
        #
        # @param provision [Provision] the provision object
        # @param provider [Provider] the provider object
        def copy_terraform_files(provision, provider)
            ddir = tf_dir(provision, true)

            FileUtils.cp_r("#{provider.driver_path}/terraform/.", ddir)
        end

        # Generate the terraform variables file
        #
        # @param connection_vars    [Hash] connection attrs
        # @param user_inputs_values [Hash] user inputs values
        #                                  to create the vars file
        def generate_tfvars(connection_vars, user_inputs_values)
            File.open('provision.auto.tfvars', 'w') do |f|
                user_inputs_values.each do |key, value|
                    if value.is_a?(Hash)
                        f.write("#{key} = #{convert_tags_to_terraform(value)}\n")
                    elsif value.is_a?(Array)
                        f.write("#{key} = #{value}\n")
                    else
                        f.write("#{key} = \"#{value}\"\n")
                    end
                end

                connection_vars.each do |key, value|
                    f.write("#{key} = \"#{value}\"\n")
                end
            end
        end

        def convert_tags_to_terraform(tags)
            formatted_tags = tags.map do |key, value|
                formatted_value = case value
                                  when String  then %("#{value}")
                                  when Integer then value
                                  when TrueClass, FalseClass then value.to_s
                                  else raise "Unsupported value type: #{value.class}"
                                  end

                %(  #{key} = #{formatted_value}) # Proper HCL formatting
            end

            "{\n#{formatted_tags.join("\n")}\n}"
        end

        # Find the resource by id in the terraform state file
        # returning the resource and its index
        def find_resource_by_id(tfstate, resource_id)
            tfstate['resources'].each do |resource|
                resource['instances'].each_with_index do |instance, index|
                    # Check if the id is in the attributes or in
                    # the triggers (for null_resource)
                    attributes = instance['attributes'] || {}
                    triggers   = attributes['triggers'] || {}

                    if attributes.value?(resource_id) || triggers.value?(resource_id)
                        return { 'resource' => resource, 'index' => index }
                    end
                end
            end

            nil
        end

        # Get resource path from the terraform state file
        def get_resource_path(tfstate, resource_id)
            resource = find_resource_by_id(tfstate, resource_id)

            if resource
                matching_resource = resource['resource']
                resource_index    = resource['index']
                instances         = matching_resource['instances']

                unless instances.is_a?(Array) && !instances.empty?
                    log.warn("No instances found for resource #{resource_id}")
                    return
                end

                instance = instances.at(resource_index)

                unless instance
                    log.warn(
                        "Instance at index #{resource_index} not " \
                        "found for resource #{resource_id}"
                    )
                    return
                end

                # Use index_key if present (for_each),
                # otherwise fallback to numeric index (count)
                index_by =
                    if instance.key?('index_key')
                        key = instance['index_key']
                        if key.is_a?(String)
                            "[\"#{key}\"]"
                        else
                            "[#{key}]"
                        end
                    elsif instances.size > 1
                        "[#{resource_index}]"
                    end

                # Build the base resource path
                resource_path = [
                    matching_resource['module'],
                    matching_resource['type'],
                    matching_resource['name']
                ].compact.join('.')

                resource_path += index_by if index_by
                return resource_path
            end

            log.warn("Resource with id #{resource_id} not found in tfstate")
        end

    end

end
