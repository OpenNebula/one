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

# rubocop:disable Style/ClassVars
module TransferManager

    # KVM VM MAD module
    module KVM

        KVMRC = '/var/lib/one/remotes/etc/vmm/kvm/kvmrc'

        @@env_loaded = false

        # Load the KVMRC environment
        def self.included(_module)
            load_env(KVMRC) unless @@env_loaded
            @@env_loaded = true
        end

        # Loads a bash formatted file to the current environment
        # Syntax:
        #   - Lines starting with # are ignored
        #   - VARIABLE=VALUE
        #   - export VARIABLE=VALUE
        #
        # @param [String] path to load environment from
        def self.load_env(path)
            File.readlines(path).each do |l|
                next if l.empty? || l[0] == '#'

                m = l.match(/(export)?[[:blank:]]*([^=]+)=['"]?([^'"]+)['"]?$/)

                next unless m

                ENV[m[2]] = m[3].delete("\n") if m[2] && m[3]
            end
        rescue StandardError
        end

        # Genetate virsh command. Reads LIBVIRT_URI from the environment
        # TMAction.load_env should be use before calling this method
        #
        # @return [String] command e.g. 'virsh --connect qemu://system'
        def virsh
            uri = ENV['LIBVIRT_URI']
            uri ||= 'qemu:///system'

            "virsh --connect #{uri}"
        end

        # Genetate virsh command to "pause" the VM before excuting any FS related
        # operation. The modes are:
        #   - NONE (no operation)
        #   - AGENT (domfsfreeze - domfsthaw)
        #   - SUSPEND (suspend - resume)
        #
        # @param [rexml/document] vm xml drescription of the VM
        # @param [String] deploy_id of the VM
        #
        # @return [String, String] freeze and thaw commands
        def fsfreeze(vm, deploy_id)
            mode = begin
                vm.elements['/VM/BACKUPS/BACKUP_CONFIG/FS_FREEZE'].text.upcase
            rescue StandardError
                'NONE'
            end

            case mode
            when 'NONE'
                ['', '']
            when 'AGENT'
                freeze = <<~EOS
                    #{virsh} domfsfreeze #{deploy_id} && export FROZEN="TRUE"
                    trap '[ -n "${FROZEN}" ] && #{virsh} domfsthaw #{deploy_id}' EXIT
                EOS

                [freeze, "#{virsh} domfsthaw #{deploy_id} && unset FROZEN"]

            when 'SUSPEND'
                freeze = <<~EOS
                    #{virsh} suspend #{deploy_id} && export SUSPENDED="TRUE"
                    trap '[ -n "${SUSPENDED}" ] && #{virsh} resume #{deploy_id}' EXIT
                EOS

                [freeze, "#{virsh} resume #{deploy_id} && unset SUSPENDED"]

            else
                ['', '']
            end
        end

    end

end
# rubocop:enable Style/ClassVars
