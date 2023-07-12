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
import { Actions, Commands } from 'server/utils/constants/commands/vn'

import {
  FilterFlag,
  LockLevel,
  Permission,
  VirtualNetwork,
} from 'client/constants'
import {
  ONE_RESOURCES,
  ONE_RESOURCES_POOL,
  oneApi,
} from 'client/features/OneApi'
import {
  removeLockLevelOnResource,
  removeResourceOnPool,
  updateLockLevelOnResource,
  updateNameOnResource,
  updateOwnershipOnResource,
  updatePermissionOnResource,
  updateResourceOnPool,
  updateTemplateOnResource,
} from 'client/features/OneApi/common'
import { UpdateFromSocket } from 'client/features/OneApi/socket'

const { VNET } = ONE_RESOURCES
const { VNET_POOL } = ONE_RESOURCES_POOL

const vNetworkApi = oneApi.injectEndpoints({
  endpoints: (builder) => ({
    getVNetworks: builder.query({
      /**
       * Retrieves information for all or part of the virtual networks in the pool.
       *
       * @param {object} params - Request params
       * @param {FilterFlag} [params.filter] - Filter flag
       * @param {number} [params.start] - Range start ID
       * @param {number} [params.end] - Range end ID
       * @param {string} [params.zone] - Zone from where to get the resources
       * @returns {VirtualNetwork[]} List of virtual networks
       * @throws Fails when response isn't code 200
       */
      query: (params) => {
        const name = Actions.VN_POOL_INFO
        const command = { name, ...Commands[name] }

        return { command, params }
      },
      transformResponse: (data) => [data?.VNET_POOL?.VNET ?? []].flat(),
      providesTags: (networks) =>
        networks
          ? [
              ...networks.map(({ ID }) => ({ type: VNET_POOL, id: `${ID}` })),
              VNET_POOL,
            ]
          : [VNET_POOL],
    }),
    getVNetwork: builder.query({
      /**
       * Retrieves information for the virtual network.
       *
       * @param {object} params - Request params
       * @param {string} params.id - Virtual network id
       * @param {boolean} [params.decrypt] - Optional flag to decrypt contained secrets, valid only for admin
       * @returns {VirtualNetwork} Get Virtual network identified by id
       * @throws Fails when response isn't code 200
       */
      query: (params) => {
        const name = Actions.VN_INFO
        const command = { name, ...Commands[name] }

        return { params, command }
      },
      transformResponse: (data) => data?.VNET ?? {},
      providesTags: (_, __, { id }) => [{ type: VNET, id }],
      async onQueryStarted({ id }, { dispatch, queryFulfilled }) {
        try {
          const { data: resourceFromQuery } = await queryFulfilled

          dispatch(
            vNetworkApi.util.updateQueryData(
              'getVNetworks',
              undefined,
              updateResourceOnPool({ id, resourceFromQuery })
            )
          )
        } catch {
          // if the query fails, we want to remove the resource from the pool
          dispatch(
            vNetworkApi.util.updateQueryData(
              'getVNetworks',
              undefined,
              removeResourceOnPool({ id })
            )
          )
        }
      },
      onCacheEntryAdded: UpdateFromSocket({
        updateQueryData: (updateFn) =>
          vNetworkApi.util.updateQueryData('getVNetworks', undefined, updateFn),
        resource: 'VNET',
      }),
    }),
    allocateVnet: builder.mutation({
      /**
       * Allocates a new virtual network in OpenNebula.
       *
       * @param {object} params - Request params
       * @param {string} params.template - The string containing the template of the resource on syntax XML
       * @param {number|'-1'} params.cluster - The cluster ID. If it's -1, the default one will be used
       * @returns {number} The allocated virtual network id
       * @throws Fails when response isn't code 200
       */
      query: (params) => {
        const name = Actions.VN_ALLOCATE
        const command = { name, ...Commands[name] }

        return { params, command }
      },
    }),
    removeVNet: builder.mutation({
      /**
       * Deletes the given virtual network from the pool.
       *
       * @param {object} params - Request params
       * @param {string} params.id - Virtual network id
       * @returns {number} Virtual network id
       * @throws Fails when response isn't code 200
       */
      query: (params) => {
        const name = Actions.VN_DELETE
        const command = { name, ...Commands[name] }

        return { params, command }
      },
      invalidatesTags: [VNET_POOL],
    }),
    addRangeToVNet: builder.mutation({
      /**
       * Adds address ranges to a virtual network.
       *
       * @param {object} params - Request params
       * @param {string} params.id - Virtual network id
       * @param {string} params.template - Template of the address ranges to add on syntax XML
       * @returns {number} Virtual network id
       * @throws Fails when response isn't code 200
       */
      query: (params) => {
        const name = Actions.VN_AR_ADD
        const command = { name, ...Commands[name] }

        return { params, command }
      },
      invalidatesTags: (_, __, { id }) => [{ type: VNET, id }, VNET_POOL],
    }),
    removeRangeFromVNet: builder.mutation({
      /**
       * Removes an address range from a virtual network.
       *
       * @param {object} params - Request params
       * @param {string} params.id - Virtual network id
       * @param {number|string} params.address - ID of the address range to remove
       * @returns {number} Virtual network id
       * @throws Fails when response isn't code 200
       */
      query: (params) => {
        const name = Actions.VN_AR_RM
        const command = { name, ...Commands[name] }

        return { params, command }
      },
      invalidatesTags: (_, __, { id }) => [{ type: VNET, id }, VNET_POOL],
    }),
    updateVNetRange: builder.mutation({
      /**
       * Updates the attributes of an address range.
       *
       * @param {object} params - Request params
       * @param {string} params.id - Virtual network id
       * @param {string} params.template - Template of the address ranges to update on syntax XML
       * @returns {number} Virtual network id
       * @throws Fails when response isn't code 200
       */
      query: (params) => {
        const name = Actions.VN_AR_UPDATE
        const command = { name, ...Commands[name] }

        return { params, command }
      },
      invalidatesTags: (_, __, { id }) => [{ type: VNET, id }, VNET_POOL],
    }),
    reserveAddress: builder.mutation({
      /**
       * Reserve network addresses.
       *
       * @param {object} params - Request params
       * @param {string} params.id - Virtual network id
       * @param {string} params.template - The third parameter must be
       * an OpenNebula ATTRIBUTE=VALUE template, with these values:
       * - `SIZE`: Size of the reservation (**Mandatory**)
       * - `NAME`: If set, the reservation will be created in a new Virtual Network with this name
       * - `AR_ID`: ID of the AR from where to take the addresses
       * - `NETWORK_ID`: Instead of creating a new Virtual Network,
       * the reservation will be added to the existing virtual network with this ID
       * - `MAC`: First MAC address to start the reservation range [MAC, MAC+SIZE)
       * - `IP`: First IPv4 address to start the reservation range [IP, IP+SIZE)
       * @returns {number} Virtual network id
       * @throws Fails when response isn't code 200
       */
      query: (params) => {
        const name = Actions.VN_RESERVE
        const command = { name, ...Commands[name] }

        return { params, command }
      },
      invalidatesTags: (_, __, { id }) => [{ type: VNET, id }],
    }),
    freeReservedAR: builder.mutation({
      /**
       * Frees a reserved address range from a virtual network.
       *
       * @param {object} params - Request params
       * @param {string} params.id - Virtual network id
       * @param {string} params.range - ID of the address range to free
       * @returns {number} Virtual network id
       * @throws Fails when response isn't code 200
       */
      query: (params) => {
        const name = Actions.VN_AR_FREE
        const command = { name, ...Commands[name] }

        return { params, command }
      },
      invalidatesTags: (_, __, { id }) => [{ type: VNET, id }, VNET_POOL],
    }),
    holdLease: builder.mutation({
      /**
       * Holds a virtual network Lease as used.
       *
       * @param {object} params - Request params
       * @param {string} params.id - Virtual network id
       * @param {string} params.template - Template of the lease to hold, e.g. `LEASES=[IP=192.168.0.5]`
       * @returns {number} Virtual network id
       * @throws Fails when response isn't code 200
       */
      query: (params) => {
        const name = Actions.VN_HOLD
        const command = { name, ...Commands[name] }

        return { params, command }
      },
      invalidatesTags: (_, __, { id }) => [{ type: VNET, id }],
    }),
    releaseLease: builder.mutation({
      /**
       * Releases a virtual network Lease on hold.
       *
       * @param {object} params - Request params
       * @param {string} params.id - Virtual network id
       * @param {string} params.template - Template of the lease to hold, e.g. `LEASES=[IP=192.168.0.5]`
       * @returns {number} Virtual network id
       * @throws Fails when response isn't code 200
       */
      query: (params) => {
        const name = Actions.VN_RELEASE
        const command = { name, ...Commands[name] }

        return { params, command }
      },
      invalidatesTags: (_, __, { id }) => [{ type: VNET, id }],
    }),
    updateVNet: builder.mutation({
      /**
       * Replaces the virtual network template contents.
       *
       * @param {object} params - Request params
       * @param {string} params.id - Virtual network id
       * @param {string} params.template - The new template contents
       * @param {0|1} params.replace
       * - Update type:
       * ``0``: Replace the whole template.
       * ``1``: Merge new template with the existing one.
       * @returns {number} Virtual network id
       * @throws Fails when response isn't code 200
       */
      query: (params) => {
        const name = Actions.VN_UPDATE
        const command = { name, ...Commands[name] }

        return { params, command }
      },
      invalidatesTags: (_, __, { id }) => [{ type: VNET, id }],
      async onQueryStarted(params, { dispatch, queryFulfilled }) {
        try {
          const patchVNet = dispatch(
            vNetworkApi.util.updateQueryData(
              'getVNetwork',
              { id: params.id },
              updateTemplateOnResource(params)
            )
          )

          const patchVNets = dispatch(
            vNetworkApi.util.updateQueryData(
              'getVNetworks',
              undefined,
              updateTemplateOnResource(params)
            )
          )

          queryFulfilled.catch(() => {
            patchVNet.undo()
            patchVNets.undo()
          })
        } catch {}
      },
    }),
    changeVNetPermissions: builder.mutation({
      /**
       * Changes the permission bits of a virtual network.
       * If set any permission to -1, it's not changed.
       *
       * @param {object} params - Request parameters
       * @param {string} params.id - Virtual network id
       * @param {Permission|'-1'} params.ownerUse - User use
       * @param {Permission|'-1'} params.ownerManage - User manage
       * @param {Permission|'-1'} params.ownerAdmin - User administrator
       * @param {Permission|'-1'} params.groupUse - Group use
       * @param {Permission|'-1'} params.groupManage - Group manage
       * @param {Permission|'-1'} params.groupAdmin - Group administrator
       * @param {Permission|'-1'} params.otherUse - Other use
       * @param {Permission|'-1'} params.otherManage - Other manage
       * @param {Permission|'-1'} params.otherAdmin - Other administrator
       * @returns {number} Virtual network id
       * @throws Fails when response isn't code 200
       */
      query: (params) => {
        const name = Actions.VN_CHMOD
        const command = { name, ...Commands[name] }

        return { params, command }
      },
      invalidatesTags: (_, __, { id }) => [{ type: VNET, id }],
      async onQueryStarted(params, { dispatch, queryFulfilled }) {
        try {
          const patchVNet = dispatch(
            vNetworkApi.util.updateQueryData(
              'getVNetwork',
              { id: params.id },
              updatePermissionOnResource(params)
            )
          )

          queryFulfilled.catch(patchVNet.undo)
        } catch {}
      },
    }),
    changeVNetOwnership: builder.mutation({
      /**
       * Changes the ownership of a virtual network.
       * If set to `-1`, the user or group aren't changed.
       *
       * @param {object} params - Request parameters
       * @param {string} params.id - Virtual network id
       * @param {number} params.user - The user id
       * @param {number} params.group - The group id
       * @returns {number} Virtual network id
       * @throws Fails when response isn't code 200
       */
      query: (params) => {
        const name = Actions.VN_CHOWN
        const command = { name, ...Commands[name] }

        return { params, command }
      },
      invalidatesTags: (_, __, { id }) => [{ type: VNET, id }],
      async onQueryStarted(params, { getState, dispatch, queryFulfilled }) {
        try {
          const patchVNet = dispatch(
            vNetworkApi.util.updateQueryData(
              'getVNetwork',
              { id: params.id },
              updateOwnershipOnResource(getState(), params)
            )
          )

          queryFulfilled.catch(patchVNet.undo)
        } catch {}
      },
    }),
    renameVNet: builder.mutation({
      /**
       * Renames a virtual network.
       *
       * @param {object} params - Request parameters
       * @param {string} params.id - Virtual network id
       * @param {string} params.name - The new name
       * @returns {number} Virtual network id
       * @throws Fails when response isn't code 200
       */
      query: (params) => {
        const name = Actions.VN_RENAME
        const command = { name, ...Commands[name] }

        return { params, command }
      },
      invalidatesTags: (_, __, { id }) => [{ type: VNET, id }],
      async onQueryStarted(params, { dispatch, queryFulfilled }) {
        try {
          const patchVNet = dispatch(
            vNetworkApi.util.updateQueryData(
              'getVNetwork',
              { id: params.id },
              updateNameOnResource(params)
            )
          )

          const patchVNets = dispatch(
            vNetworkApi.util.updateQueryData(
              'getVNetworks',
              undefined,
              updateNameOnResource(params)
            )
          )

          queryFulfilled.catch(() => {
            patchVNet.undo()
            patchVNets.undo()
          })
        } catch {}
      },
    }),
    lockVNet: builder.mutation({
      /**
       * Locks a virtual network.
       *
       * @param {object} params - Request parameters
       * @param {string} params.id - Virtual network id
       * @param {LockLevel} params.lock - Lock level
       * @param {boolean} params.test - Checks if the object is already locked to return an error
       * @returns {number} Virtual network id
       * @throws Fails when response isn't code 200
       */
      query: (params) => {
        const name = Actions.VN_LOCK
        const command = { name, ...Commands[name] }

        return { params, command }
      },
      invalidatesTags: (_, __, { id }) => [{ type: VNET, id }],
      async onQueryStarted(params, { dispatch, queryFulfilled }) {
        try {
          const patchVNet = dispatch(
            vNetworkApi.util.updateQueryData(
              'getVNetwork',
              { id: params.id },
              updateLockLevelOnResource(params)
            )
          )

          const patchVNets = dispatch(
            vNetworkApi.util.updateQueryData(
              'getVNetworks',
              undefined,
              updateLockLevelOnResource(params)
            )
          )

          queryFulfilled.catch(() => {
            patchVNet.undo()
            patchVNets.undo()
          })
        } catch {}
      },
    }),
    unlockVNet: builder.mutation({
      /**
       * Unlocks a virtual network.
       *
       * @param {object} params - Request parameters
       * @param {string} params.id - Virtual network id
       * @returns {number} Virtual network id
       * @throws Fails when response isn't code 200
       */
      query: (params) => {
        const name = Actions.VN_UNLOCK
        const command = { name, ...Commands[name] }

        return { params, command }
      },
      invalidatesTags: (_, __, { id }) => [{ type: VNET, id }],
      async onQueryStarted(params, { dispatch, queryFulfilled }) {
        try {
          const patchVNet = dispatch(
            vNetworkApi.util.updateQueryData(
              'getVNetwork',
              { id: params.id },
              removeLockLevelOnResource(params)
            )
          )

          const patchVNets = dispatch(
            vNetworkApi.util.updateQueryData(
              'getVNetworks',
              undefined,
              removeLockLevelOnResource(params)
            )
          )

          queryFulfilled.catch(() => {
            patchVNet.undo()
            patchVNets.undo()
          })
        } catch {}
      },
    }),
    recoverVNet: builder.mutation({
      /**
       * Recovers a stuck Virtual Network which is waiting for a driver operation.
       * The recovery may be done by failing or succeeding the pending operation.
       * You need to manually check the VN status, to decide if the operation was successful or not.
       *
       * @param {object} params - Request parameters
       * @param {string} params.id - Virtual network id
       * @param {0|1|2|3} params.operation - Recover operation:
       * failure (0), success (1), delete (2), retry (3)
       * @returns {number} Virtual network id
       * @throws Fails when response isn't code 200
       */
      query: (params) => {
        const name = Actions.VN_RECOVER
        const command = { name, ...Commands[name] }

        return { params, command }
      },
      invalidatesTags: (_, __, { id }) => [{ type: VNET, id }],
    }),
  }),
})

export const {
  // Queries
  useGetVNetworksQuery,
  useLazyGetVNetworksQuery,
  useGetVNetworkQuery,
  useLazyGetVNetworkQuery,

  // Mutations
  useAllocateVnetMutation,
  useRemoveVNetMutation,
  useAddRangeToVNetMutation,
  useRemoveRangeFromVNetMutation,
  useUpdateVNetRangeMutation,
  useReserveAddressMutation,
  useFreeReservedARMutation,
  useHoldLeaseMutation,
  useReleaseLeaseMutation,
  useUpdateVNetMutation,
  useChangeVNetPermissionsMutation,
  useChangeVNetOwnershipMutation,
  useRenameVNetMutation,
  useLockVNetMutation,
  useUnlockVNetMutation,
  useRecoverVNetMutation,
} = vNetworkApi

export default vNetworkApi
