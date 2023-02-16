#!/usr/bin/env ruby

# -------------------------------------------------------------------------- #
# Copyright 2002-2022, OpenNebula Project, OpenNebula Systems                #
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

        # Constants for wrapper commands
        SYSTEMD_RUN = 'systemd-run --user --quiet --pipe --collect --wait'
        IONICE      = 'ionice'
        NICE        = 'nice'

        # file descriptor for lock
        FD = 13

        # Initialize OpenNebula object and get its information
        def initialize(options = {})
            @options={
                :client      => nil,
                :vm_xml      => '',
                :ds_prefix   => '',
                :ds_xml      => ''
            }.merge!(options)

            @one = @options[:client]
            @one ||= OpenNebula::Client.new

            if @options[:ds_xml].empty?
                vm  = REXML::Document.new(@options[:vm_xml]).root
                did = vm.elements['BACKUPS/BACKUP_CONFIG/LAST_DATASTORE_ID']

                @ds = OpenNebula::Datastore.new_with_id(did.text.to_i, @one)
                rc  = @ds.info

                raise rc.message.to_s if OpenNebula.is_error?(rc)
            else
                xml = OpenNebula::XMLElement.build_xml(@options[:ds_xml], 'DATASTORE')
                @ds = OpenNebula::Datastore.new(xml, @one)
            end

            @mad = self['DS_MAD', ''].upcase
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
