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

require 'yaml'
require 'nokogiri'
require 'tempfile'
require 'tmpdir'
require 'json'
require 'base64'
require 'erb'
require 'ostruct'

# Default provision parameters
CONFIG_DEFAULTS = {
    'connection' => {
        'remote_user' => 'root',
        'remote_port' => 22,
        'public_key' => '/var/lib/one/.ssh/ddc/id_rsa.pub',
        'private_key' => '/var/lib/one/.ssh/ddc/id_rsa'
    }
}

# Ansible params
ANSIBLE_VERSION = [Gem::Version.new('2.8'), Gem::Version.new('2.10')]
ANSIBLE_ARGS = "--ssh-common-args='-o UserKnownHostsFile=/dev/null'"
ANSIBLE_INVENTORY_DEFAULT = 'default'

module OneProvision

    # Ansible
    module Ansible

        # ERB
        class ERBVal < OpenStruct

            def self.render_from_hash(template, hash)
                ERBVal.new(hash).render(template)
            end

            def render(template)
                ERB.new(template).result(binding)
            end

        end

        class << self

            # Checks ansible installed version
            def check_ansible_version
                version = Gem::Version.new(`ansible --version`.split[1])

                if (version < ANSIBLE_VERSION[0]) ||
                   (version >= ANSIBLE_VERSION[1])
                    Utils.fail("Unsupported Ansible ver. #{version}, " \
                         "must be >= #{ANSIBLE_VERSION[0]} " \
                         "and < #{ANSIBLE_VERSION[1]}")
                end
            end

            # TODO: expect multiple hosts
            # Configures host via ansible
            #
            # @param hosts [OpenNebula::Host Array] Hosts to configure
            # @param ping  [Boolean]                True to check ping to hosts
            def configure(hosts, ping = true)
                return if hosts.nil? || hosts.empty?

                Driver.retry_loop 'Failed to configure hosts' do
                    check_ansible_version

                    ansible_dir = generate_ansible_configs(hosts)

                    try_ssh(ansible_dir) if ping

                    OneProvisionLogger.info('Configuring hosts')

                    @inventories.each do |i|
                        # build Ansible command
                        cmd = "ANSIBLE_CONFIG=#{ansible_dir}/ansible.cfg "
                        cmd << "ansible-playbook #{ANSIBLE_ARGS}"
                        cmd << " -i #{ansible_dir}/inventory"
                        cmd << " -i #{ANSIBLE_LOCATION}/inventories/#{i}"
                        cmd << " #{ANSIBLE_LOCATION}/#{i}.yml"

                        o, _e, s = Driver.run(cmd)

                        if s && s.success? && i == @inventories.last
                            # enable configured ONE host back
                            OneProvisionLogger.debug(
                                'Enabling OpenNebula hosts'
                            )

                            hosts.each do |h|
                                host = Resource.object('hosts')

                                host.info(h['id'])
                                host.one.enable
                            end
                        elsif s && !s.success?
                            errors = parse_ansible(o) if o

                            raise OneProvisionLoopException, errors
                        end
                    end
                end

                0
            rescue StandardError => e
                raise e
            end

            # Checks ssh connection
            #
            # @param ansible_dir [Dir] Directory with ansible information
            #
            # @return [Boolean] True if the ssh connection works
            def ansible_ssh(ansible_dir)
                # Note: We want only to check the working SSH connection, but
                # Ansible "ping" module requires also Python to be installed on
                # the remote side, otherwise fails. So we use only "raw"
                # module with simple command. Python should be
                # installed by "configure" phase later.
                #
                # Older approach with "ping" module:
                # ANSIBLE_CONFIG=#{ansible_dir}/ansible.cfg ansible
                # #{ANSIBLE_ARGS} -m ping all -i #{ansible_dir}/inventory

                cmd = "ANSIBLE_CONFIG=#{ansible_dir}"
                cmd += '/ansible.cfg ANSIBLE_BECOME=false'
                cmd << " ansible #{ANSIBLE_ARGS}"
                cmd << " -i #{ansible_dir}/inventory"
                cmd << ' -m raw all -a /bin/true'

                o, _e, s = Driver.run(cmd)

                raise OneProvisionLoopException if !s || !s.success?

                hosts = o.lines.count do |l|
                    l =~ /success/i || l =~ /CHANGED/i
                end

                raise OneProvisionLoopException if hosts.zero?

                true
            end

            # Retries ssh connection
            #
            # @param ansible_dir [Dir] Directory with ansible information
            #
            # @return [Boolean] True if the ssh connection works
            def retry_ssh(ansible_dir)
                ret     = false
                retries = 0

                while !ret && retries < Options.ping_retries
                    begin
                        ret = ansible_ssh(ansible_dir)
                    rescue OneProvisionLoopException
                        retries += 1
                        sleep(Options.ping_timeout)
                    end
                end

                ret
            end

            # Checks ssh connection
            #
            # @param ansible_dir [Dir] Directory with ansible information
            def try_ssh(ansible_dir)
                OneProvisionLogger.info('Checking working SSH connection')

                return if retry_ssh(ansible_dir)

                Driver.retry_loop 'SSH connection is failing' do
                    ansible_ssh(ansible_dir)
                end
            end

            # Parses ansible output
            #
            # @param stdout [String] Ansible ouput
            #
            # @return [String] Parsed output
            def parse_ansible(stdout)
                rtn  = []
                task = 'UNKNOWN'

                stdout.lines.each do |line|
                    task = Regexp.last_match(1) if line =~ /^TASK \[(.*)\]/i

                    next unless line =~ /^fatal:/i

                    host = 'UNKNOWN'
                    text = ''

                    case line
                    when /^fatal: \[([^\]]+)\]: .* => ({.*})$/i
                        host = Regexp.last_match(1)

                        begin
                            match = JSON.parse(Regexp.last_match(2))

                            msg   = match['msg']
                            msg   = match['reason'] if msg.nil?

                            text  = msg.strip.tr("\n", ' ')
                            text  = "- #{text}"
                        rescue StandardError => e
                            raise e
                        end
                    when /^fatal: \[([^\]]+)\]: .* =>/i
                        host = Regexp.last_match(1)
                    end

                    content = { :h => host, :t => task, :tx => text }

                    rtn << format('- %<h>s : TASK[%<t>s] %<tx>s', content)
                end

                rtn.join("\n")
            end

            # TODO: support different variables and
            #   connection parameters for each host
            # Generates ansible configurations
            #
            # @param hosts [OpenNebula::Host array] Hosts to configure
            #
            # @return [Dir] Directory with Ansible information
            def generate_ansible_configs(hosts)
                ansible_dir = Dir.mktmpdir
                msg = "Generating Ansible configurations into #{ansible_dir}"

                OneProvisionLogger.debug(msg)

                # Generate 'inventory' file
                c = "[nodes]\n"

                hosts.each do |h|
                    host = Resource.object('hosts')
                    host.info(h['id'])

                    c << "#{host.one['NAME']}\n"
                end

                c << "\n"

                c << "[targets]\n"

                hosts.each do |h|
                    host = Resource.object('hosts')
                    host.info(h['id'])

                    conn = get_host_template_conn(host.one)

                    c << "#{host.one['NAME']} "
                    c << 'ansible_connection=ssh '
                    c << "ansible_ssh_private_key_file=#{conn['private_key']} "
                    c << "ansible_user=#{conn['remote_user']} "
                    c << "ansible_port=#{conn['remote_port']}\n"
                end

                Driver.write_file_log("#{ansible_dir}/inventory", c)

                # Generate "host_vars" directory
                Dir.mkdir("#{ansible_dir}/host_vars")

                hosts.each do |h|
                    host = Resource.object('hosts')
                    host.info(h['id'])

                    var = host.one['TEMPLATE/PROVISION_CONFIGURATION_BASE64']
                    var = YAML.safe_load(Base64.decode64(var)) if var
                    var ||= {}
                    c = YAML.dump(var)
                    fname = "#{ansible_dir}/host_vars/#{host.one['NAME']}.yml"
                    Driver.write_file_log(fname, c)
                end

                host = Resource.object('hosts')
                host.info(hosts[0]['id'])

                if host.one['TEMPLATE/ANSIBLE_PLAYBOOK']
                    @inventories = host.one['TEMPLATE/ANSIBLE_PLAYBOOK']
                    @inventories = @inventories.split(',')
                else
                    @inventories = [ANSIBLE_INVENTORY_DEFAULT]
                end

                # Generate "ansible.cfg" file
                # TODO: what if private_key isn't filename, but content
                # TODO: store private key / packet
                #   credentials securely in the ONE
                roles = "#{ANSIBLE_LOCATION}/roles"

                c = File.read("#{ANSIBLE_LOCATION}/ansible.cfg.erb")
                c = ERBVal.render_from_hash(c, :roles => roles)

                Driver.write_file_log("#{ansible_dir}/ansible.cfg", c)

                # TODO: site.yaml
                # logger(inventoryContent +
                #   File.open("#{$ANSIBLE_LOCATION}/site.yml").read(), true)

                ansible_dir
            end

            # Gets host connection options
            #
            # @param host [OpenNebula::Host] Host to get connections options
            #
            # @return [Hash] Connections options
            def get_host_template_conn(host)
                conn = {}

                # TODO: some nice / generic way (even for configuration?)
                tmpl = host.to_hash['HOST']['TEMPLATE']['PROVISION_CONNECTION']
                tmpl ||= {}
                tmpl.each_pair do |key, value|
                    conn[key.downcase] = value
                end

                conn
            end

        end

    end

end
