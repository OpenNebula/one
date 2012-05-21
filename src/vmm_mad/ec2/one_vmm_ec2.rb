#!/usr/bin/env ruby
# ---------------------------------------------------------------------------- #
# Copyright 2002-2012, OpenNebula Project Leads (OpenNebula.org)             #
#                                                                              #
# Licensed under the Apache License, Version 2.0 (the "License"); you may      #
# not use this file except in compliance with the License. You may obtain      #
# a copy of the License at                                                     #
#                                                                              #
# http://www.apache.org/licenses/LICENSE-2.0                                   #
#                                                                              #
# Unless required by applicable law or agreed to in writing, software          #
# distributed under the License is distributed on an "AS IS" BASIS,            #
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.     #
# See the License for the specific language governing permissions and          #
# limitations under the License.                                               #
# ---------------------------------------------------------------------------- #

# Set up the environment for the driver

EC2_LOCATION = ENV["EC2_HOME"]

if !EC2_LOCATION
    puts "EC2_HOME not set"
    exit(-1)
end

EC2_JVM_CONCURRENCY = ENV["EC2_JVM_CONCURRENCY"]

ONE_LOCATION = ENV["ONE_LOCATION"]

if !ONE_LOCATION
    RUBY_LIB_LOCATION = "/usr/lib/one/ruby"
    ETC_LOCATION      = "/etc/one/"
else
    RUBY_LIB_LOCATION = ONE_LOCATION + "/lib/ruby"
    ETC_LOCATION      = ONE_LOCATION + "/etc/"
end

$: << RUBY_LIB_LOCATION

require "VirtualMachineDriver"
require "CommandManager"
require 'scripts_common'
require "rexml/document"

# The main class for the EC2 driver
class EC2Driver < VirtualMachineDriver

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
        if !EC2_JVM_CONCURRENCY
            concurrency = 5
        else
            concurrency = EC2_JVM_CONCURRENCY.to_i
        end

        super('', :concurrency => concurrency, :threaded => true)

        @defaults = Hash.new

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
    def deploy(id, drv_message)
        ec2_info = get_deployment_info(drv_message)
        return unless ec2_info

        if !ec2_value(ec2_info, 'AMI')
            msg = "Cannot find AMI in deployment file"
            send_message(ACTION[:deploy], RESULT[:failure], id, msg)
            return
        end

        deploy_exe = exec_and_log_ec2(:run, ec2_info, "", id)
        if deploy_exe.code != 0
            msg = deploy_exe.stderr
            send_message(ACTION[:deploy], RESULT[:failure], id, msg)
            return
        end

        if !deploy_exe.stdout.match(/^INSTANCE\s*(.+?)\s/)
            msg = "Could not find instance id. Check ec2-describe-instances"
            send_message(ACTION[:deploy], RESULT[:failure], id, msg)
            return
        end

        deploy_id = $1

        if ec2_value(ec2_info, 'AUTHORIZEDPORTS')
            exec_and_log_ec2(:authorize, ec2_info, 'default', id)
        end

        if ec2_value(ec2_info, 'TAGS')
            exec_and_log_ec2(:tags, ec2_info, deploy_id, id)
        end

        if ec2_value(ec2_info, 'ELASTICIP')
            exec_and_log_ec2(:associate, ec2_info, "-i #{deploy_id}", id)
        end

        send_message(ACTION[:deploy], RESULT[:success], id, deploy_id)
    end

    # Shutdown a EC2 instance
    def shutdown(id, drv_message)
        ec2_action(drv_message, :terminate, ACTION[:shutdown], id)
    end

    # Reboot a EC2 instance
    def reboot(id, drv_message)
        ec2_action(drv_message, :reboot, ACTION[:reboot], id)
    end

    # Cancel a EC2 instance
    def cancel(id, drv_message)
        ec2_action(drv_message, :terminate, ACTION[:cancel], id)
    end

    # Stop a EC2 instance
    def save(id, drv_message)
        ec2_action(drv_message, :stop, ACTION[:save], id)
    end

    # Cancel a EC2 instance
    def restore(id, drv_message)
        ec2_action(drv_message, :start, ACTION[:restor], id)
    end

    # Get info (IP, and state) for a EC2 instance
    def poll(id, drv_message)
        msg = decode(drv_message)

        deploy_id = msg.elements["DEPLOY_ID"].text

        info =  "#{POLL_ATTRIBUTE[:usedmemory]}=0 " \
                "#{POLL_ATTRIBUTE[:usedcpu]}=0 " \
                "#{POLL_ATTRIBUTE[:nettx]}=0 " \
                "#{POLL_ATTRIBUTE[:netrx]}=0"


        exe = exec_and_log_ec2(:describe, nil, deploy_id, id)
        if exe.code != 0
            send_message(ACTION[:poll], RESULT[:failure], id, exe.stderr)
            return
        end

        exe.stdout.match(Regexp.new("INSTANCE\\s+#{deploy_id}\\s+(.+)"))

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

        send_message(ACTION[:poll], RESULT[:success], id, info)
    end

private

    def get_deployment_info(drv_message)
        msg = decode(drv_message)

        host        = msg.elements["HOST"].text
        local_dfile = msg.elements["LOCAL_DEPLOYMENT_FILE"].text

        if !local_dfile
            send_message(ACTION[:deploy],RESULT[:failure],id,
                "Cannot open deployment file #{local_dfile}")
            return
        end

        tmp = File.new(local_dfile)
        xml = REXML::Document.new tmp
        tmp.close()

        ec2 = nil

        all_ec2_elements = xml.root.get_elements("EC2")

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
                send_message(ACTION[:deploy],RESULT[:failure],id,
                    "Cannot find EC2 element in deployment file "<<
                    "#{local_dfile} or couldn't find any EC2 site matching "<<
                    "one of the template.")
                return
            end
        end

        ec2
    end

    # Execute an EC2 command and send the SUCCESS or FAILURE signal
    # +drv_message+: String, base64 encoded info sent by ONE
    # +ec2_action+: Symbol, one of the keys of the EC2 hash constant (i.e :run)
    # +one_action+: String, OpenNebula action
    # +id+: String, action id
    def ec2_action(drv_message, ec2_action, one_action, id)
        msg = decode(drv_message)

        deploy_id = msg.elements["DEPLOY_ID"].text

        exe = exec_and_log_ec2(ec2_action, nil, deploy_id, id)
        if exe.code != 0
            send_message(one_action, RESULT[:failure], id, exe.stderr)
        else
            send_message(one_action, RESULT[:success], id)
        end
    end

    # Execute an EC2 command and log the message if error
    # This function will build the command joining the :cmd value of the EC2
    # hash, the extra_params string and the options built from the :args schema
    # of the EC2 hash and the xml
    # +action+: Symbol, one of the keys of the EC2 hash constant (i.e :run)
    # +xml+: REXML Document, containing EC2 information
    # +extra_params+: String, extra information to be added to the command
    def exec_and_log_ec2(action, xml, extra_params, id)
        cmd = EC2[action][:cmd].clone
        cmd << ' ' << extra_params << ' ' if extra_params

        if EC2[action][:args]
            cmd << EC2[action][:args].map {|k,v|
                str = ec2_value(xml, k, &v[:proc])
                v[:opt] + ' ' + str if str
            }.join(' ')
        end

        LocalCommand.run(cmd, log_method(id))
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

# EC2Driver Main program

ec2_conf = ARGV.last

if ec2_conf
    ec2_conf = ETC_LOCATION + ec2_conf if ec2_conf[0] != ?/
end

ec2_driver = EC2Driver.new(ec2_conf)
ec2_driver.start_driver
