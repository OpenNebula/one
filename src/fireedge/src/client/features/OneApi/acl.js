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
import { Actions, Commands } from 'server/utils/constants/commands/acl'
import { oneApi, ONE_RESOURCES_POOL } from 'client/features/OneApi'
import { Acl } from 'client/constants'

const { ACL_POOL } = ONE_RESOURCES_POOL

const aclApi = oneApi.injectEndpoints({
  endpoints: (builder) => ({
    getAcls: builder.query({
      /**
       * Retrieves information for all the acls in the pool.
       *
       * @returns {Acl[]} Get list of acls
       * @throws Fails when response isn't code 200
       */
      query: () => {
        const name = Actions.ACL_INFO
        const command = { name, ...Commands[name] }

        return { command }
      },
      transformResponse: (data) => [data?.ACL_POOL?.ACL ?? []].flat(),
      providesTags: (groups) =>
        groups
          ? [
              ...groups.map(({ ID }) => ({ type: ACL_POOL, id: `${ID}` })),
              ACL_POOL,
            ]
          : [ACL_POOL],
    }),
    allocateAcl: builder.mutation({
      /**
       * Allocates a new acl in OpenNebula.
       *
       * @param {object} params - Request parameters
       * @param {string} params.user - User for the new acl
       * @param {string} params.resource - Resources for the new acl
       * @param {string} params.right - Rights for the new acl
       * @returns {number} The allocated Acl id
       * @throws Fails when response isn't code 200
       */
      query: (params) => {
        const name = Actions.ACL_ADDRULE
        const command = { name, ...Commands[name] }

        return { params, command }
      },
      invalidatesTags: [ACL_POOL],
    }),
    removeAcl: builder.mutation({
      /**
       * Deletes the given acl from the pool.
       *
       * @param {object} params - Request parameters
       * @param {string|number} params.id - Acl id
       * @returns {number} Acl id
       * @throws Fails when response isn't code 200
       */
      query: (params) => {
        const name = Actions.ACL_DELRULE
        const command = { name, ...Commands[name] }

        return { params, command }
      },
      invalidatesTags: [ACL_POOL],
    }),
  }),
})

export const {
  // Queries
  useGetAclQuery,

  // Mutations
  useAllocateAclMutation,
  useRemoveAclMutation,
} = aclApi

export default aclApi
