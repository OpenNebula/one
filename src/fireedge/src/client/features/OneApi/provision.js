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
} from 'server/routes/api/oneprovision/provision/routes'
import {
  oneApi,
  DOCUMENT,
  DOCUMENT_POOL,
  PROVISION_CONFIG,
  PROVISION_RESOURCES,
} from 'client/features/OneApi'

const { PROVISION } = DOCUMENT
const { PROVISION_POOL } = DOCUMENT_POOL
const { PROVISION_DEFAULTS } = PROVISION_CONFIG

const provisionApi = oneApi.injectEndpoints({
  endpoints: (builder) => ({
    getProvisions: builder.query({
      /**
       * List all available provisions.
       *
       * @returns {object[]} List of provision
       * @throws Fails when response isn't code 200
       */
      query: () => {
        const name = Actions.PROVISION_LIST
        const command = { name, ...Commands[name] }

        return { command }
      },
      transformResponse: (data) => [data?.DOCUMENT_POOL?.DOCUMENT ?? []].flat(),
      providesTags: (provisions) =>
        provisions
          ? [
              ...provisions.map(({ ID }) => ({
                type: PROVISION_POOL,
                id: `${ID}`,
              })),
              PROVISION_POOL,
            ]
          : [PROVISION_POOL],
    }),
    getProvision: builder.query({
      /**
       * Retrieves information for the provision.
       *
       * @param {string} id - Provision id
       * @returns {object} Get provision identified by id
       * @throws Fails when response isn't code 200
       */
      query: (id) => {
        const name = Actions.PROVISION_LIST
        const command = { name, ...Commands[name] }

        return { params: { id }, command }
      },
      transformResponse: (data) => data?.DOCUMENT ?? {},
      providesTags: (_, __, id) => [{ type: PROVISION, id }],
      async onQueryStarted(id, { dispatch, queryFulfilled }) {
        try {
          const { data: queryProvision } = await queryFulfilled

          dispatch(
            provisionApi.util.updateQueryData(
              'getProvisions',
              undefined,
              (draft) => {
                const index = draft.findIndex(({ ID }) => +ID === +id)
                index !== -1 && (draft[index] = queryProvision)
              }
            )
          )
        } catch {}
      },
    }),
    getProvisionTemplates: builder.query({
      /**
       * Retrieves information for all the provision templates.
       *
       * @returns {object[]} List of provision templates
       * @throws Fails when response isn't code 200
       */
      query: () => {
        const name = Actions.PROVISION_DEFAULTS
        const command = { name, ...Commands[name] }

        return { command }
      },
      providesTags: [PROVISION_DEFAULTS],
    }),
    getProvisionLog: builder.query({
      /**
       * Retrieves debug log for the provision.
       *
       * @param {string} id - Provision id
       * @returns {object} Debug log
       * @throws Fails when response isn't code 200
       */
      query: (id) => {
        const name = Actions.PROVISION_LOGS
        const command = { name, ...Commands[name] }

        return { params: { id }, command }
      },
    }),
    getProvisionResource: builder.query({
      /**
       * List all resources from a provision.
       *
       * @param {object} params - Request parameters
       * @param {
       * 'cluster'|'datastore'|'host'|'image'|
       * 'network'|'template'|'vntemplate'|'flowtemplate'
       * } params.resource - Resource name
       * @returns {object[]} List of resources
       * @throws Fails when response isn't code 200
       */
      query: (params) => {
        const name = Actions.PROVISION_GET_RESOURCE
        const command = { name, ...Commands[name] }

        return { params, command }
      },
      transformResponse: (data) => {
        // example: { HOST_POOL: { HOST: [1, 2] } } => [1, 2]
        const pool = Object.values(data)[0] ?? {}
        const resources = Object.values(pool)[0] ?? []

        return [resources].flat()
      },
      providesTags: (_, __, { id, resource }) => {
        const provisionResource = PROVISION_RESOURCES[resource.toUpperCase()]

        return [{ type: provisionResource, id }, provisionResource]
      },
    }),
    createProvision: builder.mutation({
      /**
       * Provision a new cluster.
       *
       * @param {object} params - Request parameters
       * @param {object} params.data - Provision configuration
       * @returns {object} Object of document created
       * @throws Fails when response isn't code 200
       */
      query: (params) => {
        const name = Actions.PROVISION_CREATE
        const command = { name, ...Commands[name] }

        return { params, command }
      },
      invalidatesTags: [PROVISION_POOL],
    }),
    configureProvision: builder.mutation({
      /**
       * Configure the provision hosts.
       *
       * @param {object} params - Request parameters
       * @param {string} params.id - Provision id
       * @param {boolean} params.force - Force configure to execute
       * @returns {object} Object of document updated
       * @throws Fails when response isn't code 200
       */
      query: (params) => {
        const name = Actions.PROVISION_CONFIGURE
        const command = { name, ...Commands[name] }

        return { params, command }
      },
      invalidatesTags: (_, __, { id }) => [
        { type: PROVISION, id },
        PROVISION_POOL,
      ],
    }),
    deleteProvision: builder.mutation({
      /**
       * Delete the provision and OpenNebula objects.
       *
       * @param {object} params - Request parameters
       * @param {object} params.id - Provision id
       * @param {boolean} params.force - Force configure to execute
       * @param {boolean} params.cleanup - Delete all vms and images first, then delete the resources
       * @returns {object} Object of document deleted
       * @throws Fails when response isn't code 200
       */
      query: (params) => {
        const name = Actions.PROVISION_DELETE
        const command = { name, ...Commands[name] }

        return { params, command }
      },
      invalidatesTags: [PROVISION_POOL],
    }),
    removeResource: builder.mutation({
      /**
       * Delete the datastore from the provision.
       *
       * @param {object} params - Request parameters
       * @param {string} params.provision - Provision id
       * @param {string} params.id - Resource id
       * @param {
       * 'cluster'|'datastore'|'host'|'image'|
       * 'network'|'template'|'vntemplate'|'flowtemplate'
       * } params.resource - Resource name
       * @returns {object} Object of document deleted
       * @throws Fails when response isn't code 200
       */
      query: (params) => {
        const name = Actions.PROVISION_DELETE_RESOURCE
        const command = { name, ...Commands[name] }

        return { params, command }
      },
      invalidatesTags: (_, __, { provision, resource }) => [
        { type: PROVISION, id: provision },
        PROVISION_RESOURCES[resource.toUpperCase()],
      ],
    }),
    configureHost: builder.mutation({
      /**
       * Run configuration on the host.
       *
       * @param {object} params - Request parameters
       * @param {string} params.provision - Provision id
       * @param {string} params.id - Host id
       * @returns {number} - Host id
       * @throws Fails when response isn't code 200
       */
      query: ({ provision: _, ...params }) => {
        const name = Actions.PROVISION_HOST_CONFIGURE
        const command = { name, ...Commands[name] }

        return { params, command }
      },
      invalidatesTags: (_, __, { provision }) => [
        { type: PROVISION, id: provision },
        PROVISION_RESOURCES.HOST,
      ],
    }),
    addHostToProvision: builder.mutation({
      /**
       * Provisions and configures a new host or amount of hosts.
       *
       * @param {object} params - Request parameters
       * @param {string} params.id - Provision id
       * @param {number} params.amount - Amount of hosts to add to the provision
       * @returns {string} - Provision id
       * @throws Fails when response isn't code 200
       */
      query: (params) => {
        const name = Actions.PROVISION_ADD_HOST
        const command = { name, ...Commands[name] }

        return { params, command }
      },
      invalidatesTags: (_, __, { id }) => [
        { type: PROVISION, id },
        PROVISION_RESOURCES.HOST,
      ],
    }),
    addIpToProvision: builder.mutation({
      /**
       * Adds more IPs to the provision.
       *
       * @param {object} params - Request parameters
       * @param {string} params.id - Provision id
       * @param {number} params.amount - Amount of IPs to add to the provision
       * @returns {string} - Provision id
       * @throws Fails when response isn't code 200
       */
      query: (params) => {
        const name = Actions.PROVISION_ADD_IP
        const command = { name, ...Commands[name] }

        return { params, command }
      },
      invalidatesTags: (_, __, { id }) => [
        { type: PROVISION, id },
        PROVISION_RESOURCES.HOST,
      ],
    }),
  }),
})

export const {
  // Queries
  useGetProvisionsQuery,
  useLazyGetProvisionsQuery,
  useGetProvisionQuery,
  useLazyGetProvisionQuery,
  useGetProvisionTemplatesQuery,
  useLazyGetProvisionTemplatesQuery,
  useGetProvisionLogQuery,
  useLazyGetProvisionLogQuery,
  useGetProvisionResourceQuery,
  useLazyGetProvisionResourceQuery,

  // Mutations
  useCreateProvisionMutation,
  useConfigureProvisionMutation,
  useDeleteProvisionMutation,
  useRemoveResourceMutation,
  useConfigureHostMutation,
  useAddHostToProvisionMutation,
  useAddIpToProvisionMutation,
} = provisionApi

export default provisionApi
