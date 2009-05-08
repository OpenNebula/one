#!/usr/bin/env ruby
# -------------------------------------------------------------------------- #
# Copyright 2002-2009, Distributed Systems Architecture Group, Universidad   #
# Complutense de Madrid (dsa-research.org)                                   #
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
XENTOP_PATH  = ENV["XENTOP_PATH"]
XM_PATH      = ENV["XM_PATH"]

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

# ---------------------------------------------------------------------------- #
# The main class for the Xen driver                                            #
# ---------------------------------------------------------------------------- #
class XenDriver < VirtualMachineDriver

    # ------------------------------------------------------------------------ #
    # Xen commands constants                                                   #
    # ------------------------------------------------------------------------ #
    XEN = {
        :create   => "sudo #{XM_PATH} create",
        :shutdown => "sudo #{XM_PATH} shutdown",
        :cancel   => "sudo #{XM_PATH} destroy",
        :save     => "sudo #{XM_PATH} save",
        :restore  => "sudo #{XM_PATH} restore",
        :migrate  => "sudo #{XM_PATH} migrate -l",
        :poll     => "sudo #{XENTOP_PATH} -bi2",
        :credits  => "sudo #{XM_PATH} sched-cred"
    }

    XEN_INFO = {
        :name       => 0,
        :state      => 1,
        :cpu_sec    => 2,
        :cpu_per    => 3,
        :mem        => 4,
        :mem_per    => 5,
        :maxmem     => 6,
        :maxmem_per => 7,
        :vcpus      => 8,
        :nets       => 9,
        :nettx      => 10,
        :netrx      => 11,
        :vbds       => 12,
        :vbd_oo     => 13,
        :vbd_rd     => 14,
        :vbd_wr     => 15,
        :ssid       => 16
    }

    # ------------------------------------------------------------------------ #
    # XenDriver constructor                                                    #
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

        cmd = "cat > #{remote_dfile} && #{XEN[:create]} #{remote_dfile}"

        values  = domain.scan(/^#O (.*?) = (.*)$/)
        credits = values.assoc("CPU_CREDITS")

        if domain.match(/^name = '(.*?)'$/) && credits
            cmd << " && #{XEN[:credits]} -d #{$1} -w #{credits[1]}"
        end

        deploy_exe = SSHCommand.run("'#{cmd}'", host, log_method(id), domain)

        if deploy_exe.code != 0
            send_message(ACTION[:deploy],RESULT[:failure],id)
        elsif deploy_exe.stdout.match(/^Started domain (.*)/)
            send_message(ACTION[:deploy],RESULT[:success],id,$1)
        else
            send_message(ACTION[:deploy],RESULT[:failure],id,
                         "Domain id not found in #{XEN[:create]} output.")
        end
    end

    # ------------------------------------------------------------------------ #
    # Basic Domain Management Operations                                       #
    # ------------------------------------------------------------------------ #
    def shutdown(id, host, deploy_id, not_used)
        ssh_action("#{XEN[:shutdown]} #{deploy_id}", id, host, :shutdown)
    end

    def cancel(id, host, deploy_id, not_used)
        ssh_action("#{XEN[:cancel]} #{deploy_id}", id, host, :cancel)
    end

    def save(id, host, deploy_id, file)
        ssh_action("#{XEN[:save]} #{deploy_id} #{file}", id, host, :save)
    end

    def restore(id, host, deploy_id, file)
        ssh_action("#{XEN[:restore]} #{file}", id, host, :restore)
    end

    def migrate(id, host, deploy_id, dest_host)
        ssh_action("#{XEN[:migrate]} #{deploy_id} #{dest_host}",
                   id, host, :migrate)
    end

    # ------------------------------------------------------------------------ #
    # Get info from the Xen Domain.                                            #
    # ------------------------------------------------------------------------ #
    def poll(id, host, deploy_id, not_used)

        exe = SSHCommand.run("#{XEN[:poll]} #{deploy_id}", host, log_method(id))

        if exe.code != 0
            send_message(ACTION[:poll], RESULT[:failure], id, info)
            return
        end

        dinfo = exe.stdout.split(/$/).select { |l|
            l.match(/^ *(migrating-)?#{deploy_id} /) }[-1]

        if !dinfo
            send_message(ACTION[:poll], RESULT[:success], id,
                         "#{POLL_ATTRIBUTE[:state]}=#{VM_STATE[:deleted]}")
            return
        end

        dinfo.gsub!("no limit", "no_limit")
        data = dinfo.split

        info = "#{POLL_ATTRIBUTE[:usedmemory]}=#{data[XEN_INFO[:mem]]} " \
               "#{POLL_ATTRIBUTE[:usedcpu]}=#{data[XEN_INFO[:cpu_per]]} " \
               "#{POLL_ATTRIBUTE[:nettx]}=#{data[XEN_INFO[:nettx]]} " \
               "#{POLL_ATTRIBUTE[:netrx]}=#{data[XEN_INFO[:netrx]]} "

        case data[XEN_INFO[:state]].gsub!("-", "")
            when "r", "b", "s","d"
                state = VM_STATE[:active]
            when "p"
                state = VM_STATE[:paused]
            when "c"
                state = VM_STATE[:error]
            else
                state = VM_STATE[:unknown]
        end

        info << " #{POLL_ATTRIBUTE[:state]}=#{state}"

        send_message(ACTION[:poll], RESULT[:success], id, info)
    end
end

# ---------------------------------------------------------------------------- #
# XenDriver Main program                                                       #
# ---------------------------------------------------------------------------- #

xen_driver = XenDriver.new
xen_driver.start_driver
