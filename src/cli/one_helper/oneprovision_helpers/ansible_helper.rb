# -------------------------------------------------------------------------- #
# Copyright 2002-2018, OpenNebula Project, OpenNebula Systems                #
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

require 'yaml'
require 'nokogiri'
require 'tempfile'
require 'tmpdir'
require 'json'
require 'base64'

# Default provision parameters
CONFIG_DEFAULTS = {
    'connection' => {
        'remote_user' => 'root',
        'remote_port' => 22,
        'public_key'  => '/var/lib/one/.ssh/ddc/id_rsa.pub',
        'private_key' => '/var/lib/one/.ssh/ddc/id_rsa'
    }
}

# Ansible params
ANSIBLE_VERSION = [Gem::Version.new('2.5'), Gem::Version.new('2.7')]
ANSIBLE_ARGS = "--ssh-common-args='-o UserKnownHostsFile=/dev/null'"
$ANSIBLE_INVENTORY = 'default'


class OneProvisionAnsibleHelper < OpenNebulaHelper::OneHelper

    def self.rname
        "ANSIBLE"
    end

    def check_ansible_version()
        version = Gem::Version.new(`ansible --version`.split[1])

        if (version < ANSIBLE_VERSION[0]) || (version >= ANSIBLE_VERSION[1])
            fail("Unsupported Ansible ver. #{version}, " +
                 "must be >= #{ANSIBLE_VERSION[0]} and < #{ANSIBLE_VERSION[1]}")
        end
    end

    def retry_ssh(ansible_dir)
        ret = false
        retries = 0

        while !ret && retries < $PING_RETRIES do
            begin
                ret = ansible_ssh(ansible_dir)
            rescue OneProvisionLoopException
                retries += 1
                sleep($PING_TIMEOUT)
            end
        end

        ret
    end

    def try_ssh(ansible_dir)
        $logger.info("Checking working SSH connection")

        if !retry_ssh(ansible_dir)
            $common_helper.retry_loop 'SSH connection is failing' do ansible_ssh(ansible_dir) end
        end
    end

    def parse_ansible(stdout)
        begin
            rtn = []
            task = 'UNKNOWN'

            stdout.lines.each do |line|
                task = $1 if line =~ /^TASK \[(.*)\]/i

                if line =~ /^fatal:/i
                    host = 'UNKNOWN'
                    text = ''

                    if line =~ /^fatal: \[([^\]]+)\]: .* => ({.*})$/i
                        host  = $1

                        begin
                            text = JSON.parse($2)['msg'].strip.gsub("\n", ' ')
                            text = "- #{text}"
                        rescue
                        end
                    elsif line =~ /^fatal: \[([^\]]+)\]: .* =>/i
                        host  = $1
                    end

                    rtn << sprintf("- %-15s : TASK[%s] %s", host, task, text)
                end
            end

            rtn.join("\n")
        rescue
            nil
        end
    end

    def ansible_ssh(ansible_dir)
        # Note: We want only to check the working SSH connection, but
        # Ansible "ping" module requires also Python to be installed on
        # the remote side, otherwise fails. So we use only "raw" module with
        # simple command. Python should be installed by "configure" phase later.
        #
        # Older approach with "ping" module:
        # ANSIBLE_CONFIG=#{ansible_dir}/ansible.cfg ansible #{ANSIBLE_ARGS} -m ping all -i #{ansible_dir}/inventory

        cmd = "ANSIBLE_CONFIG=#{ansible_dir}/ansible.cfg ANSIBLE_BECOME=false"
        cmd << " ansible #{ANSIBLE_ARGS}"
        cmd << " -i #{ansible_dir}/inventory"
        cmd << " -m raw all -a /bin/true"

        o, _e, s = $common_helper.run(cmd)
        if s and s.success?
            hosts = o.lines.count { |l| l =~ /success/i }

            if hosts == 0
                raise OneProvisionLoopException
            else
                return true
            end
        else
            raise OneProvisionLoopException
        end
    end

    #TODO: support different variables and connection parameters for each host
    #TODO: make it a separate module?
    def generate_ansible_configs(hosts)
        ansible_dir = Dir.mktmpdir()

        $logger.debug("Generating Ansible configurations into #{ansible_dir}")

        # Generate 'inventory' file
        c = "[nodes]\n"

        hosts.each do |h|
            h.info
            c << "#{h['NAME']}\n"
        end

        c << "\n"

        $common_helper.write_file_log("#{ansible_dir}/inventory", c)

        # Generate "host_vars" directory
        Dir.mkdir("#{ansible_dir}/host_vars")

        hosts.each do |h|
            h.info

            var = h['TEMPLATE/PROVISION_CONFIGURATION_BASE64']
            var = YAML.load(Base64.decode64(var)) if var
            var ||= {}
            c = YAML.dump(var)
            $common_helper.write_file_log("#{ansible_dir}/host_vars/#{h['NAME']}.yml", c)
        end

        $ANSIBLE_INVENTORY = hosts[0]['TEMPLATE/ANSIBLE_PLAYBOOK'] if hosts[0]['TEMPLATE/ANSIBLE_PLAYBOOK']

        # Generate "ansible.cfg" file
        #TODO: what if private_key isn't filename, but content
        #TODO: store private key / packet credentials securely in the ONE
        c = <<-EOT
[defaults]
retry_files_enabled = False
deprecation_warnings = False
display_skipped_hosts = False
callback_whitelist =
stdout_callback = skippy
host_key_checking = False
remote_user = #{hosts[0]['TEMPLATE/PROVISION_CONNECTION/REMOTE_USER']}
remote_port = #{hosts[0]['TEMPLATE/PROVISION_CONNECTION/REMOTE_PORT']}
private_key_file = #{hosts[0]['TEMPLATE/PROVISION_CONNECTION/PRIVATE_KEY']}
roles_path = #{ANSIBLE_LOCATION}/roles

[privilege_escalation]
become = yes
become_user = root
        EOT

        $common_helper.write_file_log("#{ansible_dir}/ansible.cfg", c)

        #TODO: site.yaml
        #logger(inventoryContent + File.open("#{$ANSIBLE_LOCATION}/site.yml").read(), true)

        ansible_dir
    end

    #TODO: expect multiple hosts
    def configure(hosts, ping=true)
        check_ansible_version

        ansible_dir = generate_ansible_configs(hosts)

        try_ssh(ansible_dir) if ping

        # offline ONE host
        $logger.debug("Offlining OpenNebula hosts")

        hosts.each do |host|
            host.offline
            host.update("PROVISION_CONFIGURATION_STATUS=pending", true)
        end

        $common_helper.retry_loop 'Configuration failed' do
            $logger.info("Configuring hosts")

            # build Ansible command
            cmd = "ANSIBLE_CONFIG=#{ansible_dir}/ansible.cfg ansible-playbook #{ANSIBLE_ARGS}"
            cmd << " -i #{ansible_dir}/inventory"
            cmd << " -i #{ANSIBLE_LOCATION}/inventories/#{$ANSIBLE_INVENTORY}/"
            cmd << " #{ANSIBLE_LOCATION}/#{$ANSIBLE_INVENTORY}.yml"

            o, _e, s = $common_helper.run(cmd)
            if s and s.success?
                # enable configured ONE host back
                $logger.debug("Enabling OpenNebula hosts")

                hosts.each do |host|
                    host.update("PROVISION_CONFIGURATION_STATUS=configured", true)
                    host.enable
                end
            else
                hosts.each do |host| host.update("PROVISION_CONFIGURATION_STATUS=error", true) end
                errors = parse_ansible(o) if o
                raise OneProvisionLoopException.new(errors)
            end
        end
    end

    def get_host_template_conn(host)
        conn = {}

        #TODO: some nice / generic way (even for configuration?)
        tmpl = host.to_hash['HOST']['TEMPLATE']['PROVISION_CONNECTION']
        tmpl ||= {}
        tmpl.each_pair do |key, value|
            conn[ key.downcase ] = value
        end

        conn
    end
end
