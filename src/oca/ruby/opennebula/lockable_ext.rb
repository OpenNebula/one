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

require 'date'

require 'opennebula/document'
require 'opennebula/hook'
require 'opennebula/image'
require 'opennebula/marketplaceapp'
require 'opennebula/template'
require 'opennebula/virtual_machine'
require 'opennebula/virtual_network'
require 'opennebula/virtual_router'
require 'opennebula/vm_group'
require 'opennebula/vntemplate'

# Module to decorate Lockable classes with the following methods:
#   - Lock
#   - Unlock
#   - Synchronize
#
# rubocop:disable Style/ClassAndModuleChildren
module OpenNebula::LockableExt

    # Expire timeout for locking operation
    LOCK_TIMEOUT = 120

    def self.make_lockable(obj, methods)
        obj.instance_variable_set(:@lock_method, methods[:lock])
        obj.instance_variable_set(:@unlock_method, methods[:unlock])

        obj.extend(OpenNebula::LockableExt)
    end

    def self.extend_object(obj)
        lockable?(obj)

        class << obj

            # Locks the object
            #
            # @param level [Integer] Lock level
            # @param test  [Boolean] Check if the object is already locked
            #
            # use    -> level = 1
            # manage -> level = 2
            # admin  -> level = 3
            # all    -> level = 4
            #
            # @return [Integer, OpenNebula::Error]
            #   - Object ID if the lock was granted
            #   - Error otherwise
            def lock(level, test = false)
                return Error.new('ID not defined') unless @pe_id

                @client.call(@lock_method, @pe_id, level, test)
            end

            # Unlocks this object
            #
            # @return [nil, OpenNebula::Error]
            #   - nil in case of success
            #   - Error otherwise
            def unlock
                @client.call(@unlock_method, @pe_id)
            end

            # Executes an operation with lock granted
            #
            # @param level [Integer] Lock level
            #
            # @return [Operation rc, OpenNebula::Error]
            #   - Operation return code
            #   - Error otherwise
            def synchronize(level)
                rc = lock(level, true)

                if OpenNebula.is_error?(rc)
                    # If test check, core returns timestamp when it was locked
                    lock_time = Time.at(Integer(rc.message.split(' ')[1]))
                    c_time    = Time.now

                    # If the timeout has not yet expired, return error
                    if (c_time - lock_time) < LOCK_TIMEOUT
                        return Error.new('Object is locked')
                    end

                    rc = lock(level)

                    return rc if OpenNebula.is_error?(rc)
                end

                ret = yield if block_given?

                unless OpenNebula.is_error?(info)
                    rc = unlock

                    return rc if OpenNebula.is_error?(rc)
                end

                ret
            end

        end

        super
    end

    # Check if object is lockable or not
    #
    # @param obj [Object or Class] Object to check class
    def self.lockable?(obj)
        # Lockable classes
        lockable = [
            OpenNebula::BackupJob,
            OpenNebula::Document,
            OpenNebula::Hook,
            OpenNebula::Image,
            OpenNebula::MarketPlaceApp,
            OpenNebula::Template,
            OpenNebula::VirtualMachine,
            OpenNebula::VirtualNetwork,
            OpenNebula::VirtualRouter,
            OpenNebula::VMGroup,
            OpenNebula::VNTemplate
        ]

        # Get obj class to find parents in lockable class
        # rubocop:disable Style/TernaryParentheses
        (obj.is_a? Class) ? o_class = obj : o_class = obj.class
        # rubocop:enable Style/TernaryParentheses

        found   = false
        i_class = o_class

        while i_class
            if lockable.include?(i_class)
                found = true
                break
            end

            i_class = i_class.superclass
        end

        return if found

        raise StandardError, "Cannot extend #{o_class} with LockableExt"
    end

end
# rubocop:enable Style/ClassAndModuleChildren
