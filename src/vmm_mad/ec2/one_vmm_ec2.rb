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

require 'pp'
require "VirtualMachineDriver"
require "CommandManager"
require "rexml/document"

# The main class for the EC2 driver
class EC2Driver < VirtualMachineDriver

    # EC2 commands constants
    EC2 = {
        :run       => "#{EC2_LOCATION}/bin/ec2-run-instances",
        :terminate => "#{EC2_LOCATION}/bin/ec2-terminate-instances",
        :describe  => "#{EC2_LOCATION}/bin/ec2-describe-instances",
        :associate => "#{EC2_LOCATION}/bin/ec2-associate-address",
        :authorize => "#{EC2_LOCATION}/bin/ec2-authorize",
        :tags      => "#{EC2_LOCATION}/bin/ec2-create-tags"
    }

    # EC2 constructor, loads defaults for the EC2Driver
    def initialize(ec2_conf = nil)

        if !EC2_JVM_CONCURRENCY
            concurrency = 5
        else
            concurrency = EC2_JVM_CONCURRENCY.to_i
        end

        super('',
            :concurrency => concurrency,
            :threaded => true
        )

        @defaults = Hash.new

        if ec2_conf && File.exists?(ec2_conf)
            fd  = File.new(ec2_conf)
            xml = REXML::Document.new fd
            fd.close()

            return if !xml || !xml.root

            ec2 = xml.root.elements["EC2"]

            return if !ec2

            @defaults["KEYPAIR"]         = ec2_value(ec2,"KEYPAIR")
            @defaults["AUTHORIZEDPORTS"] = ec2_value(ec2,"AUTHORIZEDPORTS")
            @defaults["INSTANCETYPE"]    = ec2_value(ec2,"INSTANCETYPE")
        end
    end

    # DEPLOY action, also sets ports and ip if needed
    def deploy(id, drv_message)
        msg = decode(drv_message)

        host        = msg.elements["HOST"].text

        local_dfile = msg.elements["LOCAL_DEPLOYMENT_FILE"].text

        if !local_dfile
            send_message(ACTION[:deploy],RESULT[:failure],id,
                "Can not open deployment file #{local_dfile}")
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
                    "Can not find EC2 element in deployment file "<<
                    "#{local_dfile} or couldn't find any EC2 site matching "<<
                    "one of the template.")
                return
            end
        end

        aki          = ec2_value(ec2,"AKI")
        ami          = ec2_value(ec2,"AMI")
        ports        = ec2_value(ec2,"AUTHORIZEDPORTS")
        blockmapping = ec2_value(ec2,"BLOCKDEVICEMAPPING")
        clienttoken  = ec2_value(ec2,"CLIENTTOKEN")
        ec2region    = host_info("deploy",host,"EC2REGION")
        eip          = ec2_value(ec2,"ELASTICIP")
        type         = ec2_value(ec2,"INSTANCETYPE")
        keypair      = ec2_value(ec2,"KEYPAIR")
        licensepool  = ec2_value(ec2,"LICENSEPOOL")
        clustergroup = ec2_value(ec2,"PLACEMENTGROUP")
        privateip    = ec2_value(ec2,"PRIVATEIP")
        ramdisk      = ec2_value(ec2,"RAMDISK")
        secgroup     = ec2_value(ec2,"SECURITYGROUPS")
        subnetid     = ec2_value(ec2,"SUBNETID")
        tags         = ec2_value(ec2,"TAGS")
        tenancy      = ec2_value(ec2,"TENANCY")
        vpcid        = ec2_value(ec2,"VPCID")
        waitb4eip    = ec2_value(ec2,"WAITFORINSTANCE")
        ec2context    = ""

        # get context data, if any
        all_context_elements = xml.root.get_elements("CONTEXT")
        context_root = all_context_elements[0]
        if context_root
            context_ud  = ec2_value(context_root,"USERDATA")
            context_udf = ec2_value(context_root,"USERDATAFILE")
            ec2context << " -d '#{context_ud}'" if context_ud
            ec2context << " -f #{context_udf}" if context_udf
        end

        if !ami
            send_message(ACTION[:deploy],RESULT[:failure],id,
                "Can not find AMI in deployment file #{local_dfile}")
            return
        end

        deploy_cmd = "#{EC2[:run]} --region #{ec2region} #{ec2context}"
        deploy_cmd << " #{ami}"
        deploy_cmd << " --kernel #{aki}" if aki
        deploy_cmd << " -b #{blockmapping}" if blockmapping
        deploy_cmd << " --client-token #{clienttoken}" if clienttoken
        deploy_cmd << " -k #{keypair}" if keypair
        deploy_cmd << " --license-pool #{licensepool}" if licensepool
        deploy_cmd << " -t #{type}" if type
        deploy_cmd << " --ramdisk #{ramdisk}" if ramdisk
        deploy_cmd << " --placement-group #{clustergroup}" if clustergroup
        if subnetid
            deploy_cmd << " -s #{subnetid}"
            deploy_cmd << " --private-ip-address #{privateip}" if privateip
            deploy_cmd << " --tenancy #{tenancy}" if tenancy
        end
        if secgroup
            for grouptok in secgroup.split(',')
                deploy_cmd << " -g #{grouptok}"
            end
        end

        deploy_exe = LocalCommand.run(deploy_cmd, log_method(id))

        if deploy_exe.code != 0
            send_message(ACTION[:deploy],RESULT[:failure],id)
            return
        end

        if !deploy_exe.stdout.match(/^INSTANCE\s*(.+?)\s/)
            send_message(ACTION[:deploy],RESULT[:failure],id,
                "Could not find instance id. Check ec2-describe-instances")
            return
        end

        deploy_id = $1

        if ports
            ports_cmd = "#{EC2[:authorize]} --region #{ec2region} default -p #{ports}"
            ports_exe = LocalCommand.run(ports_cmd, log_method(id))
        end

        # adding EC2 tags if any are defined in the EC2 section.
        # Tags should be defined as a TAG=VAL comma seperated string like
        #   TAGS="Tag1=Val1, Tag2=Val2, ..."
        #
        # Notes:
        #   - If 'Value' starts with a '$', the code will try to resolve it as
        #     a variable name. For example the special tag 'Name' can be use
        #     to define the name of the instance visible in the AWS Console
        #     with the following tag definition
        #     TAGS="Name=$NAME, tag2=val2, ..."
        #
        #     To resolve the variables, the instance's deployment.0 file
        #     is parsed as follow:
        #      -> try to find an element corresponding to the variable name at
        #         the root of the xml tree
        #      -> if none is found, another search if tried at second level of
        #         the tree
        #      -> In both cases, the first match will be used so you know what
        #         to look at if you don't get what you expect... might be
        #         fixed in the future if needed.
        if tags
            tags_cmd = "#{EC2[:tags]} --region #{ec2region} #{deploy_id}"
            for tag in tags.split(',')
                token = tag.split('=')
                t_regex = /^(.{1})(.*)$/
                t_match = t_regex.match(token[1])
                if t_match[1] == "$"
                    value = ""
                    element = xml.root.elements[t_match[2]]
                    element = xml.root.elements["*/" << t_match[2]] unless element
                    value = element.text.strip if element && element.text
                    tag = token[0].strip << "=" << value.chomp
                end
                tags_cmd << " -t #{tag}"
            end
            tags_exe = LocalCommand.run(tags_cmd, log_method(id))
        end

        if eip
            if subnetid
                ip_cmd = "#{EC2[:associate]} --region #{ec2region} -a #{eip} -i #{deploy_id}"
            else
                ip_cmd = "#{EC2[:associate]} --region #{ec2region} #{eip} -i #{deploy_id}"
            end

            # Make sure instance is running state before assigning Elastic IP
            if waitb4eip
                pos=2
                pos=1 if subnetid
                wait4instance(ec2region,id,deploy_id,pos,"running")
            end

            ip_exe = LocalCommand.run(ip_cmd, log_method(id))
            if !ip_exe.stdout.match(/^ADDRESS\s*(.+?)\s/)
                send_message(ACTION[:deploy],RESULT[:failure],id,
                    "Could not associate Elastic IP. Check template definition.")
                return
            end
        end

        send_message(ACTION[:deploy],RESULT[:success],id,deploy_id)
    end

    # Shutdown a EC2 instance
    def shutdown(id, drv_message)
        msg = decode(drv_message)

        host      = msg.elements["HOST"].text
        deploy_id = msg.elements["DEPLOY_ID"].text

        ec2_terminate(ACTION[:shutdown], id, deploy_id, host)
    end

    # Reboot a EC2 instance
    def reboot(id, drv_message)
        ec2region = host_info("reboot",host,"EC2REGION")

        cmd = "#{EC2_LOCATION}/bin/ec2-reboot-instances --region #{ec2region} #{deploy_id}"
        exe = LocalCommand.run(cmd, log_method(id))

        if exe.code != 0
            result = RESULT[:failure]
        else
            result = RESULT[:success]
        end

        send_message(action,result,id)
    end

    # Cancel a EC2 instance
    def cancel(id, drv_message)
        msg = decode(drv_message)

        host      = msg.elements["HOST"].text
        deploy_id = msg.elements["DEPLOY_ID"].text

        ec2_terminate(ACTION[:cancel], id, deploy_id, host)
    end

    # Get info (IP, and state) for a EC2 instance
    def poll(id, drv_message)
        msg = decode(drv_message)

        host      = msg.elements["HOST"].text
        deploy_id = msg.elements["DEPLOY_ID"].text
        ec2region = host_info("poll",host,"EC2REGION")

        info =  "#{POLL_ATTRIBUTE[:usedmemory]}=0 " \
                "#{POLL_ATTRIBUTE[:usedcpu]}=0 " \
                "#{POLL_ATTRIBUTE[:nettx]}=0 " \
                "#{POLL_ATTRIBUTE[:netrx]}=0"

        cmd  = "#{EC2[:describe]} --region #{ec2region} --hide-tags #{deploy_id}"
        exe  = LocalCommand.run(cmd, log_method(id))

        if exe.code != 0
            send_message(ACTION[:poll],RESULT[:failure],id)
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

    def ec2_terminate(action, id, deploy_id, host)
        ec2region = host_info("terminate",host,"EC2REGION")

        cmd = "#{EC2_LOCATION}/bin/ec2-terminate-instances --region #{ec2region} #{deploy_id}"
        exe = LocalCommand.run(cmd, log_method(id))

        if exe.code != 0
            result = RESULT[:failure]
        else
            result = RESULT[:success]
        end

        send_message(action,result,id)
    end

    def ec2_value(xml,name)
        value   = nil
        element = xml.elements[name]
        value   = element.text.strip if element && element.text

        if !value
            value = @defaults[name]
        end

        return value
    end
    def host_info(action,host,key)
        # get EC2REGION parameter from the selected host
        query_cmd = "#{ONE_LOCATION}/bin/onehost show #{host}"
        query_exe = LocalCommand.run(query_cmd, log_method(id))

        if query_exe.code != 0
            send_message(action,RESULT[:failure],host)
            return
        end

        if !query_exe.stdout.match(/^#{key}=(.+?)\s/)
            send_message(action,RESULT[:failure],host,
                "Could not find #{param} parameter for host #{host}. Use onehost update #{host} to define this paramete first")
            return
        end

        return $1
    end
    def wait4instance(region,id,deploy_id,pos,value)
        found = 0
        while found == 0 do
            poll_cmd  = "#{EC2[:describe]} --region #{region} --hide-tags #{deploy_id}"
            poll_exe  = LocalCommand.run(poll_cmd, log_method(id))

            if poll_exe.code != 0
                send_message(ACTION[:deploy],RESULT[:failure],id,
                   "Error polling instance.")
                return
            end

            poll_exe.stdout.match(Regexp.new("INSTANCE\\s+#{deploy_id}\\s+(.+)"))

            if !$1
                send_message(ACTION[:deploy],RESULT[:failure],id,
                    "ERROR: Instance not found and should have been created.")
                return
            else
                monitor_data = $1.split(/\s+/)
                found = 1 if monitor_data[pos] == value
            end
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
