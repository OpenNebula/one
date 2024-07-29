/* ------------------------------------------------------------------------- *
 * Copyright 2002-2024, OpenNebula Project, OpenNebula Systems               *
 *                                                                           *
 * Licensed under the Apache License, Version 2.0 (the "License"); you may   *
 * not use this file except in compliance with the License. You may obtain   *
 * a copy of the License at                                                  *
 *                                                                           *
 * http://www.apache.org/licenses/LICENSE-2.0                                *
 *                                                                           *
 * Unless required by applicable law or agreed to in writing, software       *
 * distributed under the License is distributed on an "AS IS" BASIS,         *
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.  *
 * See the License for the specific language governing permissions and       *
 * limitations under the License.                                            *
 * ------------------------------------------------------------------------- */
import { Actions, Commands } from 'server/utils/constants/commands/backupjobs'

import { FilterFlag, Permission } from 'client/constants'
import {
  ONE_RESOURCES,
  ONE_RESOURCES_POOL,
  oneApi,
} from 'client/features/OneApi'
import {
  removeResourceOnPool,
  updateNameOnResource,
  updateResourceOnPool,
  updateTemplateOnResource,
} from 'client/features/OneApi/common'

const { BACKUPJOB } = ONE_RESOURCES
const { BACKUPJOB_POOL } = ONE_RESOURCES_POOL

const backupjobApi = oneApi.injectEndpoints({
  endpoints: (builder) => ({
    getBackupJobs: builder.query({
      /**
       * Retrieves information for all or part of the Resources in the pool.
       *
       * @param {object} params - Request params
       * @param {FilterFlag} [params.filter] - Filter flag
       * @param {number} [params.start] - Range start ID
       * @param {number} [params.end] - Range end ID
       * @returns {Array[Object]} List of Backup Jobs
       * @throws Fails when response isn't code 200
       */
      query: (params) => {
        const name = Actions.BACKUPJOB_POOL_INFO
        const command = { name, ...Commands[name] }

        return { params, command }
      },
      transformResponse: (data) =>
        [data?.BACKUPJOB_POOL?.BACKUPJOB ?? []].flat(),
      providesTags: (backupjobs) =>
        backupjobs
          ? [
              ...backupjobs.map(({ ID }) => ({
                type: BACKUPJOB_POOL,
                id: `${ID}`,
              })),
              BACKUPJOB_POOL,
            ]
          : [BACKUPJOB_POOL],
    }),
    getBackupJob: builder.query({
      /**
       * Retrieves information for the BackupJob.
       *
       * @param {object} params - Request parameters
       * @param {string} params.id - BackupJob id
       * @param {boolean} [params.decrypt] - True to decrypt contained secrets (only admin)
       * @returns {object} Get VDC identified by id
       * @throws Fails when response isn't code 200
       */
      query: (params) => {
        const name = Actions.BACKUPJOB_INFO
        const command = { name, ...Commands[name] }

        return { params, command }
      },
      transformResponse: (data) => data?.BACKUPJOB ?? {},
      providesTags: (_, __, { id }) => [{ type: BACKUPJOB, id }],
      async onQueryStarted({ id }, { dispatch, queryFulfilled }) {
        try {
          const { data: resourceFromQuery } = await queryFulfilled

          dispatch(
            backupjobApi.util.updateQueryData(
              'getBackupJobs',
              undefined,
              updateResourceOnPool({ id, resourceFromQuery })
            )
          )
        } catch {
          // if the query fails, we want to remove the resource from the pool
          dispatch(
            backupjobApi.util.updateQueryData(
              'getBackupJobs',
              undefined,
              removeResourceOnPool({ id })
            )
          )
        }
      },
    }),
    allocateBackupJob: builder.mutation({
      /**
       * Allocates a new backup job in OpenNebula.
       *
       * @param {object} params - Request params
       * @param {string} params.template - Template for the new backupjob
       * @returns {number} The allocated backup job id
       * @throws Fails when response isn't code 200
       */
      query: (params) => {
        const name = Actions.BACKUPJOB_ALLOCATE
        const command = { name, ...Commands[name] }

        return { params, command }
      },
      invalidatesTags: [BACKUPJOB_POOL],
    }),
    removeBackupJob: builder.mutation({
      /**
       * Deletes the given Backup Job from the pool.
       *
       * @param {object} params - Request params
       * @param {number|string} params.id - Backup Job id
       * @returns {number} Backup Job id
       * @throws Fails when response isn't code 200
       */
      query: (params) => {
        const name = Actions.BACKUPJOB_DELETE
        const command = { name, ...Commands[name] }

        return { params, command }
      },
      invalidatesTags: [BACKUPJOB_POOL],
    }),
    createBackupJob: builder.mutation({
      /**
       * Creates a new BackupJob in OpenNebula.
       *
       * @param {object} params - Request params
       * @param {string} params.template - Backup Job Template
       * @returns {number} BackupJob id
       * @throws Fails when response isn't code 200
       */
      query: (params) => {
        const name = Actions.BACKUPJOB_ALLOCATE
        const command = { name, ...Commands[name] }

        return { params, command }
      },
    }),
    updateBackupJob: builder.mutation({
      /**
       * Replaces the template contents.
       *
       * @param {object} params - Request params
       * @param {number|string} params.id - Backup Job id
       * @param {string} params.template - The new template contents
       * @param {0|1} params.replace
       * - Update type:
       * ``0``: Replace the whole template.
       * ``1``: Merge new template with the existing one.
       * @returns {number} Backup Job id
       * @throws Fails when response isn't code 200
       */
      query: (params) => {
        const name = Actions.BACKUPJOB_UPDATE
        const command = { name, ...Commands[name] }

        return { params, command }
      },
      invalidatesTags: (_, __, { id }) => [{ type: BACKUPJOB, id }],
      async onQueryStarted(params, { dispatch, queryFulfilled }) {
        try {
          const patchBackupJob = dispatch(
            backupjobApi.util.updateQueryData(
              'getBackupJob',
              { id: params.id },
              updateTemplateOnResource(params)
            )
          )

          const patchBackupJobs = dispatch(
            backupjobApi.util.updateQueryData(
              'getBackupJobs',
              undefined,
              updateTemplateOnResource(params)
            )
          )

          queryFulfilled.catch(() => {
            patchBackupJob.undo()
            patchBackupJobs.undo()
          })
        } catch {}
      },
    }),
    renameBackupJob: builder.mutation({
      /**
       * Renames a Backup Job.
       *
       * @param {object} params - Request parameters
       * @param {string|number} params.id - Backup Job id
       * @param {string} params.name - The new name
       * @returns {number} Backup Job id
       * @throws Fails when response isn't code 200
       */
      query: (params) => {
        const name = Actions.BACKUPJOB_RENAME
        const command = { name, ...Commands[name] }

        return { params, command }
      },
      invalidatesTags: (_, __, { id }) => [{ type: BACKUPJOB, id }],
      async onQueryStarted(params, { dispatch, queryFulfilled }) {
        try {
          const patchBackupJob = dispatch(
            backupjobApi.util.updateQueryData(
              'getBackupJob',
              { id: params.id },
              updateNameOnResource(params)
            )
          )

          const patchBackupJobs = dispatch(
            backupjobApi.util.updateQueryData(
              'getBackupJobs',
              undefined,
              updateNameOnResource(params)
            )
          )

          queryFulfilled.catch(() => {
            patchBackupJob.undo()
            patchBackupJobs.undo()
          })
        } catch {}
      },
    }),
    changeBackupJobOwnership: builder.mutation({
      /**
       * Changes the ownership of a Backup Job.
       * If set `user` or `group` to -1, it's not changed.
       *
       * @param {object} params - Request parameters
       * @param {string|number} params.id - Backup Job id
       * @param {string|number|'-1'} [params.userId] - User id
       * @param {Permission|'-1'} [params.groupId] - Group id
       * @returns {number} Backup Job id
       * @throws Fails when response isn't code 200
       */
      query: (params) => {
        const name = Actions.BACKUPJOB_CHOWN
        const command = { name, ...Commands[name] }

        return { params, command }
      },
      invalidatesTags: (_, __, { id }) => [
        { type: BACKUPJOB, id },
        BACKUPJOB_POOL,
      ],
    }),
    lockBackupJob: builder.mutation({
      /**
       * Locks an backup job. Lock certain actions depending on blocking level.
       * - `USE` (1): locks Admin, Manage and Use actions.
       * - `MANAGE` (2): locks Manage and Use actions.
       * - `ADMIN` (3): locks only Admin actions.
       * - `ALL` (4): locks all actions.
       *
       * @param {object} params - Request parameters
       * @param {string|number} params.id - Backup job id
       * @param {'1'|'2'|'3'|'4'} params.lock - Lock level
       * @returns {number} Backup job id
       * @throws Fails when response isn't code 200
       */
      query: (params) => {
        const name = Actions.BACKUPJOB_LOCK
        const command = { name, ...Commands[name] }

        return { params, command }
      },
      invalidatesTags: (_, __, { id }) => [
        { type: BACKUPJOB, id },
        BACKUPJOB_POOL,
      ],
    }),
    unlockBackupJob: builder.mutation({
      /**
       * Unlocks an Backupjob.
       *
       * @param {object} params - Request parameters
       * @param {string|number} params.id - Backup job id
       * @returns {number} Backup job id
       * @throws Fails when response isn't code 200
       */
      query: (params) => {
        const name = Actions.BACKUPJOB_UNLOCK
        const command = { name, ...Commands[name] }

        return { params, command }
      },
      invalidatesTags: (_, __, { id }) => [
        { type: BACKUPJOB, id },
        BACKUPJOB_POOL,
      ],
    }),
    startBackupJob: builder.mutation({
      /**
       * Start an Backupjob.
       *
       * @param {object} params - Request parameters
       * @param {string|number} params.id - Backup job id
       * @returns {number} Backup job id
       * @throws Fails when response isn't code 200
       */
      query: (params) => {
        const name = Actions.BACKUPJOB_BACKUP
        const command = { name, ...Commands[name] }

        return { params, command }
      },
      invalidatesTags: (_, __, { id }) => [{ type: BACKUPJOB, id }],
    }),
    cancelBackupJob: builder.mutation({
      /**
       * Cancel an Backupjob.
       *
       * @param {object} params - Request parameters
       * @param {string|number} params.id - Backup job id
       * @returns {number} Backup job id
       * @throws Fails when response isn't code 200
       */
      query: (params) => {
        const name = Actions.BACKUPJOB_CANCEL
        const command = { name, ...Commands[name] }

        return { params, command }
      },
      invalidatesTags: (_, __, { id }) => [{ type: BACKUPJOB, id }],
    }),
    retryBackupJob: builder.mutation({
      /**
       * Retry an Backupjob.
       *
       * @param {object} params - Request parameters
       * @param {string|number} params.id - Backup job id
       * @returns {number} Backup job id
       * @throws Fails when response isn't code 200
       */
      query: (params) => {
        const name = Actions.BACKUPJOB_RETRY
        const command = { name, ...Commands[name] }

        return { params, command }
      },
      invalidatesTags: (_, __, { id }) => [{ type: BACKUPJOB, id }],
    }),
    changeBackupJobPermissions: builder.mutation({
      /**
       * Changes the permission bits of a Backup Job.
       * If set any permission to -1, it's not changed.
       *
       * @param {object} params - Request parameters
       * @param {string|number} params.id - Backup Job id
       * @param {Permission|'-1'} params.ownerUse - User use
       * @param {Permission|'-1'} params.ownerManage - User manage
       * @param {Permission|'-1'} params.ownerAdmin - User administrator
       * @param {Permission|'-1'} params.groupUse - Group use
       * @param {Permission|'-1'} params.groupManage - Group manage
       * @param {Permission|'-1'} params.groupAdmin - Group administrator
       * @param {Permission|'-1'} params.otherUse - Other use
       * @param {Permission|'-1'} params.otherManage - Other manage
       * @param {Permission|'-1'} params.otherAdmin - Other administrator
       * @returns {number} Backup Job id
       * @throws Fails when response isn't code 200
       */
      query: (params) => {
        const name = Actions.BACKUPJOB_CHMOD
        const command = { name, ...Commands[name] }

        return { params, command }
      },
      invalidatesTags: (_, __, { id }) => [{ type: BACKUPJOB, id }],
    }),
    addScheduledActionBackupJob: builder.mutation({
      /**
       * Add scheduled action to Backup Job.
       *
       * @param {object} params - Request parameters
       * @param {string|number} params.id - BackupJob id
       * @param {string} params.template - Template containing the new scheduled action
       * @returns {number} Backup Job id
       * @throws Fails when response isn't code 200
       */
      query: (params) => {
        const name = Actions.BACKUPJOB_SCHED_ADD
        const command = { name, ...Commands[name] }

        return { params, command }
      },
      invalidatesTags: (_, __, { id }) => [{ type: BACKUPJOB, id }],
    }),
    updateScheduledActionBackupJob: builder.mutation({
      /**
       * Update scheduled action to Backup Job.
       *
       * @param {object} params - Request parameters
       * @param {string|number} params.id - Backup Job id
       * @param {string} params.schedId - The ID of the scheduled action
       * @param {string} params.template - Template containing the updated scheduled action
       * @returns {number} Backup Job id
       * @throws Fails when response isn't code 200
       */
      query: (params) => {
        const name = Actions.BACKUPJOB_SCHED_UPDATE
        const command = { name, ...Commands[name] }

        return { params, command }
      },
      invalidatesTags: (_, __, { id }) => [{ type: BACKUPJOB, id }],
    }),
    deleteScheduledActionBackupJob: builder.mutation({
      /**
       * Delete scheduled action to Backup Job.
       *
       * @param {object} params - Request parameters
       * @param {string|number} params.id - Backup Job id
       * @param {string} params.schedId - The ID of the scheduled action
       * @returns {number} Backup Job id
       * @throws Fails when response isn't code 200
       */
      query: (params) => {
        const name = Actions.BACKUPJOB_SCHED_DELETE
        const command = { name, ...Commands[name] }

        return { params, command }
      },
      invalidatesTags: (_, __, { id }) => [{ type: BACKUPJOB, id }],
    }),
    updatePriorityBackupJob: builder.mutation({
      /**
       * Update Priority to Backup Job.
       *
       * @param {object} params - Request parameters
       * @param {string|number} params.id - Backup Job id
       * @param {number} params.priority - priority number
       * @returns {number} Backup Job id
       * @throws Fails when response isn't code 200
       */
      query: (params) => {
        const name = Actions.BACKUPJOB_PRIORITY
        const command = { name, ...Commands[name] }

        return { params, command }
      },
      invalidatesTags: (_, __, { id }) => [{ type: BACKUPJOB, id }],
    }),
  }),
})

export const {
  // Queries
  useGetBackupJobsQuery,
  useLazyGetBackupJobsQuery,
  useGetBackupJobQuery,
  useLazyGetBackupJobQuery,

  // Mutations
  useAllocateBackupJobMutation,
  useUpdatePriorityBackupJobMutation,
  useRemoveBackupJobMutation,
  useCreateBackupJobMutation,
  useUpdateBackupJobMutation,
  useRenameBackupJobMutation,
  useChangeBackupJobOwnershipMutation,
  useLockBackupJobMutation,
  useUnlockBackupJobMutation,
  useStartBackupJobMutation,
  useCancelBackupJobMutation,
  useRetryBackupJobMutation,
  useChangeBackupJobPermissionsMutation,
  useAddScheduledActionBackupJobMutation,
  useUpdateScheduledActionBackupJobMutation,
  useDeleteScheduledActionBackupJobMutation,
} = backupjobApi

export default backupjobApi
