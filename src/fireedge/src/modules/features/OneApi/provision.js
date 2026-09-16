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
import { Actions, Commands } from 'server/routes/api/oneform/provision/routes'

import { oneApi } from '@modules/features/OneApi/oneApi'
import { FORM, FORM_POOL } from '@modules/features/OneApi/resources'
const { PROVISION_POOL } = FORM_POOL
const { PROVISION } = FORM

const provisionApi = oneApi.injectEndpoints({
  endpoints: (builder) => ({
    getProvisions: builder.query({
      /**
       * Retrieves information for all the provisions.
       *
       * @param {object} params - Request params
       * @param {boolean} params.extended - Whether to retrieve extended information
       * @returns {object[]} List of provisions
       * @throws Fails when response isn't code 200
       */
      query: ({ extended = false, ...params }) => {
        const name = Actions.LIST
        const command = { name, ...Commands[name] }

        return {
          params: { ...params, ...(extended ? { extended } : {}) },
          command,
        }
      },
      transformResponse: (data) => {
        if (!Array.isArray(data)) return []

        return data.map((item) => item.DOCUMENT)
      },
    }),

    getProvision: builder.query({
      /**
       * Retrieves information for one the provisions.
       *
       * @param {object} params - Request params
       * @param {boolean} params.extended - Whether to retrieve extended information
       * @returns {object} show provisions
       * @throws Fails when response isn't code 200
       */
      query: ({ extended = false, ...params }) => {
        const name = Actions.SHOW
        const command = { name, ...Commands[name] }

        return {
          params: { ...params, ...(extended ? { extended } : {}) },
          command,
        }
      },
      transformResponse: (data) => {
        if (!data?.DOCUMENT) return {}

        return data.DOCUMENT
      },
      providesTags: [],
    }),

    getProvisionLogs: builder.query({
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

    addHostsProvision: builder.mutation({
      /**
       * Add hosts to a provision.
       *
       * @param {object} params - Request parameters
       * @param {string|number} params.id - Provision id
       * @param {number} [params.amount] - Number of cloud hosts to add
       * @param {string[]} [params.hosts] - On-premises hosts to add
       * @returns {number} Provision id
       * @throws Fails when response isn't code 200
       */
      query: (params) => {
        const name = Actions.ADD_HOSTS
        const command = { name, ...Commands[name] }

        return { params, command }
      },
    }),

    deleteHostsProvision: builder.mutation({
      /**
       * Delete hosts from a provision.
       *
       * @param {object} params - Request parameters
       * @param {string|number} params.id - Provision id
       * @param {string} params.ids - Comma-separated host IDs
       * @returns {number} Provision id
       * @throws Fails when response isn't code 200
       */
      query: (params) => {
        const name = Actions.DELETE_HOSTS
        const command = { name, ...Commands[name] }

        return { params, command }
      },
    }),

    addPublicIpsProvision: builder.mutation({
      /**
       * Add IPs to a provision.
       *
       * @param {object} params - Request parameters
       * @param {string|number} params.id - provision id
       * @param {string|number} params.amount - Number of IPs to add
       * @returns {number} provision id
       * @throws Fails when response isn't code 200
       */
      query: (params) => {
        const name = Actions.ADD_PUBLIC_IPS
        const command = { name, ...Commands[name] }

        return { params, command }
      },
    }),

    deletePublicIpProvision: builder.mutation({
      /**
       * Delete a public IP from a provision.
       *
       * @param {object} params - Request parameters
       * @param {string|number} params.id - provision id
       * @param {string|number} params.ar_id - Address range to delete
       * @returns {number} provision id
       * @throws Fails when response isn't code 200
       */
      query: (params) => {
        const name = Actions.DELETE_PUBLIC_IP
        const command = { name, ...Commands[name] }

        return { params, command }
      },
    }),

    createProvision: builder.mutation({
      /**
       * Create a new provision.
       *
       * @param {object} params - Request params
       * @param {object} params.template - Provision template data in JSON syntax
       * @returns {number} provision id
       * @throws Fails when response isn't code 200
       */
      query: (params) => {
        const name = Actions.CREATE
        const command = { name, ...Commands[name] }

        return { params, command }
      },
      invalidatesTags: [PROVISION_POOL],
    }),
    recoverProvision: builder.mutation({
      /**
       * Recover a provision.
       *
       * @param {object} params - Request parameters
       * @param {string|number} params.id - provision id
       * @returns {string} OK
       * @throws Fails when response isn't code 200
       */
      query: (params) => {
        const name = Actions.RECOVER
        const command = { name, ...Commands[name] }

        return { params, command }
      },
      invalidatesTags: (result, error, { id }) => [
        { type: PROVISION, id },
        { type: PROVISION_POOL },
      ],
    }),
    deleteProvision: builder.mutation({
      /**
       * Delete a provision.
       *
       * @param {object} params - Request parameters
       * @param {string|number} params.id - provision id
       * @param {boolean} [params.force] - Force deletion
       * @returns {number} provision id
       * @throws Fails when response isn't code 200
       */
      query: (params) => {
        const name = Actions.DELETE
        const command = { name, ...Commands[name] }

        return { params, command }
      },
      invalidatesTags: (result, error, { id }) => [
        { type: PROVISION, id },
        { type: PROVISION_POOL },
      ],
    }),
  }),
})

export const provisionQueries = (({
  // Queries
  useGetProvisionQuery,
  useGetProvisionLogsQuery,
  useGetProvisionsQuery,
  useLazyGetProvisionsQuery,

  // Mutations
  useCreateProvisionMutation,
  useAddHostsProvisionMutation,
  useDeleteHostsProvisionMutation,
  useRecoverProvisionMutation,
  useDeleteProvisionMutation,
  useAddPublicIpsProvisionMutation,
  useDeletePublicIpProvisionMutation,
}) => ({
  // Queries
  useGetProvisionQuery,
  useGetProvisionLogsQuery,
  useGetProvisionsQuery,
  useLazyGetProvisionsQuery,

  // Mutations
  useCreateProvisionMutation,
  useAddHostsProvisionMutation,
  useDeleteHostsProvisionMutation,
  useRecoverProvisionMutation,
  useDeleteProvisionMutation,
  useAddPublicIpsProvisionMutation,
  useDeletePublicIpProvisionMutation,
}))(provisionApi)

export { provisionApi as provisionEndpoints }
export default provisionQueries
