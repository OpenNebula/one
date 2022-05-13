/* ------------------------------------------------------------------------- *
 * Copyright 2002-2022, OpenNebula Project, OpenNebula Systems               *
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
import { Actions, Commands } from 'server/utils/constants/commands/group'
import {
  oneApi,
  ONE_RESOURCES,
  ONE_RESOURCES_POOL,
} from 'client/features/OneApi'
import { Group } from 'client/constants'

const { GROUP } = ONE_RESOURCES
const { GROUP_POOL } = ONE_RESOURCES_POOL

const groupApi = oneApi.injectEndpoints({
  endpoints: (builder) => ({
    getGroups: builder.query({
      /**
       * Retrieves information for all the groups in the pool.
       *
       * @returns {Group[]} Get list of groups
       * @throws Fails when response isn't code 200
       */
      query: () => {
        const name = Actions.GROUP_POOL_INFO
        const command = { name, ...Commands[name] }

        return { command }
      },
      transformResponse: (data) => [data?.GROUP_POOL?.GROUP ?? []].flat(),
      providesTags: (groups) =>
        groups
          ? [
              ...groups.map(({ ID }) => ({ type: GROUP_POOL, id: `${ID}` })),
              GROUP_POOL,
            ]
          : [GROUP_POOL],
    }),
    getGroup: builder.query({
      /**
       * Retrieves information for the group.
       *
       * @param {object} params - Request parameters
       * @param {string} params.id - Group id
       * @returns {Group} Get group identified by id
       * @throws Fails when response isn't code 200
       */
      query: ({ id }) => {
        const name = Actions.GROUP_INFO
        const command = { name, ...Commands[name] }

        return { params: { id }, command }
      },
      transformResponse: (data) => data?.GROUP ?? {},
      invalidatesTags: (_, __, { id }) => [{ type: GROUP, id }],
    }),
    allocateGroup: builder.mutation({
      /**
       * Allocates a new group in OpenNebula.
       *
       * @param {object} params - Request parameters
       * @param {string} params.name - Name for the new group
       * @returns {number} The allocated Group id
       * @throws Fails when response isn't code 200
       */
      query: (params) => {
        const name = Actions.GROUP_ALLOCATE
        const command = { name, ...Commands[name] }

        return { params, command }
      },
      invalidatesTags: [GROUP_POOL],
    }),
    updateGroup: builder.mutation({
      /**
       * Replaces the group template contents.
       *
       * @param {object} params - Request parameters
       * @param {string|number} params.id - Group id
       * @param {string} params.template - The new template contents on syntax XML
       * @param {0|1} params.replace
       * - Update type:
       * ``0``: Replace the whole template.
       * ``1``: Merge new template with the existing one.
       * @returns {number} Group id
       * @throws Fails when response isn't code 200
       */
      query: (params) => {
        const name = Actions.GROUP_UPDATE
        const command = { name, ...Commands[name] }

        return { params, command }
      },
      invalidatesTags: (_, __, { id }) => [{ type: GROUP, id }],
    }),
    removeGroup: builder.mutation({
      /**
       * Deletes the given group from the pool.
       *
       * @param {object} params - Request parameters
       * @param {string|number} params.id - Group id
       * @returns {number} Group id
       * @throws Fails when response isn't code 200
       */
      query: (params) => {
        const name = Actions.GROUP_DELETE
        const command = { name, ...Commands[name] }

        return { params, command }
      },
      invalidatesTags: [GROUP_POOL],
    }),
    addAdminToGroup: builder.mutation({
      /**
       * Adds a User to the Group administrators set.
       *
       * @param {object} params - Request parameters
       * @param {string|number} params.id - Group id
       * @param {string|number} params.user - User id
       * @returns {number} Group id
       * @throws Fails when response isn't code 200
       */
      query: (params) => {
        const name = Actions.GROUP_ADDADMIN
        const command = { name, ...Commands[name] }

        return { params, command }
      },
      invalidatesTags: (_, __, { id }) => [{ type: GROUP, id }],
    }),
    removeAdminFromGroup: builder.mutation({
      /**
       * Removes a User from the Group administrators set.
       *
       * @param {object} params - Request parameters
       * @param {string|number} params.id - Group id
       * @param {string|number} params.user - User id
       * @returns {number} Group id
       * @throws Fails when response isn't code 200
       */
      query: (params) => {
        const name = Actions.GROUP_DELADMIN
        const command = { name, ...Commands[name] }

        return { params, command }
      },
      invalidatesTags: (_, __, { id }) => [{ type: GROUP, id }],
    }),
    getGroupQuota: builder.query({
      /**
       * Returns the default group quota limits.
       *
       * @returns {string} The quota template contents
       * @throws Fails when response isn't code 200
       */
      query: () => {
        const name = Actions.GROUP_POOL_INFO
        const command = { name, ...Commands[name] }

        return { command }
      },
    }),
    updateGroupQuota: builder.mutation({
      /**
       * Sets the group quota limits.
       *
       * @param {object} params - Request parameters
       * @param {string|number} params.id - Group id
       * @param {string|number} params.template - The new quota template contents on syntax XML
       * @returns {string} The quota template contents
       * @throws Fails when response isn't code 200
       */
      query: (params) => {
        const name = Actions.GROUP_QUOTA
        const command = { name, ...Commands[name] }

        return { params, command }
      },
      invalidatesTags: (_, __, { id }) => [{ type: GROUP, id }],
    }),
    updateDefaultGroupQuota: builder.mutation({
      /**
       * Updates the default group quota limits.
       *
       * @param {object} params - Request parameters
       * @param {string|number} params.template - The new quota template contents on syntax XML
       * @returns {string} The quota template contents
       * @throws Fails when response isn't code 200
       */
      query: (params) => {
        const name = Actions.GROUP_QUOTA_UPDATE
        const command = { name, ...Commands[name] }

        return { params, command }
      },
    }),
  }),
})

export const {
  // Queries
  useGetGroupQuery,
  useLazyGetGroupQuery,
  useGetGroupsQuery,
  useLazyGetGroupsQuery,
  useGetGroupQuotaQuery,
  useLazyGetGroupQuotaQuery,

  // Mutations
  useAllocateGroupMutation,
  useUpdateGroupMutation,
  useRemoveGroupMutation,
  useAddAdminToGroupMutation,
  useRemoveAdminFromGroupMutation,
  useUpdateGroupQuotaMutation,
  useUpdateDefaultGroupQuotaMutation,
} = groupApi

export default groupApi
