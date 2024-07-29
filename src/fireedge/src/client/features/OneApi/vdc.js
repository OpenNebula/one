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
import {
  Actions as CustomActions,
  Commands as CustomCommands,
} from 'server/routes/api/vdc/routes'
import { Actions, Commands } from 'server/utils/constants/commands/vdc'

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

/* eslint-disable no-unused-vars */
import {
  VDCCluster,
  VDCDatastore,
  VDCHost,
  VDCVnet,
} from 'client/constants/vdc'
/* eslint-enable no-unused-vars */

const { VDC } = ONE_RESOURCES
const { VDC_POOL } = ONE_RESOURCES_POOL

const vdcApi = oneApi.injectEndpoints({
  endpoints: (builder) => ({
    getVDCs: builder.query({
      /**
       * Retrieves information for all or part of the Resources in the pool.
       *
       * @returns {Array[Object]} List of Virtual Data Centers
       * @throws Fails when response isn't code 200
       */
      query: () => {
        const name = Actions.VDC_POOL_INFO
        const command = { name, ...Commands[name] }

        return { command }
      },
      transformResponse: (data) => [data?.VDC_POOL?.VDC ?? []].flat(),
      providesTags: (vdcs) =>
        vdcs
          ? [
              ...vdcs.map(({ ID }) => ({
                type: VDC_POOL,
                id: `${ID}`,
              })),
              VDC_POOL,
            ]
          : [VDC_POOL],
    }),
    getVDC: builder.query({
      /**
       * Retrieves information for the VDC.
       *
       * @param {object} params - Request parameters
       * @param {string} params.id - VDC id
       * @param {boolean} [params.decrypt] - True to decrypt contained secrets (only admin)
       * @returns {object} Get VDC identified by id
       * @throws Fails when response isn't code 200
       */
      query: (params) => {
        const name = Actions.VDC_INFO
        const command = { name, ...Commands[name] }

        return { params, command }
      },
      transformResponse: (data) => data?.VDC ?? {},
      providesTags: (_, __, { id }) => [{ type: VDC, id }],
      async onQueryStarted({ id }, { dispatch, queryFulfilled }) {
        try {
          const { data: resourceFromQuery } = await queryFulfilled

          dispatch(
            vdcApi.util.updateQueryData(
              'getVDCs',
              undefined,
              updateResourceOnPool({ id, resourceFromQuery })
            )
          )
        } catch {
          // if the query fails, we want to remove the resource from the pool
          dispatch(
            vdcApi.util.updateQueryData(
              'getVDCs',
              undefined,
              removeResourceOnPool({ id })
            )
          )
        }
      },
    }),
    createVDC: builder.mutation({
      /**
       * Creates a new VDC in OpenNebula.
       *
       * @param {object} params - Request params
       * @param {string} params.template - A string containing the template on syntax XML
       * @param {Array[string]} params.groups - List of groups ids
       * @param {Array[VDCHost]} params.hosts - List of hosts
       * @param {Array[VDCDatastore]} params.datastores - List of datastores
       * @param {Array[VDCVnet]} params.vnets - List of vnets
       * @param {Array[VDCCluster]} params.clusters - List of clusters
       * @returns {number} VDC id
       * @throws Fails when response isn't code 200
       */
      query: (params) => {
        const name = CustomActions.VDC_CREATE
        const command = { name, ...CustomCommands[name] }

        return { params, command }
      },
    }),
    removeVDC: builder.mutation({
      /**
       * Deletes the given VDC from the pool.
       *
       * @param {object} params - Request params
       * @param {number|string} params.id - VDC id
       * @returns {number} VDC id
       * @throws Fails when response isn't code 200
       */
      query: (params) => {
        const name = Actions.VDC_DELETE
        const command = { name, ...Commands[name] }

        return { params, command }
      },
      invalidatesTags: [VDC_POOL],
    }),
    updateVDC: builder.mutation({
      /**
       * Replaces the template contents.
       *
       * @param {object} params - Request params
       * @param {number|string} params.id - VDC id
       * @param {string} params.template - The new template contents
       * @param {0|1} params.replace
       * - Update type:
       * ``0``: Replace the whole template.
       * ``1``: Merge new template with the existing one.
       * @returns {number} VDC id
       * @throws Fails when response isn't code 200
       */
      query: (params) => {
        const name = CustomActions.VDC_UPDATE
        const command = { name, ...CustomCommands[name] }

        return { params, command }
      },
      invalidatesTags: (_, __, { id }) => [{ type: VDC, id }],
      async onQueryStarted(params, { dispatch, queryFulfilled }) {
        try {
          const patchVDC = dispatch(
            vdcApi.util.updateQueryData(
              'getVDC',
              { id: params.id },
              updateTemplateOnResource(params)
            )
          )

          const patchVDCs = dispatch(
            vdcApi.util.updateQueryData(
              'getVDCs',
              undefined,
              updateTemplateOnResource(params)
            )
          )

          queryFulfilled.catch(() => {
            patchVDC.undo()
            patchVDCs.undo()
          })
        } catch {}
      },
    }),
    renameVDC: builder.mutation({
      /**
       * Renames a Virtual Data Center.
       *
       * @param {object} params - Request parameters
       * @param {string|number} params.id - VDC id
       * @param {string} params.name - The new name
       * @returns {number} VDC id
       * @throws Fails when response isn't code 200
       */
      query: (params) => {
        const name = Actions.VDC_RENAME
        const command = { name, ...Commands[name] }

        return { params, command }
      },
      invalidatesTags: (_, __, { id }) => [{ type: VDC, id }],
      async onQueryStarted(params, { dispatch, queryFulfilled }) {
        try {
          const patchVDC = dispatch(
            vdcApi.util.updateQueryData(
              'getVDC',
              { id: params.id },
              updateNameOnResource(params)
            )
          )

          const patchVDCs = dispatch(
            vdcApi.util.updateQueryData(
              'getVDCs',
              undefined,
              updateNameOnResource(params)
            )
          )

          queryFulfilled.catch(() => {
            patchVDC.undo()
            patchVDCs.undo()
          })
        } catch {}
      },
    }),
    addGroupToVDC: builder.mutation({
      /**
       * Adds a group to the VDC.
       *
       * @param {object} params - Request parameters
       * @param {string|number} params.id - VDC id
       * @param {string} params.group - Group id to be added to the VDC
       * @returns {number} VDC id
       * @throws Fails when response isn't code 200
       */
      query: (params) => {
        const name = Actions.VDC_ADDGROUP
        const command = { name, ...Commands[name] }

        return { params, command }
      },
      invalidatesTags: (_, __, { id }) => [{ type: VDC, id }],
    }),
    removeGroupFromVDC: builder.mutation({
      /**
       * Removes a group from the VDC.
       *
       * @param {object} params - Request parameters
       * @param {string|number} params.id - VDC id
       * @param {string} params.group - Group id to be added to the VDC
       * @returns {number} VDC id
       * @throws Fails when response isn't code 200
       */
      query: (params) => {
        const name = Actions.VDC_DELGROUP
        const command = { name, ...Commands[name] }

        return { params, command }
      },
      invalidatesTags: (_, __, { id }) => [{ type: VDC, id }],
    }),
    addClusterToVDC: builder.mutation({
      /**
       * Adds a Cluster to the VDC.
       *
       * @param {object} params - Request parameters
       * @param {string|number} params.id - VDC id
       * @param {number} params.zone - Zone id
       * @param {string} params.cluster - Cluster id to be added to the VDC
       * @returns {number} VDC id
       * @throws Fails when response isn't code 200
       */
      query: (params) => {
        const name = Actions.VDC_ADDCLUSTER
        const command = { name, ...Commands[name] }

        return { params, command }
      },
      invalidatesTags: (_, __, { id }) => [{ type: VDC, id }],
    }),
    removeClusterFromVDC: builder.mutation({
      /**
       * Removes a Cluster from the VDC.
       *
       * @param {object} params - Request parameters
       * @param {string|number} params.id - VDC id
       * @param {number} params.zone - Zone id
       * @param {string} params.cluster - Cluster id to be added to the VDC
       * @returns {number} VDC id
       * @throws Fails when response isn't code 200
       */
      query: (params) => {
        const name = Actions.VDC_DELCLUSTER
        const command = { name, ...Commands[name] }

        return { params, command }
      },
      invalidatesTags: (_, __, { id }) => [{ type: VDC, id }],
    }),
    addHostToVDC: builder.mutation({
      /**
       * Adds a Host to the VDC.
       *
       * @param {object} params - Request parameters
       * @param {string|number} params.id - VDC id
       * @param {number} params.zone - Zone id
       * @param {string} params.host - Host id to be added to the VDC
       * @returns {number} VDC id
       * @throws Fails when response isn't code 200
       */
      query: (params) => {
        const name = Actions.VDC_ADDHOST
        const command = { name, ...Commands[name] }

        return { params, command }
      },
      invalidatesTags: (_, __, { id }) => [{ type: VDC, id }],
    }),
    removeHostFromVDC: builder.mutation({
      /**
       * Removes a Host from the VDC.
       *
       * @param {object} params - Request parameters
       * @param {string|number} params.id - VDC id
       * @param {number} params.zone - Zone id
       * @param {string} params.host - Host id to be added to the VDC
       * @returns {number} VDC id
       * @throws Fails when response isn't code 200
       */
      query: (params) => {
        const name = Actions.VDC_DELHOST
        const command = { name, ...Commands[name] }

        return { params, command }
      },
      invalidatesTags: (_, __, { id }) => [{ type: VDC, id }],
    }),
    addDatastoreToVDC: builder.mutation({
      /**
       * Adds a Datastore to the VDC.
       *
       * @param {object} params - Request parameters
       * @param {string|number} params.id - VDC id
       * @param {number} params.zone - Zone id
       * @param {string} params.datastore - Datastore id to be added to the VDC
       * @returns {number} VDC id
       * @throws Fails when response isn't code 200
       */
      query: (params) => {
        const name = Actions.VDC_ADDDATASTORE
        const command = { name, ...Commands[name] }

        return { params, command }
      },
      invalidatesTags: (_, __, { id }) => [{ type: VDC, id }],
    }),
    removeDatastoreFromVDC: builder.mutation({
      /**
       * Removes a Datastore from the VDC.
       *
       * @param {object} params - Request parameters
       * @param {string|number} params.id - VDC id
       * @param {number} params.zone - Zone id
       * @param {string} params.datastore - Datastore id to be added to the VDC
       * @returns {number} VDC id
       * @throws Fails when response isn't code 200
       */
      query: (params) => {
        const name = Actions.VDC_DELDATASTORE
        const command = { name, ...Commands[name] }

        return { params, command }
      },
      invalidatesTags: (_, __, { id }) => [{ type: VDC, id }],
    }),
    addVNetToVDC: builder.mutation({
      /**
       * Adds a VNet to the VDC.
       *
       * @param {object} params - Request parameters
       * @param {string|number} params.id - VDC id
       * @param {number} params.zone - Zone id
       * @param {string} params.vnet - VNet id to be added to the VDC
       * @returns {number} VDC id
       * @throws Fails when response isn't code 200
       */
      query: (params) => {
        const name = Actions.VDC_ADDVNET
        const command = { name, ...Commands[name] }

        return { params, command }
      },
      invalidatesTags: (_, __, { id }) => [{ type: VDC, id }],
    }),
    removeVNetFromVDC: builder.mutation({
      /**
       * Removes a VNet from the VDC.
       *
       * @param {object} params - Request parameters
       * @param {string|number} params.id - VDC id
       * @param {number} params.zone - Zone id
       * @param {string} params.vnet - VNet id to be added to the VDC
       * @returns {number} VDC id
       * @throws Fails when response isn't code 200
       */
      query: (params) => {
        const name = Actions.VDC_DELVNET
        const command = { name, ...Commands[name] }

        return { params, command }
      },
      invalidatesTags: (_, __, { id }) => [{ type: VDC, id }],
    }),
  }),
})

export const {
  // Queries
  useGetVDCsQuery,
  useLazyGetVDCsQuery,
  useGetVDCQuery,
  useLazyGetVDCQuery,

  // Mutations
  useCreateVDCMutation,
  useRemoveVDCMutation,
  useUpdateVDCMutation,
  useRenameVDCMutation,
  useAddGroupToVDCMutation,
  useRemoveGroupFromVDCMutation,
  useAddClusterToVDCMutation,
  useRemoveClusterFromVDCMutation,
  useAddHostToVDCMutation,
  useRemoveHostFromVDCMutation,
  useAddDatastoreToVDCMutation,
  useRemoveDatastoreFromVDCMutation,
  useAddVNetToVDCMutation,
  useRemoveVNetFromVDCMutation,
} = vdcApi

export default vdcApi
