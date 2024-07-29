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
import { Actions, Commands } from 'server/utils/constants/commands/host'

import { Host } from 'client/constants'
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

import {
  Actions as ExtraActions,
  Commands as ExtraCommands,
} from 'server/routes/api/host/routes'

import { UpdateFromSocket } from 'client/features/OneApi/socket'

const { HOST } = ONE_RESOURCES
const { HOST_POOL } = ONE_RESOURCES_POOL

const hostApi = oneApi.injectEndpoints({
  endpoints: (builder) => ({
    getHosts: builder.query({
      /**
       * Retrieves information for all the hosts in the pool.
       *
       * @param {object} params - Request params
       * @param {string} [params.zone] - Zone from where to get the resources
       * @returns {Host[]} Get list of hosts
       * @throws Fails when response isn't code 200
       */
      query: (params) => {
        const name = Actions.HOST_POOL_INFO
        const command = { name, ...Commands[name] }

        return { command, params }
      },
      transformResponse: (data) => [data?.HOST_POOL?.HOST ?? []].flat(),
      providesTags: (hosts) =>
        hosts
          ? [
              ...hosts.map(({ ID }) => ({ type: HOST_POOL, id: `${ID}` })),
              HOST_POOL,
            ]
          : [HOST_POOL],
    }),
    getHostsAdmin: builder.query({
      /**
       * Retrieve the information as serveradmin.
       *
       * @param {object} params - Request params
       * @returns {Host[]} Get cluster identified by id
       * @throws Fails when response isn't code 200
       */
      query: (params) => {
        const name = ExtraActions.HOSTPOOL_ADMINSHOW
        const command = { name, ...ExtraCommands[name] }

        return { params, command }
      },
      transformResponse: (data) => [data?.HOST_POOL?.HOST ?? []].flat(),
      providesTags: (hosts) =>
        hosts
          ? [
              ...hosts.map(({ ID }) => ({ type: HOST_POOL, id: `${ID}` })),
              HOST_POOL,
            ]
          : [HOST_POOL],
    }),
    getHost: builder.query({
      /**
       * Retrieves information for the host.
       *
       * @param {object} params - Request params
       * @param {string} params.id - Host id
       * @returns {Host} Get host identified by id
       * @throws Fails when response isn't code 200
       */
      query: (params) => {
        const name = Actions.HOST_INFO
        const command = { name, ...Commands[name] }

        return { params, command }
      },
      transformResponse: (data) => {
        if (!data?.HOST) return {}

        const monitoring = data?.HOST?.MONITORING

        const hostShare = data?.HOST?.HOST_SHARE?.NUMA_NODES

        if (!monitoring || !hostShare) return data.HOST

        /**
         * [GH-6027] Numa nodes attributes are not together, some of the attributes
         * now come from monitoring. This means that when we ask for the host
         * data we need to merge the numa monitoring data with the numa host
         * share data
         */
        const numaNodes =
          hostShare?.NODE && Array.isArray(hostShare.NODE)
            ? hostShare.NODE
            : [hostShare.NODE]

        const monitoringNodes = Array.isArray(monitoring.NUMA_NODE)
          ? monitoring.NUMA_NODE
          : [monitoring.NUMA_NODE]

        numaNodes.forEach((node) => {
          const monitoringNode = monitoringNodes.find(
            (mNode) => mNode?.NODE_ID === node?.NODE_ID
          )
          node.MEMORY.FREE = monitoringNode.MEMORY.FREE
          node.MEMORY.USED = monitoringNode.MEMORY.USED

          const ensuredHugepage =
            node.HUGEPAGE && !Array.isArray(node.HUGEPAGE)
              ? [node.HUGEPAGE]
              : node.HUGEPAGE

          ensuredHugepage.forEach((page) => {
            const ensuredMonitoringNodeHugepage =
              monitoringNode.HUGEPAGE && !Array.isArray(monitoringNode.HUGEPAGE)
                ? [monitoringNode.HUGEPAGE]
                : monitoringNode.HUGEPAGE
            const monitoringPage = ensuredMonitoringNodeHugepage.find(
              (mPage) => mPage.SIZE === page.SIZE
            )
            page.FREE = monitoringPage.FREE

            return page
          })

          return node
        })

        return data.HOST
      },
      providesTags: (_, __, { id }) => [{ type: HOST, id }],
      async onQueryStarted({ id }, { dispatch, queryFulfilled }) {
        try {
          const { data: resourceFromQuery } = await queryFulfilled

          dispatch(
            hostApi.util.updateQueryData(
              'getHosts',
              undefined,
              updateResourceOnPool({ id, resourceFromQuery })
            )
          )
        } catch {
          // if the query fails, we want to remove the resource from the pool
          dispatch(
            hostApi.util.updateQueryData(
              'getHosts',
              undefined,
              removeResourceOnPool({ id })
            )
          )
        }
      },
      onCacheEntryAdded: UpdateFromSocket({
        updateQueryData: (updateFn) =>
          hostApi.util.updateQueryData('getHosts', undefined, updateFn),
        resource: 'HOST',
      }),
    }),
    allocateHost: builder.mutation({
      /**
       * Allocates a new host in OpenNebula.
       *
       * @param {object} params - Request params
       * @param {string} params.hostname - Hostname of the machine we want to add
       * @param {string} params.imMad
       * - The name of the information manager (im_mad_name),
       * this values are taken from the oned.conf with the tag name IM_MAD (name)
       * @param {string} params.vmmMad
       * - The name of the virtual machine manager mad name (vmm_mad_name),
       * this values are taken from the oned.conf with the tag name VM_MAD (name)
       * @param {string|number} [params.cluster] - The cluster ID
       * @returns {number} Host id
       * @throws Fails when response isn't code 200
       */
      query: (params) => {
        const name = Actions.HOST_ALLOCATE
        const command = { name, ...Commands[name] }

        return { params, command }
      },
    }),
    updateHost: builder.mutation({
      /**
       * Replaces the host’s template contents.
       *
       * @param {object} params - Request params
       * @param {number|string} params.id - Host id
       * @param {string} params.template - The new template contents
       * @param {0|1} params.replace
       * - Update type:
       * ``0``: Replace the whole template.
       * ``1``: Merge new template with the existing one.
       * @returns {number} Host id
       * @throws Fails when response isn't code 200
       */
      query: (params) => {
        const name = Actions.HOST_UPDATE
        const command = { name, ...Commands[name] }

        return { params, command }
      },
      invalidatesTags: (_, __, { id }) => [{ type: HOST, id }],
      async onQueryStarted(params, { dispatch, queryFulfilled }) {
        try {
          const patchHost = dispatch(
            hostApi.util.updateQueryData(
              'getHost',
              { id: params.id },
              updateTemplateOnResource(params)
            )
          )

          const patchHosts = dispatch(
            hostApi.util.updateQueryData(
              'getHosts',
              undefined,
              updateTemplateOnResource(params)
            )
          )

          queryFulfilled.catch(() => {
            patchHost.undo()
            patchHosts.undo()
          })
        } catch {}
      },
    }),
    removeHost: builder.mutation({
      /**
       * Deletes the given host from the pool.
       *
       * @param {object} params - Request params
       * @param {number|string} params.id - Host id
       * @returns {number} Host id
       * @throws Fails when response isn't code 200
       */
      query: (params) => {
        const name = Actions.HOST_DELETE
        const command = { name, ...Commands[name] }

        return { params, command }
      },
      invalidatesTags: [HOST_POOL],
    }),
    enableHost: builder.mutation({
      /**
       * Sets the status of the host to enabled.
       *
       * @param {number|string} id - Host id
       * @returns {number} Host id
       * @throws Fails when response isn't code 200
       */
      query: (id) => {
        const name = Actions.HOST_STATUS
        const command = { name, ...Commands[name] }

        return { params: { id, status: 0 }, command }
      },
      invalidatesTags: (_, __, id) => [{ type: HOST, id }, HOST_POOL],
    }),
    disableHost: builder.mutation({
      /**
       * Sets the status of the host to disabled.
       *
       * @param {number|string} id - Host id
       * @returns {number} Host id
       * @throws Fails when response isn't code 200
       */
      query: (id) => {
        const name = Actions.HOST_STATUS
        const command = { name, ...Commands[name] }

        return { params: { id, status: 1 }, command }
      },
      invalidatesTags: (_, __, id) => [{ type: HOST, id }, HOST_POOL],
    }),
    offlineHost: builder.mutation({
      /**
       * Sets the status of the host to offline.
       *
       * @param {number|string} id - Host id
       * @returns {number} Host id
       * @throws Fails when response isn't code 200
       */
      query: (id) => {
        const name = Actions.HOST_STATUS
        const command = { name, ...Commands[name] }

        return { params: { id, status: 2 }, command }
      },
      invalidatesTags: (_, __, id) => [{ type: HOST, id }, HOST_POOL],
    }),
    renameHost: builder.mutation({
      /**
       * Renames a host.
       *
       * @param {object} params - Request parameters
       * @param {string|number} params.id - Host id
       * @param {string} params.name - New name
       * @returns {number} Host id
       * @throws Fails when response isn't code 200
       */
      query: (params) => {
        const name = Actions.HOST_RENAME
        const command = { name, ...Commands[name] }

        return { params, command }
      },
      invalidatesTags: (_, __, { id }) => [{ type: HOST, id }],
      async onQueryStarted(params, { dispatch, queryFulfilled }) {
        try {
          const patchHost = dispatch(
            hostApi.util.updateQueryData(
              'getHost',
              { id: params.id },
              updateNameOnResource(params)
            )
          )

          const patchHosts = dispatch(
            hostApi.util.updateQueryData(
              'getHosts',
              undefined,
              updateNameOnResource(params)
            )
          )

          queryFulfilled.catch(() => {
            patchHost.undo()
            patchHosts.undo()
          })
        } catch {}
      },
    }),
    getHostMonitoring: builder.query({
      /**
       * Returns the host monitoring records.
       *
       * @param {object} params - Request parameters
       * @param {string|number} params.id - Host id
       * @returns {string} The monitoring information string / The error string
       * @throws Fails when response isn't code 200
       */
      query: (params) => {
        const name = Actions.HOST_MONITORING
        const command = { name, ...Commands[name] }

        return { params, command }
      },
    }),
    getHostMonitoringPool: builder.query({
      /**
       * Returns all the host monitoring records.
       *
       * @param {object} params - Request parameters
       * @param {number|'0'|'-1'} [params.seconds]
       * - Retrieve monitor records in the last num seconds.
       * `0`: Only the last record.
       * `-1`: All records.
       * @returns {string} The monitoring information string / The error string
       * @throws Fails when response isn't code 200
       */
      query: (params) => {
        const name = Actions.HOST_POOL_MONITORING
        const command = { name, ...Commands[name] }

        return { params, command }
      },
    }),
  }),
})

export const {
  // Queries
  useGetHostQuery,
  useLazyGetHostQuery,
  useGetHostsQuery,
  useGetHostsAdminQuery,
  useLazyGetHostsQuery,
  useGetHostMonitoringQuery,
  useLazyGetHostMonitoringQuery,
  useGetHostMonitoringPoolQuery,
  useLazyGetHostMonitoringPoolQuery,

  // Mutations
  useAllocateHostMutation,
  useUpdateHostMutation,
  useRemoveHostMutation,
  useEnableHostMutation,
  useDisableHostMutation,
  useOfflineHostMutation,
  useRenameHostMutation,
} = hostApi

export default hostApi
