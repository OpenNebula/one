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

        # Result exchanged between internal job execution phases.
        #
        # Wrapping control states prevents values returned by workflow callbacks from
        # being mistaken for scheduler signals.
        class ExecResult

            STATES = [
                :ok, :error, :retry, :stale, :waiting, :cancelled, :stopped
            ].freeze

            attr_reader :state, :value

            def initialize(state, value = nil)
                raise ArgumentError, "Invalid execution result #{state}" \
                    unless STATES.include?(state)

                @state = state
                @value = value

                freeze
            end

            class << self

                def ok(value = true)
                    new(:ok, value)
                end

                def error(value)
                    new(:error, value)
                end

                def retry(value)
                    new(:retry, value)
                end

                def stale
                    @stale ||= new(:stale)
                end

                def waiting(value = nil)
                    new(:waiting, value)
                end

                def cancelled(value = nil)
                    new(:cancelled, value)
                end

                def stopped
                    @stopped ||= new(:stopped)
                end

            end

            STATES.each do |state|
                define_method("#{state}?") { @state == state }
            end

        end

    end

end
