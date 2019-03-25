#!/usr/bin/env ruby
# -------------------------------------------------------------------------- #
# Copyright 2002-2019, OpenNebula Project, OpenNebula Systems                #
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

ONE_LOCATION = ENV["ONE_LOCATION"] if !defined?(ONE_LOCATION)

if !ONE_LOCATION
    RUBY_LIB_LOCATION = "/usr/lib/one/ruby" if !defined?(RUBY_LIB_LOCATION)
    ETC_LOCATION      = "/etc/one/" if !defined?(ETC_LOCATION)
    VAR_LOCATION      = "/var/lib/one/" if !defined?(VAR_LOCATION)
else
    RUBY_LIB_LOCATION = ONE_LOCATION + "/lib/ruby" if !defined?(RUBY_LIB_LOCATION)
    ETC_LOCATION      = ONE_LOCATION + "/etc/" if !defined?(ETC_LOCATION)
    VAR_LOCATION      = ONE_LOCATION + "/var/" if !defined?(VAR_LOCATION)
end

EC2_DRIVER_CONF = "#{ETC_LOCATION}/ec2_driver.conf"
EC2_DRIVER_DEFAULT = "#{ETC_LOCATION}/ec2_driver.default"

STATE_WAIT_PM_TIMEOUT_SECONDS = 1500

gem 'aws-sdk', '>= 2.0'

# Load EC2 credentials and environment
require 'yaml'
require 'rubygems'
require 'aws-sdk'
require 'uri'
require 'resolv'

$: << RUBY_LIB_LOCATION

require 'CommandManager'
require 'scripts_common'
require 'rexml/document'
require 'VirtualMachineDriver'
require 'opennebula'

require 'thread'

begin
    PUBLIC_CLOUD_EC2_CONF = YAML::load(File.read(EC2_DRIVER_CONF))
rescue Exception => e
    str_error="Unable to read '#{EC2_DRIVER_CONF}'. Invalid YAML syntax:\n" +
                e.message + "\n********Stack trace from EC2 IM driver*********\n"
    raise str_error
end

# The main class for the EC2 driver
class EC2Driver
    ACTION          = VirtualMachineDriver::ACTION
    POLL_ATTRIBUTE  = VirtualMachineDriver::POLL_ATTRIBUTE
    VM_STATE        = VirtualMachineDriver::VM_STATE

    # Key that will be used to store the monitoring information in the template
    EC2_MONITOR_KEY = "EC2DRIVER_MONITOR"

    # EC2 commands constants
    EC2 = {
        :run => {
            :cmd => :create,
            :args => {
                "AKI" => {
                    :opt => 'kernel_id'
                },
                "AMI" => {
                    :opt => 'image_id'
                },
                "BLOCKDEVICEMAPPING" => {
                    :opt => 'block_device_mappings',
                    :proc => lambda {|str|
                        str.split(' ').collect { |s|
                            dev, tmp = s.split('=')
                            hash = Hash.new
                            hash[:device_name] = dev
                            if tmp == "none"
                                hash[:no_device] = dev
                            else
                                hash[:ebs] = Hash.new
                                tmp_a = tmp.split(':')
                                hash[:ebs][:snapshot_id] = tmp_a[0] if tmp_a[0] && !tmp_a[0].empty?
                                hash[:ebs][:volume_size] = tmp_a[1].to_i if tmp_a[1] && !tmp_a[1].empty?
                                if tmp_a[2] == "false"
                                    hash[:ebs][:delete_on_termination] = false
                                elsif tmp_a[2] == "true"
                                    hash[:ebs][:delete_on_termination] = true
                                end
                                hash[:ebs][:volume_type] = tmp_a[3] if tmp_a[3] && !tmp_a[3].empty?
                                hash[:ebs][:iops] = tmp_a[4].to_i if tmp_a[4] && !tmp_a[4].empty?
                            end
                            hash
                        }
                    }
                },
                "CLIENTTOKEN" => {
                    :opt => 'client_token'
                },
                "INSTANCETYPE" => {
                    :opt => 'instance_type'
                },
                "KEYPAIR" => {
                    :opt => 'key_name'
                },
                "LICENSEPOOL" => {
                    :opt => 'license/pool'
                },
                "PLACEMENTGROUP" => {
                    :opt => 'placement/group_name'
                },
                "PRIVATEIP" => {
                    :opt => 'private_ip_address'
                },
                "RAMDISK" => {
                    :opt => 'ramdisk_id'
                },
                "SUBNETID" => {
                    :opt => 'subnet_id'
                },
                "TENANCY" => {
                    :opt => 'placement/tenancy'
                },
                "USERDATA" => {
                    :opt => 'user_data'
                },
                #"USERDATAFILE" => {
                #    :opt => '-f'
                #},
                "SECURITYGROUPS" => {
                    :opt => 'security_groups',
                    :proc => lambda {|str| str.split(/,\s*/)}
                },
                "SECURITYGROUPIDS" => {
                    :opt => 'security_group_ids',
                    :proc => lambda {|str| str.split(/,\s*/)}
                },
                "AVAILABILITYZONE" => {
                    :opt => 'placement/availability_zone'
                },
                "EBS_OPTIMIZED" => {
                    :opt => 'ebs_optimized',
                    :proc => lambda {|str| str.downcase.eql? "true"}
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
                #"SUBNETID"  => {
                #    :opt  => '-a',
                #    :proc => lambda {|str| ''}
                #},
                "ELASTICIP" => {
                    :opt => 'public_ip'
                }
            }
        },
        :authorize => {
            :cmd => :authorize,
            :args => {
                "AUTHORIZEDPORTS" => {
                    :opt => '-p',
                    :proc => lambda {|str| str.split(',').join(' -p ')}
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
                "TAGS" => {
                    :opt  => 'tags',
                    :proc => lambda {|str|
                        hash = {}
                        str.split(',').each {|s|
                            k,v = s.split('=')
                            hash[k] = v
                        }
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

    # EC2 constructor, loads credentials and endpoint
    def initialize(host, host_id=nil)
        @host    = host
        @host_id = host_id

        @instance_types = PUBLIC_CLOUD_EC2_CONF['instance_types']

        conn_opts = get_connect_info(host)
        access_key = conn_opts[:access]
        secret_key = conn_opts[:secret]
        region_name = conn_opts[:region]

        #sanitize region data
        raise "access_key_id not defined for #{host}" if access_key.nil?
        raise "secret_access_key not defined for #{host}" if secret_key.nil?
        raise "region_name not defined for #{host}" if region_name.nil?

        Aws.config.merge!({
            :access_key_id      => access_key,
            :secret_access_key  => secret_key,
            :region             => region_name
        })

        if (proxy_uri = PUBLIC_CLOUD_EC2_CONF['proxy_uri'])
            Aws.config(:proxy_uri => proxy_uri)
        end

        if @provision_type == :host
            if PUBLIC_CLOUD_EC2_CONF['state_wait_pm_timeout_seconds']
                @state_change_timeout = PUBLIC_CLOUD_EC2_CONF['state_wait_pm_timeout_seconds'].to_i
            else
                @state_change_timeout = STATE_WAIT_PM_TIMEOUT_SECONDS
            end
        else
            @state_change_timeout = PUBLIC_CLOUD_EC2_CONF['state_wait_timeout_seconds'].to_i
        end

        @ec2 = Aws::EC2::Resource.new
    end

    # Check the current template of host
    # to retrieve connection information
    # needed for Amazon
    def get_connect_info(host)
        conn_opts={}

        client   = OpenNebula::Client.new

        if host.is_a?(String)
            pool = OpenNebula::HostPool.new(client)
            pool.info
            objects=pool.select {|object| object.name==host }
            xmlhost = objects.first
        else
            xmlhost = host
        end

        system = OpenNebula::System.new(client)
        config = system.get_configuration
        raise "Error getting oned configuration : #{config.message}" if OpenNebula.is_error?(config)

        token = config["ONE_KEY"]

        if xmlhost["TEMPLATE/PROVISION"]
            @tmplBase = 'TEMPLATE/PROVISION'
        else
            @tmplBase = 'TEMPLATE'
        end

        if xmlhost["TEMPLATE/PM_MAD"]
            @provision_type = :host
        else
            @provision_type = :vm
        end

        conn_opts = {
            :access => xmlhost["#{@tmplBase}/EC2_ACCESS"],
            :secret => xmlhost["#{@tmplBase}/EC2_SECRET"]
        }

        begin
            conn_opts = OpenNebula.decrypt(conn_opts, token)

            conn_opts[:region] = xmlhost["#{@tmplBase}/REGION_NAME"]
        rescue
            raise "HOST: #{host} must have ec2 credentials and region in order to work properly"
        end

        return conn_opts
    end

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

    # DEPLOY action, also sets ports and ip if needed
    def deploy(id, host, xml_text, lcm_state, deploy_id)

        # Restore if we need to
        if lcm_state != "BOOT" && lcm_state != "BOOT_FAILURE"
            restore(deploy_id)
            return deploy_id
        end

        # Otherwise deploy the VM

        begin
            ec2_info = get_deployment_info(host, xml_text)
        rescue Exception => e
            raise e
        end

        load_default_template_values

        if !ec2_value(ec2_info, 'AMI')
            raise "Cannot find AMI in deployment file"
        end

        opts = generate_options(:run, ec2_info, {
            :min_count => 1,
            :max_count => 1})

        # The OpenNebula context will be only included if not USERDATA
        #   is provided by the user
        if !ec2_value(ec2_info, 'USERDATA')
            xml = OpenNebula::XMLElement.new
            xml.initialize_xml(xml_text, @provision_type == :host ? 'HOST' : 'VM')

            if xml.has_elements?('TEMPLATE/CONTEXT')
                # if requested, we generated cloud-init compatible data
                if ec2_value(ec2_info, 'CLOUD_INIT') =~ /^(yes|true)$/i
                    context_str = generate_cc(xml, 'TEMPLATE/CONTEXT')
                else
                    # Since there is only 1 level ',' will not be added
                    context_str = xml.template_like_str('TEMPLATE/CONTEXT')

                    if xml['TEMPLATE/CONTEXT/TOKEN'] == 'YES'
                        # TODO use OneGate library
                        token_str = generate_onegate_token(xml)
                        if token_str
                            context_str << "\nONEGATE_TOKEN=\"#{token_str}\""
                        end
                    end
                end

                userdata_key = EC2[:run][:args]["USERDATA"][:opt]
                opts[userdata_key] = Base64.encode64(context_str)
            end
        end

        instances = @ec2.create_instances(opts)
        instance = instances.first

        start_time = Time.now

        while Time.now - start_time < @state_change_timeout
            begin
                break if instance.exists?
            rescue => e
                OpenNebula::log_error("RESCUE: #{e.inspect}")
            end

            sleep 2
        end

        tags = generate_options(:tags, ec2_info)[:tags] || {}

        tag_array = []
        tags.each{ |key,value|
            tag_array << {
                :key => key,
                :value => value
            }
        }

        instance.create_tags(:tags => tag_array) if tag_array.length > 0

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

        if @provision_type == :host
            instance.create_tags(tags: [{
                key: 'Name',
                value: host['//HOST/TEMPLATE/PROVISION/HOSTNAME']
            },{
                key: 'ONE_HOST_ID',
                value: 'TODO'
            }])
        else
            instance.create_tags(tags: [{
                key: 'ONE_ID',
                value: id
            }])
        end

        puts(instance.id)
    end

    # Shutdown a EC2 instance
    def shutdown(deploy_id, lcm_state)
        case lcm_state
        when "SHUTDOWN"
            ec2_action(deploy_id, :terminate)
            wait_state('terminated', deploy_id)
        when "SHUTDOWN_POWEROFF", "SHUTDOWN_UNDEPLOY"
            ec2_action(deploy_id, :stop)
            wait_state('stopped', deploy_id)
        end
    end

    # Reboot a EC2 instance
    def reboot(deploy_id)
        ec2_action(deploy_id, :reboot)
        wait_state('running', deploy_id)
    end

    # Cancel a EC2 instance
    def cancel(deploy_id, lcm_state=nil)
        case lcm_state
        when 'SHUTDOWN_POWEROFF', 'SHUTDOWN_UNDEPLOY'
            ec2_action(deploy_id, :stop)
            wait_state('stopped', deploy_id)
        else
            ec2_action(deploy_id, :terminate)
            wait_state('terminated', deploy_id)
        end
    end

    # Save a EC2 instance
    def save(deploy_id)
        wait_state('running', deploy_id)
        ec2_action(deploy_id, :stop)
        wait_state('stopped', deploy_id)
    end

    # Resumes a EC2 instance
    def restore(deploy_id)
        ec2_action(deploy_id, :start)
        wait_state('running', deploy_id)
    end

    # Resets a EC2 instance
    def reset(deploy_id)
        ec2_action(deploy_id, :stop)
        wait_state('stopped', deploy_id)

        ec2_action(deploy_id, :start)
        wait_state('running', deploy_id)
    end

    # Get info (IP, and state) for a EC2 instance
    def poll(id, deploy_id)
        i = get_instance(deploy_id)
        vm = OpenNebula::VirtualMachine.new_with_id(id, OpenNebula::Client.new)
        vm.info
        cw_mon_time = vm["LAST_POLL"] ? vm["LAST_POLL"].to_i : Time.now.to_i
        do_cw = (Time.now.to_i - cw_mon_time) >= 360
        puts parse_poll(i, vm, do_cw, cw_mon_time)
    end

    # Parse template instance type into
    # Amazon ec2 format (M1SMALL => m1.small)
    def parse_inst_type(type)
        return type.downcase.gsub("_", ".")
    end

    # Get the info of all the EC2 instances. An EC2 instance must include
    #   the ONE_ID tag, otherwise it will be ignored
    def monitor_all_vms
        totalmemory = 0
        totalcpu = 0

        # Get last cloudwatch monitoring time
        host_obj    = OpenNebula::Host.new_with_id(@host_id,
                                                  OpenNebula::Client.new)
        host_obj.info
        cw_mon_time = host_obj["/HOST/TEMPLATE/CWMONTIME"]
        capacity = host_obj.to_hash["HOST"]["TEMPLATE"]["CAPACITY"]
        if !capacity.nil? && Hash === capacity
            capacity.each{ |name, value|
                name = parse_inst_type(name)
                cpu, mem = instance_type_capacity(name)
                totalmemory += mem * value.to_i
                totalcpu    += cpu * value.to_i
            }
        else
            raise "you must define CAPACITY section properly! check the template"
        end

        host_info =  "HYPERVISOR=ec2\n"
        host_info << "PUBLIC_CLOUD=YES\n"
        host_info << "PRIORITY=-1\n"
        host_info << "TOTALMEMORY=#{totalmemory.round}\n"
        host_info << "TOTALCPU=#{totalcpu}\n"
        host_info << "CPUSPEED=1000\n"
        host_info << "HOSTNAME=\"#{@host}\"\n"

        vms_info = "VM_POLL=YES\n"

        #
        # Add information for running VMs (running and pending).
        #
        usedcpu    = 0
        usedmemory = 0

        # Build an array of VMs and last_polls for monitoring
        vpool      = OpenNebula::VirtualMachinePool.new(OpenNebula::Client.new,
                                    OpenNebula::VirtualMachinePool::INFO_ALL_VM)
        vpool.info
        onevm_info = {}


        if !cw_mon_time
            cw_mon_time = Time.now.to_i
        else
            cw_mon_time = cw_mon_time.to_i
        end

        do_cw = (Time.now.to_i - cw_mon_time) >= 360
        vpool.each{
            |vm| onevm_info[vm.deploy_id] = vm
        }


        work_q = Queue.new
        @ec2.instances.each{|i| work_q.push i }
		workers = (0...20).map do
            Thread.new do
                begin
                    while i = work_q.pop(true)
                        next if i.state.name != 'pending' && i.state.name != 'running'
                        one_id = i.tags.find {|t| t.key == 'ONE_ID' }
                        one_id = one_id.value if one_id
                        poll_data=parse_poll(i, onevm_info[i.id], do_cw, cw_mon_time)
                        vm_template_to_one = vm_to_one(i)
                        vm_template_to_one = Base64.encode64(vm_template_to_one).gsub("\n","")
                        vms_info << "VM=[\n"
                        vms_info << "  ID=#{one_id || -1},\n"
                        vms_info << "  DEPLOY_ID=#{i.instance_id},\n"
                        vms_info << "  VM_NAME=#{i.instance_id},\n"
                        vms_info << "  IMPORT_TEMPLATE=\"#{vm_template_to_one}\",\n"
                        vms_info << "  POLL=\"#{poll_data}\" ]\n"
                        if one_id
                            name = i.instance_type
                            cpu, mem = instance_type_capacity(name)
                            usedcpu += cpu
                            usedmemory += mem
                        end
                    end
                rescue Exception => e
                end
            end
        end; "ok"
        workers.map(&:join); "ok"

        host_info << "USEDMEMORY=#{usedmemory.round}\n"
        host_info << "USEDCPU=#{usedcpu.round}\n"
        host_info << "FREEMEMORY=#{(totalmemory - usedmemory).round}\n"
        host_info << "FREECPU=#{(totalcpu - usedcpu).round}\n"

        if do_cw
            host_info << "CWMONTIME=#{Time.now.to_i}"
        else
            host_info << "CWMONTIME=#{cw_mon_time}"
        end

        puts host_info
        puts vms_info
    end

private

    #Get the associated capacity of the instance_type as cpu (in 100 percent
    #e.g. 800) and memory (in KB)
    def instance_type_capacity(name)
        return 0, 0 if @instance_types[name].nil?
        return (@instance_types[name]['cpu'].to_f * 100).to_i ,
               (@instance_types[name]['memory'].to_f * 1024 * 1024).to_i
    end

    # Get the EC2 section of the template. If more than one EC2 section
    # the CLOUD element is used and matched with the host
    def get_deployment_info(host, xml_text)
        xml = REXML::Document.new xml_text

        ec2 = nil
        ec2_deprecated = nil

        if @provision_type == :host
            all_ec2_elements = xml.root.get_elements("//TEMPLATE/PROVISION")
        else
            all_ec2_elements = xml.root.get_elements("//USER_TEMPLATE/PUBLIC_CLOUD")
        end

        # First, let's see if we have an EC2 site that matches
        # our desired host name
        all_ec2_elements.each { |element|
            cloud=element.elements["HOST"]
            if cloud && cloud.text.upcase == host.upcase
                ec2 = element
            else
                cloud=element.elements["CLOUD"]
                if cloud && cloud.text.upcase == host.upcase
                    ec2_deprecated = element
                end
            end
        }

        ec2 ||= ec2_deprecated

        if !ec2
            # If we don't find the EC2 site, and ONE just
            # knows about one EC2 site, let's use that
            if all_ec2_elements.size == 1
                ec2 = all_ec2_elements[0]
            else
                raise RuntimeError.new("Cannot find PUBLIC_CLOUD element in deployment "\
                                       " file or no HOST site matching the requested in the "\
                                       " template.")
            end
        end

        ec2
    end

    # Retrieve the vm information from the EC2 instance
    def parse_poll(instance, onevm, do_cw, cw_mon_time)
        begin
            if onevm
                if do_cw
                    cloudwatch_str = cloudwatch_monitor_info(instance.instance_id,
                                                           onevm,
                                                           cw_mon_time)
                else
                    previous_cpu   = onevm["MONITORING/CPU"]  || 0
                    previous_netrx = onevm["MONITORING/NETRX"] || 0
                    previous_nettx = onevm["MONITORING/NETTX"] || 0

                    cloudwatch_str = "CPU=#{previous_cpu} NETTX=#{previous_nettx} NETRX=#{previous_netrx} "
                end
            else
                cloudwatch_str = ""
            end

            mem = onevm["TEMPLATE/MEMORY"].to_s
            mem=mem.to_i*1024
            info =  "#{POLL_ATTRIBUTE[:memory]}=#{mem} #{cloudwatch_str}"

            state = ""
            if !instance.exists?
                state = VM_STATE[:deleted]
            else
                state = case instance.state.name
                when 'pending'
                    VM_STATE[:active]
                when 'running'
                    VM_STATE[:active]
                when 'shutting-down', 'terminated'
                    VM_STATE[:deleted]
                else
                    VM_STATE[:unknown]
                end
            end
            info << "#{POLL_ATTRIBUTE[:state]}=#{state} "

            EC2_POLL_ATTRS.map { |key|
                value = instance.send(key)
                if !value.nil? && !value.empty?
                    if value.is_a?(Array)
                        value = value.map {|v|
                            v.group_id if v.is_a?(Aws::EC2::Types::GroupIdentifier)
                        }.join(",")
                    end

                    info << "AWS_#{key.to_s.upcase}=\\\"#{URI::encode(value)}\\\" "
                end
            }

            info
        rescue
            # Unkown state if exception occurs retrieving information from
            # an instance
            "#{POLL_ATTRIBUTE[:state]}=#{VM_STATE[:unknown]} "
        end
    end


    # Execute an EC2 command
    # +deploy_id+: String, VM id in EC2
    # +ec2_action+: Symbol, one of the keys of the EC2 hash constant (i.e :run)
    def ec2_action(deploy_id, ec2_action)
        begin
            i = get_instance(deploy_id)
            i.send(EC2[ec2_action][:cmd])
        rescue => e
            raise e
        end
    end

    # Generate the options for the given command from the xml provided in the
    #   template. The available options for each command are defined in the EC2
    #   constant
    def generate_options(action, xml, extra_params={})
        opts = extra_params || {}

        if EC2[action][:args]
            EC2[action][:args].each {|k,v|
                str = ec2_value(xml, k, &v[:proc])
                if str
                    tmp = opts
                    last_key = nil
                    v[:opt].split('/').each { |key|
                        k = key.to_sym
                        tmp = tmp[last_key] if last_key
                        tmp[k] = {}
                        last_key = k
                    }
                    tmp[last_key] = str
                end
            }
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
        if xml
            element = xml.elements[name]
            element.text.strip if element && element.text
        end
    end

    # Waits until ec2 machine reach the desired state
    # +state+: String, is the desired state, needs to be a real state of Amazon ec2:  running, stopped, terminated, pending
    # +deploy_id+: String, VM id in EC2
    def wait_state(state, deploy_id)
        ready = (state == 'stopped') || (state == 'pending') || (state == 'running') || (state == 'terminated')
        raise "Waiting for an invalid state" if !ready
        t_init = Time.now
        begin
            wstate = get_instance(deploy_id).state.name rescue nil
            raise "Ended in invalid state" if Time.now - t_init > @state_change_timeout
            sleep 3
        end while wstate != state
    end

    # Load the default values that will be used to create a new instance, if
    #   not provided in the template. These values are defined in the EC2_CONF
    #   file
    def load_default_template_values
        @defaults = Hash.new

        if File.exist?(EC2_DRIVER_DEFAULT)
            fd  = File.new(EC2_DRIVER_DEFAULT)
            xml = REXML::Document.new fd
            fd.close()

            return if !xml || !xml.root

            ec2 = xml.root.elements["PUBLIC_CLOUD"]

            return if !ec2

            EC2.each {|action, hash|
                if hash[:args]
                    hash[:args].each { |key, value|
                        @defaults[key.to_sym] = value_from_xml(ec2, key)
                    }
                end
            }
        end
    end

    # Retrieve the instance from EC2
    def get_instance(id)
        begin
            instance = @ec2.instance(id)
            if instance.exists?
                return instance
            else
                raise RuntimeError.new("Instance #{id} does not exist")
            end
        rescue => e
            raise e
        end
    end

    # Build template for importation
    def vm_to_one(instance)
        cpu, mem = instance_type_capacity(instance.instance_type)

        cpu  = cpu.to_f / 100
        vcpu = cpu.ceil
        mem  = mem.to_i / 1024 # Memory for templates expressed in MB

        str = "NAME   = \"Instance from #{instance.id}\"\n"\
              "CPU    = \"#{cpu}\"\n"\
              "VCPU   = \"#{vcpu}\"\n"\
              "MEMORY = \"#{mem}\"\n"\
              "HYPERVISOR = \"ec2\"\n"\
              "PUBLIC_CLOUD = [\n"\
              "  TYPE  =\"ec2\",\n"\
              "  AMI   =\"#{instance.image_id}\"\n"\
              "]\n"\
              "IMPORT_VM_ID    = \"#{instance.id}\"\n"\
              "SCHED_REQUIREMENTS=\"NAME=\\\"#{@host}\\\"\"\n"\
              "DESCRIPTION = \"Instance imported from EC2, from instance"\
              " #{instance.id}, AMI #{instance.image_id}\"\n"

        str
    end

    # Extract monitoring information from Cloud Watch
    # CPU, NETTX and NETRX
    def cloudwatch_monitor_info(id, onevm, cw_mon_time)
        cw=Aws::CloudWatch::Client.new

        # CPU
        begin
            cpu = get_cloudwatch_metric(cw,
                                        "CPUUtilization",
                                        cw_mon_time,
                                        ["Average"],
                                         "Percent",
                                         id)
            if cpu[:datapoints].size != 0
                cpu = cpu[:datapoints][-1][:average]
            else
                cpu = onevm["MONITORING/CPU"] || 0
            end
            cpu = cpu.to_f.round(2).to_s
        rescue => e
            OpenNebula::log_error(e.message)
        end

        # NETTX
        nettx = 0
        begin
            nettx_dp = get_cloudwatch_metric(cw,
                                             "NetworkOut",
                                             cw_mon_time,
                                             ["Sum"],
                                             "Bytes",
                                             id)[:datapoints]
            previous_nettx = onevm["/VM/MONITORING/NETTX"]
            nettx = previous_nettx ? previous_nettx.to_i : 0

            nettx_dp.each{|dp|
                nettx += dp[:sum].to_i
            }
        rescue => e
            OpenNebula::log_error(e.message)
        end

        # NETRX
        netrx = 0
        begin
            netrx_dp = get_cloudwatch_metric(cw,
                                             "NetworkIn",
                                             cw_mon_time,
                                             ["Sum"],
                                             "Bytes",
                                             id)[:datapoints]
            previous_netrx = onevm["/VM/MONITORING/NETRX"]
            netrx = previous_netrx ? previous_netrx.to_i : 0

            netrx_dp.each{|dp|
                netrx += dp[:sum].to_i
            }
        rescue => e
            OpenNebula::log_error(e.message)
        end

        "CPU=#{cpu.to_s} NETTX=#{nettx.to_s} NETRX=#{netrx.to_s} "
    end

    # Get metric from AWS/EC2 namespace from the last poll
    def get_cloudwatch_metric(cw, metric_name, last_poll, statistics, units, id)
        dt = 60                              # period
        t0 = (Time.at(last_poll.to_i)-65)    # last poll time
        t = (Time.now-60)                    # actual time

        while ((t - t0)/dt >= 1440) do dt+=60 end

        options={:namespace=>"AWS/EC2",
                 :metric_name=>metric_name,
                 :start_time=> t0.iso8601,
                 :end_time=> t.iso8601,
                 :period=>dt,
                 :statistics=>statistics,
                 :unit=>units,
                 :dimensions=>[{:name=>"InstanceId", :value=>id}]}

        cw.get_metric_statistics(options)
    end

    # TODO move this method to a OneGate library
    def generate_onegate_token(xml)
        # Create the OneGate token string
        vmid_str  = xml["ID"]
        stime_str = xml["STIME"]
        str_to_encrypt = "#{vmid_str}:#{stime_str}"

        user_id = xml['TEMPLATE/CREATED_BY']

        if user_id.nil?
            OpenNebula::log_error("VMID:#{vNid} CREATED_BY not present" \
                " in the VM TEMPLATE")
            return nil
        end

        user = OpenNebula::User.new_with_id(user_id,
                                            OpenNebula::Client.new)
        rc   = user.info

        if OpenNebula.is_error?(rc)
            OpenNebula::log_error("VMID:#{vmid} user.info" \
                " error: #{rc.message}")
            return nil
        end

        token_password = user['TEMPLATE/TOKEN_PASSWORD']

        if token_password.nil?
            OpenNebula::log_error(VMID:#{vmid} TOKEN_PASSWORD not present"\
                " in the USER:#{user_id} TEMPLATE")
            return nil
        end

        cipher = OpenSSL::Cipher::Cipher.new("aes-256-cbc")
        cipher.encrypt
        cipher.key = token_password
        onegate_token = cipher.update(str_to_encrypt)
        onegate_token << cipher.final

        onegate_token_64 = Base64.encode64(onegate_token).chop
    end
end
