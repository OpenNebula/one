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
import { Actions, Commands } from 'server/routes/api/oneflow/service/routes'

import { oneApi, DOCUMENT, DOCUMENT_POOL } from 'client/features/OneApi'
import {
  updateResourceOnPool,
  removeResourceOnPool,
  updateOwnershipOnResource,
} from 'client/features/OneApi/common'
import { Service } from 'client/constants'

const { SERVICE } = DOCUMENT
const { SERVICE_POOL } = DOCUMENT_POOL

const serviceApi = oneApi.injectEndpoints({
  endpoints: (builder) => ({
    getServices: builder.query({
      /**
       * Retrieves information for all the services in the pool.
       *
       * @returns {Service[]} List of services
       * @throws Fails when response isn't code 200
       */
      query: () => {
        const name = Actions.SERVICE_SHOW
        const command = { name, ...Commands[name] }

        return { command }
      },
      transformResponse: (data) => [data?.DOCUMENT_POOL?.DOCUMENT ?? []].flat(),
      providesTags: (services) =>
        services
          ? [
              ...services.map(({ ID }) => ({
                type: SERVICE_POOL,
                id: `${ID}`,
              })),
              SERVICE_POOL,
            ]
          : [SERVICE_POOL],
    }),
    getService: builder.query({
      /**
       * Retrieves information for the service.
       *
       * @param {object} params - Request params
       * @param {string} params.id - Service id
       * @returns {Service} Get service identified by id
       * @throws Fails when response isn't code 200
       */
      query: (params) => {
        const name = Actions.SERVICE_SHOW
        const command = { name, ...Commands[name] }

        return { params, command }
      },
      transformResponse: (data) => data?.DOCUMENT ?? {},
      providesTags: (_, __, { id }) => [{ type: SERVICE, id }],
      async onQueryStarted(id, { dispatch, queryFulfilled }) {
        try {
          const { data: resourceFromQuery } = await queryFulfilled

          dispatch(
            serviceApi.util.updateQueryData(
              'getServices',
              undefined,
              updateResourceOnPool({ id, resourceFromQuery })
            )
          )
        } catch {
          // if the query fails, we want to remove the resource from the pool
          dispatch(
            serviceApi.util.updateQueryData(
              'getServices',
              undefined,
              removeResourceOnPool({ id })
            )
          )
        }
      },
    }),
    removeService: builder.mutation({
      /**
       * Removes a service instance.
       *
       * @param {object} params - Request params
       * @param {string} params.id - Service id
       * @returns {Service} Remove service id
       * @throws Fails when response isn't code 200
       */
      query: (params) => {
        const name = Actions.SERVICE_DELETE
        const command = { name, ...Commands[name] }

        return { params, command }
      },
      invalidatesTags: [SERVICE_POOL],
    }),

    changeServiceOwner: builder.mutation({
      /**
       * Changes a service instance owner.
       *
       * @param {object} params - Request params
       * @param {string} params.id - Service id
       * @param {string} params.user - Service id
       * @param {string} params.group - Service id
       * @returns {Service} Updated service id
       * @throws Fails when response isn't code 200
       */
      query: ({ user = '-1', group = '-1', ...params }) => {
        params.action = {
          perform: 'chown',
          params: { owner_id: user, group_id: group },
        }
        const name = Actions.SERVICE_ADD_ACTION
        const command = { name, ...Commands[name] }

        return { params, command }
      },
      invalidatesTags: (_, __, { id }) => [{ type: SERVICE, id }],
      async onQueryStarted(params, { getState, dispatch, queryFulfilled }) {
        try {
          const patchServiceTemplate = dispatch(
            serviceApi.util.updateQueryData(
              'getService',
              { id: params.id },
              updateOwnershipOnResource(getState(), params)
            )
          )

          const patchServiceTemplates = dispatch(
            serviceApi.util.updateQueryData(
              'getServices',
              undefined,
              updateOwnershipOnResource(getState(), params)
            )
          )

          queryFulfilled.catch(() => {
            patchServiceTemplate.undo()
            patchServiceTemplates.undo()
          })
        } catch {}
      },
    }),
    recoverService: builder.mutation({
      /**
       * Tries to recover a failed service.
       *
       * @param {object} params - Request params
       * @param {string} params.id - Service id
       * @returns {Service} Recovered service id
       * @throws Fails when response isn't code 200
       */
      query: (params) => {
        params.action = {
          perform: 'recover',
          ...(params?.delete && { params: { delete: true } }),
        }
        const name = Actions.SERVICE_ADD_ACTION
        const command = { name, ...Commands[name] }

        return { params, command }
      },
      invalidatesTags: (_, __, id) => [{ type: SERVICE, id }, SERVICE_POOL],
    }),

    serviceAddRole: builder.mutation({
      /**
       * Tries to add a role to a service.
       *
       * @param {object} params - Request params
       * @param {string} params.id - Service id
       * @param {string} params.role - Role config
       * @returns {Service} Service id
       * @throws Fails when response isn't code 200
       */
      query: (params) => {
        params.action = {
          perform: 'add_role',
          ...(params?.role && { params: { role: params.role } }),
        }
        const name = Actions.SERVICE_ADD_ROLE
        const command = { name, ...Commands[name] }

        return { params, command }
      },
      invalidatesTags: (_, __, params) => [{ type: 'SERVICE', id: params.id }],
      async onQueryStarted(params, { getState, dispatch, queryFulfilled }) {
        try {
          const patchServiceTemplate = dispatch(
            serviceApi.util.updateQueryData(
              'getService',
              { id: params.id },
              updateOwnershipOnResource(getState(), params)
            )
          )

          const patchServiceTemplates = dispatch(
            serviceApi.util.updateQueryData(
              'getServices',
              undefined,
              updateOwnershipOnResource(getState(), params)
            )
          )

          queryFulfilled.catch(() => {
            patchServiceTemplate.undo()
            patchServiceTemplates.undo()
          })
        } catch {}
      },
    }),

    serviceScaleRole: builder.mutation({
      /**
       * Tries to scale a role.
       *
       * @param {object} params - Request params
       * @param {string} params.id - Service id
       * @param {string} params.role - Role config
       * @returns {Service} Service id
       * @throws Fails when response isn't code 200
       */
      query: (params) => {
        const name = Actions.SERVICE_ADD_SCALE
        const command = { name, ...Commands[name] }

        return { params, command }
      },
      invalidatesTags: (_, __, params) => [{ type: 'SERVICE', id: params.id }],
      async onQueryStarted(params, { getState, dispatch, queryFulfilled }) {
        try {
          const patchServiceTemplate = dispatch(
            serviceApi.util.updateQueryData(
              'getService',
              { id: params.id },
              updateOwnershipOnResource(getState(), params)
            )
          )

          const patchServiceTemplates = dispatch(
            serviceApi.util.updateQueryData(
              'getServices',
              undefined,
              updateOwnershipOnResource(getState(), params)
            )
          )

          queryFulfilled.catch(() => {
            patchServiceTemplate.undo()
            patchServiceTemplates.undo()
          })
        } catch {}
      },
    }),

    serviceRoleAction: builder.mutation({
      /**
       * Tries to perform a role action.
       *
       * @param {object} params - Request params
       * @param {string} params.id - Service id
       * @param {string} params.role - Role config
       * @returns {Service} Service id
       * @throws Fails when response isn't code 200
       */
      query: (params) => {
        params.action = {
          perform: params?.perform,
          params: {
            ...params.params,
            number: params?.number || '',
            period: params?.period || '',
          },
        }

        const name = Actions.SERVICE_ADD_ROLEACTION
        const command = { name, ...Commands[name] }

        return { params, command }
      },
      invalidatesTags: (_, __, params) => [{ type: 'SERVICE', id: params.id }],
      async onQueryStarted(params, { getState, dispatch, queryFulfilled }) {
        try {
          const patchServiceTemplate = dispatch(
            serviceApi.util.updateQueryData(
              'getService',
              { id: params.id },
              updateOwnershipOnResource(getState(), params)
            )
          )

          const patchServiceTemplates = dispatch(
            serviceApi.util.updateQueryData(
              'getServices',
              undefined,
              updateOwnershipOnResource(getState(), params)
            )
          )

          queryFulfilled.catch(() => {
            patchServiceTemplate.undo()
            patchServiceTemplates.undo()
          })
        } catch {}
      },
    }),

    serviceAddAction: builder.mutation({
      /**
       * Tries to perform a role action.
       *
       * @param {object} params - Request params
       * @param {string} params.id - Service id
       * @param {string} params.role - Role config
       * @returns {Service} Service id
       * @throws Fails when response isn't code 200
       */
      query: (params) => {
        params.action = {
          perform: params?.perform,
          params: {
            ...params.params,
          },
        }

        const name = Actions.SERVICE_ADD_ACTION
        const command = { name, ...Commands[name] }

        return { params, command }
      },
      invalidatesTags: (_, __, params) => [{ type: 'SERVICE', id: params.id }],
      async onQueryStarted(params, { getState, dispatch, queryFulfilled }) {
        try {
          const patchServiceTemplate = dispatch(
            serviceApi.util.updateQueryData(
              'getService',
              { id: params.id },
              updateOwnershipOnResource(getState(), params)
            )
          )

          const patchServiceTemplates = dispatch(
            serviceApi.util.updateQueryData(
              'getServices',
              undefined,
              updateOwnershipOnResource(getState(), params)
            )
          )

          queryFulfilled.catch(() => {
            patchServiceTemplate.undo()
            patchServiceTemplates.undo()
          })
        } catch {}
      },
    }),
  }),
})

export const {
  // Queries
  useGetServicesQuery,
  useLazyGetServicesQuery,
  useGetServiceQuery,
  useLazyGetServiceQuery,
  useRemoveServiceMutation,
  useChangeServiceOwnerMutation,
  useRecoverServiceMutation,
  useServiceAddRoleMutation,
  useServiceAddActionMutation,
  useServiceRoleActionMutation,
  useServiceScaleRoleMutation,
} = serviceApi

export default serviceApi
