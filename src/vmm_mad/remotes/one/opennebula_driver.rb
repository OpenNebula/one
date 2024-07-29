#!/usr/bin/env ruby
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
# -------------------------------------------------------------------------- #
ONE_LOCATION = ENV['ONE_LOCATION'] unless defined? ONE_LOCATION

if !ONE_LOCATION
    RUBY_LIB_LOCATION ||= '/usr/lib/one/ruby'
    GEMS_LOCATION     ||= '/usr/share/one/gems'
    ETC_LOCATION      ||= '/etc/one/'
    VAR_LOCATION      ||= '/var/lib/one/'
else
    RUBY_LIB_LOCATION ||= ONE_LOCATION + '/lib/ruby'
    GEMS_LOCATION     ||= ONE_LOCATION + '/share/gems'
    ETC_LOCATION      ||= ONE_LOCATION + '/etc/'
    VAR_LOCATION      ||= ONE_LOCATION + '/var/'
end

# Load credentials and environment
require 'yaml'

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

require 'CommandManager'
require 'scripts_common'
require 'rexml/document'
require 'VirtualMachineDriver'
require 'PublicCloudDriver'
require 'opennebula'

# The main class for the driver
class One2OneDriver

    include PublicCloudDriver

    LIMIT_DEFAULT   = '-1'
    LIMIT_UNLIMITED = '-2'

    UNLIMITED_CPU_VALUE = '100000'
    UNLIMITED_MEMORY_VALUE = '1073741824'

    # Local deploy ids will be formed with this prefix and the remote VM ID
    # DEPLOY_ID_PREFIX = "one-"
    DEPLOY_ID_PREFIX = 'opennebula-hybrid-'

    # Remote VM names will be formed with this prefix, plus the local VM ID
    REMOTE_NAME_PREFIX = 'remote-opennebula-'

    # constructor, loads credentials and endpoint
    def initialize(host, id = nil)
        @hypervisor = 'opennebula'
        @host = host
        @xmlhost = host_info(host, id)
        @public_cloud_conf = {}

        # create or open cache db
        @db = InstanceCache.new(File.join(VAR_LOCATION, 'remotes',
                                          'im', 'one.d', 'one-cache.db'))

        region = {}

        %w[user password endpoint capacity].each do |key|
            if key == 'capacity'
                region[key] = {}
                %w[cpu memory].each do |key_c|
                    xpath = "/HOST/TEMPLATE/ONE_#{key.upcase}/#{key_c.upcase}"
                    value = @xmlhost.retrieve_elements(xpath)[0]
                    if @xmlhost.retrieve_elements(xpath)[0].nil? || value == ''
                        raise "Region for host #{@xmlhost} does not have "\
                            "'#{key_c.upcase}' defined in host template"
                    end

                    region[key][key_c] = value.to_i
                end
            else
                xpath = "/HOST/TEMPLATE/ONE_#{key.upcase}"
                value = @xmlhost.retrieve_elements(xpath)[0]
                if @xmlhost.retrieve_elements(xpath)[0].nil? || value == ''
                    raise "Region for host #{@xmlhost} does not have "\
                        "'#{key.upcase}' defined in host template"
                end

                region[key] = value
            end
        end

        secret = "#{region['user']}:#{region['password']}"

        @client = OpenNebula::Client.new(secret, region['endpoint'],
                                         :sync => true)

        @cpu    = region['capacity']['cpu']
        @memory = region['capacity']['memory']

        @cpu    = 0 if @cpu.nil?
        @memory = 0 if @memory.nil?
    end

    def host_capacity(_xmlhost)
        user = OpenNebula::User.new_with_id('-1', @client)
        rc = user.info

        if OpenNebula.is_error?(rc)
            STDERR.puts("Error getting remote user information: #{rc.to_str}")
            exit(-1)
        end

        group = OpenNebula::Group.new_with_id('-1', @client)
        rc = group.info

        if OpenNebula.is_error?(rc)
            STDERR.puts("Error getting remote group information: #{rc.to_str}")
            exit(-1)
        end
        if @cpu != 0
            totalcpu = @cpu
        else
            u_cpu = user['VM_QUOTA/VM/CPU']
            g_cpu = group['VM_QUOTA/VM/CPU']

            if u_cpu == LIMIT_DEFAULT || u_cpu.nil?
                u_cpu = user['DEFAULT_USER_QUOTAS/VM_QUOTA/VM/CPU']
            end

            if g_cpu == LIMIT_DEFAULT || g_cpu.nil?
                g_cpu = group['DEFAULT_GROUP_QUOTAS/VM_QUOTA/VM/CPU']
            end

            u_cpu = LIMIT_UNLIMITED if u_cpu.nil?
            g_cpu = LIMIT_UNLIMITED if g_cpu.nil?

            u_cpu = UNLIMITED_CPU_VALUE if u_cpu == LIMIT_UNLIMITED
            g_cpu = UNLIMITED_CPU_VALUE if g_cpu == LIMIT_UNLIMITED

            totalcpu = ([u_cpu.to_f, g_cpu.to_f].min * 100).round
        end

        if @memory != 0
            totalmemory = @memory
        else
            u_memory = user['VM_QUOTA/VM/MEMORY']
            g_memory = group['VM_QUOTA/VM/MEMORY']

            if u_memory == LIMIT_DEFAULT || u_memory.nil?
                u_memory = user['DEFAULT_USER_QUOTAS/VM_QUOTA/VM/MEMORY']
            end

            if g_memory == LIMIT_DEFAULT || g_memory.nil?
                g_memory = group['DEFAULT_GROUP_QUOTAS/VM_QUOTA/VM/MEMORY']
            end

            u_memory = LIMIT_UNLIMITED if u_memory.nil?
            g_memory = LIMIT_UNLIMITED if g_memory.nil?

            u_memory = UNLIMITED_MEMORY_VALUE if u_memory == LIMIT_UNLIMITED
            g_memory = UNLIMITED_MEMORY_VALUE if g_memory == LIMIT_UNLIMITED

            totalmemory = [u_memory.to_i, g_memory.to_i].min
        end

        [totalcpu, totalmemory * 1024]
    end

    def instance_type_capacity(type)
        if type =~ %r{(\d+\.?\d*)cpu/(\d+)memory}
            cpu = (Regexp.last_match(1).to_f * 100).ceil
            memory = Regexp.last_match(2).to_i * 1024
            return [cpu, memory]
        end
        [0, 0]
    end

    def fetch_vms_data(with_monitoring: false)
        # rubocop:disable Layout/LineLength
        vmpool = OpenNebula::VirtualMachinePool.new(@client,
                                                    OpenNebula::VirtualMachinePool::INFO_ALL_VM)
        # rubocop:enable Layout/LineLength
        vmpool.info

        vms = []
        vmpool.each do |remote_vm|
            id = remote_vm['USER_TEMPLATE/REMOTE_OPENNEBULA_VM_ID'] || '-1'
            deploy_id = remote_vm['USER_TEMPLATE/REMOTE_OPENNEBULA_DEPLOY_ID'] \
                || "#{DEPLOY_ID_PREFIX}#{remote_vm.id}"
            cpu = remote_vm['TEMPLATE/CPU']
            memory = remote_vm['TEMPLATE/MEMORY']

            vm = { :id => id,
                   :uuid => deploy_id,
                   :deploy_id => deploy_id,
                   :name => remote_vm.name,
                   :state => vm_state(remote_vm),
                   :type => "#{cpu}cpu/#{memory}memory" }

            if with_monitoring
                vm[:monitor] = get_vm_monitor_data(remote_vm)
            end
            vms << vm
        end

        vms
    end

    def vm_state(vm)
        case vm.state_str
        when 'INIT' || 'PENDING' || 'HOLD' || 'CLONING'
            'RUNNING'
        when 'ACTIVE'
            case vm.lcm_state_str
            when /_FAILURE$/ || 'UNKNOWN'
                'FAILURE'
            else
                'RUNNING'
            end
        when 'STOPPED' || 'SUSPENDED'
            'SUSPENDED'
        when 'DONE' || 'POWEROFF' || 'UNDEPLOYED'
            'POWEROFF'
        when 'FAILED' || 'CLONING_FAILURE'
            'FAILURE'
        else
            'UNKNOWN'
        end
    end

    def get_vm_monitor_data(vm)
        data = vm.monitoring(%w[CPU DISKRDBYTES DISKRDIOPS DISKWRBYTES
                                DISKWRIOPS MEMORY NETRX NETTX])

        # take only last monitoring entry
        # TODO: verify timestamp is fresh
        data = data.map do |key, entries|
            [key, entries.last.is_a?(Array) ? entries.last.last : 0]
        end.to_h

        data = hash_to_template(data, '', '', "\n")

        Base64.encode64(data).gsub("\n", '')
    end

    # DEPLOY action, also sets ports and ip if needed
    def deploy(id, host, xml_text, lcm_state, deploy_id)
        if %w[BOOT BOOT_FAILURE].include? lcm_state
            one_info = get_deployment_info(host, xml_text)

            # load_default_template_values

            tid = one_value(one_info, 'TEMPLATE_ID')

            if tid.nil? || tid == ''
                STDERR.puts('Cannot find TEMPLATE_ID in deployment file')
                exit(-1)
            end

            extra_template = "REMOTE_OPENNEBULA = YES\n"\
                             "REMOTE_OPENNEBULA_VM_ID = #{id}\n"

            # The OpenNebula context will be included
            xml = OpenNebula::XMLElement.new
            xml.initialize_xml(xml_text, 'VM')

            if xml.has_elements?('TEMPLATE/CONTEXT')
                # Since there is only 1 level ',' will not be added
                context_str = xml.template_like_str('TEMPLATE/CONTEXT')

                if xml['TEMPLATE/CONTEXT/TOKEN'] == 'YES'
                    # TODO: use OneGate library. See ec2_driver.rb
                    token_str = generate_onegate_token(xml)
                    if token_str
                        context_str << "\nONEGATE_TOKEN=\"#{token_str}\""
                    end
                end

                extra_template << context_str
            end

            t = OpenNebula::Template.new_with_id(tid, @client)
            rc = t.instantiate(REMOTE_NAME_PREFIX+id, true, extra_template,
                               false)

            if OpenNebula.is_error?(rc)
                STDERR.puts(rc.to_str)
                exit(-1)
            end

            deploy_id = "#{DEPLOY_ID_PREFIX}#{rc}"
            vm = get_remote_vm(deploy_id)

            if !context_str.nil?
                new_context_update = 'CONTEXT = [' << context_str << ']'
                new_context_update = new_context_update.gsub("\n", ",\n")
                rc = vm.updateconf(new_context_update)
            end

            if OpenNebula.is_error?(rc)
                STDERR.puts(rc.to_str)
                exit(-1)
            end

            vm.release

            rc = vm.update("REMOTE_OPENNEBULA_DEPLOY_ID = \"#{deploy_id}\"",
                           true)

            if OpenNebula.is_error?(rc)
                STDERR.puts('Error adding REMOTE_OPENNEBULA_DEPLOY_ID ' \
                            "attribute to VM #{rc}: #{rc.to_str}")
            end

            puts(deploy_id)
        else
            restore(deploy_id)
            deploy_id
        end
    end

    # Shutdown an instance
    def shutdown(deploy_id, lcm_state)
        vm = get_remote_vm(deploy_id)

        case lcm_state
        when 'SHUTDOWN'
            rc = vm.terminate
        when 'SHUTDOWN_POWEROFF'
            rc = vm.poweroff
        when 'SHUTDOWN_UNDEPLOY'
            rc = vm.undeploy
        end

        return unless OpenNebula.is_error?(rc)

        STDERR.puts(rc.to_str)
        exit(-1)
    end

    # Reboot an instance
    def reboot(deploy_id)
        vm = get_remote_vm(deploy_id)
        rc = vm.reboot

        return unless OpenNebula.is_error?(rc)

        STDERR.puts(rc.to_str)
        exit(-1)
    end

    # Reboot (hard) an instance
    def reset(deploy_id)
        vm = get_remote_vm(deploy_id)
        rc = vm.reboot(true)

        return unless OpenNebula.is_error?(rc)

        STDERR.puts(rc.to_str)
        exit(-1)
    end

    # Cancel an instance
    def cancel(deploy_id, lcm_state)
        vm = get_remote_vm(deploy_id)

        case lcm_state
        when 'SHUTDOWN'
            rc = vm.terminate(true)
        when 'SHUTDOWN_POWEROFF'
            rc = vm.poweroff(true)
        when 'SHUTDOWN_UNDEPLOY'
            rc = vm.undeploy(true)
        end

        return unless OpenNebula.is_error?(rc)

        STDERR.puts(rc.to_str)
        exit(-1)
    end

    # Save an instance
    def save(deploy_id)
        vm = get_remote_vm(deploy_id)

        rc = vm.suspend

        return unless OpenNebula.is_error?(rc)

        STDERR.puts(rc.to_str)
        exit(-1)
    end

    # Resumes an instance
    def restore(deploy_id)
        vm = get_remote_vm(deploy_id)
        rc = vm.resume

        return unless OpenNebula.is_error?(rc)

        STDERR.puts(rc.to_str)
        exit(-1)
    end

    #---------------------------------------------------------------------------
    #  Monitor Interface
    #---------------------------------------------------------------------------
    def probe_host_system
        # call probe_host_system from PublicCloudDriver module
        super(@db, 180, @xmlhost)
    end

    def probe_host_monitor
        # call probe_host_monitor from PublicCloudDriver module
        super(@db, 180, @xmlhost)
    end

    def retreive_vms_data
        # call vms_data from PublicCloudDriver module
        vms_data(@db, 180)
    end

    private

    # Get the OpenNebula hybrid section of the template. With more than one
    # section the HOST element is used and matched with the host
    def get_deployment_info(host, xml_text)
        xml = REXML::Document.new xml_text

        one = nil

        all_one_elements = xml.root.get_elements('//USER_TEMPLATE/PUBLIC_CLOUD')

        # First, let's see if we have an one site that matches
        # our desired host name
        all_one_elements.each do |element|
            cloud = element.elements['HOST']
            if cloud && cloud.text.upcase == host.upcase
                one = element
            end
        end

        if !one
            # If we don't find the one site, and ONE just
            # knows about one one site, let's use that
            if all_one_elements.size == 1
                one = all_one_elements[0]
            else
                STDERR.puts('Cannot find PUBLIC_CLOUD element in deployment '\
                    ' file or no HOST site matching the requested in the '\
                    'template.')
                exit(-1)
            end
        end

        one
    end

    # Returns the value of the xml specified by the name or the default
    # one if it does not exist
    # +xml+: REXML Document, containing one hybrid information
    # +name+: String, xpath expression to retrieve the value
    # +block+: Block, block to be applied to the value before returning it
    def one_value(xml, name, &block)
        value = value_from_xml(xml, name) || @defaults[name]
        if block_given? && value
            block.call(value)
        else
            value
        end
    end

    def value_from_xml(xml, name)
        return unless xml

        element = xml.elements[name]
        element.text.strip if element && element.text
    end

    # Load the default values that will be used to create a new instance, if
    # not provided in the template. These values are defined in the
    # ONE_DRIVER_DEFAULT file
    def load_default_template_values
        @defaults = {}

        return unless File.exist?(ONE_DRIVER_DEFAULT)

        fd  = File.new(ONE_DRIVER_DEFAULT)
        xml = REXML::Document.new fd
        fd.close

        return if !xml || !xml.root

        xml.elements.each('/TEMPLATE/PUBLIC_CLOUD/*') do |e|
            @defaults[e.name] = e.text
        end
    end

    # Retrive the vm object for the remote opennebula
    def get_remote_vm(deploy_id)
        begin
            match = deploy_id.match(/#{DEPLOY_ID_PREFIX}(.*)/)

            if match.nil?
                raise "Deploy ID #{deploy_id} was not created with this driver"
            end

            id = match[1]

            OpenNebula::VirtualMachine.new_with_id(id, @client)
        rescue StandardError => e
            STDERR.puts e.message
            exit(-1)
        end
    end

    # TODO: move this method to a OneGate library. See ec2_driver.rb
    def generate_onegate_token(xml)
        # Create the OneGate token string
        vmid_str  = xml['ID']
        stime_str = xml['STIME']
        str_to_encrypt = "#{vmid_str}:#{stime_str}"

        user_id = xml['TEMPLATE/CREATED_BY']

        if user_id.nil?
            STDERR.puts do
                "VMID:#{vmid} CREATED_BY not present" \
                 ' in the VM TEMPLATE'
            end
            return
        end

        user = OpenNebula::User.new_with_id(user_id,
                                            OpenNebula::Client.new)
        rc     = user.info

        if OpenNebula.is_error?(rc)
            STDERR.puts do
                "VMID:#{vmid} user.info" \
                 " error: #{rc.message}"
            end
            return
        end

        token_password = user['TEMPLATE/TOKEN_PASSWORD']

        if token_password.nil?
            STDERR.puts do
                "VMID:#{vmid} TOKEN_PASSWORD not present"\
                 " in the USER:#{user_id} TEMPLATE"
            end
            return
        end

        cipher = OpenSSL::Cipher::Cipher.new('aes-256-cbc')
        cipher.encrypt
        cipher.key = token_password
        onegate_token = cipher.update(str_to_encrypt)
        onegate_token << cipher.final

        Base64.encode64(onegate_token).chop
    end

end

###########################################################################
#  Module Interface
#  Interface for probe_db - VirtualMachineDB
############################################################################
module DomainList

    def self.state_info(name, id)
        one2one_drv = One2OneDriver.new(name, id)

        vms = one2one_drv.retreive_vms_data

        info = {}
        vms.each do |vm|
            info[vm[:uuid]] = { :id        => vm[:id],
                                :uuid      => vm[:uuid],
                                :deploy_id => vm[:deploy_id],
                                :name      => vm[:name],
                                :state     => vm[:state],
                                :hyperv    => 'opennebula' }
        end

        info
    end

end
