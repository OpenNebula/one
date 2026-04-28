/* ------------------------------------------------------------------------- *
 * Copyright 2002-2026, OpenNebula Project, OpenNebula Systems               *
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
import { Cluster } from '@ConstantsModule'
import {
  removeResourceOnPool,
  updateResourceOnPool,
  updateOwnershipOnResource,
} from '@modules/features/OneApi/common'
import { oneApi } from '@modules/features/OneApi/oneApi'
import {
  ONE_RESOURCES,
  ONE_RESOURCES_POOL,
} from '@modules/features/OneApi/resources'
import { Actions, Commands } from 'server/routes/api/oneks/routes'

const { ONEKS } = ONE_RESOURCES
const { ONEKS_POOL } = ONE_RESOURCES_POOL

const oneKsApi = oneApi.injectEndpoints({
  endpoints: (builder) => ({
    getOneKsClusters: builder.query({
      /**
       * Retrieves information for all the oneks clusters in the pool.
       *
       * @param {object} params - Request params
       * @param {string} [params.zone] - Zone from where to get the resources
       * @returns {Cluster[]} List of clusters
       * @throws Fails when response isn't code 200
       */
      query: (params) => {
        const name = Actions.LIST
        const command = { name, ...Commands[name] }

        return { command, params }
      },
      transformResponse: (data) => [data ?? []].flat(),
      providesTags: (clusters) =>
        clusters
          ? [
              ...clusters.map(({ ID }) => ({
                type: ONEKS_POOL,
                id: `${ID}`,
              })),
              ONEKS_POOL,
            ]
          : [ONEKS_POOL],
    }),
    getOneKsCluster: builder.query({
      /**
       * Retrieves information for the oneks cluster.
       *
       * @param {object} params - Request params
       * @param {string} params.id - Cluster id
       * @param {boolean} [params.decrypt] - Optional flag to decrypt contained secrets, valid only for admin
       * @returns {Cluster} Get cluster identified by id
       * @throws Fails when response isn't code 200
       */
      query: (params) => {
        const name = Actions.SHOW
        const command = { name, ...Commands[name] }

        return { params, command }
      },
      transformResponse: (data) => data ?? {},
      providesTags: (_, __, { id }) => [{ type: ONEKS, id }],
      async onQueryStarted({ id }, { dispatch, queryFulfilled }) {
        try {
          const { data: resourceFromQuery } = await queryFulfilled

          dispatch(
            oneKsApi.util.updateQueryData(
              'getOneKsClusters',
              undefined,
              updateResourceOnPool({ id, resourceFromQuery })
            )
          )
        } catch {
          // if the query fails, we want to remove the resource from the pool
          dispatch(
            oneKsApi.util.updateQueryData(
              'getOneKsClusters',
              undefined,
              removeResourceOnPool({ id })
            )
          )
        }
      },
    }),
    deleteOneKsCluster: builder.mutation({
      query: (params) => {
        const name = Actions.DELETE
        const command = { name, ...Commands[name] }

        return { params, command }
      },
      invalidatesTags: [ONEKS_POOL],
    }),
    updateOneKsClusterNodeGroups: builder.mutation({
      query: (params) => {
        const name = Actions.UPDATE_NODEGROUP
        const command = { name, ...Commands[name] }

        return { params, command }
      },
      invalidatesTags: [ONEKS_POOL],
    }),
    scaleOneKsClusterNodeGroups: builder.mutation({
      query: (params) => {
        const name = Actions.SCALE_NODEGROUP
        const command = { name, ...Commands[name] }

        return { params, command }
      },
      invalidatesTags: [ONEKS_POOL],
    }),
    deleteNodeGroup: builder.mutation({
      /**
       * Removes a nodegroup.
       *
       * @param {object} params - Request params
       * @param {string} params.id - Node group id
       * @param {string} params.nodegroup_id - ID of the node group to remove
       * @returns {number} Node group id
       * @throws Fails when response isn't code 200
       */
      query: (params) => {
        const name = Actions.DELETE_NODEGROUP
        const command = { name, ...Commands[name] }

        return { params, command }
      },
      invalidatesTags: (_, __, { id }) => [{ type: ONEKS, id }, ONEKS_POOL],
    }),
    getOneKsFamilies: builder.query({
      /**
       * Retrieves oneks families.
       *
       * @param {object} params - Request params
       * @returns {object} Get cluster identified by id
       * @throws Fails when response isn't code 200
       */
      query: (params) => {
        const name = Actions.LIST_FAMILIES
        const command = { name, ...Commands[name] }

        return { params, command }
      },
      transformResponse: (data) => data ?? {},
    }),
    getKubeConfig: builder.query({
      /**
       * Retrieves the Kubernetes configuration for a cluster.
       *
       * @param {object} params - Request params
       * @returns {Cluster} Get cluster identified by id
       * @throws Fails when response isn't code 200
       */
      query: (params) => {
        const name = Actions.KUBECONFIG
        const command = { name, ...Commands[name] }

        return { params, command }
      },
      transformResponse: (data) => {
        if (
          !data ||
          (typeof data === 'object' && Object.keys(data).length === 0)
        ) {
          return ''
        }

        return data
      },
    }),
    getEndpoint: builder.query({
      /**
       * Retrieves the Kubernetes endpoint for a cluster.
       *
       * @param {object} params - Request params
       * @returns {Cluster} Get cluster identified by id
       * @throws Fails when response isn't code 200
       */
      query: (params) => {
        const name = Actions.ENDPOINT
        const command = { name, ...Commands[name] }

        return { params, command }
      },
      transformResponse: (data) => {
        if (
          !data ||
          (typeof data === 'object' && Object.keys(data).length === 0)
        ) {
          return ''
        }

        return data
      },
    }),
    createOneKsCluster: builder.mutation({
      /**
       * Create a new cluster in OpenNebula.
       *
       * @param {object} params - Request params
       * @param {string} params.name - Name for the new cluster
       * @returns {number} The allocated cluster id
       * @throws Fails when response isn't code 200
       */
      query: (params) => {
        const name = Actions.CREATE
        const command = { name, ...Commands[name] }

        return { params, command }
      },
      invalidatesTags: [ONEKS_POOL],
    }),
    createOneKsNodeGroup: builder.mutation({
      /**
       * Create a new node group in OpenNebula.
       *
       * @param {object} params - Request params
       * @param {string} params.name - Name for the new node group
       * @returns {number} The allocated node group id
       * @throws Fails when response isn't code 200
       */
      query: (params) => {
        const name = Actions.CREATE_NODEGROUP
        const command = { name, ...Commands[name] }

        return { params, command }
      },
    }),
    getKubernetesLogs: builder.query({
      /**
       * Retrieves log for a provider.
       *
       * @param {object} params - Request params
       * @param {number} params.id - Provision id
       * @returns {object} Provider logs
       * @throws Fails when response isn't code 200
       */
      query: (params) => {
        const name = Actions.LOGS
        const command = { name, ...Commands[name] }

        return { params, command }
      },
      keepUnusedDataFor: 0,
      providesTags: [],
    }),
    getOneKsNodegroupFamilies: builder.query({
      /**
       * Retrieves oneks nodegroup families.
       *
       * @param {object} params - Request params
       * @returns {object} Get nodegroup families
       * @throws Fails when response isn't code 200
       */
      query: (params) => {
        const name = Actions.LIST_NODEGROUP_FAMILIES
        const command = { name, ...Commands[name] }

        return { params, command }
      },
      transformResponse: (data) => data ?? {},
    }),
    recoverOneKsCluster: builder.mutation({
      /**
       * Recover oneks cluster.
       *
       * @param {object} params - Request params
       * @param {number} params.id - Provision id
       * @returns {object} Provider logs
       * @throws Fails when response isn't code 200
       */
      query: (params) => {
        const name = Actions.RECOVER
        const command = { name, ...Commands[name] }

        return { params, command }
      },
      keepUnusedDataFor: 0,
      providesTags: [],
    }),
    recoverOneKsNodeGroup: builder.mutation({
      /**
       * Recover oneks a node group.
       *
       * @param {object} params - Request params
       * @param {number} params.id - Provision id
       * @returns {object} Provider logs
       * @throws Fails when response isn't code 200
       */
      query: (params) => {
        const name = Actions.RECOVER_NODEGROUP
        const command = { name, ...Commands[name] }

        return { params, command }
      },
      keepUnusedDataFor: 0,
      providesTags: [],
    }),
    changeOneKsClusterPermissions: builder.mutation({
      /**
       * Changes the permission bits of a oneks cluster.
       * If set to `-1`, it's not changed.
       *
       * @param {object} params - Request parameters
       * @param {string} params.id - Cluster id
       * @param {string} params.octet - Permissions in octal format
       * @returns {number} Cluster id
       * @throws Fails when response isn't code 200
       */
      query: ({ octet, ...params }) => {
        params.octet = octet
        const name = Actions.CHMOD
        const command = { name, ...Commands[name] }

        return { params, command }
      },
      invalidatesTags: (_, __, { id }) => [{ type: ONEKS, id }],
    }),
    changeOneKsClusterOwnership: builder.mutation({
      /**
       * Changes the ownership bits of a oneks cluster.
       * If set to `-1`, the user or group is not changed.
       *
       * @param {object} params - Request parameters
       * @param {string} params.id - Cluster id
       * @param {number} params.user - New user id
       * @param {number} params.group - New group id
       * @returns {number} Cluster id
       * @throws Fails when response isn't code 200
       */
      query: ({ user = '-1', group = '-1', ...params }) => {
        params.owner_id = user
        params.group_id = group

        const name = Actions.CHOWN
        const command = { name, ...Commands[name] }

        return { params, command }
      },
      invalidatesTags: (_, __, { id }) => [{ type: ONEKS, id }],
      async onQueryStarted(params, { getState, dispatch, queryFulfilled }) {
        try {
          const patchOneKsCluster = dispatch(
            oneKsApi.util.updateQueryData(
              'getOneKsClusters',
              { id: params.id },
              updateOwnershipOnResource(getState(), params)
            )
          )

          const patchOneKsClusters = dispatch(
            oneKsApi.util.updateQueryData(
              'getOneKsClusters',
              undefined,
              updateOwnershipOnResource(getState(), params)
            )
          )

          queryFulfilled.catch(() => {
            patchOneKsCluster.undo()
            patchOneKsClusters.undo()
          })
        } catch {}
      },
    }),
    updateOneKsDocument: builder.mutation({
      /**
       * Change oneKs Document .
       *
       * @param {object} params - Request parameters
       * @param {string} params.id - OneKs cluster id
       * @param {string} params.name - The new name
       * @returns {number} OneKs cluster id
       * @throws Fails when response isn't code 200
       */
      query: (params) => {
        const name = Actions.UPDATE_DOCUMENT
        const command = { name, ...Commands[name] }

        return { params, command }
      },
      invalidatesTags: (_, __, { id }) => [{ type: ONEKS, id }, ONEKS_POOL],
    }),
    updateOneKsKubernetesVersion: builder.mutation({
      /**
       * Change oneKs Kubernetes version .
       *
       * @param {object} params - Request parameters
       * @param {string} params.id - OneKs cluster id
       * @param {string} params.kubernetes_version - The new Kubernetes version
       * @returns {number} OneKs cluster id
       * @throws Fails when response isn't code 200
       */
      query: (params) => {
        const name = Actions.UPGRADE_KUBERNETES_VERSION
        const command = { name, ...Commands[name] }

        return { params, command }
      },
      invalidatesTags: (_, __, { id }) => [{ type: ONEKS, id }, ONEKS_POOL],
    }),
  }),
})

const oneKsQueries = (({
  // Queries
  useGetOneKsClustersQuery,
  useLazyGetOneKsClustersQuery,
  useGetOneKsClusterQuery,
  useLazyGetOneKsClusterQuery,
  useGetOneKsFamiliesQuery,
  useLazyGetOneKsFamiliesQuery,
  useGetKubeConfigQuery,
  useLazyGetKubeConfigQuery,
  useGetEndpointQuery,
  useLazyGetEndpointQuery,
  useGetKubernetesLogsQuery,
  useLazyGetKubernetesLogsQuery,
  useGetOneKsNodegroupFamiliesQuery,
  useLazyGetOneKsNodegroupFamiliesQuery,

  // Mutations
  useCreateOneKsClusterMutation,
  useDeleteOneKsClusterMutation,
  useDeleteNodeGroupMutation,
  useScaleOneKsClusterNodeGroupsMutation,
  useCreateOneKsNodeGroupMutation,
  useRecoverOneKsClusterMutation,
  useRecoverOneKsNodeGroupMutation,
  useChangeOneKsClusterPermissionsMutation,
  useChangeOneKsClusterOwnershipMutation,
  useUpdateOneKsDocumentMutation,
  useUpdateOneKsKubernetesVersionMutation,
  useUpdateOneKsClusterNodeGroupsMutation,
}) => ({
  // Queries
  useGetOneKsClustersQuery,
  useLazyGetOneKsClustersQuery,
  useGetOneKsClusterQuery,
  useLazyGetOneKsClusterQuery,
  useGetOneKsFamiliesQuery,
  useLazyGetOneKsFamiliesQuery,
  useGetKubeConfigQuery,
  useLazyGetKubeConfigQuery,
  useGetEndpointQuery,
  useLazyGetEndpointQuery,
  useGetKubernetesLogsQuery,
  useLazyGetKubernetesLogsQuery,
  useGetOneKsNodegroupFamiliesQuery,
  useLazyGetOneKsNodegroupFamiliesQuery,

  // Mutations
  useCreateOneKsClusterMutation,
  useDeleteOneKsClusterMutation,
  useDeleteNodeGroupMutation,
  useScaleOneKsClusterNodeGroupsMutation,
  useCreateOneKsNodeGroupMutation,
  useRecoverOneKsClusterMutation,
  useRecoverOneKsNodeGroupMutation,
  useChangeOneKsClusterPermissionsMutation,
  useChangeOneKsClusterOwnershipMutation,
  useUpdateOneKsDocumentMutation,
  useUpdateOneKsKubernetesVersionMutation,
  useUpdateOneKsClusterNodeGroupsMutation,
}))(oneKsApi)

export default oneKsQueries
