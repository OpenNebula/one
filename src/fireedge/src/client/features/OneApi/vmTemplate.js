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
import { Actions, Commands } from 'server/utils/constants/commands/template'

import {
  oneApi,
  ONE_RESOURCES,
  ONE_RESOURCES_POOL,
} from 'client/features/OneApi'
import {
  updateResourceOnPool,
  removeResourceOnPool,
  updateNameOnResource,
  updateLockLevelOnResource,
  removeLockLevelOnResource,
  updatePermissionOnResource,
  updateOwnershipOnResource,
  updateTemplateOnResource,
} from 'client/features/OneApi/common'
import { LockLevel, FilterFlag, Permission, VmTemplate } from 'client/constants'

const { TEMPLATE } = ONE_RESOURCES
const { TEMPLATE_POOL } = ONE_RESOURCES_POOL

const vmTemplateApi = oneApi.injectEndpoints({
  endpoints: (builder) => ({
    getTemplates: builder.query({
      /**
       * Retrieves information for all or part of the Resources in the pool.
       *
       * @param {object} params - Request params
       * @param {FilterFlag} [params.filter] - Filter flag
       * @param {number} [params.start] - Range start ID
       * @param {number} [params.end] - Range end ID
       * @returns {VmTemplate[]} List of VM Templates
       * @throws Fails when response isn't code 200
       */
      query: (params) => {
        const name = Actions.TEMPLATE_POOL_INFO
        const command = { name, ...Commands[name] }

        return { params, command }
      },
      transformResponse: (data) =>
        [data?.VMTEMPLATE_POOL?.VMTEMPLATE ?? []].flat(),
      providesTags: (vmTemplates) =>
        vmTemplates
          ? [
              ...vmTemplates.map(({ ID }) => ({
                type: TEMPLATE_POOL,
                id: `${ID}`,
              })),
              TEMPLATE_POOL,
            ]
          : [TEMPLATE_POOL],
    }),
    getTemplate: builder.query({
      /**
       * Retrieves information for the vm template.
       *
       * @param {object} params - Request parameters
       * @param {string} params.id - Template id
       * @param {boolean} params.extended - True to include extended information
       * @param {boolean} [params.decrypt] - True to decrypt contained secrets (only admin)
       * @returns {VmTemplate} Get template identified by id
       * @throws Fails when response isn't code 200
       */
      query: (params) => {
        const name = Actions.TEMPLATE_INFO
        const command = { name, ...Commands[name] }

        return { params, command }
      },
      transformResponse: (data) => data?.VMTEMPLATE ?? {},
      providesTags: (_, __, { id }) => [{ type: TEMPLATE, id }],
      async onQueryStarted({ id }, { dispatch, queryFulfilled }) {
        try {
          const { data: resourceFromQuery } = await queryFulfilled

          dispatch(
            vmTemplateApi.util.updateQueryData(
              'getTemplates',
              undefined,
              updateResourceOnPool({ id, resourceFromQuery })
            )
          )
        } catch {
          // if the query fails, we want to remove the resource from the pool
          dispatch(
            vmTemplateApi.util.updateQueryData(
              'getTemplates',
              undefined,
              removeResourceOnPool({ id })
            )
          )
        }
      },
    }),
    allocateTemplate: builder.mutation({
      /**
       * Allocates a new VM Template in OpenNebula.
       *
       * @param {object} params - Request params
       * @param {string} params.template - A string containing the template on syntax XML
       * @returns {number} VM Template id
       * @throws Fails when response isn't code 200
       */
      query: (params) => {
        const name = Actions.TEMPLATE_ALLOCATE
        const command = { name, ...Commands[name] }

        return { params, command }
      },
    }),
    cloneTemplate: builder.mutation({
      /**
       * Clones an existing virtual machine template.
       *
       * @param {object} params - Request params
       * @param {number|string} params.id - The ID of the template to be cloned
       * @param {string} params.name - Name for the new template
       * @param {boolean} params.image
       * - `true` to clone the template plus any image defined in DISK.
       * The new IMAGE_ID is set into each DISK
       * @returns {number} Template id
       * @throws Fails when response isn't code 200
       */
      query: (params) => {
        const name = Actions.TEMPLATE_CLONE
        const command = { name, ...Commands[name] }

        return { params, command }
      },
      invalidatesTags: [TEMPLATE_POOL],
    }),
    removeTemplate: builder.mutation({
      /**
       * Deletes the given template from the pool.
       *
       * @param {object} params - Request params
       * @param {number|string} params.id - Template id
       * @param {boolean} params.image - `true` to delete the template plus any image defined in DISK
       * @returns {number} Template id
       * @throws Fails when response isn't code 200
       */
      query: (params) => {
        const name = Actions.TEMPLATE_DELETE
        const command = { name, ...Commands[name] }

        return { params, command }
      },
      invalidatesTags: [TEMPLATE_POOL],
    }),
    instantiateTemplate: builder.mutation({
      /**
       * Instantiates a new virtual machine from a template.
       *
       * @param {object} params - Request params
       * @param {number|string} params.id - Template id
       * @param {string} params.name - Name for the new VM instance
       * @param {boolean} params.hold - True to create it on hold state
       * @param {boolean} params.persistent - True to create a private persistent copy
       * @param {string} params.template - Extra template to be merged with the one being instantiated
       * @returns {number} Template id
       * @throws Fails when response isn't code 200
       */
      query: (params) => {
        const name = Actions.TEMPLATE_INSTANTIATE
        const command = { name, ...Commands[name] }

        return { params, command }
      },
    }),
    updateTemplate: builder.mutation({
      /**
       * Replaces the template contents.
       *
       * @param {object} params - Request params
       * @param {number|string} params.id - Template id
       * @param {string} params.template - The new template contents
       * @param {0|1} params.replace
       * - Update type:
       * ``0``: Replace the whole template.
       * ``1``: Merge new template with the existing one.
       * @returns {number} Template id
       * @throws Fails when response isn't code 200
       */
      query: (params) => {
        const name = Actions.TEMPLATE_UPDATE
        const command = { name, ...Commands[name] }

        return { params, command }
      },
      invalidatesTags: (_, __, { id }) => [{ type: TEMPLATE, id }],
      async onQueryStarted(params, { dispatch, queryFulfilled }) {
        try {
          const patchVmTemplate = dispatch(
            vmTemplateApi.util.updateQueryData(
              'getTemplate',
              { id: params.id },
              updateTemplateOnResource(params)
            )
          )

          const patchVmTemplates = dispatch(
            vmTemplateApi.util.updateQueryData(
              'getTemplates',
              undefined,
              updateTemplateOnResource(params)
            )
          )

          queryFulfilled.catch(() => {
            patchVmTemplate.undo()
            patchVmTemplates.undo()
          })
        } catch {}
      },
    }),
    changeTemplatePermissions: builder.mutation({
      /**
       * Changes the permission bits of a VM template.
       * If set any permission to -1, it's not changed.
       *
       * @param {object} params - Request parameters
       * @param {string} params.id - VM Template id
       * @param {Permission|'-1'} params.ownerUse - User use
       * @param {Permission|'-1'} params.ownerManage - User manage
       * @param {Permission|'-1'} params.ownerAdmin - User administrator
       * @param {Permission|'-1'} params.groupUse - Group use
       * @param {Permission|'-1'} params.groupManage - Group manage
       * @param {Permission|'-1'} params.groupAdmin - Group administrator
       * @param {Permission|'-1'} params.otherUse - Other use
       * @param {Permission|'-1'} params.otherManage - Other manage
       * @param {Permission|'-1'} params.otherAdmin - Other administrator
       * @param {boolean} [params.image] - `true` to chmod the template plus any image defined in DISK
       * @returns {number} VM Template id
       * @throws Fails when response isn't code 200
       */
      query: (params) => {
        const name = Actions.TEMPLATE_CHMOD
        const command = { name, ...Commands[name] }

        return { params, command }
      },
      invalidatesTags: (_, __, { id }) => [{ type: TEMPLATE, id }],
      async onQueryStarted(params, { dispatch, queryFulfilled }) {
        try {
          const patchVmTemplate = dispatch(
            vmTemplateApi.util.updateQueryData(
              'getTemplate',
              { id: params.id },
              updatePermissionOnResource(params)
            )
          )

          const patchVmTemplates = dispatch(
            vmTemplateApi.util.updateQueryData(
              'getTemplates',
              undefined,
              updatePermissionOnResource(params)
            )
          )

          queryFulfilled.catch(() => {
            patchVmTemplate.undo()
            patchVmTemplates.undo()
          })
        } catch {}
      },
    }),
    changeTemplateOwnership: builder.mutation({
      /**
       * Changes the ownership bits of a VM template.
       * If set to `-1`, the user or group aren't changed.
       *
       * @param {object} params - Request parameters
       * @param {string|number} params.id - VM Template id
       * @param {number} params.user - The user id
       * @param {number} params.group - The group id
       * @returns {number} VM Template id
       * @throws Fails when response isn't code 200
       */
      query: (params) => {
        const name = Actions.TEMPLATE_CHOWN
        const command = { name, ...Commands[name] }

        return { params, command }
      },
      invalidatesTags: (_, __, { id }) => [{ type: TEMPLATE, id }],
      async onQueryStarted(params, { getState, dispatch, queryFulfilled }) {
        try {
          const patchVmTemplate = dispatch(
            vmTemplateApi.util.updateQueryData(
              'getTemplate',
              { id: params.id },
              updateOwnershipOnResource(getState(), params)
            )
          )

          const patchVmTemplates = dispatch(
            vmTemplateApi.util.updateQueryData(
              'getTemplates',
              undefined,
              updateOwnershipOnResource(getState(), params)
            )
          )

          queryFulfilled.catch(() => {
            patchVmTemplate.undo()
            patchVmTemplates.undo()
          })
        } catch {}
      },
    }),
    renameTemplate: builder.mutation({
      /**
       * Renames a VM template.
       *
       * @param {object} params - Request parameters
       * @param {string|number} params.id - VM Template id
       * @param {string} params.name - The new name
       * @returns {number} VM Template id
       * @throws Fails when response isn't code 200
       */
      query: (params) => {
        const name = Actions.TEMPLATE_RENAME
        const command = { name, ...Commands[name] }

        return { params, command }
      },
      invalidatesTags: (_, __, { id }) => [{ type: TEMPLATE, id }],
      async onQueryStarted(params, { dispatch, queryFulfilled }) {
        try {
          const patchVmTemplate = dispatch(
            vmTemplateApi.util.updateQueryData(
              'getTemplate',
              { id: params.id },
              updateNameOnResource(params)
            )
          )

          const patchVmTemplates = dispatch(
            vmTemplateApi.util.updateQueryData(
              'getTemplates',
              undefined,
              updateNameOnResource(params)
            )
          )

          queryFulfilled.catch(() => {
            patchVmTemplate.undo()
            patchVmTemplates.undo()
          })
        } catch {}
      },
    }),
    lockTemplate: builder.mutation({
      /**
       * Locks a VM Template.
       *
       * @param {object} params - Request parameters
       * @param {string} params.id - VM Template id
       * @param {LockLevel} params.lock - Lock level
       * @param {boolean} params.test - Checks if the object is already locked to return an error
       * @returns {number} VM Template id
       * @throws Fails when response isn't code 200
       */
      query: (params) => {
        const name = Actions.TEMPLATE_LOCK
        const command = { name, ...Commands[name] }

        return { params, command }
      },
      invalidatesTags: (_, __, { id }) => [{ type: TEMPLATE, id }],
      async onQueryStarted(params, { dispatch, queryFulfilled }) {
        try {
          const patchVmTemplate = dispatch(
            vmTemplateApi.util.updateQueryData(
              'getTemplate',
              { id: params.id },
              updateLockLevelOnResource(params)
            )
          )

          const patchVmTemplates = dispatch(
            vmTemplateApi.util.updateQueryData(
              'getTemplates',
              undefined,
              updateLockLevelOnResource(params)
            )
          )

          queryFulfilled.catch(() => {
            patchVmTemplate.undo()
            patchVmTemplates.undo()
          })
        } catch {}
      },
    }),
    unlockTemplate: builder.mutation({
      /**
       * Unlocks a VM Template.
       *
       * @param {object} params - Request parameters
       * @param {string} params.id - VM Template id
       * @returns {number} VM Template id
       * @throws Fails when response isn't code 200
       */
      query: (params) => {
        const name = Actions.TEMPLATE_UNLOCK
        const command = { name, ...Commands[name] }

        return { params, command }
      },
      invalidatesTags: (_, __, { id }) => [{ type: TEMPLATE, id }],
      async onQueryStarted(params, { dispatch, queryFulfilled }) {
        try {
          const patchVmTemplate = dispatch(
            vmTemplateApi.util.updateQueryData(
              'getTemplate',
              { id: params.id },
              removeLockLevelOnResource(params)
            )
          )

          const patchVmTemplates = dispatch(
            vmTemplateApi.util.updateQueryData(
              'getTemplates',
              undefined,
              removeLockLevelOnResource(params)
            )
          )

          queryFulfilled.catch(() => {
            patchVmTemplate.undo()
            patchVmTemplates.undo()
          })
        } catch {}
      },
    }),
  }),
})

export const {
  // Queries
  useGetTemplatesQuery,
  useLazyGetTemplatesQuery,
  useGetTemplateQuery,
  useLazyGetTemplateQuery,

  // Mutations
  useAllocateTemplateMutation,
  useCloneTemplateMutation,
  useRemoveTemplateMutation,
  useInstantiateTemplateMutation,
  useUpdateTemplateMutation,
  useChangeTemplatePermissionsMutation,
  useChangeTemplateOwnershipMutation,
  useRenameTemplateMutation,
  useLockTemplateMutation,
  useUnlockTemplateMutation,
} = vmTemplateApi

export default vmTemplateApi
