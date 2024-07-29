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
import { Actions, Commands } from 'server/utils/constants/commands/acl'
import { oneApi, ONE_RESOURCES_POOL } from 'client/features/OneApi'
import userApi from 'client/features/OneApi/user'
import groupApi from 'client/features/OneApi/group'
import clusterApi from 'client/features/OneApi/cluster'
import zoneApi from 'client/features/OneApi/zone'

import { Acl } from 'client/constants'
import { aclFromString } from 'client/models/ACL'
const _ = require('lodash')

const { ACL_POOL } = ONE_RESOURCES_POOL

const basicEndpoints = (builder) => ({
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
    providesTags: (acls) =>
      acls
        ? [...acls.map(({ ID }) => ({ type: ACL_POOL, id: `${ID}` })), ACL_POOL]
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
})

const extendedEnpoints = (builder) => ({
  getAclsExtended: builder.query({
    /**
     * Retrieves information for all the acls in the pool adding the names of users, groups, clusters and zones.
     *
     * @param {object} params - Request parameters
     * @param {object} props - Utils to use on queryFn function
     * @param {Function} props.dispatch - Function to dispatch queries
     * @returns {Acl[]} Get list of acls
     * @throws Fails when response isn't code 200
     */
    queryFn: async (params = {}, { dispatch }) => {
      try {
        // Get users
        const users = await dispatch(
          userApi.endpoints.getUsers.initiate(undefined, { forceRefetch: true })
        ).unwrap()

        // Get groups
        const groups = await dispatch(
          groupApi.endpoints.getGroups.initiate(undefined, {
            forceRefetch: true,
          })
        ).unwrap()

        // Get clusters
        const clusters = await dispatch(
          clusterApi.endpoints.getClusters.initiate(undefined, {
            forceRefetch: true,
          })
        ).unwrap()

        // Get zones
        const zones = await dispatch(
          zoneApi.endpoints.getZones.initiate(undefined, { forceRefetch: true })
        ).unwrap()

        // Get acls
        const acls = await dispatch(
          aclApi.endpoints.getAcls.initiate(undefined, { forceRefetch: true })
        ).unwrap()

        const data = _.orderBy(
          acls,
          [(item) => parseInt(item.ID)],
          ['desc']
        ).map((acl) => ({
          ID: acl.ID,
          ...aclFromString(acl.STRING, users, groups, clusters, zones),
        }))

        // Return data
        return {
          data,
        }
      } catch (error) {
        return { error }
      }
    },
    providesTags: (acls) =>
      acls
        ? [...acls.map(({ ID }) => ({ type: ACL_POOL, id: `${ID}` })), ACL_POOL]
        : [ACL_POOL],
  }),
})

const aclApi = oneApi.injectEndpoints({
  endpoints: (builder) => ({
    ...basicEndpoints(builder),
    ...extendedEnpoints(builder),
  }),
})

export const {
  // Queries
  useGetAclsQuery,
  useGetAclsExtendedQuery,

  // Mutations
  useAllocateAclMutation,
  useRemoveAclMutation,
} = aclApi

export default aclApi
