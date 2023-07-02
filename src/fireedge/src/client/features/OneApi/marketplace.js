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
import { Actions, Commands } from 'server/utils/constants/commands/market'
import {
  oneApi,
  ONE_RESOURCES,
  ONE_RESOURCES_POOL,
} from 'client/features/OneApi'
import { Permission, Marketplace } from 'client/constants'

const { MARKETPLACE } = ONE_RESOURCES
const { MARKETPLACE_POOL } = ONE_RESOURCES_POOL

const marketplaceApi = oneApi.injectEndpoints({
  endpoints: (builder) => ({
    getMarketplaces: builder.query({
      /**
       * Retrieves information for all or part of the marketplaces in the pool.
       *
       * @returns {Marketplace[]} List of marketplaces
       * @throws Fails when response isn't code 200
       */
      query: () => {
        const name = Actions.MARKET_POOL_INFO
        const command = { name, ...Commands[name] }

        return { command }
      },
      transformResponse: (data) =>
        [data?.MARKETPLACE_POOL?.MARKETPLACE ?? []].flat(),
      providesTags: (marketplaces) =>
        marketplaces
          ? [
              ...marketplaces.map(({ ID }) => ({
                type: MARKETPLACE_POOL,
                id: `${ID}`,
              })),
              MARKETPLACE_POOL,
            ]
          : [MARKETPLACE_POOL],
    }),
    getMarketplace: builder.query({
      /**
       * Retrieves information for the marketplace.
       *
       * @param {object} params - Request params
       * @param {string} params.id - Marketplace id
       * @param {boolean} [params.decrypt] - Optional flag to decrypt contained secrets, valid only for admin
       * @returns {Marketplace} Get marketplace identified by id
       * @throws Fails when response isn't code 200
       */
      query: (params) => {
        const name = Actions.MARKET_INFO
        const command = { name, ...Commands[name] }

        return { params, command }
      },
      transformResponse: (data) => data?.MARKETPLACE ?? {},
      providesTags: (_, __, { id }) => [{ type: MARKETPLACE, id }],
    }),
    allocateMarketplace: builder.mutation({
      /**
       * Allocates a new marketplace in OpenNebula.
       *
       * @param {object} params - Request params
       * @param {string} params.template - A string containing the template of the marketplace on syntax XML
       * @returns {number} Marketplace id
       * @throws Fails when response isn't code 200
       */
      query: (params) => {
        const name = Actions.MARKET_ALLOCATE
        const command = { name, ...Commands[name] }

        return { params, command }
      },
      invalidatesTags: [MARKETPLACE_POOL],
    }),
    removeMarketplace: builder.mutation({
      /**
       * Deletes the given marketplace from the pool.
       *
       * @param {object} params - Request params
       * @param {string} params.id - Marketplace id
       * @returns {number} Marketplace id
       * @throws Fails when response isn't code 200
       */
      query: (params) => {
        const name = Actions.MARKET_DELETE
        const command = { name, ...Commands[name] }

        return { params, command }
      },
      invalidatesTags: [MARKETPLACE_POOL],
    }),
    updateMarketplace: builder.mutation({
      /**
       * Replaces the marketplace template contents.
       *
       * @param {object} params - Request params
       * @param {number|string} params.id - Marketplace id
       * @param {string} params.template - The new template contents
       * @param {0|1} params.replace
       * - Update type:
       * ``0``: Replace the whole template.
       * ``1``: Merge new template with the existing one.
       * @returns {number} Marketplace app id
       * @throws Fails when response isn't code 200
       */
      query: (params) => {
        const name = Actions.MARKET_UPDATE
        const command = { name, ...Commands[name] }

        return { params, command }
      },
      providesTags: (_, __, { id }) => [{ type: MARKETPLACE, id }],
    }),
    changeMarketplacePermissions: builder.mutation({
      /**
       * Changes the permission bits of a marketplace.
       * If set any permission to -1, it's not changed.
       *
       * @param {object} params - Request parameters
       * @param {string} params.id - Marketplace id
       * @param {Permission|'-1'} params.ownerUse - User use
       * @param {Permission|'-1'} params.ownerManage - User manage
       * @param {Permission|'-1'} params.ownerAdmin - User administrator
       * @param {Permission|'-1'} params.groupUse - Group use
       * @param {Permission|'-1'} params.groupManage - Group manage
       * @param {Permission|'-1'} params.groupAdmin - Group administrator
       * @param {Permission|'-1'} params.otherUse - Other use
       * @param {Permission|'-1'} params.otherManage - Other manage
       * @param {Permission|'-1'} params.otherAdmin - Other administrator
       * @returns {number} Marketplace id
       * @throws Fails when response isn't code 200
       */
      query: (params) => {
        const name = Actions.MARKET_CHMOD
        const command = { name, ...Commands[name] }

        return { params, command }
      },
      invalidatesTags: (_, __, { id }) => [{ type: MARKETPLACE, id }],
    }),
    changeMarketplaceOwnership: builder.mutation({
      /**
       * Changes the ownership of a marketplace.
       * If set `user` or `group` to -1, it's not changed.
       *
       * @param {object} params - Request parameters
       * @param {string} params.id - Marketplace id
       * @param {string|'-1'} [params.userId] - User id
       * @param {string|'-1'} [params.groupId] - Group id
       * @returns {number} Marketplace id
       * @throws Fails when response isn't code 200
       */
      query: (params) => {
        const name = Actions.MARKET_CHOWN
        const command = { name, ...Commands[name] }

        return { params, command }
      },
      invalidatesTags: (_, __, { id }) => [
        { type: MARKETPLACE, id },
        MARKETPLACE_POOL,
      ],
    }),
    renameMarketplace: builder.mutation({
      /**
       * Renames a marketplace.
       *
       * @param {object} params - Request parameters
       * @param {string} params.id - Marketplace id
       * @param {string} params.name - The new name
       * @returns {number} Marketplace id
       * @throws Fails when response isn't code 200
       */
      query: (params) => {
        const name = Actions.MARKET_RENAME
        const command = { name, ...Commands[name] }

        return { params, command }
      },
      invalidatesTags: (_, __, { id }) => [
        { type: MARKETPLACE, id },
        MARKETPLACE_POOL,
      ],
    }),
    enableMarketplace: builder.mutation({
      /**
       * Enables a marketplace.
       *
       * @param {object} params - Request params
       * @param {number} params.id - Marketplace id
       * @returns {number} Marketplace id
       * @throws Fails when response isn't code 200
       */
      query: ({ id }) => {
        const name = Actions.MARKET_ENABLE
        const command = { name, ...Commands[name] }

        return { params: { id, enable: true }, command }
      },
      invalidatesTags: (_, __, { id }) => [
        { type: MARKETPLACE, id },
        MARKETPLACE_POOL,
      ],
    }),
    disableMarketplace: builder.mutation({
      /**
       * Disables a marketplace.
       *
       * @param {object} params - Request params
       * @param {number} params.id - Marketplace id
       * @returns {number} Marketplace id
       * @throws Fails when response isn't code 200
       */
      query: ({ id }) => {
        const name = Actions.MARKET_ENABLE
        const command = { name, ...Commands[name] }

        return { params: { id, enable: false }, command }
      },
      invalidatesTags: (_, __, { id }) => [
        { type: MARKETPLACE, id },
        MARKETPLACE_POOL,
      ],
    }),
  }),
})

export const {
  // Queries
  useGetMarketplaceQuery,
  useLazyGetMarketplaceQuery,
  useGetMarketplacesQuery,
  useLazyGetMarketplacesQuery,

  // Mutations
  useAllocateMarketplaceMutation,
  useRemoveMarketplaceMutation,
  useUpdateMarketplaceMutation,
  useChangeMarketplacePermissionsMutation,
  useChangeMarketplaceOwnershipMutation,
  useRenameMarketplaceMutation,
  useEnableMarketplaceMutation,
  useDisableMarketplaceMutation,
} = marketplaceApi

export default marketplaceApi
