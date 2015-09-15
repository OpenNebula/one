#!/usr/bin/env ruby
# -------------------------------------------------------------------------- #
# Copyright 2002-2015, OpenNebula Project (OpenNebula.org), C12G Labs        #
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
else
    RUBY_LIB_LOCATION = ONE_LOCATION + "/lib/ruby" if !defined?(RUBY_LIB_LOCATION)
    ETC_LOCATION      = ONE_LOCATION + "/etc/" if !defined?(ETC_LOCATION)
end

EC2_DRIVER_CONF = "#{ETC_LOCATION}/ec2_driver.conf"
EC2_DRIVER_DEFAULT = "#{ETC_LOCATION}/ec2_driver.default"

# Load EC2 credentials and environment
require 'yaml'
require 'rubygems'
require 'aws-sdk'
require 'uri'

$: << RUBY_LIB_LOCATION

require 'CommandManager'
require 'scripts_common'
require 'rexml/document'
require 'VirtualMachineDriver'

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
                    :proc => lambda {|str| str.split(',')}
                },
                "SECURITYGROUPIDS" => {
                    :opt => 'security_group_ids',
                    :proc => lambda {|str| str.split(',')}
                },
                "AVAILABILITYZONE" => {
                    :opt => 'placement/availability_zone'
                },
                "EBS_OPTIMIZED" => {
                    :opt => 'ebs_optimized'
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
        :dns_name,
        :private_dns_name,
        :key_name,
        :availability_zone,
        :platform,
        :vpc_id,
        :private_ip_address,
        :ip_address,
        :subnet_id,
        :security_groups,
        :instance_type,
        :image_id
    ]

    # EC2 constructor, loads credentials and endpoint
    def initialize(host)
        @host = host

        public_cloud_ec2_conf  = YAML::load(File.read(EC2_DRIVER_CONF))

        @instance_types = public_cloud_ec2_conf['instance_types']

        regions = public_cloud_ec2_conf['regions']
        @region = regions[host] || regions["default"]

        #sanitize region data
        raise "access_key_id not defined for #{host}" if @region['access_key_id'].nil?
        raise "secret_access_key not defined for #{host}" if @region['secret_access_key'].nil?
        raise "region_name not defined for #{host}" if @region['region_name'].nil?

        AWS.config(
            'access_key_id'     => @region['access_key_id'],
            'secret_access_key' => @region['secret_access_key'],
            'region'            => @region['region_name'])

        if (proxy_uri = public_cloud_ec2_conf['proxy_uri'])
            AWS.config(:proxy_uri => proxy_uri)
        end

        @ec2 = AWS.ec2
    end

    # DEPLOY action, also sets ports and ip if needed
    def deploy(id, host, xml_text, lcm_state, deploy_id)
      if lcm_state == "BOOT" || lcm_state == "BOOT_FAILURE"
        ec2_info = get_deployment_info(host, xml_text)

        load_default_template_values

        if !ec2_value(ec2_info, 'AMI')
            STDERR.puts("Cannot find AMI in deployment file")
            exit(-1)
        end

        opts = generate_options(:run, ec2_info, {
                :min_count => 1,
                :max_count => 1})

        begin
            instance = AWS.ec2.instances.create(opts)
        rescue => e
            STDERR.puts(e.message)
            exit(-1)
        end

        tags = generate_options(:tags, ec2_info)['tags'] || {}

        tags['ONE_ID'] = id
        tags.each{ |key,value|
            begin
                instance.add_tag(key, :value => value)
            rescue => e
                STDERR.puts(e.message)
                exit(-1)
            end
        }

        if ec2_value(ec2_info, 'ELASTICIP')
            begin
                instance.associate_elastic_ip(ec2_value(ec2_info, 'ELASTICIP'))
            rescue => e
                STDERR.puts(e.message)
                exit(-1)
            end
        end

        puts(instance.id)
      else
        restore(deploy_id)
        deploy_id
      end
    end

    # Shutdown a EC2 instance
    def shutdown(deploy_id, lcm_state)
        case lcm_state
            when "SHUTDOWN"
                ec2_action(deploy_id, :terminate)
            when "SHUTDOWN_POWEROFF", "SHUTDOWN_UNDEPLOY"
                ec2_action(deploy_id, :stop)
        end
    end

    # Reboot a EC2 instance
    def reboot(deploy_id)
        ec2_action(deploy_id, :reboot)
    end

    # Cancel a EC2 instance
    def cancel(deploy_id)
        ec2_action(deploy_id, :terminate)
    end

    # Save a EC2 instance
    def save(deploy_id)
        ec2_action(deploy_id, :stop)
    end

    # Resumes a EC2 instance
    def restore(deploy_id)
        ec2_action(deploy_id, :start)
    end

    # Get info (IP, and state) for a EC2 instance
    def poll(id, deploy_id)
        i = get_instance(deploy_id)
        puts parse_poll(i)
    end

    # Get the info of all the EC2 instances. An EC2 instance must include
    #   the ONE_ID tag, otherwise it will be ignored
    def monitor_all_vms
        totalmemory = 0
        totalcpu = 0
        @region['capacity'].each { |name, size|
            cpu, mem = instance_type_capacity(name)

            totalmemory += mem * size.to_i
            totalcpu    += cpu * size.to_i
        }

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

        begin
            AWS.ec2.instances.each do |i|
                next if i.status != :pending && i.status != :running

                poll_data=parse_poll(i)

                vm_template_to_one = vm_to_one(i)
                vm_template_to_one = Base64.encode64(vm_template_to_one).gsub("\n","")

                one_id = i.tags['ONE_ID']

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
        rescue => e
            STDERR.puts(e.message)
            exit(-1)
        end

        host_info << "USEDMEMORY=#{usedmemory.round}\n"
        host_info << "USEDCPU=#{usedcpu.round}\n"
        host_info << "FREEMEMORY=#{(totalmemory - usedmemory).round}\n"
        host_info << "FREECPU=#{(totalcpu - usedcpu).round}\n"

        puts host_info
        puts vms_info
    end

private

    #Get the associated capacity of the instance_type as cpu (in 100 percent
    #e.g. 800) and memory (in KB)
    def instance_type_capacity(name)
        return 0, 0 if @instance_types[name].nil?
        return @instance_types[name]['cpu'].to_i * 100 ,
               @instance_types[name]['memory'].to_i * 1024 * 1024
    end

    # Get the EC2 section of the template. If more than one EC2 section
    # the CLOUD element is used and matched with the host
    def get_deployment_info(host, xml_text)
        xml = REXML::Document.new xml_text

        ec2 = nil
        ec2_deprecated = nil

        all_ec2_elements = xml.root.get_elements("//USER_TEMPLATE/EC2")

        # First, let's see if we have an EC2 site that matches
        # our desired host name
        all_ec2_elements.each { |element|
            cloud=element.elements["HOST"]
            if cloud and cloud.text.upcase == host.upcase
                ec2 = element
            else
                cloud=element.elements["CLOUD"]
                if cloud and cloud.text.upcase == host.upcase
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
                STDERR.puts("Cannot find EC2 element in deployment file or no" \
                    "EC2 site matching in the template.")
                exit(-1)
            end
        end

        ec2
    end

    # Retrieve the vm information from the EC2 instance
    def parse_poll(instance)
        begin
            info =  "#{POLL_ATTRIBUTE[:memory]}=0 " \
                    "#{POLL_ATTRIBUTE[:cpu]}=0 " \
                    "#{POLL_ATTRIBUTE[:nettx]}=0 " \
                    "#{POLL_ATTRIBUTE[:netrx]}=0 "

            state = ""
            if !instance.exists?
                state = VM_STATE[:deleted]
            else
                state = case instance.status
                when :pending
                    VM_STATE[:active]
                when :running
                    VM_STATE[:active]
                when :'shutting-down', :terminated
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
                            v.security_group_id if v.is_a?(AWS::EC2::SecurityGroup)
                        }.join(",")
                    end

                    info << "AWS_#{key.to_s.upcase}=#{URI::encode(value)} "
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
        i = get_instance(deploy_id)

        begin
            i.send(EC2[ec2_action][:cmd])
        rescue => e
            STDERR.puts e.message
            exit(-1)
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
                    v[:opt].split('/').each { |k|
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

    # Load the default values that will be used to create a new instance, if
    #   not provided in the template. These values are defined in the EC2_CONF
    #   file
    def load_default_template_values
        @defaults = Hash.new

        if File.exists?(EC2_DRIVER_DEFAULT)
            fd  = File.new(EC2_DRIVER_DEFAULT)
            xml = REXML::Document.new fd
            fd.close()

            return if !xml || !xml.root

            ec2 = xml.root.elements["EC2"]

            return if !ec2

            EC2.each {|action, hash|
                if hash[:args]
                    hash[:args].each { |key, value|
                        @defaults[key] = value_from_xml(ec2, key)
                    }
                end
            }
        end
    end

    # Retrive the instance from EC2
    def get_instance(id)
        begin
            instance = AWS.ec2.instances[id]
            if instance.exists?
                return instance
            else
                raise "Instance #{id} does not exist"
            end
        rescue => e
            STDERR.puts e.message
            exit(-1)
        end
    end

    # Build template for importation
    def vm_to_one(instance)
        cpu, mem = instance_type_capacity(instance.instance_type)

        mem = mem.to_i / 1024 # Memory for templates expressed in MB

        str = "NAME   = \"Instance from #{instance.id}\"\n"\
              "CPU    = \"#{cpu}\"\n"\
              "vCPU   = \"#{cpu}\"\n"\
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
end

