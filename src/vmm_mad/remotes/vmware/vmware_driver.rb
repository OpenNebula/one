# ---------------------------------------------------------------------------- #
# Copyright 2010-2012, C12G Labs S.L                                           #
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

require "scripts_common"
require 'yaml'
require "CommandManager"

class VMwareDriver
    # -------------------------------------------------------------------------#
    # Set up the environment for the driver                                    #
    # -------------------------------------------------------------------------#
    ONE_LOCATION = ENV["ONE_LOCATION"]

    if !ONE_LOCATION
       BIN_LOCATION = "/usr/bin" 
       LIB_LOCATION = "/usr/lib/one"
       ETC_LOCATION = "/etc/one/" 
       VAR_LOCATION = "/var/lib/one"
    else
       LIB_LOCATION = ONE_LOCATION + "/lib"
       BIN_LOCATION = ONE_LOCATION + "/bin" 
       ETC_LOCATION = ONE_LOCATION  + "/etc/"
       VAR_LOCATION = ONE_LOCATION + "/var/"
    end

    CONF_FILE   = ETC_LOCATION + "/vmwarerc"
    CHECKPOINT  = VAR_LOCATION + "/remotes/vmm/vmware/checkpoint"

    ENV['LANG'] = 'C'

    SHUTDOWN_INTERVAL = 5
    SHUTDOWN_TIMEOUT  = 500

    def initialize(host)
       conf  = YAML::load(File.read(CONF_FILE))
       
       @uri  = conf[:libvirt_uri].gsub!('@HOST@', host)

       @user = conf[:username]
       @pass = conf[:password]

       @datacenter = conf[:datacenter]
       @vcenter    = conf[:vcenter]
    end

    # ######################################################################## #
    #                       VMWARE DRIVER ACTIONS                              #
    # ######################################################################## #

    # ------------------------------------------------------------------------ #
    # Deploy & define a VM based on its description file                       #
    # ------------------------------------------------------------------------ #
    def deploy(dfile, id)
        # Define the domain if it is not already defined (e.g. from UNKNOWN)

        if not domain_defined?(id)
            deploy_id = define_domain(dfile)

            exit -1 if deploy_id.nil?
        else
            deploy_id = "one-#{id}"
        end

	   OpenNebula.log_debug("Successfully defined domain #{deploy_id}.")

        # Start the VM
        rc, info = do_action("virsh -c #{@uri} start #{deploy_id}")

        if rc == false
            undefine_domain(deploy_id)
            exit info
        end

        return deploy_id
    end

    # ------------------------------------------------------------------------ #
    # Cancels & undefine the VM                                                #
    # ------------------------------------------------------------------------ #
    def cancel(deploy_id)
        # Destroy the VM
        rc, info = do_action("virsh -c #{@uri} destroy #{deploy_id}")

        exit info if rc == false

        OpenNebula.log_debug("Successfully canceled domain #{deploy_id}.")

        # Undefine the VM
        undefine_domain(deploy_id)
    end

    # ------------------------------------------------------------------------ #
    # Reboots a running VM                                                     #
    # ------------------------------------------------------------------------ #
    def reboot(deploy_id)
        rc, info = do_action("virsh -c #{@uri} reboot #{deploy_id}")

        exit info if rc == false

        OpenNebula.log_debug("Domain #{deploy_id} successfully rebooted.")
    end

    # ------------------------------------------------------------------------ #
    # Reset a running VM                                                       #
    # ------------------------------------------------------------------------ #
    def reset(deploy_id)
        rc, info = do_action("virsh -c #{@uri} reset #{deploy_id}")

        exit info if rc == false

        OpenNebula.log_debug("Domain #{deploy_id} successfully reseted.")
    end

    # ------------------------------------------------------------------------ #
    # Migrate                                                                  #
    # ------------------------------------------------------------------------ #
    def migrate(deploy_id, dst_host, src_host)
        src_url  = "vpx://#{@vcenter}/#{@datacenter}/#{src_host}/?no_verify=1"
        dst_url  = "vpx://#{@vcenter}/#{@datacenter}/#{dst_host}/?no_verify=1"
         
        mgr_cmd  = "-r virsh -c #{src_url} migrate #{deploy_id} #{dst_url}"

        rc, info = do_action(mgr_cmd)

        exit info if rc == false
    end
    
    # ------------------------------------------------------------------------ #
    # Monitor a VM                                                             #
    # ------------------------------------------------------------------------ #
    def poll(deploy_id)
        rc, info = do_action("virsh -c #{@uri} --readonly dominfo #{deploy_id}")

        return "STATE=d" if rc == false

        state = ""

        info.split('\n').each{ |line|
            mdata = line.match("^State: (.*)")

            if mdata
                state = mdata[1].strip
                break
            end
        }

        case state
            when "running","blocked","shutdown","dying"
                state_short = 'a'
            when "paused"
                state_short = 'p'
            when "crashed"
                state_short = 'c'
            else
                state_short = 'd'
        end

        return "STATE=#{state_short}"
    end

    # ------------------------------------------------------------------------ #
    # Restore a VM from a previously saved checkpoint                          #
    # ------------------------------------------------------------------------ #
    def restore(checkpoint)
        begin
            # Define the VM
            dfile = VAR_LOCATION + "/" + 
                    File.basename(File.dirname(checkpoint)) + "/deployment.0"
        rescue => e
            OpenNebula.log_error("Cannot open checkpoint #{e.message}")
            exit -1
        end

        deploy_id = define_domain(dfile)

        exit -1 if deploy_id.nil?

        # Revert snapshot VM
        # Note: This assumes the checkpoint name is "checkpoint", to change 
        # this it is needed to change also [1]
        #
        # [1] $ONE_LOCATION/lib/remotes/vmm/vmware/checkpoint

        rc, info = do_action(
            "virsh -c #{@uri} snapshot-revert #{deploy_id} checkpoint")

        exit info if rc == false

        # Delete checkpoint
        rc, info = do_action(
            "virsh -c #{@uri} snapshot-delete #{deploy_id} checkpoint")
       
        OpenNebula.log_error("Could not delete snapshot") if rc == false
    end

    # ------------------------------------------------------------------------ #
    # Saves a VM taking a snapshot                                             #
    # ------------------------------------------------------------------------ #
    def save(deploy_id)
        # Take a snapshot for the VM
        rc, info = do_action(
            "virsh -c #{@uri} snapshot-create #{deploy_id} #{CHECKPOINT}")

        exit info if rc == false

        # Suspend VM
        rc, info = do_action("virsh -c #{@uri} suspend #{deploy_id}")

        exit info if rc == false

        # Undefine VM
        undefine_domain(deploy_id)
    end

    # ------------------------------------------------------------------------ #
    # Shutdown a VM                                                            #
    # ------------------------------------------------------------------------ #
    def shutdown(deploy_id)
        rc, info = do_action("virsh -c #{@uri} shutdown #{deploy_id}")

        exit info if rc == false

        counter = 0

        begin
            rc, info = do_action("virsh -c #{@uri} list")
            info     = "" if rc == false

            sleep SHUTDOWN_INTERVAL

            counter = counter + SHUTDOWN_INTERVAL 
        end while info.match(deploy_id) and counter < SHUTDOWN_TIMEOUT

        if counter >= SHUTDOWN_TIMEOUT
            OpenNebula.error_message(
                "Timeout reached, VM #{deploy_id} is still alive")
            exit - 1
        end

        undefine_domain(deploy_id)
    end

    # ######################################################################## #
    #                          DRIVER HELPER FUNCTIONS                         #
    # ######################################################################## #

    private

    #Generates an ESX command using ttyexpect
    def esx_cmd(command)
        cmd = "#{BIN_LOCATION}/tty_expect -u #{@user} -p #{@pass} #{command}"
    end

    #Performs a action usgin libvirt
    def do_action(cmd, log=true)
        rc = LocalCommand.run(esx_cmd(cmd))

        if rc.code == 0
            return [true, rc.stdout]
        else
            err = "Error executing: #{cmd} err: #{rc.stderr} out: #{rc.stdout}"
            OpenNebula.log_error(err) if log
            return [false, rc.code]
        end
    end

    # Undefines a domain in the ESX hypervisor
    def undefine_domain(id)
        rc, info = do_action("virsh -c #{@uri} undefine #{id}")

        if rc == false
            OpenNebula.log_error("Error undefining domain #{id}")
            OpenNebula.log_error("Domain #{id} has to be undefined manually")
            return info
        end

        return 0
    end

    #defines a domain in the ESX hypervisor
    def define_domain(dfile)
        deploy_id = nil
        rc, info  = do_action("virsh -c #{@uri} define #{dfile}")

        return nil if rc == false

        info.split('\n').each{ |line|
            mdata = line.match("Domain (.*) defined from (.*)")

            if mdata
                deploy_id = mdata[1]
                break
            end
        }
        
        deploy_id.strip!

        return deploy_id
    end

    def domain_defined?(one_id)
        rc, info  = do_action("virsh -c #{@uri} dominfo one-#{one_id}", false)

        return rc
    end
end
