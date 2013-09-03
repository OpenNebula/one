#!/usr/bin/env ruby
# -------------------------------------------------------------------------- #
# Copyright 2002-2013, OpenNebula Project (OpenNebula.org), C12G Labs        #
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

ONE_LOCATION = ENV["ONE_LOCATION"]

if !ONE_LOCATION
    RUBY_LIB_LOCATION = "/usr/lib/one/ruby"
    ETC_LOCATION      = "/etc/one/"
else
    RUBY_LIB_LOCATION = ONE_LOCATION + "/lib/ruby"
    ETC_LOCATION      = ONE_LOCATION + "/etc/"
end

# Load EC2 credentials and environment
require 'yaml'

ec2_env = "#{ETC_LOCATION}/ec2rc"
if File.exist?(ec2_env)
    env = YAML::load(File.read(ec2_env))
    env.each do |key, value|
        ENV[key] = value.to_s
    end
end

# Set up the environment for the driver
EC2_LOCATION = ENV["EC2_HOME"]

if !EC2_LOCATION
    STDERR.puts "EC2_HOME not set"
    exit(-1)
end

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

    # EC2 commands constants
    EC2 = {
        :run => {
            :cmd => "#{EC2_LOCATION}/bin/ec2-run-instances",
            :args => {
                "AKI" => {
                    :opt => '--kernel'
                },
                "AMI" => {
                    :opt => ''
                },
                "BLOCKDEVICEMAPPING" => {
                    :opt => '-b'
                },
                "CLIENTTOKEN" => {
                    :opt => '--client-token'
                },
                "INSTANCETYPE" => {
                    :opt => '-t'
                },
                "KEYPAIR" => {
                    :opt => '-k'
                },
                "LICENSEPOOL" => {
                    :opt => '--license-pool'
                },
                "PLACEMENTGROUP" => {
                    :opt => '--placement-group'
                },
                "PRIVATEIP" => {
                    :opt => '--private-ip-address'
                },
                "RAMDISK" => {
                    :opt => '--ramdisk'
                },
                "SUBNETID" => {
                    :opt => '-s'
                },
                "TENANCY" => {
                    :opt => '--tenancy'
                },
                "USERDATA" => {
                    :opt => '-d'
                },
                "USERDATAFILE" => {
                    :opt => '-f'
                },
                "SECURITYGROUPS" => {
                    :opt => '-g',
                    :proc => lambda {|str| str.split(',').join(' -g ')}
                },
                "AVAILABILITYZONE" => {
                    :opt => '--availability-zone'
                }
            }
        },
        :terminate => {
            :cmd => "#{EC2_LOCATION}/bin/ec2-terminate-instances"
        },
        :describe => {
            :cmd => "#{EC2_LOCATION}/bin/ec2-describe-instances"
        },
        :associate => {
            :cmd => "#{EC2_LOCATION}/bin/ec2-associate-address",
            :args => {
                "SUBNETID"  => {
                    :opt  => '-a',
                    :proc => lambda {|str| ''}
                },
                "ELASTICIP" => {
                    :opt => ''
                }
            }
        },
        :authorize => {
            :cmd => "#{EC2_LOCATION}/bin/ec2-authorize",
            :args => {
                "AUTHORIZEDPORTS" => {
                    :opt => '-p',
                    :proc => lambda {|str| str.split(',').join(' -p ')}
                }
            }
        },
        :reboot => {
            :cmd => "#{EC2_LOCATION}/bin/ec2-reboot-instances"
        },
        :stop => {
            :cmd => "#{EC2_LOCATION}/bin/ec2-stop-instances"
        },
        :start => {
            :cmd => "#{EC2_LOCATION}/bin/ec2-start-instances"
        },
        :tags => {
            :cmd => "#{EC2_LOCATION}/bin/ec2-create-tags",
            :args => {
                "TAGS" => {
                    :opt  => '-t',
                    :proc => lambda {|str| str.split(',').join(' -t ')}
                }
            }
        }
    }

    # EC2 constructor, loads defaults for the EC2Driver
    def initialize(ec2_conf = nil)
        @defaults = Hash.new

        if !ec2_conf && ENV['EC2_CONF']
            ec2_conf = ENV['EC2_CONF']
        end

        if ec2_conf && File.exists?(ec2_conf)
            fd  = File.new(ec2_conf)
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

    # DEPLOY action, also sets ports and ip if needed
    def deploy(id, host, xml_text)
        ec2_info = get_deployment_info(host, xml_text)
        return unless ec2_info

        if !ec2_value(ec2_info, 'AMI')
            msg = "Cannot find AMI in deployment file"
            STDERR.puts(msg)
            exit(-1)
        end

        deploy_exe = exec_and_log_ec2(:run, ec2_info, "")
        if deploy_exe.code != 0
            msg = deploy_exe.stderr
            STDERR.puts(msg)
            exit(-1)
        end

        if !deploy_exe.stdout.match(/^INSTANCE\s*(.+?)\s/)
            msg = "Could not find instance id. Check ec2-describe-instances"
            STDERR.puts(msg)
            exit(-1)
        end

        deploy_id = $1

        if ec2_value(ec2_info, 'AUTHORIZEDPORTS')
            exec_and_log_ec2(:authorize, ec2_info, 'default')
        end

        LocalCommand.run(
            "#{EC2_LOCATION}/bin/ec2-create-tags #{deploy_id} -t ONE_ID=#{id}",
            lambda {|str| STDERR.puts(str) })

        if ec2_value(ec2_info, 'TAGS')
            exec_and_log_ec2(:tags, ec2_info, deploy_id)
        end

        if ec2_value(ec2_info, 'ELASTICIP')
            exec_and_log_ec2(:associate, ec2_info, "-i #{deploy_id}")
        end

        puts(deploy_id)
    end

    # Shutdown a EC2 instance
    def shutdown(deploy_id)
        ec2_action(deploy_id, :terminate, ACTION[:shutdown])
    end

    # Reboot a EC2 instance
    def reboot(deploy_id)
        ec2_action(deploy_id, :reboot, ACTION[:reboot])
    end

    # Cancel a EC2 instance
    def cancel(deploy_id)
        ec2_action(deploy_id, :terminate, ACTION[:cancel])
    end

    # Stop a EC2 instance
    def save(deploy_id)
        ec2_action(deploy_id, :stop, ACTION[:save])
    end

    # Cancel a EC2 instance
    def restore(deploy_id)
        ec2_action(deploy_id, :start, ACTION[:restore])
    end

    # Get info (IP, and state) for a EC2 instance
    def poll(id, deploy_id)
        exe = exec_and_log_ec2(:describe, nil, deploy_id)
        if exe.code != 0
            STDERR.puts(exe.stderr)
            exit(-1)
        end

        info = parse_poll(exe.stdout, deploy_id)
        puts info
    end

    def monitor_all_vms
        exe = LocalCommand.run(
                "#{EC2_LOCATION}/bin/ec2-describe-instances",
                lambda { |str| STDERR.puts str })

        if exe.code != 0
            exit(-1)
        end

        puts "VM_POLL=YES"

        exe.stdout.split(/^RESERVATION\s.*?$/).each do |vm|
            m=vm.match(/^INSTANCE\s+(\S+)/)
            next if !m

            deploy_id = m[1]

            one_id='-1'

            vm.scan(/^TAG.*ONE_ID\s+(\d+)/) {|i| one_id = i.first }

            poll_data=parse_poll(vm, deploy_id)

            puts "VM=["
            puts "  ID=#{one_id},"
            puts "  DEPLOY_ID=#{deploy_id},"
            puts "  POLL=\"#{poll_data}\" ]"
        end
    end

private

    def get_deployment_info(host, xml_text)
        xml = REXML::Document.new xml_text

        ec2 = nil

        all_ec2_elements = xml.root.get_elements("//USER_TEMPLATE/EC2")

        # First, let's see if we have an EC2 site that matches
        # our desired host name
        all_ec2_elements.each { |element|
            cloud=element.elements["CLOUD"]
            if cloud and cloud.text.upcase == host.upcase
                ec2 = element
            end
        }

        if !ec2
            # If we don't find the EC2 site, and ONE just
            # knows about one EC2 site, let's use that
            if all_ec2_elements.size == 1
                ec2 = all_ec2_elements[0]
            else
                STDERR.puts(
                    "Cannot find EC2 element in deployment file "<<
                    "#{local_dfile} or couldn't find any EC2 site matching "<<
                    "one of the template.")
                exit(-1)
            end
        end

        ec2
    end

    def parse_poll(text, deploy_id)
        text.match(Regexp.new("INSTANCE\\s+#{deploy_id}\\s+(.+)"))

        info =  "#{POLL_ATTRIBUTE[:usedmemory]}=0 " \
                "#{POLL_ATTRIBUTE[:usedcpu]}=0 " \
                "#{POLL_ATTRIBUTE[:nettx]}=0 " \
                "#{POLL_ATTRIBUTE[:netrx]}=0"

        if !$1
            info << " #{POLL_ATTRIBUTE[:state]}=#{VM_STATE[:deleted]}"
        else
            monitor_data = $1.split(/\s+/)

            case monitor_data[3]
                when "pending"
                    info << " #{POLL_ATTRIBUTE[:state]}=#{VM_STATE[:active]}"
                when "running"
                    info<<" #{POLL_ATTRIBUTE[:state]}=#{VM_STATE[:active]}"<<
                        " IP=#{monitor_data[1]}"
                when "shutting-down","terminated"
                    info << " #{POLL_ATTRIBUTE[:state]}=#{VM_STATE[:deleted]}"
            end
        end

        info
    end

    # Execute an EC2 command and send the SUCCESS or FAILURE signal
    # +deploy_id+: String, VM id in EC2
    # +ec2_action+: Symbol, one of the keys of the EC2 hash constant (i.e :run)
    # +one_action+: String, OpenNebula action
    def ec2_action(deploy_id, ec2_action, one_action)
        exe = exec_and_log_ec2(ec2_action, nil, deploy_id)
        if exe.code != 0
            STDERR.puts(exe.stderr)
            exit(-1)
        end
    end

    # Execute an EC2 command and log the message if error
    # This function will build the command joining the :cmd value of the EC2
    # hash, the extra_params string and the options built from the :args schema
    # of the EC2 hash and the xml
    # +action+: Symbol, one of the keys of the EC2 hash constant (i.e :run)
    # +xml+: REXML Document, containing EC2 information
    # +extra_params+: String, extra information to be added to the command
    def exec_and_log_ec2(action, xml, extra_params)
        cmd = EC2[action][:cmd].clone
        cmd << ' ' << extra_params << ' ' if extra_params

        if EC2[action][:args]
            cmd << EC2[action][:args].map {|k,v|
                str = ec2_value(xml, k, &v[:proc])
                v[:opt] + ' ' + str if str
            }.join(' ')
        end

        LocalCommand.run(cmd, lambda {|str| STDERR.puts(str) })
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
end

