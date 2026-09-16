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

        # Workflow job type and its durable request declarations.
        class Job

            # Declares a new durable job requested for a persistent owner.
            class Request

                attr_reader :step, :args

                def initialize(step, args: {}, replace: false)
                    @step    = step
                    @args    = args&.dup&.freeze
                    @replace = replace == true

                    raise ArgumentError, 'Requested job step must be a Symbol' \
                        unless @step.is_a?(Symbol)
                    raise ArgumentError, 'Requested job args must be a Hash' \
                        unless @args.is_a?(Hash)

                    freeze
                end

                def replace?
                    @replace
                end

            end

            # Declares recovery of an existing durable job.
            class Recovery

                attr_reader :state, :args

                def initialize(state:, args: nil)
                    @state = state
                    @args  = args&.dup&.freeze

                    raise ArgumentError, 'Recovered job state must be a Symbol' \
                        unless @state.is_a?(Symbol)
                    raise ArgumentError, 'Recovered job args must be a Hash' \
                        unless @args.nil? || @args.is_a?(Hash)

                    freeze
                end

            end

            class << self

                # Declares a new durable job request.
                def request(step, args: {}, replace: false)
                    Request.new(
                        step,
                        :args    => args,
                        :replace => replace
                    )
                end

                # Declares recovery of an existing durable job.
                def recover(state:, args: nil)
                    Recovery.new(:state => state, :args => args)
                end

            end

        end

    end

end
