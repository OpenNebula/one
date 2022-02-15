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
import { Actions, Commands } from 'server/utils/constants/commands/marketapp'
import {
  Actions as ExtraActions,
  Commands as ExtraCommands,
} from 'server/routes/api/marketapp/routes'

import {
  oneApi,
  ONE_RESOURCES,
  ONE_RESOURCES_POOL,
} from 'client/features/OneApi'
import { FilterFlag, Permission, MarketplaceApp } from 'client/constants'

const { APP } = ONE_RESOURCES
const { APP_POOL } = ONE_RESOURCES_POOL

const marketAppApi = oneApi.injectEndpoints({
  endpoints: (builder) => ({
    getMarketplaceApps: builder.query({
      /**
       * Retrieves information for all or part of the
       * marketplace apps in the pool.
       *
       * @param {object} params - Request params
       * @param {FilterFlag} [params.filter] - Filter flag
       * @param {number} [params.start] - Range start ID
       * @param {number} [params.end] - Range end ID
       * @returns {MarketplaceApp[]} List of marketplace apps
       * @throws Fails when response isn't code 200
       */
      query: (params) => {
        const name = Actions.MARKETAPP_POOL_INFO
        const command = { name, ...Commands[name] }

        return { params, command }
      },
      transformResponse: (data) =>
        [data?.MARKETPLACEAPP_POOL?.MARKETPLACEAPP ?? []].flat(),
      providesTags: (apps) =>
        apps
          ? [
              ...apps.map(({ ID }) => ({ type: APP_POOL, id: `${ID}` })),
              APP_POOL,
            ]
          : [APP_POOL],
    }),
    getMarketplaceApp: builder.query({
      /**
       * Retrieves information for the marketplace app.
       *
       * @param {string} id - Marketplace apps id
       * @returns {MarketplaceApp} Get marketplace app identified by id
       * @throws Fails when response isn't code 200
       */
      query: (id) => {
        const name = Actions.MARKETAPP_INFO
        const command = { name, ...Commands[name] }

        return { params: { id }, command }
      },
      transformResponse: (data) => data?.MARKETPLACEAPP ?? {},
      providesTags: (_, __, id) => [{ type: APP, id }],
    }),
    getDockerHubTags: builder.query({
      /**
       * Retrieves DockerHub tags information for marketplace app.
       *
       * @param {object} params - Request parameters
       * @param {string} params.id - App id
       * @param {string} [params.page] - Number of page
       * @returns {object[]} List of DockerHub tags
       * @throws Fails when response isn't code 200
       */
      query: (params) => {
        const name = ExtraActions.MARKETAPP_DOCKERTAGS
        const command = { name, ...ExtraCommands[name] }

        return { params, command }
      },
    }),
    allocateApp: builder.mutation({
      /**
       * Allocates a new marketplace app in OpenNebula.
       *
       * @param {object} params - Request params
       * @param {string} params.template - A string containing the template of the marketplace app on syntax XML
       * @param {string} params.id - The Marketplace ID
       * @returns {number} Marketplace app id
       * @throws Fails when response isn't code 200
       */
      query: (params) => {
        const name = Actions.MARKETAPP_ALLOCATE
        const command = { name, ...Commands[name] }

        return { params, command }
      },
      invalidatesTags: [APP_POOL],
    }),
    updateApp: builder.mutation({
      /**
       * Replaces the marketplace app template contents.
       *
       * @param {object} params - Request params
       * @param {string} params.id - Marketplace app id
       * @param {string} params.template - The new template contents
       * @param {0|1} params.replace
       * - Update type:
       * ``0``: Replace the whole template.
       * ``1``: Merge new template with the existing one.
       * @returns {number} Marketplace app id
       * @throws Fails when response isn't code 200
       */
      query: (params) => {
        const name = Actions.MARKETAPP_UPDATE
        const command = { name, ...Commands[name] }

        return { params, command }
      },
      invalidatesTags: (_, __, { id }) => [{ type: APP, id }],
    }),
    removeApp: builder.mutation({
      /**
       * Deletes the given marketplace app from the pool.
       *
       * @param {string} id - Marketplace app id
       * @returns {number} Marketplace app id
       * @throws Fails when response isn't code 200
       */
      query: (id) => {
        const name = Actions.MARKETAPP_DELETE
        const command = { name, ...Commands[name] }

        return { params: { id }, command }
      },
      invalidatesTags: (_, __, id) => [{ type: APP_POOL, id }, APP_POOL],
    }),
    enableApp: builder.mutation({
      /**
       * Enables a marketplace app.
       *
       * @param {string} id - Marketplace app id
       * @returns {number} Marketplace app id
       * @throws Fails when response isn't code 200
       */
      query: (id) => {
        const name = Actions.MARKETAPP_ENABLE
        const command = { name, ...Commands[name] }

        return { params: { id, enable: true }, command }
      },
      invalidatesTags: (_, __, id) => [{ type: APP, id }, APP_POOL],
    }),
    disableApp: builder.mutation({
      /**
       * Disables a marketplace app.
       *
       * @param {string} id - Marketplace app id
       * @returns {number} Marketplace app id
       * @throws Fails when response isn't code 200
       */
      query: (id) => {
        const name = Actions.MARKETAPP_ENABLE
        const command = { name, ...Commands[name] }

        return { params: { id, enable: false }, command }
      },
      invalidatesTags: (_, __, id) => [{ type: APP, id }, APP_POOL],
    }),
    changeAppPermissions: builder.mutation({
      /**
       * Changes the permission bits of a marketplace app.
       * If set any permission to -1, it's not changed.
       *
       * @param {object} params - Request parameters
       * @param {string} params.id - Marketplace app id
       * @param {Permission|'-1'} params.ownerUse - User use
       * @param {Permission|'-1'} params.ownerManage - User manage
       * @param {Permission|'-1'} params.ownerAdmin - User administrator
       * @param {Permission|'-1'} params.groupUse - Group use
       * @param {Permission|'-1'} params.groupManage - Group manage
       * @param {Permission|'-1'} params.groupAdmin - Group administrator
       * @param {Permission|'-1'} params.otherUse - Other use
       * @param {Permission|'-1'} params.otherManage - Other manage
       * @param {Permission|'-1'} params.otherAdmin - Other administrator
       * @returns {number} Marketplace app id
       * @throws Fails when response isn't code 200
       */
      query: (params) => {
        const name = Actions.MARKETAPP_CHMOD
        const command = { name, ...Commands[name] }

        return { params, command }
      },
      invalidatesTags: (_, __, { id }) => [{ type: APP, id }],
    }),
    changeAppOwnership: builder.mutation({
      /**
       * Changes the ownership of a marketplace app.
       * If set `user` or `group` to -1, it's not changed.
       *
       * @param {object} params - Request parameters
       * @param {string} params.id - Marketplace app id
       * @param {string|'-1'} [params.userId] - User id
       * @param {string|'-1'} [params.groupId] - Group id
       * @returns {number} Marketplace app id
       * @throws Fails when response isn't code 200
       */
      query: (params) => {
        const name = Actions.MARKETAPP_CHOWN
        const command = { name, ...Commands[name] }

        return { params, command }
      },
      invalidatesTags: (_, __, { id }) => [{ type: APP, id }, APP_POOL],
    }),
    renameApp: builder.mutation({
      /**
       * Renames a marketplace app.
       *
       * @param {object} params - Request parameters
       * @param {string} params.id - Marketplace app id
       * @param {string} params.name - The new name
       * @returns {number} Marketplace app id
       * @throws Fails when response isn't code 200
       */
      query: (params) => {
        const name = Actions.MARKETAPP_RENAME
        const command = { name, ...Commands[name] }

        return { params, command }
      },
      invalidatesTags: (_, __, { id }) => [{ type: APP, id }, APP_POOL],
    }),
    lockApp: builder.mutation({
      /**
       * Locks a MarketPlaceApp. Lock certain actions depending on blocking level.
       * - `USE` (1): locks Admin, Manage and Use actions.
       * - `MANAGE` (2): locks Manage and Use actions.
       * - `ADMIN` (3): locks only Admin actions.
       * - `ALL` (4): locks all actions.
       *
       * @param {object} params - Request parameters
       * @param {string} params.id - Marketplace app id
       * @param {'1'|'2'|'3'|'4'} params.lock - Lock level
       * @returns {number} Marketplace app id
       * @throws Fails when response isn't code 200
       */
      query: (params) => {
        const name = Actions.MARKETAPP_LOCK
        const command = { name, ...Commands[name] }

        return { params, command }
      },
      invalidatesTags: (_, __, { id }) => [{ type: APP, id }, APP_POOL],
    }),
    unlockApp: builder.mutation({
      /**
       * Unlocks a MarketPlaceApp.
       *
       * @param {string} id - Marketplace app id
       * @returns {number} Marketplace app id
       * @throws Fails when response isn't code 200
       */
      query: (id) => {
        const name = Actions.MARKETAPP_UNLOCK
        const command = { name, ...Commands[name] }

        return { params: { id }, command }
      },
      invalidatesTags: (_, __, id) => [{ type: APP, id }, APP_POOL],
    }),
    importApp: builder.mutation({
      /**
       * Imports a VM or VM Template into the marketplace.
       *
       * @param {object} params - Request parameters
       * @param {string} params.id - VM or VM Template id
       * @param {'vm'|'vm-template'} params.resource - Type of resource
       * @param {string} params.marketId - Market to import all objects
       * @param {boolean} params.associated - If `true`, don't import associated VM templates/images
       * @param {string} params.vmname - Selects the name for the new VM Template, if the App contains one
       * @returns {number} Marketplace app id
       * @throws Fails when response isn't code 200
       */
      queryFn: async (params) => {
        const name = ExtraActions.MARKETAPP_IMPORT
        const command = { name, ...ExtraCommands[name] }

        return { params, command }
      },
      invalidatesTags: [APP_POOL],
    }),
    exportApp: builder.mutation({
      /**
       * Exports the marketplace app to the OpenNebula cloud.
       *
       * @param {object} params - Request parameters
       * @param {string} params.id - Marketplace App id
       * @param {string} params.name - Image name
       * @param {string} params.datastore - Datastore id or name
       * @param {string} params.file - File datastore id or name
       * @param {string} params.tag - DockerHub image tag (default latest)
       * @param {boolean} params.template - Associate with VM template
       * @param {boolean} params.associated - If `false`, Do not export associated VM templates/images
       * @param {string} params.vmname - The name for the new VM Template, if the App contains one
       * @returns {number} Marketplace app id
       * @throws Fails when response isn't code 200
       */
      query: async (params) => {
        const name = ExtraActions.MARKETAPP_EXPORT
        const command = { name, ...ExtraCommands[name] }

        return { params, command }
      },
      invalidatesTags: [APP_POOL],
    }),
  }),
})

export const {
  // Queries
  useGetMarketplaceAppQuery,
  useLazyGetMarketplaceAppQuery,
  useGetMarketplaceAppsQuery,
  useLazyGetMarketplaceAppsQuery,
  useGetDockerHubTagsQuery,
  useLazyGetDockerHubTagsQuery,

  // Mutations
  useAllocateAppMutation,
  useUpdateAppMutation,
  useRemoveAppMutation,
  useEnableAppMutation,
  useDisableAppMutation,
  useChangeAppPermissionsMutation,
  useChangeAppOwnershipMutation,
  useRenameAppMutation,
  useLockAppMutation,
  useUnlockAppMutation,
  useImportAppMutation,
  useExportAppMutation,
} = marketAppApi

export default marketAppApi
