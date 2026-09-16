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

        class JobScheduler

            # Executes external commands returned by workflow steps.
            class CmdExec

                def call(job, outcome)
                    command = outcome.command
                    job.command = command
                    if job.shutdown_requested?
                        command.cancel
                        return ExecResult.stopped
                    end

                    command.cancel if job.cancellation_requested? || job.cancel_flag.cancelled?

                    result = command.run
                    return ExecResult.stopped if job.shutdown_requested?
                    return ExecResult.ok(outcome.result) if result.success?

                    ExecResult.ok(Job.fail(result.error))
                rescue StandardError => e
                    return ExecResult.stopped if job.shutdown_requested?

                    ExecResult.ok(Job.fail(e.message))
                ensure
                    job.command = nil
                end

            end

        end

    end

end
