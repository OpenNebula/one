#!/usr/bin/env ruby
# -------------------------------------------------------------------------- #
# Copyright 2002-2010, OpenNebula Project Leads (OpenNebula.org)             #
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

# ---------------------------------------------------------------------------- #
# Set up the environment for the driver                                        #
# ---------------------------------------------------------------------------- #

ONE_LOCATION = ENV["ONE_LOCATION"]

if !ONE_LOCATION
    RUBY_LIB_LOCATION = "/usr/lib/one/ruby"
    ETC_LOCATION      = "/etc/one/"
else
    RUBY_LIB_LOCATION = ONE_LOCATION + "/lib/ruby"
    ETC_LOCATION      = ONE_LOCATION + "/etc/"
end

if ENV["LIBVIRT_DEFAULT_URI"]
    LIBVIRT_URI = ENV["LIBVIRT_DEFAULT_URI"]
else
    LIBVIRT_URI = "qemu:///system"
end

$: << RUBY_LIB_LOCATION

require 'pp'
require "VirtualMachineDriver"

# ---------------------------------------------------------------------------- #
# The main class for the LibVirt driver                                        #
# ---------------------------------------------------------------------------- #
class LibVirtDriver < VirtualMachineDriver

    # ------------------------------------------------------------------------ #
    # Libvirt commands constants                                               #
    # ------------------------------------------------------------------------ #
    QEMU_PROTOCOL = "qemu+ssh"

    LIBVIRT       = {
        :create   => "virsh --connect #{LIBVIRT_URI} create",
        :shutdown => "virsh --connect #{LIBVIRT_URI} shutdown",
        :cancel   => "virsh --connect #{LIBVIRT_URI} destroy",
        :save     => "virsh --connect #{LIBVIRT_URI} save",
        :restore  => "virsh --connect #{LIBVIRT_URI} restore",
        :migrate  => "virsh --connect #{LIBVIRT_URI} migrate --live",
        :poll     => "virsh --connect #{LIBVIRT_URI} dominfo"
    }

    # ------------------------------------------------------------------------ #
    # LibvirtDriver constructor                                                #
    # ------------------------------------------------------------------------ #
    def initialize()
        super(15,true)
    end

    # ------------------------------------------------------------------------ #
    # DEPLOY action, sends the deployment file to remote host                  #
    # ------------------------------------------------------------------------ #
    def deploy(id, host, remote_dfile, not_used)

        local_dfile = get_local_deployment_file(remote_dfile)

        if !local_dfile || File.zero?(local_dfile)
            send_message(ACTION[:deploy],RESULT[:failure],id,
                "Can not open deployment file #{local_dfile}")
            return
        end

        tmp    = File.new(local_dfile)
        domain = tmp.read
        tmp.close()

        images_path = File.dirname remote_dfile
        cmd = "mkdir -p #{images_path} && cat > #{remote_dfile} && " \
              "#{LIBVIRT[:create]} #{remote_dfile}"

        deploy_exe = SSHCommand.run("'#{cmd}'", host, log_method(id), domain)

        if deploy_exe.code != 0
            send_message(ACTION[:deploy],RESULT[:failure],id)
        elsif deploy_exe.stdout.match(/^Domain (.*) created from .*$/)
            send_message(ACTION[:deploy],RESULT[:success],id,$1)
        else
            send_message(ACTION[:deploy],RESULT[:failure],id,
                         "Domain id not found in #{LIBVIRT[:create]} output.")
        end
    end

    # ------------------------------------------------------------------------ #
    # Basic Domain Management Operations                                       #
    # ------------------------------------------------------------------------ #
    def shutdown(id, host, deploy_id, not_used)
        cmd="#{LIBVIRT[:shutdown]} #{deploy_id} && " \
            "while [ $(#{LIBVIRT[:poll]} #{deploy_id} > /dev/null 2>&1; " \
            "echo $?) -eq \"0\" ]; do sleep 2; done ; sleep 4"

        execution=SSHCommand.run('bash', host, log_method(id), cmd)

        if execution.code !=0
            send_message(ACTION[:shutdown], RESULT[:failure], id)
        else
            send_message(ACTION[:shutdown], RESULT[:success], id)
        end
    end

    def cancel(id, host, deploy_id, not_used)
        ssh_action("#{LIBVIRT[:cancel]} #{deploy_id}", id, host, :cancel)
    end

    def save(id, host, deploy_id, file)
        ssh_action("'touch #{file};#{LIBVIRT[:save]} #{deploy_id} #{file}'",id,host,:save)
    end

    def restore(id, host, deploy_id, file)
        ssh_action("#{LIBVIRT[:restore]} #{file}", id, host, :restore)
    end

    def migrate(id, host, deploy_id, dest_host)
        cmd = "#{LIBVIRT[:migrate]} #{deploy_id} "\
              "#{QEMU_PROTOCOL}://#{dest_host}/system"

        ssh_action(cmd, id, host, :migrate)
    end

    # ------------------------------------------------------------------------ #
    # Get info from the Libvirt Domain                                         #
    # ------------------------------------------------------------------------ #
    def poll(id, host, deploy_id, not_used)

        exe  = SSHCommand.run("#{LIBVIRT[:poll]} #{deploy_id}", host,
                              log_method(id))

        if exe.code != 0
            result = :failure
            info   = "-"

            if exe.stderr.match(/^error: failed to get domain '#{deploy_id}'/)
                info   = "#{POLL_ATTRIBUTE[:state]}=#{VM_STATE[:deleted]}"
                result = :success
            end

            send_message(ACTION[:poll], RESULT[result], id, info)
            return
        end

        info = ""

        exe.stdout.each_line {|line|
            columns=line.split(":").collect {|c| c.strip }

            case columns[0]
                when 'Used memory'
                    info << " #{POLL_ATTRIBUTE[:usedmemory]}=" \
                         << (columns[1].to_i).to_s
                when 'State'
                    case columns[1]
                        when "running","blocked","shutdown","dying"
                            state = VM_STATE[:active]
                        when "paused"
                            state = VM_STATE[:paused]
                        when "crashed"
                            state = VM_STATE[:error]
                        else
                            state = VM_STATE[:unknown]
                    end

                    info << " #{POLL_ATTRIBUTE[:state]}=#{state}"
            end
        }

        send_message(ACTION[:poll], RESULT[:success], id, info)
    end
end

# ---------------------------------------------------------------------------- #
# LibvirtDriver Main program
# ---------------------------------------------------------------------------- #

kvm_driver = LibVirtDriver.new
kvm_driver.start_driver
