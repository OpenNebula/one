# -------------------------------------------------------------------------- #
# Copyright 2002-2026, OpenNebula Project, OpenNebula Systems                #
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

module OpenNebula

    module DocumentServer

        # Stores recoverable lifecycle error context in an ODS document body.
        #
        # Mutations are in-memory until the including document is persisted. This module
        # adds no synchronization; callers should use the document's normal pool lock.
        module Errorable

            ERROR_ATTR = :error

            # Returns the recoverable error stored in the document body.
            #
            # @return [Hash, nil] Error description and retry context
            def error
                @body&.[](ERROR_ATTR)
            end

            # Stores a recoverable error in the document body.
            #
            # @param message [String] Error description
            # @param opts [Hash] Options needed to retry the failed operation
            # @param context [Hash] Additional application-specific error context
            # @return [Hash] Stored error context
            # @raise [ArgumentError] If opts is not a Hash
            def set_error(message, opts: {}, **context)
                raise ArgumentError, 'Error options must be a hash' unless opts.is_a?(Hash)

                @body[ERROR_ATTR] = {
                    :message   => message.to_s,
                    :timestamp => Time.now.to_i,
                    :opts      => opts
                }.merge(context).compact
            end

            # Clears the recoverable error stored in the document body.
            #
            # @return [nil]
            def clear_error
                @body[ERROR_ATTR] = nil
            end

            # Adds the recoverable error to the plain document representation.
            #
            # @return [Hash] Parent representation with the error field
            def plain_body
                super.merge(ERROR_ATTR => error)
            end

        end

    end

end
