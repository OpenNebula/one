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
require 'securerandom'
require 'pathname'
require 'opennebula'
require 'rexml/document'

module TransferManager

    # Generic class that represent an OpenNebula Datastore. This helper class
    # lets you get datastore attributes
    class Datastore

        attr_reader :ds, :mad

        # Constants for wrapper commands
        SYSTEMD_RUN = 'systemd-run --user --quiet --pipe --collect --wait'
        IONICE      = 'ionice'
        NICE        = 'nice'

        # file descriptor for lock
        FD = 13

        # Datastore configuration files (bash syntax)
        DATASTORECONF = '/var/lib/one/remotes/etc/datastore/datastore.conf'

        @env_loaded = false

        # Loads a bash formatted file to the current environment
        # Syntax:
        #   - Lines starting with # are ignored
        #   - VARIABLE=VALUE
        #   - export VARIABLE=VALUE
        #
        # @param [String] path to load environment from
        def self.load_env
            return if @env_loaded

            File.readlines(DATASTORECONF).each do |l|
                next if l.empty? || l[0] == '#'

                m = l.match(/(export)?[[:blank:]]*([^=]+)="?([^"]+)"?$/)

                next unless m

                ENV[m[2]] = m[3].delete("\n") if m[2] && m[3]
            end

            @env_loaded = true
        rescue StandardError
        end

        # Initialize OpenNebula object and get its information
        def initialize(options = {})
            @options={
                :client => nil,
                :ds     => nil
            }.merge!(options)

            @one = @options[:client]
            @one ||= OpenNebula::Client.new

            @ds    = @options[:ds]
            if @ds && @ds['NAME'].nil?
                rc = @ds.info(true)
                raise rc.message.to_s if OpenNebula.is_error?(rc)
            end

            @rridx = 0

            @mad   = self['DS_MAD', ''].upcase
        end

        class << self

            # Creates a datastore object associated to the backup datastore used
            # by a VM
            #  - options[:vm_xml] XML document for the VM
            #  - options[:client] OpenNebula client object for API calls
            def from_vm_backup_ds(options)
                raise 'Virtual Machine XML not set' unless options[:vm_xml]

                options[:client] ||= OpenNebula::Client.new

                vm  = REXML::Document.new(options[:vm_xml]).root
                did = vm.elements['BACKUPS/BACKUP_CONFIG/LAST_DATASTORE_ID'].text.to_i

                options[:ds] = OpenNebula::Datastore.new_with_id(did, options[:client])

                rc = options[:ds].info(true)
                raise rc.message.to_s if OpenNebula.is_error?(rc)

                new(options)
            end

            # Creates a datastore object associated to a Image
            #  - options[:image_id] ID of the Image
            #  - options[:client] OpenNebula client object for API calls
            def from_image_ds(options)
                raise 'Image ID not set' unless options[:image]

                options[:client] ||= OpenNebula::Client.new

                did = options[:image]['/IMAGE/DATASTORE_ID'].to_i
                options[:ds] = OpenNebula::Datastore.new_with_id(did, options[:client])

                rc = options[:ds].info(true)
                raise rc.message.to_s if OpenNebula.is_error?(rc)

                new(options)
            end

            # Creates a datastore from its XML description
            #  - options[:ds_xml] XML document for the datastore object
            #  - options[:client] OpenNebula client object for API calls
            def from_xml(options)
                raise 'Datastore XML not set' unless options[:ds_xml]

                options[:client] ||= OpenNebula::Client.new

                xml = OpenNebula::XMLElement.build_xml(options[:ds_xml], 'DATASTORE')
                options[:ds] = OpenNebula::Datastore.new(xml, options[:client])

                rc = options[:ds].info(true)
                raise rc.message.to_s if OpenNebula.is_error?(rc)

                new(options)
            end

        end

        # Makes a local call to some operation of the given DS driver
        # @param [String] ds_op operation, as well as its arguments (e.g., "cp <img_id>")
        #
        # @return [GenericCommand] return code of the command
        def action(ds_op, xml_data = '')
            ds_cmd = "#{__dir__}/../../datastore/#{@mad.downcase}/#{ds_op}"

            driver_action = <<~EOS
                <DS_DRIVER_ACTION_DATA>
                #{ds.to_xml}
                #{xml_data}
                </DS_DRIVER_ACTION_DATA>
            EOS

            Action.ssh('datastore_action',
                       :host => nil,
                       :cmds => "echo '#{driver_action}' | #{ds_cmd}",
                       :forward  => false,
                       :nostdout => false,
                       :nostderr => false)
        end

        # Select a host from the datastore's BRIDGE_LIST.
        # Equivalent to `get_destination_host` from datastore_mad/remotes/libfs.sh
        #
        # @return [String] chosen bridge host
        def pick_bridge
            bridges = bridge_list
            bridge  = bridges[@rridx % bridges.length]

            @rridx += 1

            bridge
        end

        # Return a datastore's BRIDGE_LIST
        #
        # @return [[String]] array of bridge hosts
        def bridge_list
            @ds['/DATASTORE/TEMPLATE/BRIDGE_LIST'].split
        end

        def [](xpath, default = '')
            v = @ds[xpath]

            return default if !v || v == ''

            v
        end

        # Confine the datastore command. It will try first to use systemd slices
        # and then nice/ionice
        #  @param[String] cmd is the command to execute
        #  @param[String] vm_dir_path used to set IO limits on the system ds
        #  block device
        def cmd_confinement(cmd, vm_dir, env_a = [])
            ccmd = systemd_cmd(cmd, vm_dir, env_a)

            return ccmd if ccmd != cmd

            nice_cmd(cmd)
        end

        # Confine the datastore command in a systemd slice.
        #  @param[String] cmd is the command to execute
        #  @param[String] vm_dir_path used to set IO limits on the system ds
        #  block device
        #
        # The slice can set the following resources:
        #   - CPUQuota
        #   - IOReadIOPSMax
        #   - IOWriteIOPSMax
        #
        # This requires delegation of io/cpu/cpuset controllers to oneadmin
        # vmdir needs to be local (e.g. not an NFS volume)
        #
        # Access to user systemd requires:
        # export XDG_RUNTIME_DIR="/run/user/$UID"
        # export DBUS_SESSION_BUS_ADDRESS="unix:path=${XDG_RUNTIME_DIR}/bus"
        def systemd_cmd(cmd, vm_dir, env_a)
            return cmd if @mad.empty?

            riops = Integer(self["TEMPLATE/#{@mad}_MAX_RIOPS", -1])
            wiops = Integer(self["TEMPLATE/#{@mad}_MAX_WIOPS", -1])
            cpuq  = Integer(self["TEMPLATE/#{@mad}_CPU_QUOTA", -1])

            return cmd if riops == -1 && wiops == -1 && cpuq == -1

            vm_path = Pathname.new(vm_dir)
            bpath   = vm_path.cleanpath

            env_opts = ''
            env_a.each {|e| env_opts += " --setenv=\"#{e}=$#{e}\"" }

            # Create a slice for backup processes (per backup datastore)
            spath = '~/.config/systemd/user'
            sname = "backup.#{@ds.id}.slice"

            slice =<<~EOS
                [Slice]
                CPUQuota=#{cpuq == -1? '': "#{cpuq}%"}
                IOReadIOPSMax=#{riops == -1? '': "#{bpath} #{riops}"}
                IOWriteIOPSMax=#{wiops == -1? '': "#{bpath} #{wiops}"}
            EOS

            <<~EOS
                mkdir -p #{spath}

                (flock -w 180 #{FD} || exit 1
                 echo '#{slice}' > #{spath}/#{sname}
                 systemctl --user daemon-reload
                ) #{FD}> #{spath}/.lock

                #{SYSTEMD_RUN} #{env_opts} --slice=#{sname} #{cmd}
            EOS
        end

        # Generate a "nice" command
        #  @param[String] cmd is the command to execute
        def nice_cmd(cmd)
            return cmd if @mad.empty?

            ionice = Integer(self["TEMPLATE/#{@mad}_IONICE", -1])
            nice   = Integer(self["TEMPLATE/#{@mad}_NICE", -1])

            return cmd if ionice == -1 && nice == -1

            rcmd = ''

            rcmd << "#{NICE} -n #{nice} " if nice != -1
            rcmd << "#{IONICE} -c2 -n#{ionice} " if ionice != -1
            rcmd << cmd
        end

    end

end
