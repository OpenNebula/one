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

require 'yaml'
require 'nokogiri'
require 'tempfile'
require 'tmpdir'
require 'json'
require 'base64'
require 'erb'
require 'ostruct'
require 'fileutils'

if !ONE_LOCATION
    ANSIBLE_LOCATION = '/usr/share/one/oneprovision/ansible'
else
    ANSIBLE_LOCATION = ONE_LOCATION + '/share/oneprovision/ansible'
end

# Default provision parameters
CONFIG_DEFAULTS = {
    'connection' => {
        'remote_user' => 'root',
        'remote_port' => 22,
        'public_key' => '/var/lib/one/.ssh-oneprovision/id_rsa.pub',
        'private_key' => '/var/lib/one/.ssh-oneprovision/id_rsa'
    }
}

# Ansible params
ANSIBLE_ARGS = "--ssh-common-args='-o UserKnownHostsFile=/dev/null'"
ANSIBLE_INVENTORY_DEFAULT = 'default'
CEPH_ANSIBLE_URL    = 'https://github.com/ceph/ceph-ansible.git'
CEPH_ANSIBLE_BRANCH = 'stable-8.0'
CEPH_ANSIBLE_DIR    = '/var/lib/one/.ansible/ceph-8.0'

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
            def check_ansible_version(provision)
                # Get just first line with Ansible version
                version = `ansible --version`.split("\n")[0]

                version = version.match(/\d+[.]\d+/)
                version = Gem::Version.new(version)

                ansible_min, ansible_max = provision.ansible_ver

                if (version < ansible_min) || (version > ansible_max)
                    Utils.fail("Unsupported Ansible ver. #{version}, " \
                         "must be >= #{ansible_min} and <= #{ansible_max}")
                end

                return if provision.nil? || !provision.hci?

                unless system('ansible-galaxy --version >/dev/null')
                    Utils.fail('Missing ansible-galaxy')
                end

                return if system('git --version >/dev/null')

                Utils.fail('Missing git to checkout ceph-ansible')
            end

            def install_ansible_dependencies(provision)
                return unless provision.hci?

                unless File.directory?("#{CEPH_ANSIBLE_DIR}/roles")
                    ansible_dir = File.dirname(CEPH_ANSIBLE_DIR)
                    FileUtils.mkdir_p(ansible_dir) \
                        unless File.exist?(ansible_dir)

                    Driver.run('git clone --branch ' <<
                               "#{CEPH_ANSIBLE_BRANCH} " <<
                               "--depth 1 #{CEPH_ANSIBLE_URL} " <<
                               CEPH_ANSIBLE_DIR.to_s)
                end

                # with current ansible version we need both commands
                Driver.run('ansible-galaxy role install -r ' <<
                           '/usr/share/one/oneprovision/ansible/' <<
                           'hci-requirements.yml')

                Driver.run('ansible-galaxy collection install -r ' <<
                           '/usr/share/one/oneprovision/ansible/' <<
                           'hci-requirements.yml')
            end

            # TODO: expect multiple hosts
            # Configures host via ansible
            #
            # @param hosts   [OpenNebula::Host Array] Hosts to configure
            # @param hosts   [OpenNebula::Datastore array] Datastores for var
            # @param provision  [OpenNebula::Provision] Provision info
            # @param only_hosts [Array] Hostames - limit configure to them
            def configure(hosts, datastores = nil, provision = nil,
                          only_hosts = [])

                return if hosts.nil? || hosts.empty?

                Driver.retry_loop('Failed to configure hosts', provision) do
                    check_ansible_version(provision)

                    install_ansible_dependencies(provision)

                    # sets @inventories, @group_vars, @playbooks
                    dir = generate_ansible_configs(hosts, datastores, provision)

                    # extends @inventories, @group_vars
                    if provision.hci?
                        generate_ceph_ansible_configs(dir, hosts, provision)
                    end

                    # try_ssh + gather facts
                    try_ssh_and_gather_facts(dir)

                    OneProvisionLogger.info('Configuring hosts')

                    @playbooks.each do |playbook|
                        # build Ansible command
                        cmd = "ANSIBLE_CONFIG=#{dir}/ansible.cfg "
                        cmd << "ansible-playbook #{ANSIBLE_ARGS}"
                        @inventories.each {|i| cmd << " -i  #{i}" }
                        @group_vars.each  {|g| cmd << " -e @#{g}" }

                        # if adding host then first (main playbook)
                        # run on all hosts, others with `--limit ${only_hosts}`
                        cmd << " --limit #{only_hosts.join(',')}" \
                            if only_hosts && @playbooks.first != playbook

                        cmd << " #{ANSIBLE_LOCATION}/#{playbook}.yml"

                        o, _e, s = Driver.run(cmd, true)

                        if s && s.success? && playbook == @playbooks.last
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

                [0, @facts]
            end

            # Checks ssh connection
            #
            # @param ansible_dir [Dir] Directory with ansible information
            #
            # @return [Boolean] True if the ssh connection works
            def ansible_ssh(ansible_dir)
                # NOTE: We want only to check the working SSH connection, but
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
            def try_ssh_and_gather_facts(ansible_dir)
                OneProvisionLogger.info('Checking working SSH connection')

                if retry_ssh(ansible_dir)
                    @facts = gather_facts(ansible_dir)
                else
                    Driver.retry_loop 'SSH connection is failing' do
                        ansible_ssh(ansible_dir)
                    end
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

                        match = JSON.parse(Regexp.last_match(2))

                        msg   = match['msg']
                        msg   = match['reason'] if msg.nil?

                        text  = msg.strip.tr("\n", ' ')
                        text  = "- #{text}"
                    when /^fatal: \[([^\]]+)\]: .* =>/i
                        host = Regexp.last_match(1)
                    end

                    content = { :h => host, :t => task, :tx => text }

                    rtn << format('- %<h>s : TASK[%<t>s] %<tx>s', content)
                end

                rtn.join("\n")
            end

            # After ping to ssh also gather some basics facts from hosts
            # They are later reused to update OpenNebula resources:
            # hosts and vnets
            #
            # @param ansible_dir [String] Ansible directory
            #
            # @return [Hash] facts

            def gather_facts(ansible_dir)
                cmd = "ANSIBLE_CONFIG=#{ansible_dir}"
                cmd += '/ansible.cfg ANSIBLE_BECOME=false'
                cmd << " ansible #{ANSIBLE_ARGS}"
                cmd << " -i #{ansible_dir}/inventory"
                cmd << ' --one-line'
                cmd << " -m setup all -a 'gather_subset=network,hardware'"

                o, _e, s = Driver.run(cmd)
                raise OneProvisionLoopException if !s || !s.success?

                # ansbile output post-procesing, remove " | SUCCESS " suffix
                # create a hash like { "hostname" => { facts }, }
                begin
                    facts = {}
                    o.each_line do |line|
                        hostname, host_facts = line.split(' | SUCCESS => ')
                        facts[hostname] = JSON.parse(host_facts)
                    end
                rescue StandardError
                    raise OneProvisionLoopException
                end

                facts
            end

            # TODO: support different variables and
            #   connection parameters for each host
            # Generates ansible configurations
            #
            # @param hosts      [OpenNebula::Host array] Hosts to configure
            # @param datastores [OpenNebula::Datastore array] Datastores for var
            # @param provision  [OpenNebula::Datastore array] Provision for var
            #
            # @return [Dir] Directory with Ansible information
            def generate_ansible_configs(hosts, _datastores, _provision)
                ansible_dir = Dir.mktmpdir
                msg = "Generating Ansible configurations into #{ansible_dir}"

                OneProvisionLogger.debug(msg)

                # Generate 'inventory' file
                c = "[nodes]\n"

                hosts.each do |h|
                    host = Resource.object('hosts')
                    host.info(h['id'])

                    h_vars = host.one['TEMPLATE/ANSIBLE_HOST_VARS']

                    if h_vars
                        c << "#{host.one['NAME']} #{h_vars}\n"
                    else
                        c << "#{host.one['NAME']}\n"
                    end
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

                fname = "#{ansible_dir}/inventory"
                Driver.write_file_log(fname, c)
                @inventories = [fname]

                @group_vars = []

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

                if host.one['TEMPLATE/PROVISION/ANSIBLE_PLAYBOOK']
                    @playbooks = host.one['TEMPLATE/PROVISION/ANSIBLE_PLAYBOOK']
                    @playbooks = @playbooks.split(',')
                else
                    @playbooks = [ANSIBLE_INVENTORY_DEFAULT]
                end

                # Generate "ansible.cfg" file
                # TODO: what if private_key isn't filename, but content
                # TODO: store private key / equinix
                #   credentials securely in the ONE

                c = File.read("#{ANSIBLE_LOCATION}/ansible.cfg.erb")
                c = ERBVal.render_from_hash(c, :ans_loc => ANSIBLE_LOCATION)

                Driver.write_file_log("#{ansible_dir}/ansible.cfg", c)

                # TODO: site.yaml
                # logger(inventoryContent +
                #   File.open("#{$ANSIBLE_LOCATION}/site.yml").read(), true)

                ansible_dir
            end

            # Generate ceph inventory based on hosts and theirs ceph_groups,
            # add it to @inventories, also include ceph group_vars.yml to
            # @group_vars array
            #
            # @param ansible_dir [String]                 Ansible tmp dir
            # @param hosts       [OpenNebula::Host array] Hosts to configure
            # @param provision   [OpenNebula::Datastore array] Provision vars
            #
            # @return nil
            def generate_ceph_ansible_configs(ansible_dir, hosts, provision)
                ceph_inventory = \
                    {
                        'mons'    => { 'hosts' => {} },
                        'mgrs'    => { 'hosts' => {} },
                        'osds'    => { 'hosts' => {} },
                        'clients' => { 'hosts' => {},
                                       'vars'  => { 'copy_admin_key' => true } }
                    }

                hosts.each do |h|
                    host = Resource.object('hosts')
                    host.info(h['id'])

                    ceph_group = host.one['TEMPLATE/PROVISION/CEPH_GROUP']

                    case ceph_group
                    when 'osd,mon'
                        ceph_inventory['mons']['hosts'][host.one['NAME']] = nil
                        ceph_inventory['mgrs']['hosts'][host.one['NAME']] = nil
                        ceph_inventory['osds']['hosts'][host.one['NAME']] = nil
                    when 'osd'
                        ceph_inventory['osds']['hosts'][host.one['NAME']] = nil
                    when 'clients'
                        ceph_inventory['clients']['hosts'][host.one['NAME']] =
                            nil
                    end
                end

                fname = "#{ansible_dir}/ceph_inventory.yml"
                Driver.write_file_log(fname, YAML.dump(ceph_inventory))
                @inventories << fname

                # eval ceph group_vars template
                ceph_vars = File.read(
                    "#{ANSIBLE_LOCATION}/ceph_hci/group_vars.yml.erb"
                )
                yaml = provision.body['ceph_vars'].to_yaml.gsub!("---\n", '')

                ceph_vars = ERBVal.render_from_hash(
                    ceph_vars,
                    'vars' => yaml
                )

                fname = "#{ansible_dir}/ceph_group_vars.yml"
                Driver.write_file_log(fname, ceph_vars)
                @group_vars << fname
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
