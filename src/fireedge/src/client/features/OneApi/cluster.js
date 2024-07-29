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
import { Actions, Commands } from 'server/utils/constants/commands/cluster'
import {
  Actions as ExtraActions,
  Commands as ExtraCommands,
} from 'server/routes/api/cluster/routes'

import {
  oneApi,
  ONE_RESOURCES,
  ONE_RESOURCES_POOL,
} from 'client/features/OneApi'
import { Cluster } from 'client/constants'
import {
  removeResourceOnPool,
  updateNameOnResource,
  updateResourceOnPool,
  updateTemplateOnResource,
} from 'client/features/OneApi/common'

const { CLUSTER, HOST, DATASTORE } = ONE_RESOURCES
const { CLUSTER_POOL, HOST_POOL, DATASTORE_POOL } = ONE_RESOURCES_POOL

const clusterApi = oneApi.injectEndpoints({
  endpoints: (builder) => ({
    getClusters: builder.query({
      /**
       * Retrieves information for all the clusters in the pool.
       *
       * @param {object} params - Request params
       * @param {string} [params.zone] - Zone from where to get the resources
       * @returns {Cluster[]} List of clusters
       * @throws Fails when response isn't code 200
       */
      query: (params) => {
        const name = Actions.CLUSTER_POOL_INFO
        const command = { name, ...Commands[name] }

        return { command, params }
      },
      transformResponse: (data) => [data?.CLUSTER_POOL?.CLUSTER ?? []].flat(),
      providesTags: (clusters) =>
        clusters
          ? [
              ...clusters.map(({ ID }) => ({
                type: CLUSTER_POOL,
                id: `${ID}`,
              })),
              CLUSTER_POOL,
            ]
          : [CLUSTER_POOL],
    }),
    getCluster: builder.query({
      /**
       * Retrieves information for the cluster.
       *
       * @param {object} params - Request params
       * @param {string} params.id - Cluster id
       * @param {boolean} [params.decrypt] - Optional flag to decrypt contained secrets, valid only for admin
       * @returns {Cluster} Get cluster identified by id
       * @throws Fails when response isn't code 200
       */
      query: (params) => {
        const name = Actions.CLUSTER_INFO
        const command = { name, ...Commands[name] }

        return { params, command }
      },
      transformResponse: (data) => data?.CLUSTER ?? {},
      providesTags: (_, __, { id }) => [{ type: CLUSTER, id }],
      async onQueryStarted({ id }, { dispatch, queryFulfilled }) {
        try {
          const { data: resourceFromQuery } = await queryFulfilled

          dispatch(
            clusterApi.util.updateQueryData(
              'getClusters',
              undefined,
              updateResourceOnPool({ id, resourceFromQuery })
            )
          )
        } catch {
          // if the query fails, we want to remove the resource from the pool
          dispatch(
            clusterApi.util.updateQueryData(
              'getClusters',
              undefined,
              removeResourceOnPool({ id })
            )
          )
        }
      },
    }),
    getClusterAdmin: builder.query({
      /**
       * Retrieve the information as serveradmin.
       *
       * @param {object} params - Request params
       * @param {string} params.id - Cluster id
       * @param {boolean} [params.decrypt] - Optional flag to decrypt contained secrets, valid only for admin
       * @returns {Cluster} Get cluster identified by id
       * @throws Fails when response isn't code 200
       */
      query: (params) => {
        const name = ExtraActions.CLUSTER_ADMINSHOW
        const command = { name, ...ExtraCommands[name] }

        return { params, command }
      },
      providesTags: (_, __, { id }) => [{ type: CLUSTER, id }],
    }),
    allocateCluster: builder.mutation({
      /**
       * Allocates a new cluster in OpenNebula.
       *
       * @param {object} params - Request params
       * @param {string} params.name - Name for the new cluster
       * @returns {number} The allocated cluster id
       * @throws Fails when response isn't code 200
       */
      query: (params) => {
        const name = Actions.CLUSTER_ALLOCATE
        const command = { name, ...Commands[name] }

        return { params, command }
      },
      invalidatesTags: [CLUSTER_POOL],
    }),
    removeCluster: builder.mutation({
      /**
       * Deletes the given cluster from the pool.
       *
       * @param {number|string} params - Cluster id
       * @returns {number} Cluster id
       * @throws Fails when response isn't code 200
       */
      query: (params) => {
        const name = Actions.CLUSTER_DELETE
        const command = { name, ...Commands[name] }

        return { params, command }
      },
      invalidatesTags: [CLUSTER_POOL],
      async onQueryStarted(params, { dispatch, queryFulfilled }) {
        try {
          const patchCluster = dispatch(
            clusterApi.util.updateQueryData(
              'getCluster',
              { id: params.id },
              updateNameOnResource(params)
            )
          )

          const patchClusters = dispatch(
            clusterApi.util.updateQueryData(
              'getClusters',
              undefined,
              updateNameOnResource(params)
            )
          )

          queryFulfilled.catch(() => {
            patchCluster.undo()
            patchClusters.undo()
          })
        } catch {}
      },
    }),
    updateCluster: builder.mutation({
      /**
       * Replaces the cluster template contents.
       *
       * @param {object} params - Request params
       * @param {number|string} params.id - Cluster id
       * @param {string} params.template - The new template contents
       * @param {0|1} params.replace
       * - Update type:
       * ``0``: Replace the whole template.
       * ``1``: Merge new template with the existing one.
       * @returns {number} Cluster id
       * @throws Fails when response isn't code 200
       */
      query: (params) => {
        const name = Actions.CLUSTER_UPDATE
        const command = { name, ...Commands[name] }

        return { params, command }
      },
      invalidatesTags: (_, __, { id }) => [{ type: CLUSTER, id }],
      async onQueryStarted(params, { dispatch, queryFulfilled }) {
        try {
          const patchCluster = dispatch(
            clusterApi.util.updateQueryData(
              'getCluster',
              { id: params.id },
              updateTemplateOnResource(params)
            )
          )

          const patchClusters = dispatch(
            clusterApi.util.updateQueryData(
              'getClusters',
              undefined,
              updateTemplateOnResource(params)
            )
          )

          queryFulfilled.catch(() => {
            patchCluster.undo()
            patchClusters.undo()
          })
        } catch {}
      },
    }),
    addHostToCluster: builder.mutation({
      /**
       * Adds a host to the given cluster.
       *
       * @param {object} params - Request params
       * @param {number|string} params.id - The cluster id
       * @param {string} params.host - The host id
       * @returns {number} Cluster id
       * @throws Fails when response isn't code 200
       */
      query: (params) => {
        const name = Actions.CLUSTER_ADDHOST
        const command = { name, ...Commands[name] }

        return { params, command }
      },
      invalidatesTags: (_, __, { id, host }) => [
        { type: CLUSTER, id },
        { type: HOST, id: host },
        CLUSTER_POOL,
        HOST_POOL,
      ],
    }),
    removeHostFromCluster: builder.mutation({
      /**
       * Removes a host from the given cluster.
       *
       * @param {object} params - Request params
       * @param {number|string} params.id - The cluster id
       * @param {string} params.host - The host id
       * @returns {number} Cluster id
       * @throws Fails when response isn't code 200
       */
      query: (params) => {
        const name = Actions.CLUSTER_DELHOST
        const command = { name, ...Commands[name] }

        return { params, command }
      },
      invalidatesTags: (_, __, { id }) => [{ type: CLUSTER, id }, CLUSTER_POOL],
    }),
    addDatastoreToCluster: builder.mutation({
      /**
       * Adds a datastore to the given cluster.
       *
       * @param {object} params - Request params
       * @param {number|string} params.id - The cluster id
       * @param {string} params.datastore - The datastore id
       * @returns {number} Cluster id
       * @throws Fails when response isn't code 200
       */
      query: (params) => {
        const name = Actions.CLUSTER_ADDDATASTORE
        const command = { name, ...Commands[name] }

        return { params, command }
      },
      invalidatesTags: (_, __, { id, datastore }) => [
        { type: CLUSTER, id },
        CLUSTER_POOL,
        DATASTORE_POOL,
        { type: DATASTORE, id: datastore },
      ],
    }),
    removeDatastoreFromCluster: builder.mutation({
      /**
       * Removes a datastore from the given cluster.
       *
       * @param {object} params - Request params
       * @param {number|string} params.id - The cluster id
       * @param {string} params.datastore - The datastore id
       * @returns {number} Cluster id
       * @throws Fails when response isn't code 200
       */
      query: (params) => {
        const name = Actions.CLUSTER_DELDATASTORE
        const command = { name, ...Commands[name] }

        return { params, command }
      },
      invalidatesTags: (_, __, { id, datastore }) => [
        { type: CLUSTER, id },
        CLUSTER_POOL,
        DATASTORE_POOL,
        { type: DATASTORE, id: datastore },
      ],
    }),
    addNetworkToCluster: builder.mutation({
      /**
       * Adds a vnet to the given cluster.
       *
       * @param {object} params - Request params
       * @param {number|string} params.id - The cluster id
       * @param {string} params.vnet - The vnet id
       * @returns {number} Cluster id
       * @throws Fails when response isn't code 200
       */
      query: (params) => {
        const name = Actions.CLUSTER_ADDVNET
        const command = { name, ...Commands[name] }

        return { params, command }
      },
      invalidatesTags: (_, __, { id }) => [{ type: CLUSTER, id }, CLUSTER_POOL],
    }),
    removeNetworkFromCluster: builder.mutation({
      /**
       * Removes a vnet from the given cluster.
       *
       * @param {object} params - Request params
       * @param {number|string} params.id - The cluster id
       * @param {string} params.vnet - The vnet id
       * @returns {number} Cluster id
       * @throws Fails when response isn't code 200
       */
      query: (params) => {
        const name = Actions.CLUSTER_DELVNET
        const command = { name, ...Commands[name] }

        return { params, command }
      },
      invalidatesTags: (_, __, { id }) => [{ type: CLUSTER, id }, CLUSTER_POOL],
    }),
    renameCluster: builder.mutation({
      /**
       * Renames a cluster.
       *
       * @param {object} params - Request parameters
       * @param {string|number} params.id - Cluster id
       * @param {string} params.name - The new name
       * @returns {number} Cluster id
       * @throws Fails when response isn't code 200
       */
      query: (params) => {
        const name = Actions.CLUSTER_RENAME
        const command = { name, ...Commands[name] }

        return { params, command }
      },
      invalidatesTags: (_, __, { id }) => [{ type: CLUSTER, id }, CLUSTER_POOL],
    }),
  }),
})

export const {
  // Queries
  useGetClustersQuery,
  useLazyGetClustersQuery,
  useGetClusterQuery,
  useLazyGetClusterQuery,
  useGetClusterAdminQuery,
  useLazyGetClusterAdminQuery,

  // Mutations
  useAllocateClusterMutation,
  useRemoveClusterMutation,
  useUpdateClusterMutation,
  useAddHostToClusterMutation,
  useRemoveHostFromClusterMutation,
  useAddDatastoreToClusterMutation,
  useRemoveDatastoreFromClusterMutation,
  useAddNetworkToClusterMutation,
  useRemoveNetworkFromClusterMutation,
  useRenameClusterMutation,
} = clusterApi

export default clusterApi
