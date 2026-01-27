/* ------------------------------------------------------------------------- *
 * Copyright 2002-2025, OpenNebula Project, OpenNebula Systems               *
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
import { Actions, Commands } from 'server/routes/api/oneform/provider/routes'
import { oneApi } from '@modules/features/OneApi/oneApi'
import { FORM, FORM_POOL } from '@modules/features/OneApi/resources'
import {
  updateResourceOnPool,
  updateNameOnResource,
  updateOwnershipOnResource,
} from '@modules/features/OneApi/common'
import { Provider } from '@ConstantsModule'

const { PROVIDER } = FORM
const { PROVIDER_POOL } = FORM_POOL

const basicEndpoints = (builder) => ({
  getProviders: builder.query({
    /**
     * Retrieves information for all providers.
     *
     * @returns {Provider[]} List of providers
     * @throws Fails when response isn't code 200
     */
    query: () => {
      const name = Actions.LIST
      const command = { name, ...Commands[name] }

      return { command }
    },
    transformResponse: (data) =>
      data.map((provider) => provider.DOCUMENT ?? {}),
    providesTags: (providers) =>
      providers
        ? [
            ...providers.map(({ ID }) => ({
              type: PROVIDER_POOL,
              id: `${ID}`,
            })),
            PROVIDER_POOL,
          ]
        : [PROVIDER_POOL],
  }),

  getProvider: builder.query({
    /**
     * Retrieves information of a single provider.
     *
     * @param {object} params - Request params
     * @param {string} params.id - Provider name
     * @returns {Provider} Provider object
     * @throws Fails when response isn't code 200
     */
    query: (params) => {
      const name = Actions.SHOW
      const command = { name, ...Commands[name] }

      return { params, command }
    },
    transformResponse: (data) => data?.DOCUMENT ?? {},
    providesTags: (_, __, { id }) => [{ type: PROVIDER, id }],
  }),

  createProvider: builder.mutation({
    /**
     * Create a new provider.
     *
     * @param {object} params - Request params
     * @param {object} params.template - Provider template data in JSON syntax
     * @returns {number} Service template id
     * @throws Fails when response isn't code 200
     */
    query: (params) => {
      const name = Actions.CREATE
      const command = { name, ...Commands[name] }

      return { params, command }
    },
    invalidatesTags: [PROVIDER_POOL],
  }),
  updateProvider: builder.mutation({
    /**
     * Updates the provider contents.
     *
     * @param {object} params - Request params
     * @param {string} params.id - Provider id
     * @param {object} params.template - The new template contents
     * @param {boolean} [params.merge]
     * - ``true``: Merge new template with the existing one.
     * - ``false``: Replace the whole template.
     *
     * By default, ``true``.
     * @returns {number} Provider id
     * @throws Fails when response isn't code 200
     */
    query: (params) => {
      const name = Actions.UPDATE
      const command = { name, ...Commands[name] }

      return { params, command }
    },
    invalidatesTags: (_, __, { id }) => [{ type: PROVIDER, id }],
    async onQueryStarted(params, { dispatch, queryFulfilled }) {
      try {
        const patchProvider = dispatch(
          providerApi.util.updateQueryData(
            'getProvider',
            { id: params.id },
            updateNameOnResource(params)
          )
        )

        const patchProviders = dispatch(
          providerApi.util.updateQueryData(
            'getProviders',
            undefined,
            updateNameOnResource(params)
          )
        )

        queryFulfilled.catch(() => {
          patchProvider.undo()
          patchProviders.undo()
        })
      } catch {}
    },
  }),
  renameProvider: builder.mutation({
    /**
     * Renames a Provider.
     *
     * @param {object} params - Request parameters
     * @param {string|number} params.id - Provider id
     * @param {string} params.name - The new name
     * @returns {number} Provider id
     * @throws Fails when response isn't code 200
     */
    query: (params) => {
      const cName = Actions.UPDATE
      const command = { name: cName, ...Commands[cName] }

      return { params, command }
    },
    invalidatesTags: (_, __, { id }) => [{ type: PROVIDER, id }],
    async onQueryStarted(params, { dispatch, queryFulfilled }) {
      try {
        const patchProvider = dispatch(
          providerApi.util.updateQueryData(
            'getProvider',
            { id: params.id },
            updateNameOnResource(params)
          )
        )

        const patchProviders = dispatch(
          providerApi.util.updateQueryData(
            'getProviders',
            undefined,
            updateNameOnResource({ id: params.id, name: params.template.name })
          )
        )

        queryFulfilled.catch(() => {
          patchProvider.undo()
          patchProviders.undo()
        })
      } catch {}
    },
  }),
  removeProvider: builder.mutation({
    /**
     * Deletes a provider.
     *
     * @param {object} params - Request params
     * @param {string} params.id - Provider id
     * @returns {number} Provider id
     * @throws Fails when response isn't code 200
     */
    query: (params) => {
      const name = Actions.DELETE
      const command = { name, ...Commands[name] }

      return { params, command }
    },
    invalidatesTags: [PROVIDER_POOL],
  }),
  changeProviderPermissions: builder.mutation({
    /**
     * Changes the permission bits of a Provider.
     * If set to `-1`, it's not changed.
     *
     * @param {object} params - Request parameters
     * @param {string} params.id - Provider id
     * @param {string} params.octet - Permissions in octal format
     * @returns {number} Provider id
     * @throws Fails when response isn't code 200
     */
    query: ({ octet, ...params }) => {
      params.octet = octet
      const name = Actions.CHMOD
      const command = { name, ...Commands[name] }

      return { params, command }
    },
    invalidatesTags: (_, __, { id }) => [{ type: PROVIDER, id }],
    async onQueryStarted(params, { dispatch, queryFulfilled }) {
      try {
        const patchProvider = dispatch(
          providerApi.util.updateQueryData(
            'getProvider',
            { id: params.id },
            updateResourceOnPool(params)
          )
        )

        const patchProviders = dispatch(
          providerApi.util.updateQueryData(
            'getProviders',
            undefined,
            updateResourceOnPool(params)
          )
        )

        queryFulfilled.catch(() => {
          patchProvider.undo()
          patchProviders.undo()
        })
      } catch {}
    },
  }),
  changeProviderOwnership: builder.mutation({
    /**
     * Changes the ownership bits of a provider.
     * If set to `-1`, the user or group is not changed.
     *
     * @param {object} params - Request parameters
     * @param {string} params.id - Provider id
     * @param {number} params.user - New user id
     * @param {number} params.group - New group id
     * @returns {number} Provider id
     * @throws Fails when response isn't code 200
     */
    query: ({ user = '-1', group = '-1', ...params }) => {
      params.owner_id = user
      params.group_id = group

      const name = Actions.CHOWN
      const command = { name, ...Commands[name] }

      return { params, command }
    },
    invalidatesTags: (_, __, { id }) => [{ type: PROVIDER, id }],
    async onQueryStarted(params, { getState, dispatch, queryFulfilled }) {
      try {
        const patchProvider = dispatch(
          providerApi.util.updateQueryData(
            'getProvider',
            { id: params.id },
            updateOwnershipOnResource(getState(), params)
          )
        )

        const patchProviders = dispatch(
          providerApi.util.updateQueryData(
            'getProviders',
            undefined,
            updateOwnershipOnResource(getState(), params)
          )
        )

        queryFulfilled.catch(() => {
          patchProvider.undo()
          patchProviders.undo()
        })
      } catch {}
    },
  }),
})

const providerApi = oneApi.injectEndpoints({
  endpoints: (builder) => ({
    ...basicEndpoints(builder),
  }),
})

export const providerQueries = (({
  // Queries
  useGetProvidersQuery,
  useLazyGetProvidersQuery,
  useGetProviderQuery,
  useLazyGetProviderQuery,

  // Mutations
  useCreateProviderMutation,
  useUpdateProviderMutation,
  useRenameProviderMutation,
  useRemoveProviderMutation,
  useChangeProviderPermissionsMutation,
  useChangeProviderOwnershipMutation,
}) => ({
  // Queries
  useGetProvidersQuery,
  useLazyGetProvidersQuery,
  useGetProviderQuery,
  useLazyGetProviderQuery,

  // Mutations
  useCreateProviderMutation,
  useUpdateProviderMutation,
  useRenameProviderMutation,
  useRemoveProviderMutation,
  useChangeProviderPermissionsMutation,
  useChangeProviderOwnershipMutation,
}))(providerApi)

export default providerQueries
