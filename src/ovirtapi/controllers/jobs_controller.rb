# -------------------------------------------------------------------------- #
# Copyright 2002-2025, OpenNebula Project, OpenNebula Systems                #
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

require 'json'
require 'opennebula'
require 'securerandom'
require 'pstore'

# JobsController manages job creation, retrieval, and cleanup
class JobsController

    @db = nil

    def self.start
        db_path = File.join(TMP_IMAGES_PATH, 'jobs.pstore')
        @db = PStore.new(db_path, true)
        LOGGER.info "Jobs db initialized at: #{db_path}"
    end

    def self.jobs
        @db.transaction(true) do
            @db.fetch(:jobs, [])
        end
    end

    def self.get_job(id)
        job = jobs.find {|j| j['id'] == id }
        clean_old_jobs
        return job
    end

    # Add a new job to the list
    # @param status [String] job status (finished or failed)
    # @return [Hash] the newly created job
    def self.add_job(status)
        current_time = (Time.now.to_f * 1000).to_i
        job_id = SecureRandom.uuid

        job = {
            'auto_cleared' => 'true',
            'external' => 'false',
            'end_time' => current_time,
            'last_updated' => current_time,
            'start_time' => current_time,
            'status' => status,
            'href' => "/ovirt-engine/api/jobs/#{job_id}",
            'id' => job_id
        }

        @db.transaction do
            jobs = @db.fetch(:jobs, [])
            jobs << job
            @db[:jobs] = jobs
        end

        clean_old_jobs
        job
    end

    # Clean jobs older than 30 minutes
    # @return [Array<Hash>] list of jobs that were removed
    def self.clean_old_jobs
        thirty_minutes_ago = (Time.now.to_f * 1000 - 30 * 60 * 1000).to_i

        @db.transaction do
            jobs = @db.fetch(:jobs, [])
            jobs.reject! {|j| j['start_time'] < thirty_minutes_ago }
            @db[:jobs] = jobs
        end

        LOGGER.info('Old jobs (+30min) removed from memory.')
    end

end
