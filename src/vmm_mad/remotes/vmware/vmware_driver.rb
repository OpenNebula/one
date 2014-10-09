# ---------------------------------------------------------------------------- #
# Copyright 2010-2014, C12G Labs S.L                                           #
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

ONE_LOCATION=ENV["ONE_LOCATION"] if !defined?(ONE_LOCATION)

if !ONE_LOCATION
    RUBY_LIB_LOCATION="/usr/lib/one/ruby" if !defined?(RUBY_LIB_LOCATION)
else
    RUBY_LIB_LOCATION=ONE_LOCATION+"/lib/ruby" if !defined?(RUBY_LIB_LOCATION)
end

$: << RUBY_LIB_LOCATION
$: << File.dirname(__FILE__)

require 'vi_driver'
require "scripts_common"
require 'yaml'
require "CommandManager"
require 'rexml/document'

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
       conf            = YAML::load(File.read(CONF_FILE))

       @uri            = conf[:libvirt_uri].gsub!('@HOST@', host)
       @host           = host
       @reserve_memory = conf[:reserve_memory_in_disk]

       @user           = conf[:username]
       if conf[:password] and !conf[:password].empty?
          @pass=conf[:password]
       else
          @pass="\"\""
       end

       @datacenter     = conf[:datacenter]
       @vcenter        = conf[:vcenter]
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

            exit(-1) if deploy_id.nil?
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
        rc, info = do_action("virsh -c #{@uri} --readonly dominfo #{deploy_id}")

        if rc
            # Destroy the VM
            rc, info = do_action("virsh -c #{@uri} destroy #{deploy_id}")

            exit info if rc == false

            OpenNebula.log_debug("Successfully canceled domain #{deploy_id}.")
        end

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
    # Restore a VM from a previously saved checkpoint                          #
    # ------------------------------------------------------------------------ #
    def restore(checkpoint)
        begin
            vm_id = File.basename(File.dirname(checkpoint))
            vm_folder=VAR_LOCATION <<
                      "/vms/" << vm_id
            dfile=`ls -1 #{vm_folder}/deployment*|tail -1`
            dfile.strip!
        rescue => e
            OpenNebula.log_error("Cannot open checkpoint #{e.message}")
            exit(-1)
        end

        if not domain_defined?(id)
            deploy_id = define_domain(dfile)
            exit(-1) if deploy_id.nil?
        else
            deploy_id = "one-#{id}"
        end

        # Revert snapshot VM
        # Note: This assumes the checkpoint name is "checkpoint", to change
        # this it is needed to change also [1]
        #
        # [1] $ONE_LOCATION/lib/remotes/vmm/vmware/checkpoint

        2.times {
            rc, info = do_action(
                "virsh -c #{@uri} snapshot-revert #{deploy_id} checkpoint")
            break if rc == true
        }

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

    # ------------------------------------------------------------------------ #
    # Creates a new system snapshot                                            #
    # ------------------------------------------------------------------------ #
    def snapshot_create(deploy_id)
        rc, info = do_action(
            "virsh -c #{@uri} snapshot-create-as #{deploy_id}")

        exit info if rc == false

        hypervisor_id = info.split[2]

        return hypervisor_id
    end

    # ------------------------------------------------------------------------ #
    # Delete a system snapshot                                                 #
    # ------------------------------------------------------------------------ #
    def snapshot_delete(deploy_id, snapshot_id)
        rc, info = do_action(
            "virsh -c #{@uri} snapshot-delete #{deploy_id} #{snapshot_id}")

        exit info if rc == false
    end

    # ------------------------------------------------------------------------ #
    # Revert to a system snapshot                                              #
    # ------------------------------------------------------------------------ #
    def snapshot_revert(deploy_id, snapshot_id)
        action = "virsh -c #{@uri} snapshot-revert " <<
                 "--force #{deploy_id} #{snapshot_id}"

        rc, info = do_action(action)

        exit info if rc == false
    end

    # ######################################################################## #
    #                          DRIVER HELPER FUNCTIONS                         #
    # ######################################################################## #

    private

    #Generates an ESX command using ttyexpect
    def esx_cmd(command)
        cmd = "#{BIN_LOCATION}/tty_expect -u #{@user} -p #{@pass} #{command}"
    end

    #Performs a action usign libvirt
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

    #Performs a remote action using ssh
    def do_ssh_action(cmd, stdin=nil)
        rc = SSHCommand.run("'#{cmd}'", @host, nil, stdin)

        if rc.code == 0
            return [true, rc.stdout]
        else
            err = "Error executing: #{cmd} on host: #{@host} " <<
                  "err: #{rc.stderr} out: #{rc.stdout}"
            OpenNebula.log_error(err)
            return [false, rc.code]
        end
    end

    # Undefines a domain in the ESX hypervisor
    def undefine_domain(id)
        if @vcenter and !@vcenter.empty? and @datacenter and !@datacenter.empty?
            undefine_uri =
                  "vpx://#{@vcenter}/#{@datacenter}/#{@host}/?no_verify=1"
        else
            undefine_uri = @uri
        end

        rc = false

        30.times do
            rc, info = do_action("virsh -c #{undefine_uri} undefine #{id}")
            break if rc
            sleep 1
        end

        if rc == false
            OpenNebula.log_error("Error undefining domain #{id}")
            OpenNebula.log_error("Domain #{id} has to be undefined manually")
            return rc
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

        handle_metadata(dfile, deploy_id)

        return deploy_id
    end

    def domain_defined?(one_id)
        rc, info  = do_action("virsh -c #{@uri} dominfo one-#{one_id}", false)
        return rc
    end

    def handle_metadata(dfile, deploy_id)
        dfile_hash = REXML::Document.new(File.open(dfile).read)

        # Check for the known elements in metadata
        guestos   = REXML::XPath.first(dfile_hash, "/domain/metadata/guestos")
        pcibridge = REXML::XPath.first(dfile_hash, "/domain/metadata/pcibridge")

        if (guestos || pcibridge)
            VIDriver::initialize(@host, false)

            vivm = VIDriver::VIVm.new(deploy_id, nil)

            vivm.set_guestos(guestos.text) if guestos

            vivm.set_pcibridge(pcibridge.text) if pcibridge
        end

        # Append the raw datavmx to vmx file
        metadata   = REXML::XPath.first(dfile_hash, "/domain/metadata/datavmx")

        if metadata.nil? || metadata.text.nil? || metadata.text.strip.empty?
            metadata = ''
        else
            metadata = metadata.text
        end

        if !@reserve_memory
            mem_txt = REXML::XPath.first(dfile_hash, "/domain/memory").text
            mem     = mem_txt.to_i/1024

            metadata << "\\nsched.mem.min = \"#{mem}\""
            metadata << "\\nsched.mem.shares = \"normal\""
            metadata << "\\nsched.mem.pin = \"TRUE\""
        end

        return if metadata.strip.empty?

        # Get the ds_id for system_ds from the first disk
        disk   = REXML::XPath.first(dfile_hash, "/domain//disk/source")
        source = disk.attributes['file']
        ds_id  = source.match(/^\[(.*)\](.*)/)[1]

        name   = REXML::XPath.first(dfile_hash, "/domain/name").text
        vm_id  = name.match(/^one-(.*)/)[1]

        # Reconstruct path to vmx & add metadata
        path_to_vmx =  "\$(find /vmfs/volumes/#{ds_id}/#{vm_id}/"
        path_to_vmx << " -name #{name}.vmx)"

        metadata.gsub!("\\n","\n")

        sed_str = metadata.scan(/^([^ ]+) *=/).join("|")

        cmd_str = "sed -ri \"/^(#{sed_str}) *=.*$/d\" #{path_to_vmx}; "
        cmd_str << "cat >> #{path_to_vmx}"

        do_ssh_action(cmd_str, metadata)
    end
end
