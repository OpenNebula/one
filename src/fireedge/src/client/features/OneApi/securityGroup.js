/* ------------------------------------------------------------------------- *
 * Copyright 2002-2021, OpenNebula Project, OpenNebula Systems               *
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
import { oneApi, ONE_RESOURCES } from 'client/features/OneApi'
import { FilterFlag } from 'client/constants'

const { SECURITYGROUP } = ONE_RESOURCES

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
      providesTags: [SECURITYGROUP],
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
    }),
  }),
})

export const {
  // Queries
  useGetSecGroupQuery,
  useLazyGetSecGroupQuery,
  useGetSecGroupsQuery,
  useLazyGetSecGroupsQuery,
} = securityGroupApi

export default securityGroupApi
