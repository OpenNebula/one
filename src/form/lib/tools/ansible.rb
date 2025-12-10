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

# Class to operate with ansible
class Ansible

    extend OneForm::Command

    conf = ConfigLoader.instance.conf

    ONEDEPLOY_TAGS      = conf[:onedeploy_tags]
    FORM_SERVER         = "http://#{conf[:host]}:#{conf[:port]}"
    ONE_SERVER          = URI.parse(conf[:one_xmlrpc]).host
    VENV_PATH           = '/usr/share/one/one-deploy/python-venv/'

    class << self

        # Generate connection details and terraform files
        #
        # @param provision [Provision] the provision object
        # @param success_cb [Proc] the success callback
        # @param failure_cb [Proc] the failure callback
        def configure(provider, provision, success_cb, failure_cb)
            # Create Provision folder if not exists
            FileUtils.mkdir_p(provision.dir) unless File.exist? provision.dir

            log = provision.logger

            # Copy and generate ansible files in ddir
            ddir = ansible_dir(provision, true)
            log.debug("Gathering Ansible files for provision #{provision.id}")

            FileUtils.cp_r("#{DRIVERS_PATH}/#{provider.driver}/ansible/.", ddir)

            within_dir(ddir) do
                check_files(ddir)

                # Run ansible playbook in background
                tags  = provision.body['onedeploy_tags'] || ONEDEPLOY_TAGS
                evars = "provision_id=#{provision.id} "
                evars += "form_server=#{FORM_SERVER} "
                evars += "version=#{OpenNebula::VERSION} "
                evars += "one_server=#{ONE_SERVER} "
                evars += "one_auth=#{provision.user_auth}"

                cmd = ". #{VENV_PATH}/bin/activate; "
                cmd += "ansible-playbook -i inventory.yaml site.yaml --tags '#{tags}' -e '#{evars}'"

                log.info("Running ansible playbook for #{provision.deployment_file}")
                log.debug("Command: #{cmd}")

                run(cmd, log, success_cb, failure_cb)
            end
        rescue StandardError => e
            Log.error("Error preparing Ansible files: #{e.message} #{e.backtrace}")
            raise e
        end

        private

        # Generate ansible working directory
        # /var/lib/oneform/provision/<id>/ansible
        #
        # @param provision [Provision] the provision object
        # @param mkdir [Boolean] create the directory if not exists
        def ansible_dir(provision, mkdir = false)
            dirname = File.join(provision.dir, 'ansible')

            if mkdir
                FileUtils.rm_rf(dirname) if File.exist? dirname
                FileUtils.mkdir_p(dirname)
            end

            dirname
        end

        # Check if ansible files exits in the given deployment directory
        #
        # @param ddir [String] the Ansible deployment directory
        # @raise [RuntimeError] if the files are not found
        def check_files(ddir)
            # Check if site.yaml exists in the ansible directory
            site_yaml = File.join(ddir, 'site.yaml')
            raise "site.yaml not found in #{ddir}" unless File.exist? site_yaml

            inventory_yaml = File.join(ddir, 'inventory.yaml')
            raise "inventory.yaml not found in #{ddir}" unless File.exist? inventory_yaml

            # Check if templates directory exists
            templates_dir = File.join(ddir, 'templates')
            raise "templates directory not found in #{ddir}" unless File.exist? templates_dir
        end

    end

end
