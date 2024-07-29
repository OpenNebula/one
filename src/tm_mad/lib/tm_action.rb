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

require 'CommandManager'
require 'logger'
require 'pathname'
require 'opennebula'

module TransferManager

    # Generic class that represent a Transfer Manager Action
    # Arguments as received from OpenNebula
    #    vm_id: ID of the VM (-1 if no VM information needed)
    #    action_name: Name of action (e.g. clone)
    #
    # Example of argument:
    #    "ubuntu2004-6-4-4643-1.test:/var/lib/one//datastores/0/2/disk.0"
    class Action

        attr_reader :logger, :vm, :one

        def initialize(options = {})
            @options={
                :vm_id       => -1,
                :action_name => 'tm_action'
            }.merge!(options)

            # ------------------------------------------------------------------
            # Get associated VM information
            # ------------------------------------------------------------------
            if @options[:vm_id] != -1
                @one = OpenNebula::Client.new
                @vm  = OpenNebula::VirtualMachine.new_with_id(@options[:vm_id],
                                                              @one)
                rc   = @vm.info

                raise rc.message.to_s if OpenNebula.is_error?(rc)
            end

            # ------------------------------------------------------------------
            # Create logger for STDERR
            # ------------------------------------------------------------------
            @logger = Logger.new(STDERR)
            @logger.formatter = proc do |severity, _date, _progname, message|
                "#{severity}: #{@options[:action_name]}: #{message}"
            end

            # Round robin index
            @rridx = 0
        end

        # Executes cmds in a remote host
        # @param [Hash] options for the remote execution
        # @option options [String]  :cmds script that will be executed remotely
        # @option options [String]  :err_msg string to be used in case of error
        # @option options [Integer] :rc_ok successful return code apart from 0
        # @option options [String]  :host hostname or IP of the remote host
        #
        # @return [GenericCommand] return code of the command
        def self.ssh(aname, options)
            action = Action.new(:action_name => aname, :vm_id => -1)
            action.ssh(options)
        end

        def ssh(options = {})
            opt = {
                :cmds    => '',
                :host    => '',
                :err_msg => nil,
                :ok_rc   => nil,
                :forward => false,
                :nostdout => true,
                :nostderr => true
            }.merge!(options)

            script = <<~EOS
                export LANG=C
                export LC_ALL=C
                #{opt[:cmds]}
            EOS

            ssh_opts = '-o ControlMaster=no -o ControlPath=none'
            ssh_opts << ' -o ForwardAgent=yes' if opt[:forward]

            shell = 'bash -s'

            shell << ' 1>/dev/null' if opt[:nostdout]

            shell << ' 2>/dev/null' if opt[:nostderr]

            if opt[:host]
                rc = SSHCommand.run(shell,
                                    opt[:host],
                                    nil,
                                    script,
                                    nil,
                                    ssh_opts)
            else
                rc = LocalCommand.run(shell,
                                      nil,
                                      script,
                                      nil)
            end

            success = rc.code == 0 || (opt[:ok_rc] && opt[:ok_rc] == rc.code)

            unless success
                err = opt[:err_msg] || "Command failed:\n#{script}"

                @logger.error "#{err.chomp}\nError: #{rc.stdout}"
                @logger.error "ERROR: #{err.chomp})\n"
                @logger.error "  [STDOUT] #{rc.stdout.gsub("\n", '\n')}\n" unless opt[:nostdout]
                @logger.error "  [STDERR] #{rc.stderr.gsub("\n", '\n')}\n" unless opt[:nostderr]
            end

            rc
        end

        # Creates dst path dir at host.
        # @param [String] dst path to create
        # @param [String] host target host
        # @param [Boolean] disable local monitoring
        # @param [Boolean] do_exit exit action if failure
        #
        # @return [Integer] of the path creation command

        def make_dst_path(host, dst, dmonit = false, do_exit = true)
            path   = File.dirname(dst)
            script = <<~EOS
                set -e -o pipefail

                if [ ! -d #{path} ]; then
                    mkdir -p #{path}
                fi
            EOS

            if dmonit
                mpath  = "#{Pathname.new(dst).parent.parent}/.monitor"
                script << "rm -f #{mpath}"
            end

            rc = ssh(:cmds    => script,
                     :host    => host,
                     :err_msg => "Error creating directory #{path} at #{host}")

            exit(rc.code) if rc.code != 0 && do_exit

            rc.code
        end

        #  @return[String] VM_MAD name for this host
        def vm_mad
            @vm['/VM/HISTORY_RECORDS/HISTORY[last()]/VM_MAD']
        end

        def persistent?(disk_id)
            @vm["/VM/TEMPLATE/DISK [ DISK_ID = #{disk_id} ]/SAVE"].casecmp('YES') == 0
        end

        def kvm?
            'kvm'.casecmp(vm_mad) == 0
        end

        def hotplug?
            'HOTPLUG_SAVEAS'.casecmp(@vm.lcm_state_str) == 0
        end

        # Parse a TM location argument
        # @param [String] arg TM argument in the form host:path
        #
        # @return [map] map containing the :host and the :path
        def parse_location(location_str)
            {
                :host => host(location_str),
                :path => path(location_str)
            }
        end

        # Disables local monitoring for host $2 and DS $1, by removing the
        # corresponding .monitor file
        #
        # @param host [String] Host to remove file from
        # @param dir  [String] Directory to remove file from
        def disable_local_monitoring(host, dir)
            script = <<~EOS
                set -e -o pipefail

                MONITOR_FN="\$(dirname #{dir})/.monitor"

                # remove .monitor file
                rm -f "\\${MONITOR_FN}"
            EOS

            rc = ssh(:host => host, :cmds => script)

            return if rc.code == 0

            @logger.error "Error creating #{dir}/.monitor at #{host}"

            exit(rc.code)
        end

        private

        # Get host from a TM argument
        # @param [String] arg TM argument in the form host:path
        #
        # @return [String, nil] host or nil if failure
        def host(arg)
            # TODO?: Evaluate here BRIDGE_LIST + TM_MAD and return either the
            # host, the BRIDGE_LIST or nil (for shared without BRIDGE_LIST)
            return if arg.nil?

            s = arg.split ':'
            return if s.size < 2

            s[0]
        end

        # Get path from a TM argument
        # @param [String] arg TM argument in the form host:path
        # @param [Boolean] fix Takes out repeated and final directory slashes:
        #        /some//path///somewhere/ -> /some/path/somewhere
        #
        # @return [String, nil] path or nil if failure
        def path(arg, fix = true)
            return if arg.nil?

            s = arg.split ':'

            if fix
                Pathname.new(s[-1]).cleanpath.to_s
            else
                s[-1]
            end
        end

    end

end
