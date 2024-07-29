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

ONE_LOCATION ||= ENV['ONE_LOCATION'] unless defined? ONE_LOCATION

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

EC2_DRIVER_CONF    = "#{ETC_LOCATION}/ec2_driver.conf"
EC2_DRIVER_DEFAULT = "#{ETC_LOCATION}/ec2_driver.default"
EC2_DATABASE_PATH  = "#{VAR_LOCATION}/remotes/im/ec2.d/ec2-cache.db"

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

# Load EC2 credentials and environment
require 'yaml'
require 'rubygems'
require 'uri'
require 'resolv'

require 'CommandManager'
require 'scripts_common'
require 'rexml/document'
require 'VirtualMachineDriver'
require 'PublicCloudDriver'
require 'opennebula'

#-------------------------------------------------------------------------------
# The main class for the EC2 driver
#-------------------------------------------------------------------------------
class EC2Driver

    include PublicCloudDriver

    # --------------------------------------------------------------------------
    # Constants
    # --------------------------------------------------------------------------

    POLL_ATTRIBUTE = VirtualMachineDriver::POLL_ATTRIBUTE

    # EC2 commands constants
    EC2 = {
        :run => {
            :cmd => :create,
            :args => {
                'AKI' => {
                    :opt => 'kernel_id'
                },
                'AMI' => {
                    :opt => 'image_id'
                },
                'BLOCKDEVICEMAPPING' => {
                    :opt => 'block_device_mappings',
                    :proc => lambda {|str|
                        str.split(' ').collect do |s|
                            dev, tmp = s.split('=')
                            hash = {}
                            hash[:device_name] = dev
                            if tmp == 'none'
                                hash[:no_device] = dev
                            else
                                hash[:ebs] = {}
                                tmp_a = tmp.split(':')

                                if tmp_a[0] && !tmp_a[0].empty?
                                    hash[:ebs][:snapshot_id] = tmp_a[0]
                                end

                                if tmp_a[1] && !tmp_a[1].empty?
                                    hash[:ebs][:volume_size] = tmp_a[1].to_i
                                end

                                if tmp_a[2] == 'false'
                                    hash[:ebs][:delete_on_termination] = false
                                elsif tmp_a[2] == 'true'
                                    hash[:ebs][:delete_on_termination] = true
                                end

                                if tmp_a[3] && !tmp_a[3].empty?
                                    hash[:ebs][:volume_type] = tmp_a[3]
                                end

                                if tmp_a[4] && !tmp_a[4].empty?
                                    hash[:ebs][:iops] = tmp_a[4].to_i
                                end
                            end
                            hash
                        end
                    }
                },
                'CLIENTTOKEN' => {
                    :opt => 'client_token'
                },
                'INSTANCETYPE' => {
                    :opt => 'instance_type'
                },
                'KEYPAIR' => {
                    :opt => 'key_name'
                },
                'LICENSEPOOL' => {
                    :opt => 'license/pool'
                },
                'PLACEMENTGROUP' => {
                    :opt => 'placement/group_name'
                },
                'PRIVATEIP' => {
                    :opt => 'private_ip_address'
                },
                'RAMDISK' => {
                    :opt => 'ramdisk_id'
                },
                'SUBNETID' => {
                    :opt => 'subnet_id'
                },
                'TENANCY' => {
                    :opt => 'placement/tenancy'
                },
                'USERDATA' => {
                    :opt => 'user_data'
                },
                # "USERDATAFILE" => {
                #    :opt => '-f'
                # },
                'SECURITYGROUPS' => {
                    :opt => 'security_groups',
                    :proc => ->(str) { str.split(/,\s*/) }
                },
                'SECURITYGROUPIDS' => {
                    :opt => 'security_group_ids',
                    :proc => ->(str) { str.split(/,\s*/) }
                },
                'AVAILABILITYZONE' => {
                    :opt => 'placement/availability_zone'
                },
                'EBS_OPTIMIZED' => {
                    :opt => 'ebs_optimized',
                    :proc => ->(str) { str.downcase.eql? 'true' }
                }
            }
        },
        :terminate => {
            :cmd => :terminate
        },
        :describe => {
            :cmd => :describe_instances
        },
        :associate => {
            :cmd => :associate_address,
            :args => {
                # "SUBNETID"  => {
                #    :opt  => '-a',
                #    :proc => lambda {|str| ''}
                # },
                'ELASTICIP' => {
                    :opt => 'public_ip'
                }
            }
        },
        :authorize => {
            :cmd => :authorize,
            :args => {
                'AUTHORIZEDPORTS' => {
                    :opt => '-p',
                    :proc => ->(str) { str.split(',').join(' -p ') }
                }
            }
        },
        :reboot => {
            :cmd => :reboot
        },
        :stop => {
            :cmd => :stop
        },
        :start => {
            :cmd => :start
        },
        :tags => {
            :cmd => :create_tags,
            :args => {
                'TAGS' => {
                    :opt  => 'tags',
                    :proc => lambda {|str|
                        hash = {}
                        str.split(',').each do |s|
                            k, v = s.split('=')
                            hash[k] = v
                        end
                        hash
                    }
                }
            }
        }
    }

    # EC2 attributes that will be retrieved in a polling action
    EC2_POLL_ATTRS = [
        :public_dns_name,
        :private_dns_name,
        :key_name,
        # not available as a method, should get placement/availability_zone
        # :availability_zone,
        :platform,
        :vpc_id,
        :private_ip_address,
        :public_ip_address,
        :subnet_id,
        :security_groups,
        :instance_type,
        :image_id
    ]

    DEFAULTS = {
        :state_wait_pm_timeout_seconds => 1500,
        :cw_expire                     => 360,
        :cache_expire                  => 120
    }

    STATE_MAP = {
        'pending'       => 'RUNNING',
        'running'       => 'RUNNING',
        'shutting-down' => 'POWEROFF',
        'terminated'    => 'POWEROFF'
    }

    # --------------------------------------------------------------------------
    # EC2 constructor, loads credentials and endpoint
    #   @param [String] name of host in OpenNebula
    #   @param [String] ID of host in OpenNebula
    # --------------------------------------------------------------------------
    def initialize(host, id = nil)
        @hypervisor = 'ec2'
        @host = host

        load_conf = YAML.safe_load(File.read(EC2_DRIVER_CONF), [Symbol])
        @ec2_conf = DEFAULTS
        @ec2_conf.merge!(load_conf)

        @instance_types = @ec2_conf[:instance_types]

        # ----------------------------------------------------------------------
        # Init OpenNebula host information
        # ----------------------------------------------------------------------
        @xmlhost = host_info(host, id)
        @state_change_timeout = @ec2_conf[:state_wait_timeout_seconds].to_i

        @access_key = @xmlhost['TEMPLATE/EC2_ACCESS']
        @secret_key = @xmlhost['TEMPLATE/EC2_SECRET']
        @region_name = @xmlhost['TEMPLATE/REGION_NAME']

        # sanitize region data
        raise "access_key_id not defined for #{host}" if @access_key.nil?
        raise "secret_access_key not defined for #{host}" if @secret_key.nil?
        raise "region_name not defined for #{host}" if @region_name.nil?

        # ----------------------------------------------------------------------
        # create or open cache db
        # ----------------------------------------------------------------------
        @db = InstanceCache.new(EC2_DATABASE_PATH)
    end

    #---------------------------------------------------------------------------
    # Load AWS sdk and connect
    #---------------------------------------------------------------------------
    def ec2_connect
        require 'aws-sdk-ec2'
        require 'aws-sdk-cloudwatch'

        Aws.config.merge!({ :access_key_id     => @access_key,
                            :secret_access_key => @secret_key,
                            :region            => @region_name })

        if (proxy_uri = @ec2_conf[:proxy_uri])
            Aws.config(:proxy_uri => proxy_uri)
        end

        @ec2 = Aws::EC2::Resource.new
    end

    # --------------------------------------------------------------------------
    # DEPLOY action, also sets ports and ip if needed
    # --------------------------------------------------------------------------
    def deploy(id, host, xml_text, lcm_state, deploy_id)
        ec2_connect

        # Restore if we need to
        if lcm_state != 'BOOT' && lcm_state != 'BOOT_FAILURE'
            restore(deploy_id)
            return deploy_id
        end

        # Otherwise deploy the VM

        begin
            ec2_info = get_deployment_info(host, xml_text)
        rescue StandardError => e
            raise e
        end

        load_default_template_values

        if !ec2_value(ec2_info, 'AMI')
            raise 'Cannot find AMI in deployment file'
        end

        opts = generate_options(:run, ec2_info, { :min_count => 1,
                                                  :max_count => 1 })

        # The OpenNebula context will be only included if not USERDATA
        # is provided by the user
        if !ec2_value(ec2_info, 'USERDATA')
            xml = OpenNebula::XMLElement.new
            xml.initialize_xml(xml_text, 'VM')

            if xml.has_elements?('TEMPLATE/CONTEXT')
                # if requested, we generated cloud-init compatible data
                if ec2_value(ec2_info, 'CLOUD_INIT') =~ /^(yes|true)$/i
                    context_str = generate_cc(xml, 'TEMPLATE/CONTEXT')
                else
                    # Since there is only 1 level ',' will not be added
                    context_str = xml.template_like_str('TEMPLATE/CONTEXT')

                    if xml['TEMPLATE/CONTEXT/TOKEN'] == 'YES'
                        # TODO: use OneGate library
                        token_str = generate_onegate_token(xml)
                        if token_str
                            context_str << "\nONEGATE_TOKEN=\"#{token_str}\""
                        end
                    end
                end

                userdata_key = EC2[:run][:args]['USERDATA'][:opt]
                opts[userdata_key] = Base64.encode64(context_str)
            end
        end

        instances = @ec2.create_instances(opts)
        instance = instances.first

        start_time = Time.now

        loop do
            break if instance.exists?

            raise 'Instance initialization timeouted' \
                if Time.now - start_time > @state_change_timeout

            sleep 2
        end

        tags = generate_options(:tags, ec2_info)[:tags] || {}

        tag_array = []
        tags.each do |key, value|
            tag_array << {
                :key => key,
                :value => value
            }
        end

        instance.create_tags(:tags => tag_array) unless tag_array.empty?

        elastic_ip = ec2_value(ec2_info, 'ELASTICIP')

        wait_state('running', instance.id)

        if elastic_ip

            if elastic_ip.match(Resolv::IPv4::Regex)
                address_key = :public_ip
            else
                address_key = :allocation_id
            end

            address = {
                :instance_id    => instance.id,
                address_key     => elastic_ip
            }

            @ec2.client.associate_address(address)
        end

        instance.create_tags(:tags => [{:key => 'ONE_ID', :value => id}])

        puts(instance.id)
    end

    # --------------------------------------------------------------------------
    # Shutdown a EC2 instance
    # --------------------------------------------------------------------------
    def shutdown(deploy_id, lcm_state)
        ec2_connect

        case lcm_state
        when 'SHUTDOWN'
            ec2_action(deploy_id, :terminate)
            wait_state('terminated', deploy_id)
        when 'SHUTDOWN_POWEROFF', 'SHUTDOWN_UNDEPLOY'
            ec2_action(deploy_id, :stop)
            wait_state('stopped', deploy_id)
        end
    end

    # --------------------------------------------------------------------------
    # Reboot a EC2 instance
    # --------------------------------------------------------------------------
    def reboot(deploy_id)
        ec2_connect

        ec2_action(deploy_id, :reboot)
        wait_state('running', deploy_id)
    end

    # --------------------------------------------------------------------------
    # Cancel a EC2 instance
    # --------------------------------------------------------------------------
    def cancel(deploy_id, lcm_state = nil)
        ec2_connect

        case lcm_state
        when 'SHUTDOWN_POWEROFF', 'SHUTDOWN_UNDEPLOY'
            ec2_action(deploy_id, :stop)
            wait_state('stopped', deploy_id)
        else
            ec2_action(deploy_id, :terminate)
            wait_state('terminated', deploy_id)
        end
    end

    # --------------------------------------------------------------------------
    # Resumes a EC2 instance
    # --------------------------------------------------------------------------
    def restore(deploy_id)
        ec2_connect

        ec2_action(deploy_id, :start)
        wait_state('running', deploy_id)
    end

    # --------------------------------------------------------------------------
    # Resets a EC2 instance
    # --------------------------------------------------------------------------
    def reset(deploy_id)
        ec2_connect

        ec2_action(deploy_id, :stop)
        wait_state('stopped', deploy_id)

        ec2_action(deploy_id, :start)
        wait_state('running', deploy_id)
    end

    def poll(_id, deploy_id)
        fetch_vms_data(:deploy_id => deploy_id, :with_monitoring => true)
    end

    #---------------------------------------------------------------------------
    #  Monitor Interface
    #---------------------------------------------------------------------------
    def probe_host_system
        # call probe_host_system from PublicCloudDriver module
        super(@db, @ec2_conf[:cache_expire], @xmlhost)
    end

    def probe_host_monitor
        # call probe_host_monitor from PublicCloudDriver module
        super(@db, @ec2_conf[:cache_expire], @xmlhost)
    end

    def retreive_vms_data
        # call vms_data from PublicCloudDriver module
        vms_data(@db, @ec2_conf[:cache_expire])
    end

    #---------------------------------------------------------------------------
    # Parse template instance type into
    # Amazon ec2 format (M1SMALL => m1.small)
    #---------------------------------------------------------------------------
    def parse_inst_type(type)
        type.downcase.gsub('_', '.')
    end

    #---------------------------------------------------------------------------
    #
    #---------------------------------------------------------------------------
    private

    # Generate cloud-init configuration based on context variables
    def generate_cc(xobj, xpath_context)
        cc = "#cloud-config\n"

        ssh_key = xobj["#{xpath_context}/SSH_PUBLIC_KEY"]
        if ssh_key
            cc << "ssh_authorized_keys:\n"
            ssh_key.split("\n").each do |key|
                cc << "- #{key}\n"
            end
        end

        cc
    end

    # Get the associated capacity of the instance_type as cpu (in 100 percent
    # e.g. 800) and memory (in KB)
    def instance_type_capacity(name)
        return 0, 0 if @instance_types[name].nil?

        [(@instance_types[name]['cpu'].to_f * 100).to_i,
         (@instance_types[name]['memory'].to_f * 1024 * 1024).to_i]
    end

    # Get the EC2 section of the template. If more than one EC2 section
    # the CLOUD element is used and matched with the host
    def get_deployment_info(host, xml_text)
        xml = REXML::Document.new xml_text

        ec2 = nil
        ec2_deprecated = nil

        all_ec2_elements = xml.root.get_elements('//USER_TEMPLATE/PUBLIC_CLOUD')

        # First, let's see if we have an EC2 site that matches
        # our desired host name
        all_ec2_elements.each do |element|
            cloud=element.elements['HOST']
            if cloud && cloud.text.upcase == host.upcase
                ec2 = element
            else
                cloud=element.elements['CLOUD']
                if cloud && cloud.text.upcase == host.upcase
                    ec2_deprecated = element
                end
            end
        end

        ec2 ||= ec2_deprecated

        if !ec2
            # If we don't find the EC2 site, and ONE just
            # knows about one EC2 site, let's use that
            if all_ec2_elements.size == 1
                ec2 = all_ec2_elements[0]
            else
                raise 'Cannot find PUBLIC_CLOUD element in deployment '\
                      ' file or no HOST site matching the requested in the '\
                      ' template.'
            end
        end

        ec2
    end

    # Return state of the instance (ONE state)
    def vm_state(instance)
        if !instance.exists?
            'UNKNOWN'
        else
            STATE_MAP[instance.state.name] || 'UNKNOWN'
        end
    end

    def get_last_mon(vm, xpath)
        data = vm.monitoring(xpath)

        # return [-2] next-to-last entry, last is always nil placeholder
        data.map {|key, entries| [key, entries[-2].last] }.to_h
    end

    # --------------------------------------------------------------------------
    # get instance details
    #   @param [AWS instance]
    #   @param [OpenNebula Virtual Machine] - to retreive last cloudwatch
    #
    #   return [String]   base64 encoded string of VM monitoring data
    #                     and public cloud variables
    # --------------------------------------------------------------------------
    def get_vm_details(instance, onevm)
        begin
            if onevm
                onevm.info
                if onevm['MONITORING/LAST_CW']
                    cw_mon_time = onevm['MONITORING/LAST_CW'].to_i
                else
                    cw_mon_time = 0
                end

                do_cw = (Time.now.to_i - cw_mon_time) >= @ec2_conf[:cw_expire]

                if do_cw
                    cloudwatch_str = \
                        cloudwatch_monitor_info(instance.instance_id,
                                                onevm,
                                                cw_mon_time)

                    cloudwatch_str += " LAST_CW=#{Time.now.to_i} "
                else

                    previous_data = get_last_mon(onevm,
                                                 %w[CPU NETRX NETTX])

                    previous_cpu =  previous_data['CPU'] || 0
                    previous_netrx = previous_data['NETRX'] || 0
                    previous_nettx = previous_data['NETTX'] || 0

                    cloudwatch_str = "CPU=#{previous_cpu} "\
                        "NETTX=#{previous_nettx} "\
                        "NETRX=#{previous_netrx} "\
                        "LAST_CW=#{cw_mon_time} "

                end
            else
                cloudwatch_str = ''
            end

            mem = onevm['TEMPLATE/MEMORY'].to_s
            mem = mem.to_i*1024
            info = "#{POLL_ATTRIBUTE[:memory]}=#{mem} #{cloudwatch_str}"

            EC2_POLL_ATTRS.map do |key|
                value = instance.send(key)
                next unless !value.nil? && !value.empty?

                if value.is_a?(Array)
                    value = value.map do |v|
                        v.group_id if v.is_a?(Aws::EC2::Types::GroupIdentifier)
                    end.join(',')
                end

                # info << "AWS_#{key.to_s.upcase}=\"#{URI.encode(value)}\" "
                info << "AWS_#{key.to_s.upcase}=\"#{CGI.escape(value)}\" "
            end
        rescue StandardError
            # Unkown state if exception occurs retrieving information from
            # an instance
            info = "#{POLL_ATTRIBUTE[:state]}=UNKNOWN"
        end
        Base64.encode64(info).gsub("\n", '')
    end

    # --------------------------------------------------------------------------
    # Fetch vms data
    #   @param deploy_id [String]  of the reuqested VM or nil for ALL
    #   @param with_monitoring [Boolean] include monitoring and cloud info
    #
    #   return [Array] of VM Hashes
    # --------------------------------------------------------------------------
    def fetch_vms_data(deploy_id: nil, with_monitoring: false)
        fetch_all = deploy_id.nil?

        ec2_connect

        work_q = Queue.new

        onevm_info = {}
        if fetch_all
            # Build an array of VMs and last_polls for monitoring
            # rubocop:disable Layout/LineLength
            vpool = OpenNebula::VirtualMachinePool.new(OpenNebula::Client.new,
                                                       OpenNebula::VirtualMachinePool::INFO_ALL_VM)
            vpool.info

            vpool.each do |vm|
                onevm_info[vm.deploy_id] = vm
            end

            @ec2.instances.each {|i| work_q.push i }
        else
            # The same but just for a single VM
            one_vm = OpenNebula::VirtualMachine.new_with_id(deploy_id,
                                                            OpenNebula::Client.new)
            one_vm.info
            onevm_info[deploy_id] = one_vm

            work_q.push get_instance(deploy_id)
            # rubocop:enable Layout/LineLength
        end

        vms = []
        workers = (0...[work_q.length, 20].min).map do
            Thread.new do
                begin
                    while (i = work_q.pop(true))
                        vm_state = vm_state(i)
                        next if vm_state != 'RUNNING'

                        one_id = i.tags.find {|t| t.key == 'ONE_ID' }
                        one_id = one_id.value if one_id

                        vm = { :uuid      => i.instance_id,
                               :id        => one_id || -1,
                               :name      => i.instance_id,
                               :deploy_id => i.instance_id,
                               :type      => i.instance_type,
                               :state     => vm_state }

                        if with_monitoring
                            vm[:monitor] = get_vm_details(i, onevm_info[i.id])
                        end

                        vms << vm
                    end
                rescue ThreadError
                    nil
                rescue StandardError
                    raise
                end
            end
        end
        workers.map(&:join)

        @db.insert(vms) if fetch_all

        vms
    end

    # Execute an EC2 command
    # +deploy_id+: String, VM id in EC2
    # +ec2_action+: Symbol, one of the keys of the EC2 hash constant (i.e :run)
    def ec2_action(deploy_id, ec2_action)
        begin
            i = get_instance(deploy_id)
            i.send(EC2[ec2_action][:cmd])
        rescue StandardError => e
            raise e
        end
    end

    # Generate the options for the given command from the xml provided in the
    #   template. The available options for each command are defined in the EC2
    #   constant
    def generate_options(action, xml, extra_params = {})
        opts = extra_params || {}

        if EC2[action][:args]
            EC2[action][:args].each do |k, v|
                str = ec2_value(xml, k, &v[:proc])
                next unless str

                tmp = opts
                last_key = nil
                v[:opt].split('/').each do |key|
                    k = key.to_sym
                    tmp = tmp[last_key] if last_key
                    tmp[k] = {}
                    last_key = k
                end
                tmp[last_key] = str
            end
        end

        opts
    end

    # Returns the value of the xml specified by the name or the default
    # one if it does not exist
    # +xml+: REXML Document, containing EC2 information
    # +name+: String, xpath expression to retrieve the value
    # +block+: Block, block to be applied to the value before returning it
    def ec2_value(xml, name, &block)
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

    # Waits until ec2 machine reach the desired state
    # +state+: String, is the desired state, needs to be a real state of Amazon
    #          ec2:  running, stopped, terminated, pending
    # +deploy_id+: String, VM id in EC2
    def wait_state(state, deploy_id)
        ready = (state == 'stopped') || (state == 'pending') \
            || (state == 'running') || (state == 'terminated')
        raise 'Waiting for an invalid state' unless ready

        t_init = Time.now
        loop do
            wstate = get_instance(deploy_id).state.name rescue nil

            raise 'Ended in invalid state' \
                if Time.now - t_init > @state_change_timeout

            sleep 3
            break if wstate == state
        end
    end

    # Load the default values that will be used to create a new instance, if
    # not provided in the template. These values are defined in the EC2_CONF
    # file
    def load_default_template_values
        return unless File.exist?(EC2_DRIVER_DEFAULT)

        @defaults = {}
        fd  = File.new(EC2_DRIVER_DEFAULT)
        xml = REXML::Document.new fd
        fd.close

        return if !xml || !xml.root

        ec2 = xml.root.elements['PUBLIC_CLOUD']

        return unless ec2

        EC2.each do |_action, hash|
            next unless hash[:args]

            hash[:args].each do |key, _value|
                @defaults[key.to_sym] = value_from_xml(ec2, key)
            end
        end
    end

    # Retrieve the instance from EC2
    def get_instance(id)
        inst = @ec2.instance(id)
        raise "Instance #{id} does not exist" unless inst.exists?

        inst
    end

    # Extract monitoring information from Cloud Watch
    # CPU, NETTX and NETRX
    def cloudwatch_monitor_info(id, onevm, cw_mon_time)
        cw=Aws::CloudWatch::Client.new

        # CPU
        begin
            cpu = get_cloudwatch_metric(cw,
                                        'CPUUtilization',
                                        cw_mon_time,
                                        ['Average'],
                                        'Percent',
                                        id)
            if !cpu[:datapoints].empty?
                cpu = cpu[:datapoints][-1][:average]
            else
                cpu = onevm['MONITORING/CPU'] || 0
            end
            cpu = cpu.to_f.round(2).to_s
        rescue StandardError => e
            OpenNebula.log_error(e.message)
        end

        # NETTX
        nettx = 0
        begin
            nettx_dp = get_cloudwatch_metric(cw,
                                             'NetworkOut',
                                             cw_mon_time,
                                             ['Sum'],
                                             'Bytes',
                                             id)[:datapoints]
            previous_nettx = onevm['/VM/MONITORING/NETTX']
            previous_nettx ? nettx = previous_nettx.to_i : nettx = 0

            nettx_dp.each  do |dp|
                nettx += dp[:sum].to_i
            end
        rescue StandardError => e
            OpenNebula.log_error(e.message)
        end

        # NETRX
        netrx = 0
        begin
            netrx_dp = get_cloudwatch_metric(cw,
                                             'NetworkIn',
                                             cw_mon_time,
                                             ['Sum'],
                                             'Bytes',
                                             id)[:datapoints]
            previous_netrx = onevm['/VM/MONITORING/NETRX']
            previous_netrx ? netrx = previous_netrx.to_i : netrx = 0

            netrx_dp.each  do |dp|
                netrx += dp[:sum].to_i
            end
        rescue StandardError => e
            OpenNebula.log_error(e.message)
        end

        "CPU=#{cpu} NETTX=#{nettx} NETRX=#{netrx} "
    end

    # Get metric from AWS/EC2 namespace from the last poll
    # rubocop:disable Metrics/ParameterLists
    def get_cloudwatch_metric(cw, metric_name, last_poll, statistics, units, id)
        dt = 60 # period
        t0 = (Time.at(last_poll.to_i)-65) # last poll time
        t = (Time.now-60) # actual time

        while (t - t0)/dt >= 1440 do dt+=60 end

        options={ :namespace=>'AWS/EC2',
                 :metric_name=>metric_name,
                 :start_time=> t0.iso8601,
                 :end_time=> t.iso8601,
                 :period=>dt,
                 :statistics=>statistics,
                 :unit=>units,
                 :dimensions=>[{ :name=>'InstanceId', :value=>id }] }

        cw.get_metric_statistics(options)
    end
    # rubocop:enable Metrics/ParameterLists

    # TODO: move this method to a OneGate library
    def generate_onegate_token(xml)
        # Create the OneGate token string
        vmid_str  = xml['ID']
        stime_str = xml['STIME']
        str_to_encrypt = "#{vmid_str}:#{stime_str}"

        user_id = xml['TEMPLATE/CREATED_BY']

        if user_id.nil?
            OpenNebula.log_error("VMID:#{vNid} CREATED_BY not present" \
                ' in the VM TEMPLATE')
            return
        end

        user = OpenNebula::User.new_with_id(user_id,
                                            OpenNebula::Client.new)
        rc   = user.info

        if OpenNebula.is_error?(rc)
            OpenNebula.log_error("VMID:#{vmid} user.info" \
                " error: #{rc.message}")
            return
        end

        token_password = user['TEMPLATE/TOKEN_PASSWORD']

        if token_password.nil?
            OpenNebula.log_error(:VMID => "#{vmid} TOKEN_PASSWORD not present"\
                " in the USER:#{user_id} TEMPLATE")
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

############################################################################
#  Module Interface
#  Interface for probe_db - VirtualMachineDB
############################################################################
module DomainList

    def self.state_info(name, id)
        ec2 = EC2Driver.new(name, id)

        vms = ec2.retreive_vms_data

        info = {}
        vms.each do |vm|
            info[vm[:uuid]] = { :id        => vm[:id],
                                :uuid      => vm[:uuid],
                                :name      => vm[:name],
                                :state     => vm[:state],
                                :deploy_id => vm[:deploy_id],
                                :hyperv    => 'ec2' }
        end

        info
    end

end
