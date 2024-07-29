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

require 'opennebula/lockable_ext'
require 'opennebula/pool_element'

require 'fileutils'

module OpenNebula
    class Image < PoolElement
        #######################################################################
        # Constants and Class Methods
        #######################################################################

        IMAGE_METHODS = {
            :info       => "image.info",
            :allocate   => "image.allocate",
            :update     => "image.update",
            :enable     => "image.enable",
            :persistent => "image.persistent",
            :delete     => "image.delete",
            :chown      => "image.chown",
            :chmod      => "image.chmod",
            :chtype     => "image.chtype",
            :clone      => "image.clone",
            :rename     => "image.rename",
            :snapshotdelete  => "image.snapshotdelete",
            :snapshotrevert  => "image.snapshotrevert",
            :snapshotflatten => "image.snapshotflatten",
            :restore    => "image.restore",
            :lock       => "image.lock",
            :unlock     => "image.unlock"
        }

        IMAGE_STATES=%w{INIT READY USED DISABLED LOCKED ERROR CLONE DELETE
            USED_PERS LOCKED_USED LOCKED_USED_PERS}

        SHORT_IMAGE_STATES={
            "INIT"      => "init",
            "READY"     => "rdy",
            "USED"      => "used",
            "DISABLED"  => "disa",
            "LOCKED"    => "lock",
            "ERROR"     => "err",
            "CLONE"     => "clon",
            "DELETE"    => "dele",
            "USED_PERS" => "used",
            "LOCKED_USED" => "lock",
            "LOCKED_USED_PERS" => "lock"
        }

        IMAGE_TYPES=%w{OS CDROM DATABLOCK KERNEL RAMDISK CONTEXT BACKUP}

        SHORT_IMAGE_TYPES={
            "OS"        => "OS",
            "CDROM"     => "CD",
            "DATABLOCK" => "DB",
            "KERNEL"    => "KL",
            "RAMDISK"   => "RD",
            "CONTEXT"   => "CX",
            "BACKUP"    => "BK"
        }

        DISK_TYPES=%w{FILE CD_ROM BLOCK RBD}

        # Creates an Image description with just its identifier
        # this method should be used to create plain Image objects.
        # +id+ the id of the image
        #
        # Example:
        #   image = Image.new(Image.build_xml(3),rpc_client)
        #
        def Image.build_xml(pe_id=nil)
            if pe_id
                image_xml = "<IMAGE><ID>#{pe_id}</ID></IMAGE>"
            else
                image_xml = "<IMAGE></IMAGE>"
            end

            XMLElement.build_xml(image_xml,'IMAGE')
        end

        # Class constructor
        def initialize(xml, client)
            LockableExt.make_lockable(self, IMAGE_METHODS)

            super(xml,client)
        end

        #######################################################################
        # XML-RPC Methods for the Image Object
        #######################################################################

        # Retrieves the information of the given Image.
        def info(decrypt = false)
            super(IMAGE_METHODS[:info], 'IMAGE', decrypt)
        end

        alias_method :info!, :info

        # Allocates a new Image in OpenNebula
        #
        # @param description [String] A string containing the template of the Image.
        # @param ds_id [Integer] the target datastore ID
        # @param no_check_capacity [Boolean] true to skip capacity check. Only for admins.
        #
        # @return [nil, OpenNebula::Error] nil in case of success, Error
        #   otherwise
        def allocate(description, ds_id, no_check_capacity=false)
            super(IMAGE_METHODS[:allocate],description, ds_id, no_check_capacity)
        end

        # Replaces the template contents
        #
        # @param new_template [String] New template contents
        # @param append [true, false] True to append new attributes instead of
        #   replace the whole template
        #
        # @return [nil, OpenNebula::Error] nil in case of success, Error
        #   otherwise
        def update(new_template=nil, append=false)
            super(IMAGE_METHODS[:update], new_template, append ? 1 : 0)
        end

        # Enables an Image
        def enable
            set_enabled(true)
        end

        # Disables an Image
        def disable
            set_enabled(false)
        end

        # Publishes the Image, to be used by other users
        def publish
            set_publish(true)
        end

        # Unplubishes the Image
        def unpublish
            set_publish(false)
        end

        # Makes the Image persistent
        def persistent
            set_persistent(true)
        end

        # Makes the Image non persistent
        def nonpersistent
            set_persistent(false)
        end

        # Deletes the Image
        def delete(force=false)
            call(IMAGE_METHODS[:delete], @pe_id, force)
        end

        # Changes the owner/group
        # uid:: _Integer_ the new owner id. Set to -1 to leave the current one
        # gid:: _Integer_ the new group id. Set to -1 to leave the current one
        # [return] nil in case of success or an Error object
        def chown(uid, gid)
            super(IMAGE_METHODS[:chown], uid, gid)
        end

        # Changes the Image permissions.
        #
        # @param octet [String] Permissions octed , e.g. 640
        # @return [nil, OpenNebula::Error] nil in case of success, Error
        #   otherwise
        def chmod_octet(octet)
            super(IMAGE_METHODS[:chmod], octet)
        end

        # Changes the Image permissions.
        # Each [Integer] argument must be 1 to allow, 0 deny, -1 do not change
        #
        # @return [nil, OpenNebula::Error] nil in case of success, Error
        #   otherwise
        def chmod(owner_u, owner_m, owner_a, group_u, group_m, group_a, other_u,
                other_m, other_a)
            super(IMAGE_METHODS[:chmod], owner_u, owner_m, owner_a, group_u,
                group_m, group_a, other_u, other_m, other_a)
        end

        # Changes the Image type
        # @param type [String] new Image type
        # @return [nil, OpenNebula::Error] nil in case of success, Error
        #   otherwise
        def chtype(type)
            return Error.new('ID not defined') if !@pe_id

            rc = @client.call(IMAGE_METHODS[:chtype], @pe_id, type)
            rc = nil if !OpenNebula.is_error?(rc)

            return rc
        end

        # Clones this Image into a new one
        #
        # @param [String] name for the new Image.
        #
        # @return [Integer, OpenNebula::Error] The new Image ID in case
        #   of success, Error otherwise
        def clone(name, target_ds=-1)
            return Error.new('ID not defined') if !@pe_id

            rc = @client.call(IMAGE_METHODS[:clone], @pe_id, name, target_ds)

            return rc
        end

        # Renames this Image
        #
        # @param name [String] New name for the Image.
        #
        # @return [nil, OpenNebula::Error] nil in case of success, Error
        #   otherwise
        def rename(name)
            call(IMAGE_METHODS[:rename], @pe_id, name)
        end

        # Deletes Image from snapshot
        #
        # @param snap_id [Integer] ID of the snapshot to delete
        #
        # @return [nil, OpenNebula::Error] nil in case of success or Error
        def snapshot_delete(snap_id)
            call(IMAGE_METHODS[:snapshotdelete], @pe_id, snap_id)
        end

        # Reverts Image state to a previous snapshot
        #
        # @param snap_id [Integer] ID of the snapshot to revert to
        #
        # @return [nil, OpenNebula::Error] nil in case of success or Error
        def snapshot_revert(snap_id)
            call(IMAGE_METHODS[:snapshotrevert], @pe_id, snap_id)
        end

        # Flattens an image snapshot
        #
        # @param snap_id [Integer] ID of the snapshot to flatten
        #
        # @return [nil, OpenNebula::Error] nil in case of success or Error
        def snapshot_flatten(snap_id)
            call(IMAGE_METHODS[:snapshotflatten], @pe_id, snap_id)
        end

        # Restore the VM backup stored by the image
        #
        # @param dst_id [Integer] Datastore destination ID
        # @param restore_opts [String] Template with additional restore options
        def restore(dst_id, restore_opts)
            @client.call(IMAGE_METHODS[:restore], @pe_id, dst_id, restore_opts)
        end

        #######################################################################
        # Helpers to get Image information
        #######################################################################

        # Returns the state of the Image (numeric value)
        def state
            self['STATE'].to_i
        end

        # Returns the state of the Image (string value)
        def state_str
            IMAGE_STATES[state]
        end

        # Returns the state of the Image (string value)
        def short_state_str
            SHORT_IMAGE_STATES[state_str]
        end

        # Returns the type of the Image (numeric value)
        def type
            self['TYPE'].to_i
        end

        # Returns the type of the Image (string value)
        def type_str
            IMAGE_TYPES[type]
        end

        # Returns the state of the Image (string value)
        def short_type_str
            SHORT_IMAGE_TYPES[type_str]
        end

        # Returns the group identifier
        # [return] _Integer_ the element's group ID
        def gid
            self['GID'].to_i
        end

        def public?
            if self['PERMISSIONS/GROUP_U'] == "1" || self['PERMISSIONS/OTHER_U'] == "1"
                true
            else
                false
            end
        end

        def wait_state(state, timeout=120)
            require 'opennebula/wait_ext'

            extend OpenNebula::WaitExt

            rc = wait(state, timeout)

            return Error.new("Timeout expired for state #{state}.") unless rc

            true
        end

    private

        def set_enabled(enabled)
            return Error.new('ID not defined') if !@pe_id

            rc = @client.call(IMAGE_METHODS[:enable], @pe_id, enabled)
            rc = nil if !OpenNebula.is_error?(rc)

            return rc
        end

        def set_publish(published)
            group_u = published ? 1 : 0

            chmod(-1, -1, -1, group_u, -1, -1, -1, -1, -1)
        end

        def set_persistent(persistence)
            return Error.new('ID not defined') if !@pe_id

            rc = @client.call(IMAGE_METHODS[:persistent], @pe_id, persistence)
            rc = nil if !OpenNebula.is_error?(rc)

            return rc
        end
    end
end
