#!/usr/bin/env ruby
#
# frozen_string_literal: true

# -------------------------------------------------------------------------- #
# Copyright 2002-2025, OpenNebula Project, OpenNebula Systems                #
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

# ------------------------------------------------------------------------------
# Entry code for TM Action scripts. Setups gems library path and common helpers
# ------------------------------------------------------------------------------
ONE_LOCATION = ENV['ONE_LOCATION'] unless defined?(ONE_LOCATION)

if !ONE_LOCATION
    RUBY_LIB_LOCATION ||= '/usr/lib/one/ruby'
    GEMS_LOCATION     ||= '/usr/share/one/gems'
    VMDIR             ||= '/var/lib/one'
    CONFIG_FILE       ||= '/var/lib/one/config'
    DS_DIR            ||= '/var/lib/one/datastores'
else
    RUBY_LIB_LOCATION ||= "#{ONE_LOCATION}/lib/ruby"
    GEMS_LOCATION     ||= "#{ONE_LOCATION}/share/gems"
    VMDIR             ||= "#{ONE_LOCATION}/var"
    CONFIG_FILE       ||= "#{ONE_LOCATION}/var/config"
    DS_DIR            ||= "#{ONE_LOCATION}/var/datastores"
end

# %%RUBYGEMS_SETUP_BEGIN%%
require 'load_opennebula_paths'
# %%RUBYGEMS_SETUP_END%%

$LOAD_PATH << RUBY_LIB_LOCATION
# ------------------------------------------------------------------------------

require 'pathname'
require 'base64'
require 'open3'
require 'rexml/document'

require 'CommandManager'
require 'DriverLogger'
require 'opennebula'

# Extends the base exception with a helper to log and exit the script
class StandardError

    def die(error_msg, user_msg = '', verbose = true)
        error_msg << "\n#{message}" if verbose

        OpenNebula::DriverLogger.log_error(error_msg)
        OpenNebula::DriverLogger.report(user_msg) unless user_msg.empty?

        exit(-1)
    end

end

module TransferManager

    # Generic class that represent a Transfer Manager Action
    # Arguments as received from OpenNebula
    #    vm_id: ID of the VM (-1 if no VM information needed)
    #    action_name: Name of action (e.g. clone)
    #
    # Example of argument:
    #    "ubuntu2004-6-4-4643-1.test:/var/lib/one//datastores/0/2/disk.0"
    class Action

        # ----------------------------------------------------------------------
        # Class accessors
        # ----------------------------------------------------------------------
        attr_reader :vm, :one

        # ----------------------------------------------------------------------

        # ----------------------------------------------------------------------
        # Represents a path in a host in the form <hostname>[:<path>]
        # ----------------------------------------------------------------------
        class Location

            attr_reader :path, :orig_path
            attr_accessor :host

            class NotALocation < StandardError
            end

            def initialize(location)
                location = location.split(':') if location.is_a? String

                case location
                when Array
                    case location.size
                    when 1
                        @host       = nil
                        path        = location[0]
                    when 2
                        @host, path = location
                    else
                        raise NotALocation, 'Invalid location format'
                    end

                    @orig_path = path
                    @path      = Pathname.new(path).cleanpath
                else
                    raise NotALocation, 'Invalid location format'
                end

                # # FIXME: convert ^ to pattern matching once we've dropped Ruby<2.7:
                # case location
                # in [path]
                #     @host      = nil
                #     @orig_path = path
                #     @path      = Pathname.new(path).cleanpath
                # in [host, path]
                #     @host      = host
                #     @orig_path = path
                #     @path      = Pathname.new(path).cleanpath
                # else
                #     raise NotALocation, 'Invalid location format'
                # end
            end

            def update(location)
                initialize(location)
            end

            def to_s
                hostpart = "#{@host}:" if @host

                "#{hostpart}#{@path}"
            end

            def path=(path)
                @path = Pathname.new(path).cleanpath
            end

            def dir
                @path.dirname
            end

            def base
                @path.basename
            end

            def disk?
                @path.to_s.match?(/disk\.[0-9]+/)
            end

            def disk_id
                base.to_s.split('.')[-1]
            end

        end

        # ----------------------------------------------------------------------
        # Class methods
        # ----------------------------------------------------------------------
        # TODO: move parsing to common file datastore.rb, tm_action.rb, kvm.rb
        #
        # Loads a bash formatted file to the current environment
        # Syntax:
        #   - Lines starting with # are ignored
        #   - VARIABLE=VALUE
        #   - export VARIABLE=VALUE
        #
        # @param [String] path to load environment from
        def self.load_env(filepath)
            File.readlines(filepath).each do |l|
                next if l.empty? || l[0] == '#'

                m = l.match(/(export)?[[:blank:]]*([^=]+)=['"]?([^'"]+)['"]?$/)

                next unless m

                ENV[m[2]] = m[3].delete("\n") if m[2] && m[3]
            end
        rescue StandardError
        end

        # Executes cmds in a remote host (see ssh instance method)
        def self.ssh(aname, options)
            action = Action.new(:action_name => aname, :vm_id => -1)
            action.ssh(options)
        end

        # ----------------------------------------------------------------------
        # Instance methods
        # ----------------------------------------------------------------------

        def initialize(options = {})
            @options = {
                :vm_id       => -1,
                :action_name => 'tm_action',
                :envfile     => nil
            }.merge!(options)

            # Get associated VM information
            if @options[:vm_id] != -1
                @one = OpenNebula::Client.new
                @vm  = OpenNebula::VirtualMachine.new_with_id(@options[:vm_id],
                                                              @one)
                rc   = @vm.info

                raise rc.message.to_s if OpenNebula.is_error?(rc)
            end

            # Load driver environment file
            Action.load_env(@options[:envfile]) if @options[:envfile]

            # Round robin index
            @rridx = 0
        end

        # Executes a set of commands scripts in a remote host.
        #
        # @param [Hash] options for the remote execution
        #   @option options [String]  :cmds script that will be executed remotely
        #   @option options [String]  :host hostname or IP of the remote host
        #   @option options [String]  :err_msg string to be used in case of error
        #   @option options [Integer] :rc_ok successful return code apart from 0
        #   @option options [Boolean] :forward SSH Agent
        #   @option options [Boolean] :nostdout discard stdout of cmds
        #   @option options [Boolean] :nostderr discard stderr of cmds
        #
        # @return [GenericCommand] includes return code and standard streams
        def ssh(options = {})
            opt = {
                :cmds     => '',
                :host     => '',
                :err_msg  => nil,
                :ok_rc    => nil,
                :forward  => false,
                :nostdout => true,
                :nostderr => true,
                :silent   => false
            }.merge!(options)

            script = <<~EOS
                export LANG=C
                export LC_ALL=C
                #{opt[:cmds]}
            EOS

            ssh_opts = '-o ControlMaster=no -o ControlPath=none'
            ssh_opts += ' -o ForwardAgent=yes' if opt[:forward]

            shell = 'bash -s'
            shell += ' 1>/dev/null' if opt[:nostdout]
            shell += ' 2>/dev/null' if opt[:nostderr]

            rc = if opt[:host]
                     SSHCommand.run(shell,
                                    opt[:host],
                                    nil,
                                    script,
                                    nil,
                                    ssh_opts)
                 else
                     LocalCommand.run(shell, nil, script, nil)
                 end

            success = rc.code == 0 || (opt[:ok_rc] && opt[:ok_rc] == rc.code)

            return rc if opt[:silent]

            unless success
                logger = OpenNebula::DriverLogger

                err = opt[:err_msg] || "Command failed:\n#{script}"

                # User info
                logger.report err.chomp

                # Logs
                logger.log_error err.chomp
                logger.log_error "  [STDOUT] \"#{rc.stdout.gsub("\n", '\n')}\"\n" \
                    unless opt[:nostdout]
                logger.log_error "  [STDERR] \"#{rc.stderr.gsub("\n", '\n')}\"\n" \
                    unless opt[:nostderr]
            end

            rc
        end

        # TODO: Add comments
        def migrate_other(template64)
            template_xml = REXML::Document.new(Base64.decode64(template64))

            context_disk_id = template_xml.elements['/VM/TEMPLATE/CONTEXT/DISK_ID'].text
            tmmads          = template_xml.elements['/VM/TEMPLATE/DISK/TM_MAD'].text.split

            (driver_path, operation) = File.split($PROGRAM_NAME)

            current_tmmad = File.basename(driver_path)
            processed_tms = []

            tmmads.each do |tmmad|
                next if tmmad == current_tmmad || processed_tms.include?(tmmad)

                OpenNebula::DriverLogger.log_info "Call #{tmmad}/#{operation}"

                cmdargs = ["#{driver_path}/../#{tmmad}/#{operation}", ARGV, current_tmmad].flatten
                Open3.popen2(cmdargs) {|i, _o, _t| i.puts template64 }

                processed_tms << tmmad
            end

            puts context_disk_id
        end

        # Generates a unique host identifier bases in its unique machine ID
        # and IP address
        # @param [String] Hostname
        #
        # @return [String] with machine ID (SHA256) empty in case of failure
        def host_fingerprint(host)
            fingerprint_cmd = <<~EOF
                {
                  cat /etc/machine-id;
                  ip --br l | awk '{print $1, $3}';
                } |
                    sha256sum |
                    awk '{print $1}'
            EOF

            rc = ssh(:host => host,
                     :cmds => fingerprint_cmd,
                     :err_msg => 'Compute VM fingerprint',
                     :nostdout => false,
                     :nostderr => false)

            return '' if rc.code != 0

            rc.stdout
        end

        # Creates dst dir at host.
        # @param [Location] dst path to create
        # @param [Boolean] dmonit disable local monitoring
        # @param [Boolean] do_exit exit action if failure
        #
        # @return [Integer] of the path creation command
        def make_dst_path(dst, dmonit = false, do_exit = true)
            vmdir  = dst.path.dirname

            script = <<~EOS
                set -e -o pipefail

                if [ ! -d #{vmdir} ]; then
                    mkdir -p '#{vmdir}'
                fi
            EOS

            if dmonit
                script << "rm -f '#{vmdir.parent}/.monitor'"
            end

            rc = ssh(:cmds    => script,
                     :host    => dst.host,
                     :err_msg => "Error creating directory #{dst}")

            exit(rc.code) if rc.code != 0 && do_exit

            rc.code
        end

        #-----------------------------------------------------------------------
        # Virtual Machine helper functions
        #-----------------------------------------------------------------------

        #  @return[String] VM_MAD name for this host
        def vm_mad
            @vm['/VM/HISTORY_RECORDS/HISTORY[last()]/VM_MAD']
        end

        def kvm?
            'kvm'.casecmp(vm_mad) == 0
        end

        def hotplug?
            'HOTPLUG_SAVEAS'.casecmp(@vm.lcm_state_str) == 0
        end

        #-----------------------------------------------------------------------
        # VM Disk helper functions
        #-----------------------------------------------------------------------

        # Returns an attribute from a given disk
        #
        # @param disk_id [String/Integer] id for the disk
        # @param aname [String] attribute name
        #
        # @return [String] attribute value
        def disk_attribute(disk_id, aname)
            @vm["/VM/TEMPLATE/DISK[DISK_ID=#{disk_id}]/#{aname}"].to_s
        end

        def persistent?(disk_id)
            disk_attribute(disk_id, 'SAVE').casecmp('YES') == 0
        end

        def sparse?(disk_id)
            disk_attribute(disk_id, 'SPARSE').casecmp('NO') != 0
        end

        def disk_target(disk_id)
            disk_attribute(disk_id, 'TARGET')
        end

        def snapshot_attribute(snap_id, aname)
            @vm["/VM/SNAPSHOTS/SNAPSHOT[ID=#{snap_id}]/#{aname}"].to_s
        end

        def snapshot_active(snap_id)
            snapshot_attribute(snap_id, 'ACTIVE')
        end

        # @param [int] disk_id
        # @return[Symbol] disk format (:raw or :qcow2)
        #
        # TODO: raise if format different from :raw / :qcow2
        def disk_format(disk_id)
            disk_format = disk_attribute(disk_id, 'FORMAT')

            case disk_format
            when 'raw', 'qcow2'
                disk_format.to_sym
            end
        end

        # @param [int] disk_id
        # @return[map] map containing the :current and :original sizes
        def disk_sizes(disk_id)
            {
                :current  => disk_attribute(disk_id, 'SIZE').to_i,
                :original => disk_attribute(disk_id, 'ORIGINAL_SIZE').to_i
            }
        end

        def resize_disk(dst, size_mb, sparse)
            opts = '--preallocation=falloc' if sparse

            ssh(:cmds    => "qemu-img resize #{opts} #{dst.path} #{size_mb}M",
                :host    => dst.host,
                :err_msg => "Error resizing image #{dst}")
        end

        # Enables local monitoring for host <host> and DS <dst>, by creating the corresponding
        # .monitor file containing the <driver> name
        # @param [String] dst path to create
        # @param [String] driver driver name (e.g., ssh)
        #
        # @return [Integer] rc of the command
        def enable_local_monitoring(dst, driver)
            dsdir  = dst.path.parent.parent

            script = <<~EOS
                set -e -o pipefail

                MONITOR_FN="#{dsdir}/.monitor"

                # create or update .monitor content
                MONITOR=''
                if [ -f "\${MONITOR_FN}" ]; then
                    MONITOR="\$(cat "\${MONITOR_FN}" 2>/dev/null)"
                fi

                if [ "x\${MONITOR}" != "x#{driver}" ]; then
                    echo "#{driver}" > "\${MONITOR_FN}"
                fi
            EOS

            ssh(:cmds    => script,
                :host    => dst.host,
                :err_msg => "Error creating #{dsdir}/.monitor at #{dst.host}")
        end

        # TODO: This needs to be updated for shared/qcow2 driver
        #
        # # Disables local monitoring for host $2 and DS $1, by removing the
        # # corresponding .monitor file
        # #
        # # @param host [String] Host to remove file from
        # # @param dst  [String] Directory to remove file from
        # def disable_local_monitoring(host, dir)
        #     script = <<~EOS
        #         set -e -o pipefail

        #         MONITOR_FN="\$(dirname #{dir})/.monitor"

        #         # remove .monitor file
        #         rm -f "\${MONITOR_FN}"
        #     EOS

        #     rc = ssh(:host => host, :cmds => script)

        #     return if rc.code == 0

        #     @logger.error "Error deleting #{dir}/.monitor at #{host}"

        #     exit(rc)
        # end

    end

end
