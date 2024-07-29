#!/usr/bin/env ruby

# -------------------------------------------------------------------------- #
# Copyright 2002-2024, OpenNebula Project, OpenNebula Systems                #
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

# Set up the environment for the driver

ONE_LOCATION = ENV['ONE_LOCATION']

if !ONE_LOCATION
    RUBY_LIB_LOCATION = '/usr/lib/one/ruby'
    GEMS_LOCATION     = '/usr/share/one/gems'
    MAD_LOCATION      = '/usr/lib/one/mads'
    ETC_LOCATION      = '/etc/one/'
else
    RUBY_LIB_LOCATION = ONE_LOCATION + '/lib/ruby'
    GEMS_LOCATION     = ONE_LOCATION + '/share/gems'
    MAD_LOCATION      = ONE_LOCATION + '/lib/mads'
    ETC_LOCATION      = ONE_LOCATION + '/etc/'
end

# %%RUBYGEMS_SETUP_BEGIN%%
if File.directory?(GEMS_LOCATION)
    real_gems_path = File.realpath(GEMS_LOCATION)
    if !defined?(Gem) || Gem.path != [real_gems_path]
        $LOAD_PATH.reject! {|l| l =~ /vendor_ruby/ }

        # Suppress warnings from Rubygems
        # https://github.com/OpenNebula/one/issues/5379
        begin
            verb = $VERBOSE
            $VERBOSE = nil
            require 'rubygems'
            Gem.use_paths(real_gems_path)
        ensure
            $VERBOSE = verb
        end
    end
end
# %%RUBYGEMS_SETUP_END%%

$LOAD_PATH << RUBY_LIB_LOCATION
$LOAD_PATH << MAD_LOCATION

require 'VirtualMachineDriver'
require 'one_vnm'
require 'one_tm'
require 'one_datastore_exec'
require 'getoptlong'
require 'ssh_stream'
require 'rexml/document'

# VmmAction
class VmmAction

    attr_reader :data

    # Initialize a VmmAction object
    # @param[OpenNebula::ExecDriver] Driver to be used for the actions
    # @param[String] Id of the VM
    # @param[String] name of the actions as described in the VMM protocol
    # @param[xml_data] data sent from OpenNebula core
    def initialize(driver, id, action, xml_data)
        # Initialize object with xml data
        @vmm = driver
        @id  = id

        @main_action = action
        @xml_data    = @vmm.decode(xml_data)

        @data = {}

        # Check if SSH Forward Agent should be activated
        forward = @vmm.options[:delegate_actions].key?(action.to_s.upcase)

        get_data(:host)
        get_data(:deploy_id)
        get_data(:checkpoint_file)

        get_data(:local_dfile, :LOCAL_DEPLOYMENT_FILE)
        get_data(:remote_dfile, :REMOTE_DEPLOYMENT_FILE)

        # For migration
        get_data(:dest_host, :MIGR_HOST)

        # For disk hotplugging
        get_data(:disk_target_path)
        get_data(:tm_command)

        # VM template
        vm_template = @xml_data.elements['VM'].to_s
        @data[:vm]  = Base64.encode64(vm_template).delete("\n")

        # VM data for VNM
        src_drvs, src_xml = get_vnm_drivers(vm_template)

        # Initialize streams and vnm
        @ssh_src = @vmm.get_ssh_stream(action, @data[:host], @id)

        # Activate SSH Forward Agent
        @ssh_src.set_forward(forward)

        @vnm_src = VirtualNetworkDriver.new(
            src_drvs,
            :local_actions          => @vmm.options[:local_actions],
            :per_drvr_local_actions => VNMAD_LOCAL_ACTIONS,
            :message                => src_xml.to_s,
            :ssh_stream             => @ssh_src
        )

        if @data[:dest_host] && !@data[:dest_host].empty?
            dst_drvs, dst_xml = get_vnm_drivers(vm_template)

            @ssh_dst = @vmm.get_ssh_stream(action, @data[:dest_host], @id)

            # Activate SSH Forward Agent
            @ssh_dst.set_forward(forward)

            @vnm_dst = VirtualNetworkDriver.new(
                dst_drvs,
                :local_actions          => @vmm.options[:local_actions],
                :per_drvr_local_actions => VNMAD_LOCAL_ACTIONS,
                :message                => dst_xml.to_s,
                :ssh_stream             => @ssh_dst
            )
        end

        @tm = TransferManagerDriver.new(nil)

        @ds = DatastoreExecDriver.new
    end

    # Execute a set of steps defined with
    #  - :driver :vmm or :vnm to execute the step
    #  - :action for the step
    #  - :parameters command line paremeters for the action
    #  - :destination use next host
    #  - :fail_action steps to be executed if steps fail
    #  - :stdin for the action
    #  @param [Array] of steps
    #  @param [String] additional informartion to prepend to action information
    def run(steps, extra_info = nil)
        result = execute_steps(steps)

        @ssh_src.close if @ssh_src
        @ssh_dst.close if @ssh_dst

        # Prepare the info for the OpenNebula core
        if !extra_info.nil?
            info = extra_info + ' '
        else
            info = ''
        end

        if DriverExecHelper.failed?(result)
            info << (@data[:failed_info] || '-')
        elsif !@data["#{@main_action}_info".to_sym].nil?
            info << @data["#{@main_action}_info".to_sym]
        end

        @vmm.send_message(VirtualMachineDriver::ACTION[@main_action],
                          result, @id, info)
    end

    private

    # List of xpaths required by the VNM driver actions. TEMPLATE/NIC is
    # also required but added separately to the driver xml
    XPATH_LIST = [
        'ID', 'DEPLOY_ID', 'TEMPLATE/CONTEXT', 'USER_TEMPLATE', 'TEMPLATE/SECURITY_GROUP_RULE',
        'HISTORY_RECORDS/HISTORY/HOSTNAME', 'HISTORY_RECORDS/HISTORY/HID',
        'HISTORY_RECORDS/HISTORY/DS_ID', 'HISTORY_RECORDS/HISTORY/VM_MAD'
    ]

    DRIVER_NAMES = {
        :vmm => 'virtualization driver',
        :vnm => 'network driver',
        :tm  => 'transfer manager driver',
        :ds  => 'datastore driver'
    }

    # Prepares the list of drivers executed on the host and the xml that will
    # be sent to the network drivers. Builds VM template with required
    # attributes for the VirtualNetworkDriver.
    #  @param[String] The template of the VM.
    #  @return[Array] Returns a list of network drivers and the associated xml
    #  template.
    def get_vnm_drivers(vm_template)
        vm_template_xml = REXML::Document.new(vm_template).root
        vm_vnm_xml      = REXML::Document.new('<VM></VM>').root

        vnm_drivers = []

        XPATH_LIST.each do |xpath|
            vm_template_xml.elements.each(xpath) do |element|
                add_element_to_path(vm_vnm_xml, element, xpath)
            end
        end

        ['NIC', 'NIC_ALIAS', 'PCI'].each do |r|
            vm_template_xml.elements.each("TEMPLATE/#{r}") do |element|
                vn_mad = element.get_text('VN_MAD').to_s

                next if vn_mad.empty?

                vnm_drivers << vn_mad unless vnm_drivers.include?(vn_mad)

                add_element_to_path(vm_vnm_xml, element, "TEMPLATE/#{r}")
            end
        end

        [vnm_drivers, vm_vnm_xml]
    end

    # Executes a set of steps. If one step fails any recover action is performed
    # and the step execution breaks.
    # @param [Array] array of steps to be executed
    # @return [String, Hash] "SUCCESS/FAILURE" for the step set, and
    # information associated to each step (by :<action>_info). In case of
    # failure information is also in [:failed_info]
    def execute_steps(steps)
        result = DriverExecHelper.const_get(:RESULT)[:failure]

        steps.each do |step|
            # Execute Step
            case step[:driver]
            when :vmm
                if step[:destination]
                    host = @data[:dest_host]
                    ssh  = @ssh_dst
                else
                    host = @data[:host]
                    ssh  = @ssh_src
                end

                stdin = step[:stdin] || @xml_data.to_s
                no_extra_params = step[:no_extra_params] || false

                result, info = @vmm.do_action(
                    get_parameters(step[:parameters]),
                    @id,
                    host,
                    step[:action],
                    :script_name => step[:script_name],
                    :ssh_stream => ssh,
                    :respond => false,
                    :stdin => stdin,
                    :no_extra_params => no_extra_params,
                    :is_local => step[:is_local]
                )

            when :vnm
                if step[:destination]
                    vnm = @vnm_dst
                else
                    vnm = @vnm_src
                end

                params = get_parameters(step[:parameters])

                result, info = vnm.do_action(@id,
                                             step[:action],
                                             :parameters => params,
                                             :stdin => step[:stdin])
            when :tm
                result, info = @tm.do_transfer_action(
                    @id, step[:parameters], step[:stdin]
                )

            when :ds
                result, info = @ds.do_datastore_action(
                    @id, step[:parameters], step[:stdin]
                )

            else
                result = DriverExecHelper.const_get(:RESULT)[:failure]
                info   = "No driver in #{step[:action]}"
            end

            # Save the step info
            @data["#{step[:action]}_info".to_sym] = info.strip

            # Roll back steps, store failed info and break steps
            if DriverExecHelper.failed?(result)
                execute_steps(step[:fail_actions]) if step[:fail_actions]
                @data[:failed_info] = info

                @vmm.log(@id,
                         "Failed to execute #{DRIVER_NAMES[step[:driver]]} " \
                         "operation: #{step[:action]}.")

                break unless step[:no_fail]

                result = DriverExecHelper::RESULT[:success]
            else
                @vmm.log(@id,
                         "Successfully execute #{DRIVER_NAMES[step[:driver]]}"\
                         " operation: #{step[:action]}.")
            end
        end

        result
    end

    # Prepare the parameters for the action step generating a blank separated
    # list of command arguments
    # @param [Hash] an action step
    def get_parameters(step_params)
        parameters = step_params || []

        parameters.map do |param|
            if param.is_a?(Symbol)
                "\'#{@data[param]}\'"
            else
                "\'#{param}\'"
            end
        end.join(' ')
    end

    # Extracts data from the XML argument of the VMM action
    # @param [Symbol] corresponding to a XML element
    # @param [String] an xpath for the XML element
    # @return [String] the element value
    def get_data(name, xml_path = nil)
        if xml_path
            path = xml_path.to_s
        else
            path = name.to_s.upcase
        end
        # rubocop:disable Style/GuardClause
        if (elem = @xml_data.elements[path])
            @data[name] = elem.text
        end
        # rubocop:enable Style/GuardClause
    end

    # Adds a REXML node to a specific xpath
    #
    # @param [REXML::Element] xml document to add to
    # @param [REXML::Element] element to add
    # @param [String] path where the element is inserted in the xml document
    # @return [REXML::Element]
    def add_element_to_path(xml, element, path)
        root = xml
        path.split('/')[0..-2].each do |path_element|
            xml = xml.add_element(path_element) if path_element
        end
        xml.add_element(element)
        root
    end

end

# The main class for the Sh driver
class ExecDriver < VirtualMachineDriver

    attr_reader :options

    # Initializes the VMM driver
    # @param [String] hypervisor name identifies the plugin
    # @param [OpenNebulaDriver::options]
    def initialize(hypervisor, options = {})
        @options = {
            :threaded => true
        }.merge!(options)

        if options[:shell]
            @shell = options[:shell]
        else
            @shell = 'bash'
        end

        super("vmm/#{hypervisor}", @options)

        @hypervisor = hypervisor
    end

    # Creates an SshStream to execute commands on the target host
    # @param[String] the hostname of the host
    # @param[String] id of the VM to log messages
    # @return [SshStreamCommand]
    def get_ssh_stream(_aname, host, id)
        SshStreamCommand.new(host,
                             @remote_scripts_base_path,
                             log_method(id), nil, @shell)
    end

    #---------------------------------------------------------------------------
    #  Virtual Machine Manager Protocol Actions
    #---------------------------------------------------------------------------
    #
    # DEPLOY action, sends the deployment file to remote host
    #
    def deploy(id, drv_message)
        action = VmmAction.new(self, id, :deploy, drv_message)

        # ----------------------------------------------------------------------
        #  Initialization of deployment data
        # ----------------------------------------------------------------------
        local_dfile = action.data[:local_dfile]

        if !local_dfile || File.empty?(local_dfile)
            send_message(ACTION[:deploy], RESULT[:failure], id,
                         "Cannot open deployment file #{local_dfile}")
            return
        end

        domain = File.read(local_dfile)

        is_action_local = action_is_local?(:deploy)

        if is_action_local
            dfile = action.data[:local_dfile]
        else
            dfile = action.data[:remote_dfile]
        end

        # ----------------------------------------------------------------------
        #  Deployment Steps
        # ----------------------------------------------------------------------
        xml_data = decode(drv_message)

        tm_command = xml_data.elements['TM_COMMAND']
        tm_command = tm_command.text if tm_command

        steps = []

        if tm_command && !tm_command.empty?
            steps << {
                :driver     => :tm,
                :action     => :tm_context,
                :parameters => tm_command.strip.split(' ')
            }
        end

        vm_dir=File.dirname(dfile)

        steps.concat([
                         # Execute pre-boot networking setup
                         {
                             :driver   => :vnm,
                             :action   => :pre
                         },

                         # Make vm_dir, store vm.xml and ds.xml
                         {
                             :driver          => :vmm,
                             :action          => '/bin/mkdir -p',
                             :is_local        => is_action_local,
                             :stdin           => '',
                             :no_extra_params => true,
                             :parameters      => [vm_dir]
                         },
                         {
                             :driver   => :vmm,
                             :action   => "/bin/cat - >#{vm_dir}/vm.xml",
                             :is_local => is_action_local,
                             :stdin    => xml_data.elements['VM'].to_s,
                             :no_extra_params => true
                         },
                         {
                             :driver   => :vmm,
                             :action   => "/bin/cat - >#{vm_dir}/ds.xml",
                             :is_local => is_action_local,
                             :stdin    => xml_data.elements['DATASTORE'].to_s,
                             :no_extra_params => true
                         },

                         # Boot the Virtual Machine
                         {
                             :driver       => :vmm,
                             :action       => :deploy,
                             :parameters   => [dfile, :host],
                             :stdin        => domain,
                             :fail_actions => [
                                 {
                                     :driver      => :vnm,
                                     :action      => :clean,
                                     :parameters  => [:host]
                                 }
                             ]
                         },

                         # Execute post-boot networking setup
                         {
                             :driver       => :vnm,
                             :action       => :post,
                             :parameters   => [:deploy_info, :host],
                             :fail_actions => [
                                 {
                                     :driver     => :vmm,
                                     :action     => :cancel,
                                     :parameters => [:deploy_info, :host]
                                 },
                                 {
                                     :driver     => :vnm,
                                     :action     => :clean,
                                     :parameters => [:host]
                                 }
                             ]
                         }
                     ])

        action.run(steps)
    end

    #
    # SHUTDOWN action, graceful shutdown and network clean up
    #
    def shutdown(id, drv_message)
        destroy(id, drv_message, :shutdown)
    end

    #
    # CANCEL action, destroys a VM and network clean up
    #
    def cancel(id, drv_message)
        destroy(id, drv_message, :cancel)
    end

    #
    # SAVE action, stops the VM and saves its state, network is cleaned up
    #
    def save(id, drv_message)
        action = VmmAction.new(self, id, :save, drv_message)

        steps = [
            # Save the Virtual Machine state
            {
                :driver     => :vmm,
                :action     => :save,
                :parameters => [:deploy_id, :checkpoint_file, :host]
            },
            # Execute networking clean up operations
            {
                :driver      => :vnm,
                :action      => :clean,
                :parameters  => [:host]
            }
        ]

        action.run(steps)
    end

    #
    # RESTORE action, restore a VM from a previous state, and restores network
    #
    def restore(id, drv_message)
        xml_data = decode(drv_message)

        tm_command = xml_data.elements['TM_COMMAND']
        tm_command = tm_command.text if tm_command

        steps = []

        if tm_command && !tm_command.empty?
            steps << {
                :driver     => :tm,
                :action     => :tm_context,
                :parameters => tm_command.strip.split(' ')
            }
        end

        action = VmmAction.new(self, id, :restore, drv_message)

        steps.concat([
                         # Execute pre-boot networking setup
                         {
                             :driver     => :vnm,
                             :action     => :pre
                         },
                         # Restore the Virtual Machine from checkpoint
                         {
                             :driver     => :vmm,
                             :action     => :restore,
                             :parameters => [:checkpoint_file, :host,
                                             :deploy_id]
                         },
                         # Execute post-boot networking setup
                         {
                             :driver       => :vnm,
                             :action       => :post,
                             :parameters   => [:deploy_id, :host],
                             :fail_actions => [
                                 {
                                     :driver     => :vmm,
                                     :action     => :cancel,
                                     :parameters => [:deploy_id, :host]
                                 }
                             ]
                         }
                     ])

        action.run(steps)
    end

    #
    # MIGRATE (live) action, migrates a VM to another host creating network
    #
    def migrate(id, drv_message)
        action = VmmAction.new(self, id, :migrate, drv_message)
        pre    = 'PRE'
        post   = 'POST'
        failed = 'FAIL'

        pre  << action.data[:tm_command]
        post << action.data[:tm_command]
        failed << action.data[:tm_command]

        steps = [
            # Execute a pre-migrate TM setup
            {
                :driver     => :tm,
                :action     => :tm_premigrate,
                :parameters => pre.split,
                :stdin      => action.data[:vm]
            },
            # Execute pre-boot networking setup on migrating host
            {
                :driver      => :vnm,
                :action      => :pre,
                :destination => true
            },
            # Migrate the Virtual Machine
            {
                :driver     => :vmm,
                :action     => :migrate,
                :parameters => [:deploy_id, :dest_host, :host],
                :fail_actions => [
                    {
                        :driver     => :tm,
                        :action     => :tm_failmigrate,
                        :parameters => failed.split,
                        :stdin      => action.data[:vm],
                        :no_fail    => true
                    }
                ]
            },
            # Execute networking clean up operations
            # NOTE: VM is now in the new host. If we fail from now on, oned will
            # assume that the VM is in the previous host but it is in fact
            # migrated. Log errors will be shown in vm.log
            {
                :driver       => :vnm,
                :action       => :clean,
                :parameters   => [:host],
                :no_fail      => true
            },
            # Execute post-boot networking setup on migrating host
            {
                :driver       => :vnm,
                :action       => :post,
                :parameters   => [:deploy_id, :host],
                :destination  => true,
                :no_fail      => true
            },
            {
                :driver     => :tm,
                :action     => :tm_postmigrate,
                :parameters => post.split,
                :stdin      => action.data[:vm],
                :no_fail    => true
            }
        ]

        action.run(steps)
    end

    #
    # POLL action, gets information of a VM
    #
    def poll(id, drv_message)
        xml_data = decode(drv_message)

        data      = decode(drv_message)
        host      = data.elements['HOST'].text
        deploy_id = data.elements['DEPLOY_ID'].text

        do_action("#{deploy_id} #{host}", id, host, ACTION[:poll],
                  :stdin => xml_data.to_s)
    end

    # REBOOT action, reboots a running VM
    def reboot(id, drv_message)
        restart(id, drv_message, :reboot)
    end

    #
    # RESET action, resets a running VM
    #
    def reset(id, drv_message)
        restart(id, drv_message, :reset)
    end

    #
    # ATTACHDISK action, attaches a disk to a running VM
    #
    def attach_disk(id, drv_message)
        action   = ACTION[:attach_disk]
        xml_data = decode(drv_message)

        tm_command = ensure_xpath(xml_data, id, action, 'TM_COMMAND') || return
        tm_rollback = xml_data.elements['TM_COMMAND_ROLLBACK'].text.strip

        target_xpath = "VM/TEMPLATE/DISK[ATTACH='YES']/TARGET"
        target = ensure_xpath(xml_data, id, action, target_xpath) || return

        target_index = target.downcase[-1..-1].unpack('c').first - 97

        action = VmmAction.new(self, id, :attach_disk, drv_message)

        steps = [
            # Perform a PROLOG on the disk
            {
                :driver     => :tm,
                :action     => :tm_attach,
                :parameters => tm_command.split
            },
            # Run the attach vmm script
            {
                :driver       => :vmm,
                :action       => :attach_disk,
                :parameters   => [
                    :deploy_id,
                    :disk_target_path,
                    target,
                    target_index,
                    drv_message
                ],
                :fail_actions => [
                    {
                        :driver     => :tm,
                        :action     => :tm_detach,
                        :parameters => tm_rollback.split
                    }
                ]
            }
        ]

        action.run(steps)
    end

    #
    # DETACHDISK action, detach a disk from a running VM
    #
    def detach_disk(id, drv_message)
        action   = ACTION[:detach_disk]
        xml_data = decode(drv_message)

        tm_command = ensure_xpath(xml_data, id, action, 'TM_COMMAND') || return

        target_xpath = "VM/TEMPLATE/DISK[ATTACH='YES']/TARGET"
        target = ensure_xpath(xml_data, id, action, target_xpath) || return

        target_index = target.downcase[-1..-1].unpack('c').first - 97

        action = VmmAction.new(self, id, :detach_disk, drv_message)

        steps = [
            # Run the detach vmm script
            {
                :driver       => :vmm,
                :action       => :detach_disk,
                :parameters   => [
                    :deploy_id,
                    :disk_target_path,
                    target,
                    target_index
                ]
            },
            # Perform an EPILOG on the disk
            {
                :driver     => :tm,
                :action     => :tm_detach,
                :parameters => tm_command.split
            }
        ]

        action.run(steps)
    end

    #
    # SNAPSHOTCREATE action, creates a new system snapshot
    #
    def snapshot_create(id, drv_message)
        xml_data = decode(drv_message)

        host      = xml_data.elements['HOST'].text
        deploy_id = xml_data.elements['DEPLOY_ID'].text

        snap_id_xpath = "VM/TEMPLATE/SNAPSHOT[ACTIVE='YES']/SNAPSHOT_ID"
        snap_id       = xml_data.elements[snap_id_xpath].text.to_i

        do_action("#{deploy_id} #{snap_id}",
                  id,
                  host,
                  ACTION[:snapshot_create],
                  :script_name => 'snapshot_create',
                  :stdin => xml_data.to_s)
    end

    #
    # SNAPSHOTREVERT action, reverts to a system snapshot
    #
    def snapshot_revert(id, drv_message)
        xml_data = decode(drv_message)

        snap_id_xpath = "VM/TEMPLATE/SNAPSHOT[ACTIVE='YES']/HYPERVISOR_ID"
        snapshot_name = xml_data.elements[snap_id_xpath].text

        action = VmmAction.new(self, id, :snapshot_revert, drv_message)

        steps = [
            # Run the snapshot_revert action script
            {
                :driver       => :vmm,
                :action       => ACTION[:snapshot_revert],
                :script_name  => 'snapshot_revert',
                :parameters   => [:deploy_id, snapshot_name]
            },
            # Execute post-boot networking setup
            {
                :driver       => :vnm,
                :action       => :post,
                :skip         => ['elastic'],
                :parameters   => [:deploy_id, :host]
            }
        ]

        action.run(steps)
    end

    #
    # SNAPSHOTDELETE action, deletes a system snapshot
    #
    def snapshot_delete(id, drv_message)
        xml_data = decode(drv_message)

        host      = xml_data.elements['HOST'].text
        deploy_id = xml_data.elements['DEPLOY_ID'].text

        snap_id_xpath = "VM/TEMPLATE/SNAPSHOT[ACTIVE='YES']/HYPERVISOR_ID"
        snapshot_name = xml_data.elements[snap_id_xpath].text

        do_action("#{deploy_id} #{snapshot_name}",
                  id,
                  host,
                  ACTION[:snapshot_delete],
                  :script_name => 'snapshot_delete',
                  :stdin => xml_data.to_s)
    end

    #
    # RESIZEDISK action, resizes a disk on a running VM
    #
    def resize_disk(id, drv_message)
        action   = ACTION[:resize_disk]
        xml_data = decode(drv_message)

        tm_command = ensure_xpath(xml_data, id, action, 'TM_COMMAND') || return

        size_xpath = "VM/TEMPLATE/DISK[RESIZE='YES']/SIZE"
        size       = ensure_xpath(xml_data, id, action, size_xpath) || return

        disk_id_xpath = "VM/TEMPLATE/DISK[RESIZE='YES']/DISK_ID"
        disk_id       = ensure_xpath(xml_data, id,
                                     action, disk_id_xpath) || return

        action = VmmAction.new(self, id, :resize_disk, drv_message)

        steps = [
            # Perform the resize command
            {
                :driver     => :tm,
                :action     => :tm_resize,
                :parameters => tm_command.split
            },
            # Run the attach vmm script
            {
                :driver       => :vmm,
                :action       => :resize_disk,
                :parameters   => [
                    :deploy_id,
                    disk_id,
                    size,
                    drv_message,
                    :host
                ]
            }
        ]

        action.run(steps)
    end

    #
    # CLEANUP action, frees resources allocated in a host: VM and disk images
    #
    def cleanup(id, drv_message)
        xml_data = decode(drv_message)

        tm_command = xml_data.elements['TM_COMMAND'].text
        mhost      = xml_data.elements['MIGR_HOST'].text
        deploy_id  = xml_data.elements['DEPLOY_ID'].text

        action = VmmAction.new(self, id, :cleanup, drv_message)
        steps  = []

        # Cancel the VM at host (only if we have a valid deploy-id)
        if deploy_id && !deploy_id.empty?
            steps <<
                {
                    :driver     => :vmm,
                    :action     => :cancel,
                    :parameters => [:deploy_id, :host],
                    :no_fail    => true
                }
        end

        steps <<
            {
                :driver     => :vnm,
                :action     => :clean,
                :parameters => [:host],
                :no_fail    => true
            }

        # Cancel the VM at the previous host (in case of migration)
        if mhost && !mhost.empty?
            steps <<
                {
                    :driver      => :vmm,
                    :action      => :cancel,
                    :parameters  => [:deploy_id, :dest_host],
                    :destination => true,
                    :no_fail     => true
                }
            steps <<
                {
                    :driver  => :vnm,
                    :action  => :clean,
                    :parameters => [:host],
                    :destination => true,
                    :no_fail => true
                }
        end

        # Cleans VM disk images and directory
        if tm_command
            tm_command.each_line do |tc|
                tc.strip!

                next if tc.empty?

                steps <<
                    {
                        :driver     => :tm,
                        :action     => :tm_delete,
                        :parameters => tc.split,
                        :no_fail    => true
                    }
            end
        end

        action.run(steps)
    end

    #
    #  ATTACHNIC action to attach a new nic interface
    #
    def attach_nic(id, drv_message)
        action = ACTION[:attach_nic]
        xml_data = decode(drv_message)

        tm_command = xml_data.elements['TM_COMMAND']
        tm_command = tm_command.text if tm_command

        target_path = xml_data.elements['DISK_TARGET_PATH']
        target_path = target_path.text if target_path

        target_device = xml_data.elements['VM/TEMPLATE/CONTEXT/TARGET']
        target_device = target_device.text if target_device

        nic_alias = false

        if xml_data.elements["VM/TEMPLATE/NIC[ATTACH='YES']"]
            base_tmpl = "VM/TEMPLATE/NIC[ATTACH='YES']"
        elsif xml_data.elements["VM/TEMPLATE/PCI[ATTACH='YES']"]
            base_tmpl = "VM/TEMPLATE/PCI[ATTACH='YES']"
        else
            base_tmpl = "VM/TEMPLATE/NIC_ALIAS[ATTACH='YES']"
            nic_alias = true
        end

        begin
            source = xml_data.elements["#{base_tmpl}/BRIDGE"]
            mac    = xml_data.elements["#{base_tmpl}/MAC"]
            target = xml_data.elements["#{base_tmpl}/TARGET"]
            vn_mad = xml_data.elements["#{base_tmpl}/VN_MAD"]

            source = source.text.strip
            mac    = mac.text.strip
            target = target.text.strip
            vn_mad = vn_mad.text.strip
        rescue StandardError
            send_message(action, RESULT[:failure], id,
                         'Missing VN_MAD, BRIDGE, TARGET or MAC in VM NIC')
            return
        end

        model = xml_data.elements["#{base_tmpl}/MODEL"]

        model = model.text unless model.nil?
        model = model.strip unless model.nil?
        model = '-' if model.nil?

        action = VmmAction.new(self, id, :attach_nic, drv_message)

        if !nic_alias
            steps = [
                # Execute pre-attach networking setup
                {
                    :driver   => :vnm,
                    :action   => :pre
                },
                # Attach the new NIC
                {
                    :driver     => :vmm,
                    :action     => :attach_nic,
                    :parameters => [:deploy_id, mac, source,
                                    model, vn_mad, target]
                },
                # Execute post-boot networking setup
                {
                    :driver       => :vnm,
                    :action       => :post,
                    :parameters   => [:deploy_id, :host],
                    :fail_actions => [
                        {
                            :driver     => :vmm,
                            :action     => :detach_nic,
                            :parameters => [:deploy_id, mac]
                        }
                    ]
                }
            ]
        elsif nic_alias
            steps = [
                # Execute pre-attach networking setup
                {
                    :driver   => :vnm,
                    :action   => :pre
                },
                # Execute post-boot networking setup
                {
                    :driver       => :vnm,
                    :action       => :post,
                    :parameters   => [:deploy_id, :host]
                }
            ]
        else
            steps = []
        end

        steps << {
            :driver     => :vmm,
            :action     => :prereconfigure,
            :parameters => [:deploy_id, target_device],
            :fail_actions => [
                {
                    :driver     => :vmm,
                    :action     => :detach_nic,
                    :parameters => [:deploy_id, mac]
                }
            ]
        }

        if tm_command && !tm_command.empty?
            steps << {
                :driver     => :tm,
                :action     => :tm_context,
                :parameters => tm_command.strip.split(' ')
            }
        end

        steps << {
            :driver     => :vmm,
            :action     => :reconfigure,
            :parameters => [:deploy_id, target_device, target_path]
        }

        action.run(steps)
    end

    #
    #  DETACHNIC action to detach a nic interface
    #
    def detach_nic(id, drv_message)
        action = ACTION[:detach_nic]
        xml_data = decode(drv_message)

        tm_command = xml_data.elements['TM_COMMAND']
        tm_command = tm_command.text if tm_command

        target_path = xml_data.elements['DISK_TARGET_PATH']
        target_path = target_path.text if target_path

        target_device = xml_data.elements['VM/TEMPLATE/CONTEXT/TARGET']
        target_device = target_device.text if target_device

        nic_alias = false

        if xml_data.elements["VM/TEMPLATE/NIC[ATTACH='YES']"]
            base_tmpl = "VM/TEMPLATE/NIC[ATTACH='YES']"
        elsif xml_data.elements["VM/TEMPLATE/PCI[ATTACH='YES']"]
            base_tmpl = "VM/TEMPLATE/PCI[ATTACH='YES']"
        else
            base_tmpl = "VM/TEMPLATE/NIC_ALIAS[ATTACH='YES']"
            nic_alias = true
        end

        begin
            mac = xml_data.elements["#{base_tmpl}/MAC"]
            mac = mac.text.strip
        rescue StandardError
            send_message(action, RESULT[:failure], id,
                         "Error in #{ACTION[:detach_nic]}, MAC needed in NIC")
            return
        end

        action = VmmAction.new(self, id, :detach_nic, drv_message)

        if !nic_alias
            steps = [
                # Detach the NIC
                {
                    :driver     => :vmm,
                    :action     => :detach_nic,
                    :parameters => [:deploy_id, mac]
                },
                # Clean networking setup
                {
                    :driver       => :vnm,
                    :action       => :clean,
                    :parameters   => [:host]
                }
            ]
        elsif nic_alias
            steps = [
                # Clean networking setup
                {
                    :driver       => :vnm,
                    :action       => :clean,
                    :parameters   => [:host]
                }
            ]
        else
            steps = []
        end

        steps << {
            :driver     => :vmm,
            :action     => :prereconfigure,
            :parameters => [:deploy_id, target_device]
        }

        if tm_command && !tm_command.empty?
            steps << {
                :driver     => :tm,
                :action     => :tm_context,
                :parameters => tm_command.strip.split(' ')
            }
        end

        steps << {
            :driver     => :vmm,
            :action     => :reconfigure,
            :parameters => [:deploy_id, target_device, target_path]
        }

        action.run(steps)
    end

    #
    # DISKSNAPSHOTCREATE action, takes a snapshot of a dis
    #
    def disk_snapshot_create(id, drv_message)
        xml_data = decode(drv_message)
        action   = ACTION[:disk_snapshot_create]

        # Check that live snapshot is supported
        vmm_driver_path = 'VM/HISTORY_RECORDS/HISTORY/VM_MAD'
        tm_driver_path  = "VM/TEMPLATE/DISK[DISK_SNAPSHOT_ACTIVE='YES']/TM_MAD"

        vmm_driver = ensure_xpath(xml_data, id, action,
                                  vmm_driver_path) || return
        tm_driver  = ensure_xpath(xml_data, id, action,
                                  tm_driver_path) || return

        if !LIVE_DISK_SNAPSHOTS.include?("#{vmm_driver}-#{tm_driver}")
            send_message(action, RESULT[:failure], id,
                         "Cannot perform a live #{action} operation")
            return
        end

        # Get TM command
        tm_command = ensure_xpath(xml_data, id, action, 'TM_COMMAND') || return

        tm_command_split = tm_command.split
        tm_command_split[0].sub!('.', '_LIVE.') \
            || (tm_command_split[0] += '_LIVE')

        action = VmmAction.new(self, id, :disk_snapshot_create, drv_message)

        steps = [
            {
                :driver     => :tm,
                :action     => :tm_snap_create_live,
                :parameters => tm_command_split
            }
        ]

        action.run(steps)
    end

    #
    #  UPDATECONF action to update context for running machine
    #
    def update_conf(id, drv_message)
        xml_data = decode(drv_message)

        tm_command = xml_data.elements['TM_COMMAND']
        tm_command = tm_command.text if tm_command

        target_path = xml_data.elements['DISK_TARGET_PATH']
        target_path = target_path.text if target_path

        target_device = xml_data.elements['VM/TEMPLATE/CONTEXT/TARGET']
        target_device = target_device.text if target_device

        action = VmmAction.new(self, id, :update_conf, drv_message)

        steps = []

        steps << {
            :driver     => :vmm,
            :action     => :prereconfigure,
            :parameters => [:deploy_id, target_device]
        }

        if tm_command && !tm_command.empty?
            steps << {
                :driver     => :tm,
                :action     => :tm_context,
                :parameters => tm_command.strip.split(' ')
            }
        end

        steps << {
            :driver     => :vmm,
            :action     => :reconfigure,
            :parameters => [:deploy_id, target_device, target_path]
        }

        action.run(steps)
    end

    #
    # UPDATESG action, deletes iptables rules and regenerate them
    #
    def update_sg(id, drv_message)
        xml_data = decode(drv_message)
        sg_id    = xml_data.elements['SECURITY_GROUP_ID'].text

        action = VmmAction.new(self, id, :update_sg, drv_message)

        steps = [
            # Execute update networking action
            {
                :driver       => :vnm,
                :action       => :update_sg,
                :parameters   => [:deploy_id]
            }
        ]

        action.run(steps, sg_id)
    end

    #
    # RESIZE action
    #
    def resize(id, drv_message)
        xml_data = decode(drv_message)

        host      = xml_data.elements['HOST'].text
        deploy_id = xml_data.elements['DEPLOY_ID'].text

        do_action(deploy_id.to_s,
                  id,
                  host,
                  ACTION[:resize],
                  :script_name => 'resize',
                  :stdin => xml_data.to_s)
    end

    def backup(id, drv_message)
        aname    = ACTION[:backup]
        xml_data = decode(drv_message)

        action   = VmmAction.new(self, id, :backup, drv_message)

        tm_command = ensure_xpath(xml_data, id, aname, 'TM_COMMAND') || return
        bck_mad    = ensure_xpath(xml_data, id, aname,
                                  'DATASTORE/DS_MAD') || return

        pre_tm  = tm_command.split
        post_tm = pre_tm.clone

        pre_tm[0]  = "PRE#{pre_tm[0]}"
        post_tm[0] = "POST#{post_tm[0]}"
        pre_name   = :prebackup
        post_name  = :postbackup

        state = xml_data.elements['/VMM_DRIVER_ACTION_DATA/VM/LCM_STATE'].text

        if state == '69'
            pre_tm[0]  = "#{pre_tm[0]}_LIVE"
            post_tm[0] = "#{post_tm[0]}_LIVE"

            pre_name   = :prebackup_live
            post_name  = :postbackup_live
        end

        ds_command = ['BACKUP', bck_mad].concat(pre_tm[2..-1])

        vm_xml = xml_data.elements['/VMM_DRIVER_ACTION_DATA/VM']

        cleanup_steps = [
            # Cleanup backup and tmp files
            {
                :driver     => :tm,
                :action     => post_name,
                :parameters => post_tm,
                :stdin      => vm_xml
            }
        ]

        # Backup operation steps
        # TODO: failover steps
        steps = [
            # Generate backup files for VM disks
            {
                :driver       => :tm,
                :action       => pre_name,
                :parameters   => pre_tm,
                :stdin        => vm_xml,
                :fail_actions => cleanup_steps
            },
            # Upload backup files to repo
            {
                :driver       => :ds,
                :action       => :backup,
                :parameters   => ds_command,
                :stdin        => xml_data.elements['DATASTORE'].to_s,
                :fail_actions => cleanup_steps
            }
        ] + cleanup_steps

        action.run(steps)
    end

    def backup_cancel(id, drv_message)
        aname    = ACTION[:backup_cancel]
        xml_data = decode(drv_message)

        action = VmmAction.new(self, id, :backup_cancel, drv_message)

        tm_command = ensure_xpath(xml_data, id, aname, 'TM_COMMAND') || return
        bck_mad    = ensure_xpath(xml_data, id, aname, 'DATASTORE/DS_MAD') || return

        tm = tm_command.split

        ds_command = ['BACKUP_CANCEL', bck_mad].concat(tm[2..-1])

        # Backup cancel operation steps
        steps = [
            {
                :driver     => :ds,
                :action     => :backup_cancel,
                :parameters => ds_command
            }
        ]

        action.run(steps)
    end

    #
    # UPDATENIC action, update network parameters
    #
    def update_nic(id, drv_message)
        xml_data = decode(drv_message)
        vn_id    = xml_data.elements['VIRTUAL_NETWORK_ID'].text

        action = VmmAction.new(self, id, :update_nic, drv_message)

        steps = [
            # Execute update networking action
            {
                :driver       => :vnm,
                :action       => :update_nic,
                :parameters   => [:deploy_id, vn_id],
                :stdin        => Base64.encode64(xml_data.elements['VM'].to_s)
            }
        ]

        action.run(steps, vn_id)
    end

    private

    def ensure_xpath(xml_data, id, action, xpath)
        value = xml_data.elements[xpath].text.strip
        raise if value.empty?

        value
    rescue StandardError
        send_message(action, RESULT[:failure], id,
                     "Cannot perform #{action}, expecting #{xpath}")
        nil
    end

    def restart(id, drv_message, signal)
        action = VmmAction.new(self, id, signal, drv_message)

        reboot_step = {
            :driver => :vmm,
                :action       => signal,
                :parameters   => [:deploy_id, :host]
        }

        steps = [reboot_step]

        action.run(steps)
    end

    def destroy(id, drv_message, signal)
        action = VmmAction.new(self, id, signal, drv_message)

        steps = [
            # Shutdown the Virtual Machine
            {
                :driver     => :vmm,
                :action     => signal,
                :parameters => [:deploy_id, :host]
            },
            # Execute networking clean up operations
            {
                :driver     => :vnm,
                :action     => :clean,
                :parameters => [:host]
            }
        ]

        action.run(steps)
    end

end

################################################################################
#
# Virtual Machine Manager Execution Driver - Main Program
#
################################################################################

ENV_CONF = Hash.new('').merge!(ENV)
LIVE_DISK_SNAPSHOTS = ENV_CONF['LIVE_DISK_SNAPSHOTS'].split
VNMAD_LOCAL_ACTIONS = ENV_CONF['VNMAD_LOCAL_ACTIONS'].split

opts = GetoptLong.new(
    ['--retries',           '-r', GetoptLong::OPTIONAL_ARGUMENT],
    ['--threads',           '-t', GetoptLong::OPTIONAL_ARGUMENT],
    ['--local',             '-l', GetoptLong::REQUIRED_ARGUMENT],
    ['--delegate',          '-d', GetoptLong::REQUIRED_ARGUMENT],
    ['--shell',             '-s', GetoptLong::REQUIRED_ARGUMENT],
    ['--parallel',          '-p', GetoptLong::NO_ARGUMENT],
    ['--timeout',           '-w', GetoptLong::OPTIONAL_ARGUMENT]
)

hypervisor         = ''
retries            = 0
threads            = 15
shell              = 'bash'
local_actions      = {}
delegate_actions   = OpenNebulaDriver.parse_actions_list('migrate')
single_host        = true
timeout            = nil

begin
    opts.each do |opt, arg|
        case opt
        when '--retries'
            retries = arg.to_i
        when '--threads'
            threads = arg.to_i
        when '--local'
            local_actions = OpenNebulaDriver.parse_actions_list(arg)
        when '--delegate'
            delegate_actions = OpenNebulaDriver.parse_actions_list(arg)
        when '--shell'
            shell = arg
        when '--parallel'
            single_host = false
        when '--timeout'
            timeout = arg.to_i
        end
    end
rescue StandardError
    exit(-1)
end

if ARGV.length >= 1
    hypervisor = ARGV.shift
else
    exit(-1)
end

exec_driver = ExecDriver.new(hypervisor,
                             :concurrency        => threads,
                             :retries            => retries,
                             :local_actions      => local_actions,
                             :delegate_actions   => delegate_actions,
                             :shell              => shell,
                             :single_host        => single_host,
                             :timeout            => timeout)

exec_driver.start_driver
