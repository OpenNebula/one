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
  Actions,
  Commands,
} from 'server/routes/api/oneprovision/provider/routes'
import {
  oneApi,
  DOCUMENT,
  DOCUMENT_POOL,
  PROVISION_CONFIG,
} from 'client/features/OneApi'

const { PROVIDER } = DOCUMENT
const { PROVIDER_POOL } = DOCUMENT_POOL
const { PROVIDER_CONFIG } = PROVISION_CONFIG

const providerApi = oneApi.injectEndpoints({
  endpoints: (builder) => ({
    getProviderConfig: builder.query({
      /**
       * Gets provider configuration.
       *
       * @returns {object} Configuration
       * @throws Fails when response isn't code 200
       */
      query: () => {
        const name = Actions.PROVIDER_CONFIG
        const command = { name, ...Commands[name] }

        return { command }
      },
      providesTags: [PROVIDER_CONFIG],
    }),
    getProviders: builder.query({
      /**
       * Retrieves information for all providers.
       *
       * @returns {object[]} List of providers
       * @throws Fails when response isn't code 200
       */
      query: () => {
        const name = Actions.PROVIDER_LIST
        const command = { name, ...Commands[name] }

        return { command }
      },
      transformResponse: (data) => [data?.DOCUMENT_POOL?.DOCUMENT ?? []].flat(),
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
       * Retrieves information for the provider.
       *
       * @param {string} id - Provider id
       * @returns {object} Get provider identified by id
       * @throws Fails when response isn't code 200
       */
      query: (id) => {
        const name = Actions.PROVIDER_LIST
        const command = { name, ...Commands[name] }

        return { params: { id }, command }
      },
      transformResponse: (data) => data?.DOCUMENT ?? {},
      providesTags: (_, __, id) => [{ type: PROVIDER, id }],
      async onQueryStarted(id, { dispatch, queryFulfilled }) {
        try {
          const { data: queryProvider } = await queryFulfilled

          dispatch(
            providerApi.util.updateQueryData(
              'getProviders',
              undefined,
              (draft) => {
                const index = draft.findIndex(({ ID }) => +ID === +id)
                index !== -1 && (draft[index] = queryProvider)
              }
            )
          )
        } catch {}
      },
    }),
    getProviderConnection: builder.query({
      /**
       * Retrieves connection information for the provider.
       *
       * @param {string} id - Provider id
       * @returns {object} Connection info from the provider identified by id
       * @throws Fails when response isn't code 200
       */
      query: (id) => {
        const name = Actions.PROVIDER_CONNECTION
        const command = { name, ...Commands[name] }

        return { params: { id }, command }
      },
      keepUnusedDataFor: 5,
    }),
    createProvider: builder.mutation({
      /**
       * Creates a new provider.
       *
       * @param {object} params - Request parameters
       * @param {object} params.data - Provider configuration
       * @returns {object} Object of document created
       * @throws Fails when response isn't code 200
       */
      query: (params) => {
        const name = Actions.PROVIDER_CREATE
        const command = { name, ...Commands[name] }

        return { params, command }
      },
      invalidatesTags: [PROVIDER_POOL],
    }),
    updateProvider: builder.mutation({
      /**
       * Updates the provider information.
       *
       * @param {object} params - Request parameters
       * @param {string} params.id - Provider id
       * @param {string} params.data - Updated data
       * @returns {object} Object of document updated
       * @throws Fails when response isn't code 200
       */
      query: (params) => {
        const name = Actions.PROVIDER_UPDATE
        const command = { name, ...Commands[name] }

        return { params, command }
      },
      invalidatesTags: (_, __, { id }) => [
        { type: PROVIDER, id },
        PROVIDER_POOL,
      ],
    }),
    deleteProvider: builder.mutation({
      /**
       * Deletes the provider.
       *
       * @param {object} params - Request parameters
       * @param {object} params.id - Provider id
       * @returns {object} Object of document deleted
       * @throws Fails when response isn't code 200
       */
      query: (params) => {
        const name = Actions.PROVIDER_DELETE
        const command = { name, ...Commands[name] }

        return { params, command }
      },
      invalidatesTags: [PROVIDER_POOL],
    }),
  }),
})

export const {
  // Queries
  useGetProviderConfigQuery,
  useLazyGetProviderConfigQuery,
  useGetProvidersQuery,
  useLazyGetProvidersQuery,
  useGetProviderQuery,
  useLazyGetProviderQuery,
  useGetProviderConnectionQuery,
  useLazyGetProviderConnectionQuery,

  // Mutations
  useCreateProviderMutation,
  useUpdateProviderMutation,
  useDeleteProviderMutation,
} = providerApi

export default providerApi
