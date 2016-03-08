# -------------------------------------------------------------------------- #
# Copyright 2002-2015, OpenNebula Project, OpenNebula Systems                #
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
require 'vnmmad'

class OpenNebulaVMware < VNMMAD::VNMDriver

    DRIVER = "vmware"
    XPATH_FILTER = "TEMPLATE/NIC[VN_MAD='vmware']"
    VCLI_CMD     = "/sbin/esxcfg-vswitch"

    def initialize(vm, deploy_id = nil, hypervisor = nil)
        super(vm,XPATH_FILTER,deploy_id,hypervisor)

        @locking = false
        @config  = YAML::load(File.read(CONF_FILE))
    end

    def activate
        lock

        vm_id =  @vm['ID']
        host = @vm['HISTORY_RECORDS/HISTORY/HOSTNAME']
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

            add_pg_to_switch(host, pg, switch, vlan)
        end

        unlock
        return 0
    end

private

    # Add port group to switch in host, and sets vlan if available
    def add_pg_to_switch(host, pg, switch, vlan)
        # Check's first if the vSwitch exists
        add_pg_cmd  = "((esxcfg-vswitch #{switch} -l|grep #{pg})"
        add_pg_cmd << " || #{VCLI_CMD} #{switch} --add-pg #{pg})"

        if vlan
            add_pg_cmd << "; #{VCLI_CMD} #{switch} -p #{pg} --vlan=#{vlan}"
        end

        do_ssh_action(add_pg_cmd, host)
    end

    # Performs a remote action in host using ssh
    def do_ssh_action(cmd, host)
        rc = SSHCommand.run("'#{cmd}'", host, nil, nil)

        if rc.code == 0
            return [true, rc.stdout]
        else
            err = "Error executing: #{cmd} on host: #{@host} " <<
                  "err: #{rc.stderr} out: #{rc.stdout}"
            OpenNebula.log_error(err)
            return [false, rc.code]
        end
    end
end
