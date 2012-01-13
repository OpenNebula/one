# -------------------------------------------------------------------------- #
# Copyright 2002-2012, OpenNebula Project Leads (OpenNebula.org)             #
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

# ---------------------------------------------------------------------------#
# Set up the environment for the driver                                      #
# ---------------------------------------------------------------------------#
ONE_LOCATION = ENV["ONE_LOCATION"]

if !ONE_LOCATION
   ETC_LOCATION      = "/etc/one/"
   RUBY_LIB_LOCATION = "/usr/lib/one/ruby"
else
   ETC_LOCATION      = ONE_LOCATION + "/etc/"
   RUBY_LIB_LOCATION = ONE_LOCATION + "/lib/ruby"
end

CONF_FILE = ETC_LOCATION + "/vmwarerc"

$: << RUBY_LIB_LOCATION
# ---------------------------------------------------------------------------#

require 'yaml'
require 'CommandManager'
require 'OpenNebulaNetwork'

class OpenNebulaVMware < OpenNebulaNetwork
    XPATH_FILTER = "TEMPLATE/NIC"
    VCLI_PREFIX  = "/usr/bin/vicfg"

    def initialize(vm, deploy_id = nil, hypervisor = nil)
        super(vm,XPATH_FILTER,deploy_id,hypervisor)

        @config = YAML::load(File.read(CONF_FILE))

        set_conn_options
    end

    def set_conn_options
        username = @config[:username]
        password = @config[:password]
        server   = @vm['HISTORY_RECORDS/HISTORY/HOSTNAME']

        @conn_options   =   "--username=#{username} " <<
                            "--password=#{password} " <<
                            "--server=#{server}"
    end

    def activate
        vm_id =  @vm['ID']
        hostname = @vm['HISTORY_RECORDS/HISTORY/HOSTNAME']
        process do |nic|
            switch     = nic[:bridge]
            network_id = nic[:network_id]
            pg         = "one-pg-#{network_id}"

            if nic[:vlan] == "YES"
                if nic[:vlan_id]
                    vlan = nic[:vlan_id]
                else
                    vlan = CONF[:start_vlan] + nic[:network_id].to_i
                end
            else
                vlan = nil
            end

            add_pg(pg, switch, vlan) if !check_pg(pg, switch)
        end

        return 0
    end


    def vcli(command, params)
        cmd = "#{VCLI_PREFIX}-#{command.to_s} #{@conn_options} #{params}"
    end

    def vswitch(params)
        vcli(:vswitch, params)
    end

    def check_pg(pg, switch)
        cmd = vcli(:vswitch, "--check-pg #{pg} #{switch}")
        rc, output = do_action(cmd)
        output.strip!
        if output.match(/^\d+$/)
            return output != "0"
        else
            OpenNebula.log_error("Unexpected output for #{cmd}:\n#{output}")
            return false
        end
    end

    def add_pg(pg, switch, vlan=nil)
        add_pg_cmd = vcli(:vswitch, "--add-pg #{pg} #{switch}")
        do_action(add_pg_cmd)

        if vlan
            set_vlan_cmd = vcli(:vswitch, "--vlan #{vlan} --pg #{pg} #{switch}")
            do_action(set_vlan_cmd)
        end
    end

    #Performs an action using vCLI
    def do_action(cmd)
        rc = LocalCommand.run(cmd)

        if rc.code == 0
            OpenNebula.log("Executed \"#{cmd}\".")
            return [true, rc.stdout]
        else
            err = "Error executing: #{cmd} err: #{rc.stderr} out: #{rc.stdout}"
            OpenNebula.log_error(err)
            return [false, rc.code]
        end
    end
end
