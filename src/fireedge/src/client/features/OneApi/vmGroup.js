/* ------------------------------------------------------------------------- *
 * Copyright 2002-2023, OpenNebula Project, OpenNebula Systems               *
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
import { Actions, Commands } from 'server/utils/constants/commands/vmgroup'
import {
  oneApi,
  ONE_RESOURCES,
  ONE_RESOURCES_POOL,
} from 'client/features/OneApi'
import { FilterFlag } from 'client/constants'
import {
  updateNameOnResource,
  updateOwnershipOnResource,
  updatePermissionOnResource,
  updateTemplateOnResource,
} from 'client/features/OneApi/common'

const { VMGROUP } = ONE_RESOURCES
const { VMGROUP_POOL } = ONE_RESOURCES_POOL

const vmGroupApi = oneApi.injectEndpoints({
  endpoints: (builder) => ({
    getVMGroups: builder.query({
      /**
       * Retrieves information for all or part of the VM groups in the pool.
       *
       * @param {object} params - Request params
       * @param {FilterFlag} [params.filter] - Filter flag
       * @param {number} [params.start] - Range start ID
       * @param {number} [params.end] - Range end ID
       * @returns {Array} List of VM groups
       * @throws Fails when response isn't code 200
       */
      query: (params) => {
        const name = Actions.VM_GROUP_POOL_INFO
        const command = { name, ...Commands[name] }

        return { params, command }
      },
      transformResponse: (data) => [data?.VM_GROUP_POOL?.VM_GROUP ?? []].flat(),
      providesTags: (vmGroups) =>
        vmGroups
          ? [
              ...vmGroups.map(({ ID }) => ({ type: VMGROUP_POOL, ID })),
              VMGROUP_POOL,
            ]
          : [VMGROUP_POOL],
    }),
    getVMGroup: builder.query({
      /**
       * Retrieves information for the VM group.
       *
       * @param {object} params - Request params
       * @param {string|number} params.id - VM group id
       * @param {boolean} [params.decrypt] - Optional flag to decrypt contained secrets, valid only for admin
       * @returns {object} Get VM group identified by id
       * @throws Fails when response isn't code 200
       */
      query: (params) => {
        const name = Actions.VM_GROUP_INFO
        const command = { name, ...Commands[name] }

        return { params, command }
      },
      transformResponse: (data) => data?.VM_GROUP ?? {},
      providesTags: (_, __, arg) => [{ type: VMGROUP, id: arg.id }],
    }),
    /**
     * Adds a role to a already defined vm group.
     *
     * @param {string|number} id - VM group id
     * @param {string} template - VM group role template
     * @returns {number} VM group id
     * @throws Fails when response isn't code 200
     */
    addVMGroupRole: builder.mutation({
      query: (params) => {
        const name = Actions.VM_GROUP_ROLEADD
        const command = { name, ...Commands[name] }

        return { params, command }
      },
      invalidatesTags: (_, __, { id }) => [{ type: VMGROUP, id }],
    }),
    /**
     * Updates a already defined role in an existing vm group.
     *
     * @param {string|number} id - VM group id
     * @param {string|number} roleId - Update role id
     * @param {string} template - Updated role template
     * @returns {number} VM role ID
     */
    updateVMGroupRole: builder.mutation({
      query: (params) => {
        const name = Actions.VM_GROUP_ROLEUPDATE
        const command = { name, ...Commands[name] }

        return { params, command }
      },
      invalidatesTags: (_, __, { id }) => [{ type: VMGROUP, id }],
    }),
    /**
     * Deletes a role from a vm group.
     *
     * @param {string|number} id - Vm group id
     * @param {string|number} roleId - Delete role id
     * @returns {number} Deleted role id
     */
    deleteVMGroupRole: builder.mutation({
      query: (params) => {
        const name = Actions.VM_GROUP_ROLEDELETE
        const command = { name, ...Commands[name] }

        return { params, command }
      },
      invalidatesTags: (_, __, { id }) => [{ type: VMGROUP, id }],
    }),
    lockVMGroup: builder.mutation({
      /**
       * Locks a VM group.
       *
       * @param {string|number} id - VM group id
       * @returns {number} VM group id
       * @throws Fails when response isn't code 200
       */
      query: (id) => {
        const name = Actions.VM_GROUP_LOCK
        const command = { name, ...Commands[name] }

        return { params: { id }, command }
      },
      invalidatesTags: (_, __, id) => [{ type: VMGROUP, id }, VMGROUP_POOL],
    }),
    unlockVMGroup: builder.mutation({
      /**
       * Unlocks a VM group.
       *
       * @param {string|number} id - VM group id
       * @returns {number} VM group id
       * @throws Fails when response isn't code 200
       */
      query: (id) => {
        const name = Actions.VM_GROUP_UNLOCK
        const command = { name, ...Commands[name] }

        return { params: { id }, command }
      },
      invalidatesTags: (_, __, id) => [{ type: VMGROUP, id }, VMGROUP_POOL],
    }),
    renameVMGroup: builder.mutation({
      /**
       * Renames a VM group.
       *
       * @param {object} params - Request parameters
       * @param {string|number} params.id - VM group id
       * @param {string} params.name - The new name
       * @returns {number} VM group id
       * @throws Fails when response isn't code 200
       */
      query: (params) => {
        const name = Actions.VM_GROUP_RENAME
        const command = { name, ...Commands[name] }

        return { params, command }
      },
      invalidatesTags: (_, __, { id }) => [{ type: VMGROUP, id }, VMGROUP_POOL],
      async onQueryStarted(params, { dispatch, queryFulfilled }) {
        try {
          const patchVMGroup = dispatch(
            vmGroupApi.util.updateQueryData(
              'getVMGroup',
              { id: params.id },
              updateNameOnResource(params)
            )
          )

          const patchVMGroups = dispatch(
            vmGroupApi.util.updateQueryData(
              'getVMGroups',
              undefined,
              updateNameOnResource(params)
            )
          )

          queryFulfilled.catch(() => {
            patchVMGroup.undo()
            patchVMGroups.undo()
          })
        } catch {}
      },
    }),
    changeVMGroupOwnership: builder.mutation({
      /**
       * Changes the ownership of a VM group.
       * If set to `-1`, the user or group aren't changed.
       *
       * @param {object} params - Request parameters
       * @param {string|number} params.id - VM group id
       * @param {string|number|'-1'} [params.userId] - User id
       * @param {string|number|'-1'} [params.groupId] - Group id
       * @returns {number} VM group id
       * @throws Fails when response isn't code 200
       */
      query: (params) => {
        const name = Actions.VM_GROUP_CHOWN
        const command = { name, ...Commands[name] }

        return { params, command }
      },
      invalidatesTags: (_, __, id) => [{ type: VMGROUP, id }],
      async onQueryStarted(params, { getState, dispatch, queryFulfilled }) {
        try {
          const patchVMGroup = dispatch(
            vmGroupApi.util.updateQueryData(
              'getVMGroup',
              { id: params.id },
              updateOwnershipOnResource(getState(), params)
            )
          )

          const patchVMGroups = dispatch(
            vmGroupApi.util.updateQueryData(
              'getVMGroups',
              undefined,
              updateOwnershipOnResource(getState(), params)
            )
          )

          queryFulfilled.catch(() => {
            patchVMGroup.undo()
            patchVMGroups.undo()
          })
        } catch {}
      },
    }),
    changeVMGroupPermissions: builder.mutation({
      /**
       * Changes the permission bits of a VM group.
       * Any permisisons set to -1 will not be changed.
       *
       * @param {object} params - Request parameters
       * @param {string} params.id - Virtual machine id
       * @param {string|number|'-1'} params.ownerUse - User use
       * @param {string|number|'-1'} params.ownerManage - User manage
       * @param {string|number|'-1'} params.ownerAdmin - User administrator
       * @param {string|number|'-1'} params.groupUse - Group use
       * @param {string|number|'-1'} params.groupManage - Group manage
       * @param {string|number|'-1'} params.groupAdmin - Group administrator
       * @param {string|number|'-1'} params.otherUse - Other use
       * @param {string|number|'-1'} params.otherManage - Other manage
       * @param {string|number|'-1'} params.otherAdmin - Other administrator
       * @returns {number} Virtual machine id
       * @throws Fails when response isn't code 200 when response isn't code 200
       */
      query: (params) => {
        const name = Actions.VM_GROUP_CHMOD
        const command = { name, ...Commands[name] }

        return { params, command }
      },
      invalidatesTags: (_, __, { id }) => [{ type: VMGROUP, id }],
      async onQueryStarted(params, { dispatch, queryFulfilled }) {
        try {
          const patchVMGroup = dispatch(
            vmGroupApi.util.updateQueryData(
              'getVMGroup',
              { id: params.id },
              updatePermissionOnResource(params)
            )
          )

          const patchVMGroups = dispatch(
            vmGroupApi.util.updateQueryData(
              'getVMGroups',
              undefined,
              updatePermissionOnResource(params)
            )
          )

          queryFulfilled.catch(() => {
            patchVMGroup.undo()
            patchVMGroups.undo()
          })
        } catch {}
      },
    }),
    updateVMGroup: builder.mutation({
      /**
       * Replaces the VMGroup template contents.
       * If set to `-1`, the user or group aren't changed.
       *
       * @param {object} params - Request params
       * @param {number|string} params.id - Template id
       * @param {string} params.template - The new template contents
       * @param {0|1} params.replace
       * - Update type:
       * ``0``: Replace the whole template.
       * ``1``: Merge new template with the existing one.
       * @returns {number} VM group id
       * @throws Fails when response isn't code 200
       */
      query: (params) => {
        const name = Actions.VM_GROUP_UPDATE
        const command = { name, ...Commands[name] }

        return { params, command }
      },
      invalidatesTags: (_, __, { id }) => [{ type: VMGROUP, id }],
      async onQueryStarted(params, { dispatch, queryFulfilled }) {
        try {
          const patchVMGroup = dispatch(
            vmGroupApi.util.updateQueryData(
              'getVMGroup',
              { id: params.id },
              updateTemplateOnResource(params)
            )
          )

          const patchVMGroups = dispatch(
            vmGroupApi.util.updateQueryData(
              'getVMGroups',
              undefined,
              updateTemplateOnResource(params)
            )
          )

          queryFulfilled.catch(() => {
            patchVMGroup.undo()
            patchVMGroups.undo()
          })
        } catch {}
      },
    }),
    removeVMGroup: builder.mutation({
      /**
       * Deletes the VMGroup from the pool.
       *
       * @param {object} params - Request params
       * @param {number|string} params.id - VMGroup id
       * @returns {number} VM group id
       * @throws Fails when response isn't code 200
       */
      query: (params) => {
        const name = Actions.VM_GROUP_DELETE
        const command = { name, ...Commands[name] }

        return { params, command }
      },
      invalidatesTags: (_, __, id) => [{ type: VMGROUP, id }, VMGROUP_POOL],
    }),

    allocateVMGroup: builder.mutation({
      /**
       * Allocates a new VMGroup in OpenNebula.
       *
       * @param {object} params - Request params
       * @param {string} params.template - A string containing the template on syntax XML
       * @returns {number} VM group id
       * @throws Fails when response isn't code 200
       */
      query: (params) => {
        const name = Actions.VM_GROUP_ALLOCATE
        const command = { name, ...Commands[name] }

        return { params, command }
      },
    }),
  }),
})
export const {
  // Queries
  useGetVMGroupsQuery,
  useLazyGetVMGroupsQuery,
  useGetVMGroupQuery,
  useLazyGetVMGroupQuery,
  // Mutations
  useAllocateVMGroupMutation,
  useRemoveVMGroupMutation,
  useUpdateVMGroupMutation,
  useChangeVMGroupOwnershipMutation,
  useChangeVMGroupPermissionsMutation,
  useRenameVMGroupMutation,
  useLockVMGroupMutation,
  useUnlockVMGroupMutation,
  useAddVMGroupRoleMutation,
  useDeleteVMGroupRoleMutation,
  useUpdateVMGroupRoleMutation,
} = vmGroupApi
