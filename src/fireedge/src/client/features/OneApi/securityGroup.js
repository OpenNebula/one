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
import { Actions, Commands } from 'server/utils/constants/commands/secgroup'
import {
  oneApi,
  ONE_RESOURCES,
  ONE_RESOURCES_POOL,
} from 'client/features/OneApi'
import {
  removeResourceOnPool,
  updateResourceOnPool,
} from 'client/features/OneApi/common'
import { FilterFlag, Permission } from 'client/constants'

const { SECURITYGROUP } = ONE_RESOURCES
const { SECURITYGROUP_POOL } = ONE_RESOURCES_POOL

const securityGroupApi = oneApi.injectEndpoints({
  endpoints: (builder) => ({
    getSecGroups: builder.query({
      /**
       * Retrieves information for all or part of the security groups in the pool.
       *
       * @param {object} params - Request params
       * @param {FilterFlag} [params.filter] - Filter flag
       * @param {number} [params.start] - Range start ID
       * @param {number} [params.end] - Range end ID
       * @returns {Array} List of security groups
       * @throws Fails when response isn't code 200
       */
      query: (params) => {
        const name = Actions.SECGROUP_POOL_INFO
        const command = { name, ...Commands[name] }

        return { params, command }
      },
      transformResponse: (data) =>
        [data?.SECURITY_GROUP_POOL?.SECURITY_GROUP ?? []].flat(),
      providesTags: (secGroups) =>
        secGroups
          ? [
              ...secGroups.map(({ ID }) => ({
                type: SECURITYGROUP_POOL,
                id: `${ID}`,
              })),
              SECURITYGROUP_POOL,
            ]
          : [SECURITYGROUP_POOL],
    }),
    getSecGroup: builder.query({
      /**
       * Retrieves information for the security group.
       *
       * @param {object} params - Request params
       * @param {string|number} params.id - Security group id
       * @param {boolean} [params.decrypt] - Optional flag to decrypt contained secrets, valid only for admin
       * @returns {object} Get security group identified by id
       * @throws Fails when response isn't code 200
       */
      query: (params) => {
        const name = Actions.SECGROUP_INFO
        const command = { name, ...Commands[name] }

        return { params, command }
      },
      transformResponse: (data) => data?.SECURITY_GROUP ?? {},
      providesTags: (_, __, { id }) => [{ type: SECURITYGROUP, id }],
      async onQueryStarted({ id }, { dispatch, queryFulfilled }) {
        try {
          const { data: resourceFromQuery } = await queryFulfilled
          dispatch(
            securityGroupApi.util.updateQueryData(
              'getSecGroups',
              undefined,
              updateResourceOnPool({ id, resourceFromQuery })
            )
          )
        } catch {
          dispatch(
            securityGroupApi.util.updateQueryData(
              'getSecGroups',
              undefined,
              removeResourceOnPool({ id })
            )
          )
        }
      },
    }),
    renameSecGroup: builder.mutation({
      /**
       * Renames a Security Group.
       *
       * @param {object} params - Request parameters
       * @param {string} params.id - Security group id
       * @param {string} params.name - The new name
       * @returns {number} Security group id
       * @throws Fails when response isn't code 200
       */
      query: (params) => {
        const name = Actions.SECGROUP_RENAME
        const command = { name, ...Commands[name] }

        return { params, command }
      },
      invalidatesTags: (_, __, { id }) => [
        { type: SECURITYGROUP, id },
        SECURITYGROUP_POOL,
      ],
    }),
    changeSecGroupPermissions: builder.mutation({
      /**
       * Changes the permission bits of a Image.
       * If set any permission to -1, it's not changed.
       *
       * @param {object} params - Request parameters
       * @param {string|number} params.id - Image id
       * @param {Permission|'-1'} params.ownerUse - User use
       * @param {Permission|'-1'} params.ownerManage - User manage
       * @param {Permission|'-1'} params.ownerAdmin - User administrator
       * @param {Permission|'-1'} params.groupUse - Group use
       * @param {Permission|'-1'} params.groupManage - Group manage
       * @param {Permission|'-1'} params.groupAdmin - Group administrator
       * @param {Permission|'-1'} params.otherUse - Other use
       * @param {Permission|'-1'} params.otherManage - Other manage
       * @param {Permission|'-1'} params.otherAdmin - Other administrator
       * @returns {number} Image id
       * @throws Fails when response isn't code 200
       */
      query: (params) => {
        const name = Actions.SECGROUP_CHMOD
        const command = { name, ...Commands[name] }

        return { params, command }
      },
      invalidatesTags: (_, __, { id }) => [{ type: SECURITYGROUP, id }],
    }),
    changeSecGroupOwnership: builder.mutation({
      /**
       * Changes the ownership of Security Group.
       * If set `user` or `group` to -1, it's not changed.
       *
       * @param {object} params - Request parameters
       * @param {string|number} params.id - Security Group id
       * @param {string|number|'-1'} [params.userId] - User id
       * @param {Permission|'-1'} [params.groupId] - Group id
       * @returns {number} Security Group id
       * @throws Fails when response isn't code 200
       */
      query: (params) => {
        const name = Actions.SECGROUP_CHOWN
        const command = { name, ...Commands[name] }

        return { params, command }
      },
      invalidatesTags: (_, __, { id }) => [
        { type: SECURITYGROUP, id },
        SECURITYGROUP_POOL,
      ],
    }),
    allocateSecGroup: builder.mutation({
      /**
       * Allocates a new Security Group in OpenNebula.
       *
       * @param {object} params - Request params
       * @param {string} params.template - A string containing the template of the Security Group on syntax XML
       * @returns {number} Security Group id
       * @throws Fails when response isn't code 200
       */
      query: (params) => {
        const name = Actions.SECGROUP_ALLOCATE
        const command = { name, ...Commands[name] }

        return { params, command }
      },
      invalidatesTags: [SECURITYGROUP_POOL],
    }),
    cloneSegGroup: builder.mutation({
      /**
       * Clones an existing Security Group.
       *
       * @param {object} params - Request params
       * @param {string} params.id - The id of the Security Group to be cloned
       * @param {string} params.name - Name for the new Security Group
       * @returns {number} The new Security Group id
       * @throws Fails when response isn't code 200
       */
      query: (params) => {
        const name = Actions.SECGROUP_CLONE
        const command = { name, ...Commands[name] }

        return { params, command }
      },
      invalidatesTags: [SECURITYGROUP_POOL],
    }),
    removeSecGroup: builder.mutation({
      /**
       * Deletes the given Security Group from the pool.
       *
       * @param {object} params - Request params
       * @param {string} params.id - The object id
       * @returns {number} Security Group id
       * @throws Fails when response isn't code 200
       */
      query: (params) => {
        const name = Actions.SECGROUP_DELETE
        const command = { name, ...Commands[name] }

        return { params, command }
      },
      invalidatesTags: [SECURITYGROUP_POOL],
    }),
    updateSecGroup: builder.mutation({
      /**
       * Replaces the Security Group template contents.
       *
       * @param {number|string} params - Request params
       * @param {string} params.id - Security Group id
       * @param {string} params.template - The new template contents on syntax XML
       * @param {0|1} params.replace -
       * - Update type:
       * ``0``: Replace the whole template.
       * ``1``: Merge new template with the existing one.
       * @returns {number} Security Group id
       * @throws Fails when response isn't code 200
       */
      query: (params) => {
        const name = Actions.SECGROUP_UPDATE
        const command = { name, ...Commands[name] }

        return { params, command }
      },
      invalidatesTags: (_, __, { id }) => [
        { type: SECURITYGROUP, id },
        { type: SECURITYGROUP_POOL, id },
      ],
    }),
    commitSegGroup: builder.mutation({
      /**
       * Commit an existing Security Group.
       *
       * @param {object} params - Request params
       * @param {string} params.id - The id of the Security Group to be cloned
       * @param {string} params.vms - Vms for the new Security Group
       * @returns {number} The new Security Group id
       * @throws Fails when response isn't code 200
       */
      query: (params) => {
        const name = Actions.SECGROUP_COMMIT
        const command = { name, ...Commands[name] }

        return { params, command }
      },
      invalidatesTags: [SECURITYGROUP_POOL],
    }),
  }),
})

export const {
  // Queries
  useGetSecGroupQuery,
  useLazyGetSecGroupQuery,
  useGetSecGroupsQuery,
  useLazyGetSecGroupsQuery,
  useRenameSecGroupMutation,
  useAllocateSecGroupMutation,
  useCloneSegGroupMutation,
  useRemoveSecGroupMutation,
  useUpdateSecGroupMutation,
  useCommitSegGroupMutation,
  useChangeSecGroupPermissionsMutation,
  useChangeSecGroupOwnershipMutation,
} = securityGroupApi

export default securityGroupApi
