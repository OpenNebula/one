# -------------------------------------------------------------------------- #
# Copyright 2002-2023, OpenNebula Project, OpenNebula Systems                #
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

require 'opennebula/lockable_ext'
require 'opennebula/pool_element'

module OpenNebula

    # Class for representing a Backup Job object
    class BackupJob < PoolElement

        #######################################################################
        # Constants and Class Methods
        #######################################################################

        BACKUPJOB_METHODS = {
            :allocate    => 'backupjob.allocate',
            :info        => 'backupjob.info',
            :update      => 'backupjob.update',
            :delete      => 'backupjob.delete',
            :chown       => 'backupjob.chown',
            :chmod       => 'backupjob.chmod',
            :clone       => 'backupjob.clone',
            :rename      => 'backupjob.rename',
            :lock        => 'backupjob.lock',
            :unlock      => 'backupjob.unlock',
            :backup      => 'backupjob.backup',
            :cancel      => 'backupjob.cancel',
            :retry       => 'backupjob.retry',
            :priority    => 'backupjob.priority',
            :schedadd    => 'backupjob.schedadd',
            :scheddelete => 'backupjob.scheddelete',
            :schedupdate => 'backupjob.schedupdate'
        }

        # Creates a BackupJob description with just its identifier
        # this method should be used to create plain BackupJob objects.
        # +id+ the id of the user
        #
        # Example:
        #   bj = BackupJob.new(BackupJob.build_xml(3),rpc_client)
        #
        def self.build_xml(pe_id = nil)
            if pe_id
                obj_xml = "<BACKUPJOB><ID>#{pe_id}</ID></BACKUPJOB>"
            else
                obj_xml = '<BACKUPJOB></BACKUPJOB>'
            end

            XMLElement.build_xml(obj_xml, 'BACKUPJOB')
        end

        # Class constructor
        def initialize(xml, client)
            LockableExt.make_lockable(self, BACKUPJOB_METHODS)

            super(xml, client)

            @client = client
        end

        #######################################################################
        # XML-RPC Methods for the Backup Job Object
        #######################################################################

        # Retrieves the information of the given Backup Job.
        def info
            return Error.new('ID not defined') unless @pe_id

            rc = @client.call(BACKUPJOB_METHODS[:info], @pe_id)

            if !OpenNebula.is_error?(rc)
                initialize_xml(rc, 'BACKUPJOB')
                rc = nil

                @pe_id = self['ID'].to_i if self['ID']
                @name  = self['NAME'] if self['NAME']
            end

            rc
        end

        alias info! info

        # Allocates a new Backup Job in OpenNebula
        #
        # @param description [String] The contents of the BackupJob.
        #
        # @return [nil, OpenNebula::Error] nil in case of success, Error
        #   otherwise
        def allocate(description)
            super(BACKUPJOB_METHODS[:allocate], description)
        end

        # Deletes the BackupJob
        #
        # @return [nil, OpenNebula::Error] nil in case of success, Error
        #   otherwise
        def delete
            call(BACKUPJOB_METHODS[:delete], @pe_id)
        end

        # Replaces the Backup Job contents
        #
        # @param new_template [String] New template contents
        # @param append [true, false] True to append new attributes instead of
        #   replace the whole template
        #
        # @return [nil, OpenNebula::Error] nil in case of success, Error
        #   otherwise
        def update(new_template, append = false)
            super(BACKUPJOB_METHODS[:update], new_template, append ? 1 : 0)
        end

        # Changes the owner/group
        # uid:: _Integer_ the new owner id. Set to -1 to leave the current one
        # gid:: _Integer_ the new group id. Set to -1 to leave the current one
        # [return] nil in case of success or an Error object
        def chown(uid, gid)
            super(BACKUPJOB_METHODS[:chown], uid, gid)
        end

        # Changes the Backup Job permissions.
        #
        # @param octet [String] Permissions octed , e.g. 640
        #
        # @return [nil, OpenNebula::Error] nil in case of success, Error
        #   otherwise
        def chmod_octet(octet)
            super(BACKUPJOB_METHODS[:chmod], octet)
        end

        # Changes the Backup Job permissions.
        # Each [Integer] argument must be 1 to allow, 0 deny, -1 do not change
        #
        # @return [nil, OpenNebula::Error] nil in case of success, Error
        #   otherwise
        # rubocop:disable Metrics/ParameterLists
        def chmod(owner_u, owner_m, owner_a, group_u, group_m, group_a, other_u,
                  other_m, other_a)
            call(BACKUPJOB_METHODS[:chmod], @pe_id, owner_u, owner_m, owner_a, group_u,
                 group_m, group_a, other_u, other_m, other_a)
        end
        # rubocop:enable Metrics/ParameterLists

        # Renames this Backup Job
        #
        # @param name [String] New name for the Backup Job.
        #
        # @return [nil, OpenNebula::Error] nil in case of success, Error
        #   otherwise
        def rename(name)
            call(BACKUPJOB_METHODS[:rename], @pe_id, name)
        end

        # Starts the Backup Job
        #
        # @return [nil, OpenNebula::Error] nil in case of success, Error
        #   otherwise
        def backup
            call(BACKUPJOB_METHODS[:backup], @pe_id)
        end

        # Cancel pending Backup Job, removing VMs from waiting list
        #
        # @return [nil, OpenNebula::Error] nil in case of success, Error
        #   otherwise
        def cancel
            call(BACKUPJOB_METHODS[:cancel], @pe_id)
        end

        # Retry backup for VMs in error list
        #
        # @return [nil, OpenNebula::Error] nil in case of success, Error
        #   otherwise
        def retry
            call(BACKUPJOB_METHODS[:retry], @pe_id)
        end

        # Change priority of Backup Job
        #
        # @return [nil, OpenNebula::Error] nil in case of success, Error
        #   otherwise
        def priority(pr)
            call(BACKUPJOB_METHODS[:priority], @pe_id, pr)
        end

        # Add Scheduled action
        #
        # @param sched_template [String] Template with SCHED_ACTIONs
        # @return [nil, OpenNebula::Error] nil in case of success, Error
        #   otherwise
        def sched_action_add(sched_template)
            call(BACKUPJOB_METHODS[:schedadd], @pe_id, sched_template)
        end

        # Delete Scheduled Action
        #
        # @param sched_id [Int] id of the SCHED_ACTION
        # @return [nil, OpenNebula::Error] nil in case of success, Error
        #   otherwise
        def sched_action_delete(sched_id)
            call(BACKUPJOB_METHODS[:scheddelete], @pe_id, sched_id.to_i)
        end

        # Update Scheduled Action
        #
        # @param sched_id [Int] id of the SCHED_ACTION
        # @param sched_template [String] Template containing a SCHED_ACTION
        # @return [nil, OpenNebula::Error] nil in case of success, Error
        #   otherwise
        def sched_action_update(sched_id, sched_template)
            call(BACKUPJOB_METHODS[:schedupdate], @pe_id,
                 sched_id.to_i, sched_template)
        end

        #######################################################################
        # Helpers to get Template information
        #######################################################################

        # Returns the group identifier
        # [return] _Integer_ the element's group ID
        def gid
            self['GID'].to_i
        end

        def owner_id
            self['UID'].to_i
        end

        def public?
            self['PERMISSIONS/GROUP_U'] == '1' || self['PERMISSIONS/OTHER_U'] == '1'
        end

    end

end
