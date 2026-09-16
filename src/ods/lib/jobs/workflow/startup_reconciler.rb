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

        class JobWorkflow

            # Discovers persisted workflow operations during server startup.
            class StartupReconciler

                # Creates a reconciler for a workflow
                #
                # @param workflow [JobWorkflow] Workflow whose resources are reconciled
                def initialize(workflow)
                    @workflow = workflow
                end

                # Performs one discovery pass for persisted non-failed, non-stable jobs.
                #
                # Failed jobs are left untouched for explicit recovery; stable states
                # declare completed work and are never reconstructed even if malformed
                # data retains an active job context
                #
                def run
                    Log.info('JOB', "Starting #{@workflow.class.name} reconciliation")

                    rc = @workflow.pool.info

                    if OpenNebula.is_error?(rc)
                        Log.error(
                            'JOB',
                            "Could not load #{@workflow.pool.class}: #{rc.message}"
                        )
                        return rc
                    end

                    failure = nil
                    @workflow.pool.each do |resource|
                        result = reconcile_resource(resource)
                        failure ||= result if OpenNebula.is_error?(result)
                    rescue StandardError => e
                        Log.error(
                            'JOB',
                            "Could not reconcile #{resource_label(resource)}: #{e.message}",
                            resource.id
                        )
                        failure ||= OpenNebula::Error.new(
                            e.message, OpenNebula::Error::EACTION
                        )
                    end

                    failure || true
                end

                private

                # Queues an executable operation or marks a missing context as failed.
                #
                # @param resource [Object] Persistent resource to reconcile
                def reconcile_resource(resource)
                    if executable?(resource)
                        return @workflow.scheduler.wake(
                            :workflow => @workflow.id,
                            :owner_id => resource.id,
                            :operation_id => resource.active_job.id
                        )
                    end

                    return if resource.active_job
                    return if @workflow.class.stable_states.include?(resource.state)
                    return unless @workflow.class.failure_states.key?(resource.state)

                    message = 'Lifecycle job context was not recovered'
                    Log.error(
                        'JOB',
                        "#{resource_label(resource)} has no active job in " \
                        "#{resource.state}",
                        resource.id
                    )
                    @workflow.fail_orphan(resource, message)
                end

                # Checks whether a resource contains a runnable job context
                #
                # Catch-up excludes both failed and stable states: failed jobs require an
                # explicit recovery request, while stable states represent completed work
                #
                # @param resource [Object] Persistent resource to inspect
                # @return [Boolean] true when the resource can be reconstructed and executed
                def executable?(resource)
                    !resource.active_job.nil? &&
                        !@workflow.class.failure_states.value?(resource.state) &&
                        !@workflow.class.stable_states.include?(resource.state)
                end

                # Builds a human readable resource label for reconciliation logs
                #
                # @param resource [Object] Persistent resource to identify
                # @return [String] Resource type and identifier
                def resource_label(resource)
                    "#{resource.class::RESOURCE_NAME} #{resource.id}"
                end

            end

        end

    end

end
