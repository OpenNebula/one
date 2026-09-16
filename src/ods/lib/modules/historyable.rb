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

        # Stores timestamped events in an ODS document body
        #
        # Including classes may declare an EVENTS hash that maps event keys to
        # their persisted names
        module Historyable

            HISTORY_ATTR = :historic
            EVENTS       = {}

            # Returns the document history, initializing it when absent.
            #
            # @return [Array<Hash>] Persisted event entries
            def historic
                @body[HISTORY_ATTR] ||= []
            end

            # Adds an event to document history. The caller must persist the document
            # as part of the operation that produced the event.
            #
            # @param event [String, Symbol] Key declared by the including class
            # @param description [String] Event description
            # @return [Array<Hash>] Updated document history
            # @raise [ArgumentError] If the event key is not declared
            def register_event(event, description:)
                event_key = event.to_sym
                name      = self.class::EVENTS.fetch(event_key) do
                    raise ArgumentError, "Unknown history event: #{event_key}"
                end

                historic << {
                    :action      => name,
                    :description => description,
                    :time        => Time.now.to_i
                }
            end

            # Adds the history to the plain document representation.
            #
            # @return [Hash] Parent representation with the history field
            def plain_body
                super.merge(HISTORY_ATTR => historic)
            end

            # Ensures an empty history is present in serialized documents.
            #
            # @param opts [Hash] Serialization options forwarded to the document
            # @return [Hash] Document representation with the history field
            def to_h(opts = {})
                document = super(opts)
                body = document['DOCUMENT']['TEMPLATE'][self.class::TEMPLATE_TAG]

                body[HISTORY_ATTR] ||= []

                document
            end

        end

    end

end
